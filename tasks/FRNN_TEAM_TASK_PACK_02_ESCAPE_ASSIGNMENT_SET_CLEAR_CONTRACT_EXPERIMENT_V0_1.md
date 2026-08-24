# TASK PACK 02 — Escape Assignment Set/Clear Contract Experiment v0.1

**Document type:** Implementation Task Packet
**Reality state:** DESIGNED — not proof of implementation
**Baseline:** `a38d05ffda4a95ba2eb7112ec011ad586e45b09f`
**Required branch:** `main`
**Status:** Pending
**Created:** 2026-08-24

> This packet defines work requested from the stated baseline. Current source, runtime behavior, and behavioral tests remain authoritative for what is actually implemented.

## PRIMARY OBJECTIVE

Implement the smallest authenticated server-side SET/CLEAR contract for one existing durable player's `assigned_message` on the `escape` node.

The experiment must answer only this question:

> Can an authorized operator create, replace, clear, and re-set one existing durable player's Escape assignment without direct SQL, while deterministically changing that player's next real Escape behavior and leaving all other player state and Functions unchanged?

Required SET chain:

```text
current privileged request
→ normalize and validate players.code
→ validate assigned message
→ upsert one active (code, escape) assigned_message
→ durable audit record
→ next Escape scan returns assignment mode/message
→ normal Escape visit remains suppressed
```

Required CLEAR chain:

```text
current privileged request
→ normalize and validate players.code
→ deactivate only (code, escape)
→ durable audit record
→ next Escape scan falls through
→ current normal Escape response and visit resume
```

Do not implement Mission Control UI or general assignment management.

## CURRENT REALITY AT BASELINE

### Baseline and working tree

- `main`, local `HEAD`, and `origin/main` are synchronized at `a38d05ffda4a95ba2eb7112ec011ad586e45b09f`.
- The working tree was clean during the Director inspection.
- Before implementation, compare `HEAD` with this baseline. A later commit containing only this packet and its Director report is not material application drift. Stop on other material drift affecting the surfaces below.

### Current privilege boundary

- **IMPLEMENTED:** `server.js` requires non-empty `ADMIN_KEY` at startup.
- **IMPLEMENTED:** `requireAdmin(req, res, next)` accepts either:
  - an exact `Authorization: Bearer <ADMIN_KEY>` comparison and sets `req.missionOperator = 'SYSTEM'`; or
  - a valid, unexpired `MISSION_COOKIE` session from `mission_control_sessions` and sets `req.missionOperator` to its stored operator.
- Missing or invalid privilege returns HTTP `401` with `{ error: 'MISSION_CONTROL_ACCESS_REQUIRED' }` after the cookie path is evaluated. Mission Control login itself may return other existing login errors; do not change them.
- Existing `/api/admin/*` endpoints attach `requireAdmin` directly to each route.
- This shared key/session boundary is provisional current reality, not a validated production authorization architecture. Reuse it exactly; do not add roles, accounts, OAuth, or a new session design.

### Durable player identity

- `normalizeAccessCode(value)` in `lib.js` strips non-alphanumerics, uppercases, and accepts exactly six characters.
- `formatAccessCode(value)` returns the current `AAA-111` public/admin presentation.
- `players.code` is the durable player identity and is a foreign key to `access_codes(code)`.
- `ensurePlayerIdentity(client, code)` is intentionally mutating: it inserts a player and activates/claims an access code. It must **not** be used by this contract.
- Existing admin endpoints sometimes test `access_codes`; that is insufficient here. This packet requires an existing row in `players` because the requested target is an existing durable player, not merely an inventory credential.
- Use a read/lock such as `SELECT code FROM players WHERE code=$1 FOR UPDATE` inside the mutation transaction. Unknown or syntactically invalid targets must not create a player, activate or claim an access code, or change ownership.

### Assignment persistence and resolver

