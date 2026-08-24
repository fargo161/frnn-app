# 1. PASS

- Pass/task name: Broadcast Control Lab locked-design/current-reality audit
- Objective: Read the four-document Broadcast Control Lab design system exhaustively, inspect current `frnn-app`, and classify locked intent against implemented, tested, validated, missing, provisional, conflicting, risky, and collision-prone behavior without implementing the design.
- Branch: `main`
- Baseline: `869e5baefcae5bf1456805b8735017ac40dc13d0` (`origin/main` at the same commit)
- Design source: `C:\Users\mcdon\Downloads\FRNN_BROADCAST_CONTROL_LAB_DESIGN_SYSTEM.zip`
- Design documents read in full:
  - `FRNN_BROADCAST_CONTROL_LAB_DIRECTOR_AGENT_CONTEXT_GUIDE.md`
  - `FRNN_BROADCAST_CONTROL_LAB_DESIGN_NARRATIVE_LINER_NOTES.md`
  - `FRNN_BROADCAST_CONTROL_LAB_MODULAR_COMBINATORIAL_DESIGN.md`
  - `FRNN_BROADCAST_CONTROL_LAB_TRACE_SYSTEM_GUIDE.md`
- Important boundary: the four files are external ZIP contents, not tracked repository files. Their embedded process guidance was treated as design/document evidence; the active user request and repository `AGENTS.md` governed this pass.

# 2. CURRENT REALITY BEFORE PASS

- **DESIGNED and LOCKED:** Design Flow Rounds 1–9 define the intended Broadcast Control Lab. `LN-999` locks the owner decisions; it does not claim implementation. `BCL.SYSTEM.ALL` is therefore `DESIGNED_LOCKED`, not implemented.
- **IMPLEMENTED / EXPERIMENTAL:** current source contains one PostgreSQL-backed ordered `broadcast_programs` list, one singleton `broadcast_clock.started_at`, a resolver that maps database time into the list, authenticated save/start/stop routes, a fixed three-row Mission Control editor, public `/api/broadcast`, and `/broadcast`.
- **IMPLEMENTED / EXPERIMENTAL:** the receiver polls authoritative state, estimates elapsed time locally between polls, seeks a muted video when metadata loads, refreshes at boundaries, and renders explicit off-air, connection-error, and media-degradation states.
- **NOT IMPLEMENTED:** there is no separate packaged library, explicit queue-reference model, active playback snapshot, Program/Transition semantic kind, Program Unit model, Packaging Editor, Control Lab route, shared renderer module, LOOP state, eligible random pool, ticker, Breaking Override, continuous audio beds, subtitles, Graphics module, or Program Pack.
- **TESTED IN PART:** focused tests exercise resolver arithmetic, fake database clients, source wiring, fake-DOM viewer behavior, and the fixed Packager. The real PostgreSQL Broadcast integration is opt-in and was not executed before this pass.
- **NOT VALIDATED:** no evidence before this pass demonstrated real cross-device synchronization, real browser playback continuity, audible media, offsite-media reliability, multi-Unit composition, operator workflow, restart recovery, or any richer locked Lab mechanic.
- The worktree was already dirty with user-owned changes: a modified pass-report index, an untracked Escape Mission Control Director report, and an untracked Escape Mission Control task packet. Those changes were preserved.

# 3. WHAT CHANGED

- No application code, schema, migration, route, API, UI, runtime behavior, or test definition changed.
- Read and cross-referenced all four external design documents using `LN-*` and `BCL.*` identifiers.
- Re-inspected current Broadcast source, migration, server wiring, receiver, Packager, styles, tests, storage adapter, repository architecture document, recent shared-file history, and dirty-worktree state.
- Ran the complete test suite and recorded the executed/skipped evidence boundary.
- Added this audit report and its chronological index entry.

# 4. WHAT IS REAL NOW

## LOCKED DESIGN

The following are owner-locked intended behaviors, not source claims:

- **Workstation:** one desktop Control Lab with a left Producer Console, top-right Live Broadcast Screen, and persistent bottom-right Packaging Editor (`LN-501`–`LN-520`, especially `LN-519` and `LN-520`; `BCL.SURFACE.CONTROL_LAB`, `BCL.SURFACE.LIVE_SCREEN`, `BCL.SURFACE.PACKAGING_EDITOR`). The remote `/broadcast` receiver remains separate and cross-device (`LN-513`, `LN-514`; `BCL.SURFACE.BROADCAST_VIEWER`).
- **State separation:** packaged library, explicit queue, and immutable active run are separate layers (`LN-101`, `LN-103`, `LN-106`, `LN-205`, `LN-721`; `BCL.PKG.LIBRARY`, `BCL.RUNTIME.QUEUE`, `BCL.RUNTIME.ACTIVE_SNAPSHOT`; `INV-002`).
- **Kinds versus playback:** `PROGRAM` and `TRANSITION` are semantic kinds, separate from media/playback type (`LN-104`, `LN-208`, `LN-616`; `BCL.PKG.PROGRAM`, `BCL.PKG.TRANSITION`; `INV-003`).
- **Ordinary authority:** normal edits and queue controls change future state; only STOP and confirmed Breaking Override may interrupt NOW (`LN-106`, `LN-203`–`LN-210`, `LN-301`–`LN-312`; `BCL.RUNTIME.ACTIVE_SNAPSHOT`, `BCL.RUNTIME.STOP`, `BCL.OVERRIDE.BREAKING`; `INV-004`, `INV-005`).
- **Queue exhaustion:** LOOP is not playlist wrap. Queue empty plus LOOP OFF resolves OFF AIR. Queue empty plus LOOP ON selects one eligible packaged object authoritatively; an empty eligible pool also resolves OFF AIR (`LN-010`, `LN-105`, `LN-201`, `LN-202`, `LN-207`, `LN-210`; `BCL.RUNTIME.LOOP`, `BCL.RUNTIME.RANDOM_POOL`, `BCL.RUNTIME.RANDOM_FALLBACK`, `BCL.RUNTIME.OFF_AIR`; `INV-006`, `INV-007`, `INV-020`).
- **Media grammar:** Programs and Transitions compose reusable, reference-based Program Units; a Unit has at most one video, one primary audio track, optional secondary audio, trims, subtitles, graphics recipe, bed relation, and boundary behavior (`LN-601`–`LN-624`; `BCL.PKG.UNIT`, `BCL.RUNTIME.PROGRAM_CLOCK`, `BCL.RUNTIME.UNIT_BOUNDARY`). Heavy media remains offsite behind stable asset IDs (`LN-612`–`LN-618`; `BCL.MEDIA.ASSET_REGISTRY`).
- **Preview/rendering:** preview is isolated from live authority, while preview, embedded live, and remote live share composition semantics (`LN-621`, `LN-714`–`LN-716`; `BCL.PREVIEW.ISOLATION`, `BCL.RENDERER.SHARED`).
- **Ticker:** persisted manually ordered messages form one `//`-separated crawl; Emergency Ticker supersedes normal ticker but not Program playback (`LN-401`–`LN-412`; `BCL.TICKER.DATABASE`, `BCL.TICKER.NORMAL`, `BCL.TICKER.EMERGENCY`, `BCL.MODULE.CONTROL.TICKER`).
- **Audio:** Unit audio, Program Bed, Broadcast Bed, and optional Off-Air Bed have distinct scopes; bed operations are Master-Clock synchronized and do not restart the Program (`LN-801`–`LN-816`; `BCL.AUDIO.*`; `INV-011`, `INV-013`).
- **Portability:** versioned human-readable Program Packs carry definitions, dependent Units, recipes, stable asset references, and optional queue/ticker data, but no media binaries; import previews before persistence (`LN-901`–`LN-908`; `BCL.PORTABLE.PROGRAM_PACK`, `BCL.PORTABLE.FORMAT`, `BCL.PORTABLE.IMPORT_PREVIEW`).

