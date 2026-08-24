# PASS

- Task: Broadcast Control Lab Task Packet 01 — Library / Queue / Active Snapshot.
- Objective: implement and causally exercise `Library → Queue → immutable Active Run → public Broadcast` only.
- Branch: `main`.
- Baseline `HEAD` and `origin/main`: `858afd24d38cb0f8f35bf0c815211abe44b16c3a`.
- Final worktree status: substantive implementation and the earlier approved BCL packet/gate documents are uncommitted.
- Migration: `005_broadcast_control_lab_foundation.sql`; migration number 005 was verified free before source edits.
- Shared-file gate: BCL Task Packet 01 exclusively owned `public/admin.html` during the pass. The pending Escape Mission Control authoring packet remained Pending. Ownership was released after final tests.
- Database gate: every PostgreSQL command used the ignored `TEST_DATABASE_URL` for the labeled, restart-disabled, tmpfs-backed `frnn-bcl-test-postgres` container at localhost. The value was not printed. Tests created and dropped only unique temporary schemas.

# CURRENT REALITY BEFORE PASS

- **IMPLEMENTED:** migration 002 contained one flat `broadcast_programs` list and singleton `broadcast_clock.started_at`. A row was both definition and queue position; duplicate reusable references were impossible. The public viewer polled a modulo projection of those live rows.
- **TESTED:** the old resolver, broad on-air edit blockade, fixed three-row admin Packager, and viewer projection had focused tests. The disposable database preflight ran the old full suite with 235 passes, 0 failures, and 0 skips.
- **VALIDATED:** none of the locked Library / reference Queue / immutable Active Snapshot architecture had validation evidence.
- **PROVISIONAL:** `readBroadcastSnapshot()` was a transient join rather than a persisted snapshot; the fixed A/B/C rows were fixtures; all on-air edits were globally prohibited.
- **MISSING:** `BCL.PKG.LIBRARY` (`LN-101`, `LN-102`), reference queue identity (`LN-103`; `BCL.RUNTIME.QUEUE`), semantic PROGRAM/TRANSITION kind (`LN-104`; `INV-003`), persisted immutable active version/start (`LN-106`, `LN-205`, `LN-721`; `BCL.RUNTIME.ACTIVE_SNAPSHOT`), and reference-aware deletion refusal (`LN-107`).
- The worktree already contained the approved Task Packet 01 repair, disposable-database gate, reciprocal `public/admin.html` exclusion gate, and their two mandatory reports. Those artifacts were preserved rather than silently discarded.

# WHAT CHANGED

- Added migration 005 with distinct `broadcast_packaged_items`, `broadcast_queue_entries`, and singleton `broadcast_active_run` tables plus `broadcast_run_id_seq`.
- Added restrictive library foreign keys, deferrable unique queue ordering, semantic kind/playback checks, and an all-null OFF AIR versus complete active-row check.
- Added atomic off-air legacy backfill. Legacy rows retain IDs, titles, media, durations, playback type, and order; they become PROGRAM/version 1/non-LOOP definitions plus queue references. An active legacy clock raises `BCL_MIGRATION_REQUIRES_OFF_AIR` before any new BCL state persists.
- Added `broadcast-control-lab.js` as the focused state/mutation service. Its active singleton lock serializes activation, boundary reconciliation, queue mutation, edit/delete, and deletion races. PostgreSQL time is read after lock acquisition.
- Start now consumes one head queue entry, copies one coherent definition version into a unique persisted active run, uses DB time, and removes only that upcoming reference.
- Boundary reads advance at exact previous end times, repeat across downtime, consume each upcoming entry once, write automatic boundary audits, and clear to OFF AIR when exhausted. The old modulo wrap is no longer authoritative.
- Library edits require `expected_definition_version` and increment exactly once. The active copied row is not rewritten. Queue references late-bind the latest committed definition at activation.
- Library deletion locks and reports exact queued/active reference details. Restrictive foreign keys and the shared lock prevent cascading or dangling references; rejected deletion has no success audit.
- Added authenticated aggregate/library/queue routes, preserved authenticated Start/Stop, retired legacy `GET/PUT /api/admin/programs` with `409 BROADCAST_LEGACY_PACKAGER_RETIRED`, and added distinct success audit actions.
- Changed public `GET /api/broadcast` to a transactionally reconciled projection from the copied active run while retaining the viewer-compatible top-level/current-program shape and `program_type` name.
- Added a dedicated `/control-lab` page, stylesheet, and client for session state, read-only NOW, Library CRUD, duplicate queue references, reorder/remove, Start/Stop, and explicit errors. It contains no deferred module placeholders.
- Replaced only the legacy Packager block/handlers in `public/admin.html` with links to the dedicated Control Lab and existing public Broadcast receiver.
- Added a test-only database fallback: when `NODE_ENV=test` and `DATABASE_URL` is absent, the server/pool may use `TEST_DATABASE_URL`. Production still requires `DATABASE_URL`. This lets HTTP integration tests avoid substituting the production variable.
- Replaced obsolete fixed-Packager/modulo tests with real PostgreSQL, HTTP, VM-client, and viewer-compatible behavior tests.