- `schema.sql` and `migrations/004_node_assignments.sql` define `node_assignments` with primary key `(code, node_key)`.
- `node_key` is constrained to `escape`, `attention`, `access`, or `sensory`; `assignment_type` is constrained to exactly `assigned_message`.
- `assigned_message` must have trimmed length `1..1000`; `is_active` defaults true; `created_at` and `updated_at` exist.
- `resolveNodeAssignment(client, ...)` in `node-assignments.js` reads only active `assigned_message` rows for the requested canonical node and otherwise returns the authored default. It performs no mutation.
- **DESIGNED lifecycle rule for this experiment:** CLEAR deactivates the existing Escape row with `is_active=FALSE`; it does not delete it. This preserves inspectability and exercises existing resolver behavior. It is not a validated long-term product lifecycle.

### Existing Escape consequence

- **IMPLEMENTED and TESTED:** `POST /api/scan/:station` establishes current identity, then only for `station === 'escape'` calls `resolveNodeAssignment` before any visit read/insert.
- An active assignment returns exactly `{ mode: 'assignment', nodeKey: 'escape', assignedMessage }` and suppresses the normal Escape visit.
- A missing/inactive assignment falls through to the existing composite station response and visit behavior.
- Attention, Access, and Sensory do not invoke the resolver.
- **IMPLEMENTED and TESTED at script/fake-DOM level:** `public/station.html` recognizes the bounded Escape assignment response, validates it, renders the message via `textContent`, and bypasses normal player/progress/puzzle/media rendering.
- Do not change the resolver, Escape branch order, response projection, renderer, or normal fallback in this pass.

### Existing transaction, response, and audit conventions

- `withTransaction(fn)` in `db.js` provides one PostgreSQL `BEGIN`/`COMMIT` transaction with rollback on exceptions.
- Existing admin mutation routes use normalized route parameters, bounded JSON errors, `withTransaction`, and `req.missionOperator`.
- Existing administrative player routes use `/api/admin/player/:accessCode/...`; this packet extends that player-specific shape.
- `audit(client, action, code, operator, detail)` inserts into `mission_control_audit` in the same transaction. The table records action, target code, normalized operator, JSON detail, and `created_at`.
- Durable audit infrastructure therefore exists and must be reused. Console logging is not audit evidence.

### Existing tests and harnesses

- `test/mission-control.test.js` covers privilege/session helpers and structural admin-route boundaries.
- `test/durable-player-identity.test.js` covers durable identity, audit, reset, and release behavior, including PostgreSQL evidence.
- `test/node-assignments.test.js` covers schema constraints and resolver behavior, including disposable PostgreSQL when `TEST_DATABASE_URL` is set.
- `test/escape-assignment-integration.test.js` starts the real server against an isolated PostgreSQL schema and proves assigned/fallback Escape route consequences.
- `test/escape-assignment-renderer.test.js` provides the script/fake-DOM renderer proof.
- Reuse the isolated-schema, spawned-server, health-wait, and cleanup pattern. Do not add a new HTTP or database test framework.

## EXACT CONTRACT

### Routes

Add exactly these two routes in `server.js`, alongside the existing player-specific admin routes:

```text
PUT    /api/admin/player/:accessCode/escape-assignment
DELETE /api/admin/player/:accessCode/escape-assignment
```

Both routes must attach the existing `requireAdmin` middleware.

Why this shape:

- `/api/admin/player/:accessCode/...` matches current player-specific admin routing.
- `PUT` expresses replacement/upsert of one fixed resource and supports SET and re-SET through one contract.
- `DELETE` is the administrative CLEAR verb, while the internal bounded lifecycle remains deactivation rather than row deletion.
- The literal suffix fixes the node to Escape. No node or assignment-type parameter is accepted.

Do not add aliases, generic routes, query-selected nodes, or UI calls.

### SET request and response

Request body:

```js
{ assignedMessage: 'Message A' }
```

