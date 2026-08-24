import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import pg from 'pg';
import {
  BroadcastError,
  offAirBroadcastState,
  readBroadcastState,
  replaceBroadcastPrograms,
  resolveBroadcastState,
  startBroadcast,
  stopBroadcast,
  validateProgramQueue
} from '../broadcast.js';

const T0 = Date.parse('2026-08-24T12:00:00.000Z');
const programs = [
  {
    id: 'program-a', title: 'Program A', program_type: 'test_card', media_ref: null,
    duration_ms: 12_000, queue_position: 1
  },
  {
    id: 'program-b', title: 'Program B', program_type: 'test_card', media_ref: '',
    duration_ms: 12_000, queue_position: 2
  },
  {
    id: 'program-c', title: 'Program C', program_type: 'test_card', media_ref: null,
    duration_ms: 12_000, queue_position: 3
  }
];

function at(offsetMs) {
  return new Date(T0 + offsetMs);
}

test('resolver derives late-join position and uses exact [start,end) boundaries', () => {
  const duringA = resolveBroadcastState(programs, at(0), at(3_000));
  assert.deepEqual({
    current: duringA.current_program_id,
    elapsed: duringA.elapsed,
    remaining: duringA.remaining,
    next: duringA.next_program_id
  }, { current: 'program-a', elapsed: 3_000, remaining: 9_000, next: 'program-b' });

  const exactBoundary = resolveBroadcastState(programs, at(0), at(12_000));
  assert.equal(exactBoundary.current_program_id, 'program-b');
  assert.equal(exactBoundary.elapsed, 0);
  assert.equal(exactBoundary.current_program_started_at, at(12_000).toISOString());

  const duringB = resolveBroadcastState(programs, at(0), at(17_250));
  assert.equal(duringB.current_program_id, 'program-b');
  assert.equal(duringB.elapsed, 5_250);

  const exactC = resolveBroadcastState(programs, at(0), at(24_000));
  assert.equal(exactC.current_program_id, 'program-c');
  assert.equal(exactC.elapsed, 0);
});

test('resolver advances one and multiple full cycles from the original anchor', () => {
  const oneWrap = resolveBroadcastState(programs, at(0), at(36_000));
  assert.equal(oneWrap.current_program_id, 'program-a');
  assert.equal(oneWrap.elapsed, 0);
  assert.equal(oneWrap.current_program_started_at, at(36_000).toISOString());

  const multipleWraps = resolveBroadcastState(programs, at(0), at((36_000 * 4) + 17_000));
  assert.equal(multipleWraps.current_program_id, 'program-b');
  assert.equal(multipleWraps.elapsed, 5_000);
  assert.equal(multipleWraps.current_program_started_at, at((36_000 * 4) + 12_000).toISOString());
});

test('independent resolver instances agree for the same authoritative inputs', () => {
  const firstConsumer = resolveBroadcastState([...programs], new Date(T0), at(29_555));
  const secondConsumer = resolveBroadcastState(programs.map(program => ({ ...program })), at(0), at(29_555));
  assert.deepEqual(secondConsumer, firstConsumer);
});

test('arbitrary queues sort by unique positive positions and normalize PostgreSQL integers', () => {
  const normalized = validateProgramQueue([
    { ...programs[1], duration_ms: '12000', queue_position: '20' },
    { ...programs[0], duration_ms: '12000', queue_position: '10' }
  ]);
  assert.deepEqual(normalized.map(program => [program.id, program.duration_ms, program.queue_position]), [
    ['program-a', 12_000, 10],
    ['program-b', 12_000, 20]
  ]);
});

test('invalid or non-deterministic queues fail with safe explicit details', () => {
  const invalidQueues = [
    [],
    [{ ...programs[0], duration_ms: 0 }],
    [{ ...programs[0], program_type: 'slideshow' }],
    [{ ...programs[0], program_type: 'video', media_ref: '' }],
    [{ ...programs[0], program_type: 'image', media_ref: 'javascript:alert(1)' }],
    [{ ...programs[0], media_ref: 'javascript:alert(1)' }],
    [programs[0], { ...programs[1], queue_position: 1 }],
    [programs[0], { ...programs[1], id: programs[0].id }]
  ];
  for (const queue of invalidQueues) {
    assert.throws(() => validateProgramQueue(queue), error => {
      assert.equal(error instanceof BroadcastError, true);
      assert.equal(error.code, 'INVALID_PROGRAM_QUEUE');
      assert.ok(Array.isArray(error.details));
      return true;
    });
  }
});

test('off-air state exposes the full public contract with null current fields', () => {
  assert.deepEqual(offAirBroadcastState(at(4_000)), {
    status: 'off_air',
    server_time: at(4_000).toISOString(),
    current_program_id: null,
    current_program_started_at: null,
    program_duration: null,
    elapsed: null,
    remaining: null,
    next_program_id: null,
    current_program: null
  });
});