# WHAT IS REAL NOW

## IMPLEMENTED

- Persistent reusable Library definitions exist independently of scheduling (`LN-101`, `LN-102`; `BCL.PKG.LIBRARY`).
- Independent queue-entry IDs permit the same definition to be queued multiple times (`LN-103`; `BCL.RUNTIME.QUEUE`).
- `item_kind=PROGRAM|TRANSITION` is separate from `playback_type=test_card|image|video` (`LN-104`; `INV-003`).
- Each activation persists a unique run ID, source version/queue lineage, copied playback recipe, and sole authoritative `started_at` (`LN-106`, `LN-205`, `LN-721`; `BCL.RUNTIME.ACTIVE_SNAPSHOT`).
- An edit from v1 to v2 leaves the active v1 run unchanged; a later activation of another reference snapshots v2.
- Queued or active deletion is refused with stable `PACKAGED_ITEM_REFERENCED` details and no cascade (`LN-107`).
- Queue reorder/removal changes only upcoming references; STOP clears NOW but preserves Library and remaining queue.
- Deterministic recovery handles process/pool restart, one or multiple elapsed boundaries, concurrent readers, and queue exhaustion to OFF AIR.
- Authenticated producer APIs and the dedicated Control Lab UI expose the bounded causal path. The public receiver stays GET-only and viewer-compatible.

## TESTED

- Real PostgreSQL tests exercised migration/backfill/rollback/idempotence, semantic kinds, duplicate references, activation copy, v1/v2 isolation, stale-edit conflict, queue reorder/removal, active/queued deletion refusal, deletion-vs-add serialization, restart, exact boundary catch-up, concurrent readers, and OFF AIR exhaustion.
- A spawned real server, configured only from `TEST_DATABASE_URL`, exercised authentication, create, duplicate enqueue, Start, edit, public v1 projection, exact 409 refusal/no-success-audit, Stop, future v2 Start, and legacy endpoint retirement.
- The real Control Lab client ran in the repository's VM/fake-DOM style through create → duplicate queue → Start → edit → refusal feedback. The unchanged public viewer regression suite also passed.
- In-app browser QA against a separate disposable schema verified the unauthenticated handoff, Mission Control login/link, responsive authenticated layout, create, queue, Start, visible run/version data, and zero browser console warnings/errors.

## VALIDATED

- **Narrow local validation:** the central architectural assumption is supported in disposable PostgreSQL and real HTTP evidence: mutable reusable definitions can safely feed independent upcoming references while the active copied run remains stable, and future activation receives the newer definition.
- **Not validated:** production upgrade/deployment, venue networking, multiple physical receiver devices, long-running throughput, real media timing, operator training, or the full locked Control Lab workstation.

# WHAT IS STILL MISSING

- Program Units, Unit Library, Media Bin/asset registry, Packaging Editor, shared-renderer Live Screen embedding, Ticker, Beds, subtitles, Breaking Override, Program Packs, QR integration, and full workstation composition remain deliberately absent.
- LOOP behavior remains absent: no toggle consequence, persisted runtime policy, eligible random pool, random selection, or fallback. Queue exhaustion is OFF AIR.
- No production migration or already-on-air legacy upgrade was performed. Migration correctly refuses the latter.
- No real-browser receiver/device synchronization or audio/video boundary rehearsal was performed.
- The public viewer's existing persistent elapsed/remaining presentation remains unchanged even though it conflicts with `LN-722`; that presentation change was outside Task 01.

# WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

- `loop_eligible` is persisted but causally inert future infrastructure. The UI labels it as stored-only.
- Arbitrary safe root-relative/http(s) `media_ref` values remain provisional source references, not the locked Media Bin or asset registry.
- `/control-lab` is intentionally a foundation experiment, not the locked final three-region producer workstation.
- The service uses one active-singleton lock to serialize BCL reads/mutations. This is simple and causally clear for the experiment; production polling throughput has not been measured.
- Boundary transition is a write during authoritative GET reconciliation. It is deterministic and tested, but operational monitoring/performance remains provisional.
- Legacy migration-002 tables are retained for rollback/inspection and are no longer authoritative after migration 005.

# TESTING PERFORMED

## Structural checks

- `node --check broadcast-control-lab.js`
- `node --check broadcast.js`
- `node --check server.js`
- `node --check public/control-lab.js`
- `node --check test/broadcast-master-clock.test.js`
- `node --check test/broadcast-control-lab-http.test.js`
- `node --check test/program-packager.test.js`
- `git diff --check` on changed tracked source/test surfaces; targeted searches confirmed the retired Packager handlers were absent and no out-of-scope implementation paths changed.

## Behavioral checks

