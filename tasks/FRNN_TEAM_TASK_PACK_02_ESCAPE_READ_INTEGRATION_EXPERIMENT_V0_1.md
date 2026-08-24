# TASK PACK 02 — Single-`escape` Read-Integration Experiment v0.1

**Document type:** Implementation Task Packet
**Reality state:** DESIGNED — not proof of implementation
**Baseline:** `12ed271dd37110d661870eaca2b9ec0aafe51cdc`
**Required branch:** `main`
**Status:** Pending
**Created:** 2026-08-24

> This packet defines work requested from the stated baseline. Source code, runtime behavior, and behavioral tests remain authoritative for what is actually implemented.

## PRIMARY OBJECTIVE

Integrate the already-implemented node-assignment resolver into only the `escape` Functional scan path as a read-before-visit-mutation experiment.

The experiment must answer only this question:

> Can the current `escape` scan flow consult player-specific assignment state after current identity establishment but before its current visit mutation, so an assigned player receives an explicit assigned result while an unassigned player continues through the existing Escape fallback path?

Required assigned chain:

```text
POST /api/scan/escape
→ current code authority and identity establishment
→ resolveNodeAssignment for authenticated code + escape
→ active assigned_message
→ explicit assignment response
→ no Escape visit/progress/default mutation
```

Required fallback chain:

```text
POST /api/scan/escape
→ same current authority and identity establishment
→ resolveNodeAssignment for authenticated code + escape
→ no active assignment
→ fall through to the existing scan implementation
→ current Escape visit and response behavior
```

Do not integrate assignments into `attention`, `access`, or `sensory` and do not build player UI or assignment authoring.

## CURRENT REALITY AT BASELINE

### Implemented and tested prerequisite

- **IMPLEMENTED:** `migrations/004_node_assignments.sql`, the mirrored `node_assignments` bootstrap table, and `node-assignments.js`.
- **IMPLEMENTED:** `resolveNodeAssignment(client, { code, nodeKey, authoredDefault })` validates `nodeKey` against `STATIONS`, reads only `assigned_message` for the exact active player/node row, and returns `{ nodeKey, source, assignedMessage }`.
- **TESTED:** resolver player isolation, node isolation, missing/inactive fallback, read-only behavior, public projection, migration constraints, and disposable PostgreSQL behavior.
- **VALIDATED, narrowly:** the isolated persistence/resolver contract can distinguish two durable players at the same canonical Functional node while preserving fallback and public projection boundaries.
- **NOT IMPLEMENTED:** no route, UI, QR, or authoring surface calls or consumes the resolver.

### Exact current scan implementation

- `server.js` has one shared inline Functional handler, `app.post('/api/scan/:station', ...)`, beginning at baseline line 482.
- `normalizeStation(req.params.station)` accepts the four `STATIONS` values. `escape` is not otherwise distinguished in the handler.
- At baseline lines 485–486, `bodyCode` reads `req.body.accessCode`; `codeFromRequest(req)` selects the normalized player cookie first and then the normalized body code.
- At baseline lines 490–494, the transaction locks the selected `access_codes` row, applies the current status/body-code gate, and calls `ensurePlayerIdentity(client, code)`.
- `ensurePlayerIdentity` is current identity authority, not a read-only check. It may insert `players`, activate `access_codes`, establish `claimed_at`, and lock the player row. Those pre-existing identity mutations occur before the experiment's resolver boundary and must be reported rather than hidden.
- At baseline line 496, the normal path first queries for an existing player/station visit.
- At baseline lines 503–506, a new visit calculates stage, inserts `visits`, and updates `players.updated_at`.
- At baseline lines 509–530, the route loads content configuration, reads the complete player record, derives mission/video/answer state, and constructs the existing default response.
- At baseline lines 533–535, the route maps domain errors, refreshes the player cookie, and returns the transaction result.
- The exact read-integration boundary is after `ensurePlayerIdentity(client, code)` and before the existing visit query. The implementation must keep the resolver and branch within the existing transaction.

### Existing Escape fallback is composite

There is no one scalar current “Escape default message.” The existing Escape result is a composite response derived after visit handling from:

- `config.stations.escape` (`label: EGRESS`, `function: Escape`, `subtitle: Exit Conditions` in the default config),
- calculated stage and stage metadata,
- current visits and player state,
- loop/completion/wrong video configuration,
- answer prompt, choices, and answer state.

For the resolver's required scalar `authoredDefault` input, use the current authored public Escape subtitle from `getContentConfig(client)`:

```js
config.stations.escape?.subtitle || config.stations.escape?.label || ''
```

