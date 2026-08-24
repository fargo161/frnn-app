import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import pg from 'pg';
import { resolveNodeAssignment } from '../node-assignments.js';
import { QR_DESTINATIONS } from '../qr-routing.js';

const read = relative => fs.readFile(new URL(relative, import.meta.url), 'utf8');
const compact = sql => String(sql).replace(/\s+/g, ' ').trim();

class AssignmentMemoryClient {
  constructor(rows = []) {
    this.assignments = rows.map(row => ({
      assignment_type: 'assigned_message',
      is_active: true,
      internal_id: `private-${row.code}-${row.node_key}`,
      created_at: '2026-08-24T12:00:00.000Z',
      ...row
    }));
    this.queries = [];
  }

  async query(sql, values = []) {
    const statement = compact(sql);
    this.queries.push({ statement, values: [...values] });
    if (/\b(?:INSERT|UPDATE|DELETE)\b/i.test(statement)) {
      throw new Error('resolver attempted to mutate assignment state');
    }
    assert.match(statement, /^SELECT assigned_message FROM node_assignments /);
    const [code, nodeKey] = values;
    const row = this.assignments.find(candidate => (
      candidate.code === code
      && candidate.node_key === nodeKey
      && candidate.assignment_type === 'assigned_message'
      && candidate.is_active === true
    ));
    return { rows: row ? [{ assigned_message: row.assigned_message }] : [] };
  }
}

test('schema and migration define the same bounded typed node-assignment model', async () => {
  const [schema, migration] = await Promise.all([
    read('../schema.sql'),
    read('../migrations/004_node_assignments.sql')
  ]);

  for (const sql of [schema, migration]) {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS node_assignments/);
    assert.match(sql, /code TEXT NOT NULL REFERENCES players\(code\) ON DELETE CASCADE/);
    assert.match(sql, /node_key TEXT NOT NULL CHECK \(node_key IN \('escape','attention','access','sensory'\)\)/);
    assert.match(sql, /assignment_type TEXT NOT NULL DEFAULT 'assigned_message'/);
    assert.match(sql, /CHECK \(assignment_type = 'assigned_message'\)/);
    assert.match(sql, /CHECK \(CHAR_LENGTH\(BTRIM\(assigned_message\)\) BETWEEN 1 AND 1000\)/);
    assert.match(sql, /is_active BOOLEAN NOT NULL DEFAULT TRUE/);
    assert.match(sql, /PRIMARY KEY \(code, node_key\)/);
    assert.doesNotMatch(sql.slice(sql.indexOf('CREATE TABLE IF NOT EXISTS node_assignments'), sql.indexOf(');', sql.indexOf('CREATE TABLE IF NOT EXISTS node_assignments'))), /JSONB?|operator|note|schedule|segment|cohort/i);
  }
});

test('same canonical node resolves different persisted messages for different players', async () => {
  const client = new AssignmentMemoryClient([
    { code: 'AAA111', node_key: 'escape', assigned_message: 'Message A' },
    { code: 'BBB222', node_key: 'escape', assigned_message: 'Message B' }
  ]);

  const playerA = await resolveNodeAssignment(client, {
    code: 'AAA111', nodeKey: 'escape', authoredDefault: 'Escape default'
  });
  const playerB = await resolveNodeAssignment(client, {
    code: 'BBB222', nodeKey: 'escape', authoredDefault: 'Escape default'
  });

  assert.deepEqual(playerA, {
    nodeKey: 'escape', source: 'assignment', assignedMessage: 'Message A'
  });
  assert.deepEqual(playerB, {
    nodeKey: 'escape', source: 'assignment', assignedMessage: 'Message B'
  });
  assert.deepEqual(client.queries.map(query => query.values), [
    ['AAA111', 'escape'], ['BBB222', 'escape']
  ]);
});

