# 1. PASS

- Pass/task name: Escape assignment authenticated SET/CLEAR contract experiment
- Objective: Implement and test the smallest authenticated server contract for setting, clearing, and re-setting one existing durable player's Escape `assigned_message`, then stop after causal evidence.
- Branch: `main`
- Execution baseline: `d30e7e2179ae2f493e4fbb05295f7db2595ab771`

# 2. CURRENT REALITY BEFORE PASS

- **IMPLEMENTED and TESTED:** `node_assignments` stored one typed row per `(code,node_key)` and `resolveNodeAssignment` selected active rows or returned the authored fallback.
- **IMPLEMENTED and TESTED:** the real Escape scan route resolved assignments before normal visit mutation, returned assignment mode for active rows, suppressed the normal visit, and fell through for missing/inactive rows.
- **IMPLEMENTED and TESTED at script/fake-DOM level:** the station page rendered the bounded Escape assignment response without normal player/progress/puzzle fields.
- **IMPLEMENTED:** `requireAdmin` provided the existing provisional `ADMIN_KEY` bearer or Mission Control session privilege boundary, and `mission_control_audit` provided durable transactional action records.
- **IMPLEMENTED:** `players.code` represented durable identity; `ensurePlayerIdentity` would create/activate identity and therefore could not be used by the mutation contract.
- **NOT IMPLEMENTED:** no authenticated assignment mutation endpoint existed. SET/CLEAR still required direct SQL or test setup.
- Real operator UI/usability, real browser/mobile behavior, production security/deployment, concurrent field use, and mutation support for other Functions were **UNVERIFIED**.

# 3. WHAT CHANGED

- Added `normalizeAssignedMessage(value)` in `node-assignments.js` to enforce one canonical string/trim/1..1000 boundary shared by route behavior and focused tests.
- Added authenticated `PUT /api/admin/player/:accessCode/escape-assignment` in `server.js`.
- SET normalizes the current route code, validates the message, locks/checks `players.code` without creating identity, and transactionally upserts the literal Escape/`assigned_message` row as active.
- SET returns only formatted access code, literal Escape node, active state, and the persisted trimmed message.
- Added authenticated `DELETE /api/admin/player/:accessCode/escape-assignment`.
- CLEAR locks/checks `players.code`, deactivates only an active Escape `assigned_message`, preserves the row, and is an idempotent no-op for a known player's inactive/absent row without rewriting its timestamp or creating a tombstone.
- Both successful operations write bounded `ESCAPE_ASSIGNMENT_SET` or `ESCAPE_ASSIGNMENT_CLEARED` audit records in the same transaction. Audit detail identifies Escape and CLEAR's changed state but never stores the assignment message.
- Added a real spawned-server/disposable-PostgreSQL integration suite covering authorization, validation, identity boundaries, SET/CLEAR/re-SET consequences, auditability, isolation, state preservation, and uniqueness.
- Updated one existing resolver import assertion to recognize the new validator imported alongside the unchanged resolver.
- No schema, migration, resolver behavior, Escape scan order, renderer, Mission Control UI, player UI, QR, QuickStart, Start/End, recovery, reset, release, deployment, or production state changed.

# 4. WHAT IS REAL NOW

- **IMPLEMENTED:** an existing privileged bearer/session can SET and CLEAR one existing durable player's Escape assignment through two fixed server routes.
- **IMPLEMENTED:** the contract accepts no node or assignment-type parameter and never calls identity creation/activation helpers.
- **IMPLEMENTED:** SET creates or updates one active primary-key row; CLEAR deactivates rather than deletes and is idempotent for a known player; re-SET reuses the row.
- **IMPLEMENTED:** every successful authorized operation produces one transactional durable audit entry without message content.
- **TESTED:** real HTTP and PostgreSQL evidence connects SET to assignment mode/no Escape visit, CLEAR to normal fallback/visit, and re-SET to the new message on the same row.
- **VALIDATED, narrowly:** an authorized server request can create and clear one existing durable player's Escape assignment without direct SQL, and those persisted mutations deterministically change that player's next tested Escape behavior while preserving the bounded state surfaces exercised.

# 5. WHAT IS STILL MISSING

- No Mission Control assignment form, list, search, history view, or operator-facing client call exists.
- No mutation contract exists for Attention, Access, or Sensory.
- No generalized assignment service, scheduling, expiration, targeting, media, bulk operation, or assignment-history product exists.
- Real browser/mobile rendering was not rerun during this pass; the existing fake-DOM renderer regression remained green.
- Production authorization suitability, deployment, live data migration, field workflow, and concurrent real-operator/device use remain unverified.
- The broader assignment system and Task Pack 02 are not complete.

# 6. WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

- The shared `ADMIN_KEY`/Mission Control session boundary remains provisional and is not validated production authorization.
- CLEAR-as-deactivation and idempotent known-player CLEAR are bounded experiment lifecycle rules, not validated long-term product decisions.
- The integration used synthetic players and an isolated disposable PostgreSQL container, not production or field data.
- Renderer evidence remains Node script/fake-DOM evidence rather than a new real-device check.

