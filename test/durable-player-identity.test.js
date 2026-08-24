import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import pg from 'pg';
import { claimQuickStartCode } from '../quick-start.js';
import {
  ISSUE_NEXT_CANDIDATE_SQL,
  ensurePlayerIdentity,
  issueNextUnclaimedCode,
  resetGameplay,
  releasePlayerIdentity
} from '../player-identity.js';

const read = relative => fs.readFile(new URL(relative, import.meta.url), 'utf8');
const compact = sql => String(sql).replace(/\s+/g, ' ').trim();

class IdentityMemoryClient {
  constructor(rows) {
    this.access = new Map(rows.map(row => [row.code, {
      status: 'unused', allocated_at: null, activated_at: null, claimed_at: null,
      is_test: false, ...row
    }]));
    this.players = new Map();
    this.profiles = new Map();
    this.profileVersions = new Map();
    this.visits = new Map();
    this.answers = new Map();
    this.finals = new Map();
    this.claims = new Map();
    this.prizes = new Map();
  }

  accessRow(code) {
    const row = this.access.get(code);
    return row ? { code, ...row } : null;
  }

  async query(sql, values = []) {
    const statement = compact(sql);

    if (statement.startsWith('INSERT INTO quick_start_claims')) {
      if (!this.claims.has(values[0])) this.claims.set(values[0], null);
      return { rows: [] };
    }
    if (statement.startsWith('SELECT code FROM quick_start_claims')) {
      return { rows: [{ code: this.claims.get(values[0]) || null }] };
    }
    if (statement.startsWith('UPDATE quick_start_claims SET code=')) {
      this.claims.set(values[0], values[1]);
      return { rows: [] };
    }
    if (statement.includes('FROM access_codes') && statement.includes('FOR UPDATE SKIP LOCKED')) {
      const candidate = [...this.access.entries()]
        .filter(([, row]) => row.status === 'unused' && row.allocated_at === null && row.claimed_at === null && !row.is_test)
        .sort(([left], [right]) => left.localeCompare(right))[0];
      return { rows: candidate ? [{ code: candidate[0] }] : [] };
    }
    if (statement.startsWith('UPDATE access_codes SET allocated_at=COALESCE')) {
      const row = this.access.get(values[0]);
      row.allocated_at ||= new Date();
      return { rows: [] };
    }
    if (statement.startsWith('UPDATE access_codes SET allocated_at=NOW()')) {
      const row = this.access.get(values[0]);
      row.allocated_at = new Date();
      row.activated_at = null;
      return { rows: [] };
    }
    if (statement.startsWith('SELECT code,status,allocated_at,activated_at,claimed_at,is_test FROM access_codes')) {
      const row = this.accessRow(values[0]);
      return { rows: row ? [row] : [] };
    }
    if (statement.startsWith('INSERT INTO players')) {
      if (!this.players.has(values[0])) this.players.set(values[0], { created_at: new Date(), updated_at: new Date() });
      return { rows: [] };
    }
    if (statement.startsWith("UPDATE access_codes SET status='active'")) {
      const row = this.access.get(values[0]);
      row.status = 'active';
      row.activated_at ||= new Date();
      if (!row.is_test) row.claimed_at ||= new Date();
      return { rows: [this.accessRow(values[0])] };
    }
    if (statement.startsWith('SELECT code FROM players')) {
      return { rows: this.players.has(values[0]) ? [{ code: values[0] }] : [] };
    }
    if (statement.startsWith('DELETE FROM visits')) {
      this.visits.delete(values[0]);
      return { rows: [] };
    }
    if (statement.startsWith('DELETE FROM video_answers')) {
      this.answers.delete(values[0]);
      return { rows: [] };
    }
    if (statement.startsWith('DELETE FROM final_reflections')) {
      this.finals.delete(values[0]);
      return { rows: [] };
    }
    if (statement.startsWith('UPDATE players SET updated_at')) {
      const player = this.players.get(values[0]);
      if (player) player.updated_at = new Date();
      return { rows: [] };
    }
    if (statement.startsWith('DELETE FROM quick_start_claims')) {
      for (const [token, code] of this.claims) if (code === values[0]) this.claims.delete(token);
      return { rows: [] };
    }
    if (statement.startsWith('DELETE FROM prize_draws')) {
      this.prizes.delete(values[0]);
      return { rows: [] };
    }
    if (statement.startsWith('DELETE FROM player_profile_versions')) {
      this.profileVersions.delete(values[0]);
      return { rows: [] };
    }
    if (statement.startsWith('DELETE FROM player_profiles')) {
      this.profiles.delete(values[0]);
      return { rows: [] };
    }
    if (statement.startsWith('DELETE FROM players')) {
      this.players.delete(values[0]);
      this.visits.delete(values[0]);
      this.answers.delete(values[0]);
      this.finals.delete(values[0]);
      return { rows: [] };
    }
    if (statement.startsWith("UPDATE access_codes SET status='unused'")) {
      const row = this.access.get(values[0]);
      row.status = 'unused';
      row.allocated_at = null;
      row.activated_at = null;
      row.claimed_at = null;
      return { rows: [] };
    }
    throw new Error(`Unexpected query: ${statement}`);
  }
}

