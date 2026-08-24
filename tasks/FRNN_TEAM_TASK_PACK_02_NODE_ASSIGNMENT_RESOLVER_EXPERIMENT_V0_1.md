# TASK PACK 02 — Node-Assignment Resolver Experiment v0.1

**Document type:** Implementation Task Packet
**Reality state:** DESIGNED — not proof of implementation
**Baseline:** `da0f61a4873b46aad84a177ead0ac36ccc684499`
**Required branch:** `main`
**Status:** Pending
**Created:** 2026-08-24

> This packet defines work requested from the stated baseline. Source code, runtime behavior, and behavioral tests remain authoritative for what is actually implemented.

## PRIMARY OBJECTIVE

Implement the minimum typed node-assignment persistence and resolver layer required to prove identity-specific resolution for one canonical node.

The experiment must answer only this question:

> Can one small typed assignment model and resolver produce different player-specific public results for the same canonical node, while safely falling back to an authored default and exposing no private assignment data?

Required causal chain:

```text
same canonical Functional node
→ known durable player code
→ assignment lookup by player and node
→ active assigned_message or authored default
→ deliberately public projection
→ different observable message for different players
```

Do not integrate the resolver into routes, UI, Mission Control, QR generation, or deployed behavior during this experiment.

## CURRENT REALITY AT BASELINE

- **IMPLEMENTED:** durable player ownership is represented by `players.code`, which references `access_codes.code`; Task Pack 01 preserves that ownership across gameplay reset and provides a privileged release path.
- **TESTED:** the prerequisite audit at `docs/pass-reports/2026-08-24_1058_task-pack-02-prerequisite-audit.md` reports source and behavioral-test evidence for the Task Pack 01 ownership invariants on baseline `02db860bfaf30b2108bfbb07d0a99f7d83539630`.
- **IMPLEMENTED:** numbered migrations use zero-padded filenames under `migrations/`; the latest is `003_durable_player_identity.sql`, so the next migration is `004_node_assignments.sql`.
- **IMPLEMENTED:** `lib.js` defines the canonical Functional node keys as `escape`, `attention`, `access`, and `sensory`; `qr-routing.js` consumes matching routes while retaining Start/End and Quick Start as part of the current six-destination QR model.
- **IMPLEMENTED:** the four Functions have authored station-specific fallback behavior. Deeper Function semantics are not proven.
- **IMPLEMENTED:** tests use Node's built-in test runner, injected database-like clients for bounded domain behavior, source assertions for schema/migration structure, and optional disposable PostgreSQL checks where `TEST_DATABASE_URL` is available.
- **NOT IMPLEMENTED:** no `node_assignments` table, typed assignment model, assignment resolver, public assignment projection, or two-player/same-node causal proof exists.
- **UNVERIFIED:** production database contents, production migration behavior, deployed routes, printed QR inventory, multi-device behavior, and field usability.

### Contradiction with the earlier broad packet

`tasks/FRNN_TEAM_TASK_PACK_02_MULTIPURPOSE_NODE_QRS_V0_1.md` specifies a much broader five-node, enrollment, routing, UI, and Mission Control implementation and is still marked pending against an obsolete blocked baseline. It is not the active work order for this experiment. Preserve it as historical designed scope; do not execute or edit it during this pass.

Before implementation, compare this packet's baseline with current `HEAD`. Stop and report material drift rather than silently adapting the contract.

## REQUIRED CHANGES

### 1. Migration and schema mirror

Create `migrations/004_node_assignments.sql` and mirror the resulting table definition in `schema.sql`, consistent with the repository's bootstrap-plus-numbered-migration convention.

Create one bounded table named `node_assignments` with this contract:

| Field | Required contract |
| --- | --- |
| `code` | `TEXT NOT NULL`, foreign key to `players(code)` with `ON DELETE CASCADE` |
| `node_key` | `TEXT NOT NULL`, constrained to the existing Functional keys `escape`, `attention`, `access`, `sensory` |
| `assignment_type` | `TEXT NOT NULL DEFAULT 'assigned_message'`, constrained to exactly `assigned_message` |
| `assigned_message` | `TEXT NOT NULL`, nonblank and bounded to at most 1000 characters |
| `is_active` | `BOOLEAN NOT NULL DEFAULT TRUE`; `FALSE` represents cleared/inactive for this experiment |
| `created_at` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` |
| `updated_at` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` |

Use `(code, node_key)` as the primary key so one player has at most one assignment per canonical Functional node. Do not add a surrogate ID, JSON/JSONB payload, administrative note, owner metadata, audit metadata, schedule, expiration, cohort, segment, group, or generalized type registry.

