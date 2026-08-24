# FRNN Infrastructure

This document records verified infrastructure relationships without storing secret values.
Application source and configuration stay provider-aware at the deployment boundary and
provider-neutral inside the domain model.

```text
GitHub: fargo161/frnn-app (main)
                 |
                 v
Render: srv-d9umd97lk1mc73e2ee00
                 |
        +--------+--------+
        |                 |
        v                 v
PostgreSQL          Cloudflare R2
authoritative state bucket: artpark
                     media objects
```

## GitHub

- Canonical repository: <https://github.com/fargo161/frnn-app>
- Default branch: `main`
- Foundation source SHA: `da926893e2ab221e142585e7d3e1b28b8b3f3c70`
- History strategy: preserve history reachable from the reviewed FRNN foundation branch;
  do not import unrelated experimental branches.

## Render

- Existing service ID: `srv-d9umd97lk1mc73e2ee00`
- Dashboard: <https://dashboard.render.com/web/srv-d9umd97lk1mc73e2ee00>
- Current repository connection: **UNKNOWN / REQUIRES RENDER AUTHORIZATION**
- Target repository: `https://github.com/fargo161/frnn-app`
- Deployed branch: **UNKNOWN / REQUIRES RENDER AUTHORIZATION**
- Deployed SHA: **UNKNOWN / REQUIRES RENDER AUTHORIZATION**
- Public/custom domain: **UNKNOWN / REQUIRES RENDER AUTHORIZATION**
- Auto-deploy state: **UNKNOWN / REQUIRES RENDER AUTHORIZATION**
- Health-check configuration: **UNKNOWN / REQUIRES RENDER AUTHORIZATION**
- Repository-declared runtime: Node.js 20 or later
- Repository-declared start command: `npm start`
- Repository health endpoint: `GET /healthz`
- Render build command: **UNKNOWN / REQUIRES RENDER AUTHORIZATION**
- Render start command: **UNKNOWN / REQUIRES RENDER AUTHORIZATION**
- Render environment-variable names: **UNKNOWN / REQUIRES RENDER AUTHORIZATION**

Do not reconnect this service until the current configuration and secret-variable names
have been inventoried, the exact deployment diff is reviewed, database behavior is understood,
and a rollback path is approved. Reconnecting or deploying may affect production and requires
an explicit user approval at that boundary.

### Render rollback plan

Before reconnection, record the current repository, branch, and deployed SHA. Preserve that
commit and its repository access. If the new deployment fails, reconnect the existing service
to the recorded repository/branch/SHA or use Render's verified rollback mechanism. Verify
`/healthz` and database compatibility before and after any change.

## Cloudflare R2

- Account ID: `9af5298a5d7746f282305ef4f532af78`
- Existing bucket: `artpark`
- Dashboard: <https://dash.cloudflare.com/9af5298a5d7746f282305ef4f532af78/r2/default/buckets/artpark>
- S3 endpoint: `https://9af5298a5d7746f282305ef4f532af78.r2.cloudflarestorage.com`
- Public media URL: **UNKNOWN / NOT YET VERIFIED**
- Connection status: **NOT TESTED — R2 API CREDENTIALS UNAVAILABLE**

The application uses the `media-storage.js` boundary. Cloudflare R2 is configured as an
S3-compatible object store; domain code should store media metadata and object keys rather
than Cloudflare-specific response objects. PostgreSQL must not store uploaded image/video bytes,
and Render's local filesystem must not be treated as durable media storage.

Required configuration names:

- `R2_ACCOUNT_ID`
- `R2_BUCKET_NAME`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_ENDPOINT`
- `R2_PUBLIC_BASE_URL` (optional until public delivery is configured)

Never commit live values. Player media must eventually enter a private/quarantine state and
must not become public until validation and the applicable moderation/publication decision.

### Safe connection check

Once scoped R2 credentials are available, use the adapter's bounded list operation with a
small `maxKeys` value. A write test is not authorized by this bootstrap. Do not overwrite,
rename, or delete any existing object. If a later write test is explicitly authorized, use a
unique disposable key and delete only that exact key after verification.

## PostgreSQL

- Production provider/source: **UNKNOWN / REQUIRES RENDER AUTHORIZATION**
- Existing connection must be preserved through the Render `DATABASE_URL` variable.
- Schema initialization and numbered migrations run at application startup.
- Current foundation migration: `migrations/001_frnn_event_foundation.sql`
- Production migration execution: **NOT AUTHORIZED DURING BOOTSTRAP**

Take a managed snapshot or verified logical backup before the first deployment from this
repository. Review pending numbered migrations and startup behavior against a disposable or
staging database before production. Never reset the existing production database.

## Environment-variable contract

Application variables currently supported:

- `PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `PG_POOL_MAX`
- `PGSSL`
- `ADMIN_KEY`
- `MISSION_CONTROL_PASSPHRASE`
- `PUBLIC_BASE_URL`

Media storage variables are listed in the R2 section. `TEST_DATABASE_URL` is test-only and
must point only to a disposable PostgreSQL database because the integration test creates and
drops its own temporary schema.

## Separation from the agent-team repository

The future `frnn-agent-team` repository is a development-operations layer, not application
source. Its `PROJECT_LINK.md` should use this canonical target:

```text
https://github.com/fargo161/frnn-app
```