No other field has meaning. Validate `assignedMessage` before persistence:

- it must be a string;
- trim it once for canonical persistence and response;
- trimmed length must be from 1 through 1000 characters inclusive.

Return HTTP `400` and exactly:

```js
{ error: 'INVALID_ASSIGNMENT_MESSAGE' }
```

for a missing, wrong-type, blank, whitespace-only, or over-limit message. Invalid input must not change assignment or audit state.

For an authorized valid request:

1. normalize `req.params.accessCode` with `normalizeAccessCode`;
2. in one `withTransaction`, lock/check `players.code` directly;
3. return the bounded unknown-player result below if no durable player exists;
4. upsert exactly one fixed Escape assignment;
5. force `assignment_type='assigned_message'` and `is_active=TRUE` on both insert and conflict update;
6. persist the trimmed message;
7. preserve `created_at` on update and set `updated_at=NOW()` on conflict update;
8. write the audit row in the same transaction;
9. return HTTP `200` with exactly the public-safe administrative projection:

```js
{
  accessCode: 'AAA-111',
  nodeKey: 'escape',
  active: true,
  assignedMessage: 'Message A'
}
```

Use PostgreSQL's existing uniqueness directly. A bounded form is:

```sql
INSERT INTO node_assignments(
  code,node_key,assignment_type,assigned_message,is_active
) VALUES($1,'escape','assigned_message',$2,TRUE)
ON CONFLICT (code,node_key) DO UPDATE SET
  assignment_type='assigned_message',
  assigned_message=EXCLUDED.assigned_message,
  is_active=TRUE,
  updated_at=NOW()
RETURNING assigned_message,is_active
```

Equivalent parameterized SQL is acceptable only if it preserves these exact invariants. Do not accept node/type from request data.

### CLEAR response and idempotence

CLEAR is idempotent for a known durable player:

- active Escape row: set `is_active=FALSE` and `updated_at=NOW()`;
- already inactive Escape row: success/no-op; do not rewrite its timestamp;
- absent Escape row: success/no-op; do not create a tombstone row.

Use an update bounded by `code`, literal `node_key='escape'`, literal `assignment_type='assigned_message'`, and `is_active=TRUE`. Capture whether a row changed for audit detail, but do not expose that internal distinction in the response.

Return HTTP `200` for every known-player CLEAR:

```js
{
  accessCode: 'AAA-111',
  nodeKey: 'escape',
  active: false
}
```

Do not return the old message, raw row, timestamps, audit record, or unrelated player data.

This idempotent rule is **DESIGNED** for the experiment. It prevents harmless retries from becoming client errors while keeping unknown players distinguishable.

### Unknown or invalid player

For either route, if the normalized parameter is empty or no `players` row exists, return HTTP `404` with exactly:

```js
{ error: 'PLAYER_NOT_FOUND' }
```

This matches current admin player lookup semantics. It must not call `ensurePlayerIdentity`, insert `players`, update `access_codes`, claim ownership, activate a credential, or create an assignment/audit row.

### Authorization errors

Leave `requireAdmin` authoritative. An unauthenticated request must receive its current HTTP `401` / `MISSION_CONTROL_ACCESS_REQUIRED` response before validation or mutation logic runs. Do not reveal whether the player or assignment exists.

### Audit contract

Reuse `audit(...)` inside the same transaction as each successful authorized operation:

- SET action: `ESCAPE_ASSIGNMENT_SET`
- CLEAR action: `ESCAPE_ASSIGNMENT_CLEARED`
- target `code`: normalized six-character `players.code`
- operator: `req.missionOperator`
- detail for SET: `{ nodeKey: 'escape' }`
- detail for CLEAR: `{ nodeKey: 'escape', changed: <boolean> }`

Do not put assignment message text, credentials, cookies, bearer values, profile data, or other-player data into audit detail. An idempotent CLEAR for a known player is still a successfully handled privileged action and must have one audit row with `changed:false`.

