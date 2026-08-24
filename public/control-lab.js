const byId = id => document.getElementById(id);
const sessionState = byId('sessionState');
const authRequired = byId('authRequired');
const lab = byId('lab');
const nowStatus = byId('nowStatus');
const nowDetails = byId('nowDetails');
const message = byId('message');
const refreshStateButton = byId('refreshState');
const startBroadcastButton = byId('startBroadcast');
const stopBroadcastButton = byId('stopBroadcast');
const libraryForm = byId('libraryForm');
const itemIdInput = byId('itemId');
const itemTitleInput = byId('itemTitle');
const itemKindSelect = byId('itemKind');
const playbackTypeSelect = byId('playbackType');
const mediaRefInput = byId('mediaRef');
const durationMsInput = byId('durationMs');
const loopEligibleInput = byId('loopEligible');
const saveItemButton = byId('saveItem');
const cancelEditButton = byId('cancelEdit');
const libraryList = byId('libraryList');
const queueSelect = byId('queueSelect');
const addQueueButton = byId('addQueue');
const queueList = byId('queueList');

let controlState = { status: 'off_air', active_run: null, library: [], queue: [] };
let editingItemId = null;
let busy = false;

class ControlLabRequestError extends Error {
  constructor(code, status, details) {
    super(code);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ControlLabRequestError(data.error || `HTTP_${response.status}`, response.status, data.details);
  return data;
}

function describeError(error) {
  if (error.code === 'PACKAGED_ITEM_REFERENCED') {
    const queued = error.details?.queued_reference_count || 0;
    const active = error.details?.active ? ' and is active NOW' : '';
    return `Delete refused: ${error.details?.packaged_item_id || 'item'} has ${queued} upcoming reference${queued === 1 ? '' : 's'}${active}. Nothing was changed.`;
  }
  const messages = {
    PACKAGED_ITEM_VERSION_CONFLICT: 'Edit refused because this item changed since it was loaded. Refresh and review the current version.',
    BROADCAST_QUEUE_EMPTY: 'Start refused because the Upcoming Queue is empty.',
    BROADCAST_ALREADY_RUNNING: 'Start refused because a run is already active.',
    BROADCAST_QUEUE_ENTRY_NOT_FOUND: 'That upcoming entry no longer exists. Refresh and try again.',
    INVALID_BROADCAST_QUEUE_ORDER: 'Queue reorder refused because the upcoming list changed. Refresh and try again.',
    MISSION_CONTROL_ACCESS_REQUIRED: 'Mission Control session expired. Sign in again.',
    BROADCAST_LEGACY_PACKAGER_RETIRED: 'The fixed Mission Control Packager is retired. Use this Control Lab.'
  };
  return messages[error.code] || error.code || error.message || 'Request failed.';
}

function setMessage(text = '', type = '') {
  message.textContent = text;
  message.className = `message${type ? ` ${type}` : ''}`;
}

function showAuthRequired() {
  sessionState.textContent = 'NOT AUTHENTICATED';
  authRequired.classList.remove('hidden');
  lab.classList.add('hidden');
}

function definitionPair(label, value) {
  const wrapper = document.createElement('div');
  const term = document.createElement('dt');
  const description = document.createElement('dd');
  term.textContent = label;
  description.textContent = value;
  wrapper.append(term, description);
  return wrapper;
}

function renderNow() {
  const active = controlState.active_run;
  const onAir = Boolean(active);
  nowStatus.textContent = onAir ? 'ON AIR' : 'OFF AIR';
  nowStatus.className = onAir ? 'on-air' : 'off-air';
  startBroadcastButton.disabled = busy || onAir || controlState.queue.length === 0;
  stopBroadcastButton.disabled = busy || !onAir;
  nowDetails.textContent = '';
  if (!active) {
    nowDetails.append(definitionPair('State', 'No active run'));
    return;
  }
  nowDetails.append(
    definitionPair('Run ID', String(active.run_id)),
    definitionPair('Library ID', active.packaged_item_id),
    definitionPair('Definition version', `v${active.source_definition_version}`),
    definitionPair('Started', new Date(active.started_at).toLocaleString()),
    definitionPair('Kind / playback', `${active.item_kind} / ${active.playback_type}`),
    definitionPair('Duration', `${active.duration_ms} ms`)
  );
}

function button(label, action, className = '') {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.className = className;
  element.disabled = busy;
  element.addEventListener('click', action);
  return element;
}

function beginEdit(item) {
  editingItemId = item.id;
  itemIdInput.value = item.id;
  itemIdInput.disabled = true;
  itemTitleInput.value = item.title;
  itemKindSelect.value = item.item_kind;
  playbackTypeSelect.value = item.playback_type;
  mediaRefInput.value = item.media_ref || '';
  durationMsInput.value = String(item.duration_ms);
  loopEligibleInput.checked = item.loop_eligible;
  saveItemButton.textContent = `Save v${item.definition_version + 1}`;
  cancelEditButton.classList.remove('hidden');
  libraryForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetForm() {
  editingItemId = null;
  libraryForm.reset();
  itemIdInput.disabled = false;
  durationMsInput.value = '12000';
  saveItemButton.textContent = 'Create library item';
  cancelEditButton.classList.add('hidden');
}

function renderLibrary() {
  libraryList.textContent = '';
  queueSelect.textContent = '';
  if (!controlState.library.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No reusable definitions yet.';
    libraryList.appendChild(empty);
  }
  for (const item of controlState.library) {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.id} // ${item.title} // v${item.definition_version}`;
    queueSelect.appendChild(option);

    const record = document.createElement('article');
    record.className = 'record';
    record.dataset.packagedItemId = item.id;
    const title = document.createElement('div');
    title.className = 'record-title';
    const strong = document.createElement('strong');
    strong.textContent = item.title;
    const version = document.createElement('span');
    version.textContent = `v${item.definition_version}`;
    title.append(strong, version);
    const meta = document.createElement('div');
    meta.className = 'record-meta';
    meta.textContent = `${item.id} // ${item.item_kind} // ${item.playback_type} // ${item.duration_ms} ms${item.loop_eligible ? ' // LOOP eligible (inert)' : ''}`;
    const actions = document.createElement('div');
    actions.className = 'record-actions';
    actions.append(
      button('Edit', () => beginEdit(item)),
      button('Add to queue', () => addToQueue(item.id)),
      button('Delete', () => deleteLibraryItem(item.id), 'danger')
    );
    record.append(title, meta, actions);
    libraryList.appendChild(record);
  }
  queueSelect.disabled = busy || controlState.library.length === 0;
  addQueueButton.disabled = busy || controlState.library.length === 0;
}

function renderQueue() {
  queueList.textContent = '';
  if (!controlState.queue.length) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'Upcoming Queue is empty.';
    queueList.appendChild(empty);
    return;
  }
  controlState.queue.forEach((entry, index) => {
    const row = document.createElement('li');
    row.dataset.queueEntryId = String(entry.id);
    const title = document.createElement('div');
    title.className = 'record-title';
    const strong = document.createElement('strong');
    strong.textContent = `${index + 1}. ${entry.definition.title}`;
    const identity = document.createElement('span');
    identity.textContent = `entry #${entry.id}`;
    title.append(strong, identity);
    const meta = document.createElement('div');
    meta.className = 'record-meta';
    meta.textContent = `${entry.packaged_item_id} // resolves current v${entry.definition.definition_version} at activation`;
    const actions = document.createElement('div');
    actions.className = 'record-actions';
    const up = button('Up', () => moveQueueEntry(index, -1));
    const down = button('Down', () => moveQueueEntry(index, 1));
    up.disabled = busy || index === 0;
    down.disabled = busy || index === controlState.queue.length - 1;
    actions.append(up, down, button('Remove', () => removeUpcoming(entry.id), 'danger'));
    row.append(title, meta, actions);
    queueList.appendChild(row);
  });
}

