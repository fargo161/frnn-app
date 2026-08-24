# 1. PASS

- Pass/task name: Task Pack 02 node-assignment resolver experiment Director pass
- Objective: Inspect current source and produce one bounded implementation Task Pack for typed per-player node-assignment persistence and isolated resolver proof, without implementing the experiment.
- Branch: `main`
- Baseline: `da0f61a4873b46aad84a177ead0ac36ccc684499`

# 2. CURRENT REALITY BEFORE PASS

- **IMPLEMENTED:** durable player identity is keyed by `players.code`; ownership survives gameplay reset and has a privileged release path.
- **TESTED:** the prerequisite audit reports the Task Pack 01 invariants proven at source and behavioral-test level on execution baseline `02db860bfaf30b2108bfbb07d0a99f7d83539630`.
- **IMPLEMENTED:** the latest numbered migration was `003_durable_player_identity.sql` and `db.js` applies zero-padded numbered migrations after `schema.sql`.
- **IMPLEMENTED:** `lib.js` defines `escape`, `attention`, `access`, and `sensory` as the canonical Functional keys; `qr-routing.js` retains six current destinations including Start/End and Quick Start.
- **DESIGNED, not implemented:** the existing broad Task Pack 02 requests five-node, routing, enrollment, UI, Mission Control, and assignment work from an obsolete blocked baseline.
- **NOT IMPLEMENTED:** no typed node-assignment table, resolver, public projection, or two-player/same-node causal test existed.
- Production database contents, deployed behavior, printed QR inventory, and field behavior were **UNVERIFIED**.

# 3. WHAT CHANGED

- Added a new baseline-pinned implementation packet for only the `004_node_assignments.sql` plus `node-assignments.js` resolver experiment.
- Defined a bounded relational contract keyed by durable player code and the existing four Functional node keys, with one explicit `assigned_message` field and boolean active state.
- Defined deterministic assignment-first/default-second precedence, an exact three-field public projection, read-only resolution, and five causal behavioral tests.
- Preserved the earlier broad Task Pack 02 as historical designed scope and explicitly prevented it from becoming part of this experiment.
- No application, schema, migration, resolver, route, UI, QR, production, or deployment behavior changed.

# 4. WHAT IS REAL NOW

- **DESIGNED:** a bounded implementation work order now exists for migration `004`, bootstrap-schema mirroring, an injected-client resolver, canonical Functional-key validation, public projection, and causal tests.
- **IMPLEMENTED:** only the task packet and audit artifacts from this Director pass are present.
- The assignment model and resolver remain unimplemented; current runtime behavior is unchanged.

# 5. WHAT IS STILL MISSING

- The entire resolver experiment remains to be implemented and tested.
- No `node_assignments` table or migration exists.
- No resolver or assignment tests exist.
- No route, API, player UI, Mission Control, QR, deployment, or production integration is authorized or implemented.

# 6. WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

- The packet's 1000-character message bound, `is_active` lifecycle, and public `source` field are provisional experiment constraints, not validated production requirements.
- The packet is a work order and is not proof that any described resolver behavior exists.

# 7. TESTING PERFORMED

## Structural checks

- Inspected `schema.sql`, `migrations/003_durable_player_identity.sql`, `db.js`, `lib.js`, `qr-routing.js`, representative tests, the prerequisite audit, task-packet protocol, and the existing broad Task Pack 02.
- Confirmed clean working tree before the pass and recorded full baseline SHA.
- Searched current source and tests for canonical station keys, QR expectations, migration conventions, and assignment-model presence.

## Behavioral checks

- None. This Director call expressly prohibited implementation; no runtime behavior changed.

# 8. TEST RESULTS

- Structural inspection confirmed migration `004` is next, player identity uses `players.code`, canonical Functional keys are `escape`, `attention`, `access`, and `sensory`, and no assignment model/resolver currently exists.
- The existing broad packet materially exceeds this Director call's scope; the new packet records that contradiction.
- No behavioral tests were run because this pass created design instructions only.

# 9. IMPORTANT UNCERTAINTIES

- Whether the proposed three-field public projection is sufficient for a later player-facing consumer.
- Whether boolean inactive state or row deletion should become the eventual authoring lifecycle.
- Whether the 1000-character bound fits future player presentation.
- Whether migration and resolver behavior hold against disposable PostgreSQL; that belongs to the implementation pass.
- Route, device, UI, Mission Control, production, deployment, and field behavior remain unverified.

# 10. RECOMMENDED NEXT EXPERIMENT

- **NOW:** Current claim: a typed player/node row and one reusable precedence rule can distinguish two players at the same canonical node → biggest uncertainty: whether the bounded persistence and projection contract is sufficient and private → minimum experiment: execute the new packet by adding migration `004`, the focused resolver, and its causal tests without integration → observable result: Player A and Player B resolve different public messages for `escape`, while missing/inactive/wrong-node state falls back and no private fields or writes occur.
- **NEXT:** after reviewing that evidence, consider the smallest read-only route integration experiment.
- **LATER:** authoring UI, broader node changes, and production migration evaluation.
- **PARK:** five-node QR conversion, enrollment redesign, segmentation, scheduling, and generalized content systems.

# 11. FILES MODIFIED

- `tasks/FRNN_TEAM_TASK_PACK_02_NODE_ASSIGNMENT_RESOLVER_EXPERIMENT_V0_1.md`
- `docs/pass-reports/2026-08-24_1117_task-pack-02-resolver-experiment-director.md`
- `docs/pass-reports/README.md`

# 12. COMMIT STATUS

`INCLUDED IN THIS COMMIT`
