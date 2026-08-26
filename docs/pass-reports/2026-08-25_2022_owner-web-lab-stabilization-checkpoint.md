# Owner Web Test Lab Stabilization Checkpoint

## PASS

- Task: review and commit the combined Web Test Lab, Broadcast Control Lab automatic-reconciliation, and test-database isolation hardening state.
- Objective: preserve the exact bounded state that passed the owner's physical-phone rehearsal, prove the pending diff contains no unrelated implementation, rerun the appropriate verification, and create one local checkpoint commit without pushing or deploying.
- Branch: `main`
- Starting SHA: `4f9c7cbb6b9621a394c8bb5f4bd015419428b77f`
- Commit message: `feat: stabilize owner web test lab workflow`
- Commit SHA: recorded as post-commit verification output because this report is included in the commit it documents.

## CURRENT REALITY BEFORE PASS

- **IMPLEMENTED:** starting SHA `4f9c7cb` already contained the owner-launchable Web Test Lab, its persistent local PostgreSQL launch path, LAN receiver URL/QR, and owner guide.
- **IMPLEMENTED:** the uncommitted Control Lab client polled the authenticated aggregate state modestly, rejected stale/overlapping responses, paused across hidden/unloaded page lifecycles, and stopped on session expiry.
- **IMPLEMENTED:** the uncommitted database-isolation layer made test mode select only `TEST_DATABASE_URL`, refused unapproved targets, created/dropped only process-owned schemas, sanitized child environments, and migrated all seven PostgreSQL-dependent test files to the shared guard.
- **TESTED:** the reconciliation and isolation layers had passed focused and complete suites before this review.
- **VALIDATED:** the owner had personally completed the narrow physical laptop/phone natural-boundary rehearsal after the reconciliation repair. That observation did not validate production, venue, real-media, restart, or long-session behavior.
- **SPECULATIVE:** broader broadcast packaging, LOOP behavior, media ingestion, QR mission integration, venue hosting, and production operations remained outside this checkpoint.

## WHAT CHANGED

- Reviewed the complete tracked diff and every untracked file at hunk level against the three named stabilization layers.
- Confirmed there was no unrelated FRNN implementation, migration, media, QR, LOOP, Mission Control, or new packaging work in the worktree.
- Reran structural, focused, ordinary, database-loaded, and cleanup verification without loading `.env.test-lab` or contacting the owner database.
- Added this commit-oriented audit report and its chronological index entry.
- Made no new product, schema, behavior, or refactor change during the commit review.

## WHAT WAS COMMITTED

The foundational Web Test Lab implementation was already present in the starting commit. This checkpoint commit contains the following pending stabilization layers:

### Web Test Lab integration and safety

- `.env.test.local.example`
- `.gitignore`
- `README.md`
- `database-config.js`
- `db.js`
- `docs/INFRASTRUCTURE.md`
- `docs/broadcast-control-lab/WEB_TEST_LAB.md`
- `package.json`
- `scripts/start-test-lab.js`
- `server.js`
- `web-test-lab-config.js`

These files distinguish the persistent owner launch path from automated test mode. They do not replace or redesign the already-committed Test Lab.

### Broadcast Control Lab automatic reconciliation

- `public/control-lab.js`
- `test/program-packager.test.js`
- `docs/pass-reports/2026-08-25_1744_control-lab-auto-reconciliation.md`

`test/broadcast-control-lab-http.test.js` also supports the real Control Lab path, but its pending diff is primarily the later shared database-isolation migration.

### Test database isolation

- `database-config.js`
- `db.js`
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
- `.env.test.local.example`
- `.gitignore`
- `README.md`
- `docs/INFRASTRUCTURE.md`
- `docs/broadcast-control-lab/WEB_TEST_LAB.md`
- `package.json`
- `web-test-lab-config.js`
- `docs/pass-reports/2026-08-25_2001_test-database-isolation-hardening.md`

### Checkpoint audit artifacts

