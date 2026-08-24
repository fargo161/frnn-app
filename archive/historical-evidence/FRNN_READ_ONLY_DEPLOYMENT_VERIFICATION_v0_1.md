# FRNN Read-Only Deployment Verification v0.1

## 1. Executive Verdict

**READY AFTER SPECIFIC PRECONDITIONS**

The canonical `frnn-app/main` is clean and synchronized at the reviewed SHA. The Docker image builds from the repository root, all 184 tests pass against disposable PostgreSQL, migration 001 succeeds and reruns idempotently, deliberate legacy name conflicts stop and roll back cleanly, stable routes are preserved, and the old deployed application was proven to start and write safely after the new migration.

The source switch must not occur until these production-only preconditions are satisfied:

1. Take and verify a production PostgreSQL snapshot or logical backup.
2. Run the prepared read-only duplicate-name audit against production and obtain zero conflict rows.
3. Verify the current Render environment-variable names and the non-secret values for `PUBLIC_BASE_URL`, `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ENDPOINT`, and `R2_PUBLIC_BASE_URL` without exposing secrets.
4. Perform authenticated, read-only R2 `HeadBucket`, bounded list, and known-object metadata checks. Public delivery works, but local S3 credentials were unavailable for authenticated verification.
5. Record the current Render deploy SHA and confirm the database provider/snapshot mechanism before changing source.
6. Disable Auto-Deploy and verify that reconnecting the source will not trigger an uncontrolled deployment.

No production or external system was mutated during this verification.

## 2. Repository State

| Item | Result |
|---|---|
| Local repository | `C:\Users\mcdon\Documents\ChatGPT\frnn-app` |
| Branch | `main` |
| Local HEAD | `91f60d8ee4795a997b50f556f6ffdd21afcc2cda` |
| Remote | `https://github.com/fargo161/frnn-app.git` |
| Remote `main` | `91f60d8ee4795a997b50f556f6ffdd21afcc2cda` |
| Ahead/behind | `0 / 0` |
| Worktree | Clean; no unexpected files |
| Reviewed foundation | `da926893e2ab221e142585e7d3e1b28b8b3f3c70` is an ancestor |
| Historical deployed `main` | `881eb1dd013c46fb2c387aa5828a4b096e672551` |

`git fetch --all --prune` completed before comparison. The Field Reports/slideshow branch and launcher/automatic-final branch are not ancestors of the reviewed foundation and were not carried into `frnn-app`.

The foundation delta from historical `881eb1d` changes 14 files and adds the event/player-shell foundation. The canonical bootstrap commit then adds only infrastructure documentation, placeholder configuration, an unused S3-compatible adapter boundary, its dependency, and tests.

## 3. Render Compatibility

The supplied current Render configuration is compatible with the new repository, subject to production preconditions.

| Check | Classification | Evidence |
|---|---|---|
| Repository root build | PASS | Local Docker build completed from `frnn-app` root. |
| Root Directory unset | PASS | `Dockerfile`, package files, `server.js`, static files, schema, and migrations are all rooted correctly. |
| Dockerfile path `./Dockerfile` | PASS | File exists and built successfully. |
| Build context `.` | PASS | Complete image built with this context. |
| Docker command override unset | PASS | Image has `CMD ["npm","start"]`. |
| Pre-deploy command unset | PASS | Migrations execute in application startup; no separate command is required. |
| Runtime Docker | PASS | Local Docker image build passed. |
| Region/instance | PASS WITH PRECONDITION | No code-level region dependency; Free-instance cold starts can lengthen migration/health readiness. |
| Health check `/healthz` | PASS | Route exists, queries PostgreSQL, and current production returned HTTP 200. |
| Existing hostname | PASS | Switching source on the same service does not change route construction or listener configuration. |
| Auto-Deploy On Commit | PASS WITH PRECONDITION | Must be disabled before reconnection and rechecked afterward. |

Current production public checks on `https://artpark-adaptive-qr-cloud-v2.onrender.com` returned HTTP 200 for `/healthz`, `/quick-start`, `/s/start-end`, all four station routes, and `/admin`. The health body reported both application and database healthy.

## 4. Docker / Startup Verification

### Build

