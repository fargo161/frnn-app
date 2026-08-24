# FRNN Application

FRNN is the persistent **Fried Rice News Network** platform. It combines durable player identity, profiles, news/media, quests, event overlays, broadcast state, and operator tools through bounded modules. The proven ARTPARK adaptive-QR quest remains an active subsystem while the repository evolves toward the larger platform.

This README is project orientation. [`COMBINATORIAL_ARCHITECTURE.md`](COMBINATORIAL_ARCHITECTURE.md) is architectural law and modular design grammar. Repository source is authoritative for what exists today.

## What FRNN is

```text
FRNN CORE
├── persistent player identity
├── News                         PLANNED
├── Upload                       PLANNED
├── Profile                      PARTIAL
├── personal quests              PLANNED
└── event overlays when active   PARTIAL
```

FRNN is intended to remain useful between festivals. Events add temporary context and programming; they do not create or own the player's identity.

## Product identity

```text
Platform / Network:    Fried Rice News Network (FRNN)
Primary Show:          Fried News
Current Seed Festival: As Above So Below
```

These identities are related but not interchangeable. FRNN is the platform, Fried News is its primary show, and As Above So Below is the seeded/current festival context.

## Current implementation reality

The following behaviors are present in the current source on `main`. This is a current-source orientation, not a frozen repository snapshot; historical commits identify when behavior was introduced, not what every later revision proves.

- **CURRENT:** Node 20+ / Express application (`package.json`, `server.js`).
- **CURRENT:** PostgreSQL authoritative state and startup migration runner (`schema.sql`, `db.js`).
- **CURRENT:** private access-code identity, secure player cookie, and persistent player record (`access_codes`, `players`, `/api/access`).
- **CURRENT:** idempotent QuickStart allocation (`quick_start_claims`, `quick-start.js`, `/quick-start`, `/api/quick-start`).
- **CURRENT/PARTIAL:** unique display-name, profile-history, and event foundation (`player_profiles`, `player_profile_versions`, `events`, `migrations/001_frnn_event_foundation.sql`).
- **PARTIAL:** `/player` shell and owner-scoped profile projection (`player-shell.js`, `public/player.html`).
- **CURRENT:** four physical quest routes—`/s/escape`, `/s/attention`, `/s/access`, `/s/sensory`—plus `/s/start-end`.
- **CURRENT:** fixed station visit, reflective response, final-reflection, and completion behavior (`visits`, `video_answers`, `final_reflections`, `public/station.html`).
- **CURRENT base:** Mission Control at `/admin`, including shared-passphrase sessions, operational controls, audit records, profiles/history, Drawing Pool, and QR generation (`public/admin.html`, `/api/admin/*`).
- **CURRENT:** numbered migration foundation (`schema_migrations`; `migrations/001_frnn_event_foundation.sql`).
- **PARTIAL:** R2/S3-compatible media-storage adapter boundary with bounded listing and public-URL construction (`media-storage.js`); there is no upload pipeline yet.
- **CURRENT / EXPERIMENTAL:** one global looping Program queue, PostgreSQL-authoritative master-clock anchor, bare Mission Control Packager, public `/api/broadcast` state, and minimal `/broadcast` viewer (`broadcast.js`, `migrations/002_broadcast_master_clock.sql`, `public/broadcast.html`). This is a bounded shared-clock experiment, not a production broadcast system.

Broadcast v0.1 was introduced in `9087b534591a3025308f38f43368d6537b4a66cd`; that SHA is historical provenance only.

The detailed behavior of the inherited quest and field subsystem is preserved in [`docs/LEGACY_ARTPARK_OPERATIONS.md`](docs/LEGACY_ARTPARK_OPERATIONS.md).

## Target platform direction

The following are **PLANNED / TARGET DESIGN**, not current implementation claims:

