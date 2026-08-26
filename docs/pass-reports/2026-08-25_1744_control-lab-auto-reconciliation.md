# Broadcast Control Lab automatic reconciliation

## PASS

- Task: Repair the stale Broadcast Control Lab NOW / Upcoming Queue display after natural boundaries.
- Objective: Make the open, authenticated Control Lab periodically read and render the existing authoritative aggregate state without changing Broadcast runtime semantics.
- Branch: `main`
- Starting SHA: `4f9c7cbb6b9621a394c8bb5f4bd015419428b77f`
- Commit status: `NOT COMMITTED`

## CURRENT REALITY BEFORE PASS

- **IMPLEMENTED:** `public/control-lab.js` loaded aggregate state during initialization, after producer actions, and when the operator used the manual Refresh button.
- **IMPLEMENTED:** `GET /api/admin/broadcast/control-lab` already performed the authoritative PostgreSQL read/reconciliation path through `readControlLabState`; natural boundary advancement and queue consumption were server-owned and transactionally locked.
- **TESTED:** Existing Broadcast tests exercised finite exhaustion, concurrent readers, immutable Active Runs, late-bound future versions, and public receiver projection.
- **VALIDATED:** The owner's physical rehearsal showed that the phone receiver returned to OFF AIR and the authoritative queue was consumed while the open Control Lab remained stale until a browser refresh.
- The exact client defect was the absence of any periodic or lifecycle-driven call to `loadState()`. The Control Lab held its last in-memory response indefinitely when no producer action occurred.

## WHAT CHANGED

- `public/control-lab.js`
  - Added a modest 3,000 ms automatic reconciliation cadence for visible, authenticated Control Lab pages.
  - Added `reconcileAutomatically`, `startAutoReconciliation`, and `stopAutoReconciliation`.
  - Reused the existing aggregate GET and `loadState`; no producer mutation or client-side clock was added.
  - Serialized automatic reads so a second poll is skipped while the first remains in flight.
  - Added request sequencing so a superseded response cannot overwrite state from a later load; starting a producer action also invalidates an older pending read.
  - Stopped polling and invalidated pending rendering on page hide/unload and authentication expiry. Page polling resumes only when the page is visible and an authenticated operator remains present.
  - Preserved the existing manual Refresh action.
  - Kept the last known state visible on a transient automatic-read failure and exposed that condition in the session label; a 401 returns to the existing sign-in-required state.
- `test/program-packager.test.js`
  - Extended the real Control Lab client harness with deterministic interval, lifecycle, and deferred-response controls.
  - Added behavioral cases for one-item exhaustion, A-to-B-to-OFF-AIR progression, GET-only polling, overlap suppression, stale-response rejection, page disposal, and session expiry.
- `test/broadcast-control-lab-http.test.js`
  - Corrected the disposable HTTP test launcher to pass its isolated schema as both `DATABASE_URL` and `TEST_DATABASE_URL`. This prevents a local `.env.test-lab` `DATABASE_URL` from taking precedence and routing the test into the persistent Test Lab database.
  - This is test isolation only; no server or production runtime code changed.
- During verification, the initially misrouted HTTP test created `http-news` in the persistent Test Lab database. A guarded transaction removed exactly that generated Library item and its one remaining queue reference and cleared its generated active snapshot. Unrelated Library entries were not touched; the audit trail was preserved.

## WHAT IS REAL NOW

### IMPLEMENTED

- An open, visible, authenticated Control Lab issues at most one aggregate state GET per three-second interval.
- The next successful reconciliation rerenders authoritative NOW, Library, and Upcoming Queue state.
- Single-item natural exhaustion becomes visible as OFF AIR plus an empty queue without manual refresh.
- A natural A-to-B boundary becomes visible as B active plus an empty queue, and later B exhaustion becomes visible as OFF AIR.
- Polling does not issue start, stop, queue, Library, or reorder mutations.
- Manual Refresh remains available as an explicit immediate reconciliation.
- Runtime timing, queue semantics, immutable Active Run snapshots, late binding, STOP behavior, audit behavior, PostgreSQL authority, and public Broadcast behavior are unchanged.
- LOOP remains stored-but-inert; no LOOP behavior, WebSocket, SSE, public-receiver edit, or general UI redesign was introduced.

### TESTED