- `docker build -t frnn-app-deploy-verify .`: **PASS**
- Base: `node:20-alpine`
- Dependency installation: `npm install --omit=dev`
- Working directory: `/app`
- Exposed port: `3000`
- Command: `npm start` -> `node server.js`
- JavaScript syntax: 27 tracked JavaScript files checked, 0 failures
- Clean dependency install: `npm ci` passed, audit reported 0 vulnerabilities

### Exact startup sequence

1. Docker runs `npm start`, which executes `node server.js`.
2. Module initialization creates the PostgreSQL pool and reads `PORT`, `DATABASE_URL`, `ADMIN_KEY`, `MISSION_CONTROL_PASSPHRASE`, `NODE_ENV`, and related settings.
3. Missing `DATABASE_URL` or `ADMIN_KEY` terminates the process before startup.
4. `start()` awaits `migrate()`.
5. `migrate()` reads and executes `schema.sql`, creates `schema_migrations` if needed, and holds a PostgreSQL advisory lock.
6. It finds sorted numbered migration files, checks `schema_migrations`, and executes each unapplied migration in its own explicit transaction.
7. It loads/initializes content configuration through PostgreSQL.
8. Only then does the server listen on `0.0.0.0:${PORT}`.

Consequences:

- No custom Docker command is required.
- The new instance cannot answer `/healthz` while waiting for or running migration because it does not listen until startup completes.
- A migration failure exits the new process with status 1.
- `/healthz` is database-dependent and returns 503 if its `SELECT NOW()` fails after startup.
- Render should retain the prior healthy deploy until the replacement becomes healthy, but that platform behavior must be observed during the controlled deploy.

### Filesystem assumptions

Normal web runtime reads bundled configuration and static files. Persistent application truth is in PostgreSQL. The R2 boundary targets object storage. QR/code generation scripts can write local artifacts only when manually invoked; normal startup and requests do not use those scripts for durable state. Render's ephemeral filesystem is therefore not an application database or media store.

## 5. Environment Variable Contract

“Present in Render” below is based on the supplied known Render state, not an authenticated Render API inventory performed during this pass.

| Variable | Required by new app | Present in Render | Secret | Deployment risk |
|---|---|---|---|---|
| `PORT` | Yes, Render-managed; defaults to 3000 | Expected Render-managed | No | Low; listener uses it directly. |
| `DATABASE_URL` | Yes; hard startup requirement | Yes, supplied | Yes | Critical; missing/invalid prevents migration/startup. |
| `ADMIN_KEY` | Yes; hard startup requirement | Yes, supplied | Yes | Critical; missing terminates startup. |
| `MISSION_CONTROL_PASSPHRASE` | Operationally required | Yes, supplied | Yes | High; blank does not stop startup but makes intended operator login unusable/unsafe. |
| `NODE_ENV` | Required for production cookie security | Yes, supplied | No | High; must remain `production`. |
| `PUBLIC_BASE_URL` | Required for stable generated QR URLs | Yes, supplied | No | High; verify it still names the intended existing public hostname. |
| `PGSSL` | Conditional | Not in supplied list | No | Medium; current production connectivity suggests existing behavior works, but confirm provider requirements. |
| `PG_POOL_MAX` | No; defaults to 12 | Not in supplied list | No | Low; optional tuning only. |
| `R2_ACCOUNT_ID` | Required only when adapter factory is called | Yes, supplied | No | None at current startup; validate before media use. |
| `R2_BUCKET_NAME` | Required only when adapter factory is called | Yes, supplied | No | None at current startup; must be `artpark`. |
| `R2_ACCESS_KEY_ID` | Required only when adapter factory is called | Yes, supplied | Yes | None at current startup; authenticated R2 check pending. |
| `R2_SECRET_ACCESS_KEY` | Required only when adapter factory is called | Yes, supplied | Yes | None at current startup; authenticated R2 check pending. |
| `R2_ENDPOINT` | Required only when adapter factory is called | Yes, supplied | No | None at current startup; expected HTTPS account endpoint. |
| `R2_PUBLIC_BASE_URL` | Optional | Yes, supplied | No | No startup risk; wrong value would generate wrong public media URLs when adapter is used. |

`server.js` does not import `media-storage.js` and does not initialize the adapter. Therefore missing or bad R2 credentials **cannot currently prevent the web service from starting**. They will matter only when future code explicitly calls `createMediaStorage()`.