- always-on FRNN news/profile/upload experience outside events;
- player avatars and an object-storage upload pipeline;
- player field reports, moderation, publication, News Crawl, and ticker;
- generic quests with player-specific, event-wide, and between-event assignments;
- Master and Producer accounts with fine-grained permissions and approval workflows;
- official event information and weather;
- prerecorded Breaking News and Master-only Emergency state;
- richer Program/media composition, crawl, ticker, overlay, projector, and projection-mapping outputs.

See [`COMBINATORIAL_ARCHITECTURE.md`](COMBINATORIAL_ARCHITECTURE.md) for module contracts, legal combinations, forbidden combinations, and invariants.

## Deferred

The following are deliberately deferred:

- livestreaming with audio—the final feature of v1;
- sophisticated automatic quest triggers;
- complex player segmentation;
- advanced live-production switching;
- AI moderation;
- social graph and chat.

## Persistent platform vs event overlay

```text
PERSISTENT FRNN
│
├── player identity
├── profile
├── general news/upload
├── personal quests
└── history
      │
      └── EVENT OVERLAY
          ├── event branding
          ├── Weather / Info
          ├── physical stations
          ├── event quests
          └── event programming
```

```text
EVENT ENDS ≠ PLAYER IDENTITY ENDS
NO ACTIVE EVENT ≠ FRNN OFFLINE
```

The event table and event-scoped migration foundation are present, but fully selectable event overlays and always-on editorial modules remain target design.

## Architectural rule

> **Functionality owns truth. Media owns content. Style owns presentation.**

New features must first be expressed as lawful combinations of actor, content, context, authority, and presentation—or explicitly define the new module and invariant being added. They should not enter FRNN only as hardcoded pages, routes, or special cases.

The complete rule set is in [`COMBINATORIAL_ARCHITECTURE.md`](COMBINATORIAL_ARCHITECTURE.md).

## Current player surfaces

| Surface | Current role |
|---|---|
| `/quick-start` | Zero-typing bridge that atomically claims/reuses a production access code and enters Start/End |
| `/player` | Early persistent player shell with owner-scoped profile and fixed quest progress |
| `/broadcast` | Minimal public viewer for the one global authoritative Program timeline |
| `/s/start-end` | Access-code entry plus opening/final framing and final reflection |
| `/s/escape` | Physical quest station |
| `/s/attention` | Physical quest station |
| `/s/access` | Physical quest station |
| `/s/sensory` | Physical quest station |

The physical route is a proven subsystem, not the definition of every future FRNN quest. The general player shell will expand around it with always-on news, uploads, profile, and assigned quests.

## Current Mission Control

`/admin` is the existing operator surface and contains the experimental Broadcast Program Packager. It uses a shared `MISSION_CONTROL_PASSPHRASE` to create a secure, server-validated session and currently supports Program queue save/start/stop controls, code operations, route inspection/repair/reset, content/video configuration, test codes, profiles/history, Drawing Pool, QR generation, and operational metrics.

Master/Producer accounts, individual capability grants, drafts, approval, publication, and broadcast activation are **PLANNED / TARGET DESIGN**. The existing admin gate must not be mistaken for that future permission system.

## Infrastructure

Deployment and storage relationships are documented in [`docs/INFRASTRUCTURE.md`](docs/INFRASTRUCTURE.md).

```text
last authenticated production observation:
historical application repository → Render → PostgreSQL

target application repository: frnn-app (not proven connected/deployed)
media-storage boundary: Cloudflare R2
```

PostgreSQL owns authoritative state and media metadata. Object storage owns media bytes. Render's local filesystem is not durable media storage. Never commit or document live credentials.

## Running locally

### Docker

Requirements: Docker Desktop.

```bash
docker compose up --build
docker compose exec app npm run codes:import
```

Then open `http://localhost:3000/s/start-end`, `http://localhost:3000/player`, or the public `http://localhost:3000/broadcast` viewer.

**Current Docker limitation:** the checked-in Compose profile does not provide `MISSION_CONTROL_PASSPHRASE`, so it cannot authenticate `/admin` or operate the Program Packager as written. Use the Node/PostgreSQL setup below for the complete local Broadcast walkthrough. This is a known configuration gap, not evidence that the Packager is absent from the application.

