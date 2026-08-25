import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {
  TestLabConfigError,
  createTestLabUrls,
  discoverLanIpv4Addresses,
  isPrivateIpv4,
  missingTestLabSettings,
  parseEnvFile,
  parseListenHost,
  parsePort,
  reachableLanIpv4Addresses,
  testLabReadyMessage,
  testLabStartupFailure
} from '../web-test-lab-config.js';

class FakeClassList {
  constructor(element) { this.element = element; }
  values() { return new Set(this.element.className.split(/\s+/).filter(Boolean)); }
  write(values) { this.element.className = [...values].join(' '); }
  add(...names) { const values = this.values(); names.forEach(name => values.add(name)); this.write(values); }
  remove(...names) { const values = this.values(); names.forEach(name => values.delete(name)); this.write(values); }
  contains(name) { return this.values().has(name); }
}

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.dataset = {};
    this.listeners = new Map();
    this.attributes = new Map();
    this.className = '';
    this.href = '';
    this.src = '';
    this._textContent = '';
    this.classList = new FakeClassList(this);
  }
  set textContent(value) { this._textContent = String(value); if (value === '') this.children = []; }
  get textContent() { return this._textContent; }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = [...children]; this._textContent = ''; }
  addEventListener(name, handler) { this.listeners.set(name, handler); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) || (name === 'src' ? this.src : null); }
  removeAttribute(name) { this.attributes.delete(name); if (name === 'src') this.src = ''; }
}

async function settle() {
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
}

test('Test Lab configuration uses a stable overrideable port and private LAN IPv4 candidates', () => {
  assert.equal(parsePort(undefined), 3000);
  assert.equal(parsePort('32001'), 32001);
  assert.equal(parseListenHost(undefined), '0.0.0.0');
  assert.equal(parseListenHost('127.0.0.1'), '127.0.0.1');
  assert.throws(() => parsePort('random'), TestLabConfigError);
  assert.throws(() => parsePort('70000'), /1 to 65535/);
  assert.throws(() => parseListenHost('bad host'), /unsupported/);

  assert.equal(isPrivateIpv4('10.1.2.3'), true);
  assert.equal(isPrivateIpv4('172.31.9.2'), true);
  assert.equal(isPrivateIpv4('192.168.4.5'), true);
  assert.equal(isPrivateIpv4('172.32.0.1'), false);
  assert.equal(isPrivateIpv4('8.8.8.8'), false);

  const discovered = discoverLanIpv4Addresses({
    Ethernet: [
      { family: 'IPv4', internal: false, address: '192.168.1.22' },
      { family: 'IPv4', internal: false, address: '8.8.8.8' }
    ],
    WiFi: [
      { family: 4, internal: false, address: '10.0.0.4' },
      { family: 'IPv4', internal: false, address: '192.168.1.22' },
      { family: 'IPv4', internal: true, address: '127.0.0.1' }
    ]
  });
  assert.deepEqual(discovered, ['10.0.0.4', '192.168.1.22']);
  assert.deepEqual(discoverLanIpv4Addresses({
    'vEthernet (WSL)': [{ family: 'IPv4', internal: false, address: '172.21.208.1' }],
    'Wi-Fi': [{ family: 'IPv4', internal: false, address: '192.168.1.22' }]
  }), ['192.168.1.22', '172.21.208.1']);
  assert.deepEqual(reachableLanIpv4Addresses('0.0.0.0', discovered), discovered);
  assert.deepEqual(reachableLanIpv4Addresses('192.168.1.22', discovered), ['192.168.1.22']);
  assert.deepEqual(reachableLanIpv4Addresses('127.0.0.1', discovered), []);
  assert.deepEqual(createTestLabUrls({ port: 32001, lanAddresses: discovered }), {
    test_lab: 'http://localhost:32001/test-lab',
    local_broadcast: 'http://localhost:32001/broadcast',
    lan_broadcasts: [
      'http://10.0.0.4:32001/broadcast',
      'http://192.168.1.22:32001/broadcast'
    ],
    primary_lan_broadcast: 'http://10.0.0.4:32001/broadcast'
  });
});