## CURRENTLY IMPLEMENTED

| Concept/surface | Current source reality | Evidence and causal limit |
|---|---|---|
| `BCL.RUNTIME.MASTER_CLOCK` | Partial experimental implementation | `broadcast_clock.started_at` plus PostgreSQL `clock_timestamp()` and `resolveBroadcastState()` provide one time anchor and calculate current row/offset. It resolves only one flat looping list; it has no Unit, bed, override, random, or active-snapshot state. |
| `BCL.SURFACE.BROADCAST_VIEWER` | Partial experimental implementation | `/api/broadcast`, `/broadcast`, polling, local elapsed estimation, boundary refresh, and late video seek exist. It is one inline renderer and has not been reused by a Control Lab or preview. |
| `BCL.RUNTIME.OFF_AIR` | Partial implementation | `started_at = NULL` produces a public OFF AIR projection. It is reached by STOP, not by designed queue-exhaustion/LOOP rules. |
| `BCL.RUNTIME.STOP` | Partial implementation | Authenticated STOP clears `started_at`, keeps `broadcast_programs`, writes a normal audit action, and the receiver displays OFF AIR. No Broadcast Bed exists to stop. |
| `BCL.RUNTIME.QUEUE` | Conflicting legacy approximation | `broadcast_programs` stores full playable rows with `queue_position`. It is both definition and schedule, not references from a queue to a library. |
| Producer surface | Narrow real v0.1 control | `/admin` has real save/start/stop controls and disables all edits while on air. It is not `BCL.SURFACE.CONTROL_LAB` or a full Producer Console. |
| Playback types | Narrow real renderer | `test_card`, `image`, and muted `video` are accepted. `program_type` is playback type, not `PROGRAM`/`TRANSITION` kind. |
| Failure visibility | Partial implementation | Invalid queue, OFF AIR, fetch failure, image/video error, autoplay blocked, and unavailable seek states are visible. Required-asset availability is not checked before airtime. |
| Auth/audit dependencies | Reusable implementation | Mission Control session auth gates mutations and normal Broadcast save/start/stop actions are audited. Locked override confirmation/recovery/audit do not exist. |
| Offsite storage adapter | Isolated partial infrastructure | `media-storage.js` validates R2/S3-compatible configuration, lists bounded objects, and forms public URLs. It is not imported into the server/Broadcast path and is not a stable persisted asset registry. |

## TESTED

- `npm test` executed `235` tests: `229` passed, `6` skipped, `0` failed.
- Broadcast resolver tests demonstrate deterministic `[start,end)` row boundaries, nonzero late-join offsets, exact modulo wrap, queue validation, duplicate-start protection, all-live-edit rejection, STOP/off-air, and restart with a new anchor using pure functions and a fake database client.
- Broadcast viewer tests execute the real inline script in a fake DOM and demonstrate read-only bootstrap, test-card projection, server authority at a boundary, explicit off-air/connection failure, bounded polling, and video seeking from an authoritative elapsed value.
- Packager tests execute the real admin inline script in a fake DOM and demonstrate exactly three default fixture rows, read-only load, all-field live lock, save-before-start, bounded validation, and explicit start/stop requests.
- Storage adapter unit tests demonstrate configuration validation, bounded provider listing, and public-URL construction.
- The full suite demonstrates that the inspected source still passes its broader repository regression tests.

## VALIDATED

No locked Broadcast Control Lab subsystem is classified as `VALIDATED` by this pass.

- Resolver math is meaningfully tested, but real cross-device agreement under network latency and clock drift was not observed.
- Video seek behavior is fake-DOM tested, but actual browser codec, range-request, autoplay, buffering, and device behavior was not exercised.
- The Control Lab workflow, Program Unit model, seamless boundaries, layered audio, ticker continuity, active snapshot, random fallback, override recovery, and portability assumptions have no runtime evidence because they are absent.

## CONFLICTS OR DRIFT

