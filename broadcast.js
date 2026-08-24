export const PROGRAM_TYPES = Object.freeze(['test_card', 'image', 'video']);

const PROGRAM_TYPE_SET = new Set(PROGRAM_TYPES);
const PROGRAM_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
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

function queueError(details) {
  return new BroadcastError('INVALID_PROGRAM_QUEUE', details);
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

function integerValue(value) {
  if (typeof value === 'string' && value.trim() !== '') value = Number(value);
  return Number.isSafeInteger(value) ? value : null;
}

function normalizeProgram(raw, index, details) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    details.push({ index, field: 'program', reason: 'must be an object' });
    return null;
  }

  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const programType = typeof raw.program_type === 'string' ? raw.program_type.trim() : '';
  const durationMs = integerValue(raw.duration_ms);
  const queuePosition = integerValue(raw.queue_position);
  const suppliedMediaRef = typeof raw.media_ref === 'string' ? raw.media_ref.trim() : '';

  if (!PROGRAM_ID.test(id)) {
    details.push({ index, field: 'id', reason: 'must be 1-128 letters, numbers, underscores, or hyphens' });
  }
  if (!title || title.length > 200 || CONTROL_CHARACTER.test(title)) {
    details.push({ index, field: 'title', reason: 'must be 1-200 printable characters' });
  }
  if (!PROGRAM_TYPE_SET.has(programType)) {
    details.push({ index, field: 'program_type', reason: `must be one of ${PROGRAM_TYPES.join(', ')}` });
  }
  if (durationMs === null || durationMs <= 0) {
    details.push({ index, field: 'duration_ms', reason: 'must be a positive safe integer' });
  }
  if (queuePosition === null || queuePosition <= 0 || queuePosition > 2147483647) {
    details.push({ index, field: 'queue_position', reason: 'must be a positive 32-bit integer' });
  }
  if (suppliedMediaRef && !safeMediaReference(suppliedMediaRef)) {
    details.push({
      index,
      field: 'media_ref',
      reason: 'references must be safe root-relative or http(s) URLs'
    });
  } else if ((programType === 'image' || programType === 'video') && !suppliedMediaRef) {
    details.push({
      index,
      field: 'media_ref',
      reason: 'image and video references must be safe root-relative or http(s) URLs'
    });
  }

  if (!id || !title || !PROGRAM_TYPE_SET.has(programType) ||
      durationMs === null || durationMs <= 0 ||
      queuePosition === null || queuePosition <= 0 || queuePosition > 2147483647 ||
      (suppliedMediaRef && !safeMediaReference(suppliedMediaRef)) ||
      ((programType === 'image' || programType === 'video') && !suppliedMediaRef)) {
    return null;
  }

  return {
    id,
    title,
    program_type: programType,
    media_ref: suppliedMediaRef || null,
    duration_ms: durationMs,
    queue_position: queuePosition
  };
}

export function validateProgramQueue(input) {
  if (!Array.isArray(input)) {
    throw queueError([{ field: 'programs', reason: 'must be an array' }]);
  }
  if (input.length === 0) {
    throw queueError([{ field: 'programs', reason: 'must contain at least one Program' }]);
  }

  const details = [];
  const programs = input.map((program, index) => normalizeProgram(program, index, details));
  const ids = new Map();
  const positions = new Map();
  for (const [index, program] of programs.entries()) {
    if (!program) continue;
    if (ids.has(program.id)) {
      details.push({ index, field: 'id', reason: `duplicates Program at index ${ids.get(program.id)}` });
    } else {
      ids.set(program.id, index);
    }
    if (positions.has(program.queue_position)) {
      details.push({
        index,
        field: 'queue_position',
        reason: `duplicates Program at index ${positions.get(program.queue_position)}`
      });
    } else {
      positions.set(program.queue_position, index);
    }
  }
  if (details.length) throw queueError(details);

  const ordered = programs.sort((a, b) => a.queue_position - b.queue_position);
  const totalDuration = ordered.reduce((total, program) => total + program.duration_ms, 0);
  if (!Number.isSafeInteger(totalDuration)) {
    throw queueError([{ field: 'duration_ms', reason: 'total queue duration exceeds the safe integer range' }]);
  }
  return ordered;
}

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

