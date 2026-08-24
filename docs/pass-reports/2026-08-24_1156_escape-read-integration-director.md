# 1. PASS

- Pass/task name: Single-`escape` read-integration Director pass
- Objective: Inspect current source and create one bounded implementation Task Pack for consulting the existing node-assignment resolver only in the Escape scan path before its normal visit mutation, without implementing route integration.
- Branch: `main`
- Baseline: `12ed271dd37110d661870eaca2b9ec0aafe51cdc`

# 2. CURRENT REALITY BEFORE PASS

- **IMPLEMENTED:** migration `004`, the mirrored typed `node_assignments` table, and `resolveNodeAssignment` were committed on the clean baseline.
- **TESTED:** the preceding resolver pass recorded 225/225 tests passing with disposable PostgreSQL.
- **VALIDATED, narrowly:** the isolated resolver contract distinguished two players at the same canonical node with safe fallback and public projection.
- **IMPLEMENTED:** `POST /api/scan/:station` was one inline handler for all four Functions; `escape` had no special branch.
- **IMPLEMENTED:** the handler selected cookie-first/body-fallback identity, locked the access row, applied the current status gate, and called mutating `ensurePlayerIdentity` before reading or inserting visits.
- **IMPLEMENTED:** the current Escape fallback response was composite, built from visit/stage state, configuration, player state, video roles, and answer state. No scalar default message represented the full response.
- **NOT IMPLEMENTED:** no route imported or called `node-assignments.js`; the current station UI could not render a minimal assignment-only response.

# 3. WHAT CHANGED

- Added a baseline-pinned implementation packet for a single literal `station === 'escape'` resolver branch after current identity establishment and before the first visit query.
- Defined a bounded three-field assigned response and required default resolution to fall through into the existing Escape code rather than duplicating or reconstructing it.
- Identified the current authored Escape subtitle/label as the resolver's scalar fallback input while preserving the existing composite response as the actual default behavior.
- Required route-level or credible route-harness evidence for assigned no-visit behavior, unassigned/inactive fallback, other-Function non-integration, privacy, and pre-existing identity mutations.
- Recorded that `ensurePlayerIdentity` may mutate identity before resolver execution and that the existing player UI remains incompatible with the API-only assigned response.
- No application, resolver, schema, migration, test, route, UI, QR, production, or deployment behavior changed.

# 4. WHAT IS REAL NOW

- **DESIGNED:** one bounded work order now specifies the exact import, identity boundary, Escape branch, resolver call, assigned response, fallback fallthrough, and behavioral proof.
- **IMPLEMENTED:** only the new Task Pack and Director audit artifacts are present from this pass.
- Current runtime behavior remains unchanged; no Functional route is assignment-aware.

# 5. WHAT IS STILL MISSING

- All Escape route integration and route-level causal tests remain to be implemented.
- No assigned Escape API response exists.
- Assigned Escape scans still follow the current visit/default path because the route does not consult assignments.
- Attention, Access, and Sensory remain assignment-unaware as intended.
- No assigned-message player UI, authoring, deployment, production migration, device test, or field validation exists.

# 6. WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

- The proposed Escape-only condition is an experimental branch, not a generalized architecture.
- The existing Escape subtitle/label is a provisional scalar resolver fallback input; it is not the complete default route result.
- The proposed assignment response is API/test-only and would not render through the unchanged current station page.
- Any future route harness would be test infrastructure, not proof of real mobile behavior.

# 7. TESTING PERFORMED

## Structural checks

- Confirmed clean working tree, branch `main`, and full baseline SHA.
- Inspected `server.js` imports, `codeFromRequest`, the complete Functional scan handler, `getContentConfig`, `playerRecord`, and server startup boundary.
- Inspected `ensurePlayerIdentity`, migration `004`, `node-assignments.js`, default Escape configuration, current station-page response consumption, and relevant scan/resolver/durable-identity tests.
- Located the exact viable branch boundary after baseline `server.js` line 494 and before line 496.

## Behavioral checks

- None. The Director Call prohibited implementation, and no runtime behavior changed.

# 8. TEST RESULTS

- Structural inspection found no current stop condition: the Escape branch can be placed inside the existing transaction without modifying other Functions or duplicating the default route.
- Current body-code/cookie authority and mutating identity establishment must remain explicit in implementation evidence.
- The current default response has no scalar message equivalent; the packet resolves this design mismatch without replacing the default path.
- No tests were run because this pass produced implementation instructions only.

# 9. IMPORTANT UNCERTAINTIES

- Whether actual route-level tests can be added without disproportionate server-startup refactoring; the packet permits a narrow credible route harness but requires stopping if broad restructuring is necessary.
- Whether an API-only assigned response is useful once a player UI experiment occurs.
- Whether the subtitle/label is the best long-term authored fallback projection; it is sufficient only because the actual default branch ignores that projection and continues unchanged.
- Whether current pre-resolver body-code authority and identity mutation are appropriate long term; redesign is out of scope.
- Production, deployment, mobile/device, printed QR, concurrent field, and all-Function integration behavior remain unverified.

# 10. RECOMMENDED NEXT EXPERIMENT

- **NOW:** Current claim: Escape can branch on assignment before visit mutation while preserving its fallback → biggest uncertainty: whether the real route boundary produces the required state consequences → minimum experiment: execute the new packet with one Escape-only branch and route-level or narrow route-harness tests → observable result: Player A returns assigned mode with no Escape visit while Player B falls through to the unchanged Escape response and one visit.
- Do not begin UI, authoring, other-Function, QR, production, deployment, or field work automatically.
- **NEXT:** after reviewing route evidence, evaluate the smallest authenticated assignment-authoring contract.
- **LATER:** player UI/mobile presentation and broader Function applicability.
- **PARK:** five-node QR conversion, identity redesign, scheduling, segmentation, and generalized content systems.

# 11. FILES MODIFIED

- `tasks/FRNN_TEAM_TASK_PACK_02_ESCAPE_READ_INTEGRATION_EXPERIMENT_V0_1.md`
- `docs/pass-reports/2026-08-24_1156_escape-read-integration-director.md`
- `docs/pass-reports/README.md`

# 12. COMMIT STATUS

`INCLUDED IN THIS COMMIT`
