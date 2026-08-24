# 1. PASS

- Pass/task name: Broadcast Control Lab Task Packet 01 Director repair
- Objective: Reconcile the draft Library / Queue / Active Snapshot packet against locked BCL design and current `frnn-app` source, pin its four unresolved product/architecture boundaries, and produce an implementation-ready but non-active replacement without changing application behavior.
- Branch: `main`
- Baseline: `858afd24d38cb0f8f35bf0c815211abe44b16c3a`
- Working mode: documentation-only Director pass using read-only source/test audits; no runtime implementation was authorized.

# 2. CURRENT REALITY BEFORE PASS

## Repository and documentation

- `main` and `origin/main` both resolved to `858afd24d38cb0f8f35bf0c815211abe44b16c3a` before edits; the worktree was clean.
- All four owner-locked Broadcast Control Lab design documents and their README were committed.
- `tasks/BCL_TASK_PACKET_01_LIBRARY_QUEUE_SNAPSHOT_DRAFT.md` was visibly `DRAFT_NEEDS_REVISION` and “NOT AN ACTIVE WORK ORDER.”
- A pending Escape Mission Control authoring packet also claims `public/admin.html`, creating a direct UI collision for any BCL implementation that expands the legacy Packager.

## IMPLEMENTED

- Migration 002 provides one flat `broadcast_programs` table and one singleton `broadcast_clock.started_at` row.
- One row combines reusable definition and queue position. Its primary key prevents repeated queue references to the same identity.
- `program_type` is constrained to playback values `test_card|image|video`; no semantic PROGRAM/TRANSITION kind exists.
- `resolveBroadcastState()` uses modulo arithmetic over the whole list. The queue never consumes entries and never exhausts while the clock is running.
- `readBroadcastSnapshot()` rereads the current mutable list and clock; it is a query helper, not a persisted active snapshot.
- All program mutation is a whole-list replacement and is prohibited whenever the clock is running.
- Start/Stop, the public state API, the public viewer, late-join seeking, and fixed three-row admin Packager exist.
- PostgreSQL and database time are authoritative in the experimental source; current process-restart continuity is inferable from persisted rows/anchor, but no process-restart test proves it.

## TESTED

- Resolver timing/boundaries/modulo, validation, duplicate Start, broad live-edit refusal, Stop, and fresh post-Stop anchor have focused tests.
- The fixed Packager and public viewer scripts have Node VM/fake-DOM behavioral coverage.
- A disposable PostgreSQL Broadcast integration test exists but is skipped without `TEST_DATABASE_URL` and covers only the old flat model.
- The pass reran `npm test`: 235 total, 229 passed, 0 failed, 6 skipped.

## VALIDATED

- No evidence validates the locked Library → Queue → immutable Active Snapshot assumption, operator workflow, real process recovery, multi-client behavior on the new model, or production migration.

## DESIGNED / LOCKED BUT MISSING

- `BCL.PKG.LIBRARY` (`LN-101`, `LN-102`).
- Reference queue with independent entry identity (`LN-103`; `BCL.RUNTIME.QUEUE`).
- Stable persisted NOW recipe/version/start (`LN-106`, `LN-205`, `LN-721`; `BCL.RUNTIME.ACTIVE_SNAPSHOT`).
- Queued/on-air deletion guard (`LN-107`; `BCL.PKG.DELETION_GUARD`).
- PROGRAM/TRANSITION semantic kind separate from playback type (`LN-104`; `INV-003`).
- Dedicated Control Lab surface.

## PROVISIONAL / CONFLICTING

- Three A/B/C rows and test-card defaults are fixtures, not a library or packaging system.
- Arbitrary media references are not the locked asset registry.
- The global on-air write ban protects data but conflicts with editable upcoming state.
- Modulo wrap conflicts with `LN-010` and `INV-020`.
- The viewer still exposes persistent elapsed/remaining display, conflicting with `LN-722`.

## Draft packet problems

1. It called for an Active Snapshot without defining persisted fields, identity, version, source of truth, activation, boundary advancement, or restart behavior.
2. It left queued/on-air deletion behavior as an implementer decision despite locked `LN-107`.
3. It explicitly deferred semantic PROGRAM/TRANSITION kind even though the first Library schema would otherwise encode the known `INV-003` conflict.
4. It proposed replacing the Packager inside `public/admin.html` despite a pending Escape UI packet claiming the same monolithic file.
5. It simultaneously asked to preserve modulo-wrap viewer behavior and to introduce a consumable reference queue/active snapshot. Those scheduling models are incompatible.
6. It did not define migration behavior for an already-running legacy channel, repeated library references, concurrency, version conflicts, or authoritative boundary catch-up.
7. Several tests offered choices such as “block or guard” or “reflected or snapshotted,” leaving the primary design decisions to implementing agents.

