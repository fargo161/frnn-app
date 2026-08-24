# 1. PASS

- Pass/task name: Task Pack 02 node-assignment resolver experiment
- Objective: Implement the minimum typed node-assignment persistence and isolated resolver layer needed to prove that two durable players can receive different public messages for the same canonical Functional node, with authored fallback and a deliberate privacy boundary.
- Branch: `main`
- Execution baseline: `757b399cf2d7c59d100b1e08d795d98f9dbb6b72`
- Packet baseline: `da0f61a4873b46aad84a177ead0ac36ccc684499`
- Baseline reconciliation: the execution baseline adds only the committed Director packet/report artifacts; no application drift invalidated the packet assumptions.

# 2. CURRENT REALITY BEFORE PASS

- **IMPLEMENTED:** durable identity existed as `players.code`, backed by `access_codes.code`; Task Pack 01 reset/recovery/release behavior remained present.
- **TESTED:** `node --test test/durable-player-identity.test.js` passed all eight non-PostgreSQL prerequisite behaviors before implementation; its optional PostgreSQL case was initially skipped because `TEST_DATABASE_URL` was unset.
- **IMPLEMENTED:** canonical Functional keys were `escape`, `attention`, `access`, and `sensory` in `lib.js`; six QR destinations, including Start/End and Quick Start, remained current.
- **IMPLEMENTED:** the latest migration was `003_durable_player_identity.sql`; the migration runner used ordered zero-padded filenames after applying `schema.sql`.
- **NOT IMPLEMENTED:** no `node_assignments` table, assignment resolver, public assignment projection, or two-player/same-node causal proof existed.
- **DESIGNED:** the active packet specified one bounded `assigned_message` experiment without route, UI, QR, or Mission Control integration.
- Production data, deployed behavior, printed QRs, real devices, and field usability were **UNVERIFIED**.

# 3. WHAT CHANGED

- Added `migrations/004_node_assignments.sql` and mirrored its table definition in `schema.sql`.
- Added `node_assignments`, keyed by `(code, node_key)`, so persisted player identity and canonical node jointly determine the one possible assignment row.
- Added `resolveNodeAssignment(client, { code, nodeKey, authoredDefault })` in `node-assignments.js`.
- The resolver validates `nodeKey` against `STATIONS`, selects only `assigned_message` for the exact active player/node row, and constructs a three-field public result.
- Assignment precedence is causal and deterministic: exact active row returns its message; missing, inactive, wrong-player, or wrong-node state returns the supplied authored default.
- Added focused structural, memory-client behavioral, integration-boundary, and disposable PostgreSQL tests.
- No server route, endpoint, player UI, Mission Control UI, QR source, credential behavior, progress behavior, or deployed environment changed.

# 4. WHAT IS REAL NOW

## Persistence

- **IMPLEMENTED:** table `node_assignments` exists in the bootstrap schema and numbered migration `004_node_assignments.sql` with:
  - `code TEXT NOT NULL REFERENCES players(code) ON DELETE CASCADE`
  - `node_key TEXT NOT NULL` constrained to `escape`, `attention`, `access`, or `sensory`
  - `assignment_type TEXT NOT NULL DEFAULT 'assigned_message'` constrained to exactly `assigned_message`
  - `assigned_message TEXT NOT NULL` constrained after trimming to 1–1000 characters
  - `is_active BOOLEAN NOT NULL DEFAULT TRUE`
  - `created_at` and `updated_at` as non-null `TIMESTAMPTZ` values defaulting to `NOW()`
  - primary key `(code, node_key)`
- No surrogate ID, JSON payload, note, audit field, schedule, expiration, cohort, segment, or generalized type registry was added.

## Resolver

- **IMPLEMENTED:** `resolveNodeAssignment` accepts an injected query client and does not import the global database pool.
- **IMPLEMENTED:** canonical validation imports `STATIONS` from `lib.js`; there is no parallel node namespace.
- **IMPLEMENTED:** the only database projection is `assigned_message`, filtered by exact `code`, exact `node_key`, `assignment_type='assigned_message'`, and `is_active=TRUE`.
- **IMPLEMENTED:** the public result contains exactly:

```js
{
  nodeKey,
  source: 'assignment' | 'default',
  assignedMessage
}
```

- **TESTED:** resolution is read-only, deterministic, player-isolated, node-isolated, assignment-first, and default-safe in the focused memory harness and disposable PostgreSQL.
- **VALIDATED, narrowly:** one bounded typed persistence model plus one reusable local resolver rule can produce different public projections for two players at the same canonical node while falling back for missing/inactive state and omitting private/internal fields.
- Identity-specific QR, route, UI, multi-device, deployment, production, and field behavior are not validated because no consumer integration exists.

# 5. WHAT IS STILL MISSING

- No Functional scan route calls the resolver.
- No player-facing page renders an assigned message or resolver fallback.
- No authenticated API or Mission Control authoring surface creates, updates, or clears assignments.
- No application lifecycle sets `is_active=FALSE` or updates `updated_at`; those fields are persistence capabilities only.
- No Personal, Start/End, QuickStart, final-reflection, recovery, or broader five-node changes were made.
- No QR URL or destination behavior changed; the current six-destination system remains intact.
- No production migration execution, deployment, printed-QR check, mobile/device test, or field test occurred.
- Broader Task Pack 02 remains unimplemented.

