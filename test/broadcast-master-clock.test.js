import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import pg from 'pg';
import {
  BroadcastError,
  offAirBroadcastState,
  projectBroadcastState,
  readBroadcastState,
  startBroadcast,
  stopBroadcast
} from '../broadcast.js';
import {
  validatePackagedItem,
  readControlLabState,
  createPackagedItem,
  updatePackagedItem,
  deletePackagedItem,
  addQueueEntry,
  reorderQueueEntries,
  removeQueueEntry
} from '../broadcast-control-lab.js';
import {
  createOwnedTestSchema,
  dropOwnedTestSchema,
  optionalDisposableTestDatabaseUrl,
  scopedDisposableTestDatabaseUrl
} from '../test-support/disposable-postgres.js';

const { Pool } = pg;
const integrationUrl = optionalDisposableTestDatabaseUrl();
const schemaSql = await fs.readFile(new URL('../schema.sql', import.meta.url), 'utf8');
const migrationsDirectory = new URL('../migrations/', import.meta.url);

const itemV1 = Object.freeze({
  id: 'library-news',
  title: 'Library News v1',
  item_kind: 'PROGRAM',
  playback_type: 'test_card',
  media_ref: null,
  duration_ms: 600_000,
  loop_eligible: false
});

const transition = Object.freeze({
  id: 'station-transition',
  title: 'Station Transition',
  item_kind: 'TRANSITION',
  playback_type: 'test_card',
  media_ref: null,
  duration_ms: 600_000,
  loop_eligible: false
});

async function createDisposableSchema(prefix) {
  const admin = new Pool({ connectionString: integrationUrl });
  const client = await admin.connect();
  try {
    const schema = await createOwnedTestSchema(client, integrationUrl, prefix);
    client.release();
    return {
      schema,
      admin,
      pool: new Pool({ connectionString: scopedDisposableTestDatabaseUrl(integrationUrl, schema), max: 6 })
    };
  } catch (error) {
    client.release();
    await admin.end();
    throw error;
  }
}

async function dropDisposableSchema(context) {
  await context.pool.end();
  const client = await context.admin.connect();
  try {
    await dropOwnedTestSchema(client, integrationUrl, context.schema);
  } finally {
    client.release();
  }
  await context.admin.end();
}

async function transaction(pool, operation) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function numberedMigrationFiles() {
  return (await fs.readdir(migrationsDirectory))
    .filter(name => /^\d{3}_[a-z0-9_-]+\.sql$/i.test(name))
    .sort();
}

async function migrateLikeApplication(pool, through = '999') {
  const client = await pool.connect();
  try {
    await client.query(schemaSql);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    for (const name of await numberedMigrationFiles()) {
      if (name.slice(0, 3) > through) continue;
      if ((await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name])).rows[0]) continue;
      await client.query('BEGIN');
      try {
        await client.query(await fs.readFile(new URL(name, migrationsDirectory), 'utf8'));
        await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    client.release();
  }
}

async function expectBroadcastError(operation, code, expectedDetails = undefined) {
  await assert.rejects(operation, error => {
    assert.equal(error instanceof BroadcastError, true);
    assert.equal(error.code, code);
    if (expectedDetails !== undefined) assert.deepEqual(error.details, expectedDetails);
    return true;
  });
}

test('packaged item validation separates semantic kind from playback type', () => {
  const program = validatePackagedItem(itemV1);
  const transitionItem = validatePackagedItem({ ...itemV1, id: 'transition', item_kind: 'TRANSITION' });
  assert.equal(program.item_kind, 'PROGRAM');
  assert.equal(transitionItem.item_kind, 'TRANSITION');
  assert.equal(program.playback_type, transitionItem.playback_type);

  for (const invalid of [
    { ...itemV1, item_kind: 'video' },
    { ...itemV1, playback_type: 'PROGRAM' },
    { ...itemV1, duration_ms: 0 },
    { ...itemV1, playback_type: 'image', media_ref: '' },
    { ...itemV1, media_ref: 'javascript:alert(1)' },
    { ...itemV1, loop_eligible: 'false' }
  ]) {
    assert.throws(() => validatePackagedItem(invalid), error =>
      error instanceof BroadcastError && error.code === 'INVALID_PACKAGED_ITEM');
  }
});