export function resolveBroadcastState(queue, anchor, authoritativeNow) {
  const programs = validateProgramQueue(queue);
  const anchorMs = instantMs(anchor, 'anchor');
  const nowMs = instantMs(authoritativeNow, 'authoritativeNow');
  const totalDuration = programs.reduce((total, program) => total + program.duration_ms, 0);
  const totalElapsed = Math.max(0, nowMs - anchorMs);
  const completedCycles = Math.floor(totalElapsed / totalDuration);
  const cycleElapsed = totalElapsed % totalDuration;

  let offset = 0;
  let currentIndex = 0;
  for (let index = 0; index < programs.length; index += 1) {
    const end = offset + programs[index].duration_ms;
    if (cycleElapsed < end) {
      currentIndex = index;
      break;
    }
    offset = end;
  }

  const currentProgram = programs[currentIndex];
  const elapsed = cycleElapsed - offset;
  const currentStartedAt = anchorMs + (completedCycles * totalDuration) + offset;
  return {
    status: 'on_air',
    server_time: isoTime(nowMs),
    current_program_id: currentProgram.id,
    current_program_started_at: isoTime(currentStartedAt),
    program_duration: currentProgram.duration_ms,
    elapsed,
    remaining: currentProgram.duration_ms - elapsed,
    next_program_id: programs[(currentIndex + 1) % programs.length].id,
    current_program: currentProgram
  };
}

export async function listBroadcastPrograms(client) {
  const result = await client.query(
    `SELECT id,title,program_type,media_ref,duration_ms,queue_position
     FROM broadcast_programs
     ORDER BY queue_position,id`
  );
  if (!result.rows.length) return [];
  return validateProgramQueue(result.rows);
}

async function lockedClock(client) {
  const result = await client.query(
    'SELECT started_at FROM broadcast_clock WHERE singleton=TRUE FOR UPDATE'
  );
  if (!result.rows[0]) throw new Error('broadcast_clock singleton is missing');
  return result.rows[0];
}

export async function readBroadcastAdminState(client) {
  const snapshot = await readBroadcastSnapshot(client);
  const startedAt = snapshot.startedAt;
  return {
    status: startedAt ? 'on_air' : 'off_air',
    started_at: startedAt ? isoTime(instantMs(startedAt, 'started_at')) : null,
    programs: snapshot.programs
  };
}

export async function readBroadcastState(client) {
  const snapshot = await readBroadcastSnapshot(client);
  if (!snapshot.startedAt) return offAirBroadcastState(snapshot.serverTime);
  return resolveBroadcastState(snapshot.programs, snapshot.startedAt, snapshot.serverTime);
}

async function readBroadcastSnapshot(client) {
  const result = await client.query(
    `WITH authority AS MATERIALIZED (
       SELECT started_at,clock_timestamp() AS server_time
       FROM broadcast_clock
       WHERE singleton=TRUE
     )
     SELECT
       authority.started_at,authority.server_time,
       program.id,program.title,program.program_type,program.media_ref,
       program.duration_ms,program.queue_position
     FROM authority
     LEFT JOIN broadcast_programs program ON TRUE
     ORDER BY program.queue_position,program.id`
  );
  if (!result.rows[0]) throw new Error('broadcast_clock singleton is missing');
  const first = result.rows[0];
  const programRows = result.rows.filter(row => row.id !== null);
  return {
    startedAt: first.started_at,
    serverTime: first.server_time,
    programs: programRows.length ? validateProgramQueue(programRows) : []
  };
}

export async function replaceBroadcastPrograms(client, input) {
  const programs = validateProgramQueue(input);
  const clock = await lockedClock(client);
  if (clock.started_at) throw new BroadcastError('BROADCAST_RUNNING_EDIT_FORBIDDEN');

  await client.query('DELETE FROM broadcast_programs');
  for (const program of programs) {
    await client.query(
      `INSERT INTO broadcast_programs(
        id,title,program_type,media_ref,duration_ms,queue_position
      ) VALUES($1,$2,$3,$4,$5,$6)`,
      [
        program.id,
        program.title,
        program.program_type,
        program.media_ref,
        program.duration_ms,
        program.queue_position
      ]
    );
  }
  return { status: 'off_air', started_at: null, programs };
}

export async function startBroadcast(client) {
  const clock = await lockedClock(client);
  if (clock.started_at) {
    throw new BroadcastError('BROADCAST_ALREADY_RUNNING', {
      started_at: isoTime(instantMs(clock.started_at, 'started_at'))
    });
  }
  const programs = await listBroadcastPrograms(client);
  // Revalidation happens here even though Program writes are also validated.
  // This prevents any malformed database state from being partially started.
  validateProgramQueue(programs);
  const started = await client.query(
    'UPDATE broadcast_clock SET started_at=clock_timestamp() WHERE singleton=TRUE RETURNING started_at'
  );
  return {
    status: 'on_air',
    started_at: isoTime(instantMs(started.rows[0].started_at, 'started_at')),
    programs
  };
}

export async function stopBroadcast(client) {
  const clock = await lockedClock(client);
  if (clock.started_at) {
    await client.query('UPDATE broadcast_clock SET started_at=NULL WHERE singleton=TRUE');
  }
  return {
    status: 'off_air',
    started_at: null,
    programs: await listBroadcastPrograms(client)
  };
}
