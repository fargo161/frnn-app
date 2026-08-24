# FRNN Infrastructure

- **Status:** Current infrastructure orientation
- **Application source last reconciled against:** `9087b534591a3025308f38f43368d6537b4a66cd` on `main` (2026-08-24)
- **External provider state:** **UNCERTAIN** after the last authenticated observation on 2026-08-23/24

This document separates current application-source facts from time-bound provider observations without storing secret values. The repository can establish the current application contract, but it cannot prove that Render, PostgreSQL, R2, or repository connections remained unchanged after the last authenticated Production Preflight. Application source remains provider-neutral inside the domain model and provider-aware only at deployment/storage boundaries.

Start with the [FRNN project orientation](../README.md). Architectural ownership rules live in [the combinatorial architecture](../COMBINATORIAL_ARCHITECTURE.md).

## Application and observed production boundary

```text
LAST AUTHENTICATED PRODUCTION OBSERVATION — 2026-08-23/24
fargo161/artpark-adaptive-qr-cloud-v2 (main)
SHA 881eb1dd013c46fb2c387aa5828a4b096e672551
                    │
                    ▼
Render service: artpark-adaptive-qr-cloud-v2
srv-d9umd97lk1mc73e2ee00
        │                         │
        ▼                         ▼
Render PostgreSQL             Cloudflare R2
artpark-qr-db                 bucket: artpark

CURRENT APPLICATION SOURCE AT RECONCILIATION
fargo161/frnn-app (main)
SHA 9087b534591a3025308f38f43368d6537b4a66cd
not proven connected or deployed by this source-only reconciliation
```

At the last authenticated observation, Render was connected to the historical repository and no `frnn-app` source switch or production deployment had been approved or performed. Whether that external state changed afterward is **UNCERTAIN** in this source-only pass; do not present the repository itself as proof of live provider state.

## GitHub

- Canonical target repository: <https://github.com/fargo161/frnn-app>
- Default branch: `main`
- Application reconciliation point: `9087b534591a3025308f38f43368d6537b4a66cd`
- Production repository observed on 2026-08-23/24: <https://github.com/fargo161/artpark-adaptive-qr-cloud-v2>
- Production branch/SHA observed on 2026-08-23/24: `main` at `881eb1dd013c46fb2c387aa5828a4b096e672551`
- History strategy: preserve reviewed canonical history; do not import unrelated experimental branches.

The reconciliation SHA records when this document was checked; it is not permanent proof of future behavior. Any future deployment approval must identify and reverify the exact target commit then at `frnn-app/main`.

## Render — last authenticated inventory

- Service: `artpark-adaptive-qr-cloud-v2`
- Service ID: `srv-d9umd97lk1mc73e2ee00`
- Dashboard: <https://dashboard.render.com/web/srv-d9umd97lk1mc73e2ee00>
- Source repository observed: `fargo161/artpark-adaptive-qr-cloud-v2`
- Source branch observed: `main`
- Deployed SHA observed: `881eb1dd013c46fb2c387aa5828a4b096e672551`
- Deployed commit message: `Add winner name capture after final completion`
- Deployment timestamp observed: August 22, 2026 at 1:44 PM
- Deployment status observed: live
- Runtime: Docker
- Region: Virginia (US East)
- Instance: Free (0.1 CPU / 512 MB at inspection)
- Root Directory: unset
- Dockerfile Path: `./Dockerfile`
- Docker Build Context: `.`
- Docker Command override: unset
- Pre-Deploy Command: unset
- Auto-Deploy: On Commit
- PR Previews: Off
- Health Check: `GET /healthz`
- Render subdomain: enabled
- Public URL: <https://artpark-adaptive-qr-cloud-v2.onrender.com>
- Custom domain: none observed
- Preflight health probe: HTTP 200, `application/json; charset=utf-8`

### Verified environment contract

Variable names observed in Render:

- `ADMIN_KEY`
- `DATABASE_URL`
- `MISSION_CONTROL_PASSPHRASE`
- `NODE_ENV`
- `PUBLIC_BASE_URL`
- `R2_ACCESS_KEY_ID`
- `R2_ACCOUNT_ID`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT`
- `R2_PUBLIC_BASE_URL`
- `R2_SECRET_ACCESS_KEY`

Verified non-secret values:

```text
NODE_ENV=production
PUBLIC_BASE_URL=https://artpark-adaptive-qr-cloud-v2.onrender.com
R2_ACCOUNT_ID=9af5298a5d7746f282305ef4f532af78
R2_BUCKET_NAME=artpark
R2_ENDPOINT=https://9af5298a5d7746f282305ef4f532af78.r2.cloudflarestorage.com
R2_PUBLIC_BASE_URL=https://pub-865061f8dc3c4e8d8a0206c041b02a5b.r2.dev
```

Secret variables were verified for presence only. Their values must never enter source, documentation, logs, or task reports.

### Source-switch behavior and approval boundary

Render documentation and dashboard behavior establish that submitting a new backing repository automatically triggers a deployment from the new source. Turning Auto-Deploy off prevents commit-triggered deploys, but does **not** turn source reconnection into a harmless staging action.

Therefore:

1. backup, audit, target-SHA, settings, rollback, and approval gates must be complete before submitting a source change;
2. the source-change submission must be treated as the production deployment trigger;
3. there is no assumed safe pause between reconnecting `fargo161/frnn-app` and deployment;
4. no source change may occur without separate explicit production-change approval.

Relevant Render references:

- <https://render.com/docs/deploys>
- <https://render.com/changelog/change-your-services-backing-repo-or-image-in-the-render-dashboard>
- <https://render.com/docs/rollbacks>

### Rollback reference

The durable historical fallback is:

```text
repository: fargo161/artpark-adaptive-qr-cloud-v2
branch:     main
SHA:        881eb1dd013c46fb2c387aa5828a4b096e672551
```

That SHA remains reachable in the historical repository and was proven in disposable verification to run against the migrated schema. Render artifact rollback availability depends on retention and plan, so repository/SHA rollback instructions must remain available.

## Cloudflare R2 — last authenticated read-only verification

- Account ID: `9af5298a5d7746f282305ef4f532af78`
- Bucket: `artpark`
- Dashboard: <https://dash.cloudflare.com/9af5298a5d7746f282305ef4f532af78/r2/default/buckets/artpark>
- S3 endpoint: `https://9af5298a5d7746f282305ef4f532af78.r2.cloudflarestorage.com`
- Public development URL: <https://pub-865061f8dc3c4e8d8a0206c041b02a5b.r2.dev>
- Public access: enabled
- Authenticated `HeadBucket`: PASS
- Authenticated bounded `ListObjectsV2` (`MaxKeys=3`): PASS
- Authenticated `HeadObject access.mp4`: PASS
- Public `access.mp4`: HTTP 200, `video/mp4`
- Public `final.gif`: HTTP 200, `image/gif`