test('missing assignment falls back without creating or mutating persistent state', async () => {
  const client = new AssignmentMemoryClient([
    { code: 'BBB222', node_key: 'escape', assigned_message: 'Message B' }
  ]);
  const countBefore = client.assignments.length;

  const result = await resolveNodeAssignment(client, {
    code: 'AAA111', nodeKey: 'escape', authoredDefault: 'Escape default'
  });

  assert.deepEqual(result, {
    nodeKey: 'escape', source: 'default', assignedMessage: 'Escape default'
  });
  assert.equal(client.assignments.length, countBefore);
  assert.ok(client.queries.every(query => !/\b(?:INSERT|UPDATE|DELETE)\b/i.test(query.statement)));
});

test('inactive assignment behaves as no assignment', async () => {
  const client = new AssignmentMemoryClient([
    {
      code: 'AAA111', node_key: 'escape', assigned_message: 'Cleared message', is_active: false
    }
  ]);

  assert.deepEqual(await resolveNodeAssignment(client, {
    code: 'AAA111', nodeKey: 'escape', authoredDefault: 'Escape default'
  }), {
    nodeKey: 'escape', source: 'default', assignedMessage: 'Escape default'
  });
});

test('public projection exposes only the current player message and allowed fields', async () => {
  const client = new AssignmentMemoryClient([
    { code: 'AAA111', node_key: 'escape', assigned_message: 'Message A' },
    { code: 'BBB222', node_key: 'escape', assigned_message: 'Message B' }
  ]);

  const result = await resolveNodeAssignment(client, {
    code: 'AAA111', nodeKey: 'escape', authoredDefault: 'Escape default'
  });

  assert.deepEqual(Object.keys(result), ['nodeKey', 'source', 'assignedMessage']);
  assert.equal(JSON.stringify(result).includes('Message B'), false);
  assert.equal(JSON.stringify(result).includes('AAA111'), false);
  assert.equal(JSON.stringify(result).includes('private-'), false);
  assert.equal(JSON.stringify(result).includes('2026-08-24'), false);
});

test('assignment is isolated to its exact canonical node', async () => {
  const client = new AssignmentMemoryClient([
    { code: 'AAA111', node_key: 'escape', assigned_message: 'Message A' }
  ]);

  assert.deepEqual(await resolveNodeAssignment(client, {
    code: 'AAA111', nodeKey: 'escape', authoredDefault: 'Escape default'
  }), {
    nodeKey: 'escape', source: 'assignment', assignedMessage: 'Message A'
  });
  assert.deepEqual(await resolveNodeAssignment(client, {
    code: 'AAA111', nodeKey: 'attention', authoredDefault: 'Attention default'
  }), {
    nodeKey: 'attention', source: 'default', assignedMessage: 'Attention default'
  });
});

test('invalid node is rejected before lookup and repeated resolution is deterministic', async () => {
  const client = new AssignmentMemoryClient([
    { code: 'AAA111', node_key: 'escape', assigned_message: 'Message A' }
  ]);

  await assert.rejects(
    resolveNodeAssignment(client, {
      code: 'AAA111', nodeKey: 'personal', authoredDefault: 'Personal default'
    }),
    /Unknown canonical node key: personal/
  );
  assert.equal(client.queries.length, 0);

  const input = { code: 'AAA111', nodeKey: 'escape', authoredDefault: 'Escape default' };
  const first = await resolveNodeAssignment(client, input);
  const second = await resolveNodeAssignment(client, input);
  assert.deepEqual(second, first);
});

