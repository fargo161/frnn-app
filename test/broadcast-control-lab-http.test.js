import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const integrationUrl = process.env.TEST_DATABASE_URL || '';

function verifiedIntegrationUrl() {
  const url = new URL(integrationUrl);
  assert.ok(['127.0.0.1', 'localhost', '::1'].includes(url.hostname), 'integration database must be local');
  assert.equal(url.pathname, '/frnn_integration_test', 'integration tests require the disposable database name');
  return url;
}

function urlForSchema(base, schemaName) {
  const url = new URL(base.toString());
  url.searchParams.set('options', `-c search_path=${schemaName},public`);
  return url.toString();
}

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
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`test server exited before readiness\n${output()}`);
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
    new Promise(resolve => setTimeout(resolve, 3_000))
  ]);
}

async function request(baseUrl, path, { method = 'GET', body, authenticated = true } = {}) {
  const headers = {};
  if (authenticated) headers.Authorization = 'Bearer bcl-http-test-only';
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  return { response, body: await response.json().catch(() => null) };
}

test('real authenticated HTTP path projects immutable v1, future v2, refusal details, and audits', {
  skip: integrationUrl ? false : 'set TEST_DATABASE_URL to run disposable Broadcast HTTP integration'
}, async () => {
  const baseDatabaseUrl = verifiedIntegrationUrl();
  const schemaName = `bcl_http_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
  const adminPool = new Pool({ connectionString: baseDatabaseUrl.toString() });
  let child;
  let isolatedPool;
  let stdout = '';
  let stderr = '';
  try {
    await adminPool.query(`CREATE SCHEMA ${schemaName}`);
    const isolatedUrl = urlForSchema(baseDatabaseUrl, schemaName);
    const port = await availablePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    const childEnvironment = { ...process.env };
    delete childEnvironment.DATABASE_URL;
    Object.assign(childEnvironment, {
      TEST_DATABASE_URL: isolatedUrl,
      PORT: String(port),
      NODE_ENV: 'test',
      ADMIN_KEY: 'bcl-http-test-only'
    });
    child = spawn(process.execPath, [fileURLToPath(new URL('../server.js', import.meta.url))], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      env: childEnvironment,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    await waitForHealth(baseUrl, child, () => `${stdout}\n${stderr}`);
    isolatedPool = new Pool({ connectionString: isolatedUrl });

    const controlPage = await fetch(`${baseUrl}/control-lab`);
    assert.equal(controlPage.status, 200);
    assert.match(await controlPage.text(), /Reusable Library/);
    const unauthenticated = await request(baseUrl, '/api/admin/broadcast/control-lab', { authenticated: false });
    assert.equal(unauthenticated.response.status, 401);
    assert.equal(unauthenticated.body.error, 'MISSION_CONTROL_ACCESS_REQUIRED');

    const v1 = {
      id: 'http-news', title: 'HTTP News v1', item_kind: 'PROGRAM', playback_type: 'test_card',
      media_ref: null, duration_ms: 600_000, loop_eligible: false
    };
    const created = await request(baseUrl, '/api/admin/broadcast/library', { method: 'POST', body: v1 });
    assert.equal(created.response.status, 201);
    assert.equal(created.body.item.definition_version, 1);

    const firstQueue = await request(baseUrl, '/api/admin/broadcast/queue', {
      method: 'POST', body: { packaged_item_id: v1.id }
    });
    const secondQueue = await request(baseUrl, '/api/admin/broadcast/queue', {
      method: 'POST', body: { packaged_item_id: v1.id }
    });
    assert.equal(firstQueue.response.status, 201);
    assert.equal(secondQueue.response.status, 201);
    assert.notEqual(firstQueue.body.entry.id, secondQueue.body.entry.id);

    const startedV1 = await request(baseUrl, '/api/admin/broadcast/start', { method: 'POST' });
    assert.equal(startedV1.response.status, 200);
    assert.equal(startedV1.body.active_run.source_definition_version, 1);
    const v1Run = structuredClone(startedV1.body.active_run);

    const edited = await request(baseUrl, `/api/admin/broadcast/library/${v1.id}`, {
      method: 'PUT',
      body: { ...v1, title: 'HTTP News v2', duration_ms: 700_000, expected_definition_version: 1 }
    });
    assert.equal(edited.response.status, 200);
    assert.equal(edited.body.item.definition_version, 2);

    const publicV1 = await request(baseUrl, '/api/broadcast', { authenticated: false });
    assert.equal(publicV1.response.status, 200);
    assert.equal(publicV1.response.headers.get('cache-control'), 'no-store');
    assert.equal(publicV1.body.current_program.title, 'HTTP News v1');
    assert.equal(publicV1.body.current_program.duration_ms, 600_000);
    const aggregate = await request(baseUrl, '/api/admin/broadcast/control-lab');
    assert.deepEqual(aggregate.body.active_run, v1Run);

    const refused = await request(baseUrl, `/api/admin/broadcast/library/${v1.id}`, { method: 'DELETE' });
    assert.equal(refused.response.status, 409);
    assert.deepEqual(refused.body, {
      error: 'PACKAGED_ITEM_REFERENCED',
      details: { packaged_item_id: v1.id, queued_reference_count: 1, active: true }
    });
    const afterRefusal = await request(baseUrl, '/api/admin/broadcast/control-lab');
    assert.deepEqual(afterRefusal.body.active_run, v1Run);
    assert.equal(afterRefusal.body.queue.length, 1);
    assert.equal(afterRefusal.body.library.length, 1);

    assert.equal((await request(baseUrl, '/api/admin/broadcast/stop', { method: 'POST' })).response.status, 200);
    const startedV2 = await request(baseUrl, '/api/admin/broadcast/start', { method: 'POST' });
    assert.equal(startedV2.body.active_run.source_definition_version, 2);
    assert.equal(startedV2.body.active_run.title, 'HTTP News v2');
    assert.equal(startedV2.body.active_run.duration_ms, 700_000);
    assert.notEqual(startedV2.body.active_run.run_id, v1Run.run_id);

    const retired = await request(baseUrl, '/api/admin/programs', { method: 'PUT', body: { programs: [] } });
    assert.equal(retired.response.status, 409);
    assert.equal(retired.body.error, 'BROADCAST_LEGACY_PACKAGER_RETIRED');

    const audits = await isolatedPool.query(
      `SELECT action,detail FROM mission_control_audit
       WHERE action LIKE 'BROADCAST_%'
       ORDER BY id`
    );
    assert.deepEqual(audits.rows.map(row => row.action), [
      'BROADCAST_LIBRARY_CREATED',
      'BROADCAST_QUEUE_ADDED',
      'BROADCAST_QUEUE_ADDED',
      'BROADCAST_STARTED',
      'BROADCAST_LIBRARY_EDITED',
      'BROADCAST_STOPPED',
      'BROADCAST_STARTED'
    ]);
    assert.equal(audits.rows.some(row => row.action === 'BROADCAST_LIBRARY_DELETED'), false);
  } finally {
    await stopChild(child);
    if (isolatedPool) await isolatedPool.end();
    await adminPool.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    await adminPool.end();
  }
});
