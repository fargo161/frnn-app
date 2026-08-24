# TASK PACK 01 — Durable Player Identity v0.1

**Document type:** Implementation Task Packet
**Reality state:** DESIGNED — not proof of implementation
**Baseline:** `2904e4bd288077e54d0ef21fc73fc1e38f5beae0`
**Required branch:** `main`
**Status:** Pending
**Created:** 2026-08-24

> This packet defines work requested from the stated baseline. Source code, runtime behavior, and behavioral tests remain authoritative for what is actually implemented.

## OBJECTIVE

Make a real player's access/recovery credential a durable ownership boundary that normal gameplay reset, route repair, QuickStart, and Issue Next cannot recycle to another player.

The implementation must establish:

```text
ONE REAL PLAYER
→ ONE DURABLY OWNED IDENTITY
→ ONE DURABLE ACCESS / RECOVERY CODE
→ NORMAL GAMEPLAY OPERATIONS NEVER RELEASE IT
```

Only an explicit authenticated, strongly confirmed, audited identity-deletion action may release a real credential. This pack does not implement multipurpose nodes or a full Master/Producer account system.

## CURRENT REALITY

Confirmed on clean local `main` at `2904e4bd288077e54d0ef21fc73fc1e38f5beae0`, matching local `origin/main` tracking state at preparation time:

- `access_codes.code` is the credential key; there is no durable ownership column.
- `players.code` is a persistent row keyed to `access_codes`, and profiles/history are also keyed by code.
- `quick-start.js` allocates only `status='unused'`, `allocated_at IS NULL`, non-test rows, using `FOR UPDATE SKIP LOCKED`.
- `POST /api/admin/codes/issue` uses the same operational eligibility and has no ownership predicate.
- `ensurePlayerIdentity` inserts a `players` row and marks a code active. It is reached by QuickStart, manual authorization, Functional scan authorization, and non-empty route repair.
- normal player reset deletes visits, responses, final reflection, and `quick_start_claims`; it then sets the code to `unused` and clears allocation/activation timestamps.
- empty route repair repeats the same release behavior.
- reset preserves the `players` row, profile, profile history, audit history, and prize history.
- therefore the source preserves Player A's records while making Player A's credential eligible for Player B. A persistent row is currently not durable ownership.
- the dedicated test reset keeps TEST01–TEST05 reusable and separate from production metrics.
- Mission Control is a shared-passphrase privileged operator boundary, not a Master/Producer permission system.
- `data/access_codes.csv` is tracked; the importer defaults to it; the generator defaults to another ordinary file under `data/`; `.gitignore` does not protect local credential inventories.
- the tracked credential values were not printed during preparation. Because they are in public Git history, they cannot be treated as private durable production credentials in a future deployment.
- numbered migrations currently end at `002_broadcast_master_clock.sql`; `db.js` runs `schema.sql` before unapplied numbered migrations under an advisory lock.
- the current test suite passes 205 tests and skips 2 PostgreSQL tests because `TEST_DATABASE_URL` is not configured. Many identity/reset assertions are source-structure tests; one current test explicitly expects reset to release QuickStart mappings.

Reality classification:

- **IMPLEMENTED:** code-keyed records, operational status/allocation, cookie continuity, QuickStart token claims, profile/history preservation, test-code isolation.
- **TESTED:** current structural and in-memory concurrency behavior; current full suite on the preparation baseline.
- **DESIGNED, not implemented:** durable ownership, non-releasing gameplay reset, release-only identity deletion, private credential workflow.
- **NOT VALIDATED:** the claim that one real player cannot transfer accidentally; current source demonstrates the opposite path.

## DESIGN CLAIM

An explicit ownership marker can separate permanent identity ownership from resettable gameplay state without deleting current player records or weakening the reusable test fixtures.

Preferred bounded representation:

```text
access_codes.claimed_at IS NULL
→ never durably owned

access_codes.claimed_at IS NOT NULL
→ durably owned by the code-keyed player identity
```

For real players, first identity creation sets `claimed_at` once in the same locked transaction. Normal authorization and gameplay operations never clear or rewrite it. Test codes remain an explicit, narrow exception.

## BIGGEST UNCERTAINTY

Whether all existing non-test `players` rows are trustworthy evidence of durable ownership in the real database. Repository source supports that backfill rule, but production data was not inspected. If production contains ambiguous or intentionally disposable non-test player rows, the migration must stop for an explicit remediation decision rather than guessing.