## 6. R2 Read-Only Verification

### Configuration/code inspection

| Check | Result |
|---|---|
| HTTPS S3-compatible endpoint | PASS |
| `region: auto` | PASS |
| Bucket passed separately | PASS |
| Credentials passed to SDK without logging | PASS |
| Bounded list operation | PASS; `MaxKeys` clamps to 1–100 |
| Public URL derivation | PASS; trailing slashes removed, path segments encoded, unsafe `..` rejected |
| Destructive startup probe | PASS; none exists |
| Upload/delete operation in adapter | None implemented |
| PostgreSQL media blobs | None found |
| Render durable-disk assumption | None found |

### Public delivery

The supplied public development base URL is live. Unauthenticated `HEAD` requests returned HTTP 200 with expected media types for:

- `access.mp4`
- `attention.mp4`
- `escape.mp4`
- `sensory.mp4`
- `start.mp4`
- `final.gif`
- `locked.gif`

### Authenticated S3 checks

- `HeadBucket`: **NOT VERIFIED**
- Bounded object list: **NOT VERIFIED**
- `HeadObject`: **NOT VERIFIED**
- Write access: **NOT TESTED**, as required

No R2 credentials were available in the local process environment. Public object delivery is proven, but authenticated bucket access remains a deployment precondition. No object was uploaded, overwritten, renamed, or deleted.

## 7. PostgreSQL Migration Analysis

1. **Does startup automatically run numbered migrations?** Yes. `start()` calls `migrate()` before listening.
2. **Will migration 001 execute after switching repos?** Yes, if `schema_migrations` does not contain `001_frnn_event_foundation.sql`.
3. **Is it transactional?** Yes. The runner uses `BEGIN`, executes the migration, inserts the migration record, and commits. The initial `schema.sql` and migration-table creation occur outside that per-file transaction.
4. **Is it idempotent?** Yes in disposable tests: direct rerun succeeded, and the runner records applied names. DDL uses `IF NOT EXISTS`, backfill is deterministic, and the default event insert uses `ON CONFLICT DO NOTHING`.
5. **Does it use an advisory lock?** Yes, a session-level `pg_advisory_lock(hashtext('festival_network_schema_migrations'))` serializes startup migrators.
6. **What does it change?** It creates `events`, inserts event 1, adds/backfills/defaults/enforces non-null `event_id` with foreign keys across ten current tables, adds event indexes, adds generated normalized display names, adds event-scoped display-name uniqueness/search indexes, and advances the event identity sequence.
7. **Can legacy normalized duplicates fail startup?** Yes, intentionally. Case and collapsed whitespace variants stop migration with an operator-review exception.
8. **What happens on abort?** The numbered migration transaction rolls back, the migration record is not inserted, the advisory lock is released, and startup exits. A disposable failure probe confirmed `events` and new columns were absent after rollback while legacy rows remained.
9. **Could health fail while migration runs?** The new process is not listening yet, so its health check is unavailable rather than returning application-level 503. After startup, database failure yields 503.
10. **Rollback behavior?** Successful migration is additive. The old application ignores new tables/columns and benefits from default `event_id=1`; disposable runtime/write verification passed.

## 8. Disposable PostgreSQL Test

PostgreSQL 16 Alpine ran in uniquely named, disposable Docker containers. Production credentials were not used.

### Complete suite with real PostgreSQL

| Metric | Result |
|---|---:|
| Tests | 184 |
| Passed | 184 |
| Failed | 0 |
| Skipped | 0 |

The real integration test verified successful migration, direct idempotent rerun, default-event backfill, generated normalized name state, and exactly one success under concurrent normalized-name collision.

### Deliberate legacy-conflict failure

Fixtures `Mothman Mike`, `MOTHMAN MIKE`, and `  mothman   mike  ` were inserted before migration. Migration exited nonzero with the intended duplicate-name error. Because it ran as one transaction, post-abort checks showed:

- all legacy access-code/player/profile fixture rows remained;
- `events` was absent;
- no `event_id` column remained from the aborted migration.

All disposable containers and networks were removed after testing.

## 9. Legacy Name Collision Risk

The normalization rule is:

```sql
LOWER(REGEXP_REPLACE(BTRIM(display_name), '[[:space:]]+', ' ', 'g'))
```

