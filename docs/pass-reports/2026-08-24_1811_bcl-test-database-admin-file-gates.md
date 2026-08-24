# 1. PASS

- Pass/task name: BCL disposable PostgreSQL and exclusive admin-file gates
- Objective: Ensure Codex has a demonstrably disposable PostgreSQL target for integration tests and ensure only one task at a time may modify `public/admin.html`, without activating or implementing BCL Task Packet 01.
- Branch: `main`
- Baseline: `858afd24d38cb0f8f35bf0c815211abe44b16c3a` plus the uncommitted documentation-only BCL Director repair.

# 2. CURRENT REALITY BEFORE PASS

- `TEST_DATABASE_URL` and `DATABASE_URL` were absent from the current process environment.
- No local `psql` executable was installed.
- Docker Desktop was installed and running, but sandboxed Docker access was denied; approved out-of-sandbox inspection confirmed a working Docker 29.6.1 server.
- An existing stopped `frnn-app-db-1` container had unclear data ownership and was deliberately not used as a disposable target.
- The official `postgres:16-alpine` image was not initially present.
- `public/admin.html` was clean in the worktree.
- BCL Task Packet 01 was `READY_FOR_OWNER_ACTIVATION` but inactive; the Escape Mission Control authoring packet was `Pending`. Both packets claimed a future edit to `public/admin.html`, but only the BCL packet contained a reciprocal sequencing warning.

# 3. WHAT CHANGED

- Pulled the official `postgres:16-alpine` image.
- Created and started `frnn-bcl-test-postgres` with:
  - localhost-only binding `127.0.0.1:55432`;
  - dedicated test-only user/database;
  - tmpfs PostgreSQL data directory;
  - restart policy `no`;
  - label `frnn.purpose=disposable-integration-tests`;
  - PostgreSQL health check.
- Created ignored local `.env.test.local` containing only `TEST_DATABASE_URL` for the dedicated target. The value was not committed or printed in reports.
- Added a hard disposable-database activation gate to BCL Task Packet 01: use only `TEST_DATABASE_URL`, verify localhost/test database/container label, use unique temporary schemas, and never target `DATABASE_URL` or `frnn-app-db-1`.
- Added a reciprocal exclusive `public/admin.html` gate to both BCL Task Packet 01 and the pending Escape Mission Control authoring packet.
- Added the repository task-index rule that `public/admin.html` has one exclusive active owner and work stops on unowned drift.

# 4. WHAT IS REAL NOW

- **IMPLEMENTED environment:** a healthy, running, localhost-only, tmpfs-backed disposable PostgreSQL 16 container is available to Codex.
- **TESTED:** the focused Broadcast test file ran its real PostgreSQL integration rather than skipping it: 11 passed, 0 failed, 0 skipped.
- **TESTED:** the full suite ran with the disposable `TEST_DATABASE_URL`: 235 passed, 0 failed, 0 skipped.
- **TESTED cleanup:** after the suite, the test database contained only the `public` schema; temporary integration schemas were removed.
- **DESIGNED/ENFORCED IN PACKETS:** BCL and Escape now contain reciprocal stop conditions preventing concurrent `public/admin.html` ownership.
- **NOT ACTIVE:** neither packet was activated, and `public/admin.html` remains unmodified.

# 5. WHAT IS STILL MISSING

- BCL Task Packet 01 remains inactive and unimplemented.
- The exclusive-file rule is a Director/agent workflow gate, not an operating-system file lock. The Director must still name and verify the owner at activation.
- The container has restart policy `no`; after Docker/host restart, its tmpfs data is intentionally gone and the container may need to be started or recreated before tests.
- Future BCL migration/concurrency tests do not exist yet; this pass proves the test database can run current integrations safely, not the future packet behavior.

# 6. WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

- The PostgreSQL container is intentionally disposable test infrastructure, not production or development data storage.
- `.env.test.local` is ignored local configuration and is not portable repository configuration.
- Exclusive file ownership is procedural enforcement recorded in task packets; no fake claim of OS-level locking is made.
- No application behavior was added.

# 7. TESTING PERFORMED

## Infrastructure checks

- Verified Docker client/server availability.
- Verified container name, running/healthy state, localhost-only port binding, `restart=no`, tmpfs mount, and disposable-purpose label.
- Verified `.env.test.local` is ignored by `.gitignore`.
- Verified `public/admin.html` has no worktree modification.
- Verified BCL is inactive and Escape is Pending, and both packets contain the exclusive-file stop gate.

## Behavioral tests

- Loaded only `TEST_DATABASE_URL` from `.env.test.local` into the command process.
- Ran `node --test test/broadcast-master-clock.test.js`.
- Ran `npm test` with the same disposable target.
- Queried the test database afterward to verify temporary schemas were cleaned up.

# 8. TEST RESULTS

- Focused Broadcast tests: 11 passed, 0 failed, 0 skipped. The real PostgreSQL test `PostgreSQL persists the queue and anchor while enforcing mutation safety` passed.
- Full suite: 235 passed, 0 failed, 0 skipped.
- Post-test schema inventory: `public` only.
- `public/admin.html`: clean and currently unowned because neither claiming packet is active.

# 9. IMPORTANT UNCERTAINTIES

- Whether future task execution consistently honors the procedural exclusive-owner rule; every activation still needs a fresh Director check.
- Whether Docker is running after host restart; the activation gate requires a fresh health check.
- Whether Task Packet 01’s future migration and concurrent active-snapshot tests expose assumptions not covered by the current old-model integration.
- Whether the Escape or BCL packet should own `public/admin.html` first remains an owner sequencing decision; concurrency is prohibited either way.

# 10. RECOMMENDED NEXT EXPERIMENT

- **NOW:** current claim → Codex has safe disposable PostgreSQL and explicit file-ownership gates; biggest uncertainty → whether the chosen Task Packet 01 model works under real transactional migration/concurrency; minimum experiment → only after explicit owner activation, acquire `public/admin.html` ownership, reverify the labeled database, and execute the bounded BCL packet; observable result → new integration tests run with zero skips while no other task modifies the shared file.
- **NEXT:** release `public/admin.html` ownership at pass completion, then rebase and activate the other pending UI packet if requested.
- **LATER:** richer BCL/QR work only after the foundational experiment.
- **PARK:** using production/development databases for integration tests or allowing concurrent shared-file agents.

# 11. FILES MODIFIED

- `.env.test.local` — created locally and ignored; contains the disposable test connection only.
- `tasks/BCL_TASK_PACKET_01_LIBRARY_QUEUE_SNAPSHOT.md` — added disposable-database and exclusive-file activation gates.
- `tasks/FRNN_TEAM_TASK_PACK_02_ESCAPE_MISSION_CONTROL_AUTHORING_EXPERIMENT_V0_1.md` — added reciprocal exclusive-file gate.
- `tasks/README.md` — added shared-file execution rule.
- `docs/pass-reports/2026-08-24_1811_bcl-test-database-admin-file-gates.md` — created.
- `docs/pass-reports/README.md` — updated chronological index.
- External local environment: Docker image `postgres:16-alpine` and container `frnn-bcl-test-postgres` created.

# 12. COMMIT STATUS

NOT COMMITTED
