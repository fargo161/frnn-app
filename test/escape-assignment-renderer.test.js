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
  toggle(name, force) {
    const values = this.values();
    const present = force === undefined ? !values.has(name) : Boolean(force);
    if (present) values.add(name); else values.delete(name);
    this.write(values);
    return present;
  }
  contains(name) { return this.values().has(name); }
}

class FakeElement {
  constructor(tagName = 'div', className = '') {
    this.tagName = tagName.toUpperCase();
    this.className = className;
    this.classList = new FakeClassList(this);
    this.children = [];
    this.listeners = new Map();
    this.attributes = new Map();
    this._textContent = '';
    this.innerHTML = '';
    this.value = '';
    this.disabled = false;
  }
  set textContent(value) { this._textContent = String(value); }
  get textContent() { return this._textContent; }
  appendChild(child) { this.children.push(child); return child; }
  addEventListener(name, handler) { this.listeners.set(name, handler); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  querySelectorAll(selector) {
    if (selector === 'button') return this.children.filter(child => child.tagName === 'BUTTON');
    return [];
  }
}

function response(body, { ok = true, status = 200 } = {}) {
  return { ok, status, async json() { return body; } };
}

function normalPayload(station) {
  return {
    player: {
      accessCode: 'BBB222',
      visits: [{ station, stage: 1 }],
      videoAnswerCount: 0,
      stationMissions: {
        escape: { state: station === 'escape' ? 'response_required' : 'not_visited' },
        attention: { state: station === 'attention' ? 'response_required' : 'not_visited' },
        access: { state: station === 'access' ? 'response_required' : 'not_visited' },
        sensory: { state: station === 'sensory' ? 'response_required' : 'not_visited' }
      }
    },
    station,
    stationMeta: { function: station.toUpperCase() },
    stage: 1,
    stageMeta: { label: 'FIRST CONTACT' },
    missionState: { responseComplete: false },
    videoRole: 'loop',
    videoUrl: '',
    loopVideoUrl: '',
    wrongVideoUrl: '',
    answerPrompt: `Prompt for ${station}`,
    answerChoices: ['Choice A', 'Choice B'],
    answerState: null
  };
}

async function settle() {
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
}

async function runStation({ station = 'escape', scanResponse, scanError = null }) {
  const html = await read('../public/station.html');
  let script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, 'station script exists');

  const calls = { fetch: [], progress: 0, renderStation: 0, renderChoices: 0, renderMedia: 0 };
  script = script
    .replace('function progress(player){', 'function progress(player){globalThis.__calls.progress++;')
    .replace('function renderStation(data,autoPlayCompletion=false){', 'function renderStation(data,autoPlayCompletion=false){globalThis.__calls.renderStation++;')
    .replace('function renderChoices(prompt,choices,state,player){', 'function renderChoices(prompt,choices,state,player){globalThis.__calls.renderChoices++;')
    .replace('function renderMedia(element,controls,url,fallback,options={}){', 'function renderMedia(element,controls,url,fallback,options={}){globalThis.__calls.renderMedia++;');

  const classes = {
    gate: 'hidden', authorized: 'hidden', retry: 'hidden', assignmentArea: 'card hidden',
    assignmentStateBadge: 'state-badge pending', assignmentMessage: 'signal',
    progressSummary: 'tiny', progress: 'progress', mediaBox: 'video', mediaControls: 'toolbar hidden',
    responseArea: 'card hidden', finalArea: 'card hidden', fieldAccess: 'meta', accessEntry: '',
    lockedMediaControls: 'toolbar hidden', responseFeedback: 'meta', finalReveal: 'signal final-reveal hidden',
    finalNameArea: 'card hidden'
  };
  const ids = [
    'stationTitle', 'stageLabel', 'signalText', 'gate', 'lockedMedia', 'lockedHeadline', 'lockedMessage',
    'lockedMediaControls', 'accessEntry', 'accessCode', 'authorizeButton', 'gateError', 'authorized',
    'assignmentArea', 'assignmentStateBadge', 'assignmentMessage', 'progressSummary', 'progress',
    'mediaBox', 'mediaControls', 'responseArea', 'stationStateBadge', 'responseHeading', 'responsePrompt',
    'responseChoices', 'responseFeedback', 'finalArea', 'finalStateBadge', 'finalMediaBox',
    'finalMediaControls', 'finalPrompt', 'finalAnswer', 'finalSubmitButton', 'finalFeedback', 'finalReveal',
    'finalNameArea', 'finalNameForm', 'finalName', 'finalNameButton', 'finalNameFeedback', 'fieldAccess',
    'fieldCode', 'retry', 'retryButton'
  ];
  const elements = new Map(ids.map(id => [id, new FakeElement('div', classes[id] || '')]));
  elements.set('responseChoices', new FakeElement('div', 'choice-grid'));