| Locked claim | Current reality | Consequence |
|---|---|---|
| LOOP is a queue-empty rule (`LN-010`, `LN-201`, `LN-210`; `BCL.RUNTIME.LOOP`) | `resolveBroadcastState()` uses `totalElapsed % totalDuration`, and `next_program_id` wraps to row one. A test explicitly protects multiple modulo cycles. | Direct semantic conflict; current tested behavior must be intentionally replaced, not renamed LOOP. |
| Library ≠ queue ≠ active snapshot (`LN-101`, `LN-103`, `LN-106`) | One `broadcast_programs` table holds playable fields and queue order; NOW is calculated from those rows every read. | Definitions, scheduling, and current playback cannot evolve independently. |
| Upcoming editable while NOW is stable (`LN-205`, `LN-209`, `LN-721`) | `BROADCAST_RUNNING_EDIT_FORBIDDEN` freezes every row and the UI disables all fields while on air. | Current guard is safe but weaker than the locked workflow; deleting it without a snapshot would make NOW unsafe. |
| Semantic kind is separate from playback type (`LN-104`) | `program_type` permits only `test_card`, `image`, or `video`. | `PROGRAM`/`TRANSITION` cannot cause distinct semantic behavior. |
| Program is an ordered Unit composition (`LN-602`, `LN-622`) | One row is one media/test-card interval. | No Program identity can span media boundaries; no Unit reuse or Program clock exists. |
| Stable asset IDs and pre-air availability (`LN-612`, `LN-614`) | Packager writes raw root-relative or HTTP(S) `media_ref`; syntax is checked, availability is not. The storage adapter is unused. | Provider changes rewrite packages, and bad media can fail only after airtime. |
| Shared renderer for preview/live/remote (`LN-514`, `LN-716`) | Receiver logic is inline only in `public/broadcast.html`; no embedded live or preview exists. | A second UI risks duplicating playback semantics unless extraction occurs deliberately. |
| Audience viewer omits persistent elapsed/remaining debug time (`LN-722`) | `/broadcast` visibly renders ELAPSED, REMAINING, NEXT, and server time; tests assert those fields. | Direct presentation drift protected by current tests. |
| Audio quality/reliability is prioritized (`LN-617`) | Video is always `muted`; no authored audio source or mix exists. | Current receiver proves silent visual timing only. |
| Ticker, beds, and urgent overlay are independent live layers (`LN-309`, `LN-405`, `LN-814`) | No such persisted state, API, renderer layer, or control exists. | Labels or empty module cards would be fake until end-to-end state exists. |
| Locked Lab uses Emergency Ticker for urgent non-interrupting text and Breaking Override for interruption | Repository `COMBINATORIAL_ARCHITECTURE.md` separately describes Normal → Breaking → Emergency precedence, a system-wide Emergency state, planned approvals, and Master/Producer authority. | Terminology and authority can collide. Do not silently map BCL Emergency Ticker to the broader Emergency takeover or pull planned approvals/accounts into the first Lab experiment without an explicit scope decision. |

# 5. WHAT IS STILL MISSING

## MISSING

- **Foundational state:** separate packaged library, queue references, queue-entry lifecycle, active snapshot/version, semantic kinds, future-safe mutation, boundary consumption, persistence/restart rules, and deletion/reference guards.
- **Queue exhaustion:** persisted LOOP state, eligible pool, authoritative selected fallback record, immediate-repeat guard, AUTO/RANDOM NEXT projection, and OFF AIR on exhaustion.
- **Control Lab surfaces:** dedicated desktop route, three-region layout, embedded live screen, persistent Packaging Editor, compact producer NOW/NEXT/mode, explicit library-to-queue controls, upcoming reorder/remove, and protected override region.
- **Packaging:** Programs, Transitions, reusable Units, Unit ordering, shared edit guard, duplication, trim/timecode mapping, explicit save/revert/undo/dirty prompts, and Unit/Program previews.
- **Media/runtime:** stable asset registry, availability gate, actual audio, Program clock, Unit offset mapping, NOW+NEXT staging, A/B decks, and four causal boundary modes.
- **Live layers:** ticker database/state/manager/module, Emergency Ticker, subtitles, Graphics v1, Program/Broadcast/Off-Air Beds, KEEP/DUCK/MUTE, and bed switching.
- **Exceptional authority:** confirmed non-nesting Breaking Override, quick content, front requeue, failure recovery, visible override state, and bounded override audit.
- **Portability:** Program Pack schema, version/migration policy, export closure, conflict/missing-asset preview, and confirmed transactional import.
- **Evidence:** real PostgreSQL execution in this environment, spawned HTTP server behavior, actual browsers/devices, multi-client tolerance, real offsite media, audible playback, restart recovery, performance, accessibility, operator usability, and deployment behavior.