- `docs/pass-reports/2026-08-25_2022_owner-web-lab-stabilization-checkpoint.md`
- `docs/pass-reports/README.md`

The earlier reconciliation and isolation reports retain their historically accurate `NOT COMMITTED` status for those individual passes. This report records their inclusion in the combined checkpoint commit.

## OWNER VALIDATION

The owner personally demonstrated this exact local sequence:

`owner laptop → Web Test Lab → authenticated Control Lab → Library item → Queue → START → physical phone ON AIR → natural completion → phone OFF AIR → already-open Control Lab automatically OFF AIR + empty Upcoming Queue without refresh`

This validates, narrowly, that one finite test-card Library item could traverse the owner-operated laptop and same-Wi-Fi physical-phone flow, naturally exhaust, and become visibly reconciled in both receiver and Control Lab without manual refresh.

It does not validate real image/video media, audio, restart during physical-phone playback, long sessions, multiple operator tabs, venue networking, production hosting, deployment, or production load.

## WHAT IS REAL NOW

- **IMPLEMENTED:** the owner Web Test Lab remains the canonical persistent local launch surface already present at the starting SHA.
- **IMPLEMENTED:** the open authenticated Control Lab automatically rereads authoritative NOW/Queue state approximately every three seconds while visible and idle.
- **IMPLEMENTED:** stale, overlapping, hidden-page, unloaded-page, and expired-session cases are bounded by the client lifecycle rules covered in tests.
- **IMPLEMENTED:** automated PostgreSQL tests select only the approved disposable test variable and use exact owned-schema lifecycle safeguards.
- **TESTED:** the complete reviewed source passes the focused reconciliation, focused isolation, relevant Broadcast PostgreSQL, ordinary, and database-loaded suites.
- **VALIDATED:** the owner-observed local physical-phone sequence above succeeded once under the stated local conditions.

## DATABASE SAFETY

- Automated tests did not load or use `.env.test-lab`.
- The persistent owner Test Lab database was not contacted during this commit review.
- Every database-loaded command used the URL from `.env.test.local`, which the shared guard identified as loopback `127.0.0.1:55432/frnn_integration_test`.
- A conflicting non-routable owner-looking `DATABASE_URL` was present during focused and complete database-loaded runs; test mode ignored it.
- No schema created by the current automated suite remained after testing for any exact current helper prefix.
- One pre-existing schema, `bcl_staging_e81c886_20260824_01`, remains in `frnn_integration_test`. Its name references the earlier `e81c886` BCL checkpoint, it existed before this verification, and it does not match a current helper-created UUID schema. It was preserved rather than silently deleted or misrepresented as current test residue.

## WHAT IS STILL MISSING

- Real image/video media has not been exercised through this owner physical-phone path.
- Audio behavior has not been exercised.
- Server restart during physical-phone playback has not been rehearsed.
- Longer sessions and repeated natural boundaries have not been owner-validated.
- Multiple simultaneous Control Lab tabs and transient network recovery have not been physically tested.
- Venue networking and production hosting remain untested.
- The provenance and intended retention of the pre-existing `bcl_staging_e81c886_20260824_01` disposable-database schema remain undocumented outside its name; this pass did not alter it.

## WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

- The successful phone rehearsal used a finite `test_card`, not real broadcast media.
- The adversarial owner-looking database URL was a non-routable fixture, not an owner connection.
- `.env.test.local.example` contains placeholder local test credentials.
- Three-second polling is a bounded owner-lab choice, not a measured production transport or load target.
- LOOP remains stored but causally inert.

## TESTING PERFORMED

Structural checks:

- `node --check` on all 16 changed or new JavaScript files.
- `git diff --check`.
- Complete path and hunk review of all tracked changes and untracked files.
- Source search for every current PostgreSQL pool, spawned-server environment, and owned-schema creation prefix.

Behavioral checks:

- `node --test test/program-packager.test.js`
- With conflicting owner-looking `DATABASE_URL`: `node --env-file=.env.test.local --test test/database-isolation.test.js`
- With the same conflict: `node --env-file=.env.test.local --test test/broadcast-control-lab-http.test.js test/broadcast-master-clock.test.js`
- `npm test`
- With the same conflict: `npm run test:database`
- Read-only post-suite query of `pg_namespace` in the guarded disposable database for every exact automated schema prefix.

## TEST RESULTS

- JavaScript syntax: 16 files passed.
- Diff whitespace: passed; output contained only line-ending conversion warnings.
- Focused reconciliation: 7 passed, 0 failed, 0 skipped.
- Focused database isolation: 6 passed, 0 failed, 0 skipped.
- Focused Broadcast HTTP/master clock: 9 passed, 0 failed, 0 skipped.
- Ordinary suite: 244 total; 232 passed, 12 intentional PostgreSQL skips, 0 failed.
- Canonical database-loaded suite: 244 passed, 0 failed, 0 skipped.
- Cleanup: zero schemas remained for the exact current automated-test prefixes.
- The broader first cleanup query disclosed the preserved pre-existing staging schema described under `DATABASE SAFETY`; no cleanup was attempted on it.
- Owner rehearsal: successful as reported by the owner; it was not unnecessarily repeated against the persistent database during this commit review.

## IMPORTANT UNCERTAINTIES

- One successful short test-card rehearsal does not establish behavior for media buffering, audio policy, restart recovery, weak Wi-Fi, long runtimes, or venue scale.
- Polling freshness can lag a natural boundary by approximately one polling interval plus request time.
- The local database guard proves the configured loopback target and live database name, not administrative ownership of the PostgreSQL server.
- Future PostgreSQL test files can still bypass the shared helper unless review or later static enforcement catches them.
- The pre-existing staging schema's retention intent should be established before any later cleanup operation.

## RECOMMENDED NEXT EXPERIMENT

Do not start automatically.

- **Current claim:** a finite test-card broadcast naturally completes on one physical phone and the open Control Lab reconciles without refresh.
- **Biggest uncertainty:** whether authoritative recovery remains coherent if the local server restarts while the physical phone is in playback.
- **Minimum experiment:** queue one finite test-card item, start it on one physical phone, restart the owner Test Lab server during playback, reopen only what the normal restart requires, and observe the phone and Control Lab against the persisted master-clock state.
- **Observable result:** both surfaces recover to the same authoritative active segment or OFF AIR state without duplicate queue consumption or manual state mutation.
- Classification: **NEXT**. Do not begin Media Bin, LOOP, QR mission integration, Program Packs, or unrelated feature work as part of this checkpoint.

## FILES MODIFIED

- `.env.test.local.example`
- `.gitignore`
- `README.md`
- `database-config.js`
- `db.js`
- `docs/INFRASTRUCTURE.md`
- `docs/broadcast-control-lab/WEB_TEST_LAB.md`
- `docs/pass-reports/2026-08-25_1744_control-lab-auto-reconciliation.md`
- `docs/pass-reports/2026-08-25_2001_test-database-isolation-hardening.md`
- `docs/pass-reports/2026-08-25_2022_owner-web-lab-stabilization-checkpoint.md`
- `docs/pass-reports/README.md`
- `package.json`
- `public/control-lab.js`
- `scripts/start-test-lab.js`
- `server.js`
- `test-support/disposable-postgres.js`
- `test/broadcast-control-lab-http.test.js`
- `test/broadcast-master-clock.test.js`
- `test/database-isolation.test.js`
- `test/durable-player-identity.test.js`
- `test/escape-assignment-integration.test.js`
- `test/escape-assignment-mutation.test.js`
- `test/frnn-foundation.test.js`
- `test/node-assignments.test.js`
- `test/program-packager.test.js`
- `web-test-lab-config.js`

## COMMIT STATUS

INCLUDED IN THIS COMMIT
