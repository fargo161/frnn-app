import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const read = relative => fs.readFile(new URL(relative, import.meta.url), 'utf8');
const integrationUrl = process.env.TEST_DATABASE_URL || '';

async function availablePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  await new Promise(resolve => server.close(resolve));
  return port;
}

function urlForSchema(connectionString, schemaName) {
  const url = new URL(connectionString);
  url.searchParams.set('options', `-c search_path=${schemaName}`);
  return url.toString();
}

async function waitForHealth(baseUrl, child, output) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`test server exited before readiness (${child.exitCode})\n${output()}`);
    }
    try {
      const response = await fetch(`${baseUrl}/healthz`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`test server did not become ready\n${output()}`);
}

async function stopChild(child) {
  if (child.exitCode !== null) return;
  child.kill();
  await Promise.race([
    new Promise(resolve => child.once('exit', resolve)),
    new Promise(resolve => setTimeout(resolve, 3000))
  ]);
}

async function scan(baseUrl, station, code) {
  const response = await fetch(`${baseUrl}/api/scan/${station}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessCode: code })
  });
  return { status: response.status, body: await response.json() };
}

test('Escape resolver call is after identity establishment and before visit mutation', async () => {
  const [server, stationUi, quickStart, qrRouting] = await Promise.all([
    read('../server.js'),
    read('../public/station.html'),
    read('../quick-start.js'),
    read('../qr-routing.js')
  ]);
  const start = server.indexOf("app.post('/api/scan/:station'");
  const end = server.indexOf("app.post('/api/response/:station'", start);
  const route = server.slice(start, end);
  const identityIndex = route.indexOf('ensurePlayerIdentity(client, code)');
  const escapeIndex = route.indexOf("if (station === 'escape')");
  const resolverIndex = route.indexOf('resolveNodeAssignment', escapeIndex);
  const visitIndex = route.indexOf("SELECT station, stage, created_at FROM visits");
  const visitInsertIndex = route.indexOf('INSERT INTO visits');

  assert.ok(identityIndex > 0);
  assert.ok(escapeIndex > identityIndex);
  assert.ok(resolverIndex > escapeIndex);
  assert.ok(visitIndex > resolverIndex);
  assert.ok(visitInsertIndex > visitIndex);
  assert.match(route, /if \(resolution\.source === 'assignment'\) \{[\s\S]*mode: 'assignment'[\s\S]*nodeKey: resolution\.nodeKey[\s\S]*assignedMessage: resolution\.assignedMessage/);
  assert.doesNotMatch(route, /\.\.\.resolution/);
  assert.equal((route.match(/resolveNodeAssignment/g) || []).length, 1);
  assert.match(route, /authoredDefault: escapeConfig\.stations\.escape\?\.subtitle/);
  assert.match(stationUi, /renderStation\(data,false\)/);
  assert.doesNotMatch(stationUi, /mode==='assignment'|mode === 'assignment'/);
  assert.doesNotMatch(quickStart, /resolveNodeAssignment|node_assignments/);
  assert.doesNotMatch(qrRouting, /resolveNodeAssignment|node_assignments/);
});

test('real Escape endpoint branches by assignment before visit mutation and leaves other Functions unchanged', {
  skip: integrationUrl ? false : 'set TEST_DATABASE_URL to run disposable Escape route integration'
}, async () => {
  const { Pool } = pg;
  const adminPool = new Pool({ connectionString: integrationUrl });
  const schemaName = `frnn_escape_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const admin = await adminPool.connect();
  let child;
  let isolatedPool;
  let stderr = '';
  let stdout = '';

  try {
    await admin.query(`CREATE SCHEMA ${schemaName}`);
    const isolatedUrl = urlForSchema(integrationUrl, schemaName);
    const port = await availablePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, [fileURLToPath(new URL('../server.js', import.meta.url))], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      env: {
        ...process.env,
        DATABASE_URL: isolatedUrl,
        PORT: String(port),
        NODE_ENV: 'test',
        ADMIN_KEY: 'escape-integration-test-only'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    await waitForHealth(baseUrl, child, () => `${stdout}\n${stderr}`);

    isolatedPool = new Pool({ connectionString: isolatedUrl });
    const client = await isolatedPool.connect();
    try {
      await client.query(`INSERT INTO access_codes(code,status,activated_at,claimed_at)
        VALUES
          ('AAA111','active',NOW(),NOW()),
          ('BBB222','active',NOW(),NOW()),
          ('CCC333','active',NOW(),NOW()),
          ('DDD444','active',NOW(),NOW())`);
      await client.query(`INSERT INTO players(code) VALUES
        ('AAA111'),('BBB222'),('CCC333'),('DDD444')`);
      await client.query(`INSERT INTO node_assignments(code,node_key,assigned_message,is_active)
        VALUES
          ('AAA111','escape','Message A',TRUE),
          ('CCC333','escape','Inactive Message',FALSE),
          ('DDD444','attention','Ignored Attention',TRUE),
          ('DDD444','access','Ignored Access',TRUE),
          ('DDD444','sensory','Ignored Sensory',TRUE)`);
      await client.query("INSERT INTO player_profiles(code,display_name) VALUES('AAA111','PLAYER A')");

      const stateBefore = await client.query(`
        SELECT
          (SELECT COUNT(*)::int FROM node_assignments) AS assignments,
          (SELECT COUNT(*)::int FROM visits) AS visits,
          (SELECT COUNT(*)::int FROM video_answers) AS answers,
          (SELECT COUNT(*)::int FROM player_profiles) AS profiles,
          (SELECT COUNT(*)::int FROM final_reflections) AS finals,
          (SELECT updated_at FROM players WHERE code='AAA111') AS player_updated_at,
          (SELECT is_active FROM node_assignments WHERE code='AAA111' AND node_key='escape') AS assignment_active,
          (SELECT updated_at FROM node_assignments WHERE code='AAA111' AND node_key='escape') AS assignment_updated_at
      `);

      const assigned = await scan(baseUrl, 'escape', 'AAA111');
      assert.equal(assigned.status, 200);
      assert.deepEqual(assigned.body, {
        mode: 'assignment', nodeKey: 'escape', assignedMessage: 'Message A'
      });

      const stateAfter = await client.query(`
        SELECT
          (SELECT COUNT(*)::int FROM node_assignments) AS assignments,
          (SELECT COUNT(*)::int FROM visits) AS visits,
          (SELECT COUNT(*)::int FROM video_answers) AS answers,
          (SELECT COUNT(*)::int FROM player_profiles) AS profiles,
          (SELECT COUNT(*)::int FROM final_reflections) AS finals,
          (SELECT updated_at FROM players WHERE code='AAA111') AS player_updated_at,
          (SELECT is_active FROM node_assignments WHERE code='AAA111' AND node_key='escape') AS assignment_active,
          (SELECT updated_at FROM node_assignments WHERE code='AAA111' AND node_key='escape') AS assignment_updated_at
      `);
      assert.deepEqual(stateAfter.rows[0], stateBefore.rows[0]);

      const unassigned = await scan(baseUrl, 'escape', 'BBB222');
      assert.equal(unassigned.status, 200);
      assert.equal(unassigned.body.station, 'escape');
      assert.equal(unassigned.body.stage, 1);
      assert.equal(unassigned.body.duplicate, false);
      assert.equal(unassigned.body.stationMeta.function, 'Escape');
      assert.ok(unassigned.body.player);
      const unassignedRepeat = await scan(baseUrl, 'escape', 'BBB222');
      assert.equal(unassignedRepeat.body.duplicate, true);
      assert.equal(unassignedRepeat.body.stage, 1);
      const playerBVisits = await client.query("SELECT station,stage FROM visits WHERE code='BBB222'");
      assert.deepEqual(playerBVisits.rows, [{ station: 'escape', stage: 1 }]);

      const inactiveBefore = await client.query("SELECT is_active,updated_at FROM node_assignments WHERE code='CCC333' AND node_key='escape'");
      const inactive = await scan(baseUrl, 'escape', 'CCC333');
      assert.equal(inactive.status, 200);
      assert.equal(inactive.body.station, 'escape');
      assert.equal(inactive.body.duplicate, false);
      const inactiveVisits = await client.query("SELECT station,stage FROM visits WHERE code='CCC333'");
      assert.deepEqual(inactiveVisits.rows, [{ station: 'escape', stage: 1 }]);
      const inactiveAfter = await client.query("SELECT is_active,updated_at FROM node_assignments WHERE code='CCC333' AND node_key='escape'");
      assert.deepEqual(inactiveAfter.rows, inactiveBefore.rows);

      for (const [index, station] of ['attention', 'access', 'sensory'].entries()) {
        const result = await scan(baseUrl, station, 'DDD444');
        assert.equal(result.status, 200);
        assert.equal(result.body.station, station);
        assert.equal(result.body.stage, index + 1);
        assert.equal(result.body.duplicate, false);
        assert.equal(result.body.mode, undefined);
      }
      const otherVisits = await client.query("SELECT station,stage FROM visits WHERE code='DDD444' ORDER BY stage");
      assert.deepEqual(otherVisits.rows, [
        { station: 'attention', stage: 1 },
        { station: 'access', stage: 2 },
        { station: 'sensory', stage: 3 }
      ]);
      const otherAssignments = await client.query("SELECT node_key,assigned_message,is_active FROM node_assignments WHERE code='DDD444' ORDER BY node_key");
      assert.deepEqual(otherAssignments.rows, [
        { node_key: 'access', assigned_message: 'Ignored Access', is_active: true },
        { node_key: 'attention', assigned_message: 'Ignored Attention', is_active: true },
        { node_key: 'sensory', assigned_message: 'Ignored Sensory', is_active: true }
      ]);
    } finally {
      client.release();
    }
  } finally {
    await stopChild(child);
    if (isolatedPool) await isolatedPool.end();
    await admin.query('SET search_path TO public');
    await admin.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    admin.release();
    await adminPool.end();
  }
});