# 6. WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

- The 1000-character message bound is a provisional experiment constraint, not a field-validated presentation limit.
- `is_active` is a provisional inactive/cleared representation; no authoring lifecycle uses it yet.
- `source` exists to make precedence observable and testable; no downstream consumer requirement has been validated.
- The memory client is a focused resolver harness, not a database emulator. PostgreSQL evidence separately covers actual constraints and queries.
- Authored defaults are supplied directly by tests because route/default-content integration is intentionally absent.

# 7. TESTING PERFORMED

## Structural checks

- Confirmed clean baseline and reconciled packet baseline with current `HEAD`.
- Inspected migration numbering, schema bootstrap convention, player identity representation, `STATIONS`, QR destinations, and existing test patterns.
- `git diff --check`
- Focused assertions compared `schema.sql` and `migrations/004_node_assignments.sql` for table, foreign key, canonical key, type, message-bound, active-state, and primary-key constraints.
- Focused source checks confirmed the six current QR routes and absence of resolver integration in `server.js` and `public/station.html`.

## Behavioral checks without PostgreSQL

- `node --test test/durable-player-identity.test.js`
- `node --test test/node-assignments.test.js`
- `npm test`

## Behavioral checks with disposable PostgreSQL

- Started only the repository's local `db` service with `docker compose up -d db`.
- Used `TEST_DATABASE_URL=postgres://artpark:artpark@localhost:5432/artpark`; each database test created and dropped its own randomly named schema.
- `TEST_DATABASE_URL=postgres://artpark:artpark@localhost:5432/artpark node --test test/node-assignments.test.js`
- `TEST_DATABASE_URL=postgres://artpark:artpark@localhost:5432/artpark npm test`
- Stopped the local database service after testing with `docker compose stop db`.

# 8. TEST RESULTS

- Pre-pass Task Pack 01 targeted test: 8 passed, 0 failed, 1 optional PostgreSQL test skipped.
- Focused resolver suite without PostgreSQL: 8 passed, 0 failed, 1 optional PostgreSQL test skipped.
- Full suite without PostgreSQL: 221 passed, 0 failed, 4 optional PostgreSQL tests skipped; 225 total.
- Focused resolver suite with PostgreSQL: 9 passed, 0 failed, 0 skipped.
- Full suite with PostgreSQL: 225 passed, 0 failed, 0 skipped.
- PostgreSQL evidence exercised migration idempotency, foreign-backed rows, exact player/node lookup, inactive fallback, node isolation, read-only row-count preservation, node/type constraints, blank-message rejection, and the 1000-character bound.
- No route, UI, device, deployment, production, or field behavior was tested because those surfaces were out of scope and unchanged.

## Causal proof

Persisted state:

```text
(AAA111, escape, assigned_message, Message A, active)
(BBB222, escape, assigned_message, Message B, active)
```

Same resolver, canonical node, type, active state, and authored default:

```text
AAA111 + escape → { nodeKey: escape, source: assignment, assignedMessage: Message A }
BBB222 + escape → { nodeKey: escape, source: assignment, assignedMessage: Message B }
```

The lookup player code selects a different persisted row; each selected row contains its player-specific message. The node key and reusable resolver rule remain constant. No player-specific route, random choice, or hard-coded player branch causes the difference.

# 9. IMPORTANT UNCERTAINTIES

- Whether a real Functional route can invoke the resolver before existing visit mutation without weakening cookie/identity authority.
- Whether the three-field projection is sufficient and clear for an actual mobile player presentation.
- How authorized assignment set/edit/clear behavior should manage `updated_at`, active state, and audit evidence.
- Whether the 1000-character bound produces usable player-facing content.
- Real multi-device identity behavior, production migration duration/data compatibility, deployed behavior, printed QR compatibility, and field usability remain unverified.
- PostgreSQL concurrency was not needed for read-only resolution and was not separately stress-tested.

# 10. RECOMMENDED NEXT EXPERIMENT

- **NOW:** Current claim: the isolated typed resolver contract works and preserves privacy → biggest uncertainty: whether one current Functional scan can resolve before its existing visit mutation without altering authorization or default behavior → minimum experiment: integrate read-only resolution into one isolated Functional route test harness for `escape`, using the existing durable cookie identity and keeping all UI/QR behavior unchanged → observable result: assigned identity returns assigned mode without a visit write, while unassigned identity follows the exact current Escape default and visit path.
- Do not begin that experiment automatically.
- **NEXT:** evaluate a bounded authenticated authoring mutation contract after read integration is proven.
- **LATER:** player UI, Mission Control UI, production migration/deployment, and device/field validation.
- **PARK:** five-node QR conversion, enrollment redesign, segmentation, scheduling, and generalized content systems.

# 11. FILES MODIFIED

- `schema.sql`
- `migrations/004_node_assignments.sql`
- `node-assignments.js`
- `test/node-assignments.test.js`
- `docs/pass-reports/2026-08-24_1141_task-pack-02-resolver-experiment.md`
- `docs/pass-reports/README.md`

# 12. COMMIT STATUS

`INCLUDED IN THIS COMMIT`