### Node and PostgreSQL

Requirements: Node 20+ and PostgreSQL.

Configure these runtime variables before starting the application:

```text
DATABASE_URL=postgres://...
ADMIN_KEY=<private server maintenance key>
MISSION_CONTROL_PASSPHRASE=<shared operator passphrase>
NODE_ENV=development
```

Then install, import the bundled access codes, and start the server:

```bash
npm install
npm run codes:import
npm start
```

`PUBLIC_BASE_URL` is required for authoritative QR destinations in deployed/print workflows. R2 variables are required only when using `media-storage.js`; see [`docs/INFRASTRUCTURE.md`](docs/INFRASTRUCTURE.md). Do not point tests at production PostgreSQL.

### Local Program Packager + Broadcast walkthrough

After starting the Node/PostgreSQL setup with `MISSION_CONTROL_PASSPHRASE` configured:

1. Open `http://localhost:3000/admin`, sign in with that passphrase, and find **Broadcast Program Packager** at the top of Mission Control.
2. Open `http://localhost:3000/broadcast` in a separate tab, window, or browser. This is the public viewer/channel surface.
3. While the channel is off air, edit the bounded Program queue and select **SAVE PROGRAM QUEUE**.
4. Select **START BROADCAST**. The viewer reads `/api/broadcast` and follows the PostgreSQL-authoritative shared clock and ordered Program state.
5. Select **STOP BROADCAST** in Mission Control to return the viewer to its explicit off-air state.

Broadcast v0.1 is **CURRENT / EXPERIMENTAL**. It is one looping global queue and a minimal viewer, not production streaming infrastructure, a media library, YouTube integration, or a breaking-news system.

The complete inherited setup, field workflow, QR, recovery, and production checklist is in [`docs/LEGACY_ARTPARK_OPERATIONS.md`](docs/LEGACY_ARTPARK_OPERATIONS.md).

## Workspace authority

The only active FRNN workspace is `C:\Users\mcdon\Documents\ChatGPT\frnn-app`.

The former `C:\Users\mcdon\Documents\ChatGPT\frnn` directory is retained only as historical/reference material and is not an active implementation workspace. Preserved [`archive/`](archive/README.md) material records provenance and historical evidence; it is not current implementation or deployment authority.

## Documentation map

| Document | Authority and purpose |
|---|---|
| Source and runtime behavior | Authoritative for what is currently implemented |
| `README.md` | Current FRNN project orientation |
| [`COMBINATORIAL_ARCHITECTURE.md`](COMBINATORIAL_ARCHITECTURE.md) | Architectural law, module ownership, grammar, and invariants |
| [`docs/INFRASTRUCTURE.md`](docs/INFRASTRUCTURE.md) | Current infrastructure, deployment relationships, and operational boundaries |
| [`docs/LEGACY_ARTPARK_OPERATIONS.md`](docs/LEGACY_ARTPARK_OPERATIONS.md) | Historical and event-specific operational reference; not canonical FRNN architecture |
| [`tasks/`](tasks/README.md) | Bounded implementation instructions tied to repository baselines; task packets describe intended work and are not evidence of implementation |
| [`archive/`](archive/README.md) | Historical evidence and provenance; not current implementation or deployment authority |

The [task packet protocol](tasks/README.md) defines packet headers, baseline checks, history preservation, implementation reports, and behavioral evidence expectations.

## Implementation reality

> Repository source is authoritative for what exists today. Architecture and design documents define intended direction and must not be treated as proof of implementation.

Future agents must distinguish authority from reading order:

```text
1. source + schema + tests        → implementation truth
2. COMBINATORIAL_ARCHITECTURE.md  → architectural constraints / target grammar
3. README.md                      → project orientation
4. docs/INFRASTRUCTURE.md         → infrastructure truth / production boundaries
5. docs/LEGACY_ARTPARK_OPERATIONS.md
                                  → inherited operational subsystem
6. tasks/                         → bounded work instructions, not implementation evidence
```
