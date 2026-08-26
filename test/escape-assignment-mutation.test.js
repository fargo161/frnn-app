import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { normalizeAssignedMessage } from '../node-assignments.js';
import {
  createOwnedTestSchema,
  disposableDatabaseChildEnvironment,
  dropOwnedTestSchema,
  optionalDisposableTestDatabaseUrl,
  scopedDisposableTestDatabaseUrl
} from '../test-support/disposable-postgres.js';

const read = relative => fs.readFile(new URL(relative, import.meta.url), 'utf8');
const integrationUrl = optionalDisposableTestDatabaseUrl();
const adminKey = 'escape-mutation-test-only';

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
  if (!child || child.exitCode !== null) return;
  child.kill();
  await Promise.race([
    new Promise(resolve => child.once('exit', resolve)),
    new Promise(resolve => setTimeout(resolve, 3000))
  ]);
}

async function request(baseUrl, method, code, { body, authorized = true } = {}) {
  const headers = {};
  if (authorized) headers.Authorization = `Bearer ${adminKey}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${baseUrl}/api/admin/player/${encodeURIComponent(code)}/escape-assignment`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: response.status, body: await response.json() };
}

async function scan(baseUrl, station, code) {
  const response = await fetch(`${baseUrl}/api/scan/${station}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessCode: code })
  });
  return { status: response.status, body: await response.json() };
}

async function playerState(client, code) {
  const statements = [
    'SELECT code,status,allocated_at,activated_at,claimed_at,is_test FROM access_codes WHERE code=$1',
    'SELECT code,created_at,updated_at FROM players WHERE code=$1',
    'SELECT station,stage,created_at FROM visits WHERE code=$1 ORDER BY stage',
    'SELECT station,accepted_answer,selected_choice,completed_at FROM video_answers WHERE code=$1 ORDER BY station',
    'SELECT display_name,contact_info,notes,created_at,updated_at FROM player_profiles WHERE code=$1',
    'SELECT display_name,contact_info,notes,operator,reason,created_at FROM player_profile_versions WHERE code=$1 ORDER BY id',
    'SELECT submitted_answer,completed_at FROM final_reflections WHERE code=$1',
    'SELECT token_hash,code,created_at,updated_at FROM quick_start_claims WHERE code=$1 ORDER BY token_hash'
  ];
  const rows = [];
  for (const statement of statements) rows.push((await client.query(statement, [code])).rows);
  return rows;
}

test('assigned-message validation and route source remain Escape-only and non-creating', async () => {
  assert.equal(normalizeAssignedMessage('  Message A  '), 'Message A');
  assert.equal(normalizeAssignedMessage('x'.repeat(1000)), 'x'.repeat(1000));
  for (const invalid of [undefined, null, 42, {}, [], '', '   ', ` ${'x'.repeat(1001)} `]) {
    assert.equal(normalizeAssignedMessage(invalid), null);
  }

  const [server, assignments, admin] = await Promise.all([
    read('../server.js'),
    read('../node-assignments.js'),
    read('../public/admin.html')
  ]);
  const setStart = server.indexOf("app.put('/api/admin/player/:accessCode/escape-assignment'");
  const clearStart = server.indexOf("app.delete('/api/admin/player/:accessCode/escape-assignment'");
  const end = server.indexOf("app.post('/api/admin/player/:accessCode/reset'", clearStart);
  assert.ok(setStart > 0 && clearStart > setStart && end > clearStart);
  const setRoute = server.slice(setStart, clearStart);
  const clearRoute = server.slice(clearStart, end);

  assert.match(setRoute, /requireAdmin/);
  assert.match(clearRoute, /requireAdmin/);
  assert.match(setRoute, /SELECT code FROM players WHERE code=\$1 FOR UPDATE/);
  assert.match(clearRoute, /SELECT code FROM players WHERE code=\$1 FOR UPDATE/);
  assert.doesNotMatch(`${setRoute}\n${clearRoute}`, /ensurePlayerIdentity|lockAccessCode/);
  assert.match(setRoute, /VALUES\(\$1,'escape','assigned_message',\$2,TRUE\)/);
  assert.match(setRoute, /ON CONFLICT \(code,node_key\) DO UPDATE/);
  assert.match(setRoute, /updated_at=NOW\(\)/);
  assert.match(setRoute, /ESCAPE_ASSIGNMENT_SET/);
  assert.match(clearRoute, /node_key='escape'/);
  assert.match(clearRoute, /assignment_type='assigned_message'/);
  assert.match(clearRoute, /is_active=TRUE/);
  assert.match(clearRoute, /SET is_active=FALSE,updated_at=NOW\(\)/);
  assert.match(clearRoute, /ESCAPE_ASSIGNMENT_CLEARED/);
  assert.doesNotMatch(clearRoute, /DELETE FROM node_assignments/);
  assert.match(assignments, /message\.length >= 1 && message\.length <= 1000/);
  assert.doesNotMatch(admin, /escape-assignment|ESCAPE_ASSIGNMENT_(?:SET|CLEARED)/);
});

test('authenticated SET, CLEAR, and re-SET cause bounded real Escape behavior', {
  skip: integrationUrl ? false : 'set TEST_DATABASE_URL to run disposable Escape assignment mutation integration'
}, async () => {
  const { Pool } = pg;
  const adminPool = new Pool({ connectionString: integrationUrl });
  let schemaName;
  const admin = await adminPool.connect();
  let child;
  let isolatedPool;
  let stderr = '';
  let stdout = '';

  try {
    schemaName = await createOwnedTestSchema(admin, integrationUrl, 'frnn_escape_mutation');
    const isolatedUrl = scopedDisposableTestDatabaseUrl(integrationUrl, schemaName, { includePublic: false });
    const port = await availablePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, [fileURLToPath(new URL('../server.js', import.meta.url))], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      env: disposableDatabaseChildEnvironment(isolatedUrl, {
        PORT: String(port),
        ADMIN_KEY: adminKey
      }, { ...process.env, DATABASE_URL: 'postgres://owner.invalid:5432/owner_persistent' }),
      stdio: ['ignore', 'pipe', 'pipe']
    });
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    await waitForHealth(baseUrl, child, () => `${stdout}\n${stderr}`);

    isolatedPool = new Pool({ connectionString: isolatedUrl });
    const client = await isolatedPool.connect();
    try {
      await client.query(`INSERT INTO access_codes(code,status,allocated_at,activated_at,claimed_at,is_test)
        VALUES
          ('AAA111','active',NOW()-INTERVAL '4 days',NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days',FALSE),
          ('BBB222','active',NOW()-INTERVAL '4 days',NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days',FALSE),
          ('CCC333','active',NOW()-INTERVAL '4 days',NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days',FALSE),
          ('DDD444','unused',NULL,NULL,NULL,FALSE),
          ('EEE555','active',NOW()-INTERVAL '4 days',NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days',FALSE)`);
      await client.query("INSERT INTO players(code) VALUES('AAA111'),('BBB222'),('CCC333'),('EEE555')");
      await client.query(`INSERT INTO node_assignments(code,node_key,assigned_message,is_active)
        VALUES
          ('AAA111','attention','A Attention',TRUE),
          ('AAA111','access','A Access',TRUE),
          ('AAA111','sensory','A Sensory',TRUE),
          ('BBB222','escape','Player B Message',TRUE),
          ('BBB222','attention','B Attention',TRUE),
          ('BBB222','access','B Access',TRUE),
          ('BBB222','sensory','B Sensory',TRUE)`);
      await client.query("INSERT INTO visits(code,station,stage) VALUES('AAA111','attention',1)");
      await client.query("INSERT INTO video_answers(code,station,accepted_answer,selected_choice) VALUES('AAA111','attention','Accepted','Choice A')");
      await client.query("INSERT INTO player_profiles(code,display_name,contact_info,notes) VALUES('AAA111','PLAYER A','a@example.test','Keep')");
      await client.query("INSERT INTO player_profile_versions(code,display_name,contact_info,notes,operator,reason) VALUES('AAA111','OLDER A','old@example.test','Older','TEST','UPDATE')");
      await client.query("INSERT INTO final_reflections(code,submitted_answer) VALUES('AAA111','Reflection')");
      await client.query("INSERT INTO quick_start_claims(token_hash,code) VALUES('token-a','AAA111')");

      const unauthorizedSet = await request(baseUrl, 'PUT', 'AAA111', {
        authorized: false,
        body: { assignedMessage: 'Denied' }
      });
      const unauthorizedClear = await request(baseUrl, 'DELETE', 'AAA111', { authorized: false });
      assert.deepEqual(unauthorizedSet, { status: 401, body: { error: 'MISSION_CONTROL_ACCESS_REQUIRED' } });
      assert.deepEqual(unauthorizedClear, { status: 401, body: { error: 'MISSION_CONTROL_ACCESS_REQUIRED' } });
      assert.equal((await client.query("SELECT COUNT(*)::int AS count FROM node_assignments WHERE code='AAA111' AND node_key='escape'")).rows[0].count, 0);
      assert.equal((await client.query("SELECT COUNT(*)::int AS count FROM mission_control_audit WHERE code='AAA111' AND action LIKE 'ESCAPE_ASSIGNMENT_%'")).rows[0].count, 0);

      for (const body of [
        {},
        { assignedMessage: null },
        { assignedMessage: 42 },
        { assignedMessage: {} },
        { assignedMessage: [] },
        { assignedMessage: '' },
        { assignedMessage: '   ' },
        { assignedMessage: 'x'.repeat(1001) }
      ]) {
        const invalid = await request(baseUrl, 'PUT', 'AAA111', { body });
        assert.deepEqual(invalid, { status: 400, body: { error: 'INVALID_ASSIGNMENT_MESSAGE' } });
      }
      assert.equal((await client.query("SELECT COUNT(*)::int AS count FROM node_assignments WHERE code='AAA111' AND node_key='escape'")).rows[0].count, 0);
      assert.equal((await client.query("SELECT COUNT(*)::int AS count FROM mission_control_audit WHERE code='AAA111' AND action='ESCAPE_ASSIGNMENT_SET'")).rows[0].count, 0);

      const unknownSet = await request(baseUrl, 'PUT', 'DDD444', { body: { assignedMessage: 'No player' } });
      const unknownClear = await request(baseUrl, 'DELETE', 'DDD444');
      const invalidCode = await request(baseUrl, 'DELETE', 'bad');
      assert.deepEqual(unknownSet, { status: 404, body: { error: 'PLAYER_NOT_FOUND' } });
      assert.deepEqual(unknownClear, { status: 404, body: { error: 'PLAYER_NOT_FOUND' } });
      assert.deepEqual(invalidCode, { status: 404, body: { error: 'PLAYER_NOT_FOUND' } });
      assert.equal((await client.query("SELECT COUNT(*)::int AS count FROM players WHERE code='DDD444'")).rows[0].count, 0);
      assert.deepEqual((await client.query("SELECT status,allocated_at,activated_at,claimed_at,is_test FROM access_codes WHERE code='DDD444'")).rows[0], {
        status: 'unused', allocated_at: null, activated_at: null, claimed_at: null, is_test: false
      });
      assert.equal((await client.query("SELECT COUNT(*)::int AS count FROM mission_control_audit WHERE code='DDD444'")).rows[0].count, 0);

      const boundary = 'x'.repeat(1000);
      const boundarySet = await request(baseUrl, 'PUT', 'CCC333', { body: { assignedMessage: boundary } });
      assert.equal(boundarySet.status, 200);
      assert.equal(boundarySet.body.assignedMessage.length, 1000);
      const boundaryClear = await request(baseUrl, 'DELETE', 'CCC333');
      assert.equal(boundaryClear.status, 200);
      const inactiveTimestamp = (await client.query("SELECT updated_at FROM node_assignments WHERE code='CCC333' AND node_key='escape'")).rows[0].updated_at;
      const boundaryClearAgain = await request(baseUrl, 'DELETE', 'CCC333');
      assert.deepEqual(boundaryClearAgain, {
        status: 200,
        body: { accessCode: 'CCC-333', nodeKey: 'escape', active: false }
      });
      assert.equal((await client.query("SELECT updated_at FROM node_assignments WHERE code='CCC333' AND node_key='escape'")).rows[0].updated_at.getTime(), inactiveTimestamp.getTime());
      const absentClear = await request(baseUrl, 'DELETE', 'EEE555');
      assert.deepEqual(absentClear, {
        status: 200,
        body: { accessCode: 'EEE-555', nodeKey: 'escape', active: false }
      });
      assert.equal((await client.query("SELECT COUNT(*)::int AS count FROM node_assignments WHERE code='EEE555'")).rows[0].count, 0);
      const noOpAudits = await client.query(`SELECT code,(detail->>'changed')::boolean AS changed
        FROM mission_control_audit
        WHERE action='ESCAPE_ASSIGNMENT_CLEARED' AND code IN ('CCC333','EEE555')
        ORDER BY id`);
      assert.deepEqual(noOpAudits.rows.slice(-2), [
        { code: 'CCC333', changed: false },
        { code: 'EEE555', changed: false }
      ]);

      const preservedBefore = await playerState(client, 'AAA111');
      const otherFunctionsBefore = await client.query("SELECT node_key,assigned_message,is_active,created_at,updated_at FROM node_assignments WHERE code='AAA111' AND node_key<>'escape' ORDER BY node_key");
      const playerBBefore = await client.query("SELECT node_key,assigned_message,is_active,created_at,updated_at FROM node_assignments WHERE code='BBB222' ORDER BY node_key");

      const setA = await request(baseUrl, 'PUT', 'AAA111', { body: { assignedMessage: '  Message A  ' } });
      assert.deepEqual(setA, {
        status: 200,
        body: { accessCode: 'AAA-111', nodeKey: 'escape', active: true, assignedMessage: 'Message A' }
      });
      let assignmentA = await client.query("SELECT assignment_type,assigned_message,is_active,created_at,updated_at FROM node_assignments WHERE code='AAA111' AND node_key='escape'");
      assert.equal(assignmentA.rowCount, 1);
      assert.equal(assignmentA.rows[0].assignment_type, 'assigned_message');
      assert.equal(assignmentA.rows[0].assigned_message, 'Message A');
      assert.equal(assignmentA.rows[0].is_active, true);
      let auditA = await client.query("SELECT action,code,operator,detail FROM mission_control_audit WHERE code='AAA111' ORDER BY id");
      assert.deepEqual(auditA.rows, [{
        action: 'ESCAPE_ASSIGNMENT_SET', code: 'AAA111', operator: 'SYSTEM', detail: { nodeKey: 'escape' }
      }]);
      const assignedScanA = await scan(baseUrl, 'escape', 'AAA111');
      assert.deepEqual(assignedScanA, {
        status: 200,
        body: { mode: 'assignment', nodeKey: 'escape', assignedMessage: 'Message A' }
      });
      assert.equal((await client.query("SELECT COUNT(*)::int AS count FROM visits WHERE code='AAA111' AND station='escape'")).rows[0].count, 0);

      await client.query("UPDATE node_assignments SET created_at=NOW()-INTERVAL '2 days',updated_at=NOW()-INTERVAL '1 day' WHERE code='AAA111' AND node_key='escape'");
      const beforeUpdate = (await client.query("SELECT created_at,updated_at FROM node_assignments WHERE code='AAA111' AND node_key='escape'")).rows[0];
      const setB = await request(baseUrl, 'PUT', 'AAA111', { body: { assignedMessage: 'Message B' } });
      assert.equal(setB.status, 200);
      assert.equal(setB.body.assignedMessage, 'Message B');
      assignmentA = await client.query("SELECT assigned_message,is_active,created_at,updated_at FROM node_assignments WHERE code='AAA111' AND node_key='escape'");
      assert.equal(assignmentA.rowCount, 1);
      assert.equal(assignmentA.rows[0].assigned_message, 'Message B');
      assert.equal(assignmentA.rows[0].is_active, true);
      assert.equal(assignmentA.rows[0].created_at.getTime(), beforeUpdate.created_at.getTime());
      assert.ok(assignmentA.rows[0].updated_at > beforeUpdate.updated_at);
      assert.equal((await scan(baseUrl, 'escape', 'AAA111')).body.assignedMessage, 'Message B');
      assert.deepEqual((await client.query("SELECT node_key,assigned_message,is_active,created_at,updated_at FROM node_assignments WHERE code='BBB222' ORDER BY node_key")).rows, playerBBefore.rows);
      assert.equal((await scan(baseUrl, 'escape', 'BBB222')).body.assignedMessage, 'Player B Message');

      const clearA = await request(baseUrl, 'DELETE', 'AAA111');
      assert.deepEqual(clearA, {
        status: 200,
        body: { accessCode: 'AAA-111', nodeKey: 'escape', active: false }
      });
      assignmentA = await client.query("SELECT assigned_message,is_active,updated_at FROM node_assignments WHERE code='AAA111' AND node_key='escape'");
      assert.equal(assignmentA.rowCount, 1);
      assert.equal(assignmentA.rows[0].assigned_message, 'Message B');
      assert.equal(assignmentA.rows[0].is_active, false);
      assert.deepEqual(await playerState(client, 'AAA111'), preservedBefore);
      assert.deepEqual((await client.query("SELECT node_key,assigned_message,is_active,created_at,updated_at FROM node_assignments WHERE code='AAA111' AND node_key<>'escape' ORDER BY node_key")).rows, otherFunctionsBefore.rows);
      assert.deepEqual((await client.query("SELECT node_key,assigned_message,is_active,created_at,updated_at FROM node_assignments WHERE code='BBB222' ORDER BY node_key")).rows, playerBBefore.rows);

      const fallbackScan = await scan(baseUrl, 'escape', 'AAA111');
      assert.equal(fallbackScan.status, 200);
      assert.equal(fallbackScan.body.mode, undefined);
      assert.equal(fallbackScan.body.station, 'escape');
      assert.equal(fallbackScan.body.stage, 2);
      assert.equal(fallbackScan.body.duplicate, false);
      assert.deepEqual((await client.query("SELECT station,stage FROM visits WHERE code='AAA111' ORDER BY stage")).rows, [
        { station: 'attention', stage: 1 },
        { station: 'escape', stage: 2 }
      ]);

      const clearedTimestamp = assignmentA.rows[0].updated_at;
      const clearAgain = await request(baseUrl, 'DELETE', 'AAA111');
      assert.equal(clearAgain.status, 200);
      assert.equal((await client.query("SELECT updated_at FROM node_assignments WHERE code='AAA111' AND node_key='escape'")).rows[0].updated_at.getTime(), clearedTimestamp.getTime());

      const resetA = await request(baseUrl, 'PUT', 'AAA111', { body: { assignedMessage: 'Message C' } });
      assert.equal(resetA.status, 200);
      assert.equal(resetA.body.assignedMessage, 'Message C');
      assignmentA = await client.query("SELECT assigned_message,is_active FROM node_assignments WHERE code='AAA111' AND node_key='escape'");
      assert.deepEqual(assignmentA.rows, [{ assigned_message: 'Message C', is_active: true }]);
      assert.equal((await client.query("SELECT COUNT(*)::int AS count FROM node_assignments WHERE code='AAA111' AND node_key='escape'")).rows[0].count, 1);
      assert.deepEqual(await scan(baseUrl, 'escape', 'AAA111'), {
        status: 200,
        body: { mode: 'assignment', nodeKey: 'escape', assignedMessage: 'Message C' }
      });
      assert.deepEqual((await client.query("SELECT station,stage FROM visits WHERE code='AAA111' ORDER BY stage")).rows, [
        { station: 'attention', stage: 1 },
        { station: 'escape', stage: 2 }
      ]);

      const concurrent = await Promise.all([
        request(baseUrl, 'PUT', 'AAA111', { body: { assignedMessage: 'Concurrent 1' } }),
        request(baseUrl, 'PUT', 'AAA111', { body: { assignedMessage: 'Concurrent 2' } })
      ]);
      assert.ok(concurrent.every(result => result.status === 200));
      const concurrentRow = await client.query("SELECT assigned_message,is_active FROM node_assignments WHERE code='AAA111' AND node_key='escape'");
      assert.equal(concurrentRow.rowCount, 1);
      assert.equal(concurrentRow.rows[0].is_active, true);
      assert.ok(['Concurrent 1', 'Concurrent 2'].includes(concurrentRow.rows[0].assigned_message));

      auditA = await client.query("SELECT action,operator,detail FROM mission_control_audit WHERE code='AAA111' ORDER BY id");
      assert.equal(auditA.rows.filter(row => row.action === 'ESCAPE_ASSIGNMENT_SET').length, 5);
      assert.deepEqual(auditA.rows.filter(row => row.action === 'ESCAPE_ASSIGNMENT_CLEARED').map(row => row.detail), [
        { changed: true, nodeKey: 'escape' },
        { changed: false, nodeKey: 'escape' }
      ]);
      assert.ok(auditA.rows.every(row => row.operator === 'SYSTEM'));
      assert.ok(auditA.rows.every(row => !JSON.stringify(row.detail).includes('Message')));

      for (const station of ['attention', 'access', 'sensory']) {
        const normal = await scan(baseUrl, station, 'BBB222');
        assert.equal(normal.status, 200);
        assert.equal(normal.body.mode, undefined);
        assert.equal(normal.body.station, station);
      }
      assert.deepEqual((await client.query("SELECT node_key,assigned_message,is_active,created_at,updated_at FROM node_assignments WHERE code='BBB222' ORDER BY node_key")).rows, playerBBefore.rows);
      assert.deepEqual((await client.query("SELECT node_key,assigned_message,is_active,created_at,updated_at FROM node_assignments WHERE code='AAA111' AND node_key<>'escape' ORDER BY node_key")).rows, otherFunctionsBefore.rows);
    } finally {
      client.release();
    }
  } finally {
    await stopChild(child);
    if (isolatedPool) await isolatedPool.end();
    if (schemaName) await dropOwnedTestSchema(admin, integrationUrl, schemaName);
    admin.release();
    await adminPool.end();
  }
});