# 3. WHAT CHANGED

- Added `tasks/BCL_TASK_PACKET_01_LIBRARY_QUEUE_SNAPSHOT.md` with status `READY_FOR_OWNER_ACTIVATION` and a full baseline/current-reality section.
- Replaced the draft contents with a short supersession pointer; the draft was never activated or rewritten as completed work.
- Updated the task index and BCL README to link the repaired packet while retaining the explicit owner-activation gate.

## Decisions pinned

### Active snapshot/version model

- Reusable definitions are mutable rows with monotonic `definition_version`.
- Upcoming queue entries reference library identity and resolve the latest committed version only at activation.
- One PostgreSQL singleton active-run row contains a unique run ID, source library/version/queue lineage, copied immutable playback fields, and the sole authoritative `started_at`.
- Start consumes one upcoming entry and snapshots it atomically.
- Time-driven boundary reconciliation consumes later entries using exact prior end boundaries; queue exhaustion becomes OFF AIR rather than modulo wrap.
- New-model restart recovery is in scope, including deterministic multi-boundary catch-up and concurrent-reader convergence.
- Migration from a legacy on-air clock is explicitly refused and rolled back rather than guessed.

### Deletion/reference guard

- Queued or active definitions return HTTP 409 `PACKAGED_ITEM_REFERENCED` with exact queued count and active flag.
- Restrictive PostgreSQL foreign keys back the service-level transactional check.
- No cascade, silent queue removal, active mutation, partial audit success, or raw race error is allowed.

### Semantic kind

- `item_kind` enters the first Library migration with uppercase `PROGRAM|TRANSITION`.
- `playback_type` remains separately constrained to `test_card|image|video`.
- The public viewer continues receiving `current_program.program_type` mapped from copied `playback_type` for compatibility.

### UI boundary

- Task 01 creates a dedicated minimal `/control-lab` producer surface for Library, Upcoming, NOW, Start/Stop, and visible failures.
- It does not create fake Live Screen, Packaging Editor, Ticker, Unit, Bed, Override, or Program Pack controls.
- The old `/admin` Packager is retired to a link, not expanded. That small shared-file change must be sequenced with the pending Escape authoring packet.

## Trace references used

- Library/reuse/reference model: `LN-101`–`LN-103`; `BCL.PKG.LIBRARY`; `BCL.RUNTIME.QUEUE`.
- Semantic kind: `LN-104`; `BCL.PKG.PROGRAM`; `BCL.PKG.TRANSITION`; `INV-003`.
- Active safety: `LN-106`, `LN-205`, `LN-209`, `LN-721`; `BCL.RUNTIME.ACTIVE_SNAPSHOT`; `CR-07`; `INV-004`.
- Deletion: `LN-107`; `BCL.PKG.DELETION_GUARD` alias under `BCL.PKG.LIBRARY`.
- Required definition fields: `LN-108`.
- Modulo supersession: `LN-010`; `BCL.RUNTIME.LOOP`; `INV-020`.
- Surface boundary: `LN-501`–`LN-520`; `BCL.SURFACE.CONTROL_LAB`; `BCL.SURFACE.PRODUCER_CONSOLE`.

# 4. WHAT IS REAL NOW

- **DESIGNED:** Task Packet 01 now contains one complete, bounded implementation model instead of delegating snapshot, deletion, semantic-kind, UI, restart, and migration decisions to implementing agents.
- **IMPLEMENTED:** only documentation, task-state, and pass-report changes from this Director pass.
- **NOT IMPLEMENTED:** every application behavior described by the packet, including tables, APIs, active run, Control Lab route, migration, deletion guard, and UI.
- **TESTED:** current pre-packet source still passes the available suite as reported above. No test result demonstrates the newly designed behavior.
- **VALIDATED:** no new design assumption was validated by this documentation pass.

# 5. WHAT IS STILL MISSING

- Owner activation of Task Packet 01.
- The new migration/tables, library services, queue services, active-run resolver, APIs, audit events, and `/control-lab` client.
- Disposable PostgreSQL evidence for migration, restart, concurrency, deletion races, snapshot immutability, and public projection.
- Real browser/device/operator evidence.
- Resolution of execution order for the pending Escape authoring packet and BCL’s minimal `public/admin.html` retirement edit.
- A later owner-authorized LOOP/random fallback packet after the foundational state layers work.

# 6. WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