test('Player A reset cannot transfer identity, recovery survives, and only explicit release returns it', async () => {
  const client = new IdentityMemoryClient([
    { code: 'AAA111' }, { code: 'BBB222' }, { code: 'CCC333' }
  ]);

  const claimA = await claimQuickStartCode(client, 'token-a');
  assert.equal(claimA.code, 'AAA111');
  await ensurePlayerIdentity(client, claimA.code);
  const originalClaimedAt = client.access.get('AAA111').claimed_at;
  client.profiles.set('AAA111', { display_name: 'PLAYER A' });
  client.profileVersions.set('AAA111', [{ display_name: 'OLDER A' }]);
  client.visits.set('AAA111', [{ station: 'escape' }]);
  client.answers.set('AAA111', [{ station: 'escape' }]);
  client.finals.set('AAA111', { accepted: true });
  client.prizes.set('AAA111', [{ id: 1 }]);

  await resetGameplay(client, 'AAA111');
  assert.equal(client.access.get('AAA111').claimed_at, originalClaimedAt);
  assert.equal(client.access.get('AAA111').status, 'active');
  assert.equal(client.profiles.get('AAA111').display_name, 'PLAYER A');
  assert.equal(client.profileVersions.get('AAA111').length, 1);
  assert.equal(client.prizes.get('AAA111').length, 1);
  assert.equal(client.claims.get('token-a'), 'AAA111');
  assert.equal(client.visits.has('AAA111'), false);
  assert.equal(client.answers.has('AAA111'), false);
  assert.equal(client.finals.has('AAA111'), false);

  await resetGameplay(client, 'AAA111');
  assert.equal(client.access.get('AAA111').claimed_at, originalClaimedAt);
  assert.equal(client.claims.get('token-a'), 'AAA111');

  const claimB = await claimQuickStartCode(client, 'token-b');
  assert.equal(claimB.code, 'BBB222');
  await ensurePlayerIdentity(client, claimB.code);
  assert.notEqual(claimB.code, claimA.code);
  assert.equal(client.profiles.has(claimB.code), false);

  const issued = await issueNextUnclaimedCode(client);
  assert.equal(issued, 'CCC333');
  assert.notEqual(issued, claimA.code);

  const recoveredA = await claimQuickStartCode(client, 'token-a');
  assert.deepEqual(recoveredA, { code: 'AAA111', reused: true });
  await ensurePlayerIdentity(client, recoveredA.code);
  assert.equal(client.access.get('AAA111').claimed_at, originalClaimedAt);
  assert.equal(client.profiles.get('AAA111').display_name, 'PLAYER A');

  assert.deepEqual(await releasePlayerIdentity(client, 'AAA111'), { released: true });
  assert.equal(client.players.has('AAA111'), false);
  assert.equal(client.profiles.has('AAA111'), false);
  assert.equal(client.profileVersions.has('AAA111'), false);
  assert.equal(client.prizes.has('AAA111'), false);
  assert.equal(client.claims.has('token-a'), false);
  assert.equal(client.access.get('AAA111').claimed_at, null);

  assert.equal(await issueNextUnclaimedCode(client), 'AAA111');
});

test('owned credentials stay excluded even if non-ownership lifecycle fields look unused', async () => {
  const client = new IdentityMemoryClient([
    { code: 'AAA111', status: 'unused', allocated_at: null, activated_at: null, claimed_at: new Date() },
    { code: 'BBB222' }
  ]);
  assert.match(ISSUE_NEXT_CANDIDATE_SQL, /claimed_at IS NULL/);
  assert.equal(await issueNextUnclaimedCode(client), 'BBB222');
});

test('repeat identity activation preserves the first durable claim timestamp', async () => {
  const client = new IdentityMemoryClient([{ code: 'AAA111' }]);
  await ensurePlayerIdentity(client, 'AAA111');
  const first = client.access.get('AAA111').claimed_at;
  await ensurePlayerIdentity(client, 'AAA111');
  assert.equal(client.access.get('AAA111').claimed_at, first);
  assert.equal(client.players.size, 1);
});

test('test fixtures remain reusable and cannot enter production allocation', async () => {
  const client = new IdentityMemoryClient([
    { code: 'TEST01', is_test: true }, { code: 'AAA111' }
  ]);
  await ensurePlayerIdentity(client, 'TEST01');
  assert.equal(client.access.get('TEST01').claimed_at, null);
  client.visits.set('TEST01', [{ station: 'escape' }]);
  await resetGameplay(client, 'TEST01');
  assert.equal(client.access.get('TEST01').status, 'unused');
  assert.equal(client.visits.has('TEST01'), false);
  assert.equal(await issueNextUnclaimedCode(client), 'AAA111');
  assert.deepEqual(await releasePlayerIdentity(client, 'TEST01'), {
    error: 'TEST_IDENTITY_RELEASE_NOT_ALLOWED', status: 409
  });
});