Case differences, leading/trailing whitespace, and repeated internal whitespace intentionally collide.

Run this exact read-only audit against production before deployment. This version is for the current pre-migration schema, where `event_id` is not yet present:

```sql
BEGIN;
SET TRANSACTION READ ONLY;

SELECT
  LOWER(REGEXP_REPLACE(BTRIM(display_name), '[[:space:]]+', ' ', 'g'))
    AS normalized_display_name,
  COUNT(*) AS conflicting_rows,
  ARRAY_AGG(code ORDER BY code) AS access_codes,
  ARRAY_AGG(display_name ORDER BY code) AS current_names
FROM player_profiles
WHERE BTRIM(display_name) <> ''
GROUP BY 1
HAVING COUNT(*) > 1
ORDER BY 1;

ROLLBACK;
```

Expected safe result: **zero rows**. If any row is returned, stop deployment and resolve it deliberately before migration. Do not rename production players automatically.

If `event_id` already exists from an earlier successful migration, audit per event instead:

```sql
BEGIN;
SET TRANSACTION READ ONLY;

SELECT
  event_id,
  LOWER(REGEXP_REPLACE(BTRIM(display_name), '[[:space:]]+', ' ', 'g'))
    AS normalized_display_name,
  COUNT(*) AS conflicting_rows,
  ARRAY_AGG(code ORDER BY code) AS access_codes,
  ARRAY_AGG(display_name ORDER BY code) AS current_names
FROM player_profiles
WHERE BTRIM(display_name) <> ''
GROUP BY event_id, 2
HAVING COUNT(*) > 1
ORDER BY event_id, 2;

ROLLBACK;
```

## 10. Player / Quest / Mission Control Regression

The complete suite passed with real disposable PostgreSQL. Covered behavior includes:

- QuickStart allocation, idempotency, prefetch rejection, exhaustion behavior, and concurrency;
- unique-name capture, returning named players, normalized conflicts, and privacy;
- `/player` shell and owner-only profile projection;
- access-code identity and public/private serialization boundaries;
- all four station routes and deterministic station progress;
- answer persistence, Start/End, final reflection, and final-name capture;
- Mission Control authentication, sessions, audit, reset, repair, lookup, profiles, history, backup, and Drawing Pool;
- QR generation and authoritative base URL behavior;
- test-code isolation;
- profile history concurrency and recovery.

Result: **184 passed, 0 failed, 0 skipped** with disposable PostgreSQL.

## 11. Stable URL / QR Compatibility

| Route | New code | Tests | Current production | Risk |
|---|---|---|---|---|
| `/quick-start` | Preserved | PASS | HTTP 200 | Low |
| `/s/start-end` | Preserved | PASS | HTTP 200 | Low |
| `/s/escape` | Preserved | PASS | HTTP 200 | Low |
| `/s/attention` | Preserved | PASS | HTTP 200 | Low |
| `/s/access` | Preserved | PASS | HTTP 200 | Low |
| `/s/sensory` | Preserved | PASS | HTTP 200 | Low |
| `/admin` | Preserved | PASS | HTTP 200 | Low |
| `/healthz` | Preserved, database-dependent | PASS | HTTP 200 | Low after migration preflight |

No route redirect contract affecting printed QR destinations was introduced. QuickStart still leads to `/s/start-end` after successful claim; named returning players may proceed through the newer player-shell behavior according to the foundation design. Printed station paths remain stable.

## 12. PUBLIC_BASE_URL Analysis

`PUBLIC_BASE_URL` is used only for:

- authenticated QR metadata and PNG/SVG generation in `server.js`;
- the manual `scripts/generate-qr.js` command.

It does not select the listening host, database, Render service, or R2 endpoint. When absent, QR APIs fall back to the current request host.

Because the deployment would reuse the same Render service and public hostname, no value change should be required. **Precondition:** verify the current non-secret value still equals `https://artpark-adaptive-qr-cloud-v2.onrender.com` or another intentionally permanent QR hostname before deployment. Do not regenerate or reprint QRs during the source switch.

## 13. Auto-Deploy Risk

Auto-Deploy is supplied as **On Commit**. It must remain unchanged during this read-only pass and be disabled before source reconnection.

Validated future sequence:

1. Reconfirm `frnn-app/main` and pin the intended SHA.
2. Record current Render source, branch, deployed SHA, commands, health check, domain, and environment-variable names.
3. Take and verify a PostgreSQL snapshot/export.
4. Run the production read-only duplicate audit and require zero rows.
5. Complete authenticated read-only R2 verification.
6. Disable Auto-Deploy and confirm the setting persisted.
7. Reconnect source to `fargo161/frnn-app`, branch `main`, without triggering a deploy.
8. Recheck Root Directory, Dockerfile, build context, Docker command, pre-deploy command, health path, domain, and environment variables.
9. Trigger exactly one manual deploy of the pinned SHA.
10. Watch build logs and migration logs; stop on any unexpected schema or identity error.
11. Require `/healthz` to pass before traffic cutover.
12. Smoke-test player, QuickStart, admin login, all station routes, Start/End, and one isolated test-code journey.
13. Verify database row counts, `schema_migrations`, event backfill, and access-code inventory.
14. Re-enable Auto-Deploy only after explicit approval and post-deploy verification.

The source reconnection itself must be treated as a possible deploy trigger. If Render cannot separate reconnection from deployment, do not reconnect until all preconditions and an explicit production-change approval are complete.

## 14. Rollback Analysis

**Classification: YES — proven on disposable PostgreSQL.**

After the new app applied migration 001, historical production `881eb1d` was built and started against the upgraded schema. It passed `/healthz`, served all eight stable routes, imported 2,500 access codes, and completed a QuickStart allocation/write. The created player and claim used the new `event_id=1` defaults with no null or non-default event rows.

The old app safely ignores additive tables, columns, indexes, and constraints. It can continue to use the upgraded database because inserts that omit `event_id` receive the default event.

Safest rollback path:

1. Do not reverse migration 001.
2. Preserve the production snapshot taken before deployment.
3. If the new deploy fails, redeploy historical SHA `881eb1dd013c46fb2c387aa5828a4b096e672551` from the old repository or reconnect the recorded old source/branch.
4. Verify `/healthz`, stable routes, Mission Control login, and one isolated test-code flow.
5. Keep the additive schema in place; use the snapshot only for verified data corruption, not ordinary application rollback.

## 15. Deployment Compatibility Matrix

| Layer | Current production | New `frnn-app` | Compatible? | Risk |
|---|---|---|---|---|
| Git source | old repo `main` at `881eb1d` | `frnn-app/main` at `91f60d8` | PASS WITH PRECONDITION | Controlled reconnect required. |
| Dockerfile | Root Dockerfile | Same foundation Dockerfile | PASS | Local build green. |
| Build context | `.` | `.` | PASS | No root change. |
| Start command | Image `npm start` | Image `npm start` | PASS | No override needed. |
| `PORT` | Render-managed | Same listener contract | PASS | Defaults to 3000. |
| Health check | `/healthz` | `/healthz` | PASS | Database-dependent. |
| PostgreSQL | Existing | Same DB | PASS WITH PRECONDITION | Snapshot and conflict audit first. |
| Migrations | Old startup schema | Schema plus numbered migration 001 | PASS WITH PRECONDITION | Automatic startup DDL. |
| Public hostname | Existing Render URL | Same service | PASS | No source-code dependency on repo name. |
| `PUBLIC_BASE_URL` | Present, value not independently read | Same variable | PASS WITH PRECONDITION | Verify exact non-secret value. |
| QuickStart | Existing | Preserved plus FRNN name/player-shell foundation | PASS | Full suite and rollback write green. |
| Station routes | Eight stable endpoints | Preserved | PASS | Printed paths unchanged. |
| Mission Control | Existing | Preserved/extended foundation | PASS | Full regression suite green. |
| R2 | Existing `artpark` bucket | Adapter available but not runtime-wired | PASS WITH PRECONDITION | Public objects pass; authenticated access pending. |
| Render filesystem | Ephemeral | No durable runtime dependency | PASS | Manual generation scripts only. |

## 16. Production Readiness Gates

