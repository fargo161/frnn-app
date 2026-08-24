import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const read = path => fs.readFile(new URL(path, import.meta.url), 'utf8');

class FakeClassList {
  constructor(element) { this.element = element; }
  values() { return new Set(String(this.element.className || '').split(/\s+/).filter(Boolean)); }
  write(values) { this.element.className = [...values].join(' '); }
  add(...names) { const values = this.values(); names.forEach(name => values.add(name)); this.write(values); }
  remove(...names) { const values = this.values(); names.forEach(name => values.delete(name)); this.write(values); }
}

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.textContent = '';
    this.className = '';
    this.children = [];
    this.listeners = new Map();
    this.attributes = new Map();
    this.classList = new FakeClassList(this);
    this.duration = Number.NaN;
    this.currentTime = 0;
  }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = [...children]; }
  addEventListener(name, handler) { this.listeners.set(name, handler); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  querySelector(selector) { return selector === 'video' ? this.children.find(child => child.tagName === 'VIDEO') || null : null; }
  play() { return Promise.resolve(); }
}

function offAir(overrides = {}) {
  return {
    status: 'off_air',
    server_time: '2026-08-24T08:00:00.000Z',
    current_program_id: null,
    current_program_started_at: null,
    program_duration: null,
    elapsed: null,
    remaining: null,
    next_program_id: null,
    current_program: null,
    ...overrides
  };
}

function onAir(overrides = {}) {
  return {
    status: 'on_air',
    server_time: '2026-08-24T08:00:03.000Z',
    current_program_id: 'program-a',
    current_program_started_at: '2026-08-24T08:00:00.000Z',
    program_duration: 12000,
    elapsed: 3000,
    remaining: 9000,
    next_program_id: 'program-b',
    current_program: {
      id: 'program-a',
      title: 'PROGRAM A',
      program_type: 'test_card',
      media_ref: '',
      duration_ms: 12000,
      queue_position: 1
    },
    ...overrides
  };
}

async function settle() {
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
}

async function runViewer(fetchImplementation) {
  const html = await read('../public/broadcast.html');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, 'broadcast script exists');

  const ids = [
    'programStage', 'programState', 'programTitle', 'programMeta', 'elapsedTime',
    'remainingTime', 'nextProgram', 'connectionState', 'playbackState', 'serverTime'
  ];
  const elements = new Map(ids.map(id => [id, new FakeElement()]));
  const documentListeners = new Map();
  const windowListeners = new Map();
  const timeouts = [];
  const intervals = [];
  let now = 1000;
  const calls = [];

  const document = {
    visibilityState: 'visible',
    getElementById: id => elements.get(id),
    createElement: tag => new FakeElement(tag),
    addEventListener: (name, handler) => documentListeners.set(name, handler)
  };
  const window = { addEventListener: (name, handler) => windowListeners.set(name, handler) };
  const fetch = async (url, options) => {
    calls.push({ url, options });
    return fetchImplementation(url, options, calls.length);
  };
  const context = vm.createContext({
    document,
    window,
    fetch,
    performance: { now: () => now },
    setTimeout: (handler, delay) => { timeouts.push({ handler, delay }); return timeouts.length; },
    clearTimeout: () => {},
    setInterval: (handler, delay) => { intervals.push({ handler, delay }); return intervals.length; },
    clearInterval: () => {},
    Date,
    Number,
    String,
    Math,
    Error,
    Promise,
    Object
  });
  vm.runInContext(script, context);
  await settle();
  return {
    calls,
    document,
    elements,
    intervals,
    timeouts,
    windowListeners,
    setNow(value) { now = value; }
  };
}

function response(payload, ok = true, status = 200) {
  return { ok, status, async json() { return payload; } };
}