## TEAM ROLES

### 1. Reality / Source Auditor

- **Responsibility:** Reconfirm the baseline and enumerate every allocator, identity creator, reset/release path, recovery path, and code lifecycle mutation before edits.
- **Likely areas:** `server.js`, `quick-start.js`, `schema.sql`, `migrations/`, `mission-control.js`, `public/admin.html`, relevant tests and current docs.
- **Required inputs:** this packet, repository `AGENTS.md`, clean synchronized `main`.
- **Required outputs:** a read-only path matrix covering creation → ownership → reset → allocation → recovery → deletion, plus contradictions against this packet.
- **Dependencies:** none. All implementation roles wait for this output.

### 2. Data & Migration Engineer

- **Responsibility:** Define durable ownership storage and safe backfill; keep production and test semantics explicit.
- **Likely owned files:** `schema.sql`, new `migrations/003_*.sql` from this baseline, narrowly related migration tests.
- **Required inputs:** auditor path matrix and confirmed database bootstrap order.
- **Required outputs:** idempotent additive ownership migration, safe real-player backfill, test-code exception, and disposable PostgreSQL evidence when available.
- **Dependencies:** Reality / Source Auditor.

### 3. Server / Domain Engineer

- **Responsibility:** Make first claim atomic; constrain QuickStart and Issue Next; separate gameplay reset from identity release; preserve recovery continuity.
- **Likely owned files:** `server.js`, `quick-start.js`, and only narrowly needed helpers in `mission-control.js`.
- **Required inputs:** ownership schema contract and auditor path matrix.
- **Required outputs:** one consistent ownership rule across every real first-claim path, non-releasing reset/empty-repair behavior, dedicated release API, audit events, and explicit test-code handling.
- **Dependencies:** Data & Migration Engineer. This role is the sole owner of `server.js` during the pass.

### 4. Credential Workflow Engineer

- **Responsibility:** Remove live credential inventory from normal tracked use and make generation/import private-by-default.
- **Likely owned files:** `.gitignore`, `scripts/generate-codes.js`, `scripts/import-codes.js`, `data/` example/placeholder files, narrow operational documentation notes.
- **Required inputs:** confirmed current scripts and tracked-file status.
- **Required outputs:** ignored local/private convention, safe generator default, explicit importer behavior, non-secret example if useful, and a remediation warning without printing credentials.
- **Dependencies:** Reality / Source Auditor. May proceed in parallel with Data & Migration after the file boundary is agreed.

### 5. Mission Control / UI Engineer

- **Responsibility:** Present unambiguous `RESET GAMEPLAY` and a separate strongly confirmed `DELETE PLAYER IDENTITY + RELEASE CREDENTIAL` control.
- **Likely owned files:** `public/admin.html`, narrowly required styles.
- **Required inputs:** final server API/error contract.
- **Required outputs:** typed-code or equivalently strong confirmation, clear irreversible warning, no bulk deletion, and refreshed operator state after either action.
- **Dependencies:** Server / Domain Engineer API contract. This role does not alter server routes.

### 6. Test / Adversarial QA

- **Responsibility:** Prove consequences across state transitions, not merely the presence of a column or endpoint.
- **Likely owned files:** a focused durable-identity test file plus updates to obsolete reset/allocation expectations in existing tests.
- **Required inputs:** stable data and server contracts.
- **Required outputs:** in-memory/domain tests, endpoint/source contract checks where necessary, and a disposable PostgreSQL scenario for the transfer/recovery contradiction.
- **Dependencies:** Data, Server, and UI contracts. Test design may begin after audit; final assertions wait for integration.

### 7. Integrator / Documentation Stabilizer

- **Responsibility:** Merge in dependency order, resolve only in-scope conflicts, reconcile current docs, run stabilization, and produce the implementation report.
- **Likely owned files:** `README.md`, `FIELD_OPERATIONS_QUICKSTART.md`, `docs/LEGACY_ARTPARK_OPERATIONS.md`, relevant current architecture wording, and this packet's appended report if the team uses that convention.
- **Required inputs:** all role outputs and test evidence.
- **Required outputs:** coherent bounded diff, calibrated reality labels, final evidence/gaps, and Pack 02 gate decision.
- **Dependencies:** all implementation and QA roles.