| Gate | Status | Evidence / required action |
|---|---|---|
| `frnn-app/main` pinned to reviewed SHA | READY | Local/remote `91f60d8`, 0 ahead/behind. |
| Full suite green | READY | 184/184 with disposable PostgreSQL. |
| Docker build green | READY | Root-context build passed. |
| Disposable PostgreSQL migration test green | READY | Successful and failure-path probes passed. |
| Migration idempotency confirmed | READY | Direct rerun and runner behavior verified. |
| Legacy duplicate-name audit procedure prepared | READY | Exact read-only SQL included above. |
| Production DB snapshot procedure identified | NOT VERIFIED | Provider/snapshot mechanism must be inventoried in Render. |
| Old-app compatibility after migration understood | READY | Runtime and write path proven. |
| R2 read-only auth verified | NOT VERIFIED | Local credentials unavailable; public delivery only verified. |
| Current Render environment contract matches app | NOT VERIFIED | Supplied names align, but no authenticated Render inventory performed. |
| `/healthz` preserved | READY | Code, Docker runtime, tests, and production HTTP check pass. |
| Printed QR routes preserved | READY | All route constants/tests and production HTTP checks pass. |
| `PUBLIC_BASE_URL` can remain unchanged | NOT VERIFIED | Code proves no change is needed if current value is the same hostname; value still must be checked. |
| Rollback plan documented | READY | Old app proven compatible with migrated schema. |
| Auto-Deploy disable/re-enable plan documented | READY | Exact controlled sequence included. |

## 17. Exact Controlled Deployment Procedure

This procedure is documentation only and was not executed:

1. Obtain explicit production-change approval.
2. Confirm `frnn-app/main` still equals the approved SHA; rerun fetch, Docker build, and complete tests if it changed.
3. Inventory Render service `srv-d9umd97lk1mc73e2ee00`, including current source, branch, deployed SHA, commands, health check, domain, environment-variable names, PostgreSQL source, and Auto-Deploy state.
4. Verify the six supplied R2 variables exist by name; verify non-secret values without exposing secret values.
5. Perform authenticated read-only R2 `HeadBucket`, bounded list, and `HeadObject` checks for known objects.
6. Take a production PostgreSQL snapshot or logical export and verify it can be located/restored.
7. Run the exact read-only duplicate-name SQL. Require zero result rows.
8. Record baseline counts for access codes, players, visits, answers, final reflections, profiles, history, and settings.
9. Disable Auto-Deploy and confirm it remains off.
10. Reconnect only the source repository to `fargo161/frnn-app` and select branch `main`.
11. Verify all Render settings remain unchanged and verify no automatic deploy began.
12. Manually deploy the pinned SHA once.
13. Observe Docker build, migration lock, migration 001, content initialization, listener startup, and `/healthz` logs.
14. Require healthy service before traffic replacement.
15. Smoke-test the eight stable routes, Mission Control authentication, QuickStart, and one isolated test-code flow.
16. Confirm `schema_migrations` contains migration 001, event 1 exists, all migrated `event_id` values are non-null, and baseline inventory remains intact.
17. Verify known public R2 media still returns correct status and content type.
18. Re-enable Auto-Deploy only after explicit approval.
19. If any gate fails, deploy old SHA `881eb1d` and leave additive migration 001 in place.

## 18. Open Questions / Blockers

1. What exact PostgreSQL provider/resource is connected through Render, and what is its tested snapshot/restore procedure?
2. Does the production duplicate-name audit return zero rows?
3. What is the current `PUBLIC_BASE_URL` value?
4. Are all supplied R2 variable names present with the intended values on the Render service?
5. Do the R2 credentials pass authenticated read-only bucket/list/object checks?
6. What is the current deployed Render SHA immediately before the controlled switch?
7. Can the Render source connection be changed without an immediate deployment after Auto-Deploy is disabled?

These are specific preconditions, not evidence of an application build or regression failure.

## 19. Read-Only Integrity Confirmation

- No GitHub mutation occurred.
- No commit, push, merge, branch, PR, or source change occurred.
- No Render setting, deployment, restart, environment variable, or repository connection changed.
- No production PostgreSQL query or migration ran.
- No Cloudflare setting or R2 object changed.
- R2 checks were public `HEAD` requests only.
- PostgreSQL tests used uniquely named disposable local Docker resources, which were removed.
- Historical rollback tests used disposable local Docker resources and a temporary archive, which were removed.
- The `frnn-app` worktree remained clean at the same SHA.
- No FRNN product feature or Pass 02 work was implemented.

**READY AFTER SPECIFIC PRECONDITIONS**