test('resolver integration remains Escape-only while six QR destinations and UI stay unchanged', async () => {
  assert.deepEqual(QR_DESTINATIONS.map(destination => destination.route), [
    '/s/start-end', '/s/access', '/s/attention', '/s/escape', '/s/sensory', '/quick-start'
  ]);
  const [server, station] = await Promise.all([
    read('../server.js'),
    read('../public/station.html')
  ]);
  assert.match(server, /import \{ resolveNodeAssignment \} from '\.\/node-assignments\.js'/);
  const scanStart = server.indexOf("app.post('/api/scan/:station'");
  const scanEnd = server.indexOf("app.post('/api/response/:station'", scanStart);
  const scan = server.slice(scanStart, scanEnd);
  assert.match(scan, /if \(station === 'escape'\) \{[\s\S]*resolveNodeAssignment/);
  assert.doesNotMatch(scan, /station === '(?:attention|access|sensory)'[\s\S]*resolveNodeAssignment/);
  assert.match(server, /app\.post\('\/api\/scan\/:station'/);
  assert.match(station, /startEnd\?'\/api\/start-end':`\/api\/scan\/\$\{station\}`/);
});

const integrationUrl = process.env.TEST_DATABASE_URL || '';

test('PostgreSQL enforces typed bounds and resolver precedence without writes', {
  skip: integrationUrl ? false : 'set TEST_DATABASE_URL to run disposable node-assignment integration'
}, async () => {
  const { Pool } = pg;
  const pool = new Pool({ connectionString: integrationUrl });
  const schemaName = `frnn_assignments_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const client = await pool.connect();
  try {
    await client.query(`CREATE SCHEMA ${schemaName}`);
    await client.query(`SET search_path TO ${schemaName}`);
    await client.query(`CREATE TABLE access_codes (code TEXT PRIMARY KEY)`);
    await client.query(`CREATE TABLE players (
      code TEXT PRIMARY KEY REFERENCES access_codes(code) ON DELETE CASCADE
    )`);
    const migration = await read('../migrations/004_node_assignments.sql');
    await client.query(migration);
    await client.query(migration);
    await client.query("INSERT INTO access_codes(code) VALUES('AAA111'),('BBB222')");
    await client.query("INSERT INTO players(code) VALUES('AAA111'),('BBB222')");
    await client.query(`INSERT INTO node_assignments(code,node_key,assigned_message)
      VALUES('AAA111','escape','Message A'),('BBB222','escape','Message B')`);

    assert.deepEqual(await resolveNodeAssignment(client, {
      code: 'AAA111', nodeKey: 'escape', authoredDefault: 'Escape default'
    }), {
      nodeKey: 'escape', source: 'assignment', assignedMessage: 'Message A'
    });
    assert.deepEqual(await resolveNodeAssignment(client, {
      code: 'BBB222', nodeKey: 'escape', authoredDefault: 'Escape default'
    }), {
      nodeKey: 'escape', source: 'assignment', assignedMessage: 'Message B'
    });
    assert.deepEqual(await resolveNodeAssignment(client, {
      code: 'AAA111', nodeKey: 'attention', authoredDefault: 'Attention default'
    }), {
      nodeKey: 'attention', source: 'default', assignedMessage: 'Attention default'
    });

    const countBefore = await client.query('SELECT COUNT(*)::int AS count FROM node_assignments');
    await resolveNodeAssignment(client, {
      code: 'AAA111', nodeKey: 'sensory', authoredDefault: 'Sensory default'
    });
    const countAfter = await client.query('SELECT COUNT(*)::int AS count FROM node_assignments');
    assert.equal(countAfter.rows[0].count, countBefore.rows[0].count);

    await client.query("UPDATE node_assignments SET is_active=FALSE WHERE code='AAA111' AND node_key='escape'");
    assert.deepEqual(await resolveNodeAssignment(client, {
      code: 'AAA111', nodeKey: 'escape', authoredDefault: 'Escape default'
    }), {
      nodeKey: 'escape', source: 'default', assignedMessage: 'Escape default'
    });

    for (const [sql, constraint] of [
      ["INSERT INTO node_assignments(code,node_key,assigned_message) VALUES('AAA111','personal','No')", 'node_assignments_node_key_check'],
      ["INSERT INTO node_assignments(code,node_key,assignment_type,assigned_message) VALUES('AAA111','attention','other','No')", 'node_assignments_assignment_type_check'],
      ["INSERT INTO node_assignments(code,node_key,assigned_message) VALUES('AAA111','attention','   ')", 'node_assignments_assigned_message_check']
    ]) {
      await assert.rejects(client.query(sql), error => error.code === '23514' && error.constraint === constraint);
    }
    await assert.rejects(
      client.query("INSERT INTO node_assignments(code,node_key,assigned_message) VALUES('AAA111','attention',$1)", ['x'.repeat(1001)]),
      error => error.code === '23514' && error.constraint === 'node_assignments_assigned_message_check'
    );
  } finally {
    await client.query('SET search_path TO public');
    await client.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    client.release();
    await pool.end();
  }
});
