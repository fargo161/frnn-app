# FRNN Production Preflight v0.1

Verification date: 2026-08-23 (America/New_York)

## 1. Executive Verdict

The production inventory, canonical target SHA, public delivery, rollback reference, duplicate-name audit, authenticated R2 verification, and production logical backup are complete. The backup was also restored successfully into an isolated disposable PostgreSQL 18 instance. The operator has committed to upgrading the existing Render PostgreSQL database before its September 12, 2026 expiration. The system is ready for a separately approved controlled deployment; no deployment or production configuration change occurred in this pass.

## READY FOR CONTROLLED DEPLOYMENT

## 2. Canonical FRNN Repository

- Local repository: `C:\Users\mcdon\Documents\ChatGPT\frnn-app`
- Remote: `https://github.com/fargo161/frnn-app`
- Branch: `main`
- Local HEAD: `91f60d8ee4795a997b50f556f6ffdd21afcc2cda`
- `origin/main`: `91f60d8ee4795a997b50f556f6ffdd21afcc2cda`
- Ahead/behind: `0/0`
- Worktree: clean
- Result: reviewed SHA unchanged and pinned.

## 3. Current Render Production Inventory

- Service: `artpark-adaptive-qr-cloud-v2`
- Service ID: `srv-d9umd97lk1mc73e2ee00`
- Source: `fargo161/artpark-adaptive-qr-cloud-v2`
- Branch: `main`
- Runtime: Docker
- Region: Virginia (US East)
- Instance: Free, 0.1 CPU / 512 MB
- Root directory: unset
- Dockerfile: `./Dockerfile`
- Build context: `.`
- Docker command override: unset
- Pre-deploy command: unset
- Auto-Deploy: On Commit
- Health check: `/healthz`
- Render hostname: `https://artpark-adaptive-qr-cloud-v2.onrender.com`
- Custom domains: none shown
- PR previews: Off
- Current health probe: HTTP 200, `application/json; charset=utf-8`

The inspected settings match the expected configuration.

## 4. Environment Variable Verification

Names present:

`ADMIN_KEY`, `DATABASE_URL`, `MISSION_CONTROL_PASSPHRASE`, `NODE_ENV`, `PUBLIC_BASE_URL`, `R2_ACCESS_KEY_ID`, `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ENDPOINT`, `R2_PUBLIC_BASE_URL`, `R2_SECRET_ACCESS_KEY`.

Verified non-secret values:

- `NODE_ENV=production`
- `PUBLIC_BASE_URL=https://artpark-adaptive-qr-cloud-v2.onrender.com`
- `R2_ACCOUNT_ID=9af5298a5d7746f282305ef4f532af78`
- `R2_BUCKET_NAME=artpark`
- `R2_ENDPOINT=https://9af5298a5d7746f282305ef4f532af78.r2.cloudflarestorage.com`
- `R2_PUBLIC_BASE_URL=https://pub-865061f8dc3c4e8d8a0206c041b02a5b.r2.dev`

Secret variables were verified for presence only. No secret value is included in this report.

## 5. Current Deployed SHA

- Production SHA: `881eb1dd013c46fb2c387aa5828a4b096e672551`
- Commit message: `Add winner name capture after final completion`
- Deployment timestamp displayed by Render: August 22, 2026 at 1:44 PM
- Deployment status: live
- Health: HTTP 200 from `/healthz` during this preflight

## 6. PostgreSQL Resource / Backup Procedure

- Provider: Render managed PostgreSQL
- Resource: `artpark-qr-db`
- Resource ID shown in the dashboard: `dpg-d9um5vrncjis739vt0k0-a`
- Database name: `artpark_qr_db`
- PostgreSQL: version 18
- Region: Virginia
- Plan: Free
- Storage: approximately 6.7% of 1 GB at inspection
- External access rule shown: `0.0.0.0/0`
- Expiration warning: September 12, 2026; Render states the Free database will be deleted unless upgraded.

Render-native point-in-time recovery and backup/export are unavailable on this Free plan. The safe pre-deployment mechanism is a PostgreSQL 18 logical backup from a trusted workstation:

1. In Render Database Info, securely copy the External Database URL; never place it in the report, repository, command history, or logs.
2. Create a backup directory outside both repositories with access limited to the operator.
3. Run `pg_dump` using the securely supplied URL, custom format, and no ownership/ACL statements: `pg_dump --dbname=<secure URL> --format=custom --no-owner --no-acl --file=artpark-qr-db-pre-frnn-<UTC>.dump`.
4. Require a successful exit code and non-zero file size.
5. Verify readability with `pg_restore --list artpark-qr-db-pre-frnn-<UTC>.dump`.
6. Record a SHA-256 checksum with `Get-FileHash -Algorithm SHA256` and store the dump plus checksum in the operator's approved encrypted backup location.
7. Preferably restore the dump to a disposable PostgreSQL 18 database and verify schema plus critical table counts before approving the production change.

Backup created and verified:

- File: `C:\Users\mcdon\Documents\ChatGPT\frnn-production-backups\artpark-qr-db-pre-frnn-20260824T033843Z.dump`
- Format/client: PostgreSQL 18 custom-format `pg_dump`, `--no-owner --no-acl`
- Size: 47,830 bytes
- `pg_restore --list`: PASS, 88 archive-list lines
- SHA-256: `26A163E47E66B2C7E95DBBBF0047E6D4C82504E5B6A8E73DA7BDFA06B5B48D0F`
- Disposable PostgreSQL 18 restore: PASS
- Restored aggregate checks: `access_codes=2505`, `player_profiles=3`
- Disposable verification container: removed after successful verification

The operator retrieves the verified dump from the path above. The operator has committed to upgrading the existing Render PostgreSQL database before September 12, 2026, resolving the expiration-risk gate.

## 7. Production Duplicate-Name Audit

Status: **READY**.

- Schema detected: pre-migration (`event_id` is not present on `player_profiles`)
- Transaction: explicit `BEGIN`, `SET TRANSACTION READ ONLY`, and `ROLLBACK`
- Result: **0 conflict groups**
- No player names, access codes, or other player data were printed or added to this report.

## 8. Authenticated R2 Read-Only Verification

- `HeadBucket`: **PASS**
- bounded `ListObjectsV2` (`MaxKeys=3`): **PASS**, three entries returned
- `HeadObject access.mp4`: **PASS**

Credentials were transferred through memory-only clipboard handoff, were not printed or written to a file, and were cleared from the verification process. No object keys from the bounded listing were reported and no R2 mutation occurred.

## 9. Public R2 Delivery Check

- `access.mp4`: HTTP 200; `video/mp4`
- `final.gif`: HTTP 200; `image/gif`

Result: READY for the sampled public delivery paths.

## 10. Auto-Deploy / Source-Switch Analysis

Classification: **NO**.

Render documents that Auto-Deploy Off prevents deploys caused by new commits to the linked branch. Separately, Render's dashboard source-change documentation says submitting a new backing repository automatically triggers a deploy from the new source. Therefore disabling Auto-Deploy does not make dashboard source reconnection a harmless staging action.

Evidence:

- [Render deploy documentation](https://render.com/docs/deploys)
- [Render source-change announcement](https://render.com/changelog/change-your-services-backing-repo-or-image-in-the-render-dashboard)
- [Render rollback documentation](https://render.com/docs/rollbacks)

All backup, database-audit, SHA, settings, and approval gates must be complete before submitting the repository change. The source-change submission itself must be treated as the production deployment trigger.

## 11. Rollback References

Current production:

- Repository: `fargo161/artpark-adaptive-qr-cloud-v2`
- Branch: `main`
- SHA: `881eb1dd013c46fb2c387aa5828a4b096e672551`

New target:

- Repository: `fargo161/frnn-app`
- Branch: `main`
- Reviewed SHA: `91f60d8ee4795a997b50f556f6ffdd21afcc2cda`

Historical fallback:

- SHA `881eb1dd013c46fb2c387aa5828a4b096e672551` still exists on the historical repository's `main` reference.
- The previous verification proved this historical app commit runs against the migrated schema.
- Render rollback creates a new deployment from a retained artifact; retention depends on plan and age. Repository/SHA rollback instructions must therefore remain available as the durable fallback.

## 12. Production Readiness Matrix

| Gate | Status | Evidence |
|---|---|---|
| frnn-app SHA pinned | READY | local HEAD and `origin/main` both `91f60d8...2cda`; clean; 0/0 |
| current Render deploy SHA recorded | READY | live deploy `881eb1d...2551` |
| Render config matches expected | READY | authenticated settings inventory |
| PUBLIC_BASE_URL verified | READY | exact expected Render URL |
| R2 non-secret config verified | READY | all five expected non-secret values match |
| R2 secret vars present | READY | both key names present; values masked |
| authenticated R2 HeadBucket | READY | authenticated `HeadBucket` passed |
| authenticated R2 bounded list | READY | `ListObjectsV2 MaxKeys=3` passed; three entries returned |
| authenticated known-object HEAD | READY | authenticated `HeadObject access.mp4` passed |
| production DB provider identified | READY | Render PostgreSQL `artpark-qr-db` |
| snapshot/backup procedure identified | READY | custom-format backup created, listed, hashed, and restored successfully |
| duplicate-name audit = zero conflicts | READY | pre-migration read-only transaction returned 0 conflict groups |
| Auto-Deploy state confirmed | READY | On Commit |
| source-switch behavior understood | READY | dashboard source submission automatically deploys |
| rollback old SHA recorded | READY | `881eb1d...2551`, still on historical `main` |
| historical app compatibility already proven | READY | prior verification |

## 13. Exact Controlled Deployment Procedure

Do not execute this checklist until every item in Section 14 is satisfied and explicit production-change approval is obtained.

1. Confirm the recorded commitment to upgrade the existing Render PostgreSQL resource before September 12, 2026 remains active.
2. Reconfirm the verified backup file and checksum remain accessible; take a fresh backup if production data changed after this preflight.
3. Reconfirm the duplicate-name result if production player-profile data changed after this preflight.
4. Reconfirm authenticated R2 access if credentials or bucket policy changed after this preflight.
5. Reconfirm target repository `fargo161/frnn-app`, branch `main`, and SHA `91f60d8ee4795a997b50f556f6ffdd21afcc2cda`.
6. Reconfirm current production repository, SHA, configuration, and rollback instructions.
7. Obtain explicit approval for the production-changing operation.
8. Disable Auto-Deploy and confirm it is Off.
9. Reverify all Render settings before touching the source selector.
10. Open build/deploy monitoring and operational rollback references.
11. Change the source to `fargo161/frnn-app` and select `main`; treat submission as the deployment trigger. Do not expect a separate safe pause or manual-deploy step.
12. Immediately verify the deployment is building the pinned SHA. Abort/rollback on any SHA mismatch.
13. Watch build logs and migration `001` logs.
14. Require `/healthz` success.
15. Smoke-test QuickStart, `/player`, `/admin` login, `/s/start-end`, and all four station routes.
16. Run one isolated test-code journey.
17. Verify `schema_migrations` contains `001`.
18. Verify event 1, non-null `event_id` backfill, and unchanged player/access-code counts.
19. Verify known R2 media still serves.
20. Re-enable Auto-Deploy only after explicit approval.
21. If a critical check fails, restore database state as appropriate and redeploy/reconnect the recorded historical fallback according to the approved rollback runbook.

## 14. Remaining Preconditions

All technical Final Preconditions are satisfied. Before changing production, obtain explicit production-change approval. If production data, credentials, R2 policy, source SHA, or Render configuration changes after this report, rerun the affected gate and take a fresh backup as appropriate.

## 15. Read-Only Integrity Confirmation

- No GitHub mutation occurred.
- No Render mutation occurred.
- No production database mutation occurred; the production audit used only an explicit read-only transaction followed by rollback.
- The logical backup read production data with `pg_dump`; its restore mutated only an isolated disposable local database that was removed afterward.
- No Cloudflare or R2 mutation occurred.
- No deployment, restart, or rebuild occurred.
- No FRNN Product Pass 02 work occurred.

## READY FOR CONTROLLED DEPLOYMENT
