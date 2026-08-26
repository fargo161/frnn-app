import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

class FakeClassList {
  constructor(element) { this.element = element; }
  values() { return new Set(this.element.className.split(/\s+/).filter(Boolean)); }
  write(values) { this.element.className = [...values].join(' '); }
  add(...names) { const values = this.values(); names.forEach(name => values.add(name)); this.write(values); }
  remove(...names) { const values = this.values(); names.forEach(name => values.delete(name)); this.write(values); }
  contains(name) { return this.values().has(name); }
  toggle(name, force) {
    const values = this.values();
    const enabled = force === undefined ? !values.has(name) : force;
    if (enabled) values.add(name); else values.delete(name);
    this.write(values);
    return enabled;
  }
}

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toLowerCase();
    this.children = [];
    this.dataset = {};
    this.className = '';
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.listeners = {};
    this._textContent = '';
    this.classList = new FakeClassList(this);
  }
  set textContent(value) { this._textContent = String(value); if (value === '') this.children = []; }
  get textContent() { return this._textContent; }
  appendChild(child) { this.children.push(child); return child; }
  append(...children) { this.children.push(...children); }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  scrollIntoView() {}
  reset() {}
}

async function createControlLabHarness() {
  const [script, html, admin] = await Promise.all([
    fs.readFile(new URL('../public/control-lab.js', import.meta.url), 'utf8'),
    fs.readFile(new URL('../public/control-lab.html', import.meta.url), 'utf8'),
    fs.readFile(new URL('../public/admin.html', import.meta.url), 'utf8')
  ]);
  const elements = new Map();
  const documentListeners = {};
  const document = {
    visibilityState: 'visible',
    createElement: tagName => new FakeElement(tagName),
    getElementById: id => {
      if (!elements.has(id)) elements.set(id, new FakeElement());
      return elements.get(id);
    },
    addEventListener: (type, handler) => { documentListeners[type] = handler; }
  };
  const windowListeners = {};
  const window = {
    addEventListener: (type, handler) => { windowListeners[type] = handler; }
  };
  for (const id of ['authRequired', 'lab', 'cancelEdit']) document.getElementById(id).className = 'hidden';
  const calls = [];
  const responses = [];
  const fetch = async (url, options = {}) => {
    calls.push({ url, options });
    const queuedResponse = responses.shift();
    if (!queuedResponse) throw new Error(`No fake response queued for ${url}`);
    const response = await queuedResponse;
    return {
      ok: response.ok ?? true,
      status: response.status ?? 200,
      json: async () => response.body ?? {}
    };
  };
  let nextIntervalId = 1;
  const intervals = new Map();
  const clearedIntervals = [];
  const setInterval = (handler, milliseconds) => {
    const id = nextIntervalId++;
    intervals.set(id, { handler, milliseconds });
    return id;
  };
  const clearInterval = id => {
    clearedIntervals.push(id);
    intervals.delete(id);
  };
  const exposed = script.replace(/initialize\(\);\s*$/, '') + `
globalThis.__controlLab = {
  initialize,loadState,saveLibraryItem,beginEdit,addToQueue,moveQueueEntry,
  removeUpcoming,deleteLibraryItem,startBroadcastNow,stopBroadcastNow,runAction,describeError,
  reconcileAutomatically,startAutoReconciliation,stopAutoReconciliation,
  getState:()=>controlState,
  getAutoReconcileState:()=>({timer:autoReconcileTimer,inFlight:autoReconcileInFlight,
    intervalMs:AUTO_RECONCILE_INTERVAL_MS,pageActive,authenticatedOperator}),
  elements:{sessionState,authRequired,lab,nowStatus,nowDetails,message,libraryForm,
    itemIdInput,itemTitleInput,itemKindSelect,playbackTypeSelect,mediaRefInput,
    durationMsInput,loopEligibleInput,libraryList,queueSelect,queueList,
    startBroadcastButton,stopBroadcastButton}
};`;
  const context = {
    document, window, fetch, setInterval, clearInterval, console, Date, JSON, Number, String, Boolean, Promise, Set,
    encodeURIComponent, globalThis: null
  };
  context.globalThis = context;
  vm.runInNewContext(exposed, context, { filename: 'public/control-lab.js' });
  return {
    lab: context.__controlLab, calls, responses, html, admin, document,
    documentListeners, windowListeners, intervals, clearedIntervals
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const libraryV1 = {
  id: 'news', definition_version: 1, title: 'News v1', item_kind: 'PROGRAM',
  playback_type: 'test_card', media_ref: null, duration_ms: 12000, loop_eligible: false,
  created_at: '2026-08-24T12:00:00.000Z', updated_at: '2026-08-24T12:00:00.000Z'
};
const libraryV2 = { ...libraryV1, definition_version: 2, title: 'News v2' };
const entryOne = {
  id: 10, packaged_item_id: 'news', queue_position: 1,
  created_at: '2026-08-24T12:00:01.000Z', definition: libraryV1
};
const entryTwo = { ...entryOne, id: 11, queue_position: 2 };
const activeV1 = {
  run_id: 30, packaged_item_id: 'news', source_definition_version: 1,
  source_queue_entry_id: 10, source_queue_position: 1, title: 'News v1',
  item_kind: 'PROGRAM', playback_type: 'test_card', media_ref: null,
  duration_ms: 12000, started_at: '2026-08-24T12:00:02.000Z'
};
const libraryB = { ...libraryV1, id: 'bulletin', title: 'Bulletin', duration_ms: 8000 };
const entryB = {
  ...entryOne, id: 11, packaged_item_id: 'bulletin', definition: libraryB
};
const activeB = {
  ...activeV1, run_id: 31, packaged_item_id: 'bulletin', source_queue_entry_id: 11,
  title: 'Bulletin', duration_ms: 8000, started_at: '2026-08-24T12:00:14.000Z'
};

function state({ library = [], queue = [], activeRun = null } = {}) {
  return {
    status: activeRun ? 'on_air' : 'off_air',
    server_time: '2026-08-24T12:00:03.000Z',
    active_run: activeRun,
    library,
    queue
  };
}

test('Mission Control retires the fixed Packager to one dedicated Control Lab link', async () => {
  const { html, admin } = await createControlLabHarness();
  assert.match(admin, /href="\/control-lab"[^>]*>OPEN BROADCAST CONTROL LAB/);
  assert.doesNotMatch(admin, /programEditor|savePrograms|loadPrograms|api\/admin\/programs/);
  assert.match(html, /Library → Upcoming Queue → immutable Active Run → public Broadcast/);
  assert.match(html, /LOOP eligible \(stored for later; no runtime effect in Task 01\)/);
  for (const deferred of ['Live Screen', 'Packaging Editor', 'Ticker', 'Breaking Override', 'Media Bin', 'Program Unit']) {
    assert.doesNotMatch(html, new RegExp(deferred, 'i'));
  }
});

test('Control Lab exposes auth expiry as a sign-in path instead of fake producer state', async () => {
  const { lab, responses, calls } = await createControlLabHarness();
  responses.push({ ok: false, status: 401, body: { error: 'MISSION_CONTROL_ACCESS_REQUIRED' } });
  await lab.initialize();
  assert.deepEqual(calls.map(call => call.url), ['/api/mission-control/session']);
  assert.equal(lab.elements.authRequired.classList.contains('hidden'), false);
  assert.equal(lab.elements.lab.classList.contains('hidden'), true);
  assert.equal(lab.elements.sessionState.textContent, 'NOT AUTHENTICATED');
});

test('Control Lab automatically reconciles one exhausted item to OFF AIR without producer mutation', async () => {
  const { lab, responses, calls, intervals } = await createControlLabHarness();
  responses.push(
    { body: { authenticated: true, operator: 'DIRECTOR' } },
    { body: state({ library: [libraryV1], activeRun: activeV1 }) }
  );
  await lab.initialize();

  assert.equal(intervals.size, 1);
  assert.equal([...intervals.values()][0].milliseconds, 3000);
  assert.equal(lab.elements.nowStatus.textContent, 'ON AIR');

  responses.push({ body: state({ library: [libraryV1] }) });
  await lab.reconcileAutomatically();

  assert.equal(lab.elements.nowStatus.textContent, 'OFF AIR');
  assert.equal(lab.getState().active_run, null);
  assert.equal(lab.getState().queue.length, 0);
  assert.equal(lab.elements.queueList.children[0].textContent, 'Upcoming Queue is empty.');
  assert.deepEqual(calls.slice(2).map(call => [call.url, call.options.method || 'GET']), [
    ['/api/admin/broadcast/control-lab', 'GET']
  ]);
});

test('Control Lab automatically renders A to B to OFF AIR as authoritative queue boundaries advance', async () => {
  const { lab, responses, calls } = await createControlLabHarness();
  responses.push(
    { body: { authenticated: true, operator: 'DIRECTOR' } },
    { body: state({ library: [libraryV1, libraryB], queue: [entryB], activeRun: activeV1 }) }
  );
  await lab.initialize();
  assert.equal(lab.getState().active_run.packaged_item_id, 'news');
  assert.deepEqual(lab.getState().queue.map(entry => entry.packaged_item_id), ['bulletin']);

  responses.push({ body: state({ library: [libraryV1, libraryB], activeRun: activeB }) });
  await lab.reconcileAutomatically();
  assert.equal(lab.getState().active_run.packaged_item_id, 'bulletin');
  assert.equal(lab.getState().queue.length, 0);
  assert.equal(lab.elements.nowStatus.textContent, 'ON AIR');

  responses.push({ body: state({ library: [libraryV1, libraryB] }) });
  await lab.reconcileAutomatically();
  assert.equal(lab.getState().active_run, null);
  assert.equal(lab.elements.nowStatus.textContent, 'OFF AIR');
  assert.equal(lab.getState().queue.length, 0);
  assert.deepEqual(calls.slice(2).map(call => call.options.method || 'GET'), ['GET', 'GET']);
});

test('Control Lab serializes automatic reads and rejects an older response after a newer state load', async () => {
  const { lab, responses, calls } = await createControlLabHarness();
  responses.push(
    { body: { authenticated: true, operator: 'DIRECTOR' } },
    { body: state({ library: [libraryV1], activeRun: activeV1 }) }
  );
  await lab.initialize();

  const pendingPoll = deferred();
  responses.push(pendingPoll.promise);
  const firstPoll = lab.reconcileAutomatically();
  await lab.reconcileAutomatically();
  assert.equal(calls.length, 3);

  const newerLoad = deferred();
  responses.push(newerLoad.promise);
  const laterState = lab.loadState();
  newerLoad.resolve({ body: state({ library: [libraryV1, libraryB], activeRun: activeB }) });
  await laterState;
  assert.equal(lab.getState().active_run.packaged_item_id, 'bulletin');

  pendingPoll.resolve({ body: state({ library: [libraryV1], activeRun: activeV1 }) });
  await firstPoll;
  assert.equal(lab.getState().active_run.packaged_item_id, 'bulletin');
  assert.equal(calls.length, 4);
});

test('Control Lab disposes automatic reconciliation on page exit and on session expiry', async () => {
  const pageHarness = await createControlLabHarness();
  pageHarness.responses.push(
    { body: { authenticated: true, operator: 'DIRECTOR' } },
    { body: state() }
  );
  await pageHarness.lab.initialize();
  const timerId = pageHarness.lab.getAutoReconcileState().timer;
  pageHarness.windowListeners.pagehide();
  assert.equal(pageHarness.intervals.size, 0);
  assert.deepEqual(pageHarness.clearedIntervals, [timerId]);
  assert.equal(pageHarness.lab.getAutoReconcileState().pageActive, false);
  await pageHarness.lab.reconcileAutomatically();
  assert.equal(pageHarness.calls.length, 2);

  const authHarness = await createControlLabHarness();
  authHarness.responses.push(
    { body: { authenticated: true, operator: 'DIRECTOR' } },
    { body: state() }
  );
  await authHarness.lab.initialize();
  authHarness.responses.push({ ok: false, status: 401, body: { error: 'MISSION_CONTROL_ACCESS_REQUIRED' } });
  await authHarness.lab.reconcileAutomatically();
  assert.equal(authHarness.lab.getAutoReconcileState().timer, null);
  assert.equal(authHarness.lab.getAutoReconcileState().authenticatedOperator, '');
  assert.equal(authHarness.lab.elements.authRequired.classList.contains('hidden'), false);
  assert.equal(authHarness.lab.elements.sessionState.textContent, 'NOT AUTHENTICATED');
});

test('real Control Lab client performs create to duplicate queue to start to v2 edit and refusal feedback', async () => {
  const { lab, responses, calls } = await createControlLabHarness();
  responses.push(
    { body: { authenticated: true, operator: 'DIRECTOR' } },
    { body: state() }
  );
  await lab.initialize();

  Object.assign(lab.elements.itemIdInput, { value: 'news' });
  Object.assign(lab.elements.itemTitleInput, { value: 'News v1' });
  Object.assign(lab.elements.itemKindSelect, { value: 'PROGRAM' });
  Object.assign(lab.elements.playbackTypeSelect, { value: 'test_card' });
  Object.assign(lab.elements.mediaRefInput, { value: '' });
  Object.assign(lab.elements.durationMsInput, { value: '12000' });
  lab.elements.loopEligibleInput.checked = false;
  responses.push(
    { status: 201, body: { item: libraryV1 } },
    { body: state({ library: [libraryV1] }) }
  );
  await lab.saveLibraryItem({ preventDefault() {} });
  assert.equal(lab.getState().library[0].definition_version, 1);

  responses.push(
    { status: 201, body: { entry: entryOne } },
    { body: state({ library: [libraryV1], queue: [entryOne] }) },
    { status: 201, body: { entry: entryTwo } },
    { body: state({ library: [libraryV1], queue: [entryOne, entryTwo] }) }
  );
  await lab.addToQueue('news');
  await lab.addToQueue('news');
  assert.deepEqual(lab.getState().queue.map(entry => entry.id), [10, 11]);

  responses.push(
    { body: { status: 'on_air', active_run: activeV1, queue: [entryTwo] } },
    { body: state({ library: [libraryV1], queue: [entryTwo], activeRun: activeV1 }) }
  );
  await lab.startBroadcastNow();
  assert.equal(lab.getState().active_run.source_definition_version, 1);

  lab.beginEdit(libraryV1);
  lab.elements.itemTitleInput.value = 'News v2';
  responses.push(
    { body: { item: libraryV2 } },
    { body: state({ library: [libraryV2], queue: [{ ...entryTwo, definition: libraryV2 }], activeRun: activeV1 }) }
  );
  await lab.saveLibraryItem({ preventDefault() {} });
  assert.equal(lab.getState().library[0].definition_version, 2);
  assert.equal(lab.getState().active_run.title, 'News v1');

  responses.push({
    ok: false,
    status: 409,
    body: {
      error: 'PACKAGED_ITEM_REFERENCED',
      details: { packaged_item_id: 'news', queued_reference_count: 1, active: true }
    }
  });
  await lab.deleteLibraryItem('news');
  assert.match(lab.elements.message.textContent, /Delete refused: news has 1 upcoming reference and is active NOW/);
  assert.equal(lab.elements.message.classList.contains('error'), true);

  const requests = calls.map(call => [call.url, call.options.method || 'GET']);
  assert.deepEqual(requests, [
    ['/api/mission-control/session', 'GET'],
    ['/api/admin/broadcast/control-lab', 'GET'],
    ['/api/admin/broadcast/library', 'POST'],
    ['/api/admin/broadcast/control-lab', 'GET'],
    ['/api/admin/broadcast/queue', 'POST'],
    ['/api/admin/broadcast/control-lab', 'GET'],
    ['/api/admin/broadcast/queue', 'POST'],
    ['/api/admin/broadcast/control-lab', 'GET'],
    ['/api/admin/broadcast/start', 'POST'],
    ['/api/admin/broadcast/control-lab', 'GET'],
    ['/api/admin/broadcast/library/news', 'PUT'],
    ['/api/admin/broadcast/control-lab', 'GET'],
    ['/api/admin/broadcast/library/news', 'DELETE']
  ]);
  assert.deepEqual(JSON.parse(calls[10].options.body), {
    id: 'news', title: 'News v2', item_kind: 'PROGRAM', playback_type: 'test_card',
    media_ref: '', duration_ms: 12000, loop_eligible: false,
    expected_definition_version: 1
  });
});