test('viewer bootstrap is a no-store GET and never starts or mutates the broadcast', async () => {
  const viewer = await runViewer(async () => response(offAir()));
  assert.equal(viewer.calls.length, 1);
  assert.equal(viewer.calls[0].url, '/api/broadcast');
  assert.equal(viewer.calls[0].options.method, 'GET');
  assert.equal(viewer.calls[0].options.cache, 'no-store');
  assert.equal(viewer.calls[0].options.headers.Accept, 'application/json');
  const html = await read('../public/broadcast.html');
  assert.doesNotMatch(html, /api\/admin\/broadcast\/(?:start|stop)/);
  assert.doesNotMatch(html, /method:\s*['"]POST['"]/);
});

test('authoritative on-air response renders a test card and clock fields', async () => {
  const viewer = await runViewer(async () => response(onAir()));
  assert.equal(viewer.elements.get('programState').textContent, 'LIVE');
  assert.equal(viewer.elements.get('programTitle').textContent, 'PROGRAM A');
  assert.equal(viewer.elements.get('elapsedTime').textContent, '00:03');
  assert.equal(viewer.elements.get('remainingTime').textContent, '00:09');
  assert.equal(viewer.elements.get('nextProgram').textContent, 'program-b');
  const card = viewer.elements.get('programStage').children[0];
  assert.equal(card.className, 'test-card');
  assert.equal(card.children[1].textContent, 'PROGRAM A');
  assert.equal(viewer.elements.get('playbackState').textContent, 'TEST CARD // CLOCK PROOF');
});

test('local clock reaching a boundary cannot replace the server-confirmed Program', async () => {
  const viewer = await runViewer(async () => response(onAir({
    elapsed: 11900,
    remaining: 100
  })));
  assert.equal(viewer.elements.get('programTitle').textContent, 'PROGRAM A');
  viewer.setNow(13000);
  viewer.intervals[0].handler();
  await settle();
  assert.equal(viewer.elements.get('programTitle').textContent, 'PROGRAM A');
  assert.match(viewer.elements.get('programState').textContent, /AWAITING SERVER CONFIRMATION/);
  assert.ok(viewer.calls.every(call => call.url === '/api/broadcast' && call.options.method === 'GET'));
});

test('off-air and initial connection failure have explicit non-program states', async () => {
  const offAirViewer = await runViewer(async () => response(offAir()));
  assert.equal(offAirViewer.elements.get('programState').textContent, 'OFF AIR');
  assert.equal(offAirViewer.elements.get('programTitle').textContent, 'CHANNEL STANDBY');
  assert.equal(offAirViewer.elements.get('programStage').children[0].children[0].textContent, 'FRNN // OFF AIR');

  const errorViewer = await runViewer(async () => { throw new Error('offline'); });
  assert.equal(errorViewer.elements.get('programState').textContent, 'CONNECTION ERROR');
  assert.equal(errorViewer.elements.get('programTitle').textContent, 'SIGNAL TEMPORARILY UNAVAILABLE');
  assert.match(errorViewer.elements.get('connectionState').textContent, /RETRYING/);
});

test('polling is bounded and boundary-aware', async () => {
  const nearBoundary = await runViewer(async () => response(onAir({ elapsed: 10000, remaining: 2000 })));
  assert.equal(nearBoundary.intervals[0].delay, 250);
  assert.ok(nearBoundary.timeouts.length > 0);
  assert.ok(nearBoundary.timeouts.every(timer => timer.delay >= 250 && timer.delay <= 5000));
  assert.equal(nearBoundary.timeouts.at(-1).delay, 2100);

  const offAirViewer = await runViewer(async () => response(offAir()));
  assert.equal(offAirViewer.timeouts.at(-1).delay, 5000);
});

test('thin video playback seeks from authoritative elapsed without owning clock state', async () => {
  const viewer = await runViewer(async () => response(onAir({
    current_program: {
      id: 'program-a', title: 'PROGRAM A', program_type: 'video', media_ref: '/a.mp4', duration_ms: 12000, queue_position: 1
    }
  })));
  const video = viewer.elements.get('programStage').children[0];
  assert.equal(video.tagName, 'VIDEO');
  assert.equal(video.muted, true);
  assert.equal(video.playsInline, true);
  video.duration = 12;
  video.listeners.get('loadedmetadata')();
  await settle();
  assert.equal(video.currentTime, 3);
  assert.equal(viewer.elements.get('programTitle').textContent, 'PROGRAM A');
  video.listeners.get('error')();
  assert.match(viewer.elements.get('playbackState').textContent, /VIDEO UNAVAILABLE/);
  assert.equal(viewer.elements.get('programTitle').textContent, 'PROGRAM A');
  assert.equal(viewer.elements.get('elapsedTime').textContent, '00:03');
});