Invalid messages, unknown players, and unauthorized calls must not create a success audit row.

## REQUIRED IMPLEMENTATION BOUNDARY

### Validation helper

Add one small pure validation helper in `node-assignments.js`, exported for focused unit testing, such as:

```js
export function normalizeAssignedMessage(value) {
  if (typeof value !== 'string') return null;
  const message = value.trim();
  return message.length >= 1 && message.length <= 1000 ? message : null;
}
```

Use it from the SET route. The exact name may differ, but do not duplicate divergent message limits in server code. This helper is validation only; do not create a generic assignment service or payload model.

### Mutation placement

Implement both route handlers in `server.js` near current `/api/admin/player/:accessCode` routes. Keep persistence inside `withTransaction` and reuse `audit`, `normalizeAccessCode`, and `formatAccessCode`.

Do not modify schema or migration `004`; the required lifecycle, foreign key, message check, and uniqueness already exist.

### State that must not change

SET and CLEAR must not insert, update, or delete:

- `access_codes` or its status, allocation, activation, claim, test, or ownership fields;
- `players` or its timestamps;
- `visits`;
- `video_answers`;
- `player_profiles` or profile history;
- `final_reflections`;
- `quick_start_claims`;
- `prize_draws`;
- assignment rows for another player or another node.

Only the intended `node_assignments(code,'escape')` row and the corresponding `mission_control_audit` row may change.

## REQUIRED CAUSAL BEHAVIORAL TESTS

Create `test/escape-assignment-mutation.test.js` and exercise the real Express server against a disposable isolated PostgreSQL schema using the existing `TEST_DATABASE_URL` convention. Use `Authorization: Bearer <test ADMIN_KEY>` for the primary contract tests so no Mission Control UI or login workflow is involved. Existing `requireAdmin` tests remain responsible for session mechanics.

The integration suite must snapshot relevant state before each mutation chain and prove consequences through both database reads and the real Escape HTTP endpoint.

### Test A — unauthorized SET and CLEAR denied

Without valid current admin privilege:

- SET and CLEAR return `401` / `MISSION_CONTROL_ACCESS_REQUIRED`;
- no assignment or audit row is created or changed;
- the response does not reveal target existence.

### Test B — authorized SET causes assigned Escape behavior

Given existing durable Player A with no Escape assignment:

- authorized SET of `"Message A"` returns the exact bounded response;
- exactly one `(Player A, escape)` row exists;
- type is `assigned_message`, message is trimmed `Message A`, and active is true;
- one `ESCAPE_ASSIGNMENT_SET` audit row records Player A, `SYSTEM`, and Escape without message content;
- a subsequent real `POST /api/scan/escape` for Player A returns assignment mode and `Message A`;
- no normal Escape visit is inserted.

### Test C — SET updates without duplication

SET Player A to `Message B`:

- row count for `(Player A, escape)` remains one;
- `created_at` is preserved;
- `updated_at` advances intentionally;
- message becomes `Message B` and active remains true;
- the next real Escape scan returns `Message B`;
- no normal Escape visit exists.

Avoid flaky timestamp assertions: control or wait only if necessary, or compare after explicitly setting the row's prior timestamp to a known older value inside disposable test setup.

### Test D — CLEAR restores normal Escape fallback

After active SET:

- authorized CLEAR returns the exact bounded inactive projection;
- the same row remains present and becomes inactive;
- `updated_at` advances;
- one `ESCAPE_ASSIGNMENT_CLEARED` audit row records `changed:true`;
- the next real Escape scan does not return assignment mode, follows the existing composite Escape path, and inserts the normal Escape visit;
- no progress, answer, profile, final, ownership, or activation state is erased.

### Test E — idempotent CLEAR

For a known player with an already inactive row, and separately for a known player with no Escape row:

- CLEAR returns `200` with the same inactive projection;
- inactive timestamp remains unchanged;
- absent state remains absent;
- one audit row per successful privileged request records `changed:false`;
- no assignment row is created by CLEAR.

### Test F — SET after CLEAR reuses the row

After clearing Player A, SET `Message C`:

- the same primary-key row becomes active;
- message becomes `Message C`;
- exactly one `(Player A, escape)` row exists;
- the next real Escape scan returns `Message C`;
- the earlier normal visit is not erased or rewritten by SET.

The scan may now be assignment mode despite that retained prior visit; do not invent visit cleanup semantics.

### Test G — unknown and invalid player rejected without identity mutation

For a syntactically valid access code with an `access_codes` row but no `players` row, and for an invalid route parameter:

- SET and CLEAR return `404` / `PLAYER_NOT_FOUND`;
- no `players` row is created;
- access status, allocation, activation, claim, and test fields remain unchanged;
- no assignment or success-audit row is created.

This is the proof that the contract does not turn credential inventory into durable players.

### Test H — invalid messages are atomic

Exercise at least:

- missing field;
- `null`, number, object, and array where reachable through JSON;
- empty string;
- whitespace-only string;
- 1001-character string after trimming.

Also prove a 1000-character string is accepted. For every invalid case:

- return `400` / `INVALID_ASSIGNMENT_MESSAGE`;
- preserve any prior assignment exactly;
- create no audit row.

### Test I — other-player isolation

Given Player A and Player B with distinct Escape assignments:

- SET/CLEAR Player A;
- Player B row and next Escape response remain unchanged;
- neither response exposes Player B information.

### Test J — other Functions unchanged

Given assignment rows for Player A at Attention, Access, and Sensory:

- SET/CLEAR through the contract touches only the Escape row;
- the other three rows remain byte-for-byte equivalent in relevant fields;
- real scans of Attention, Access, and Sensory continue their existing normal route behavior;
- no route accepts a node/type override from body or query data.

### Test K — progress, history, and ownership preservation

Seed Player A with visits, a video answer, profile/history, final reflection, quick-start ownership where practical, and current access/player state. Snapshot relevant rows, perform SET and CLEAR, then prove all non-assignment gameplay/identity state remains unchanged. Account separately for the intended audit additions.

### Test L — uniqueness under bounded repeated SET

Issue two valid SET requests for the same Player A/Escape resource (sequentially at minimum; concurrently if the existing integration harness can do so without flakiness). Prove PostgreSQL leaves exactly one `(code,node_key)` row and the result is one of the complete submitted messages, never a duplicate or partial value.

Do not build generalized optimistic locking or versioning for this experiment.

## REQUIRED STRUCTURAL AND UNIT ASSERTIONS

Extend focused tests to prove:

- both exact routes use `requireAdmin`;
- the route suffix, SQL, and response fix `nodeKey` to `escape`;
- no request-controlled node or assignment type is used;
- player existence is checked through `players`, not `ensurePlayerIdentity` or an access-code activation path;
- SET uses `(code,node_key)` conflict handling and updates `updated_at`;
- CLEAR updates `is_active=FALSE` and does not `DELETE` the assignment row;
- both successful operations call durable `audit` inside their transaction;
- assigned-message validation has the same 1..1000 trimmed boundary as schema;
- no Mission Control DOM or client request is added;
- resolver, Escape scan ordering, renderer, schema, migration `004`, Attention, Access, Sensory, QuickStart, Start/End, recovery, reset, release, QR, and player UI remain unchanged.

Structural assertions supplement but do not replace the real server/database causal tests.

## REQUIRED REGRESSION COMMANDS

Run before implementation and after implementation, with disposable PostgreSQL supplied through `TEST_DATABASE_URL` where applicable:

```text
node --test test/durable-player-identity.test.js
node --test test/node-assignments.test.js
node --test test/escape-assignment-integration.test.js
node --test test/escape-assignment-renderer.test.js
node --test test/mission-control.test.js
npm test
```