The experiment's concrete proof node should be `escape`. The model may accept all four existing Functional keys because that constraint reuses the complete canonical source vocabulary and is needed to prove node isolation. Do not introduce `personal`, `start-end`, `quick-start`, or any parallel node key.

The migration must be locally testable without production execution. Do not execute it against production.

### 2. Focused resolver

Create `node-assignments.js` at the repository root, alongside the existing focused domain modules.

Export a narrow async resolver with a contract equivalent to:

```js
resolveNodeAssignment(client, { code, nodeKey, authoredDefault })
```

Exact naming may be adjusted only if current source at execution time establishes a stronger convention. The client must be injected; importing the global pool is unnecessary for this isolated experiment.

Resolver responsibility:

```text
durable player code + canonical Functional node key + authored default message
→ public resolved node assignment
```

The resolver must:

1. Validate `nodeKey` against the existing `STATIONS` vocabulary from `lib.js` rather than maintaining a parallel node list.
2. Read at most the active row for the exact `(code, node_key)` pair with `assignment_type='assigned_message'`.
3. Return the assignment's message when that exact active, valid row exists.
4. Otherwise return the supplied authored default without inserting, updating, or deleting anything.
5. Return a newly constructed public projection rather than a spread or raw database row.

The public projection must contain exactly:

```js
{
  nodeKey: 'escape',
  source: 'assignment', // or 'default'
  assignedMessage: 'public player-facing text'
}
```

`source` exists only to make precedence observable and testable. No raw row or prohibited field may cross this boundary. In particular, do not expose `code`, database identifiers, another player's data, ownership/profile data, lifecycle timestamps, administrative/audit data, or targeting metadata.

The resolver must not mutate progress, activate credentials, create players, create or clear assignments, mark visits, answer puzzles, perform QR routing, manage final reflection, schedule content, or choose randomly.

### 3. Deterministic precedence

Use exactly this precedence:

1. Exact player + exact node + active valid `assigned_message` row → assigned public message with `source: 'assignment'`.
2. Missing, inactive/cleared, wrong-player, or wrong-node row → supplied authored default with `source: 'default'`.
3. Resolution creates no persistent state.

Do not add segmentation, scheduling, targeting hierarchies, campaign logic, group rules, templates, generalized content engines, or one-off player branches.

### 4. Focused tests

Create `test/node-assignments.test.js`. Prefer a small purpose-built memory client that records queries and models only the resolver's read contract. Add a disposable PostgreSQL behavior test only if it follows existing optional `TEST_DATABASE_URL` conventions and can run without production mutation.

Structural assertions alone are insufficient. The test file must prove all behavioral cases below.

#### Test A — same node, different player

Given Player A and Player B with different active messages for `escape`, resolving `escape` returns Message A for Player A and Message B for Player B.

This is the central causal proof:

```text
Player A row: (A, escape, assigned_message, Message A, active)
→ Player A + escape → Message A

Player B row: (B, escape, assigned_message, Message B, active)
→ Player B + same escape node → Message B
```

#### Test B — missing assignment fallback and no write

A player with no row for the node receives the supplied authored default. Assert that resolution issued no `INSERT`, `UPDATE`, or `DELETE` and did not change the client's assignment count.

#### Test C — inactive assignment fallback

A row with `is_active=FALSE` behaves as no assignment and returns the supplied authored default.

#### Test D — privacy boundary

With rows for multiple players, Player A's result contains only `nodeKey`, `source`, and `assignedMessage`; it contains neither Player B's message nor any prohibited persisted/internal field.

#### Test E — node isolation

One player assigned at `escape` receives that assignment at `escape`, while resolving `attention` for the same player returns the distinct `attention` authored default.

#### Additional bounded assertions

- An invalid or invented node key is rejected before lookup.
- Assignment and fallback results are deterministic for identical input and stored state.
- Existing six QR destinations and current route/UI behavior remain unchanged.

## INVARIANTS

- Preserve the Function names exactly: ESCAPE, ATTENTION, ACCESS, SENSORY.
- Treat them as current authored canonical Functional nodes with fallback behavior; do not claim deeper semantics.
- Preserve durable player ownership and credential lifecycle behavior.
- Preserve QuickStart enrollment/name ordering, credential claiming, recovery, `/api/access`, Functional authorization and visit ordering, Start/End, final reflection, Personal routing, player shell, Mission Control, QR generation, and all six current QR destinations.
- Same-node differences must be caused by persisted player/node assignment state evaluated by one reusable rule—not player-specific URLs, hard-coded player branches, duplicate destinations, random selection, hidden templates, or UI-only differences.
- No assignment lookup may reveal another player's state.
- Resolution is read-only.

## OUT OF SCOPE