## REQUIRED CHANGES

### Durable ownership

- Add `access_codes.claimed_at TIMESTAMPTZ` through the next additive numbered migration and keep the current bootstrap schema coherent with the migration runner's schema-first order.
- Backfill `claimed_at` for non-test credentials with authoritative existing player identity evidence. At minimum, evaluate `players`; inspect dependent records for contradictions.
- Do not mark TEST01–TEST05 as durable production identities.
- Make first real identity claim lock the access-code row, create/converge the player row, and set `claimed_at=COALESCE(claimed_at,NOW())` in one transaction.
- Include `claimed_at` in internal player lifecycle reads where needed, without exposing private inventory.

### Allocation and continuity

- Add `claimed_at IS NULL` to QuickStart and Issue Next eligibility. Retain the existing non-test, operational status/reservation constraints that remain meaningful.
- An owned code stays excluded even if visits are empty or legacy operational fields are accidentally reset.
- Preserve the same browser/token → same code claim mapping during gameplay reset.
- Audit every real path that calls or duplicates `ensurePlayerIdentity`, including manual authorization, body-code Functional scan behavior, and route repair. All real first-claim paths must agree on ownership.
- Do not redesign the five-node model in this pack; Pass 02 owns entry-route simplification.

### Gameplay reset versus identity deletion

- Define normal reset as clearing only visits, station responses, final reflection, and any directly equivalent current quest state.
- Preserve claimed ownership, active usability, player row, QuickStart continuity, profile/history, audit, and prize history.
- Make empty route repair obey the same ownership-preserving rule; it must not be a hidden release path.
- Keep the dedicated test-code reset explicitly reusable.
- Add one authenticated dedicated identity-release route. Require exact code confirmation (normalized consistently), an access-code row lock, a dedicated audit action, and no bulk variant.
- The release transaction must deliberately remove the identity's gameplay, QuickStart mappings, profile and profile history, player row, and any other explicitly chosen identity-owned records before clearing ownership/allocation/activation state. If prize-history retention conflicts with foreign keys or policy, stop and obtain a decision; do not silently erase or reassign it.
- Profile clear/edit remains metadata management and must not release identity ownership.

### Credential repository hygiene

- Remove the current live/default inventory file from active tracked use without printing or regenerating its contents.
- Add an ignored convention such as `data/access_codes.local.csv` and `data/access_codes_*.private.csv`.
- Make code generation write to an ignored local/private file by default.
- Make import require an explicit path or use the ignored local default with a clear missing-file error; it must not silently rely on a public tracked inventory.
- A tracked example may contain only headers or unmistakably fake non-production values.
- Document: `PRODUCTION REMEDIATION REQUIRED` — historical tracked values are compromised for future durable-identity use. This pack does not authorize production rotation, database mutation, deployment, or Git history rewriting.

### Documentation and obsolete tests

- Replace misleading claims that a reset identity is both persistent and safely reusable. State the difference between gameplay reset and identity deletion.
- Update tests that currently require `quick_start_claims` deletion or `unused` reset for production identities.
- Preserve historical documents as historical; reconcile current operational instructions without rewriting history.

## DATA / STATE TRANSITIONS

### First real claim

```text
player submits an authorized first claim
→ access code locked
→ rule: non-test + claimed_at IS NULL + operationally eligible
→ players row created/converged
→ claimed_at set once + browser/token continuity stored
→ same player identity becomes usable
→ every allocator excludes that credential thereafter
```

### Gameplay reset

```text
privileged operator chooses RESET GAMEPLAY
→ access code locked
→ visits + responses + final reflection cleared
→ claimed_at + player + profile/history + QuickStart mapping preserved
→ player sees fresh quest state under the same identity
→ fresh Player B cannot receive Player A's code
```

### Recovery / same browser

```text
Player A returns with existing cookie or QuickStart token
→ durable ownership and mapping resolved
→ no allocator runs for A
→ same code and profile restored
```

### Explicit release

```text
authenticated operator
→ dedicated destructive control
→ exact credential confirmation
→ locked transaction deletes the specified identity-owned state
→ dedicated audit evidence retained
→ claimed_at and operational reservation cleared
→ only now may the credential re-enter never-owned inventory
```

## INVARIANTS

