import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_TEST_LAB_HOST,
  DEFAULT_TEST_LAB_PORT,
  missingTestLabSettings,
  parseEnvFile,
  testLabStartupFailure
} from '../web-test-lab-config.js';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const settingsPath = path.join(repositoryRoot, '.env.test-lab');

function loadSettingsFile() {
  if (!fs.existsSync(settingsPath)) return false;
  const values = parseEnvFile(fs.readFileSync(settingsPath, 'utf8'));
  for (const [name, value] of Object.entries(values)) {
    if (process.env[name] === undefined) process.env[name] = value;
  }
  return true;
}

try {
  const settingsLoaded = loadSettingsFile();
  process.env.FRNN_TEST_LAB = 'true';
  process.env.PORT ||= String(DEFAULT_TEST_LAB_PORT);
  process.env.HOST ||= DEFAULT_TEST_LAB_HOST;
  process.env.NODE_ENV ||= 'development';

  const missing = missingTestLabSettings(process.env);
  if (missing.length) {
    const setupHint = settingsLoaded
      ? 'Add the missing values to .env.test-lab.'
      : 'Copy .env.test-lab.example to .env.test-lab and fill in its settings.';
    throw new Error([
      'FRNN Test Lab did not start.',
      '',
      `Missing required setting${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}`,
      setupHint,
      'See docs/broadcast-control-lab/WEB_TEST_LAB.md for setup steps.'
    ].join('\n'));
  }

  await import('../server.js');
} catch (error) {
  if (error?.message?.startsWith('FRNN Test Lab did not start.')) console.error(error.message);
  else console.error(testLabStartupFailure(error, { port: process.env.PORT }));
  process.exitCode = 1;
}
