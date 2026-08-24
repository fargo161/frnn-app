import pg from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ssl = String(process.env.PGSSL || '').toLowerCase() === 'true'
  ? { rejectUnauthorized: false }
  : undefined;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    (process.env.NODE_ENV === 'test' ? process.env.TEST_DATABASE_URL : undefined),
  ssl,
  max: Number(process.env.PG_POOL_MAX || 12),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

const MIGRATION_LOCK = 'festival_network_schema_migrations';

export async function numberedMigrationFiles() {
  const directory = path.join(__dirname, 'migrations');
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  return entries
    .filter(entry => entry.isFile() && /^\d{3}_[a-z0-9_-]+\.sql$/i.test(entry.name))
    .map(entry => entry.name)
    .sort();
}

export async function migrate() {
  const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [MIGRATION_LOCK]);
    await client.query(schema);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    for (const name of await numberedMigrationFiles()) {
      const applied = await client.query('SELECT name FROM schema_migrations WHERE name=$1', [name]);
      if (applied.rows[0]) continue;
      const sql = await fs.readFile(path.join(__dirname, 'migrations', name), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(hashtext($1))', [MIGRATION_LOCK]).catch(() => {});
    client.release();
  }
}

export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function healthCheck() {
  const result = await pool.query('SELECT NOW() AS now');
  return result.rows[0].now;
}