- Normal gameplay reset never clears `claimed_at`, deletes the player/profile/history, or deletes durable QuickStart continuity.
- QuickStart and Issue Next never return a real credential with `claimed_at IS NOT NULL`.
- Real first claim is transactional and deterministic under concurrency.
- Test fixtures remain reusable through an explicit `is_test=TRUE` path, not a weakened production rule.
- The four Functions remain exactly ESCAPE, ATTENTION, ACCESS, and SENSORY; this pass adds no Function semantics.
- Player cookies are not weakened and private profile fields remain operator/owner scoped as they are now.
- No credential inventory or regenerated real codes appear in reports, fixtures, or committed docs.
- Shared-passphrase Mission Control is described as provisional privileged authority, not as an implemented Master role.
- Existing quest, final-reflection, Drawing Pool, Program/Broadcast, and player-shell behavior changes only where reset/release semantics require it.

## OUT OF SCOPE

- Multipurpose Personal/Functional nodes or assignment resolution.
- Retiring Start/End or changing canonical QR count.
- Full Master/Producer accounts, RBAC, identity merge, reassignment, bulk deletion, or duplicate-person detection.
- Credential rotation, production database migration execution, deployment, provider changes, or Git history rewrite.
- New quests, Broadcast/media/upload/news work, social features, or broad architecture cleanup.

## STOP CONDITIONS

Stop and report rather than improvise if:

- current `HEAD` is not the reviewed baseline or a deliberately reviewed descendant, or local/remote `main` has diverged;
- production data inspection shows ambiguous non-test `players` rows or another ownership source contradicting the proposed backfill;
- a safe backfill would require deleting or merging current player/profile/history data;
- identity release cannot be separated from normal reset without an unrelated redesign;
- prize/audit foreign-key or retention policy makes exact identity-deletion semantics ambiguous;
- the tracked inventory is actively coupled to production and remediation would mutate production state;
- disposable migration evidence reveals contradictory legacy data;
- completion would require Pass 02 route redesign or unrelated feature work.

## ACCEPTANCE CRITERIA

1. Real ownership is explicitly persisted and backfilled safely.
2. Every real first-claim path sets ownership atomically and never rewrites the first claim time on repeat use.
3. QuickStart and Issue Next require `claimed_at IS NULL` and exclude an owned reset identity.
4. Normal gameplay reset and empty route repair clear quest state but preserve ownership, active recovery continuity, player, profile/history, audit, and prize history.
5. Player A's same browser/token and recovery path still resolve Player A after reset without consuming another credential.
6. Fresh Player B receives a different never-owned credential and cannot see Player A's profile.
7. A dedicated authenticated, strongly confirmed, audited destructive action is the only supported real-identity release path.
8. TEST01–TEST05 remain explicitly reusable without making real identities recyclable.
9. The tracked live/default credential inventory is removed from active use; future generation/import is private-by-default.
10. No fresh credential set is committed or printed.
11. Targeted behavioral tests, disposable PostgreSQL tests when available, full `npm test`, and `git diff --check` pass.
12. Current docs accurately distinguish IMPLEMENTED behavior from the future Master role and Pass 02 design.

## BEHAVIORAL TESTS

### Required transfer/recovery proof

```text
claim real Player A with token A
→ save Player A profile
→ record at least one visit and response
→ RESET GAMEPLAY
→ assert gameplay rows cleared
→ assert claimed_at/player/profile/history/token A mapping retained
→ claim fresh Player B with token B
→ assert Code B != Code A
→ assert Player B cannot read Player A profile
→ reuse token A / recovery
→ assert same Code A and profile, with no new credential consumed
```

### Allocation predicate

- Hold `claimed_at` set while varying `status`, `allocated_at`, visits, and profile completeness; QuickStart and Issue Next must still exclude the code.
- Include a never-owned control credential and prove it is the only eligible result.

### Concurrency

- Two concurrent first-claim attempts must converge on exactly one durable ownership result.
- Near-simultaneous requests with the same QuickStart token must consume one code and reuse it.

### Reset versus release

- Normal reset preserves ownership and continuity and emits a gameplay-reset audit action.
- Empty route repair cannot release ownership.
- Identity release fails without authenticated privilege or exact confirmation.
- Successful release removes only the specified identity state, retains required audit evidence, clears ownership, and makes that credential eligible only after commit.

### Test exception

