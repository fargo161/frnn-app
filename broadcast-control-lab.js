export const PLAYBACK_TYPES = Object.freeze(['test_card', 'image', 'video']);
export const ITEM_KINDS = Object.freeze(['PROGRAM', 'TRANSITION']);

const PLAYBACK_TYPE_SET = new Set(PLAYBACK_TYPES);
const ITEM_KIND_SET = new Set(ITEM_KINDS);
const PACKAGED_ITEM_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;

export class BroadcastError extends Error {
  constructor(code, details = undefined) {
    super(code);
    this.name = 'BroadcastError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

export function isBroadcastError(error) {
  return error instanceof BroadcastError;
}

function invalidPackagedItem(details) {
  return new BroadcastError('INVALID_PACKAGED_ITEM', details);
}

function integerValue(value) {
  if (typeof value === 'string' && value.trim() !== '') value = Number(value);
  return Number.isSafeInteger(value) ? value : null;
}

function booleanValue(value) {
  return typeof value === 'boolean' ? value : null;
}

function safeMediaReference(value) {
  if (typeof value !== 'string') return false;
  const ref = value.trim();
  if (!ref || ref.length > 2048 || CONTROL_CHARACTER.test(ref) || ref.includes('\\')) return false;
  if (ref.startsWith('/')) return !ref.startsWith('//');
  try {
    const parsed = new URL(ref);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

export function validatePackagedItem(input, { requireId = true, requireExpectedVersion = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw invalidPackagedItem([{ field: 'item', reason: 'must be an object' }]);
  }

  const details = [];
  const id = typeof input.id === 'string' ? input.id.trim() : '';
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const itemKind = typeof input.item_kind === 'string' ? input.item_kind.trim() : '';
  const playbackType = typeof input.playback_type === 'string' ? input.playback_type.trim() : '';
  const suppliedMediaRef = typeof input.media_ref === 'string' ? input.media_ref.trim() : '';
  const durationMs = integerValue(input.duration_ms);
  const loopEligible = booleanValue(input.loop_eligible);
  const expectedDefinitionVersion = integerValue(input.expected_definition_version);

  if (requireId && !PACKAGED_ITEM_ID.test(id)) {
    details.push({ field: 'id', reason: 'must be 1-128 letters, numbers, underscores, or hyphens' });
  }
  if (!title || title.length > 200 || CONTROL_CHARACTER.test(title)) {
    details.push({ field: 'title', reason: 'must be 1-200 printable characters' });
  }
  if (!ITEM_KIND_SET.has(itemKind)) {
    details.push({ field: 'item_kind', reason: `must be one of ${ITEM_KINDS.join(', ')}` });
  }
  if (!PLAYBACK_TYPE_SET.has(playbackType)) {
    details.push({ field: 'playback_type', reason: `must be one of ${PLAYBACK_TYPES.join(', ')}` });
  }
  if (durationMs === null || durationMs <= 0) {
    details.push({ field: 'duration_ms', reason: 'must be a positive safe integer' });
  }
  if (loopEligible === null) {
    details.push({ field: 'loop_eligible', reason: 'must be a boolean' });
  }
  if (suppliedMediaRef && !safeMediaReference(suppliedMediaRef)) {
    details.push({ field: 'media_ref', reason: 'must be a safe root-relative or http(s) URL' });
  } else if ((playbackType === 'image' || playbackType === 'video') && !suppliedMediaRef) {
    details.push({ field: 'media_ref', reason: 'image and video items require a media reference' });
  }
  if (requireExpectedVersion && (expectedDefinitionVersion === null || expectedDefinitionVersion <= 0)) {
    details.push({ field: 'expected_definition_version', reason: 'must be a positive safe integer' });
  }

  if (details.length) throw invalidPackagedItem(details);
  return {
    ...(requireId ? { id } : {}),
    title,
    item_kind: itemKind,
    playback_type: playbackType,
    media_ref: suppliedMediaRef || null,
    duration_ms: durationMs,
    loop_eligible: loopEligible,
    ...(requireExpectedVersion ? { expected_definition_version: expectedDefinitionVersion } : {})
  };
}

function safeNumber(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error(`${field} exceeds the JavaScript safe integer range`);
  return number;
}

function isoTime(value) {
  if (value === null || value === undefined) return null;
  const instant = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(instant.getTime())) throw new Error('invalid database timestamp');
  return instant.toISOString();
}

export function packagedItemFromRow(row) {
  return {
    id: row.id,
    definition_version: safeNumber(row.definition_version, 'definition_version'),
    title: row.title,
    item_kind: row.item_kind,
    playback_type: row.playback_type,
    media_ref: row.media_ref,
    duration_ms: safeNumber(row.duration_ms, 'duration_ms'),
    loop_eligible: row.loop_eligible,
    created_at: isoTime(row.created_at),
    updated_at: isoTime(row.updated_at)
  };
}

export function queueEntryFromRow(row) {
  const entry = {
    id: safeNumber(row.id, 'queue_entry_id'),
    packaged_item_id: row.packaged_item_id,
    queue_position: safeNumber(row.queue_position, 'queue_position'),
    created_at: isoTime(row.created_at)
  };
  if (row.definition_version !== undefined) {
    entry.definition = packagedItemFromRow({
      id: row.packaged_item_id,
      definition_version: row.definition_version,
      title: row.title,
      item_kind: row.item_kind,
      playback_type: row.playback_type,
      media_ref: row.media_ref,
      duration_ms: row.duration_ms,
      loop_eligible: row.loop_eligible,
      created_at: row.item_created_at,
      updated_at: row.item_updated_at
    });
  }
  return entry;
}

export function activeRunFromRow(row) {
  if (!row?.run_id) return null;
  return {
    run_id: safeNumber(row.run_id, 'run_id'),
    packaged_item_id: row.packaged_item_id,
    source_definition_version: safeNumber(row.source_definition_version, 'source_definition_version'),
    source_queue_entry_id: safeNumber(row.source_queue_entry_id, 'source_queue_entry_id'),
    source_queue_position: safeNumber(row.source_queue_position, 'source_queue_position'),
    title: row.title,
    item_kind: row.item_kind,
    playback_type: row.playback_type,
    media_ref: row.media_ref,
    duration_ms: safeNumber(row.duration_ms, 'duration_ms'),
    started_at: isoTime(row.started_at)
  };
}

async function lockActiveSingleton(client) {
  const result = await client.query(
    `SELECT active.*
     FROM broadcast_active_run active
     WHERE singleton=TRUE
     FOR UPDATE`
  );
  if (!result.rows[0]) throw new Error('broadcast_active_run singleton is missing');
  const authority = await client.query('SELECT clock_timestamp() AS server_time');
  return { ...result.rows[0], server_time: authority.rows[0].server_time };
}

async function clearActiveRun(client) {
  await client.query(
    `UPDATE broadcast_active_run SET
       run_id=NULL,
       packaged_item_id=NULL,
       source_definition_version=NULL,
       source_queue_entry_id=NULL,
       source_queue_position=NULL,
       title=NULL,
       item_kind=NULL,
       playback_type=NULL,
       media_ref=NULL,
       duration_ms=NULL,
       started_at=NULL
     WHERE singleton=TRUE`
  );
}

async function activateHeadQueueEntry(client, startedAt) {
  const head = await client.query(
    `SELECT
       queue_entry.id AS queue_entry_id,
       queue_entry.queue_position,
       item.*
     FROM broadcast_queue_entries queue_entry
     JOIN broadcast_packaged_items item ON item.id=queue_entry.packaged_item_id
     ORDER BY queue_entry.queue_position,queue_entry.id
     LIMIT 1
     FOR UPDATE OF queue_entry,item`
  );
  if (!head.rows[0]) {
    await clearActiveRun(client);
    return null;
  }

  const source = head.rows[0];
  const activated = await client.query(
    `UPDATE broadcast_active_run SET
       run_id=nextval('broadcast_run_id_seq'),
       packaged_item_id=$1,
       source_definition_version=$2,
       source_queue_entry_id=$3,
       source_queue_position=$4,
       title=$5,
       item_kind=$6,
       playback_type=$7,
       media_ref=$8,
       duration_ms=$9,
       started_at=$10
     WHERE singleton=TRUE
     RETURNING *`,
    [
      source.id,
      source.definition_version,
      source.queue_entry_id,
      source.queue_position,
      source.title,
      source.item_kind,
      source.playback_type,
      source.media_ref,
      source.duration_ms,
      startedAt
    ]
  );
  await client.query('DELETE FROM broadcast_queue_entries WHERE id=$1', [source.queue_entry_id]);
  return activeRunFromRow(activated.rows[0]);
}

async function recordBoundaryAudit(client, previousRun, nextRun, boundaryAt) {
  await client.query(
    `INSERT INTO mission_control_audit(action,code,operator,detail)
     VALUES('BROADCAST_BOUNDARY_ACTIVATED',NULL,'SYSTEM',$1::jsonb)`,
    [JSON.stringify({
      previousRunId: previousRun.run_id,
      nextRunId: nextRun?.run_id ?? null,
      nextPackagedItemId: nextRun?.packaged_item_id ?? null,
      boundaryAt
    })]
  );
}

async function lockAndReconcile(client) {
  const locked = await lockActiveSingleton(client);
  const serverTime = new Date(locked.server_time);
  let activeRun = activeRunFromRow(locked);

  while (activeRun) {
    const boundaryMs = Date.parse(activeRun.started_at) + activeRun.duration_ms;
    if (serverTime.getTime() < boundaryMs) break;
    const boundaryAt = new Date(boundaryMs).toISOString();
    const previousRun = activeRun;
    activeRun = await activateHeadQueueEntry(client, boundaryAt);
    await recordBoundaryAudit(client, previousRun, activeRun, boundaryAt);
  }

  return { server_time: serverTime.toISOString(), active_run: activeRun };
}

export async function listPackagedItems(client) {
  const result = await client.query(
    `SELECT * FROM broadcast_packaged_items
     ORDER BY created_at,id`
  );
  return result.rows.map(packagedItemFromRow);
}

export async function listQueueEntries(client) {
  const result = await client.query(
    `SELECT
       queue_entry.id,
       queue_entry.packaged_item_id,
       queue_entry.queue_position,
       queue_entry.created_at,
       item.definition_version,
       item.title,
       item.item_kind,
       item.playback_type,
       item.media_ref,
       item.duration_ms,
       item.loop_eligible,
       item.created_at AS item_created_at,
       item.updated_at AS item_updated_at
     FROM broadcast_queue_entries queue_entry
     JOIN broadcast_packaged_items item ON item.id=queue_entry.packaged_item_id
     ORDER BY queue_entry.queue_position,queue_entry.id`
  );
  return result.rows.map(queueEntryFromRow);
}

export async function readReconciledRuntime(client) {
  const runtime = await lockAndReconcile(client);
  const next = await client.query(
    `SELECT packaged_item_id
     FROM broadcast_queue_entries
     ORDER BY queue_position,id
     LIMIT 1`
  );
  return {
    ...runtime,
    next_program_id: next.rows[0]?.packaged_item_id ?? null
  };
}

export async function readControlLabState(client) {
  const runtime = await lockAndReconcile(client);
  const library = await listPackagedItems(client);
  const queue = await listQueueEntries(client);
  return {
    status: runtime.active_run ? 'on_air' : 'off_air',
    server_time: runtime.server_time,
    active_run: runtime.active_run,
    library,
    queue
  };
}

export async function createPackagedItem(client, input) {
  const item = validatePackagedItem(input);
  await lockAndReconcile(client);
  try {
    const result = await client.query(
      `INSERT INTO broadcast_packaged_items(
         id,title,item_kind,playback_type,media_ref,duration_ms,loop_eligible
       ) VALUES($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        item.id,
        item.title,
        item.item_kind,
        item.playback_type,
        item.media_ref,
        item.duration_ms,
        item.loop_eligible
      ]
    );
    return packagedItemFromRow(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') throw new BroadcastError('PACKAGED_ITEM_ALREADY_EXISTS', { packaged_item_id: item.id });
    throw error;
  }
}

export async function updatePackagedItem(client, id, input) {
  const packagedItemId = typeof id === 'string' ? id.trim() : '';
  if (!PACKAGED_ITEM_ID.test(packagedItemId)) {
    throw invalidPackagedItem([{ field: 'id', reason: 'must be a valid packaged item ID' }]);
  }
  const item = validatePackagedItem(input, { requireId: false, requireExpectedVersion: true });
  await lockAndReconcile(client);
  const currentResult = await client.query(
    'SELECT * FROM broadcast_packaged_items WHERE id=$1 FOR UPDATE',
    [packagedItemId]
  );
  if (!currentResult.rows[0]) {
    throw new BroadcastError('PACKAGED_ITEM_NOT_FOUND', { packaged_item_id: packagedItemId });
  }
  const currentVersion = safeNumber(currentResult.rows[0].definition_version, 'definition_version');
  if (currentVersion !== item.expected_definition_version) {
    throw new BroadcastError('PACKAGED_ITEM_VERSION_CONFLICT', {
      packaged_item_id: packagedItemId,
      expected_definition_version: item.expected_definition_version,
      current_definition_version: currentVersion
    });
  }

  const updated = await client.query(
    `UPDATE broadcast_packaged_items SET
       definition_version=definition_version+1,
       title=$2,
       item_kind=$3,
       playback_type=$4,
       media_ref=$5,
       duration_ms=$6,
       loop_eligible=$7,
       updated_at=clock_timestamp()
     WHERE id=$1 AND definition_version=$8
     RETURNING *`,
    [
      packagedItemId,
      item.title,
      item.item_kind,
      item.playback_type,
      item.media_ref,
      item.duration_ms,
      item.loop_eligible,
      item.expected_definition_version
    ]
  );
  if (!updated.rows[0]) throw new Error('packaged item version changed while locked');
  return packagedItemFromRow(updated.rows[0]);
}

async function referenceDetails(client, packagedItemId) {
  const result = await client.query(
    `SELECT
       (SELECT COUNT(*)::INTEGER FROM broadcast_queue_entries WHERE packaged_item_id=$1) AS queued_reference_count,
       EXISTS(
         SELECT 1 FROM broadcast_active_run
         WHERE singleton=TRUE AND packaged_item_id=$1
       ) AS active`,
    [packagedItemId]
  );
  return {
    packaged_item_id: packagedItemId,
    queued_reference_count: result.rows[0].queued_reference_count,
    active: result.rows[0].active
  };
}

export async function deletePackagedItem(client, id) {
  const packagedItemId = typeof id === 'string' ? id.trim() : '';
  await lockAndReconcile(client);
  const target = await client.query(
    'SELECT id FROM broadcast_packaged_items WHERE id=$1 FOR UPDATE',
    [packagedItemId]
  );
  if (!target.rows[0]) {
    throw new BroadcastError('PACKAGED_ITEM_NOT_FOUND', { packaged_item_id: packagedItemId });
  }
  let details = await referenceDetails(client, packagedItemId);
  if (details.queued_reference_count > 0 || details.active) {
    throw new BroadcastError('PACKAGED_ITEM_REFERENCED', details);
  }

  await client.query('SAVEPOINT broadcast_delete_packaged_item');
  try {
    await client.query('DELETE FROM broadcast_packaged_items WHERE id=$1', [packagedItemId]);
    await client.query('RELEASE SAVEPOINT broadcast_delete_packaged_item');
  } catch (error) {
    await client.query('ROLLBACK TO SAVEPOINT broadcast_delete_packaged_item');
    if (error.code === '23503') {
      details = await referenceDetails(client, packagedItemId);
      throw new BroadcastError('PACKAGED_ITEM_REFERENCED', details);
    }
    throw error;
  }
  return { deleted: true, packaged_item_id: packagedItemId };
}

export async function addQueueEntry(client, packagedItemIdInput) {
  const packagedItemId = typeof packagedItemIdInput === 'string' ? packagedItemIdInput.trim() : '';
  await lockAndReconcile(client);
  const item = await client.query(
    'SELECT id FROM broadcast_packaged_items WHERE id=$1 FOR KEY SHARE',
    [packagedItemId]
  );
  if (!item.rows[0]) {
    throw new BroadcastError('PACKAGED_ITEM_NOT_FOUND', { packaged_item_id: packagedItemId });
  }
  const inserted = await client.query(
    `INSERT INTO broadcast_queue_entries(packaged_item_id,queue_position)
     SELECT $1,COALESCE(MAX(queue_position),0)+1
     FROM broadcast_queue_entries
     RETURNING *`,
    [packagedItemId]
  );
  return queueEntryFromRow(inserted.rows[0]);
}

function normalizeQueueOrder(input) {
  if (!Array.isArray(input)) {
    throw new BroadcastError('INVALID_BROADCAST_QUEUE_ORDER', [{ field: 'entry_ids', reason: 'must be an array' }]);
  }
  const ids = input.map(integerValue);
  if (ids.some(id => id === null || id <= 0) || new Set(ids).size !== ids.length) {
    throw new BroadcastError('INVALID_BROADCAST_QUEUE_ORDER', [{
      field: 'entry_ids',
      reason: 'must contain distinct positive safe-integer queue-entry IDs'
    }]);
  }
  return ids;
}

export async function reorderQueueEntries(client, input) {
  const entryIds = normalizeQueueOrder(input);
  await lockAndReconcile(client);
  const current = await client.query(
    `SELECT id FROM broadcast_queue_entries
     ORDER BY queue_position,id
     FOR UPDATE`
  );
  const currentIds = current.rows.map(row => safeNumber(row.id, 'queue_entry_id'));
  if (currentIds.length !== entryIds.length || currentIds.some(id => !entryIds.includes(id))) {
    throw new BroadcastError('INVALID_BROADCAST_QUEUE_ORDER', [{
      field: 'entry_ids',
      reason: 'must be the complete current upcoming queue-entry set'
    }]);
  }

  await client.query('SET CONSTRAINTS broadcast_queue_entries_queue_position_key DEFERRED');
  for (const [index, entryId] of entryIds.entries()) {
    await client.query(
      'UPDATE broadcast_queue_entries SET queue_position=$1 WHERE id=$2',
      [index + 1, entryId]
    );
  }
  return listQueueEntries(client);
}

export async function removeQueueEntry(client, entryIdInput) {
  const entryId = integerValue(entryIdInput);
  if (entryId === null || entryId <= 0) {
    throw new BroadcastError('INVALID_BROADCAST_QUEUE_ENTRY', { queue_entry_id: entryIdInput });
  }
  await lockAndReconcile(client);
  const removed = await client.query(
    `DELETE FROM broadcast_queue_entries
     WHERE id=$1
     RETURNING *`,
    [entryId]
  );
  if (!removed.rows[0]) {
    throw new BroadcastError('BROADCAST_QUEUE_ENTRY_NOT_FOUND', { queue_entry_id: entryId });
  }
  return queueEntryFromRow(removed.rows[0]);
}

export async function startBroadcastRun(client) {
  const runtime = await lockAndReconcile(client);
  if (runtime.active_run) {
    throw new BroadcastError('BROADCAST_ALREADY_RUNNING', {
      run_id: runtime.active_run.run_id,
      started_at: runtime.active_run.started_at
    });
  }
  const activeRun = await activateHeadQueueEntry(client, runtime.server_time);
  if (!activeRun) throw new BroadcastError('BROADCAST_QUEUE_EMPTY');
  return {
    status: 'on_air',
    server_time: runtime.server_time,
    active_run: activeRun,
    queue: await listQueueEntries(client)
  };
}

export async function stopBroadcastRun(client) {
  const runtime = await lockAndReconcile(client);
  const stoppedRun = runtime.active_run;
  if (stoppedRun) await clearActiveRun(client);
  return {
    status: 'off_air',
    server_time: runtime.server_time,
    active_run: null,
    stopped_run_id: stoppedRun?.run_id ?? null,
    queue: await listQueueEntries(client)
  };
}