function fakeBroadcastClient({ startedAt = null, queue = programs, databaseNow = at(0) } = {}) {
  const state = {
    startedAt,
    databaseNow,
    programs: queue.map(program => ({ ...program }))
  };
  return {
    state,
    async query(sql, values = []) {
      const text = String(sql).replace(/\s+/g, ' ').trim();
      if (/WITH authority AS MATERIALIZED/.test(text)) {
        if (!state.programs.length) {
          return { rows: [{
            started_at: state.startedAt, server_time: state.databaseNow,
            id: null, title: null, program_type: null, media_ref: null,
            duration_ms: null, queue_position: null
          }] };
        }
        return { rows: state.programs.map(program => ({
          started_at: state.startedAt,
          server_time: state.databaseNow,
          ...program,
          duration_ms: String(program.duration_ms)
        })) };
      }
      if (/SELECT started_at FROM broadcast_clock.+FOR UPDATE/.test(text)) {
        return { rows: [{ started_at: state.startedAt }] };
      }
      if (/SELECT id,title,program_type,media_ref,duration_ms,queue_position/.test(text)) {
        return {
          rows: state.programs
            .slice()
            .sort((a, b) => a.queue_position - b.queue_position)
            .map(program => ({ ...program, duration_ms: String(program.duration_ms) }))
        };
      }
      if (/SET started_at=clock_timestamp\(\)/.test(text)) {
        state.startedAt = new Date(state.databaseNow);
        return { rows: [{ started_at: state.startedAt }] };
      }
      if (/SET started_at=NULL/.test(text)) {
        state.startedAt = null;
        return { rows: [] };
      }
      if (/DELETE FROM broadcast_programs/.test(text)) {
        state.programs = [];
        return { rows: [] };
      }
      if (/INSERT INTO broadcast_programs/.test(text)) {
        state.programs.push({
          id: values[0], title: values[1], program_type: values[2], media_ref: values[3],
          duration_ms: values[4], queue_position: values[5]
        });
        return { rows: [] };
      }
      throw new Error(`Unexpected fake query: ${text}`);
    }
  };
}

test('database-backed start rejects a second Start without changing its anchor', async () => {
  const client = fakeBroadcastClient({ databaseNow: at(1_000) });
  const started = await startBroadcast(client);
  assert.equal(started.status, 'on_air');
  assert.equal(started.started_at, at(1_000).toISOString());
  const originalAnchor = client.state.startedAt.getTime();

  client.state.databaseNow = at(8_000);
  await assert.rejects(() => startBroadcast(client), error => {
    assert.equal(error.code, 'BROADCAST_ALREADY_RUNNING');
    assert.equal(error.details.started_at, at(1_000).toISOString());
    return true;
  });
  assert.equal(client.state.startedAt.getTime(), originalAnchor);
});

test('running queue edits are rejected before writes and Stop returns authoritative off air', async () => {
  const client = fakeBroadcastClient({ startedAt: at(2_000), databaseNow: at(5_000) });
  const originalQueue = client.state.programs.map(program => ({ ...program }));
  await assert.rejects(
    () => replaceBroadcastPrograms(client, [{ ...programs[0], title: 'Changed' }]),
    error => error.code === 'BROADCAST_RUNNING_EDIT_FORBIDDEN'
  );
  assert.deepEqual(client.state.programs, originalQueue);
  assert.equal(client.state.startedAt.getTime(), at(2_000).getTime());

  const stopped = await stopBroadcast(client);
  assert.deepEqual(stopped, { status: 'off_air', started_at: null, programs: validateProgramQueue(programs) });
  const publicState = await readBroadcastState(client);
  assert.equal(publicState.status, 'off_air');
  assert.equal(publicState.server_time, at(5_000).toISOString());
});

test('Start rejects an empty persisted queue and a later Start after Stop uses a new DB anchor', async () => {
  const empty = fakeBroadcastClient({ queue: [] });
  await assert.rejects(() => startBroadcast(empty), error => error.code === 'INVALID_PROGRAM_QUEUE');
  assert.equal(empty.state.startedAt, null);

  const client = fakeBroadcastClient({ startedAt: at(1_000), databaseNow: at(10_000) });
  await stopBroadcast(client);
  client.state.databaseNow = at(20_000);
  const restarted = await startBroadcast(client);
  assert.equal(restarted.started_at, at(20_000).toISOString());
  assert.notEqual(restarted.started_at, at(1_000).toISOString());
});

