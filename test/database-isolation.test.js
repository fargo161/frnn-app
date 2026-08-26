import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import {
  databaseUrlForEnvironment,
  databaseVariableForEnvironment
} from '../database-config.js';
import {
  DISPOSABLE_TEST_DATABASE_NAME,
  TestDatabaseSafetyError,
  assertDisposableDatabaseConnection,
  createOwnedTestSchema,
  disposableDatabaseChildEnvironment,
  dropOwnedTestSchema,
  optionalDisposableTestDatabaseUrl,
  ownedTestSchemaCount,
  scopedDisposableTestDatabaseUrl,
  validateDisposableTestDatabaseUrl
} from '../test-support/disposable-postgres.js';
import { shouldLoadOwnerTestLabSettings } from '../web-test-lab-config.js';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const ownerLookingUrl = 'postgres://owner.invalid:5432/owner_persistent';
const disposableUrl = `postgres://test:test@127.0.0.1:55432/${DISPOSABLE_TEST_DATABASE_NAME}`;
const configuredIntegrationUrl = optionalDisposableTestDatabaseUrl();

async function runNode(relativeScript, environment) {
  const child = spawn(process.execPath, [fileURLToPath(new URL(relativeScript, import.meta.url))], {
    cwd: repositoryRoot,
    env: environment,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; });
  const exitCode = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('Configuration refusal child did not exit promptly.'));
    }, 5000);
    child.once('exit', code => {
      clearTimeout(timeout);
      resolve(code);
    });
    child.once('error', reject);
  });
  return { exitCode, stdout, stderr };
}

function missingTestDatabaseEnvironment() {
  const environment = {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: ownerLookingUrl,
    ADMIN_KEY: 'database-isolation-test-only',
    MISSION_CONTROL_PASSPHRASE: 'database-isolation-passphrase-only'
  };
  delete environment.TEST_DATABASE_URL;
  for (const name of [
    'PGOPTIONS', 'PGDATABASE', 'PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGSERVICE', 'PGSERVICEFILE'
  ]) delete environment[name];
  return environment;
}

test('test mode selects only TEST_DATABASE_URL even when an owner DATABASE_URL is inherited', () => {
  const environment = {
    NODE_ENV: 'test',
    DATABASE_URL: ownerLookingUrl,
    TEST_DATABASE_URL: disposableUrl
  };
  assert.equal(databaseVariableForEnvironment(environment), 'TEST_DATABASE_URL');
  assert.equal(databaseUrlForEnvironment(environment), disposableUrl);
  assert.equal(optionalDisposableTestDatabaseUrl(environment), disposableUrl);
});

test('owner runtime selects DATABASE_URL and automated launcher mode never loads owner settings', () => {
  assert.equal(databaseUrlForEnvironment({ NODE_ENV: 'development', DATABASE_URL: ownerLookingUrl }), ownerLookingUrl);
  assert.equal(shouldLoadOwnerTestLabSettings({ NODE_ENV: 'development' }), true);
  assert.equal(shouldLoadOwnerTestLabSettings({ NODE_ENV: 'test' }), false);
});

test('disposable URL validation rejects remote, owner-named, and pre-scoped targets before mutation', () => {
  assert.equal(validateDisposableTestDatabaseUrl(disposableUrl).pathname, `/${DISPOSABLE_TEST_DATABASE_NAME}`);
  for (const value of [
    ownerLookingUrl,
    'postgres://test:test@127.0.0.1:55432/artpark',
    `${disposableUrl}?options=-c%20search_path%3Dpublic`
  ]) {
    assert.throws(
      () => validateDisposableTestDatabaseUrl(value),
      error => error instanceof TestDatabaseSafetyError
    );
  }
});

test('server refuses test mode with no TEST_DATABASE_URL instead of using inherited DATABASE_URL', async () => {
  const result = await runNode('../server.js', missingTestDatabaseEnvironment());
  assert.equal(result.exitCode, 1);
  assert.match(result.stderr, /TEST_DATABASE_URL is required for NODE_ENV=test/);
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /ECONNREFUSED|ENOTFOUND|FRNN server running/);
});

test('Test Lab launcher in test mode ignores .env.test-lab and refuses missing disposable configuration', async () => {
  const result = await runNode('../scripts/start-test-lab.js', missingTestDatabaseEnvironment());
  assert.equal(result.exitCode, 1);
  assert.match(result.stderr, /Missing required setting: TEST_DATABASE_URL/);
  assert.match(result.stderr, /approved disposable automated-test database/);
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /ECONNREFUSED|ENOTFOUND|FRNN Test Lab ready/);
});

test('shared PostgreSQL guard verifies runtime identity, sanitizes child configuration, and proves cleanup', {
  skip: configuredIntegrationUrl ? false : 'set TEST_DATABASE_URL to run disposable database isolation integration'
}, async () => {
  const { Pool } = pg;
  const adminPool = new Pool({ connectionString: configuredIntegrationUrl });
  const admin = await adminPool.connect();
  let schema;
  try {
    const identity = await assertDisposableDatabaseConnection(admin, configuredIntegrationUrl);
    assert.equal(identity.database_name, DISPOSABLE_TEST_DATABASE_NAME);
    schema = await createOwnedTestSchema(admin, configuredIntegrationUrl, 'isolation_guard');
    const scopedUrl = scopedDisposableTestDatabaseUrl(configuredIntegrationUrl, schema);
    const childEnvironment = disposableDatabaseChildEnvironment(
      scopedUrl,
      { ADMIN_KEY: 'isolation-child-only' },
      {
        ...process.env,
        DATABASE_URL: ownerLookingUrl,
        PGOPTIONS: '-c search_path=public',
        PGHOST: 'owner.invalid'
      }
    );
    assert.equal(childEnvironment.DATABASE_URL, scopedUrl);
    assert.equal(childEnvironment.TEST_DATABASE_URL, scopedUrl);
    assert.equal(childEnvironment.NODE_ENV, 'test');
    assert.equal(childEnvironment.PGOPTIONS, undefined);
    assert.equal(childEnvironment.PGHOST, undefined);
    assert.equal(ownedTestSchemaCount(), 1);

    const isolatedPool = new Pool({ connectionString: scopedUrl });
    try {
      const current = await isolatedPool.query('SELECT current_database() AS database_name,current_schema() AS schema_name');
      assert.deepEqual(current.rows[0], {
        database_name: DISPOSABLE_TEST_DATABASE_NAME,
        schema_name: schema
      });
      await isolatedPool.query('CREATE TABLE isolation_sentinel (value TEXT PRIMARY KEY)');
      await isolatedPool.query("INSERT INTO isolation_sentinel(value) VALUES('disposable-only')");
    } finally {
      await isolatedPool.end();
    }

    await assert.rejects(
      dropOwnedTestSchema(admin, configuredIntegrationUrl, 'public'),
      error => error instanceof TestDatabaseSafetyError
    );
  } finally {
    if (schema) await dropOwnedTestSchema(admin, configuredIntegrationUrl, schema);
    admin.release();
    await adminPool.end();
  }
  assert.equal(ownedTestSchemaCount(), 0);
});