test('public projection preserves the viewer contract while sourcing copied active fields', () => {
  const runtime = {
    server_time: '2026-08-24T12:00:03.000Z',
    next_program_id: 'next-item',
    active_run: {
      run_id: 41,
      packaged_item_id: 'library-news',
      source_definition_version: 1,
      source_queue_entry_id: 8,
      source_queue_position: 3,
      title: 'Copied v1',
      item_kind: 'PROGRAM',
      playback_type: 'test_card',
      media_ref: null,
      duration_ms: 12_000,
      started_at: '2026-08-24T12:00:00.000Z'
    }
  };
  assert.deepEqual(projectBroadcastState(runtime), {
    status: 'on_air',
    server_time: '2026-08-24T12:00:03.000Z',
    current_program_id: 'library-news',
    current_program_started_at: '2026-08-24T12:00:00.000Z',
    program_duration: 12_000,
    elapsed: 3_000,
    remaining: 9_000,
    next_program_id: 'next-item',
    current_program: {
      id: 'library-news',
      title: 'Copied v1',
      program_type: 'test_card',
      media_ref: null,
      duration_ms: 12_000,
      queue_position: 3
    }
  });
  assert.equal(offAirBroadcastState(runtime.server_time).status, 'off_air');
});

test('migration 005 backfills off-air legacy rows and the full migration chain is idempotent', {
  skip: integrationUrl ? false : 'set TEST_DATABASE_URL to run disposable Broadcast integration'
}, async () => {
  const context = await createDisposableSchema('bcl_migration');
  try {
    await migrateLikeApplication(context.pool, '004');
    await context.pool.query(
      `INSERT INTO broadcast_programs(id,title,program_type,media_ref,duration_ms,queue_position)
       VALUES
         ('legacy-b','Legacy B','image','/b.png',2000,20),
         ('legacy-a','Legacy A','test_card',NULL,1000,10)`
    );

    await migrateLikeApplication(context.pool);
    await migrateLikeApplication(context.pool);

    const library = await context.pool.query(
      `SELECT id,definition_version,title,item_kind,playback_type,media_ref,duration_ms,loop_eligible
       FROM broadcast_packaged_items ORDER BY id`
    );
    assert.deepEqual(library.rows.map(row => ({ ...row, definition_version: Number(row.definition_version), duration_ms: Number(row.duration_ms) })), [
      {
        id: 'legacy-a', definition_version: 1, title: 'Legacy A', item_kind: 'PROGRAM',
        playback_type: 'test_card', media_ref: null, duration_ms: 1000, loop_eligible: false
      },
      {
        id: 'legacy-b', definition_version: 1, title: 'Legacy B', item_kind: 'PROGRAM',
        playback_type: 'image', media_ref: '/b.png', duration_ms: 2000, loop_eligible: false
      }
    ]);
    const queue = await context.pool.query(
      'SELECT packaged_item_id,queue_position FROM broadcast_queue_entries ORDER BY queue_position'
    );
    assert.deepEqual(queue.rows, [
      { packaged_item_id: 'legacy-a', queue_position: 1 },
      { packaged_item_id: 'legacy-b', queue_position: 2 }
    ]);
    assert.equal((await context.pool.query('SELECT run_id FROM broadcast_active_run')).rows[0].run_id, null);
    assert.equal((await context.pool.query("SELECT COUNT(*)::INTEGER AS count FROM schema_migrations WHERE name='005_broadcast_control_lab_foundation.sql'")).rows[0].count, 1);
  } finally {
    await dropDisposableSchema(context);
  }
});