- Current A/B/C test cards, fixed three-row admin editor, and fake-DOM UI tests remain provisional experimental surfaces.
- Current `readBroadcastSnapshot()` remains a misleadingly named transient query, not a persisted snapshot.
- PostgreSQL integration is environment-gated and was skipped during this pass.
- The repaired packet intentionally includes `loop_eligible` as inert, clearly labeled provisional schema infrastructure; Task 01 gives it no runtime effect.
- The dedicated Control Lab surface is only designed. No placeholder application UI was added in this pass.

# 7. TESTING PERFORMED

## Structural/read-only checks

- Verified branch, `HEAD`, `origin/main`, and initial worktree cleanliness.
- Read the queued Director runbook, BCL README, complete Director Context Guide, complete Modular Combinatorial Design, complete Narrative/Liner Notes, complete Trace System Guide, and draft packet.
- Inspected `broadcast.js`, migration 002, `db.js`, `schema.sql`, relevant `server.js` routes/error mapping, `public/admin.html`, `public/broadcast.html`, the three focused Broadcast test files, task indexes, recent commits, and pending Escape packet/report collision surfaces.
- Used three read-only agents for independent persistence, runtime/UI, and tests/collision audits; the Director retained final integration decisions.
- Verified the replacement packet contains every required section, both updated indexes resolve to existing files, the mandatory report contains all twelve repository-required sections, and `git diff --check` reports no whitespace error.

## Behavioral checks

- Command: `npm test`
- The command exercised the current source only; it did not exercise the designed replacement packet.

# 8. TEST RESULTS

- `npm test`: 235 total; 229 passed; 0 failed; 6 skipped.
- The skipped set includes the only real PostgreSQL Broadcast integration because `TEST_DATABASE_URL` was absent. The other five skips are environment-gated non-BCL integrations.
- No migration, schema change, server route, runtime mutation, or application UI was executed or modified.
- Documentation section/link/status checks passed. `git diff --check` passed; Git emitted only the repository's existing Windows LF→CRLF working-copy warnings.

# 9. IMPORTANT UNCERTAINTIES

- Whether the singleton copied-snapshot model remains sufficient once Units, Beds, Override recovery, or Program Packs add richer recipes.
- Whether request-time transactional boundary catch-up performs acceptably under real polling and concurrent clients.
- Whether refusing an already-running legacy migration is operationally acceptable for the first deployment.
- Whether the minimal dedicated producer surface proves the owner workflow without the later embedded Live Screen.
- Whether the pending Escape UI packet should land before or after Task 01; concurrent edits to `public/admin.html` are unsafe.
- Whether a disposable PostgreSQL target will be available at activation. Without it, the packet’s required persistence/concurrency evidence cannot honestly be produced.

# 10. RECOMMENDED NEXT EXPERIMENT

- **NOW:** current claim → the packet now pins a coherent Library → Queue → immutable Active Run design; biggest uncertainty → whether PostgreSQL transactions and the existing public viewer can preserve NOW while future definitions change; minimum experiment → explicitly activate this packet, implement the bounded schema/service/UI chain, and run its real PostgreSQL causal tests; observable result → active run ID/start/copied v1 remain unchanged through source v2 edit, future activation uses v2, and queued/active deletion returns exact non-mutating refusal.
- **NEXT:** after that evidence, choose either the minimal Unit/media vertical slice or LOOP OFF/ON authoritative queue-exhaustion experiment; do not start both.
- **LATER:** Ticker, Beds, A/B playback, Packaging Editor depth, Override, Program Packs, and QR/Broadcast integration.
- **PARK:** broad Mission Control redesign, player/node changes, generalized media DAM, or fake module shells.

## Recommended activation decision

`READY_FOR_OWNER_ACTIVATION`, not active. Owner activation is appropriate only after confirming a disposable PostgreSQL test database and sequencing the shared `public/admin.html` edit with the pending Escape packet.

# 11. FILES MODIFIED

- `tasks/BCL_TASK_PACKET_01_LIBRARY_QUEUE_SNAPSHOT.md` — created.
- `tasks/BCL_TASK_PACKET_01_LIBRARY_QUEUE_SNAPSHOT_DRAFT.md` — replaced with supersession pointer.
- `tasks/README.md` — updated task status/link.
- `docs/broadcast-control-lab/README.md` — updated implementation-boundary link/status.
- `docs/pass-reports/2026-08-24_1740_bcl-task-packet-01-director-repair.md` — created.
- `docs/pass-reports/README.md` — updated chronological index.

# 12. COMMIT STATUS

NOT COMMITTED