test('Test Lab preflight parses a local settings file and reports missing configuration without secrets', () => {
  assert.deepEqual(parseEnvFile(`
    # local only
    DATABASE_URL="postgres://local/example"
    ADMIN_KEY='owner-secret'
    MISSION_CONTROL_PASSPHRASE=operator-secret # explanation
  `), {
    DATABASE_URL: 'postgres://local/example',
    ADMIN_KEY: 'owner-secret',
    MISSION_CONTROL_PASSPHRASE: 'operator-secret'
  });
  assert.deepEqual(missingTestLabSettings({ NODE_ENV: 'development' }), [
    'DATABASE_URL', 'ADMIN_KEY', 'MISSION_CONTROL_PASSPHRASE'
  ]);
  assert.deepEqual(missingTestLabSettings({
    NODE_ENV: 'test', TEST_DATABASE_URL: 'configured', ADMIN_KEY: 'configured',
    MISSION_CONTROL_PASSPHRASE: 'configured'
  }), []);

  const busy = Object.assign(new Error('listen failed'), { code: 'EADDRINUSE' });
  assert.match(testLabStartupFailure(busy, { port: 32001 }), /Port 32001 is already in use/);
  const database = Object.assign(new Error('connect refused'), { code: 'ECONNREFUSED' });
  assert.match(testLabStartupFailure(database), /could not prepare PostgreSQL/);
  assert.doesNotMatch(
    testLabStartupFailure(new Error('connect postgres://owner:password@localhost/frnn')),
    /owner:password/
  );

  const ready = testLabReadyMessage({
    port: 32001, host: '0.0.0.0', lanAddresses: ['192.168.1.22']
  });
  assert.match(ready, /FRNN Test Lab ready/);
  assert.match(ready, /http:\/\/localhost:32001\/test-lab/);
  assert.match(ready, /http:\/\/192\.168\.1\.22:32001\/broadcast/);
  assert.doesNotMatch(ready, /DATABASE_URL|ADMIN_KEY|PASSPHRASE|owner-secret|operator-secret/);
  assert.match(testLabReadyMessage({
    port: 32001, host: '127.0.0.1', lanAddresses: ['192.168.1.22']
  }), /Phone Broadcast:\n  Unavailable/);
});