# 7. TESTING PERFORMED

## Pre-implementation focused regression

```text
node --test test/durable-player-identity.test.js test/node-assignments.test.js test/escape-assignment-integration.test.js test/escape-assignment-renderer.test.js test/mission-control.test.js
```

- Result: 31 passed, 0 failed, 3 skipped because `TEST_DATABASE_URL` was initially unset.

## Focused validation/source behavior

```text
node --test test/escape-assignment-mutation.test.js
```

- Without PostgreSQL configured: 1 passed, 1 skipped.
- With disposable PostgreSQL configured: 2 passed, 0 failed, 0 skipped.
- The first PostgreSQL execution passed but exposed a `pg` deprecation warning from parallel queries on one test client. The snapshot helper was made sequential, and the test rerun passed without warnings.

## Required post-implementation focused regressions

Using `TEST_DATABASE_URL` pointed at a local disposable PostgreSQL 16 Alpine container:

```text
node --test test/durable-player-identity.test.js test/node-assignments.test.js test/escape-assignment-integration.test.js test/escape-assignment-renderer.test.js test/mission-control.test.js test/escape-assignment-mutation.test.js
```

- First result: 35 passed, 1 failed, 0 skipped. The failure was an obsolete exact import-regex in `test/node-assignments.test.js`; runtime/database behavior passed.
- After updating only that assertion for the new validator import: 36 passed, 0 failed, 0 skipped.

## Full regression

```text
npm test
```

with the same disposable `TEST_DATABASE_URL`.

- Result: 235 passed, 0 failed, 0 skipped.

## Structural checks

- `git diff --check` passed; line-ending conversion warnings were informational.
- Inspected the final diff for fixed routes, literal node/type SQL, non-creating player lock, conflict update, deactivation rather than deletion, bounded responses, and transactional audit calls.
- Confirmed no Mission Control/client UI mutation call was introduced.

# 8. TEST RESULTS

- Unauthorized SET/CLEAR returned `401` / `MISSION_CONTROL_ACCESS_REQUIRED` without assignment or audit mutation.
- Missing, wrong-type, blank, whitespace-only, and 1001-character messages returned `400` / `INVALID_ASSIGNMENT_MESSAGE`; a 1000-character message succeeded.
- A syntactically valid inventory credential without `players` identity and an invalid code returned `404` / `PLAYER_NOT_FOUND` without player creation, activation, claim, assignment, or success audit.
- SET `Message A` created one active Escape row and audit record; the next real Escape scan returned assignment mode/Message A and inserted no Escape visit.
- SET `Message B` preserved `created_at`, advanced `updated_at`, retained one row, and changed the next real Escape response.
- CLEAR retained the row as inactive, advanced its timestamp once, wrote `changed:true`, and caused the next real Escape scan to return the existing normal response and record the normal visit.
- Repeated CLEAR on inactive and absent known-player state returned success, did not rewrite/create an assignment row, and audited `changed:false`.
- Re-SET `Message C` reactivated the same row, returned Message C on the next Escape scan, and preserved the normal visit created during fallback.
- Concurrent SET requests retained exactly one row and one complete submitted message.
- Player B assignment state/response, Player A other-Function assignment rows, access ownership, player timestamps, pre-existing visits, answers, profile/history, final reflection, and QuickStart continuity remained unchanged by SET/CLEAR.
- Attention, Access, and Sensory continued the normal scan route despite their seeded assignment rows.
- Audit rows contained operator/action/code/node/changed evidence and no assigned message content.

# 9. IMPORTANT UNCERTAINTIES

- Whether real operators can select the intended player and enter/clear messages without mistakes; no UI exists.
- Whether the provisional shared-key/session boundary is sufficient for production security and accountability.
- Whether audit records without message content provide enough operational traceability while preserving privacy.
- Whether deactivation/idempotence remains the correct lifecycle under long-running field use.
- Real browser/mobile readability, deployment, production data, concurrent field traffic, and other-Function behavior remain unverified.

# 10. RECOMMENDED NEXT EXPERIMENT

- Stop here per the execution instruction.
- **NEXT, only when explicitly authorized:** Current claim: the authenticated server contract is causally proven in disposable PostgreSQL → biggest uncertainty: operator target/message error → minimum experiment: one bounded Mission Control SET/CLEAR control over only this contract → observable result: an operator can deliberately change the intended player's next Escape behavior and safely restore fallback without direct SQL.
- **LATER:** real mobile/device and field workflow evidence; production authorization review.
- **PARK:** other Functions, generic assignment management, scheduling, targeting, campaigns, personalized QR, and generalized lifecycle/history.

# 11. FILES MODIFIED

- `node-assignments.js`
- `server.js`
- `test/escape-assignment-mutation.test.js`
- `test/node-assignments.test.js`
- `docs/pass-reports/2026-08-24_1259_escape-assignment-set-clear.md`
- `docs/pass-reports/README.md`

# 12. COMMIT STATUS

`INCLUDED IN THIS COMMIT`