- Focused final command with `TEST_DATABASE_URL` loaded only from ignored `.env.test.local`:
  - `node --test test/broadcast-master-clock.test.js test/broadcast-control-lab-http.test.js test/program-packager.test.js test/broadcast-viewer.test.js`
- Full final command with the same disposable database:
  - `npm test`
- In-app browser QA against `bcl_browser_20260824`; the temporary server/schema were stopped/dropped afterward.
- Post-test database query confirmed `remaining_user_schemas=[]`.

# TEST RESULTS

- Focused final: **18 passed, 0 failed, 0 skipped**, duration 6.09 seconds.
- Full final suite: **230 passed, 0 failed, 0 skipped**, duration 19.94 seconds.
- PostgreSQL behavior was executed, not environment-skipped.
- HTTP integration: **1 passed, 0 failed, 0 skipped** within the focused/full totals.
- Browser QA: expected unauthenticated/authenticated states, Library/Queue/Start causality, visible active run/version, and **0 console warnings/errors**.
- Temporary-schema cleanup: no user schemas remained.
- Failures: none in the final focused or full runs.
- Limitation: the total test count changed from the old 235 to 230 because obsolete modulo/fixed-three-row tests were deliberately replaced by fewer causal BCL tests; raw count is not treated as reduced or increased validation.

# IMPORTANT UNCERTAINTIES

- Whether singleton-lock serialization remains responsive under production polling and simultaneous operators has not been load-tested.
- Whether real video/image receivers remain visibly synchronized through restart and natural boundaries has not been tested on multiple physical devices.
- Whether operators understand version-late-binding and deletion refusal without training has only a minimal browser workflow check.
- Production data is not known to be off air at deployment time; migration 005 will refuse rather than guess if the legacy clock is active.
- The narrow architecture is supported locally, but integration with later Media/Packaging/QR systems is still only a compatibility plan, not current behavior.

# RECOMMENDED NEXT EXPERIMENT

**Do not start automatically.**

- **Current claim:** PostgreSQL Library, reference Queue, and immutable Active Run state stay causally separate and recover deterministically.
- **Biggest uncertainty:** the same behavior has not been observed through natural wall-clock boundaries, an application restart, and two real receiver browsers/devices using real test media.
- **Minimum experiment:** in an isolated staging deployment, create one short v1 item and queue it twice; Start; edit the reusable source to v2; restart the application before the boundary; observe the current run from two receivers; allow the natural boundary to activate v2; then allow exhaustion to OFF AIR. Record run IDs, source versions, start times, queue consumption, and both receiver outputs.
- **Observable result:** both receivers remain on identical v1 through restart, converge on the single v2 run/start at the boundary, and converge OFF AIR without duplicate consumption or modulo wrap.
- **NOW:** review/commit/deploy Task 01 only after owner approval.
- **NEXT:** run the staging two-receiver rehearsal above.
- **LATER:** select a separate packet for Media Bin/Packaging integration after the core timing workflow survives that rehearsal.
- **PARK:** QR integration and every later BCL module listed out of scope.

# FILES MODIFIED

## Implementation/runtime

- `migrations/005_broadcast_control_lab_foundation.sql` — created.
- `broadcast-control-lab.js` — created.
- `broadcast.js` — replaced old flat runtime with active-run public projection/wrappers.
- `db.js` — test-only `TEST_DATABASE_URL` fallback.
- `server.js` — transactional public read, authenticated BCL APIs/audits, legacy retirement, `/control-lab` route.
- `public/control-lab.html` — created.
- `public/control-lab.css` — created.
- `public/control-lab.js` — created.
- `public/admin.html` — legacy Packager replaced with links; its BCL handlers removed.

## Tests

- `test/broadcast-master-clock.test.js` — replaced obsolete flat/modulo tests with service/migration/concurrency PostgreSQL tests.
- `test/broadcast-control-lab-http.test.js` — created.
- `test/program-packager.test.js` — replaced fixed-Packager tests with Control Lab client/handoff tests.

## Task/design/report records

- `tasks/BCL_TASK_PACKET_01_LIBRARY_QUEUE_SNAPSHOT.md` — activation and final local implementation status.
- `tasks/README.md` — active/implemented status and shared-file ownership release.
- `docs/broadcast-control-lab/README.md` — current Task 01 reality/report links.
- `docs/pass-reports/2026-08-24_1851_bcl-library-queue-active-run.md` — created.
- `docs/pass-reports/README.md` — chronological index entry.

## Preserved earlier uncommitted Director-preparation artifacts

- `tasks/BCL_TASK_PACKET_01_LIBRARY_QUEUE_SNAPSHOT_DRAFT.md`.
- `tasks/FRNN_TEAM_TASK_PACK_02_ESCAPE_MISSION_CONTROL_AUTHORING_EXPERIMENT_V0_1.md`.
- `docs/pass-reports/2026-08-24_1740_bcl-task-packet-01-director-repair.md`.
- `docs/pass-reports/2026-08-24_1811_bcl-test-database-admin-file-gates.md`.

# COMMIT STATUS

NOT COMMITTED