test('migration 005 refuses an active legacy channel and rolls back every new BCL table', {
  skip: integrationUrl ? false : 'set TEST_DATABASE_URL to run disposable Broadcast integration'
}, async () => {
  const context = await createDisposableSchema('bcl_live_migration');
  try {
    await migrateLikeApplication(context.pool, '004');
    await context.pool.query(
      `INSERT INTO broadcast_programs(id,title,program_type,media_ref,duration_ms,queue_position)
       VALUES('legacy-live','Legacy Live','test_card',NULL,1000,1)`
    );
    await context.pool.query('UPDATE broadcast_clock SET started_at=clock_timestamp() WHERE singleton=TRUE');
    await assert.rejects(() => migrateLikeApplication(context.pool), /BCL_MIGRATION_REQUIRES_OFF_AIR/);

    assert.equal((await context.pool.query("SELECT to_regclass('broadcast_packaged_items') AS relation")).rows[0].relation, null);
    assert.equal((await context.pool.query('SELECT COUNT(*)::INTEGER AS count FROM broadcast_programs')).rows[0].count, 1);
    assert.notEqual((await context.pool.query('SELECT started_at FROM broadcast_clock WHERE singleton=TRUE')).rows[0].started_at, null);
    assert.equal((await context.pool.query("SELECT COUNT(*)::INTEGER AS count FROM schema_migrations WHERE name='005_broadcast_control_lab_foundation.sql'")).rows[0].count, 0);
  } finally {
    await dropDisposableSchema(context);
  }
});

test('Library to Queue to immutable Active Run preserves v1 and activates v2 later', {
  skip: integrationUrl ? false : 'set TEST_DATABASE_URL to run disposable Broadcast integration'
}, async () => {
  const context = await createDisposableSchema('bcl_causal');
  let activePool = context.pool;
  try {
    await migrateLikeApplication(activePool);
    const createdProgram = await transaction(activePool, client => createPackagedItem(client, itemV1));
    const createdTransition = await transaction(activePool, client => createPackagedItem(client, transition));
    assert.equal(createdProgram.definition_version, 1);
    assert.equal(createdTransition.item_kind, 'TRANSITION');
    let state = await transaction(activePool, client => readControlLabState(client));
    assert.deepEqual(state.queue, []);
    assert.equal(state.active_run, null);

    const firstReference = await transaction(activePool, client => addQueueEntry(client, itemV1.id));
    const secondReference = await transaction(activePool, client => addQueueEntry(client, itemV1.id));
    const transitionReference = await transaction(activePool, client => addQueueEntry(client, transition.id));
    assert.notEqual(firstReference.id, secondReference.id);
    state = await transaction(activePool, client => readControlLabState(client));
    assert.deepEqual(state.queue.map(entry => entry.packaged_item_id), [itemV1.id, itemV1.id, transition.id]);

    const started = await transaction(activePool, client => startBroadcast(client));
    assert.equal(started.active_run.source_queue_entry_id, firstReference.id);
    assert.equal(started.active_run.source_definition_version, 1);
    const immutableV1 = structuredClone(started.active_run);
    assert.deepEqual(started.queue.map(entry => entry.id), [secondReference.id, transitionReference.id]);

    const v2 = await transaction(activePool, client => updatePackagedItem(client, itemV1.id, {
      ...itemV1,
      title: 'Library News v2',
      duration_ms: 700_000,
      expected_definition_version: 1
    }));
    assert.equal(v2.definition_version, 2);
    await expectBroadcastError(
      () => transaction(activePool, client => updatePackagedItem(client, itemV1.id, {
        ...itemV1,
        title: 'Stale overwrite',
        expected_definition_version: 1
      })),
      'PACKAGED_ITEM_VERSION_CONFLICT'
    );

    const afterEdit = await transaction(activePool, client => readControlLabState(client));
    assert.deepEqual(afterEdit.active_run, immutableV1);
    const publicV1 = await transaction(activePool, client => readBroadcastState(client));
    assert.equal(publicV1.current_program.title, itemV1.title);
    assert.equal(publicV1.current_program.duration_ms, itemV1.duration_ms);

    await expectBroadcastError(
      () => transaction(activePool, client => deletePackagedItem(client, itemV1.id)),
      'PACKAGED_ITEM_REFERENCED',
      { packaged_item_id: itemV1.id, queued_reference_count: 1, active: true }
    );
    assert.deepEqual((await transaction(activePool, client => readControlLabState(client))).active_run, immutableV1);

    await transaction(activePool, client => reorderQueueEntries(client, [transitionReference.id, secondReference.id]));
    await transaction(activePool, client => removeQueueEntry(client, transitionReference.id));
    assert.deepEqual((await transaction(activePool, client => readControlLabState(client))).active_run, immutableV1);

    await transaction(activePool, client => stopBroadcast(client));
    const future = await transaction(activePool, client => startBroadcast(client));
    assert.notEqual(future.active_run.run_id, immutableV1.run_id);
    assert.equal(future.active_run.source_definition_version, 2);
    assert.equal(future.active_run.title, 'Library News v2');
    assert.equal(future.active_run.duration_ms, 700_000);
    const immutableV2 = structuredClone(future.active_run);

    await activePool.end();
    activePool = new Pool({ connectionString: scopedDisposableTestDatabaseUrl(integrationUrl, context.schema), max: 6 });
    context.pool = activePool;
    const recovered = await transaction(activePool, client => readControlLabState(client));
    assert.deepEqual(recovered.active_run, immutableV2);
    await expectBroadcastError(
      () => transaction(activePool, client => deletePackagedItem(client, itemV1.id)),
      'PACKAGED_ITEM_REFERENCED',
      { packaged_item_id: itemV1.id, queued_reference_count: 0, active: true }
    );

    await transaction(activePool, client => stopBroadcast(client));
    assert.deepEqual((await transaction(activePool, client => readControlLabState(client))).queue, []);
    assert.equal((await transaction(activePool, client => deletePackagedItem(client, itemV1.id))).deleted, true);
    assert.equal((await transaction(activePool, client => deletePackagedItem(client, transition.id))).deleted, true);
    await expectBroadcastError(
      () => transaction(activePool, client => startBroadcast(client)),
      'BROADCAST_QUEUE_EMPTY'
    );
    assert.equal((await transaction(activePool, client => readBroadcastState(client))).status, 'off_air');
  } finally {
    await dropDisposableSchema(context);
  }
});