  const document = {
    getElementById: id => elements.get(id),
    createElement: tag => new FakeElement(tag)
  };
  const fetch = async (url, options = {}) => {
    calls.fetch.push({ url, options });
    if (url === '/api/config') return response({ locked: {}, answers: {} });
    if (scanError) throw scanError;
    return scanResponse;
  };
  const context = vm.createContext({
    document,
    location: { pathname: `/s/${station}` },
    fetch,
    URL,
    URLSearchParams,
    console,
    __calls: calls,
    setTimeout,
    clearTimeout,
    String,
    Number,
    Boolean,
    Math,
    Error,
    Promise,
    Object
  });
  vm.runInContext(script, context, { filename: 'public/station.html' });
  await settle();
  return { calls, elements, html };
}

function visible(elements, id) {
  return !elements.get(id).classList.contains('hidden');
}

test('assigned Escape renders public message without normal player or puzzle payload', async () => {
  const result = await runStation({
    scanResponse: response({
      mode: 'assignment',
      nodeKey: 'escape',
      assignedMessage: '  Message A  ',
      code: 'PRIVATE1',
      is_active: true,
      updated_at: 'private timestamp',
      id: 999
    })
  });

  assert.equal(visible(result.elements, 'authorized'), true);
  assert.equal(visible(result.elements, 'gate'), false);
  assert.equal(visible(result.elements, 'retry'), false);
  assert.equal(visible(result.elements, 'assignmentArea'), true);
  assert.equal(result.elements.get('assignmentMessage').textContent, 'Message A');
  assert.equal(result.elements.get('stationTitle').textContent, 'ASSIGNED TRANSMISSION');
  assert.equal(result.elements.get('stageLabel').textContent, 'ESCAPE // DIRECT CHANNEL');
  assert.equal(result.elements.get('signalText').textContent, 'A DIRECT TRANSMISSION HAS BEEN ASSIGNED TO THIS RECEIVER.');
  for (const id of ['progressSummary', 'progress', 'mediaBox', 'mediaControls', 'responseArea', 'finalArea', 'fieldAccess']) {
    assert.equal(visible(result.elements, id), false, `${id} should be hidden`);
  }
  assert.deepEqual(
    { progress: result.calls.progress, renderStation: result.calls.renderStation, renderChoices: result.calls.renderChoices, renderMedia: result.calls.renderMedia },
    { progress: 0, renderStation: 0, renderChoices: 0, renderMedia: 0 }
  );
  assert.deepEqual(result.calls.fetch.map(call => call.url), ['/api/config', '/api/scan/escape']);
  const visibleText = ['stationTitle', 'stageLabel', 'signalText', 'assignmentStateBadge', 'assignmentMessage']
    .map(id => result.elements.get(id).textContent).join(' ');
  assert.doesNotMatch(visibleText, /PRIVATE1|private timestamp|999|is_active/);
});

test('assigned message is text-only and HTML-like content is not interpreted', async () => {
  const message = '<img src=x onerror=alert(1)>Message A';
  const result = await runStation({
    scanResponse: response({ mode: 'assignment', nodeKey: 'escape', assignedMessage: message })
  });
  assert.equal(result.elements.get('assignmentMessage').textContent, message);
  assert.equal(result.elements.get('assignmentMessage').innerHTML, '');
  assert.equal(result.elements.get('assignmentMessage').children.length, 0);
});

test('normal Escape and other Functions retain the existing progress and station renderer path', async () => {
  for (const station of ['escape', 'attention', 'access', 'sensory']) {
    const result = await runStation({ station, scanResponse: response(normalPayload(station)) });
    assert.equal(visible(result.elements, 'authorized'), true);
    assert.equal(visible(result.elements, 'retry'), false);
    assert.equal(visible(result.elements, 'assignmentArea'), false);
    assert.equal(result.elements.get('fieldCode').textContent, 'BBB222');
    assert.equal(result.elements.get('stageLabel').textContent, 'DISCOVERY STAGE 1 // FIRST CONTACT');
    assert.equal(result.elements.get('responseChoices').children.length, 2);
    assert.deepEqual(
      { progress: result.calls.progress, renderStation: result.calls.renderStation, renderChoices: result.calls.renderChoices },
      { progress: 1, renderStation: 1, renderChoices: 1 }
    );
  }
});