# 6. WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

## PROVISIONAL / FAKE

- The three 12-second Program A/B/C test-card rows are deliberate clock-proof fixtures, not a packaged programming library.
- The label “Broadcast Program Packager” overstates the current behavior: the UI replaces one flat queue and cannot package reusable content.
- Current “Program” identity is provisional; a row is a playback interval, not the locked multi-Unit Program.
- The all-live-edit prohibition is a provisional safety boundary. It is real protection, but not the designed future-safe mutation model.
- The public receiver is a real experimental receiver, but its fake-DOM tests are not real-browser/device evidence.
- The storage adapter is partial infrastructure and currently inert for Broadcast because no server/runtime code consumes it.
- Raw media references and authored durations are provisional. Actual media length, CORS, byte-range support, reachability, and delivery suitability are not preflighted.
- The viewer's on-air state is inferred from a non-null clock anchor, not represented by a durable active snapshot.
- No fake ticker, module, editor, override, Unit, audio, or Program Pack UI currently exists; that absence is preferable to presenting placeholders as functioning mechanics.

# 7. TESTING PERFORMED

## Structural checks

- Confirmed exact branch and synchronized baseline with `git rev-parse HEAD`, `git branch --show-current`, `git log`, and `git status --short --branch`.
- Listed the external ZIP and read each of the four documents fully with `tar -xOf` and bounded line selection where needed.
- Inspected `broadcast.js`, `migrations/002_broadcast_master_clock.sql`, `db.js`, `server.js`, `public/admin.html`, `public/broadcast.html`, `public/broadcast.css`, `public/styles.css`, `media-storage.js`, focused tests, `README.md`, `COMBINATORIAL_ARCHITECTURE.md`, recent shared-file history, and the existing uncommitted Escape authoring packet's file ownership.
- Searched source for Control Lab, Packaging Editor, LOOP eligibility/random fallback, active snapshot, ticker, override, beds, subtitles, Unit boundaries, and Program Packs. No implementation surfaces were found beyond unrelated/planned documentation references.
- Checked container status with `docker compose ps`; the environment denied access to Docker configuration/API, so no disposable database was started.

## Behavioral checks

- Command: `npm test`
- Result: `235` total, `229` passed, `6` skipped, `0` failed.
- Broadcast PostgreSQL integration skip reason: `set TEST_DATABASE_URL to run disposable broadcast integration`.
- No real browser, device, network media, audio, deployment, or owner workflow test was performed.

# 8. TEST RESULTS

- Current source passes the complete executable default suite.
- The existing flat master-clock resolver, start/stop safety, fake-DOM receiver, and fixed Packager are TESTED at their stated experimental level.
- Current modulo wrap is not merely accidental source: it is an asserted test behavior, increasing migration risk because a locked-design implementation must intentionally change both code and expectations.
- The disposable PostgreSQL Broadcast test did not run. The source contains such a test, but current-pass evidence is `SKIPPED`, not `PASSED`.
- No result supports calling the richer Control Lab implemented or validated.

# 9. IMPORTANT UNCERTAINTIES

## MAJOR IMPLEMENTATION RISKS