- Route or server endpoint integration, except an isolated test harness genuinely needed for the resolver
- Player-facing or administrative UI
- Mission Control assignment authoring
- Changing Start/End or reducing six QRs to five
- Personal-node migration or new node vocabulary
- Profile-gating or cookie-only Functional scans
- QuickStart enrollment changes or owned-only recovery changes
- Final-state presentation changes
- Assignment mutation helpers or APIs
- Scheduling, expiration, cohorts, segmentation, group targeting, rules engines, arbitrary metadata, generic content-management architecture
- Player-specific URLs, QR regeneration, deployment, production migration execution, or field testing
- Unrelated refactors and broad documentation rewrites

## STOP CONDITIONS

Stop and report the blocker without widening scope if:

1. Task Pack 01 ownership invariants appear broken on the execution baseline.
2. Existing player/progress data would need destructive reinterpretation.
3. The proof requires QR URL changes, route integration, or UI integration.
4. The proof requires generic JSON, an unbounded type system, or a rules engine.
5. A safe public projection cannot be constructed without private/internal assignment data.
6. Current canonical Functional identity is ambiguous enough to require a parallel namespace.
7. Local testing would require production migration execution.
8. Unrelated working-tree changes cannot be safely isolated.
9. Current `HEAD` has materially invalidated this packet's baseline assumptions.

## ACCEPTANCE CRITERIA

The implementation pass succeeds only if:

1. `004_node_assignments.sql` and the bootstrap schema define one minimal typed model matching the bounded contract.
2. `assigned_message` is the only supported assignment type.
3. A focused, injected-client resolver exists and uses `STATIONS` as canonical node validation.
4. Resolution is deterministic and read-only.
5. Player A and Player B receive different persisted messages for the same `escape` node.
6. Missing and inactive assignments return the supplied authored default.
7. An `escape` assignment does not affect `attention`.
8. The public projection contains exactly `nodeKey`, `source`, and `assignedMessage` and exposes no private/internal data.
9. No player, assignment, visit, progress, credential, answer, or final-reflection state is created or mutated by resolution.
10. No existing route, UI, QR, or deployment behavior changes.
11. New behavioral tests pass and prove the state-to-result difference.
12. Existing regression tests pass.
13. If disposable PostgreSQL is available, migration/schema behavior is exercised there; otherwise that limitation is explicit.
14. No production or deployment work occurs.
15. The required post-pass report states what remains unverified and does not call broader Task Pack 02 complete.

## REQUIRED TEST COMMANDS

At minimum run and report:

```text
node --test test/node-assignments.test.js
npm test
```

When `TEST_DATABASE_URL` is safely available for a disposable local database, also run the focused test and full suite with it. Never substitute a production database.

Separate structural evidence (migration/table/constraint presence) from behavioral evidence (persisted state changes the public result). Passing tests may support **TESTED** and the narrow causal experiment may support **VALIDATED** only for the claim that this resolver contract can distinguish two players at one canonical node. It does not validate route, UI, device, production, or field behavior.

## REQUIRED IMPLEMENTATION REPORT

In addition to the repository-mandated standalone report under `docs/pass-reports/`, include the following evidence in the appropriate required sections.

### WHAT IS REAL

- Exact migration and table name
- Every field and constraint
- Resolver function and canonical keys
- Exact public projection and precedence behavior

### WHAT IS MISSING

- All broader Task Pack 02 work, especially route, server, UI, Mission Control, QR, and deployment integration

### WHAT IS PROVISIONAL

- The 1000-character message bound, boolean inactive lifecycle, `source` test observability field, and any memory-client assumptions introduced only for this experiment

### WHAT WORKS

- Behavior actually demonstrated by executed tests, with structural and behavioral evidence separated

### WHAT IS UNCERTAIN

- Functional route integration, player/mobile presentation, Mission Control authoring, real multi-device behavior, concurrency not exercised against PostgreSQL, production migration behavior, and field usability

### TEST EVIDENCE

- Exact commands, pass/fail/skip results, database environment used, and untested behavior

### CAUSAL PROOF

Show the persisted rows and resolved projections for:

```text
Player A + escape → Message A
Player B + same escape node → Message B
```

Explain that only the persisted `code` value differs while node and resolver rule stay constant.

### NEXT EXPERIMENT

Recommend the smallest integration experiment only after evaluating this resolver result. Do not begin it automatically.

Use the repository's exact reality terms: **DESIGNED**, **IMPLEMENTED**, **TESTED**, and **VALIDATED**. Do not call Task Pack 02 complete, the broader node system implemented, or identity-specific QR behavior field-validated.

## COMMIT / DEPLOYMENT BOUNDARY

This packet does not itself authorize a commit, push, deployment, production database mutation, QR regeneration/printing, or the next integration experiment. If later commit instructions are supplied, include the substantive changes, mandatory pass report, and report-index update in the same final commit according to `AGENTS.md`.