test('non-Escape or malformed assignment mode uses the existing retry state', async () => {
  for (const fixture of [
    { station: 'attention', body: { mode: 'assignment', nodeKey: 'attention', assignedMessage: 'No' } },
    { station: 'escape', body: { mode: 'assignment', nodeKey: 'attention', assignedMessage: 'No' } },
    { station: 'escape', body: { mode: 'assignment', nodeKey: 'escape', assignedMessage: '   ' } },
    { station: 'escape', body: { mode: 'assignment', nodeKey: 'escape', assignedMessage: 42 } }
  ]) {
    const result = await runStation({ station: fixture.station, scanResponse: response(fixture.body) });
    assert.equal(visible(result.elements, 'retry'), true);
    assert.equal(visible(result.elements, 'authorized'), false);
    assert.equal(visible(result.elements, 'assignmentArea'), false);
    assert.equal(result.elements.get('signalText').textContent, 'SIGNAL TEMPORARILY UNAVAILABLE.');
    assert.equal(result.calls.progress, 0);
    assert.equal(result.calls.renderStation, 0);
  }
});

test('failed scan preserves retry behavior and never selects assignment rendering', async () => {
  const nonOk = await runStation({
    scanResponse: response({ error: 'SIGNAL_TEMPORARILY_UNAVAILABLE' }, { ok: false, status: 503 })
  });
  assert.equal(visible(nonOk.elements, 'retry'), true);
  assert.equal(visible(nonOk.elements, 'assignmentArea'), false);

  const network = await runStation({ scanResponse: null, scanError: new Error('network down') });
  assert.equal(visible(network.elements, 'retry'), true);
  assert.equal(visible(network.elements, 'assignmentArea'), false);
  assert.equal(network.calls.renderStation, 0);
});

test('assignment dispatch remains before normal payload access and backend/UI scope stays bounded', async () => {
  const [station, server, resolver, schema, migration, qr, quickStart, admin] = await Promise.all([
    read('../public/station.html'),
    read('../server.js'),
    read('../node-assignments.js'),
    read('../schema.sql'),
    read('../migrations/004_node_assignments.sql'),
    read('../qr-routing.js'),
    read('../public/quick-start.html'),
    read('../public/admin.html')
  ]);
  const scanStart = station.indexOf('async function scan()');
  const scanEnd = station.indexOf('async function authorize()', scanStart);
  const scan = station.slice(scanStart, scanEnd);
  const branch = scan.indexOf("if(data.mode==='assignment')");
  assert.ok(branch > scan.indexOf("show('authorized')"));
  assert.ok(branch < scan.indexOf('data.player.accessCode'));
  assert.ok(branch < scan.indexOf('progress(data.player)'));
  assert.ok(branch < scan.indexOf('renderStation(data,false)'));
  const rendererStart = station.indexOf('function renderAssignment(data)');
  const rendererEnd = station.indexOf('function renderChoices(', rendererStart);
  const renderer = station.slice(rendererStart, rendererEnd);
  assert.match(station, /id="assignmentArea" class="card hidden"/);
  assert.match(station, /id="assignmentMessage" class="signal" aria-live="polite"/);
  assert.match(station, /id="fieldAccess" class="meta"/);
  assert.match(renderer, /assignmentMessage'\)\.textContent=data\.assignedMessage\.trim\(\)/);
  assert.doesNotMatch(renderer, /innerHTML|data\.player|progress\(|renderStation\(|renderChoices\(|renderMedia\(/);
  assert.equal((station.match(/function renderStation\(/g) || []).length, 1);
  assert.doesNotMatch(server, /assignmentArea|renderAssignment/);
  assert.doesNotMatch(resolver, /assignmentArea|renderAssignment/);
  assert.doesNotMatch(schema, /assignmentArea|renderAssignment/);
  assert.doesNotMatch(migration, /assignmentArea|renderAssignment/);
  assert.doesNotMatch(qr, /assignmentArea|renderAssignment/);
  assert.doesNotMatch(quickStart, /assignmentArea|renderAssignment/);
  assert.doesNotMatch(admin, /assignmentArea|renderAssignment/);
});