The authenticated checks were read-only. Credentials were not printed or stored, object keys from the bounded list were not reported, and no R2 object or configuration was changed.

The application uses `media-storage.js` as its S3-compatible boundary. Domain code should store media metadata and object keys rather than Cloudflare-specific response objects. PostgreSQL must not store uploaded image/video bytes, and Render's local filesystem must not be treated as durable media storage.

Player media must eventually enter a private/quarantine state and must not become public until validation and the applicable moderation/publication decision.

## PostgreSQL — last authenticated production resource

- Provider: Render managed PostgreSQL
- Resource: `artpark-qr-db`
- Resource ID observed: `dpg-d9um5vrncjis739vt0k0-a`
- Database name: `artpark_qr_db`
- PostgreSQL version: 18
- Region: Virginia
- Plan at preflight: Free
- Storage at inspection: approximately 6.7% of 1 GB
- External access rule observed: `0.0.0.0/0`
- Connection is supplied to the service through `DATABASE_URL`; the URL and credentials are secret.
- Schema initialization and numbered migrations run at application startup.
- Current application migrations: `migrations/001_frnn_event_foundation.sql` and `migrations/002_broadcast_master_clock.sql`
- At the last authenticated observation, neither migration was proven applied by `frnn-app` in production because the source switch/deployment had not occurred.

### Backup verification

Render-native point-in-time recovery and backup/export were unavailable on the Free plan. A PostgreSQL 18 custom-format logical backup was created outside the repositories with `pg_dump --no-owner --no-acl` and verified as follows:

- non-empty dump: PASS (47,830 bytes)
- `pg_restore --list`: PASS (88 archive-list lines)
- SHA-256: `26A163E47E66B2C7E95DBBBF0047E6D4C82504E5B6A8E73DA7BDFA06B5B48D0F`
- isolated disposable PostgreSQL 18 restore: PASS
- restored aggregate checks: `access_codes=2505`, `player_profiles=3`
- disposable verification container: removed

The backup remains operator-held outside Git. A fresh backup is required if production data changes materially before deployment.

### Duplicate-name audit

The production schema was still pre-migration (`event_id` absent from `player_profiles`). The approved duplicate-normalized-name audit ran inside an explicit read-only transaction followed by rollback and returned:

```text
0 conflict groups
```

No player names or access codes were printed. If production profile data changes before deployment, rerun this audit.

### Database expiration boundary

The Free database displayed a September 12, 2026 deletion warning. The operator has committed to upgrading the existing Render PostgreSQL database before expiration. This commitment does not authorize any database or deployment change in this documentation pass.

## Production readiness boundary

The 2026-08-23/24 preflight passed its local/disposable application checks and recorded these gates against the then-reviewed, pre-Broadcast application baseline:

- canonical `frnn-app` application SHA pinned;
- current Render production source/SHA/configuration recorded;
- production PostgreSQL provider identified;
- logical backup created, listed, hashed, and restored;
- production duplicate-name audit returned zero conflict groups;
- authenticated and public R2 checks passed;
- rollback SHA recorded;
- source-switch deployment behavior understood.

That historical evidence meant **ready for a separately approved controlled deployment** at the reviewed baseline; it does not establish the current `9087b53...` source as deployment-ready. Broadcast v0.1 subsequently added a migration, routes, APIs, and operator controls. Before any future source switch, revalidate the application build/tests and every gate affected by production data, credentials, R2 policy, Render configuration, migrations, or the target source SHA.

## Application environment-variable contract

Application variables currently supported:

- `PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `PG_POOL_MAX`
- `PGSSL`
- `ADMIN_KEY`
- `MISSION_CONTROL_PASSPHRASE`
- `PUBLIC_BASE_URL`

Media-storage variables are listed in the Render/R2 sections. `TEST_DATABASE_URL` is test-only and must point only to a disposable PostgreSQL database because the integration test creates and drops its own temporary schema.

## Separation from the agent-team repository

The future `frnn-agent-team` repository is a development-operations layer, not application source. Its `PROJECT_LINK.md` should use this canonical target:

```text
https://github.com/fargo161/frnn-app
```

Do not place agent contracts, task routing, or agent operations in this repository until a separately authorized pass defines their boundary.