test('boundary recovery consumes each entry once, converges across concurrent readers, and exhausts OFF AIR', {
  skip: integrationUrl ? false : 'set TEST_DATABASE_URL to run disposable Broadcast integration'
}, async () => {
  const context = await createDisposableSchema('bcl_boundary');
  try {
    await migrateLikeApplication(context.pool);
    for (const id of ['boundary-a', 'boundary-b', 'boundary-c', 'boundary-d']) {
      await transaction(context.pool, client => createPackagedItem(client, {
        ...itemV1,
        id,
        title: id,
        duration_ms: 1_000
      }));
      await transaction(context.pool, client => addQueueEntry(client, id));
    }
    const first = await transaction(context.pool, client => startBroadcast(client));
    assert.equal(first.active_run.packaged_item_id, 'boundary-a');
    const adjusted = await context.pool.query(
      `UPDATE broadcast_active_run
       SET started_at=clock_timestamp()-INTERVAL '1100 milliseconds'
       WHERE singleton=TRUE
       RETURNING started_at`
    );
    const expectedBoundary = new Date(adjusted.rows[0].started_at.getTime() + 1_000).toISOString();

    const [readerOne, readerTwo] = await Promise.all([
      transaction(context.pool, client => readBroadcastState(client)),
      transaction(context.pool, client => readBroadcastState(client))
    ]);
    assert.equal(readerOne.current_program_id, 'boundary-b');
    assert.equal(readerTwo.current_program_id, 'boundary-b');
    assert.equal(readerOne.current_program_started_at, expectedBoundary);
    assert.equal(readerTwo.current_program_started_at, expectedBoundary);
    const afterConcurrentRead = await transaction(context.pool, client => readControlLabState(client));
    assert.equal(afterConcurrentRead.active_run.run_id, first.active_run.run_id + 1);
    assert.deepEqual(afterConcurrentRead.queue.map(entry => entry.packaged_item_id), ['boundary-c', 'boundary-d']);

    await context.pool.query(
      `UPDATE broadcast_active_run
       SET started_at=clock_timestamp()-INTERVAL '3500 milliseconds'
       WHERE singleton=TRUE`
    );
    const exhausted = await transaction(context.pool, client => readBroadcastState(client));
    assert.equal(exhausted.status, 'off_air');
    assert.equal(exhausted.current_program, null);
    const finalState = await transaction(context.pool, client => readControlLabState(client));
    assert.equal(finalState.active_run, null);
    assert.deepEqual(finalState.queue, []);
    const boundaryAudits = await context.pool.query(
      `SELECT detail FROM mission_control_audit
       WHERE action='BROADCAST_BOUNDARY_ACTIVATED'
       ORDER BY id`
    );
    assert.equal(boundaryAudits.rows.length, 4);
    assert.equal(boundaryAudits.rows[0].detail.previousRunId, first.active_run.run_id);
    assert.equal(boundaryAudits.rows[0].detail.nextRunId, first.active_run.run_id + 1);
    assert.equal(boundaryAudits.rows.at(-1).detail.nextRunId, null);
  } finally {
    await dropDisposableSchema(context);
  }
});

