import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, migrate } from '../db.js';
import { normalizeAccessCode } from '../lib.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(process.argv[2] || path.resolve(__dirname, '../data/access_codes.local.csv'));
let text;
try {
  text = await fs.readFile(file, 'utf8');
} catch (error) {
  if (error.code === 'ENOENT') {
    throw new Error(`Private access-code inventory not found at ${file}. Generate a local file or pass an explicit private CSV path.`);
  }
  throw error;
}
await migrate();
const lines = text.split(/\r?\n/).filter(Boolean);
let inserted = 0;
for (let i = 1; i < lines.length; i += 1) {
  const first = lines[i].split(',')[0];
  const code = normalizeAccessCode(first);
  if (!code) continue;
  const result = await pool.query('INSERT INTO access_codes(code) VALUES($1) ON CONFLICT (code) DO NOTHING', [code]);
  inserted += result.rowCount;
}
console.log(`Imported ${inserted} new access codes from ${file}`);
await pool.end();
