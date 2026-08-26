import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import pg from 'pg';
import {
  createOwnedTestSchema,
  dropOwnedTestSchema,
  optionalDisposableTestDatabaseUrl
} from '../test-support/disposable-postgres.js';
import {
  DEFAULT_EVENT_ID,
  DEFAULT_EVENT_SLUG,
  safeThemeTokens,
  publicEvent
} from '../events.js';
import { PLAYER_SHELL_ROUTE, ownerProfileView } from '../player-shell.js';
import {
  normalizeDisplayName,
  normalizedDisplayNameKey,
  isDisplayNameConflict,
  upsertPlayerProfile
} from '../player-profiles.js';

const read = relative => fs.readFile(new URL(relative, import.meta.url), 'utf8');

test('default event and branding projection are explicit and executable theme values are rejected', () => {
  assert.equal(DEFAULT_EVENT_ID, 1);
  assert.equal(DEFAULT_EVENT_SLUG, 'as-above-so-below');
  assert.deepEqual(safeThemeTokens({
    accent: '#ff3eb5',
    panel: 'rgb(12, 8, 16)',
    background: 'url(javascript:alert(1))',
    arbitrary: '#ffffff'
  }), { panel: 'rgb(12, 8, 16)', accent: '#ff3eb5' });
  assert.deepEqual(publicEvent({
    id: '1', slug: 'as-above-so-below', timezone: 'America/New_York',
    festival_name: 'As Above So Below', festival_short_name: 'AASB',
    network_name: 'Fried Rice News Network', network_short_name: 'FRNN',
    show_name: 'Fried News', theme_json: { accent: '#ff3eb5' }
  }), {
    id: 1, slug: 'as-above-so-below', timezone: 'America/New_York',
    festivalName: 'As Above So Below', festivalShortName: 'AASB',
    networkName: 'Fried Rice News Network', networkShortName: 'FRNN',
    showName: 'Fried News', theme: { accent: '#ff3eb5' }
  });
});

test('display names collapse whitespace and compare case-insensitively while preserving presentation case', () => {
  assert.equal(normalizeDisplayName('  Mothman   Mike  '), 'Mothman Mike');
  assert.equal(normalizedDisplayNameKey('Mothman Mike'), 'mothman mike');
  assert.equal(normalizedDisplayNameKey('  MOTHMAN   MIKE '), 'mothman mike');
  assert.equal(normalizeDisplayName('Éowyn'), 'Éowyn');
  assert.equal(isDisplayNameConflict({ code: '23505', constraint: 'player_profiles_event_display_name_unique' }), true);
  assert.equal(isDisplayNameConflict({ code: '23505', constraint: 'some_other_unique' }), false);
});

