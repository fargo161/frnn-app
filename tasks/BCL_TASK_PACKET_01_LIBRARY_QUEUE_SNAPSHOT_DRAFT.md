---
document_id: BCL-TASK-001
title: FRNN Broadcast Control Lab — Task Packet 01
status: DRAFT_NEEDS_REVISION
scope: NOW
objective_summary: Replace fixed 3-row Packager + flat queue with Library / Queue / Active Snapshot separation
repository: fargo161/frnn-app
branch_target: main
baseline_note: Verify HEAD and worktree state fresh — do not trust any HEAD SHA recorded in prior documents
---

> **DRAFT INTAKE — NOT AN ACTIVE WORK ORDER**
>
> Before implementation, revise this packet to make the Active Snapshot a genuinely stable persisted/versioned run; enforce the locked `LN-107` deletion guard; decide whether omitting PROGRAM/TRANSITION semantic kind would force immediate schema rework; and move or sequence the Producer Console UI to avoid the pending `public/admin.html` Escape-authoring collision.

# OBJECTIVE

Establish the first coherent separation between the **Packaged Programming Library**, the **explicit Queue**, and the **Active Snapshot**, replacing the current fixed 3-row Packager and flat program table — while leaving the existing Master Clock and `/broadcast` viewer intact and behaviorally unchanged for the audience-facing path.

This is the single primary uncertainty for this packet: *can library/queue/snapshot be introduced as three separate state layers without breaking the currently-working clock and viewer?*

Concept IDs: `BCL.PKG.LIBRARY`, `BCL.RUNTIME.QUEUE`, `BCL.RUNTIME.ACTIVE_SNAPSHOT`, `BCL.SURFACE.PRODUCER_CONSOLE`.

---

# CURRENT REALITY

(Confirmed by direct source inspection — re-verify before starting, do not assume it is unchanged.)

- `broadcast.js` models one flat `broadcast_programs` table: `id, title, program_type, media_ref, duration_ms, queue_position`. There is no separate library table.
- `resolveBroadcastState()` computes `totalElapsed % totalDuration` and always wraps to the next program — this is the modulo-wrap LOOP behavior. **Not in scope for this packet** (see Out of Scope).
- `replaceBroadcastPrograms()` throws `BROADCAST_RUNNING_EDIT_FORBIDDEN` whenever `broadcast_clock.started_at` is set — i.e. no edits at all while on air, not a future-safe NOW/UPCOMING split.
- `public/admin.html` hard-caps the Packager UI at three rows: `renderProgramRows` loops `for(let index=0;index<3;...)`, and `loadPrograms()` sets `programQueueTooLarge = programs.length > 3`.
- `broadcast_clock` is a Postgres singleton row (`started_at`), locked via `SELECT ... FOR UPDATE` in `lockedClock()`.
- The public `/api/broadcast` route and `/broadcast` viewer (late-join seek, polling, resync) are working and should not be touched by this packet except where the response shape must change to reflect new state layers.
- Non-Broadcast work is currently landing on `main` same-day (Escape assignment mutations touching `server.js` and `node-assignments.js` — see pass-reports). Confirm this has reached a stable point before starting, and avoid overlapping edits to `server.js` where possible.

---

# REQUIRED CHANGES

1. **New Library table** (e.g. `packaged_programs`) holding reusable Program/Transition definitions — persists independent of queue membership or playback (INV-002, LN-101, LN-102).
2. **Queue becomes a reference list**, not a copy: queue entries reference a library item by id plus minimal queue-specific state (LN-103). Do not duplicate program fields into the queue table.
3. **Active Snapshot becomes an explicit resolved-state concept**, not an inline computation mixed into the clock resolver — isolate "what is currently on air" as its own read path so future work (LOOP, Override) can intercept it without touching library/queue code.
4. **Producer Console UI**: replace the fixed 3-row Packager with a Library view (create/list/delete packaged items) and an Upcoming Queue view (add-from-library, reorder, remove) as two visually distinct regions, per `BCL.SURFACE.PRODUCER_CONSOLE`.
5. **Migration**: write a numbered migration (`migrations/00N_*.sql`) that introduces the new tables without discarding existing `broadcast_programs` data — backfill or provide an explicit one-time import path from the current flat table into Library + Queue.
6. Keep `resolveBroadcastState()`'s current modulo-wrap output shape stable for `/api/broadcast` and the viewer during this packet — the *inputs* to it (queue → resolved ordered list) may be re-sourced from the new tables, but the *resolution behavior* itself does not change here.

