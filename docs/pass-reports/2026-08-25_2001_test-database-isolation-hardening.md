# Test Database Isolation Audit and Hardening

## PASS

- Task: FRNN test database isolation audit and hardening
- Objective: prevent automated PostgreSQL tests from selecting or mutating the persistent owner Test Lab database, make every database-dependent test path use one explicit disposable target, and prove cleanup behavior.
- Branch: `main`
- Starting commit: `4f9c7cbb6b9621a394c8bb5f4bd015419428b77f`
- Working-tree context: this pass began on top of the uncommitted Broadcast Control Lab automatic-reconciliation pass. Those pre-existing changes were preserved and were not treated as database-isolation work.

## INCIDENT

No owner-database mutation incident occurred during this pass. The audit found a real unsafe configuration path before hardening: `db.js` preferred `DATABASE_URL` over `TEST_DATABASE_URL`, while the Test Lab launcher loaded `.env.test-lab` before starting the server. A test-mode process that inherited the owner URL could therefore select the persistent database unless an individual test overrode configuration correctly.

The owner-looking adversarial URL used in tests was the non-routable fixture `postgres://owner.invalid:5432/owner_persistent`. It was never a real owner credential or connection.

## CURRENT REALITY BEFORE PASS

- **IMPLEMENTED:** the shared database pool selected `DATABASE_URL || TEST_DATABASE_URL`; test mode did not centrally prohibit the owner variable.
- **IMPLEMENTED:** `scripts/start-test-lab.js` loaded `.env.test-lab` without a test-mode exclusion.
- **IMPLEMENTED:** seven test files exercised PostgreSQL. Two Broadcast Control Lab paths had local database-name/host checks; five other database-dependent files had no shared runtime identity guard.
- **IMPLEMENTED:** several tests created unique schemas, but ownership and cleanup refusal were duplicated rather than enforced by one helper.
- **IMPLEMENTED:** ordinary `npm test` skipped PostgreSQL-dependent tests when no test URL was present.
- **DESIGNED:** `.env.test.local` named a disposable local integration database; its filename and documentation did not make it an enforced safety boundary.
- **TESTED:** selected Broadcast Control Lab database paths had previously been exercised against the local disposable database.
- **VALIDATED:** no general claim that all automated PostgreSQL paths were isolated from the owner Test Lab database was supported.

## DATABASE PATH MAP

| Path | Configuration source | Selected target after pass | Mutation boundary |
| --- | --- | --- | --- |
| Owner Web Test Lab | `npm run test-lab` loads `.env.test-lab` only outside test mode | `DATABASE_URL` | Persistent owner database; not used by automated tests |
| Ordinary automated suite | `npm test` with no `TEST_DATABASE_URL` | No PostgreSQL target | Database-dependent tests skip explicitly; the server refuses test mode if a DB is required |
| Database-loaded automated suite | `npm run test:database` loads `.env.test.local` | loopback `frnn_integration_test` only | One unique process-owned schema per test path |
| Spawned test servers | shared child-environment builder | scoped disposable URL copied to both database variables | Sanitized PG variables plus the owned schema search path |
| Direct migration/integration tests | shared disposable PostgreSQL helper | verified `frnn_integration_test` connection | create, verify, use, and drop only a registered owned schema |

## WHAT WAS VULNERABLE

The unsafe chain was:

`automated test process → inherited DATABASE_URL or loaded .env.test-lab → DATABASE_URL wins selection → shared pool connects → migrations/tests may mutate persistent schemas`

Individual test setup reduced risk in some paths but did not make the repository-wide invariant true. In particular, a test-mode server could fall back to `DATABASE_URL`, and the launcher could load owner settings before the server evaluated its environment.

## WHAT CHANGED

- Added one environment-aware database selector. `NODE_ENV=test` now selects only `TEST_DATABASE_URL`; all other modes select only `DATABASE_URL`. Missing selected configuration fails closed.
- Changed the Test Lab launcher so automated test mode never loads `.env.test-lab`.
- Added a shared disposable-PostgreSQL guard that requires a PostgreSQL URL on a loopback host and the exact database name `frnn_integration_test`.
- Added a live identity query before schema creation and deletion. Runtime `current_database()` must match the approved disposable database.
- Added process-local schema ownership. Only a schema created and registered by the current helper process can be scoped or dropped; cleanup refuses `public` and every unowned name.
- Sanitized spawned-server environments by removing PG host/database/search-path overrides, forcing test mode, and supplying the same verified scoped URL as both `DATABASE_URL` and `TEST_DATABASE_URL`.
- Migrated all seven PostgreSQL-dependent test files to the shared create/scope/drop safeguards.
- Added adversarial configuration tests for conflicting owner/test URLs, missing `TEST_DATABASE_URL`, Test Lab launcher isolation, invalid targets, hostile PG variables, unowned cleanup, sentinel containment, and zero helper-owned schemas after cleanup.
- Added `npm run test:database`, a tracked safe example file, and operator documentation distinguishing the owner Test Lab from automated tests.
- No product behavior, database schema, or owner data was changed.