test('near-concurrent normalized-name claims allow exactly one player in the closest in-memory harness', async () => {
  const names = new Map();
  const client = { async query(sql, values) {
    assert.match(String(sql), /INSERT INTO player_profiles/);
    await new Promise(resolve => setTimeout(resolve, 5));
    const key = normalizedDisplayNameKey(values[1]);
    const owner = names.get(key);
    if (owner && owner !== values[0]) {
      const error = new Error('duplicate key');
      error.code = '23505';
      error.constraint = 'player_profiles_event_display_name_unique';
      throw error;
    }
    names.set(key, values[0]);
    return { rows: [{ code: values[0], display_name: values[1] }] };
  }};
  const results = await Promise.allSettled([
    upsertPlayerProfile(client, 'AAA111', { displayName: 'Mothman Mike', contactInfo: '', notes: '' }),
    upsertPlayerProfile(client, 'BBB222', { displayName: '  MOTHMAN   MIKE ', contactInfo: '', notes: '' })
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  const rejected = results.find(result => result.status === 'rejected');
  assert.equal(isDisplayNameConflict(rejected.reason), true);
});

test('numbered migration seeds the event, backfills all current domains, and enforces event-name uniqueness', async () => {
  const migration = await read('../migrations/001_frnn_event_foundation.sql');
  for (const table of [
    'access_codes', 'players', 'visits', 'video_answers', 'final_reflections',
    'quick_start_claims', 'player_profiles', 'player_profile_versions', 'app_settings'
  ]) assert.match(migration, new RegExp(`'${table}'`));
  assert.match(migration, /As Above So Below/);
  assert.match(migration, /Fried Rice News Network/);
  assert.match(migration, /Fried News/);
  assert.match(migration, /normalized_display_name TEXT[\s\S]+GENERATED ALWAYS AS/);
  assert.match(migration, /LOWER\(REGEXP_REPLACE\(BTRIM\(display_name\)/);
  assert.match(migration, /UNIQUE INDEX IF NOT EXISTS player_profiles_event_display_name_unique/);
  assert.match(migration, /duplicate normalized player names require operator review/);
});

test('migration runner applies ordered SQL files once under a database advisory lock', async () => {
  const db = await read('../db.js');
  assert.match(db, /numberedMigrationFiles/);
  assert.match(db, /\.sort\(\)/);
  assert.match(db, /pg_advisory_lock/);
  assert.match(db, /CREATE TABLE IF NOT EXISTS schema_migrations/);
  assert.match(db, /SELECT name FROM schema_migrations WHERE name=\$1/);
  assert.match(db, /INSERT INTO schema_migrations\(name\)/);
  assert.match(db, /ROLLBACK/);
});

test('owner profile projection exposes only name, avatar placeholder, private code, and quest summary', () => {
  const projection = ownerProfileView({
    profile: { display_name: 'Mothman Mike', contact_info: 'private@example.test', notes: 'operator only' },
    player: { accessCode: 'ABC-123', videoAnswerCount: 2, finalReflection: { accepted: false } }
  });
  assert.deepEqual(projection, {
    displayName: 'Mothman Mike', avatarUrl: null, accessCode: 'ABC-123',
    quest: { completed: 2, total: 4, finalComplete: false }
  });
  assert.doesNotMatch(JSON.stringify(projection), /private@example|operator only|contact|notes|history/i);
});

test('player shell is event-branded, mobile-first, and limited to four foundation destinations', async () => {
  const [html, server] = await Promise.all([read('../public/player.html'), read('../server.js')]);
  assert.equal(PLAYER_SHELL_ROUTE, '/player');
  assert.match(server, /app\.get\(PLAYER_SHELL_ROUTE/);
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /min-height:100dvh/);
  assert.deepEqual([...html.matchAll(/data-screen="([^"]+)"/g)].map(match => match[1]), [
    'news', 'upload', 'info', 'profile'
  ]);
  assert.match(html, /fetch\('\/api\/event'/);
  assert.match(html, /fetch\('\/api\/player-profile'/);
  assert.match(html, /event\.festivalName/);
  assert.match(html, /event\.networkName/);
  assert.match(html, /event\.showName/);
  assert.match(html, /NEWS FEED COMING ONLINE/);
  assert.match(html, /FIELD REPORTING COMING ONLINE/);
  assert.match(html, /OFFICIAL FESTIVAL INFORMATION WILL APPEAR HERE/);
  assert.doesNotMatch(html, /input[^>]+type="file"|FormData|\/display\/|BREAKING NEWS|EMERGENCY/);
});

test('QuickStart enters the player shell and returns a friendly conflict without changing code ownership', async () => {
  const server = await read('../server.js');
  const start = server.indexOf('app.get(QUICK_START_ROUTE');
  const end = server.indexOf("app.get('/healthz'", start);
  const quickStart = server.slice(start, end);
  assert.match(quickStart, /redirect\(302, PLAYER_SHELL_ROUTE\)/);
  assert.equal((quickStart.match(/redirect: PLAYER_SHELL_ROUTE/g) || []).length, 3);
  assert.match(quickStart, /isDisplayNameConflict\(error\)/);
  assert.match(quickStart, /status\(409\)/);
  assert.match(quickStart, /THAT NAME IS ALREADY ON THE NETWORK/);
  assert.doesNotMatch(quickStart, /req\.body\?\.accessCode/);
});

test('player-owned profile API is cookie-authorized and never selects private profile fields', async () => {
  const server = await read('../server.js');
  const start = server.indexOf("app.get('/api/player-profile'");
  const end = server.indexOf("app.post('/api/access'", start);
  const endpoint = server.slice(start, end);
  assert.match(endpoint, /parseCookies\(req\)\[COOKIE_NAME\]/);
  assert.match(endpoint, /SELECT display_name FROM player_profiles WHERE code=\$1/);
  assert.match(endpoint, /ownerProfileView/);
  assert.match(endpoint, /Cache-Control', 'no-store, private/);
  assert.doesNotMatch(endpoint, /contact_info|notes|player_profile_versions|req\.params|req\.body/);
});

test('stable quest routes and final transition behavior remain unchanged', async () => {
  const server = await read('../server.js');
  const station = await read('../public/station.html');
  assert.match(server, /app\.get\(STATION_ROUTES/);
  assert.match(server, /app\.get\(START_END_ROUTE/);
  assert.match(server, /app\.post\('\/api\/scan\/:station'/);
  assert.match(server, /app\.post\('\/api\/response\/:station'/);
  assert.match(server, /app\.post\('\/api\/final-reflection'/);
  assert.doesNotMatch(station, /automaticFinalTransition|\/player|PLAYER HOME/);
});

const integrationUrl = optionalDisposableTestDatabaseUrl();

test('PostgreSQL migration backfills legacy rows idempotently and serializes duplicate normalized names', {
  skip: integrationUrl ? false : 'set TEST_DATABASE_URL to run disposable PostgreSQL integration'
}, async () => {
  const { Pool } = pg;
  const pool = new Pool({ connectionString: integrationUrl });
  let schemaName;
  const client = await pool.connect();
  try {
    schemaName = await createOwnedTestSchema(client, integrationUrl, 'frnn_test');
    await client.query(`SET search_path TO ${schemaName}`);
    await client.query(await read('../schema.sql'));
    await client.query("INSERT INTO access_codes(code,status) VALUES('AAA111','active'),('BBB222','active')");
    await client.query("INSERT INTO players(code) VALUES('AAA111'),('BBB222')");
    await client.query("INSERT INTO player_profiles(code,display_name) VALUES('AAA111','First Player')");
    const migration = await read('../migrations/001_frnn_event_foundation.sql');
    await client.query(migration);
    await client.query(migration);
    const backfill = await client.query("SELECT event_id,normalized_display_name FROM player_profiles WHERE code='AAA111'");
    assert.deepEqual(backfill.rows[0], { event_id: '1', normalized_display_name: 'first player' });
    const secondClient = await pool.connect();
    try {
      await secondClient.query(`SET search_path TO ${schemaName}`);
      const results = await Promise.allSettled([
        client.query("INSERT INTO player_profiles(code,display_name) VALUES('BBB222',' MOTHMAN   MIKE ')")
          .then(() => 'first'),
        secondClient.query("INSERT INTO player_profiles(code,display_name,event_id) VALUES('AAA111','mothman mike',1) ON CONFLICT (code) DO UPDATE SET display_name=EXCLUDED.display_name")
          .then(() => 'second')
      ]);
      assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
      const rejected = results.find(result => result.status === 'rejected');
      assert.equal(rejected.reason.code, '23505');
      assert.equal(rejected.reason.constraint, 'player_profiles_event_display_name_unique');
    } finally {
      secondClient.release();
    }
  } finally {
    if (schemaName) await dropOwnedTestSchema(client, integrationUrl, schemaName);
    client.release();
    await pool.end();
  }
});
