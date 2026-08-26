import os from 'node:os';
import {
  databaseUrlForEnvironment,
  databaseVariableForEnvironment,
  isAutomatedTestEnvironment
} from './database-config.js';

export const DEFAULT_TEST_LAB_PORT = 3000;
export const DEFAULT_TEST_LAB_HOST = '0.0.0.0';

export class TestLabConfigError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'TestLabConfigError';
    this.code = code;
  }
}

export function parsePort(value, fallback = DEFAULT_TEST_LAB_PORT) {
  const candidate = value == null || String(value).trim() === '' ? fallback : Number(value);
  if (!Number.isInteger(candidate) || candidate < 1 || candidate > 65535) {
    throw new TestLabConfigError(
      `PORT must be a whole number from 1 to 65535. Received: ${String(value)}`,
      'INVALID_TEST_LAB_PORT'
    );
  }
  return candidate;
}

export function parseListenHost(value, fallback = DEFAULT_TEST_LAB_HOST) {
  const host = value == null || String(value).trim() === '' ? fallback : String(value).trim();
  if (/[\u0000-\u0020\u007f/\\]/.test(host)) {
    throw new TestLabConfigError('HOST contains unsupported characters.', 'INVALID_TEST_LAB_HOST');
  }
  return host;
}

export function isPrivateIpv4(address) {
  const parts = String(address).split('.').map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168);
}

export function discoverLanIpv4Addresses(interfaces = os.networkInterfaces()) {
  const candidates = [];
  for (const [interfaceName, records] of Object.entries(interfaces || {})) {
    const virtual = /virtual|vethernet|hyper-v|wsl|docker|vmware|virtualbox|vpn|tailscale|zerotier/i.test(interfaceName);
    for (const record of records || []) {
      const ipv4 = record.family === 'IPv4' || record.family === 4;
      if (ipv4 && !record.internal && isPrivateIpv4(record.address)) {
        candidates.push({ address: record.address, virtual });
      }
    }
  }
  candidates.sort((left, right) =>
    Number(left.virtual) - Number(right.virtual) ||
    left.address.localeCompare(right.address, undefined, { numeric: true })
  );
  return [...new Set(candidates.map(candidate => candidate.address))];
}

export function reachableLanIpv4Addresses(host, discovered = discoverLanIpv4Addresses()) {
  const listenHost = parseListenHost(host);
  if (listenHost === '0.0.0.0' || listenHost === '::' || listenHost === '[::]') return discovered;
  return isPrivateIpv4(listenHost) ? [listenHost] : [];
}

export function httpOrigin(host, port) {
  const formattedHost = String(host).includes(':') ? `[${host}]` : host;
  return `http://${formattedHost}:${parsePort(port)}`;
}

export function createTestLabUrls({ port, lanAddresses = discoverLanIpv4Addresses() }) {
  const resolvedPort = parsePort(port);
  const localOrigin = httpOrigin('localhost', resolvedPort);
  const lanOrigins = [...new Set(lanAddresses.filter(isPrivateIpv4))].map(address => httpOrigin(address, resolvedPort));
  return {
    test_lab: `${localOrigin}/test-lab`,
    local_broadcast: `${localOrigin}/broadcast`,
    lan_broadcasts: lanOrigins.map(origin => `${origin}/broadcast`),
    primary_lan_broadcast: lanOrigins.length ? `${lanOrigins[0]}/broadcast` : null
  };
}

export function parseEnvFile(source) {
  const values = {};
  for (const rawLine of String(source).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) throw new TestLabConfigError(`Invalid setting line: ${rawLine}`, 'INVALID_TEST_LAB_ENV');
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
    }
    values[match[1]] = value;
  }
  return values;
}

export function missingTestLabSettings(environment = process.env) {
  return [
    ...(!databaseUrlForEnvironment(environment) ? [databaseVariableForEnvironment(environment)] : []),
    ...(!environment.ADMIN_KEY ? ['ADMIN_KEY'] : []),
    ...(!environment.MISSION_CONTROL_PASSPHRASE ? ['MISSION_CONTROL_PASSPHRASE'] : [])
  ];
}

export function shouldLoadOwnerTestLabSettings(environment = process.env) {
  return !isAutomatedTestEnvironment(environment);
}

function technicalDetail(error) {
  const code = error?.code ? `${error.code}: ` : '';
  return `${code}${error?.message || String(error)}`
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[DATABASE_URL REDACTED]');
}

export function testLabStartupFailure(error, { port = DEFAULT_TEST_LAB_PORT } = {}) {
  if (error?.code === 'EADDRINUSE') {
    return [
      'FRNN Test Lab could not start.',
      '',
      `Port ${port} is already in use. Stop the other program or set a different PORT in .env.test-lab.`,
      '',
      `Technical detail: ${technicalDetail(error)}`
    ].join('\n');
  }
  if (error instanceof TestLabConfigError) {
    return [
      'FRNN Test Lab could not start.',
      '',
      error.message,
      'Fix .env.test-lab, then run npm run test-lab again.'
    ].join('\n');
  }
  return [
    'FRNN could not prepare PostgreSQL.',
    '',
    'The Test Lab has not started. Check that the local FRNN database is running and DATABASE_URL is configured.',
    'See docs/broadcast-control-lab/WEB_TEST_LAB.md for setup steps.',
    '',
    `Technical detail: ${technicalDetail(error)}`
  ].join('\n');
}

export function testLabReadyMessage({ port, host, lanAddresses = discoverLanIpv4Addresses() }) {
  const urls = createTestLabUrls({ port, lanAddresses: reachableLanIpv4Addresses(host, lanAddresses) });
  const phoneLines = urls.lan_broadcasts.length
    ? urls.lan_broadcasts.map(url => `  ${url}`)
    : ['  Unavailable — no private LAN IPv4 address was discovered.'];
  return [
    'FRNN Test Lab ready',
    '',
    'Server: READY',
    'Database: READY',
    `Listening: ${host}:${parsePort(port)}`,
    '',
    'Test Lab:',
    `  ${urls.test_lab}`,
    '',
    'Laptop Broadcast:',
    `  ${urls.local_broadcast}`,
    '',
    'Phone Broadcast:',
    ...phoneLines,
    '',
    'Keep the laptop and phone on the same trusted Wi-Fi.',
    'Press Ctrl+C to stop.'
  ].join('\n');
}