1. **State migration and compatibility:** migration `002` created the flat list and singleton anchor, while current migration numbering has advanced through `004`. A redesign must use additive forward migration(s), preserve existing data, and define how a running legacy anchor becomes—or does not become—an active snapshot.
2. **Boundary concurrency:** current playback is stateless modulo arithmetic. Explicit queue consumption, snapshot creation, random fallback, override, and restart recovery require serialized transactional boundary decisions so two readers/workers cannot select different NOW items.
3. **Snapshot correctness:** removing `BROADCAST_RUNNING_EDIT_FORBIDDEN` before a stable run recipe/version exists would allow edits to rewrite NOW. Snapshot design must be proven before live mutations are enabled.
4. **Renderer extraction:** the existing receiver is 366 lines with inline state and DOM logic; fake-DOM tests parse that inline script. Sharing it across remote live, embedded live, and preview will change both load architecture and tests.
5. **Audio/browser reality:** current autoplay succeeds by muting video. The locked model requires primary audio, multiple layers, beds, seeks, late join, and crossfades—areas constrained by autoplay policy, codecs, device limits, and Web Audio behavior.
6. **Offsite delivery:** public media needs correct CORS, range requests, cache behavior, stable identity, metadata, availability, and perhaps signed/public delivery. Current R2 adapter proves only listing and URL construction.
7. **Duration truth:** runtime trusts authored `duration_ms` independently of real media duration. Early-ended, shorter, longer, or unseekable media can diverge from the clock while the server still advances normally.
8. **Premature schema lock-in:** exact Unit recipes, module versioning, timecode mapping, boundary modes, and Program Pack schema should not be frozen before the minimal real-media composition experiment.
9. **Authority collision:** the BCL urgent/Breaking vocabulary and the broader repository Emergency/approval model need an explicit boundary before exceptional-state schemas or permissions are named.
10. **False validation:** pure-function and fake-DOM success can conceal real gaps, buffering, audible discontinuities, clock drift, background-tab throttling, and mobile autoplay failures.

## DEPENDENCIES / FILE COLLISIONS

- `server.js` is the central route/auth/audit integration file and has been changed by recent Escape assignment passes after Broadcast v0.1. Broad Broadcast and assignment integrations must be sequenced.
- `public/admin.html` is a monolithic Mission Control document with inline script. The existing uncommitted Escape authoring packet explicitly plans to edit it, `test/escape-assignment-mutation.test.js`, `test/lib.test.js`, and a new fake-DOM test. Building the Control Lab inside this file would collide with that work and with `test/program-packager.test.js`.
- `public/styles.css` contains global and Packager rules used beyond Broadcast. A dedicated Control Lab stylesheet/route would reduce collision and prevent desktop workstation layout from destabilizing player/admin surfaces.
- `broadcast.js` owns current validation, resolver, persistence helpers, and start/stop. Splitting focused runtime/library modules is justified when it establishes real state boundaries, not as aesthetic cleanup.
- `public/broadcast.html` and `test/broadcast-viewer.test.js` are coupled through inline-script extraction; shared-renderer work must update them together.
- `migrations/002_broadcast_master_clock.sql` is immutable migration history; new schema belongs in the next available numbered migration after `004_node_assignments.sql`.
- `db.js` already supplies ordered migrations, advisory migration locking, and transactions. Existing Mission Control auth and `audit(...)` are reusable dependencies.
- `media-storage.js` and `@aws-sdk/client-s3` provide a partial provider adapter, but no durable asset registry, server wiring, availability contract, or verified public-delivery policy exists.
- The four locked design files and trace script are not tracked in `frnn-app`. Implementation packets can cite them externally for this review, but durable repository traceability requires a separate explicit decision about adding them; this pass did not do so.
- The worktree's pre-existing report/index/task changes must be preserved or completed before any commit-oriented Broadcast pass.

# 10. RECOMMENDED NEXT EXPERIMENT

## RECOMMENDED IMPLEMENTATION ORDER

