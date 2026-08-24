# 1. PASS

- Pass/task name: Single-`escape` read-integration experiment
- Objective: Integrate the existing node-assignment resolver only into the Escape scan path after current identity establishment and before normal visit mutation, proving assigned no-visit behavior and unchanged fallback behavior through the real HTTP endpoint.
- Branch: `main`
- Execution baseline: `ae9cce818882864598c769eb7ea70706e441374a`
- Packet baseline: `12ed271dd37110d661870eaca2b9ec0aafe51cdc`
- Baseline reconciliation: execution baseline added only the committed Task Pack, Director report, and report-index entry; application source matched the packet assumptions.

# 2. CURRENT REALITY BEFORE PASS

- **IMPLEMENTED and TESTED:** typed migration `004`, `node_assignments`, and `resolveNodeAssignment` existed and passed the pre-pass focused resolver suite.
- **VALIDATED, narrowly:** the isolated resolver contract could distinguish two players at one canonical Functional node with missing/inactive fallback and a deliberate public projection.
- **IMPLEMENTED:** `POST /api/scan/:station` was one shared inline Functional route. It normalized the station, selected cookie-first/body-fallback `code`, locked `access_codes`, applied the current body-code/status gate, and called `ensurePlayerIdentity` before querying visits.
- **IMPLEMENTED:** `ensurePlayerIdentity` could insert/converge `players`, activate `access_codes`, establish ownership, and lock the player row.
- **IMPLEMENTED:** the normal scan path queried or inserted `visits`, updated `players.updated_at` for a new visit, loaded configuration/player state, and returned the current composite station response.
- **NOT IMPLEMENTED:** no route imported or called the resolver; Escape assignments had no route consequence.
- **UNVERIFIED:** API route integration, assigned visit suppression, inactive/unassigned fallthrough, other-Function isolation, player UI, devices, deployment, production, and field behavior.

# 3. WHAT CHANGED

- `server.js` now imports `resolveNodeAssignment` directly.
- Inside the existing scan transaction, immediately after `ensurePlayerIdentity(client, code)` and before the first visit query, a literal `station === 'escape'` branch loads current authored Escape configuration and resolves `(code, escape)`.
- Active assignment returns exactly `{ mode: 'assignment', nodeKey, assignedMessage }` from the transaction callback.
- Missing or inactive assignment does not return; it falls through into the pre-existing visit/stage/config/player/response code.
- Attention, Access, and Sensory never enter the branch and remain assignment-unaware even when assignment rows exist for them.
- Updated the resolver boundary test that formerly required no server integration.
- Added an actual HTTP endpoint integration test. It starts `server.js` as a child process against a randomly named disposable PostgreSQL schema, invokes `/api/scan/:station`, verifies responses and persisted state, stops the child, and drops the schema.
- No schema, migration, resolver contract, UI, QR, Mission Control, QuickStart, Start/End, final-reflection, production, or deployment behavior changed.

# 4. WHAT IS REAL NOW

## Route boundary

- **IMPLEMENTED:** only Escape invokes `resolveNodeAssignment`.
- **IMPLEMENTED:** resolution occurs after current `lockAccessCode`/status/`ensurePlayerIdentity` behavior and before `SELECT ... FROM visits` and `INSERT INTO visits`.
- **IMPLEMENTED:** lookup uses the same `code` already established by the route; there is no separate assignment identity input.
- **IMPLEMENTED:** the authored fallback input is `escapeConfig.stations.escape.subtitle`, then label, then an empty string. Default resolution falls through and does not replace the actual composite Escape response.
- **IMPLEMENTED:** the assigned response deliberately constructs only `mode`, `nodeKey`, and `assignedMessage`; no raw row or private assignment metadata is spread into it.

## Behavioral result

- **TESTED:** active assigned Escape returns assignment mode and does not insert an Escape visit or update normal visit-progress state.
- **TESTED:** unassigned Escape returns the existing station response, inserts one stage-1 Escape visit, and a repeat scan reuses it with `duplicate: true`.
- **TESTED:** inactive Escape assignment remains unchanged and follows the existing default visit/response path.
- **TESTED:** Attention, Access, and Sensory ignore active assignment rows during this experiment and retain their normal sequential visit behavior and default response shape.
- **TESTED:** after an assigned scan, assignment count/state/timestamp, visits, video answers, player profile, final reflections, and `players.updated_at` remain unchanged in the seeded-existing-identity case.
- **VALIDATED, narrowly:** the real Escape HTTP endpoint can consult persisted assignment state before visit mutation and take different branches for different durable players while preserving the current unassigned fallback and leaving other Functions assignment-unaware.
- Player-specific QR behavior is not validated: the URL is shared and unchanged, but the existing player UI cannot render the new assigned response.

# 5. WHAT IS STILL MISSING

- `public/station.html` does not recognize `mode: 'assignment'`; it expects `data.player` and the full default station payload. In a real browser, an assigned response is not yet player-presentable and is likely to enter the page's retry path.
- No assignment set/edit/clear API or Mission Control authoring surface exists.
- Attention, Access, and Sensory remain intentionally assignment-unaware.
- No cookie-only authority, profile gate, Personal node, five-QR conversion, QuickStart redesign, recovery redesign, or Start/End change was made.
- No mobile/device, deployed, production-database, printed-QR, concurrency/load, or field behavior was tested.
- Broader Task Pack 02 remains incomplete.

# 6. WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