function renderState() {
  renderNow();
  renderLibrary();
  renderQueue();
  refreshStateButton.disabled = busy;
}

async function loadState() {
  controlState = await api('/api/admin/broadcast/control-lab');
  renderState();
  return controlState;
}

async function runAction(action, successMessage) {
  if (busy) return;
  busy = true;
  setMessage('Working…');
  renderState();
  try {
    await action();
    await loadState();
    setMessage(successMessage, 'success');
  } catch (error) {
    if (error.status === 401) showAuthRequired();
    setMessage(describeError(error), 'error');
  } finally {
    busy = false;
    renderState();
  }
}

function formPayload() {
  return {
    id: itemIdInput.value.trim(),
    title: itemTitleInput.value.trim(),
    item_kind: itemKindSelect.value,
    playback_type: playbackTypeSelect.value,
    media_ref: mediaRefInput.value.trim(),
    duration_ms: Number(durationMsInput.value),
    loop_eligible: loopEligibleInput.checked
  };
}

async function saveLibraryItem(event) {
  event.preventDefault();
  const payload = formPayload();
  if (editingItemId) {
    const current = controlState.library.find(item => item.id === editingItemId);
    payload.expected_definition_version = current?.definition_version;
    await runAction(
      () => api(`/api/admin/broadcast/library/${encodeURIComponent(editingItemId)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      }),
      `${editingItemId} saved as a new definition version. The active run was not edited.`
    );
  } else {
    await runAction(
      () => api('/api/admin/broadcast/library', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      }),
      `${payload.id} created in the reusable Library.`
    );
  }
  if (!message.classList.contains('error')) resetForm();
}

async function deleteLibraryItem(id) {
  await runAction(
    () => api(`/api/admin/broadcast/library/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    `${id} deleted from the Library.`
  );
}

async function addToQueue(id = queueSelect.value) {
  if (!id) return;
  await runAction(
    () => api('/api/admin/broadcast/queue', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packaged_item_id: id })
    }),
    `${id} added as a new Upcoming reference.`
  );
}