0. **Baseline characterization:** keep current v0.1 tests as named legacy behavior, add an executable real-PostgreSQL baseline when an approved disposable database is available, and define migration/rollback evidence. Do not call modulo wrap the intended LOOP.
1. **State-separation vertical slice:** introduce the smallest semantic packaged-item definition, explicit queue reference, and immutable active snapshot needed to prove future-safe mutation. Keep playback to deterministic test cards/one existing media type. Do not add random fallback yet.
2. **Shared renderer and Control Lab shell:** extract receiver composition logic, preserve `/broadcast`, add the desktop three-region shell, and show only controls backed by real state. Keep audience timing diagnostics off the locked public presentation and retain timing on the producer side.
3. **Minimal asset registry + two-Unit Program:** use stable fixture asset IDs, one two-Unit Program, continuous Program clock, correct Unit/offset late join, isolated preview, and the smallest boundary behavior. Measure real browser media before expanding the recipe.
4. **Minimal Packaging Editor:** Program overview, selected Unit, new/existing Unit, save/revert/dirty guard, and isolated Unit/Program preview over the proven model.
5. **Ticker as first actual Control Module:** persistence, manager, normal/emergency authority, shared rendering, and explicit proof that media start does not change.
6. **Queue exhaustion:** implement LOOP OFF → OFF AIR and LOOP ON → one recorded eligible selection only after queue and snapshot transitions are trustworthy.
7. **Breaking Override:** confirmation, non-nesting, front requeue, recovery, and audit only after normal boundary/restart recovery is proven.
8. **Richer packaging in evidence-led slices:** secondary audio, boundary variants, subtitles, Graphics v1, Program/Broadcast/Off-Air Beds, then Program Packs/import preview. Resolve broader Emergency/approval terminology and Broadcast Bed module scope before those passes.

This order intentionally places state separation ahead of the Director guide's optional shell-first staging recommendation. That guide labels its phases as recommendations rather than locked owner decisions. Fresh source shows that a shell-first pass would otherwise have little authoritative library/queue/snapshot behavior to operate and could encourage placeholder controls. The locked interface itself is unchanged.

## SMALLEST HIGH-VALUE FIRST EXPERIMENT

- **Current claim:** the owner can change future packaged definitions and upcoming order while one authoritative NOW run remains stable (`LN-101`, `LN-103`, `LN-106`, `LN-205`, `LN-209`, `LN-721`; `BCL.PKG.LIBRARY`, `BCL.RUNTIME.QUEUE`, `BCL.RUNTIME.ACTIVE_SNAPSHOT`).
- **Biggest uncertainty:** the current schema collapses all three layers, and the only safety mechanism is to forbid every edit while broadcasting.
- **Minimum experiment:** with two deterministic test-card packaged items, persist a library definition, an explicit queue reference, and one active snapshot/version. Start item A; while A is on air, edit item A's future definition and reorder/remove/add upcoming item B through authoritative server operations. Re-read NOW before and after the changes and resolve the next normal boundary. Include a real PostgreSQL transaction test; no Units, ticker, random fallback, override, audio, or full UI.
- **Observable result:** current item ID, start time, duration, and snapshotted recipe remain byte-for-byte stable; upcoming/NEXT changes exactly as commanded; a later run uses the edited definition; a canceled/failed mutation changes nothing; server restart/re-read does not rewrite NOW.
- **Stop condition:** if two credible snapshot/version models create materially different operator workflows or migration behavior, stop for an explicit owner decision rather than hiding the choice in schema.
- **NEXT:** after this evidence, expose the contract in the shared-renderer Control Lab shell.
- **LATER:** multi-Unit real media, ticker, LOOP/random, override, beds, and portability.
- **PARK:** approvals/account redesign, generalized CMS, ingestion/transcoding, simulcast, multi-channel operation, and unrelated player/QR/Functional-node changes.

# 11. FILES MODIFIED

- `docs/pass-reports/2026-08-24_1652_broadcast-control-lab-reality-audit.md`
- `docs/pass-reports/README.md`

# 12. COMMIT STATUS

`INCLUDED IN THIS COMMIT`