- The literal Escape-only branch is an experiment, not a generalized Functional-node architecture.
- The subtitle/label fallback supplied to the resolver is provisional; the actual default remains the current composite route response.
- The assigned response is an API/test projection with no current player-facing renderer.
- The integration test's child-process `ADMIN_KEY` is test-only startup configuration and does not exercise admin behavior.
- Current body-code authority and pre-resolver identity establishment are preserved provisional behavior, not endorsed redesign.

# 7. TESTING PERFORMED

## Pre-implementation regression checks

- `node --test test/node-assignments.test.js`
- `node --test test/station-video-state.test.js test/video-answers-identity.test.js test/durable-player-identity.test.js`

## Structural checks after implementation

- `git diff --check`
- Source-order assertions for import, current identity establishment, literal Escape branch, resolver call, visit query/insertion, bounded response construction, and absence of UI/QuickStart/QR integration.
- Updated resolver boundary assertions preserving six QR destinations and unchanged station UI.

## Behavioral checks without PostgreSQL

- `node --test test/node-assignments.test.js test/escape-assignment-integration.test.js`
- `node --test test/station-video-state.test.js test/video-answers-identity.test.js test/durable-player-identity.test.js`

## Behavioral checks with disposable PostgreSQL

- Started the repository-local database with `docker compose up -d db`.
- Used `TEST_DATABASE_URL=postgres://artpark:artpark@localhost:5432/artpark` only as a local test server. Each integration test created and dropped a randomly named isolated schema.
- `TEST_DATABASE_URL=... node --test test/escape-assignment-integration.test.js`
- `TEST_DATABASE_URL=... node --test test/node-assignments.test.js test/escape-assignment-integration.test.js test/station-video-state.test.js test/video-answers-identity.test.js test/durable-player-identity.test.js`
- `TEST_DATABASE_URL=... npm test`
- Stopped the local database with `docker compose stop db`.

# 8. TEST RESULTS

- Pre-pass resolver suite: 8 passed, 0 failed, 1 optional PostgreSQL case skipped.
- Pre-pass Functional/durable set: 63 passed, 0 failed, 1 optional PostgreSQL case skipped.
- Initial post-change non-PostgreSQL resolver/integration set: 9 passed, 0 failed, 2 optional PostgreSQL cases skipped.
- Post-change non-PostgreSQL Functional/durable set: 63 passed, 0 failed, 1 optional PostgreSQL case skipped.
- First PostgreSQL route-test attempt: 1 passed, 1 failed before server readiness because the child harness omitted the repository-required `ADMIN_KEY`. No route assertion ran and no production defect was found. Added a bounded test-only key to the child environment.
- Re-run focused real-route test: 2 passed, 0 failed, 0 skipped.
- PostgreSQL-backed targeted set: 75 passed, 0 failed, 0 skipped.
- Full PostgreSQL-backed suite: 227 passed, 0 failed, 0 skipped.
- No production database, deployment, external service, printed QR, or field device was mutated.

## Causal proof

Player A persisted state:

```text
(AAA111, escape, assigned_message, Message A, TRUE)
visits(AAA111, escape) = 0
```

Observed route trace:

```text
POST /api/scan/escape with current body-code authority
→ code AAA111 locked and existing identity converged
→ active Escape assignment selected
→ { mode: assignment, nodeKey: escape, assignedMessage: Message A }
→ Escape visit count remains 0
→ assignment/profile/answer/final/player-updated state unchanged
```

Player B persisted state:

```text
no active (BBB222, escape) assignment
visits(BBB222, escape) = 0
```

Observed route trace:

```text
POST /api/scan/escape through the same endpoint and authority
→ default resolution
→ existing visit/stage/config/player path
→ current Escape response with stage 1 and duplicate false
→ visits(BBB222, escape) = 1
→ repeat scan returns duplicate true and count remains 1
```

The persisted player/node assignment row causes the branch difference. Endpoint, canonical node, identity mechanism, and resolver rule remain constant.

# 9. IMPORTANT UNCERTAINTIES

- Whether the assignment projection is understandable and useful on a real mobile screen; no renderer exists.
- Whether an authenticated mutation contract should clear by `is_active=FALSE` or another lifecycle rule.
- Whether the same integration rule should apply to the other three Functions.
- Whether preserving current body-code authority and mutating `ensurePlayerIdentity` before assignment resolution is appropriate long term.
- Whether the extra pre-resolution content-config read has meaningful performance or concurrent-config implications under field load.
- Real cookie-authorized multi-device scans, production migration/deployment, printed QR behavior, concurrency/load, and field usability remain unverified.

# 10. RECOMMENDED NEXT EXPERIMENT

- **NOW:** Current claim: Escape assignment routing works at the API boundary → biggest uncertainty: whether the bounded response is usable by a player → minimum experiment: add a strictly assigned-mode renderer to the existing station page for Escape without adding authoring or other-Function integration → observable result: an assigned player sees Message A on mobile while an unassigned player sees the unchanged Escape experience.
- Do not begin that experiment automatically.
- **NEXT:** evaluate a bounded authenticated assignment set/clear contract after presentation behavior is reviewed.
- **LATER:** decide whether Attention, Access, and Sensory should share the integration rule; evaluate production migration/deployment and field devices.
- **PARK:** five-node QR conversion, identity redesign, scheduling, segmentation, campaigns, and generalized content systems.

# 11. FILES MODIFIED

- `server.js`
- `test/node-assignments.test.js`
- `test/escape-assignment-integration.test.js`
- `docs/pass-reports/2026-08-24_1212_escape-read-integration.md`
- `docs/pass-reports/README.md`

# 12. COMMIT STATUS

`INCLUDED IN THIS COMMIT`