- Test reset returns a test fixture to its intended reusable state.
- No test fixture enters production allocation because `is_test=FALSE` remains mandatory.

### Credential workflow

- Generator default resolves to an ignored/private path.
- Import with no configured local file fails clearly and does not fall back to tracked live codes.
- Repository checks confirm no real credential inventory is newly tracked.

### Evidence levels

- Column/table/route regex assertions are **structural** only.
- In-memory locking tests are **TESTED domain behavior**, not production migration proof.
- Disposable PostgreSQL transition tests are required for the core ownership/backfill/release path when a safe `TEST_DATABASE_URL` is available.
- Production identity durability remains **UNVERIFIED** until separately migrated and exercised under an authorized production pass.

## INTEGRATION ORDER

```text
Reality / Source Auditor
        ↓
Data & Migration Engineer
        ↓
Server / Domain Engineer
        ├──────────────→ Credential Workflow Engineer
        ↓
Mission Control / UI Engineer
        ↓
Test / Adversarial QA
        ↓
Integrator / Documentation Stabilizer
```

Credential workflow work may run in parallel after audit because it owns separate files. `server.js` has one owner. Schema, server, UI, and test changes must land in that order so tests target one stable state contract.

## STABILIZATION CHECK

- Re-read the complete diff and confirm there are no Pass 02 node/QR changes.
- Search every mutation of `status`, `allocated_at`, `activated_at`, `claimed_at`, `players`, and `quick_start_claims`; classify each as claim, gameplay reset, test reset, repair, or explicit release.
- Confirm `schema.sql` plus numbered migrations work for both a fresh database and an upgrade path.
- Confirm current full tests no longer encode production identity recycling as expected behavior.
- Run targeted durable-identity tests, any safe disposable PostgreSQL tests, full `npm test`, and `git diff --check`.
- Inspect `git status` and tracked `data/` paths without displaying credential contents.
- Verify the implementation report distinguishes TESTED repository behavior from UNVERIFIED production migration/deployment.
- Do not open Pack 02 unless every gate item below has evidence.

## IMPLEMENTATION REPORT

The implementing team must return exactly these subsections:

### WHAT WAS REAL BEFORE

Exact creation, reset, allocation, recovery, test-code, and credential-file behavior confirmed at execution baseline.

### WHAT CHANGED

Exact ownership model, allocator predicates, reset semantics, release control, and credential workflow.

### FILES CHANGED

Each important file and its bounded purpose.

### DATABASE CHANGES

Migration name, backfill rule, test-code treatment, fresh/upgrade evidence, and any production prerequisite.

### BEHAVIORAL PATH

```text
new player → durable claim
gameplay reset → same identity
fresh player → different identity
explicit privileged delete → release
```

### TESTS RUN

Separate structural, in-memory behavioral, PostgreSQL integration, full regression, and manual UI evidence.

### WHAT REMAINS UNVERIFIED

Production data/backfill, real device/browser recovery, provider state, or other unexercised behavior.

### CONTRADICTIONS / PROVISIONAL ELEMENTS

Include shared-passphrase authority, test-code exception, and any documentation/runtime mismatch.

### SECURITY / PRIVACY RESULT

Confirm no inventory was printed or freshly committed; state `PRODUCTION REMEDIATION REQUIRED` if historical credentials remain unsuitable.

### PASS 01 → PASS 02 GATE

For each gate item, cite the exact test/runtime evidence or mark it unproven:

1. durable ownership exists;
2. normal gameplay reset preserves it;
3. reset identity is not allocatable;
4. fresh Player B cannot inherit Player A;
5. Player A recovery still works;
6. explicit privileged deletion is the only release path;
7. future credential inventory is not normally committed.

### NEXT EXPERIMENT

Recommend only the smallest remaining evidence-gathering step. Do not begin Pack 02 automatically.

## COMMIT / PUSH BOUNDARY

The implementation team may commit one bounded Pass 01 application/documentation change to `main` only after the acceptance criteria and stabilization check pass and the complete diff is reviewed. Recommended commit message: `feat: make player identity durable`.

Push to `origin main` is permitted only when local `main` is synchronized, no unrelated changes are included, and no force push is required. A successful push does not authorize deployment, production migration, credential rotation, or Pack 02 execution. Record the resulting full commit SHA and remote result. The Director preparing this packet must not commit application changes.