---

# INVARIANTS

- INV-002 — Library, queue, and active snapshot are separate state layers.
- INV-004 — Ordinary controls affect future or independent overlays, not NOW.
- INV-005 — Only STOP and confirmed Breaking Override may intentionally interrupt NOW. (STOP already exists; Override is out of scope — see below.)
- INV-019 — Locked design is not implementation evidence; do not report this packet as validating more than what it tests.

---

# OUT OF SCOPE

Explicitly excluded from this packet — do not implement, stub, or partially wire these in:

- `BCL.RUNTIME.LOOP`, `BCL.RUNTIME.RANDOM_FALLBACK`, `BCL.RUNTIME.OFF_AIR` — LOOP OFF/ON semantics and random eligible-pool selection. Modulo-wrap stays as-is.
- `BCL.OVERRIDE.BREAKING` and any override/interrupt path.
- `BCL.PKG.UNIT`, Program composition from Units, audio beds, ticker, subtitles, graphics, Program Packs.
- Any change to `node-assignments.js` or the Escape-assignment work in `server.js`.
- Any change to the public `/broadcast` viewer's client-side rendering behavior.
- PROGRAM/TRANSITION semantic-kind distinction (INV-003) — may be deferred to a follow-up packet if it doesn't fall out naturally from the Library schema; flag as a follow-up rather than half-implementing.

---

# ACCEPTANCE CRITERIA

- A packaged Program can be created in the Library and does **not** appear in the queue or on air until explicitly added to the queue (LN-101).
- Deleting nothing: playback does not consume or delete library items (LN-102).
- The queue holds references to library items, reorderable and removable, without duplicating library data (LN-103).
- `/broadcast` viewer and `/api/broadcast` continue to behave identically to current behavior for an outside observer (same polling/late-join/seek behavior).
- Old flat-table data is either migrated or the migration path is documented and tested — no silent data loss.

---

# BEHAVIORAL TESTS

- T-QUEUE-01 (from existing matrix): Reorder upcoming only → NOW ID/start unchanged.
- New: Create library item → does not appear in queue.
- New: Add library item to queue twice (two entries) → both reference the same library item; editing the library item once is reflected in both (or explicitly documented if snapshotted — decide and record which).
- New: Delete a library item that is *not* currently queued → succeeds.
- New: Attempt to delete a library item that *is* currently queued or on air → blocked or explicitly guarded (decide behavior, do not leave undefined).
- Migration test: run migration against a copy of current production-shaped data, confirm existing on-air/queued state is preserved or explicitly reset with a documented note.

---

# FILE OWNERSHIP

**Primary files:**
- `broadcast.js`
- `public/admin.html` (Packager section only — do not touch unrelated Mission Control sections)
- new migration file under `migrations/`
- `schema.sql` (if maintained alongside migrations)

**Forbidden overlap:**
- `node-assignments.js`
- Escape-assignment routes in `server.js`
- `player-identity.js`, `player-profiles.js`, `drawing-pool.js`, `qr-routing.js`

If `server.js` route wiring is unavoidable, isolate new Broadcast routes into their own module/router rather than editing inline alongside Escape-assignment routes, to reduce collision surface for concurrent work.

---

# IMPLEMENTATION REPORT (to be filled in by the implementing agent)

- Files changed:
- Behavior implemented:
- Commands run:
- Pass/fail/skip (per behavioral test above):
- Assumptions made:
- Unverified claims:
- Reality-state updates (per concept: SPECULATIVE → DESIGNED → IMPLEMENTED → TESTED → VALIDATED):
- Next uncertainty:
