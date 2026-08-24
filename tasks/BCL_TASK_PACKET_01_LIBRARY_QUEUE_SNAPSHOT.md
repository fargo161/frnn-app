# FRNN Broadcast Control Lab — Task Packet 01: Library / Queue / Active Snapshot

**Document type:** Implementation Task Packet

**Reality state:** DESIGNED — not proof of implementation

**Baseline:** `858afd24d38cb0f8f35bf0c815211abe44b16c3a`

**Status:** `IMPLEMENTED / LOCALLY TESTED` — not committed, deployed, or broadly validated

**Created:** 2026-08-24

> This packet defines a bounded implementation experiment from the stated baseline. It does not authorize its own execution. Before implementation, verify current `HEAD`, worktree state, migration numbering, shared-file ownership, and all source assumptions below. Stop on material drift.

## OBJECTIVE

Replace the experimental flat Broadcast list with the first real causal separation between:

```text
reusable Packaged Programming Library
→ upcoming queue references
→ persisted immutable active run
→ existing public Broadcast projection
```

The experiment must prove that a reusable definition may change while its current active run remains byte-for-byte stable, and that a referenced or active definition cannot be deleted.

This packet does not build the full Broadcast Control Lab.

## CURRENT REALITY

### Repository baseline

- Branch: `main`.
- Baseline `HEAD` and `origin/main`: `858afd24d38cb0f8f35bf0c815211abe44b16c3a`.
- Worktree was clean during the Director repair pass.
- The four owner-locked BCL design documents are committed under `docs/broadcast-control-lab/design/`.
- This packet supersedes `BCL_TASK_PACKET_01_LIBRARY_QUEUE_SNAPSHOT_DRAFT.md`, which was never active.

### IMPLEMENTED

- `migrations/002_broadcast_master_clock.sql` defines only:
  - `broadcast_programs(id,title,program_type,media_ref,duration_ms,queue_position)`; and
  - singleton `broadcast_clock.started_at`.
- In `broadcast.js`, one `broadcast_programs` row is simultaneously a definition and an ordered queue item. The primary key prevents the same item from appearing twice.
- `program_type` means playback medium only: `test_card`, `image`, or `video` (`PROGRAM_TYPES`, `normalizeProgram()`, and migration 002). It does not mean semantic PROGRAM or TRANSITION.
- `resolveBroadcastState()` derives NOW by `totalElapsed % totalDuration`. It repeatedly wraps the flat list and never consumes an upcoming entry.
- `readBroadcastSnapshot()` is only a statement-consistent join of `broadcast_clock` and the mutable program rows. Despite its name, it does not read a persisted active snapshot or version.
- `replaceBroadcastPrograms()` locks `broadcast_clock`, refuses every write while on air with `BROADCAST_RUNNING_EDIT_FORBIDDEN`, then replaces the entire list with DELETE-all/INSERT-all.
- `startBroadcast()` persists only the DB-generated start anchor. `stopBroadcast()` clears only that anchor.
- `server.js` exposes public `GET /api/broadcast`, public `/broadcast`, authenticated `GET/PUT /api/admin/programs`, and authenticated Start/Stop routes.
- `public/admin.html` contains the fixed three-row Packager. It is the monolithic Mission Control client.
- `public/broadcast.html` is a GET-only receiver that polls, waits for server-confirmed boundaries, and seeks video from authoritative elapsed time.
- Numbered migrations are applied transactionally by `db.js`; Broadcast schema currently lives in migration 002 rather than `schema.sql`.

### TESTED

- `test/broadcast-master-clock.test.js` meaningfully exercises resolver timing, exact boundaries, modulo wrapping, validation, duplicate Start rejection, the broad live-edit ban, Stop, and restart with a fresh anchor.
- `test/program-packager.test.js` executes the real inline admin script in a fake DOM and proves the fixed three-row behavior, read-only reload, live locking, Save-before-Start, and separate Start/Stop calls.
- `test/broadcast-viewer.test.js` executes the real viewer script in a fake DOM and proves GET-only bootstrap, server-confirmed boundaries, explicit OFF AIR/error display, polling, and late-join muted video seeking.
- At the repair baseline, `npm test` reported 235 tests: 229 passed, 0 failed, 6 skipped.
- The only real PostgreSQL Broadcast integration is skipped when `TEST_DATABASE_URL` is absent. It covers migration 002 and the old model only.

### VALIDATED

None of the Library → Queue → Active Snapshot design is validated. Current tests provide narrow evidence for the old resolver and safety blockade, not for the locked architecture, operator workflow, process restart, real browser/device behavior, or production deployment.

### DESIGNED / LOCKED BUT MISSING

- Persistent reusable library (`BCL.PKG.LIBRARY`; `LN-101`, `LN-102`).
- Queue-entry identity and references to library items (`BCL.RUNTIME.QUEUE`; `LN-103`).
- Persisted stable active run/recipe/start (`BCL.RUNTIME.ACTIVE_SNAPSHOT`; `LN-106`, `LN-205`, `LN-721`).
- Upcoming mutation while NOW remains unchanged (`LN-205`, `LN-209`).
- Reference-aware deletion refusal (`LN-107`; `BCL.PKG.DELETION_GUARD` alias owned by `BCL.PKG.LIBRARY`).
- Semantic PROGRAM/TRANSITION kind separate from playback type (`LN-104`; `BCL.PKG.PROGRAM`, `BCL.PKG.TRANSITION`; `INV-003`).
- A dedicated Control Lab route/surface.

### PROVISIONAL / CONFLICTING

- The fixed A/B/C rows and test-card defaults are honest fixtures, not reusable packaging.
- Arbitrary `media_ref` strings are not the locked offsite asset registry.
- The broad on-air mutation ban protects current data but blocks the locked future-safe upcoming-edit workflow.
- The current modulo wrap conflicts with locked LOOP semantics (`LN-010`, `BCL.RUNTIME.LOOP`, `INV-020`). This packet must remove modulo queue wrapping as part of making the upcoming queue consumable. It must not claim that scheduling behavior is unchanged.
- The public viewer still displays persistent elapsed/remaining counters, conflicting with `LN-722`; viewer presentation changes remain deferred.

## LOCKED DESIGN REFERENCES

| Required rule | Trace |
|---|---|
| Creating an item creates a persistent library definition, not a queue entry | `LN-101`; `BCL.PKG.LIBRARY` |
| Playback does not consume the reusable definition | `LN-102`; `BCL.PKG.LIBRARY` |
| Queue entries are references with small queue-specific state | `LN-103`; `BCL.RUNTIME.QUEUE` |
| PROGRAM/TRANSITION kind is separate from playback/media type | `LN-104`; `BCL.PKG.PROGRAM`; `BCL.PKG.TRANSITION`; `INV-003` |
| Future edits do not change NOW | `LN-106`; `LN-205`; `LN-721`; `BCL.RUNTIME.ACTIVE_SNAPSHOT`; `CR-07` |
| Queued or active definitions cannot be deleted | `LN-107`; `BCL.PKG.DELETION_GUARD`; `BCL.PKG.LIBRARY` |
| Minimum definition fields include kind, playback type, source, duration, and LOOP eligibility | `LN-108` |
| Upcoming removal/reorder does not reset NOW | `LN-205`; `LN-209`; `BCL.RUNTIME.QUEUE`; `T-QUEUE-01`; `T-QUEUE-02` |
| Ordinary controls affect future state; only STOP/confirmed override interrupt NOW | `INV-004`; `INV-005` |
| Library, queue, and active snapshot are separate state layers | `INV-002` |

## REQUIRED CHANGES

### 1. Add the migration-only foundation

- At activation time, verify the next migration number. It is `005` at this baseline; use `005_broadcast_control_lab_foundation.sql` only if still unclaimed. Never overwrite or renumber an existing migration.
- Keep the new Broadcast schema in the numbered migration path. Do not add a second divergent definition to `schema.sql` during this packet.
- Create the tables and sequence specified under **DATA / SNAPSHOT MODEL**.
- Use PostgreSQL foreign keys with `ON DELETE RESTRICT`/`NO ACTION`; never cascade deletion from the library into queue or active state.
- Retain migration 002 and its legacy tables for rollback/inspection. New runtime code must stop treating them as authoritative after successful migration.

#### Existing-data migration

- The migration must run atomically.
- If legacy `broadcast_clock.started_at` is non-null, abort the migration with a visible `BCL_MIGRATION_REQUIRES_OFF_AIR` database error. Do not guess a live snapshot from the modulo list and do not silently reset an on-air channel.
- For an off-air legacy database:
  - copy each `broadcast_programs` row into one library item;
  - preserve its `id`, `title`, `media_ref`, and `duration_ms`;
  - map legacy `program_type` to new `playback_type` unchanged;
  - explicitly assign `item_kind='PROGRAM'` because the legacy surface represented every row as a Program;
  - initialize `definition_version=1` and `loop_eligible=FALSE`;
  - create one queue entry per legacy row in its existing order;
  - initialize the active singleton as OFF AIR.
- Migration failure must roll back every new table/backfill write and leave all legacy rows untouched.

### 2. Replace the collapsed service model

- Keep validation and persistence in focused Broadcast modules rather than expanding unrelated `server.js` logic. A suitable split is:
  - `broadcast.js`: public projection and time/boundary resolution;
  - new `broadcast-control-lab.js`: library, queue, active-run persistence and mutations.
- Preserve current safe ID/title/playback/media/duration validation unless the packet explicitly strengthens it.
- Add separate validation for uppercase `item_kind` values `PROGRAM` and `TRANSITION`.
- A library edit must increment `definition_version` exactly once. Require `expected_definition_version` and return `409 PACKAGED_ITEM_VERSION_CONFLICT` on a stale edit; make no partial change.
- Queue insertion references the library item ID and appends by default. The same library item may have multiple independently identified queue entries.
- Queue removal/reorder may affect upcoming entries only. It must not change any field in the active singleton.

### 3. Make activation and boundary advancement transactional

- `POST /api/admin/broadcast/start` remains the explicit Start action.
- In one transaction, lock the active singleton, reject if already active, lock/read the first queue entry and its current library definition, copy the immutable run fields, allocate a new run ID, set `started_at=clock_timestamp()`, and remove only that queue entry from upcoming.
- If no upcoming entry exists, return `409 BROADCAST_QUEUE_EMPTY`; remain OFF AIR.
- Normal public/admin state reads must reconcile elapsed time using PostgreSQL `clock_timestamp()` while holding the active singleton lock:
  1. if NOW has not reached its boundary, return it unchanged;
  2. if it has ended and an upcoming entry exists, activate that entry using the exact prior end boundary as the new `started_at`, not request arrival time;
  3. repeat deterministically if downtime crossed several complete items;
  4. if the queue is exhausted, clear the active singleton and return authoritative OFF AIR.
- This time-driven reconciliation may write during a GET transaction, but the state change is caused by the authoritative boundary, not by client choice. Concurrent readers must converge on one run ID/start.
- `POST /api/admin/broadcast/stop` locks and clears the active snapshot immediately, retains all remaining upcoming entries and all library definitions, and returns OFF AIR.
- Do not use `broadcast_clock.started_at` as a second clock after migration. `broadcast_active_run.started_at` is the sole authoritative current-item start.

### 4. Preserve the audience contract while changing its source

- Keep the existing `/api/broadcast` top-level response shape and `/broadcast` rendering behavior.
- Project the copied active `playback_type` back to public `current_program.program_type` so the current viewer remains compatible.
- Project the copied activation position to `current_program.queue_position` for compatibility.
- Derive `next_program_id` from the first upcoming queue reference; use `null` when none exists.
- Do not modify the viewer renderer, polling, seeking, muted-video behavior, CSS, or presentation in this packet.
- Expected intentional scheduling change: the old modulo list no longer wraps. Queue exhaustion becomes OFF AIR, equivalent to the locked LOOP-OFF result. This packet does not add LOOP state, LOOP UI, eligibility selection, or random fallback.

### 5. Add authenticated Control Lab APIs

Keep every producer mutation behind existing Mission Control authentication and audit it in the same transaction.

Required contracts:

```text
GET    /api/admin/broadcast/control-lab
POST   /api/admin/broadcast/library
PUT    /api/admin/broadcast/library/:id
DELETE /api/admin/broadcast/library/:id
POST   /api/admin/broadcast/queue
PUT    /api/admin/broadcast/queue/order
DELETE /api/admin/broadcast/queue/:entryId
POST   /api/admin/broadcast/start
POST   /api/admin/broadcast/stop
```

- The aggregate GET returns library definitions, ordered upcoming queue entries, and the active run/admin status from one reconciled authoritative read.
- Create accepts `id,title,item_kind,playback_type,media_ref,duration_ms,loop_eligible` and returns the persisted definition/version.
- Edit accepts the mutable fields plus `expected_definition_version`; library ID is immutable.
- Queue add accepts `packaged_item_id` and returns its independent queue-entry ID.
- Queue reorder accepts the complete ordered list of current upcoming entry IDs. Reject missing, duplicate, active, stale, or foreign IDs without partial reordering.
- Queue remove addresses queue-entry identity, not library identity.
- Retire legacy `PUT /api/admin/programs` with `409 BROADCAST_LEGACY_PACKAGER_RETIRED`; do not let it write legacy or new scheduling state. Its GET may be removed or retained only as an explicitly read-only compatibility projection.

### 6. Enforce exact deletion/refusal behavior

In one transaction:

1. lock the target library row;
2. check upcoming queue references;
3. check the active singleton reference;
4. delete only when neither exists.

If queued or active, return:

```json
{
  "error": "PACKAGED_ITEM_REFERENCED",
  "details": {
    "packaged_item_id": "...",
    "queued_reference_count": 1,
    "active": true
  }
}
```

- HTTP status is `409`.
- `queued_reference_count` and `active` must reflect the locked transaction state.
- No library, queue, active-run, start-time, or audit-success mutation may occur on refusal.
- A concurrent queue/activation insert must be serialized or rejected by the restrictive foreign key; normalize the race outcome to the same stable error rather than exposing a raw database error.
- Unknown library ID returns `404 PACKAGED_ITEM_NOT_FOUND`.

### 7. Establish the minimum UI boundary

- Create a dedicated desktop `/control-lab` route and focused BCL client files.
- The surface contains only:
  - Mission Control session state/return-to-login path;
  - read-only NOW/run ID/start/version summary;
  - reusable Library create/list/edit/delete controls;
  - ordered Upcoming Queue with explicit add, remove, up, and down controls;
  - Start and Stop;
  - clear errors for version conflict, referenced deletion, empty queue, auth expiry, and failed requests.
- Label it as a foundation experiment; do not imply that the locked three-region workstation is complete.
- Do not add fake Live Screen, Packaging Editor, Ticker, Override, Bed, Unit, import/export, or module cards. Provide a simple link to the existing `/broadcast` receiver rather than embedding or duplicating its renderer.
- Retire the fixed Packager block in `public/admin.html` to a simple **OPEN BROADCAST CONTROL LAB** link and remove its obsolete BCL-only inline handlers. Do not otherwise redesign Mission Control.
- Because the pending Escape Mission Control authoring packet also owns `public/admin.html`, these edits must not run concurrently. Reinspect/rebase after whichever packet lands first and assign one owner to the file.

### 8. Preserve audit causality

Add distinct audit actions for library create/edit/delete, queue add/reorder/remove, start, automatic boundary activation, and stop. Do not record a success audit for a rejected mutation. Audit details must identify library ID, queue-entry ID or run ID as applicable without storing media binaries.

## DATA / SNAPSHOT MODEL

### `broadcast_packaged_items`

| Field | Rule / consequence |
|---|---|
| `id TEXT PRIMARY KEY` | Stable reusable identity; immutable after creation |
| `definition_version BIGINT NOT NULL` | Starts at 1; increments on each successful edit |
| `title TEXT NOT NULL` | Copied into an active run at activation |
| `item_kind TEXT NOT NULL` | Check `PROGRAM` or `TRANSITION`; never reused for playback type |
| `playback_type TEXT NOT NULL` | Check `test_card`, `image`, or `video` |
| `media_ref TEXT` | Validated as in current source; copied into active run |
| `duration_ms BIGINT NOT NULL` | Positive; copied into active run and drives its boundary |
| `loop_eligible BOOLEAN NOT NULL DEFAULT FALSE` | Persisted future eligibility only; no runtime effect in Task 01 |
| `created_at`, `updated_at` | Authoritative definition timestamps |

`loop_eligible` is intentionally PROVISIONAL infrastructure in this packet. It satisfies the locked minimum item schema (`LN-108`) but must not be reported as functional LOOP behavior.

### `broadcast_queue_entries`

| Field | Rule / consequence |
|---|---|
| `id BIGINT ... PRIMARY KEY` | Independent queue-entry identity; permits duplicate library references |
| `packaged_item_id TEXT NOT NULL` | FK to library with restrictive deletion |
| `queue_position INTEGER NOT NULL UNIQUE` | Positive upcoming order only |
| `created_at` | Traceable enqueue time |

Queue entries deliberately do not copy definition fields or pin a definition version. They resolve the latest committed definition at activation, which is why future uses receive edits.

### `broadcast_active_run` singleton

The table always contains exactly one singleton row. OFF AIR is represented by all run fields being null. Use a dedicated PostgreSQL sequence for monotonic `run_id` allocation.

| Field | Rule / consequence |
|---|---|
| `singleton BOOLEAN PRIMARY KEY` | Lock target; checked true |
| `run_id BIGINT UNIQUE` | Non-null only on air; new for each activation |
| `packaged_item_id TEXT` | Restrictive FK to source library identity |
| `source_definition_version BIGINT` | Version observed at activation |
| `source_queue_entry_id BIGINT` | Copied lineage; no live FK after the upcoming entry is consumed |
| `source_queue_position INTEGER` | Copied for public compatibility |
| `title TEXT` | Immutable run copy |
| `item_kind TEXT` | Immutable run copy |
| `playback_type TEXT` | Immutable run copy |
| `media_ref TEXT` | Immutable run copy |
| `duration_ms BIGINT` | Immutable run copy and boundary rule |
| `started_at TIMESTAMPTZ` | Sole authoritative start for NOW |

Add a database CHECK requiring the active fields to be either all null (OFF AIR) or all non-null except `media_ref`, which may legitimately be null for a test card.

No ordinary library or queue mutation may update this table. Only Start, deterministic boundary advancement, and Stop may change it in Task 01.

### Restart recovery decision

Restart recovery for the **new normal active-run model is included**:

- closing and reopening the application/database pool before the boundary returns the same run ID, copied fields, definition version, and `started_at`;
- edits committed during or after restart still do not alter that run;
- if downtime crosses one or more boundaries, the first reconciled read advances deterministically using exact prior end times and consumes the corresponding upcoming entries once;
- concurrent first reads after restart converge on the same active row;
- queue exhaustion becomes OFF AIR.

Recovery for Breaking Override, LOOP/random fallback, Beds, Units, and other later state is not implied. Upgrade from an already-running **legacy** migration-002 channel is refused rather than guessed.

## INVARIANTS

1. Library, upcoming queue, and active run are distinct PostgreSQL state layers (`INV-002`).
2. `item_kind` and `playback_type` are different fields with different constraints (`INV-003`).
3. Active-run copied fields, run ID, definition version, and start remain unchanged under ordinary definition/queue mutations (`INV-004`, `CR-07`).
4. Editing a library item affects future activations only (`LN-106`, `LN-721`).
5. Queue add/remove/reorder never changes NOW (`LN-205`, `LN-209`).
6. Deletion of a queued or active definition is refused; no reference is silently cascaded (`LN-107`).
7. Activation copies one coherent library version in the same transaction that consumes one queue entry.
8. PostgreSQL active-run state and DB time are authoritative; browsers do not choose NOW or its start.
9. STOP clears NOW but does not delete definitions or clear upcoming entries (`LN-206`).
10. Queue exhaustion does not wrap item one. It becomes OFF AIR in this bounded packet (`LN-010`, `INV-020`).
11. The public viewer remains read-only and never creates authoritative state.
12. A schema, route, label, or test name is not evidence that the causal chain works (`INV-019`).

## UI BOUNDARY

**Included:** a dedicated, minimal, authenticated producer surface at `/control-lab` for Library, Upcoming Queue, NOW, Start, Stop, and observable errors; plus retirement of the obsolete `/admin` Packager to a link.

**Deferred:** the locked full three-region desktop composition, embedded shared-renderer Live Screen, persistent Packaging Editor screen, rich authoring, drag-and-drop, mobile producer support, and all later modules.

The dedicated route is chosen because backend-only work would not exercise the operator causal chain, while expanding the old Mission Control card would increase collision and preserve the wrong surface boundary.

## OUT OF SCOPE

- Program Units or Unit Library.
- Offsite Media Bin/asset registry implementation.
- Audio/video timecode mapping or media ingestion.
- Multi-layer audio, Program Bed, Broadcast Bed, or Off-Air Bed.
- A/B Unit playback or seamlessness claims.
- Packaging Editor functionality or placeholder controls.
- Graphics Packaging Module, subtitles, ticker, Emergency Ticker, or Breaking Override.
- LOOP toggle, random eligibility behavior, random selection, or random-pool persistence.
- Program Pack import/export.
- QR/Broadcast integration.
- Player/node-assignment changes.
- Broad Mission Control redesign.
- Public viewer presentation/renderer changes, including the existing elapsed display.
- New dependencies.
- Production deployment or data migration while the legacy channel is on air.

## ACCEPTANCE CRITERIA

1. Creating a valid packaged item persists one library definition and creates no queue or active state.
2. PROGRAM and TRANSITION persist separately from `test_card|image|video` playback type.
3. Adding the same library item twice creates two distinct upcoming queue entries referencing one definition.
4. Start atomically consumes only the first upcoming entry and creates one persisted active run with a unique run ID, copied definition version/fields, and DB start time.
5. Editing the source definition increments its version while every copied active-run field, run ID, and start remains unchanged.
6. Reorder/remove upcoming changes future order only; NOW remains unchanged.
7. Natural boundary or a later Start resolves the current library version, so future use observes the edit.
8. Restart before a boundary restores the same run; restart across boundaries deterministically catches up once.
9. Deleting a queued item returns the exact 409 refusal and leaves library/queue/NOW unchanged.
10. Deleting the active item returns the exact 409 refusal and leaves library/queue/NOW unchanged.
11. After Stop/completion and removal of every queue reference, deleting the definition succeeds.
12. `/api/broadcast` retains its viewer-compatible shape and reflects the active copied fields, not mutable library fields.
13. Queue exhaustion returns OFF AIR and never modulo-wraps.
14. Legacy off-air data is backfilled without loss; legacy on-air migration fails visibly and atomically.
15. `/control-lab` exposes only the bounded working controls and visible failure states; `/admin` no longer presents the obsolete editor as functional.

## BEHAVIORAL TESTS

At minimum, implement and report these tests:

1. Create packaged item v1 → library contains v1; queue and active remain empty.
2. Persist one PROGRAM and one TRANSITION, each with playback type held constant → semantic kinds remain distinct and public playback mapping remains valid.
3. Queue the same item twice → two queue-entry IDs reference one library ID.
4. Start → first queue entry is consumed → active run contains v1 copied fields, version 1, unique run ID, and DB start.
5. Edit source to v2 during v1 run → definition becomes version 2 → active row remains byte-for-byte unchanged.
6. Reorder/remove other upcoming entries → active run ID/start/copy remain unchanged.
7. Stop the v1 run without clearing upcoming → Start the remaining reference → new run ID snapshots v2.
8. Restart recovery: close the first pool/client, open a fresh one, read before boundary → same run ID/start/copy.
9. Boundary recovery: advance DB time across one and multiple durations → exactly the appropriate queue entries are consumed → one authoritative current run or OFF AIR results.
10. Concurrent reads at a boundary → both observe the same new run ID/start and only one queue entry is consumed.
11. Delete while one queue reference exists → `409 PACKAGED_ITEM_REFERENCED` → all authoritative rows unchanged.
12. Delete while active → same refusal → run ID/start/copy unchanged.
13. Stop/finish, remove all remaining references, delete → definition is removed and unrelated items remain.
14. Race delete against queue add/activation → either the delete succeeds before any reference is created or deletion is normalized to `PACKAGED_ITEM_REFERENCED`; never leave a dangling reference or raw DB error.
15. Stale `expected_definition_version` edit → `409 PACKAGED_ITEM_VERSION_CONFLICT` → no fields/version change.
16. Empty Start → `409 BROADCAST_QUEUE_EMPTY` → active remains OFF AIR.
17. Public API regression through real service/DB state → viewer-compatible response uses snapshot v1 during source v2 edit, then v2 on future activation.
18. Migration on production-shaped off-air migration-002 data → all definitions/order preserved and migration record applied once.
19. Migration with non-null legacy clock → explicit failure and full rollback; legacy data/clock unchanged.
20. Run the full migration chain twice on disposable PostgreSQL → second application is idempotent through `schema_migrations`.
21. Execute the real `/control-lab` client in the repository’s current test style and prove create → queue → start → edit → refusal feedback without fake success labels.
22. Run the full test suite and separately report every skip. PostgreSQL tests may not be counted as passed when `TEST_DATABASE_URL` is absent.

Structural route/table/field checks must be reported separately from these behavioral consequences.

## DEPENDENCIES / FILE OWNERSHIP

Expected primary files:

- new numbered migration (currently expected `migrations/005_broadcast_control_lab_foundation.sql`);
- `broadcast.js`;
- new focused `broadcast-control-lab.js` or equivalent;
- minimal Broadcast route imports/registration/error mapping in `server.js`;
- new `public/control-lab.html` and focused stylesheet/script files;
- minimal retirement of BCL-only markup/script in `public/admin.html`;
- Broadcast service/API/UI tests, including disposable PostgreSQL behavior;
- pass report and index.

Collision rules:

- One agent owns `broadcast.js` integration and active-boundary behavior.
- One agent owns the new migration/model contract before runtime/UI work proceeds.
- One agent owns `public/admin.html`; do not run this edit concurrently with the pending Escape Mission Control authoring packet.
- Keep BCL route logic focused; do not refactor unrelated `server.js` regions.
- Do not modify `node-assignments.js`, player profiles, drawing pool, QR routing, or Escape renderer files.
- Update or supersede old `test/program-packager.test.js` assertions deliberately; “exactly three rows” is old behavior, not a regression requirement.
- Add no package dependency unless the owner explicitly expands scope.

## IMPLEMENTATION REPORT REQUIREMENTS

The implementing team must create the mandatory repository pass report and state:

- exact baseline and final commit/worktree status;
- every file changed;
- migration name, tables, constraints, backfill result, and rollback behavior;
- implemented causal behavior by Library, Queue, Active Run, API, and UI;
- old behavior intentionally changed, especially modulo wrap and legacy Packager retirement;
- structural checks separately from behavioral tests;
- exact commands and pass/fail/skip counts;
- whether disposable PostgreSQL tests actually ran;
- concurrency, restart, migration, HTTP, VM/browser, and full-suite evidence;
- anything untested or environment-limited;
- all provisional state, including inert `loop_eligible` behavior;
- whether the Library → Queue → immutable Active Run assumption is merely IMPLEMENTED/TESTED or supported strongly enough for a narrow VALIDATED claim;
- the smallest next experiment, without starting it automatically.

## ACTIVATION GATE

This packet is implementation-ready but not active.

### Disposable PostgreSQL gate

- A test run may use only `TEST_DATABASE_URL`; it must never substitute `DATABASE_URL`.
- The approved local target is the dedicated Docker container `frnn-bcl-test-postgres`, bound only to `127.0.0.1:55432`, using tmpfs storage and restart policy `no`.
- Its ignored connection file is `.env.test.local`. Load only `TEST_DATABASE_URL` from that file for integration-test commands; never print the value in logs or reports.
- Before destructive test setup, verify the hostname is localhost, the database name is `frnn_integration_test`, and the container label is `frnn.purpose=disposable-integration-tests`. Stop if any check fails.
- Tests must create uniquely named temporary schemas and drop only those schemas. Do not drop the database, use the project `DATABASE_URL`, or target the existing `frnn-app-db-1` container.

### Exclusive `public/admin.html` gate

- `public/admin.html` has one exclusive owner at a time. No second active task or agent may edit, stage, format, or regenerate it.
- Before assigning that file, the Director must verify it is clean, name the owning task in the active task commentary/report, and confirm every other packet claiming it is Pending/inactive.
- While BCL Task Packet 01 owns it, the pending Escape Mission Control authoring packet must remain inactive. If Escape owns it first, BCL waits, then re-inspects and rebases after Escape completes.
- If unowned changes appear in `public/admin.html`, stop immediately; do not merge or reconcile them silently.

Before activation:

1. owner explicitly activates Task Packet 01;
2. verify `HEAD` and worktree;
3. verify migration `005` remains free;
4. acquire exclusive `public/admin.html` ownership and keep the Escape UI packet inactive;
5. verify the labeled disposable PostgreSQL container is healthy and load its ignored `TEST_DATABASE_URL`;
6. run a connectivity/current-integration preflight before application edits.

Do not begin implementation from this document without that explicit activation.
