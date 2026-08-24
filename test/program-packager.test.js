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
  const document = {
    createElement: tagName => new FakeElement(tagName),
    getElementById: id => {
      if (!elements.has(id)) elements.set(id, new FakeElement());
      return elements.get(id);
    }
  };
  for (const id of ['authRequired', 'lab', 'cancelEdit']) document.getElementById(id).className = 'hidden';
  const calls = [];
  const responses = [];
  const fetch = async (url, options = {}) => {
    calls.push({ url, options });
    const response = responses.shift();
    if (!response) throw new Error(`No fake response queued for ${url}`);
    return {
      ok: response.ok ?? true,
      status: response.status ?? 200,
      json: async () => response.body ?? {}
    };
  };
  const exposed = script.replace(/initialize\(\);\s*$/, '') + `
globalThis.__controlLab = {
  initialize,loadState,saveLibraryItem,beginEdit,addToQueue,moveQueueEntry,
  removeUpcoming,deleteLibraryItem,startBroadcastNow,stopBroadcastNow,runAction,describeError,
  getState:()=>controlState,
  elements:{sessionState,authRequired,lab,nowStatus,nowDetails,message,libraryForm,
    itemIdInput,itemTitleInput,itemKindSelect,playbackTypeSelect,mediaRefInput,
    durationMsInput,loopEligibleInput,libraryList,queueSelect,queueList,
    startBroadcastButton,stopBroadcastButton}
};`;
  const context = {
    document, fetch, console, Date, JSON, Number, String, Boolean, Promise, Set,
    encodeURIComponent, globalThis: null
  };
  context.globalThis = context;
  vm.runInNewContext(exposed, context, { filename: 'public/control-lab.js' });
  return { lab: context.__controlLab, calls, responses, html, admin };
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