test('server release is privileged, exactly confirmed, destructive, and audited while reset is non-releasing', async () => {
  const [server, identity, admin] = await Promise.all([
    read('../server.js'), read('../player-identity.js'), read('../public/admin.html')
  ]);
  const resetStart = server.indexOf("app.post('/api/admin/player/:accessCode/reset'");
  const resetEnd = server.indexOf("app.put('/api/admin/player/:accessCode/visits'", resetStart);
  const reset = server.slice(resetStart, resetEnd);
  const releaseStart = server.indexOf("app.delete('/api/admin/player/:accessCode/identity'");
  const releaseEnd = server.indexOf("app.get('/api/admin/tests'", releaseStart);
  const release = server.slice(releaseStart, releaseEnd);

  assert.match(reset, /resetGameplay\(client, code\)/);
  assert.doesNotMatch(reset, /releasePlayerIdentity|PLAYER_IDENTITY_RELEASED/);
  assert.match(release, /requireAdmin/);
  assert.match(release, /confirmation !== code/);
  assert.match(release, /releasePlayerIdentity\(client, code\)/);
  assert.match(release, /PLAYER_IDENTITY_RELEASED/);
  assert.match(identity, /DELETE FROM player_profiles/);
  assert.match(identity, /DELETE FROM players/);
  assert.match(identity, /claimed_at=NULL/);
  assert.match(admin, /DELETE PLAYER IDENTITY \+ RELEASE CREDENTIAL/);
  assert.match(admin, /window\.prompt/);
  assert.match(admin, /Type \$\{currentCode\} to confirm/);
});

test('empty route repair delegates to gameplay reset instead of becoming a hidden release path', async () => {
  const server = await read('../server.js');
  const start = server.indexOf("app.put('/api/admin/player/:accessCode/visits'");
  const end = server.indexOf("app.delete('/api/admin/player/:accessCode/identity'", start);
  const repair = server.slice(start, end);
  assert.match(repair, /if \(stations\.length\)[\s\S]*else \{[\s\S]*resetGameplay\(client, code\)/);
  assert.doesNotMatch(repair, /claimed_at=NULL|DELETE FROM quick_start_claims|status='unused'/);
});

test('credential generation and import are private-by-default with no tracked live fallback', async () => {
  const [ignore, generator, importer, example] = await Promise.all([
    read('../.gitignore'), read('../scripts/generate-codes.js'),
    read('../scripts/import-codes.js'), read('../data/access_codes.example.csv')
  ]);
  assert.match(ignore, /data\/access_codes\.local\.csv/);
  assert.match(ignore, /data\/access_codes_\*\.private\.csv/);
  assert.match(generator, /access_codes\.local\.csv/);
  assert.match(importer, /access_codes\.local\.csv/);
  assert.doesNotMatch(importer, /access_codes\.csv['"]/);
  assert.match(importer, /Private access-code inventory not found/);
  assert.equal(example, 'code,status\n');
});

test('Mission Control inventory count uses the same never-owned availability boundary', async () => {
  const server = await read('../server.js');
  const start = server.indexOf("app.get('/api/admin/summary'");
  const end = server.indexOf("app.get('/api/admin/active-receivers'", start);
  const summary = server.slice(start, end);
  assert.match(summary, /status='unused' AND allocated_at IS NULL AND claimed_at IS NULL/);
  assert.match(summary, /COUNT\(\*\) FILTER/);
});

const integrationUrl = process.env.TEST_DATABASE_URL || '';

test('PostgreSQL migration deterministically backfills real players and leaves test fixtures unclaimed', {
  skip: integrationUrl ? false : 'set TEST_DATABASE_URL to run disposable durable-identity integration'
}, async () => {
  const { Pool } = pg;
  const pool = new Pool({ connectionString: integrationUrl });
  const schemaName = `frnn_identity_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const client = await pool.connect();
  try {
    await client.query(`CREATE SCHEMA ${schemaName}`);
    await client.query(`SET search_path TO ${schemaName}`);
    await client.query(`CREATE TABLE access_codes (
      code TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'unused',
      allocated_at TIMESTAMPTZ,
      activated_at TIMESTAMPTZ,
      is_test BOOLEAN NOT NULL DEFAULT FALSE
    )`);
    await client.query(`CREATE TABLE players (
      code TEXT PRIMARY KEY REFERENCES access_codes(code),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await client.query("INSERT INTO access_codes(code,is_test) VALUES('REAL01',FALSE),('TEST01',TRUE)");
    await client.query("INSERT INTO players(code) VALUES('REAL01'),('TEST01')");
    const migration = await read('../migrations/003_durable_player_identity.sql');
    await client.query(migration);
    await client.query(migration);
    const rows = await client.query('SELECT code,claimed_at,is_test FROM access_codes ORDER BY code');
    assert.equal(rows.rows[0].code, 'REAL01');
    assert.ok(rows.rows[0].claimed_at);
    assert.equal(rows.rows[1].code, 'TEST01');
    assert.equal(rows.rows[1].claimed_at, null);
  } finally {
    await client.query('SET search_path TO public');
    await client.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    client.release();
    await pool.end();
  }
});