test('migration and API wiring preserve PostgreSQL authority and authentication boundaries', async () => {
  const [migration, server] = await Promise.all([
    fs.readFile(new URL('../migrations/002_broadcast_master_clock.sql', import.meta.url), 'utf8'),
    fs.readFile(new URL('../server.js', import.meta.url), 'utf8')
  ]);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS broadcast_programs/);
  assert.match(migration, /queue_position INTEGER NOT NULL UNIQUE CHECK \(queue_position > 0\)/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS broadcast_clock/);
  assert.match(migration, /started_at TIMESTAMPTZ/);
  assert.match(migration, /VALUES \(TRUE,NULL\)/);

  const publicStart = server.indexOf("app.get('/api/broadcast'");
  const publicEnd = server.indexOf("app.get('/api/me'", publicStart);
  const publicRoute = server.slice(publicStart, publicEnd);
  assert.match(publicRoute, /Cache-Control', 'no-store/);
  assert.doesNotMatch(publicRoute, /requireAdmin/);
  for (const route of [
    "app.get('/api/admin/programs', requireAdmin",
    "app.put('/api/admin/programs', requireAdmin",
    "app.post('/api/admin/broadcast/start', requireAdmin",
    "app.post('/api/admin/broadcast/stop', requireAdmin"
  ]) assert.ok(server.includes(route));
  assert.match(server, /BROADCAST_PROGRAMS_REPLACED/);
  assert.match(server, /BROADCAST_STARTED/);
  assert.match(server, /BROADCAST_STOPPED/);

  const configStart = server.indexOf("app.put('/api/admin/config'");
  const configEnd = server.indexOf('\nasync function start()', configStart);
  assert.doesNotMatch(server.slice(configStart, configEnd), /broadcast_clock|startBroadcast|stopBroadcast/);
});

const integrationUrl = process.env.TEST_DATABASE_URL || '';

test('PostgreSQL persists the queue and anchor while enforcing mutation safety', {
  skip: integrationUrl ? false : 'set TEST_DATABASE_URL to run disposable broadcast integration'
}, async () => {
  const { Pool } = pg;
  const database = new Pool({ connectionString: integrationUrl });
  const schemaName = `broadcast_test_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const client = await database.connect();
  const transaction = async operation => {
    await client.query('BEGIN');
    try {
      const result = await operation();
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  };
  try {
    await client.query(`CREATE SCHEMA ${schemaName}`);
    await client.query(`SET search_path TO ${schemaName}`);
    await client.query(await fs.readFile(
      new URL('../migrations/002_broadcast_master_clock.sql', import.meta.url),
      'utf8'
    ));

    await transaction(() => replaceBroadcastPrograms(client, programs));
    const firstStart = await transaction(() => startBroadcast(client));
    const firstAnchor = firstStart.started_at;

    await assert.rejects(
      () => transaction(() => startBroadcast(client)),
      error => error.code === 'BROADCAST_ALREADY_RUNNING'
    );
    const unchangedAfterStart = await client.query(
      'SELECT started_at FROM broadcast_clock WHERE singleton=TRUE'
    );
    assert.equal(unchangedAfterStart.rows[0].started_at.toISOString(), firstAnchor);

    await assert.rejects(
      () => transaction(() => replaceBroadcastPrograms(client, [{ ...programs[0], title: 'Unsafe live edit' }])),
      error => error.code === 'BROADCAST_RUNNING_EDIT_FORBIDDEN'
    );
    const unchangedPrograms = await client.query(
      'SELECT id,title FROM broadcast_programs ORDER BY queue_position'
    );
    assert.deepEqual(unchangedPrograms.rows, programs.map(program => ({ id: program.id, title: program.title })));

    await client.query(
      "UPDATE broadcast_clock SET started_at=clock_timestamp() - INTERVAL '37 seconds' WHERE singleton=TRUE"
    );
    const wrapped = await readBroadcastState(client);
    assert.equal(wrapped.current_program_id, 'program-a');
    assert.ok(wrapped.elapsed >= 1_000 && wrapped.elapsed < 2_000);

    await client.query('CREATE TABLE unrelated_presentation(value TEXT NOT NULL)');
    await client.query("INSERT INTO unrelated_presentation(value) VALUES('before')");
    const beforePresentationWrite = await client.query(
      'SELECT started_at FROM broadcast_clock WHERE singleton=TRUE'
    );
    await client.query("UPDATE unrelated_presentation SET value='after'");
    const afterPresentationWrite = await client.query(
      'SELECT started_at FROM broadcast_clock WHERE singleton=TRUE'
    );
    assert.equal(
      afterPresentationWrite.rows[0].started_at.toISOString(),
      beforePresentationWrite.rows[0].started_at.toISOString()
    );

    await transaction(() => stopBroadcast(client));
    assert.equal((await readBroadcastState(client)).status, 'off_air');
    const restarted = await transaction(() => startBroadcast(client));
    assert.ok(Date.parse(restarted.started_at) > Date.parse(beforePresentationWrite.rows[0].started_at));
  } finally {
    await client.query('SET search_path TO public');
    await client.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    client.release();
    await database.end();
  }
});
