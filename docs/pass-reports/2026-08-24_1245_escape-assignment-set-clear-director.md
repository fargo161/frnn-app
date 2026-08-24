# 1. PASS

- Pass/task name: Escape assignment set/clear contract Director pass
- Objective: Inspect synchronized current source and create one bounded implementation Task Pack for authenticated Escape assignment SET/CLEAR against one existing durable player, without application implementation or Mission Control UI.
- Branch: `main`
- Baseline: `a38d05ffda4a95ba2eb7112ec011ad586e45b09f`

# 2. CURRENT REALITY BEFORE PASS

- **IMPLEMENTED and TESTED:** `node_assignments` and `resolveNodeAssignment` select active durable assignments and fall back for absent/inactive rows.
- **IMPLEMENTED and TESTED:** the real Escape scan route resolves after identity establishment and before visit mutation, returns assignment mode for active rows, suppresses the normal Escape visit, and falls through for absent/inactive rows.
- **IMPLEMENTED and TESTED at script/fake-DOM level:** the Escape station page renders the bounded assignment response without normal player/progress/puzzle fields.
- **IMPLEMENTED:** `requireAdmin` accepts the provisional `ADMIN_KEY` bearer or an unexpired Mission Control cookie session, and current `/api/admin/*` routes reuse it.
- **IMPLEMENTED:** `players.code` is durable identity, while `ensurePlayerIdentity` would create/activate identity and therefore is unsuitable for the requested mutation.
- **IMPLEMENTED:** `mission_control_audit` and `audit(...)` provide durable transactional action evidence used by existing admin mutations.
- **NOT IMPLEMENTED:** no authenticated assignment SET/CLEAR server contract existed. Assignment mutation still required direct persistence/test setup.
- Mission Control assignment UI, real operator usability, production security/deployment, mobile/device behavior, concurrent field use, other-Function mutation, and broader lifecycle were **UNVERIFIED**.

# 3. WHAT CHANGED

- Added a baseline-pinned implementation packet defining exactly `PUT` and `DELETE` on `/api/admin/player/:accessCode/escape-assignment`.
- Fixed authorization to existing `requireAdmin`, identity existence to a non-creating `players.code` check, node to Escape, and assignment type to `assigned_message`.
- Designed SET as a trimmed 1..1000-character PostgreSQL upsert that activates one `(code,'escape')` row and CLEAR as idempotent deactivation for a known durable player.
- Required one transactional durable audit record for every successful authorized SET/CLEAR, with no message content in audit detail.
- Defined exact bounded responses/errors, other-player/other-Function isolation, non-assignment state preservation, and real HTTP/PostgreSQL causal tests through the existing Escape scan route.
- No application, test, schema, migration, UI, deployment, or production behavior changed.

# 4. WHAT IS REAL NOW

- **DESIGNED:** one implementation Task Pack now pins the endpoint, privilege, player identity, validation, lifecycle, persistence, audit, response, isolation, regression, and causal-proof contracts to current source.
- **IMPLEMENTED:** only the Task Pack and Director audit artifacts from this pass are present.
- Current runtime behavior remains unchanged: authorized operators still have no server contract for setting or clearing Escape assignments.

# 5. WHAT IS STILL MISSING

- Both authenticated routes, validation helper, upsert/deactivation SQL, durable assignment audit calls, and focused tests remain unimplemented.
- The real SET → assigned scan, CLEAR → normal scan, and re-SET causal chains have not been exercised.
- Mission Control UI and usability remain absent and explicitly outside this packet.
- Production security, deployment, real browser/device behavior, concurrent field use, other Functions, and broader assignment lifecycle remain unverified.

# 6. WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

- The current shared `ADMIN_KEY`/Mission Control session boundary is provisional and is not claimed as validated production authorization.
- CLEAR-as-deactivation and idempotent absent/inactive CLEAR are experiment rules, not validated long-term product lifecycle decisions.
- The exact route and audit action names are designed contracts pending implementation.
- Prior resolver, Escape route, and renderer evidence was inspected but not newly behaviorally exercised in this Director pass.

# 7. TESTING PERFORMED

## Structural checks

- Verified clean synchronized `main`: local `HEAD` and `origin/main` both `a38d05ffda4a95ba2eb7112ec011ad586e45b09f`.
- Inspected `requireAdmin`, `ADMIN_KEY`, Mission Control cookie/session handling, current admin route shapes, transaction helper, and bounded response/error patterns.
- Inspected `players`, `access_codes`, `ensurePlayerIdentity`, `node_assignments`, resolver, Escape route branch, assignment renderer, durable audit schema/helper, and relevant tests.
- Confirmed schema already supports unique upsert, activation/deactivation, message bounds, timestamps, and player foreign-key isolation without migration.

## Behavioral checks

- None. The Director Call prohibited implementation, and runtime behavior did not change.

# 8. TEST RESULTS

- Structural inspection found a reusable current privilege boundary and durable audit mechanism; no stop condition is currently triggered.
- A fixed Escape-only contract can check `players` without calling the mutating identity-establishment helper.
- Existing `(code,node_key)` uniqueness, `is_active`, and resolver fallback can support the requested SET/CLEAR/re-SET lifecycle without schema or resolver changes.
- No tests were run because this pass produced implementation instructions only.

# 9. IMPORTANT UNCERTAINTIES

- Whether the implemented routes can preserve every non-assignment state surface under real PostgreSQL mutation tests.
- Whether SET/CLEAR audit evidence remains sufficiently useful without storing message content.
- Whether idempotent CLEAR is the correct long-term operator lifecycle rather than only the smallest coherent experiment.
- Whether the provisional shared-key/session boundary is adequate outside local experimentation.
- Mission Control usability, operator targeting error, real devices, deployment, concurrent field use, and broader Functions remain unverified.

# 10. RECOMMENDED NEXT EXPERIMENT

- **NOW:** Current claim: current privilege, durable identity, assignment schema, audit, resolver, Escape route, and renderer can support a narrow mutation contract → biggest uncertainty: whether authenticated SET/CLEAR can change one player's next Escape behavior without identity/progress leakage or mutation → minimum experiment: execute the new packet with two fixed routes and real disposable-PostgreSQL causal tests → observable result: SET yields assigned Message A/no visit, CLEAR yields normal fallback/visit, and re-SET yields Message C on the same row while other state remains unchanged.
- Stop after that evidence; do not begin Mission Control UI automatically.
- **NEXT:** one minimal Mission Control control over the proven server contract, focused on preventing target/message operator error.
- **LATER:** real mobile/device and field workflow evidence; evaluate broader Function applicability only after explicit design.
- **PARK:** generic assignment management, roles/accounts redesign, scheduling, targeting, campaigns, personalized QR, and generalized lifecycle/history.

# 11. FILES MODIFIED

- `tasks/FRNN_TEAM_TASK_PACK_02_ESCAPE_ASSIGNMENT_SET_CLEAR_CONTRACT_EXPERIMENT_V0_1.md`
- `docs/pass-reports/2026-08-24_1245_escape-assignment-set-clear-director.md`
- `docs/pass-reports/README.md`

# 12. COMMIT STATUS

`INCLUDED IN THIS COMMIT`