- The client harness rendered authoritative later-poll state for one-item and two-item boundary sequences.
- Concurrent automatic invocations issued one GET, and an older deferred response could not replace a newer rendered response.
- Page exit stopped the interval and prevented another read; a poll returning 401 stopped polling and exposed sign-in-required state.
- The existing PostgreSQL boundary test still proved concurrent readers consume each queue entry once and converge to OFF AIR.
- A real local browser created, queued, and started a 1,200 ms test card. It first displayed ON AIR, then displayed OFF AIR and an empty queue after automatic reconciliation without a Refresh click. Browser logs contained no warnings or errors.

### VALIDATED

- The originally broken visibility path is validated for a short local desktop-browser rehearsal against a disposable PostgreSQL schema: server state changed, the next client poll received it, and the visible Control Lab rerendered without manual input.
- Physical-phone and long-running owner-session behavior were not validated in this pass.

## WHAT IS STILL MISSING

- The owner has not yet repeated the physical-phone rehearsal with this repair.
- Long-running sessions, multiple simultaneous operator tabs, and transient network interruption/recovery were not physically rehearsed.
- Automatic freshness is polling-based, so visible updates can lag the authoritative boundary by up to approximately one cadence plus request time.

## WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

- No new fake server state, mock runtime, or placeholder integration was added.
- The three-second cadence is a bounded operator-lab choice rather than a measured production load target.
- LOOP remains an inert stored flag exactly as before this pass.

## TESTING PERFORMED

### Structural checks

- `git diff --check`
- Source review confirmed the public receiver and server runtime were not modified.

### Behavioral checks

- `node --test test/program-packager.test.js`
- `npm test`
- `node --env-file=.env.test.local --test test/broadcast-control-lab-http.test.js`
- `node --env-file=.env.test.local --test`
- In-app browser QA against `http://127.0.0.1:32119/control-lab` using a disposable schema and a 1,200 ms test-card item.

## TEST RESULTS

- Focused Control Lab client: 7 passed, 0 failed, 0 skipped.
- Ordinary `npm test`: 227 passed, 0 failed, 11 PostgreSQL-dependent tests skipped because that script does not load `.env.test.local`.
- First database-loaded full run: 237 passed, 1 failed. Investigation established that `.env.test-lab` overrode the intended disposable connection in the HTTP launcher; this was a test-isolation defect, not a polling failure. Generated operational residue was cleaned as described above.
- Corrected isolated HTTP integration: 1 passed, 0 failed, 0 skipped.
- Final database-loaded full suite: 238 passed, 0 failed, 0 skipped.
- Real browser QA: ON AIR rendered immediately after START; after natural exhaustion, OFF AIR and an empty queue rendered automatically; no Refresh click, browser warning, or browser error occurred.

## IMPORTANT UNCERTAINTIES

- Each visible authenticated Control Lab tab adds one aggregate transaction approximately every three seconds. The acceptable number of concurrent operator tabs has not been load-tested.
- Hiding or unloading a page invalidates late rendering, but an already-issued network request is allowed to finish; it is not aborted at the transport layer.
- The short browser rehearsal supports the repair claim but does not replace the owner's physical phone/laptop observation under normal Wi-Fi conditions.
- The persistent Test Lab audit table retains accurate entries from the initially misrouted `http-news` verification, so those rows may appear as test noise in audit review.

## RECOMMENDED NEXT EXPERIMENT

Do not start automatically.

- **NOW — current claim:** Natural boundary state is visible in the open Control Lab on the next modest poll.
- **Biggest uncertainty:** Whether the repaired laptop Control Lab and the physical phone receiver stay visibly aligned during the owner's normal Wi-Fi rehearsal.
- **Minimum experiment:** Queue one finite item, press START, observe the phone ON AIR, wait for natural completion, and do not touch Refresh or reload on the laptop.
- **Observable result:** The phone returns to OFF AIR and the already-open Control Lab automatically shows OFF AIR plus an empty Upcoming Queue within approximately one polling cadence.
- **NEXT:** Only after that observation, consider a longer two-item physical A-to-B rehearsal.
- **LATER:** Measure aggregate-read load only if multiple simultaneous operator tabs become a real deployment requirement.
- **PARK:** Push transports, LOOP, Media Bin, Packaging Editor, Program Packs, and unrelated Mission Control changes.

## FILES MODIFIED

- `public/control-lab.js`
- `test/program-packager.test.js`
- `test/broadcast-control-lab-http.test.js`
- `docs/pass-reports/2026-08-25_1744_control-lab-auto-reconciliation.md`
- `docs/pass-reports/README.md`

## COMMIT STATUS

`NOT COMMITTED`