This value is only the resolver's bounded fallback projection. If `source === 'default'`, do not return it as a replacement response. Fall through to the current Escape code so the actual composite fallback remains unchanged.

The additional config lookup for Escape may occur before resolution. On the default branch, leave the existing downstream config load and response construction intact rather than refactoring or deduplicating the legacy path during this experiment.

### Current client limitation

`public/station.html` currently assumes every successful Functional scan response contains the full default response, including `data.player`, and then calls `renderStation`. A minimal assigned response is therefore an API/test contract only in this experiment. Do not modify the UI. Report that assigned scans are not yet player-presentable through the existing page.

### Baseline drift rule

Before implementation, compare current `HEAD` to packet baseline `12ed271dd37110d661870eaca2b9ec0aafe51cdc`. Stop and report material application drift. A later commit containing only this packet and its Director report is not material drift.

## REQUIRED CHANGES

### 1. Narrow resolver import

In `server.js`, import `resolveNodeAssignment` directly from `./node-assignments.js`.

Do not add resolver middleware, an all-station abstraction, a generic content resolver, or a second identity input.

### 2. Single Escape branch at the exact mutation boundary

Inside the existing `withTransaction` callback for `POST /api/scan/:station`, after the current `lockAccessCode`/status/`ensurePlayerIdentity` sequence and before the existing visit query:

1. Branch only when `station === 'escape'`.
2. Read current content configuration only to obtain the authored Escape subtitle/label fallback described above.
3. Call:

```js
resolveNodeAssignment(client, {
  code,
  nodeKey: 'escape',
  authoredDefault: config.stations.escape?.subtitle || config.stations.escape?.label || ''
})
```

4. If and only if `resolution.source === 'assignment'`, return the assigned response immediately from the transaction callback.
5. If `resolution.source === 'default'`, do not return, mutate, or reconstruct the default. Continue directly into the existing visit query and all existing downstream scan logic.

The assignment lookup must use `code`, the current route's cookie-first/body-fallback identity result. Do not read another request field for assignment identity and do not allow a caller to provide an independent assignment code.

### 3. Assigned response contract

Return exactly this bounded transaction result for the assigned branch:

```js
{
  mode: 'assignment',
  nodeKey: resolution.nodeKey,
  assignedMessage: resolution.assignedMessage
}
```

The existing outer route may continue to refresh the current player cookie and call `res.json(result)`.

Do not include a raw assignment row, `code`, assignment type, active state, timestamps, ownership/profile fields, audit data, another player's state, or any current default quest payload. Do not add this `mode` field to the default response during this pass.

### 4. Preserve the current fallback code

For missing or inactive Escape assignments, execute the existing code beginning with:

```js
SELECT station, stage, created_at FROM visits WHERE code=$1 AND station=$2
```

Do not copy this path into an `else`, helper, or new Escape implementation. Preserve its existing duplicate-visit behavior, stage calculation, visit insertion, player timestamp update, config/player reads, mission/video selection, answer projection, status codes, cookie handling, and response shape.

### 5. Do not touch other Functions

For `attention`, `access`, and `sensory`, do not call `resolveNodeAssignment`, do not perform the early Escape config read, and do not change visit query/mutation or response behavior.

The required station-specific condition is intentional experimental scope, not an architectural recommendation.

## REQUIRED BEHAVIORAL TESTS

Add a focused route-level or route-harness test file, preferably `test/escape-assignment-integration.test.js`. Tests must demonstrate mutation consequences, not only source placement.

Because `server.js` starts its listener on import and does not export its Express app, do not broadly refactor server startup merely for tests. Prefer the smallest of these evidence strategies:

1. an actual server subprocess against a randomly isolated disposable PostgreSQL schema and HTTP calls to the current endpoint; or
2. a narrow transaction/route harness plus source-order assertions, if the subprocess approach is environmentally disproportionate.

Do not introduce a general Functional scan service abstraction solely for testability. If neither route-level strategy can prove the behavior without broad restructuring, stop and report.

### Test 1 — assigned Escape bypasses visit/progress mutation

Given a valid current identity and an active `(Player A, escape, assigned_message, Message A, TRUE)` row:

- invoke the current Escape scan flow;
- assert the response is exactly assignment mode with `escape` and Message A;
- assert Player A's Escape visit count does not increase;
- assert no `players.updated_at` change from the normal visit branch;
- assert no video answer, profile, final reflection, or assignment row changes;
- report the current identity activation/ownership operations that occur before resolution.

### Test 2 — unassigned Escape preserves the current fallback

Given Player B with no Escape assignment:

- invoke the same Escape scan flow;
- assert the response retains the pre-existing default keys and values relevant to current Escape behavior;
- assert the normal Escape visit is inserted exactly once with the current stage rule;
- assert a repeat scan retains existing duplicate semantics rather than adding another visit.

This is the primary regression proof. Do not satisfy it with a newly authored approximation of the default response.

### Test 3 — inactive Escape assignment falls through

Given Player C with `is_active=FALSE` for Escape:

- assert the current default response is returned;
- assert the normal Escape visit behavior occurs;
- assert the inactive row remains unchanged.

### Test 4 — same route and node, different identity state

In one test or one coherent evidence trace:

```text
Player A + /api/scan/escape + active assignment
→ assignment mode + Message A + no Escape visit

Player B + /api/scan/escape + no assignment
→ current Escape response + one Escape visit
```

The route and node remain constant. The different persisted player/node assignment state must cause the branch difference.

### Test 5 — Attention, Access, and Sensory remain unchanged

Exercise at least one current scan for each other Functional node and prove:

- no node-assignment query occurs;
- each node retains the existing visit mutation and response shape;
- an assignment row for that same node is ignored during this experiment.

Do not integrate those nodes to make the test symmetric.

### Test 6 — assigned resolver branch is read-only after identity establishment

Snapshot or count, before and after the assigned Escape scan:

- `node_assignments`, including `is_active` and `updated_at`;
- `visits`;
- `video_answers`;
- `player_profiles`;
- `final_reflections`.

No row in those domains may change. Separately record any pre-existing `players` or `access_codes` mutation performed by `ensurePlayerIdentity`; do not misreport the whole request as read-only if current identity establishment changed those rows.

### Required source-boundary assertions

- `server.js` imports `resolveNodeAssignment` from `node-assignments.js`.
- The resolver call is inside the literal `station === 'escape'` branch.
- The Escape resolver call occurs after `ensurePlayerIdentity(client, code)` and before the first visit query/insertion.
- No resolver call occurs in the `attention`, `access`, or `sensory` path.
- The assigned response is deliberately constructed from allowed fields rather than spreading the resolver or database result.
- `public/station.html`, QR routing, QuickStart, Start/End, response/final endpoints, and Mission Control are unchanged.

Update the existing `test/node-assignments.test.js` integration-boundary assertion that currently requires `server.js` not to import the resolver. Replace it with the new narrow Escape-only boundary expectation; do not weaken the remaining resolver/privacy tests.

## AUTHORITY AND MUTATION INVARIANTS

- Preserve `codeFromRequest`: cookie code first, body code second.
- Preserve the current `bodyCode`-conditioned access-status behavior, even if it is provisional or surprising.
- Preserve `lockAccessCode` and `ensurePlayerIdentity` ordering and behavior.
- Assignment lookup uses only the resulting `code` already selected by the route.
- Do not implement cookie-only scans, profile gating, owned-only recovery, or name-first enrollment.
- Assigned Escape skips only the normal visit/progress/default branch after identity establishment.
- Missing/inactive Escape assignment creates no assignment state and executes the existing default branch.
- Preserve ESCAPE, ATTENTION, ACCESS, and SENSORY names and current authored meanings.
- Do not claim deeper ESCAPE Function semantics because the route can return an assignment.

## OUT OF SCOPE

- Assignment integration into Attention, Access, or Sensory
- Generic Functional resolver middleware or all-station refactoring
- Assignment mutation helpers, CRUD API, or Mission Control authoring
- Player-facing assigned-message rendering or visual design
- Personal node or five-node QR conversion
- QR changes or regeneration
- Start/End removal or behavior changes
- QuickStart, recovery, profile-gating, cookie-authority, or final-reflection changes
- Scheduling, expiration, cohorts, segmentation, targeting rules, campaigns, or generalized content engines
- Production migration, deployment, printed QR work, device testing, or field testing
- Unrelated refactors or documentation expansion

## STOP CONDITIONS

Stop and report without widening scope if:

1. Current `HEAD` contains material application drift from the pinned baseline.
2. Migration `004`, `node-assignments.js`, or their tests are absent or failing.
3. The resolver cannot run after current identity establishment and before the visit query without broad Functional-route restructuring.
4. Assignment lookup would need a second identity source independent of current `code`.
5. Avoiding assigned Escape visit/progress mutation requires rewriting unrelated gameplay logic.
6. Preserving unassigned Escape behavior requires duplicating substantial route logic.
7. Attention, Access, or Sensory must be modified to make Escape work.
8. The response would need raw/private assignment data.
9. A route-level or credible route-harness behavioral proof requires broad server-startup or architecture refactoring.
10. Task Pack 01 ownership/recovery invariants appear broken.
11. Unrelated working-tree changes cannot be isolated.
12. Production or deployment mutation would be required to prove the experiment.