## SAFETY INVARIANTS

1. Test mode never falls back from `TEST_DATABASE_URL` to `DATABASE_URL`.
2. The automated Test Lab launcher never loads `.env.test-lab`.
3. Database-dependent tests accept only loopback PostgreSQL URLs naming exactly `frnn_integration_test`.
4. A live identity query must confirm the database name before schema creation or deletion.
5. Spawned children receive a verified owned-schema URL through both supported variables and cannot inherit `PGHOST`, `PGDATABASE`, or `PGOPTIONS` overrides.
6. Cleanup can drop only a schema registered as created by the current process.
7. No destructive operation targets a whole database, `public`, a wildcard, or an unresolved name.

## ADVERSARIAL TESTS

- Supplied a conflicting owner-looking `DATABASE_URL` while the approved `TEST_DATABASE_URL` was loaded; the complete database suite still passed.
- Removed `TEST_DATABASE_URL` while leaving the owner-looking variable present; direct server startup failed before attempting a connection.
- Repeated the missing-test-variable case through `scripts/start-test-lab.js`; the launcher ignored `.env.test-lab` and failed closed.
- Rejected a remote host, an owner-named database, and a pre-scoped `public` URL before mutation.
- Injected hostile `PGHOST` and `PGOPTIONS`; the child environment removed them and retained the verified scoped URL.
- Created a sentinel table through the scoped connection and observed the approved database and owned schema as the active identities.
- Attempted to clean up `public`; the ownership guard refused.
- Queried PostgreSQL after the complete run and found zero schemas matching the FRNN automated-test naming pattern.

## OWNER DATA CHECK

- No connection was opened using `.env.test-lab` or its `DATABASE_URL` during this pass.
- No command was run against the configured owner database.
- No owner tables, rows, schemas, migrations, or audit records were read, modified, deleted, or cleaned up.
- The real local configuration files were inspected only far enough to map host, port, and database name; credentials were not copied into tests or reports.
- Because the safety objective was isolation, the evidence is prevention and non-contact rather than a before/after owner-data query.

## WHAT IS REAL NOW

- **IMPLEMENTED:** central test-mode database selection fails closed and cannot choose an inherited owner `DATABASE_URL`.
- **IMPLEMENTED:** every currently discovered PostgreSQL-dependent automated test uses the common disposable target and owned-schema lifecycle.
- **IMPLEMENTED:** direct and spawned-server test paths share the same environmental and cleanup safeguards.
- **TESTED:** the ordinary suite passes without PostgreSQL while reporting explicit skips for database-dependent tests.
- **TESTED:** the complete database-loaded suite passes with an intentionally conflicting owner-looking `DATABASE_URL`.
- **TESTED:** post-suite inspection found no remaining FRNN test schemas in the disposable database.
- **VALIDATED:** the current automated test entry points select the disposable database under the exercised local configuration. This does not validate production operation or the owner Web Test Lab workflow.

## WHAT IS STILL MISSING

- The repository does not provision `frnn_integration_test`; an operator or CI environment must create and own the disposable database before running database-loaded tests.
- There is no automated ephemeral PostgreSQL container lifecycle in the test command.
- The owner Test Lab startup path was structurally tested for environment-selection policy but deliberately not launched against owner data in this pass.
- The guard cannot prevent a future test author from bypassing the shared helper with an unrelated raw PostgreSQL client; code review and the isolation tests remain part of the boundary.
- The policy is intentionally narrow: non-loopback CI databases and differently named disposable databases are refused until an explicit, reviewed design expands the allowlist.

## WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

- The owner-looking adversarial URL is a non-routable fixture, not an owner connection.
- The isolation sentinel table is temporary test evidence inside a disposable owned schema.
- `.env.test.local.example` contains placeholder credentials and requires local adaptation.
- No fake owner-database query or simulated before/after owner-data result is presented.

## TESTING PERFORMED

Structural checks:

- `node --check` on the central selector, pool/server/launcher configuration, shared helper, isolation test, and all seven PostgreSQL-dependent test files.
- `git diff --check`.
- Source audit of PostgreSQL pool construction and spawned-server paths to confirm current test files route through the shared helper.

Behavioral checks:

- `node --test test/database-isolation.test.js test/web-test-lab.test.js`
- With conflicting owner-looking `DATABASE_URL`: `node --env-file=.env.test.local --test test/database-isolation.test.js`
- With the same conflict: `node --env-file=.env.test.local --test test/broadcast-control-lab-http.test.js test/broadcast-master-clock.test.js`
- With the same conflict: the five remaining PostgreSQL-dependent files.
- `npm test`
- Final adversarial database-loaded run: `node --env-file=.env.test.local --test --test-reporter=dot`
- Read-only `pg_namespace` query after the final run for FRNN automated-test schema names.

## TEST RESULTS

- Syntax checks: passed for all 14 affected JavaScript files.
- Diff whitespace check: passed; Git emitted only existing line-ending conversion warnings.
- No-database focused tests: 10 total, 9 passed, 1 database integration test explicitly skipped, 0 failed.
- Adversarial isolation tests with PostgreSQL: 6 passed, 0 failed.
- Broadcast Control Lab PostgreSQL focus: 9 passed, 0 failed.
- Remaining PostgreSQL focus: 33 passed, 0 failed.
- Ordinary complete suite: 244 total, 232 passed, 12 PostgreSQL-dependent skips, 0 failed.
- Final database-loaded complete suite: 244 passed, 0 failed, with the conflicting owner-looking variable present.
- Cleanup inspection: `remaining_test_schemas` was empty.
- During development, the first live-identity run safely failed before schema creation because Docker exposed a bridge address through `inet_server_addr()`. The final rule retains the configured loopback-host check and live database-name check rather than incorrectly treating the server's internal bridge address as the client connection target.
- The first invocation of the final read-only cleanup one-liner had a PowerShell quoting syntax error and did not connect; the corrected invocation succeeded and returned the empty result above.

## IMPORTANT UNCERTAINTIES

- Loopback URL plus exact live database identity protects the tested local topology, but it does not prove administrative ownership of the PostgreSQL server itself.
- Docker's reported server address is a bridge address even when the client connects through loopback port forwarding, so live server-address equality is not an enforceable invariant in this topology.
- CI will need an explicit decision: preserve the exact local-only policy or add a separately reviewed disposable-CI allowlist.
- Future database-dependent test files must adopt the shared helper; automated static enforcement of that convention does not yet exist.

## RECOMMENDED NEXT EXPERIMENT

- **Current claim:** the first Broadcast Packager and automatic Control Lab reconciliation pass are ready for the previously deferred owner Web Test Lab phone rehearsal, while automated PostgreSQL tests are now isolated from that owner path.
- **Biggest uncertainty:** whether a real receiver remains aligned through a physical natural boundary and server restart in the owner Test Lab.
- **Minimum experiment:** deliberately launch the owner Test Lab, connect one physical phone, cross one natural boundary, restart the server, and record the receiver/control states before and after without running automated tests concurrently.
- **Observable result:** the phone remains or returns to the authoritative active segment with an inspectable reconciliation reason and no automated-test schemas or sentinel data in the owner database.
- Classification: **NEXT**. Do not broaden the database policy or add CI topology until that work is explicitly requested.

## FILES MODIFIED

- `.env.test.local.example`
- `.gitignore`
- `README.md`
- `database-config.js`
- `db.js`
- `docs/INFRASTRUCTURE.md`
- `docs/broadcast-control-lab/WEB_TEST_LAB.md`
- `docs/pass-reports/2026-08-25_2001_test-database-isolation-hardening.md`
- `docs/pass-reports/README.md`
- `package.json`
- `scripts/start-test-lab.js`
- `server.js`
- `test-support/disposable-postgres.js`
- `test/database-isolation.test.js`
- `test/broadcast-control-lab-http.test.js`
- `test/broadcast-master-clock.test.js`
- `test/durable-player-identity.test.js`
- `test/escape-assignment-integration.test.js`
- `test/escape-assignment-mutation.test.js`
- `test/frnn-foundation.test.js`
- `test/node-assignments.test.js`
- `web-test-lab-config.js`

Pre-existing uncommitted Control Lab files that were preserved but not modified for this isolation objective are not included in this list.

## COMMIT STATUS

NOT COMMITTED
