import crypto from 'node:crypto';

export const DISPOSABLE_TEST_DATABASE_NAME = 'frnn_integration_test';
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);
const ownedSchemas = new Set();

export class TestDatabaseSafetyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TestDatabaseSafetyError';
  }
}

function normalizedHostname(url) {
  return url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
}

function databaseName(url) {
  return decodeURIComponent(url.pathname.replace(/^\//, ''));
}

export function validateDisposableTestDatabaseUrl(value, { allowOwnedSchema = false } = {}) {
  if (!value || !String(value).trim()) {
    throw new TestDatabaseSafetyError('TEST_DATABASE_URL is required for PostgreSQL-dependent automated tests.');
  }
  let url;
  try {
    url = new URL(String(value));
  } catch {
    throw new TestDatabaseSafetyError('TEST_DATABASE_URL must be a valid PostgreSQL URL.');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new TestDatabaseSafetyError('TEST_DATABASE_URL must use the postgres or postgresql protocol.');
  }
  if (!LOOPBACK_HOSTS.has(normalizedHostname(url))) {
    throw new TestDatabaseSafetyError('Automated PostgreSQL tests require a loopback database host.');
  }
  if (databaseName(url) !== DISPOSABLE_TEST_DATABASE_NAME) {
    throw new TestDatabaseSafetyError(`Automated PostgreSQL tests require database ${DISPOSABLE_TEST_DATABASE_NAME}.`);
  }

  const options = url.searchParams.get('options') || '';
  const searchPathMatch = /(?:^|\s)-c\s+search_path=([a-z][a-z0-9_]*)(?:,public)?(?:\s|$)/i.exec(options);
  if (searchPathMatch) {
    if (!allowOwnedSchema || !ownedSchemas.has(searchPathMatch[1])) {
      throw new TestDatabaseSafetyError('A schema-scoped test URL must name a schema created by this test process.');
    }
  } else if (/search_path/i.test(options)) {
    throw new TestDatabaseSafetyError('TEST_DATABASE_URL contains an unsupported search_path option.');
  }
  return url;
}

export function optionalDisposableTestDatabaseUrl(environment = process.env) {
  const value = String(environment.TEST_DATABASE_URL || '').trim();
  if (!value) return '';
  return validateDisposableTestDatabaseUrl(value).toString();
}

export async function assertDisposableDatabaseConnection(client, configuredUrl) {
  validateDisposableTestDatabaseUrl(configuredUrl);
  const result = await client.query(
    'SELECT current_database() AS database_name, inet_server_addr()::text AS server_address'
  );
  const identity = result.rows[0] || {};
  if (identity.database_name !== DISPOSABLE_TEST_DATABASE_NAME) {
    throw new TestDatabaseSafetyError('Connected PostgreSQL database does not match the approved disposable database.');
  }
  return identity;
}

export async function createOwnedTestSchema(client, configuredUrl, prefix) {
  if (!/^[a-z][a-z0-9_]{1,24}$/.test(prefix)) {
    throw new TestDatabaseSafetyError('Disposable schema prefix is invalid.');
  }
  await assertDisposableDatabaseConnection(client, configuredUrl);
  const schema = `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`;
  await client.query(`CREATE SCHEMA "${schema}"`);
  ownedSchemas.add(schema);
  try {
    const created = await client.query('SELECT 1 FROM pg_namespace WHERE nspname=$1', [schema]);
    if (created.rowCount !== 1) {
      throw new TestDatabaseSafetyError('Disposable schema creation could not be verified.');
    }
  } catch (error) {
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`).catch(() => {});
    ownedSchemas.delete(schema);
    throw error;
  }
  return schema;
}

export function scopedDisposableTestDatabaseUrl(configuredUrl, schema, { includePublic = true } = {}) {
  if (!ownedSchemas.has(schema)) {
    throw new TestDatabaseSafetyError('Cannot scope a connection to a schema not owned by this test process.');
  }
  const url = validateDisposableTestDatabaseUrl(configuredUrl);
  url.searchParams.set('options', `-c search_path=${schema}${includePublic ? ',public' : ''}`);
  return validateDisposableTestDatabaseUrl(url.toString(), { allowOwnedSchema: true }).toString();
}

export async function dropOwnedTestSchema(client, configuredUrl, schema) {
  if (!ownedSchemas.has(schema)) {
    throw new TestDatabaseSafetyError('Refusing to drop a schema not owned by this test process.');
  }
  await assertDisposableDatabaseConnection(client, configuredUrl);
  await client.query('SET search_path TO public');
  const before = await client.query('SELECT 1 FROM pg_namespace WHERE nspname=$1', [schema]);
  if (before.rowCount !== 1) {
    throw new TestDatabaseSafetyError('Owned disposable schema was missing before cleanup.');
  }
  await client.query(`DROP SCHEMA "${schema}" CASCADE`);
  const after = await client.query('SELECT 1 FROM pg_namespace WHERE nspname=$1', [schema]);
  if (after.rowCount !== 0) {
    throw new TestDatabaseSafetyError('Disposable schema cleanup could not be verified.');
  }
  ownedSchemas.delete(schema);
}

export function disposableDatabaseChildEnvironment(
  scopedUrl,
  overrides = {},
  inheritedEnvironment = process.env
) {
  const selected = validateDisposableTestDatabaseUrl(scopedUrl, { allowOwnedSchema: true }).toString();
  const environment = { ...inheritedEnvironment, ...overrides };
  for (const name of [
    'PGOPTIONS', 'PGDATABASE', 'PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGSERVICE', 'PGSERVICEFILE'
  ]) delete environment[name];
  Object.assign(environment, {
    NODE_ENV: 'test',
    DATABASE_URL: selected,
    TEST_DATABASE_URL: selected,
    PGSSL: 'false'
  });
  return environment;
}

export function ownedTestSchemaCount() {
  return ownedSchemas.size;
}