## ACCEPTANCE CRITERIA

The implementation pass succeeds only if:

1. Only `escape` consults `resolveNodeAssignment`.
2. Resolution runs after current identity establishment and before the first visit query/mutation.
3. Active Escape assignment returns exactly the bounded assignment-mode response.
4. Assigned Escape inserts no visit and executes no normal Escape progress/default mutation.
5. Missing Escape assignment follows the existing Escape code path and response unchanged.
6. Inactive Escape assignment follows the same existing fallback and remains inactive.
7. Attention, Access, and Sensory do not query assignments and preserve current visit/response behavior.
8. Same Escape endpoint plus different durable players takes different branches because of persisted assignment state.
9. No raw/private assignment data reaches the response.
10. Current authorization semantics and their pre-resolver identity mutations remain unchanged and are accurately reported.
11. Existing resolver tests remain green after replacing the obsolete no-server-import assertion.
12. Existing Functional scan and durable identity tests remain green.
13. New route-level or route-harness behavioral tests prove visit-count and state consequences.
14. Full regression tests pass, including disposable PostgreSQL where required.
15. No UI, QR, Mission Control, QuickStart, Start/End, Personal, production, or deployment work occurs.
16. The implementation report distinguishes the working API experiment from the currently incompatible player UI.
17. The broader Task Pack 02 is not called complete and all-Function assignment awareness is not claimed.

## REQUIRED TEST COMMANDS

Run and report at minimum:

```text
node --test test/node-assignments.test.js
node --test test/station-video-state.test.js test/video-answers-identity.test.js test/durable-player-identity.test.js
node --test test/escape-assignment-integration.test.js
npm test
```

Run the focused integration and full suite with `TEST_DATABASE_URL` against disposable isolated PostgreSQL schemas when required by the chosen route-level strategy. Never use production data or a production connection.

Separate:

- structural evidence for import/branch/source ordering;
- resolver-unit evidence;
- route or route-harness state-transition evidence;
- PostgreSQL evidence;
- full regression evidence.

## REQUIRED CAUSAL PROOF

The implementation report must show concrete persisted state and traces:

```text
Player A
→ current route authenticates/establishes AAA111
→ node_assignments has (AAA111, escape, assigned_message, Message A, TRUE)
→ Escape resolver returns assignment
→ { mode: assignment, nodeKey: escape, assignedMessage: Message A }
→ Escape visit count unchanged
→ normal player progress/default queries and mutations skipped
```

```text
Player B
→ current route authenticates/establishes BBB222
→ no active (BBB222, escape) assignment
→ Escape resolver returns default
→ existing visit/stage/config/player path executes
→ existing Escape response returned
→ Escape visit count increases once
```

State clearly that the player identity and persisted assignment row cause the branch difference while the endpoint, node, and reusable resolver rule remain constant.

## REQUIRED IMPLEMENTATION REPORT

Create the repository-mandated standalone report under `docs/pass-reports/` and include:

### WHAT IS REAL

- exact import, branch, resolver call, response, and visit-mutation boundary;
- exact current identity source and pre-resolver identity mutations;
- exact assigned and fallback behavior;
- exact nodes that remain assignment-unaware.

### WHAT IS MISSING

- player UI rendering, authoring, other Function integration, production/deployment, and broader Task Pack 02 work.

### WHAT IS PROVISIONAL

- Escape-only branch, scalar subtitle/label resolver fallback, API-only assignment response, body-code authority, and any route harness.

### WHAT WORKS

- only behavior actually demonstrated by executed tests.

### WHAT IS UNCERTAIN

- UI/mobile usefulness, authoring lifecycle, other Function applicability, concurrent real-device scans, production migration/deployment, and field behavior.

### TEST EVIDENCE

- exact commands, pass/fail/skip results, database environment, and causal consequences.

### CAUSAL PROOF

- the two player traces above with before/after row counts and response projections.

### NEXT EXPERIMENT

- recommend the smallest next experiment after reviewing evidence; do not begin it.

Use **DESIGNED**, **IMPLEMENTED**, **TESTED**, **VALIDATED**, and **UNVERIFIED** precisely. Do not call Task Pack 02 complete, all Functions assignment-aware, or player-specific QR behavior validated.

## COMMIT / DEPLOYMENT BOUNDARY

This packet does not itself authorize a commit, push, deployment, production migration, QR regeneration/printing, UI follow-on, or the next experiment. If later commit instructions are supplied, include implementation, tests, mandatory pass report, and report-index update together using `INCLUDED IN THIS COMMIT`.
