import {
  PLAYBACK_TYPES,
  BroadcastError,
  isBroadcastError,
  readReconciledRuntime,
  readControlLabState,
  startBroadcastRun,
  stopBroadcastRun
} from './broadcast-control-lab.js';

export const PROGRAM_TYPES = PLAYBACK_TYPES;
export { BroadcastError, isBroadcastError };

function instantMs(value, field) {
  const milliseconds = value instanceof Date ? value.getTime() :
    typeof value === 'number' ? value : Date.parse(value);
  if (!Number.isFinite(milliseconds)) throw new TypeError(`${field} must be a valid instant`);
  return milliseconds;
}

function isoTime(milliseconds) {
  return new Date(milliseconds).toISOString();
}

export function offAirBroadcastState(authoritativeNow) {
  const nowMs = instantMs(authoritativeNow, 'authoritativeNow');
  return {
    status: 'off_air',
    server_time: isoTime(nowMs),
    current_program_id: null,
    current_program_started_at: null,
    program_duration: null,
    elapsed: null,
    remaining: null,
    next_program_id: null,
    current_program: null
  };
}

export function projectBroadcastState(runtime) {
  if (!runtime.active_run) return offAirBroadcastState(runtime.server_time);
  const active = runtime.active_run;
  const nowMs = instantMs(runtime.server_time, 'server_time');
  const startedMs = instantMs(active.started_at, 'started_at');
  const elapsed = Math.max(0, Math.min(active.duration_ms, nowMs - startedMs));
  return {
    status: 'on_air',
    server_time: isoTime(nowMs),
    current_program_id: active.packaged_item_id,
    current_program_started_at: isoTime(startedMs),
    program_duration: active.duration_ms,
    elapsed,
    remaining: active.duration_ms - elapsed,
    next_program_id: runtime.next_program_id,
    current_program: {
      id: active.packaged_item_id,
      title: active.title,
      program_type: active.playback_type,
      media_ref: active.media_ref,
      duration_ms: active.duration_ms,
      queue_position: active.source_queue_position
    }
  };
}

export async function readBroadcastState(client) {
  return projectBroadcastState(await readReconciledRuntime(client));
}

export async function readBroadcastAdminState(client) {
  return readControlLabState(client);
}

export async function replaceBroadcastPrograms() {
  throw new BroadcastError('BROADCAST_LEGACY_PACKAGER_RETIRED');
}

export async function startBroadcast(client) {
  return startBroadcastRun(client);
}

export async function stopBroadcast(client) {
  return stopBroadcastRun(client);
}