test('delete racing a queue add is serialized into stable reference refusal without dangling state', {
  skip: integrationUrl ? false : 'set TEST_DATABASE_URL to run disposable Broadcast integration'
}, async () => {
  const context = await createDisposableSchema('bcl_delete_race');
  const addClient = await context.pool.connect();
  try {
    await migrateLikeApplication(context.pool);
    await transaction(context.pool, client => createPackagedItem(client, { ...itemV1, id: 'race-item' }));
    await addClient.query('BEGIN');
    const entry = await addQueueEntry(addClient, 'race-item');
    let deleteSettled = false;
    const deletion = transaction(context.pool, client => deletePackagedItem(client, 'race-item'))
      .finally(() => { deleteSettled = true; });
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(deleteSettled, false);
    await addClient.query('COMMIT');
    await expectBroadcastError(
      () => deletion,
      'PACKAGED_ITEM_REFERENCED',
      { packaged_item_id: 'race-item', queued_reference_count: 1, active: false }
    );
    assert.equal((await context.pool.query('SELECT COUNT(*)::INTEGER AS count FROM broadcast_packaged_items WHERE id=$1', ['race-item'])).rows[0].count, 1);
    assert.equal((await context.pool.query('SELECT packaged_item_id FROM broadcast_queue_entries WHERE id=$1', [entry.id])).rows[0].packaged_item_id, 'race-item');
  } finally {
    if (!addClient.released) await addClient.query('ROLLBACK').catch(() => {});
    addClient.release();
    await dropDisposableSchema(context);
  }
});

test('migration, routes, and viewer projection are structurally wired to the new boundary', async () => {
  const [migration, server, viewer] = await Promise.all([
    fs.readFile(new URL('../migrations/005_broadcast_control_lab_foundation.sql', import.meta.url), 'utf8'),
    fs.readFile(new URL('../server.js', import.meta.url), 'utf8'),
    fs.readFile(new URL('../public/broadcast.html', import.meta.url), 'utf8')
  ]);
  for (const table of ['broadcast_packaged_items', 'broadcast_queue_entries', 'broadcast_active_run']) {
    assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }
  assert.match(migration, /BCL_MIGRATION_REQUIRES_OFF_AIR/);
  assert.match(migration, /ON DELETE RESTRICT/g);
  for (const route of [
    "app.get('/api/admin/broadcast/control-lab', requireAdmin",
    "app.post('/api/admin/broadcast/library', requireAdmin",
    "app.put('/api/admin/broadcast/library/:id', requireAdmin",
    "app.delete('/api/admin/broadcast/library/:id', requireAdmin",
    "app.post('/api/admin/broadcast/queue', requireAdmin",
    "app.put('/api/admin/broadcast/queue/order', requireAdmin",
    "app.delete('/api/admin/broadcast/queue/:entryId', requireAdmin",
    "app.post('/api/admin/broadcast/start', requireAdmin",
    "app.post('/api/admin/broadcast/stop', requireAdmin"
  ]) assert.ok(server.includes(route), `missing route ${route}`);
  assert.match(server, /BROADCAST_LEGACY_PACKAGER_RETIRED/);
  assert.match(viewer, /current_program\.program_type/);
  assert.doesNotMatch(viewer, /api\/admin\/broadcast/);
});