test('Web Test Lab is a hub around the real Control Lab and public receiver', async () => {
  const [html, client, broadcast] = await Promise.all([
    fs.readFile(new URL('../public/test-lab.html', import.meta.url), 'utf8'),
    fs.readFile(new URL('../public/web-test-lab.js', import.meta.url), 'utf8'),
    fs.readFile(new URL('../public/broadcast.html', import.meta.url), 'utf8')
  ]);
  assert.match(html, /FRNN \/\/ DEVELOPMENT SURFACE/);
  assert.match(html, /Fried Rice News Network/);
  assert.match(html, /Web Test Lab/);
  assert.match(html, /src="\/control-lab"/);
  assert.match(html, /src="\/broadcast"/);
  assert.match(html, /same trusted Wi-Fi/);
  assert.match(html, /not a mission or station QR/i);
  assert.match(html, /not final Mission Control/i);
  assert.match(client, /\/api\/test-lab\/status/);
  assert.doesNotMatch(client, /\/api\/admin\//);
  assert.doesNotMatch(broadcast, /api\/admin\/broadcast|method:\s*['"]POST['"]/);
});

test('Web Test Lab client renders real public status, exact URLs, QR target, and unavailable state', async () => {
  const client = await fs.readFile(new URL('../public/web-test-lab.js', import.meta.url), 'utf8');
  const ids = [
    'serverState', 'databaseState', 'broadcastState', 'statusMessage', 'localBroadcastUrl',
    'lanBroadcastUrls', 'qrPanel', 'receiverQr', 'qrTarget', 'activeTitle', 'activeItemId',
    'activePlayback', 'broadcastServerTime', 'reloadControl', 'reloadBroadcast',
    'controlFrame', 'broadcastFrame'
  ];
  const elements = new Map(ids.map(id => [id, new FakeElement()]));
  elements.get('qrPanel').className = 'qr-panel hidden';
  elements.get('controlFrame').src = '/control-lab';
  elements.get('broadcastFrame').src = '/broadcast';
  const documentListeners = new Map();
  const document = {
    getElementById: id => elements.get(id),
    createElement: tag => new FakeElement(tag),
    addEventListener: (name, handler) => documentListeners.set(name, handler)
  };
  const calls = [];
  const responses = [{
    identity: 'FRNN Web Test Lab', environment: 'development', server: 'ready', database: 'ready',
    listen: { host: '0.0.0.0', port: 32001 },
    urls: {
      test_lab: 'http://localhost:32001/test-lab',
      local_broadcast: 'http://localhost:32001/broadcast',
      lan_broadcasts: ['http://192.168.1.22:32001/broadcast'],
      primary_lan_broadcast: 'http://192.168.1.22:32001/broadcast'
    },
    broadcast: {
      status: 'on_air', server_time: '2026-08-24T21:00:00.000Z', current_program_id: 'news',
      current_program: { title: 'News', program_type: 'test_card' }
    }
  }];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    const body = responses.shift();
    if (!body) throw new Error('offline');
    return { ok: true, status: 200, async json() { return body; } };
  };
  const intervals = [];
  const context = vm.createContext({
    document, fetch, navigator: { clipboard: { writeText: async () => {} } },
    setInterval: (handler, delay) => { intervals.push({ handler, delay }); return intervals.length; },
    setTimeout: () => 1, console, Promise, Error, String, Object
  });
  vm.runInContext(client, context, { filename: 'public/web-test-lab.js' });
  await settle();

  assert.deepEqual(calls.map(call => [call.url, call.options.method, call.options.cache]), [
    ['/api/test-lab/status', 'GET', 'no-store']
  ]);
  assert.equal(elements.get('serverState').textContent, 'READY');
  assert.equal(elements.get('databaseState').textContent, 'READY');
  assert.equal(elements.get('broadcastState').textContent, 'ON AIR');
  assert.equal(elements.get('activeTitle').textContent, 'News');
  assert.equal(elements.get('activeItemId').textContent, 'news');
  assert.equal(elements.get('localBroadcastUrl').href, 'http://localhost:32001/broadcast');
  assert.equal(elements.get('lanBroadcastUrls').children[0].children[0].href, 'http://192.168.1.22:32001/broadcast');
  assert.equal(elements.get('receiverQr').src, '/api/test-lab/receiver-qr.svg');
  assert.equal(elements.get('qrTarget').textContent, 'http://192.168.1.22:32001/broadcast');
  assert.equal(elements.get('qrPanel').classList.contains('hidden'), false);
  assert.equal(intervals[0].delay, 3000);

  responses.push({
    identity: 'FRNN Web Test Lab', environment: 'development', server: 'ready', database: 'ready',
    listen: { host: '127.0.0.1', port: 32001 },
    urls: {
      test_lab: 'http://localhost:32001/test-lab',
      local_broadcast: 'http://localhost:32001/broadcast',
      lan_broadcasts: [], primary_lan_broadcast: null
    },
    broadcast: { status: 'off_air', server_time: '2026-08-24T21:01:00.000Z' }
  });
  await intervals[0].handler();
  await settle();
  assert.match(elements.get('lanBroadcastUrls').textContent, /No private LAN IPv4 address was found/);
  assert.equal(elements.get('qrPanel').classList.contains('hidden'), true);
  assert.equal(elements.get('receiverQr').src, '');
  assert.equal(elements.get('broadcastState').textContent, 'OFF AIR');

  await intervals[0].handler();
  await settle();
  assert.equal(elements.get('serverState').textContent, 'UNAVAILABLE');
  assert.equal(elements.get('databaseState').textContent, 'UNAVAILABLE');
  assert.equal(elements.get('broadcastState').textContent, 'UNKNOWN');
  assert.match(elements.get('statusMessage').textContent, /check the terminal/i);
});