After implementation also run:

```text
node --test test/escape-assignment-mutation.test.js
```

The full `npm test` run must include the real PostgreSQL mutation/scan tests, not skips, for final causal evidence. Never point the test harness at production or shared player data.

Report separately:

- pure validation/unit evidence;
- structural route/source evidence;
- real authenticated HTTP/PostgreSQL mutation evidence;
- existing Escape scan consequence evidence;
- renderer VM/fake-DOM regression evidence;
- full regression evidence;
- unverified real Mission Control/browser/device/production behavior.

## REQUIRED CAUSAL PROOF

The implementation report must show evidence for each link.

### SET

```text
valid current admin bearer/session
→ PUT Player A Escape = Message A
→ players.code confirmed without identity mutation
→ one active node_assignments row + durable audit row committed
→ Player A scans real Escape endpoint
→ resolver finds Message A
→ API returns assignment mode
→ existing station renderer can display Message A
→ normal Escape visit suppressed
```

### CLEAR

```text
valid current admin bearer/session
→ DELETE Player A Escape assignment
→ same row becomes inactive + durable audit row committed
→ Player A scans real Escape endpoint
→ resolver falls back
→ existing normal Escape route runs
→ normal Escape visit recorded
→ existing normal station UI contract restored
```

### RE-SET

```text
valid current admin bearer/session
→ PUT Player A Escape = Message C
→ same primary-key row active again
→ Player A scans Escape
→ Message C returned
→ no duplicate row and no prior progress/history deletion
```

Do not claim a real operator UI or real-device end-to-end test. The renderer link may rely on the already-existing VM/fake-DOM regression unless a real browser test is separately performed and reported accurately.

## INVARIANTS

- Existing `requireAdmin` is the only privilege gate.
- `players.code` existence is authoritative; credential inventory alone is not a player.
- Escape and `assigned_message` are literals controlled by the server.
- SET stores a trimmed 1..1000-character string and activates exactly one row.
- CLEAR deactivates, never deletes, and is idempotent only for a known durable player.
- Every successful authorized SET/CLEAR has one durable audit row in the same transaction.
- Invalid/unknown/unauthorized attempts make no assignment or success-audit mutation.
- Player A mutation neither exposes nor changes Player B.
- Attention, Access, and Sensory remain unchanged.
- No gameplay, profile, final, reset, recovery, ownership, activation, release, QR, or UI state changes except the demonstrated downstream consequence of the assignment row during a later Escape scan.
- Preserve the names and current meanings of ESCAPE, ATTENTION, ACCESS, and SENSORY.

## OUT OF SCOPE

- Mission Control assignment form, list, search, history, or client calls
- Bulk assignment, import/export, and multi-player operations
- Attention, Access, or Sensory mutation contracts
- Generic node, assignment type, JSON payload, or assignment service
- Media, templates, metadata, notes, schedules, expiration, priority, targeting, segmentation, cohorts, or campaigns
- Personal or Start/End assignments
- Five-node or personalized QR conversion
- Player creation, credential claim/activation, recovery, reset, or ownership release
- Resolver, Escape route, renderer, normal fallback, or player UI changes
- New accounts, roles, OAuth, or authorization architecture
- General audit platform, assignment-history table, concurrency/version system, or destructive migration
- Deployment, production mutation, field testing, real Mission Control usability, or mobile/device testing
- Unrelated refactors or documentation expansion

## STOP CONDITIONS

Stop and report without widening scope if:

1. Current `HEAD` contains material application drift from the pinned baseline.
2. `requireAdmin` is absent or cannot protect both routes without a new auth architecture.
3. Existing durable player existence cannot be checked through `players` without identity/ownership mutation.
4. Mutation cannot be fixed to literal Escape and `assigned_message`.
5. Schema/migration `004` cannot support the upsert/deactivation without generic JSON or destructive migration.
6. CLEAR requires resolver changes or row deletion.
7. SET/CLEAR cannot preserve current gameplay, profile, history, access ownership, activation, and other-player state.
8. The synchronized Escape route/resolver/renderer evidence is absent or failing before implementation.
9. Durable `mission_control_audit` cannot be reused transactionally without generalized audit work.
10. Credible causal proof cannot use a disposable PostgreSQL schema.
11. Unrelated working-tree changes cannot be isolated.
12. Production/deployment mutation or Mission Control UI is required for local proof.

## ACCEPTANCE CRITERIA

The experiment succeeds only if:

1. Both exact mutation routes use current `requireAdmin`.
2. Unauthorized requests are denied before target disclosure or mutation.
3. Both routes target only an existing `players.code` and never create/claim/activate identity.
4. Escape and `assigned_message` are fixed by the contract.
5. SET validates and canonically trims the existing 1..1000-character message boundary.
6. SET creates or updates exactly one `(code,'escape')` row, activates it, and advances `updated_at` on update.
7. SET's message becomes the next real Escape assignment response and suppresses the normal visit.
8. CLEAR deactivates rather than deletes the row and advances `updated_at` only when state changes.
9. CLEAR is an idempotent no-op for a known player's absent/inactive Escape assignment.
10. CLEAR restores the current real normal Escape route and visit behavior.
11. Re-SET after CLEAR reuses the row, returns the new message, and creates no duplicate.
12. Unknown players return bounded errors and are not created.
13. Invalid messages cause no assignment or success-audit mutation.
14. Every successful authorized operation records the bounded durable audit evidence.
15. Other players and their public responses remain isolated.
16. Attention, Access, and Sensory rows and behavior remain unchanged.
17. Visits, answers, profiles/history, final reflections, reset state, access ownership, activation state, and recovery continuity remain unchanged by the mutation itself.
18. Resolver, Escape branch order, renderer, normal fallback, Mission Control UI, QuickStart, Start/End, QR routing, recovery, reset, and release remain unchanged.
19. Focused unit/structural tests, real HTTP/PostgreSQL causal tests, required regressions, and full `npm test` pass without database skips.
20. No schema migration, UI, generic assignment backend, deployment, or production mutation occurs.

## REQUIRED IMPLEMENTATION REPORT

Create the mandatory timestamped report under `docs/pass-reports/`, update its index, and include the repository-required 12 sections.

The report must distinguish:

- **IMPLEMENTED:** the actual authenticated routes, validation, upsert/deactivation, response, and audit behavior in current source;
- **TESTED:** exact pure, structural, real HTTP/PostgreSQL, Escape consequence, renderer-regression, and full-suite behavior exercised;
- **VALIDATED:** only if evidence supports that an authorized request can safely set/clear one durable player's Escape assignment without direct SQL and deterministically change the next Escape behavior;
- **UNVERIFIED:** Mission Control usability, real operator workflow, real browser/mobile/device behavior, production security/deployment, concurrent field use, other Functions, and broader lifecycle.

Include exact state snapshots or query results sufficient to prove isolation and preservation, exact test commands/results/skips, the three causal traces, audit evidence, remaining failures, and environmental limits. Do not call the assignment system, Task Pack 02, Mission Control authoring, or production behavior complete.

The recommended next experiment, only after this packet succeeds, should use:

```text
current claim
→ biggest uncertainty: safe operator usability
→ minimum experiment: one bounded Mission Control control over the proven contract
→ observable result: an operator can set/clear the intended player without target/message error
```

Do not implement that UI during this pass.

## COMMIT / DEPLOYMENT BOUNDARY

This packet does not itself authorize a commit, push, deployment, production mutation, Mission Control UI, or the next experiment. If later commit instructions are supplied, include implementation, tests, mandatory pass report, and report-index update together using `INCLUDED IN THIS COMMIT`.