async function moveQueueEntry(index, direction) {
  const reordered = controlState.queue.map(entry => entry.id);
  const target = index + direction;
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  await runAction(
    () => api('/api/admin/broadcast/queue/order', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entry_ids: reordered })
    }),
    'Upcoming Queue order saved. NOW was not changed.'
  );
}

async function removeUpcoming(entryId) {
  await runAction(
    () => api(`/api/admin/broadcast/queue/${entryId}`, { method: 'DELETE' }),
    `Upcoming entry #${entryId} removed. NOW was not changed.`
  );
}

async function startBroadcastNow() {
  await runAction(
    () => api('/api/admin/broadcast/start', { method: 'POST' }),
    'Broadcast started from the first Upcoming reference.'
  );
}

async function stopBroadcastNow() {
  await runAction(
    () => api('/api/admin/broadcast/stop', { method: 'POST' }),
    'Broadcast stopped. Library and remaining Upcoming references were retained.'
  );
}

async function initialize() {
  try {
    const session = await api('/api/mission-control/session');
    sessionState.textContent = `AUTHENTICATED // ${session.operator}`;
    authRequired.classList.add('hidden');
    lab.classList.remove('hidden');
    await loadState();
  } catch (error) {
    if (error.status === 401) return showAuthRequired();
    sessionState.textContent = 'CONTROL LAB UNAVAILABLE';
    authRequired.classList.add('hidden');
    lab.classList.remove('hidden');
    setMessage(describeError(error), 'error');
  }
}

libraryForm.addEventListener('submit', saveLibraryItem);
cancelEditButton.addEventListener('click', resetForm);
addQueueButton.addEventListener('click', () => addToQueue());
refreshStateButton.addEventListener('click', () => runAction(async () => {}, 'Authoritative state refreshed.'));
startBroadcastButton.addEventListener('click', startBroadcastNow);
stopBroadcastButton.addEventListener('click', stopBroadcastNow);

initialize();
