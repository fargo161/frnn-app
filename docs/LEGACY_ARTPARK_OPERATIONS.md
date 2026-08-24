# Legacy ARTPARK Quest & Field Operations

> **Inherited / proven ARTPARK quest subsystem and historical field-operations documentation**

This document preserves the operational behavior inherited from the original ARTPARK adaptive QR system. Many of these systems remain active and proven in the current repository, but they are now one subsystem within the broader FRNN platform. This is not the canonical product definition of FRNN.

Start with the [FRNN project orientation](../README.md). Architectural ownership and composition rules live in [the combinatorial architecture](../COMBINATORIAL_ARCHITECTURE.md), and deployment/storage relationships live in [the infrastructure document](INFRASTRUCTURE.md).

## The simple version

You deploy this app **once** to an always-on cloud host with a PostgreSQL database. After that:

- the four printed QR codes point at the cloud app;
- players use **their own cellular data**;
- one unique access code = one player/group = one persistent progress record;
- the player enters the code once, and the browser remembers them with a secure cookie;
- the cloud database remembers discovery order;
- each Functional station loops its pending video until the configured correct response is recorded, using a wrong-answer/hint video for retries and a completion video after success;
- your concierge laptop is **not required for the game to keep running**;
- your phone or laptop is only an optional Mission Control console.

The physical rubber stamps remain the proof that a lockbox was actually solved. A QR scan is narrative progress, not physical completion proof.

## Player flow

1. Concierge gives a card and unique code such as `K7M-4Q2`.
2. Player scans any station QR.
3. On first scan only, they enter the code.
4. The app sets a long-lived browser cookie and activates that code.
5. That station becomes discovery Stage 1.
6. Next new station becomes Stage 2, etc.
7. Re-scanning a station preserves its original stage and does not advance the route.
8. On another phone, entering the same code restores the same server-side progress.

At each Functional station, the loop video and four-choice **What could YOU do...?** prompt remain available until the configured correct choice is selected. A visit activates the station but does not complete its mission. Mission Control configures one correct answer among the four choices. A wrong choice persists nothing, plays the station's wrong-answer/hint video, and allows retry; the correct choice is stored once per code/station, plays the completion video, and remains visible on revisit.

Response state is independent from the Functional discovery route and physical stamps. Selecting a choice does not create a visit or change its stage. One persisted correct response at each of the four stations sets the authoritative `videoRoundComplete` state.

After all four reflective responses are complete, Start/End exposes one final free-text reflection; visits alone cannot unlock it. The final question has a loop video plus separate wrong- and correct-answer videos. The default question is **What did YOU do to get this far?** Matching is forgiving, deterministic, and server-side: it ignores case, harmless punctuation, apostrophe differences, and repeated whitespace while using token-aware configured keywords and phrases. An unrelated response plays the wrong-answer video, persists nothing, and returns to an unlimited retry.

An accepted final reflection reveals the canonical concierge phrase. Fragments using the vocabulary of decisions, portals, choosing, opening, and crossing are intentionally distributed through the player interface, but the full phrase is returned by the server and displayed only after final acceptance.

## Four permanent station routes

After you have a real domain, print QRs for:

- `/s/escape`
- `/s/attention`
- `/s/access`
- `/s/sensory`

The QR contains only the stable station address. It does **not** contain a video URL. You can change the video routing later without reprinting the QR.

## Start/End framing station

`/s/start-end` is one framing station used for both the opening and closing transmission. It is not a fifth Functional Behavior station and never participates in Stage 1–4. Before the four functional visits are complete it shows START; after all four are complete it shows END. A valid code may be activated at Start/End while retaining an empty `0 / 4` functional route, so the first functional station still becomes Stage 1. Reset returns the same code to the START gate/state.

Start/End activity is intentionally not inserted into `visits` or Recent Signal Activity, keeping functional scan totals and route history unambiguous. Test codes use the same framing logic and remain excluded from production metrics.

## What mission control actually is

The server and database are the real mission control. `/admin` is only a monitor/control window.

You can close your laptop, lose your hotspot, or have no power at concierge and players still function as long as:

1. the cloud deployment is healthy; and
2. their phones have cellular data.

The admin page can be opened from any internet-connected phone or laptop with the shared team Mission Control passphrase. Team operators never need the private server-side `ADMIN_KEY`.

## What Mission Control can do

Open `/admin`, enter `MISSION_CONTROL_PASSPHRASE`, and optionally enter an operator label. The secure browser session lasts up to 12 hours and ends immediately when the operator selects **LOG OUT**.

It shows:

- unused, active, and complete production-code counts;
- an atomic **ISSUE NEXT FIELD CODE** control;
- active receiver count;
- a paginated Active Receivers directory showing progress, discovery-order route, completion, and latest activity;
- number of digitally completed routes;
- scan totals per station;
- recent scan activity;
- player lookup by field access code;
- route reset;
- route repair/reconstruction;
- editable loop, wrong-answer/hint, and completion URLs for each of the four Functional stations;
- editable unauthorized/"come back later" video URL.
- editable player prompts, four choices, and one designated correct choice for every Functional station;
- editable final prompt, accepted phrases, retry copy, completion copy, and loop/wrong/correct video URLs;
- per-player selected responses, reflective completion, final-response state, normalized submission, and timestamps.

### Code lifecycle

- **UNUSED**: an operationally unactivated production code. Normal allocation additionally requires `claimed_at IS NULL`, so a durably owned credential can never be treated as available merely because another lifecycle field is stale.
- **ACTIVE**: successfully entered and representing a current player/group journey.
- **COMPLETE**: active with all four unique digital station visits.

Operational lifecycle is **UNUSED → ACTIVE → COMPLETE**, while durable ownership is independently **UNCLAIMED → CLAIMED**. **RESET GAMEPLAY clears the digital route, four reflective choices, final response, and phrase-reveal eligibility but preserves claimed ownership, active recovery continuity, player/profile/history, and prize history.** Only the separately confirmed privileged **DELETE PLAYER IDENTITY + RELEASE CREDENTIAL** action removes identity-owned state and clears ownership. Physical stamps are unaffected.

Mission Control also provides `TEST-01` through `TEST-05`. Test codes use the real authorization, cookie, routing, recovery, and video behavior, but are excluded from production inventory, activity, station-scan, and completion metrics.

The **Active Receivers** directory uses the same lifecycle definition as the Active Receivers counter: production codes with `status=active`. Completed routes remain active and receive a visible `COMPLETE` badge. Gameplay-reset identities remain active with fresh progress because reset no longer releases ownership; test credentials do not appear. Results load 50 at a time, most-recent first by default, with code and progress sorting available.

Video URL changes live in PostgreSQL, so changing them does not require new QR codes.

## Database

v2 uses PostgreSQL rather than `players.json`. The schema is in `schema.sql` and is created automatically at startup.

Tables:

- `access_codes` — valid credentials and activation state;
- `players` — one row per activated player/group;
- `visits` — station discovery order;
- `video_answers` — one selected reflective choice per code and station;
- `final_reflections` — one accepted final free-text response per code;
- `app_settings` — persistent video routing configuration.

`players.code` is both the primary key and a foreign key to `access_codes.code`. This database constraint makes the identity rule mathematical rather than cookie-dependent: **one unique access code = one player/group = one persistent record**. Activation locks the access-code row and uses an idempotent unique insert, so two phones activating the same unused code converge on that same record. Re-entering an active or complete code restores visits, selected choices, and final-reflection state. Reset clears state on that identity instead of inserting a second historical player.

A row lock on the player record serializes simultaneous scans. If two members of one group scan different stations at nearly the same time, the database gives them a deterministic Stage N and Stage N+1 rather than corrupting the record.

## Reflective response and final-reflection configuration

Mission Control's **Reflective Station Responses** section provides one prompt, exactly four editable choices, and one designated correct choice for Escape, Attention, Access, and Sensory. Wrong choices are not stored. The configured correct choice is stored once under unique key `(code, station)` with the selected copy and completion timestamp; revisiting preserves that completed response.

The separate **Final Reflection** editor controls its prompt, accepted keyword/phrase family, gentle retry copy, accepted copy, and loop/wrong/correct video URLs. Final matching happens only on the server, and accepted lists are never included in player configuration or station HTML. The canonical concierge phrase is likewise absent from pre-final templates/config and is returned only after an accepted final submission.

The backward-safe schema migration adds `selected_choice`, backfills it from every existing `accepted_answer`, and retains the legacy column so deployed completion rows remain intact. Previously stored station keyword definitions are replaced by editable four-choice defaults while preserving station prompts. Legacy Stage 1–4 video fields are copied into `deprecatedStageVideos`; each station's prior Stage 1 URL seeds its loop role only when no newer role configuration exists. Completion and final video roles default blank for an operator to configure. Existing access codes, player identities, routes, video URLs, and QR destinations are not regenerated or overwritten.

## Important weak-signal behavior

Station registration is idempotent.

If the phone reaches the server and the visit is recorded but the response/video fails to load, scanning again returns the **same station and same stage**. It does not advance again.

If the phone never reaches the server, no progress is recorded. The mobile page presents a SIGNAL DEGRADED retry screen.

## Videos

The package intentionally does not include final video files.

The admin dashboard accepts:

- normal YouTube URLs (embedded automatically);
- direct `.mp4`, `.webm`, or `.ogg` URLs (native mobile video player);
- other external URLs (open as external transmission).

Mission Control groups video routing into Start/End, Functional Stations, Unauthorized, and Final Question. Each Functional station has exactly `loopVideoUrl`, `wrongVideoUrl`, and `completionVideoUrl`; the final question has exactly `loopVideoUrl`, `wrongVideoUrl`, and `correctVideoUrl`. Discovery Stage 1–4 remains route history and no longer selects Functional video content.

Mission Control persists twelve Functional role fields, three final-question role fields, two Start/End fields, and one unauthorized field. Existing persisted values are merged with current defaults rather than overwritten.

## Mission Control QR Code Generator

The authenticated `/admin` dashboard generates six QRs: Start/End, Access, Attention, Escape, Sensory, and Quick Start / Auto-Issue. Every displayed URL, QR preview, PNG, and SVG derives from the same `PUBLIC_BASE_URL` value (falling back to the current request host only when it is not configured). Viewing or downloading from the generator does not change player or database state. Always verify the displayed hostname is the intended permanent print destination before mass printing.

The Quick Start QR encodes only `/quick-start`; it never contains a player code. Deliberately opening it loads a zero-typing browser bridge, which shares an idempotency token across same-browser tabs and atomically selects one unallocated, never-owned production `UNUSED` code. Matching near-simultaneous requests serialize through `quick_start_claims` and reuse that code. First activation records durable ownership; later gameplay reset preserves the same token-to-code continuity. A fresh browser can never receive that owned credential through QuickStart. The server sets the normal persistent player cookie and redirects to the player shell. Quick Start creates no Functional visit, so the first Functional scan remains discovery Stage 1. Automated preview/prefetch requests are rejected.

Mission Control includes an operator-only Drawing Pool. Eligibility comes only from a persisted final reflection on a non-test code. Winner selection is server-side and auditable; no-repeat draws serialize transactionally, while the explicit repeat toggle permits prior winners. Prize history survives player resets, and CSV exports contain only code and completion metadata.

Optional Player Profiles let authenticated operators attach a display name, contact information, and notes to an access code. Profiles never participate in player identity, routing, completion, or drawing eligibility; they survive progress resets and remain absent from public player APIs. Before an existing profile is updated, cleared, or replaced by a restore, Mission Control stores an immutable recovery version in the same transaction. Operators can review and restore the latest 100 versions, and can download the current live profiles as an authenticated private backup CSV. Profile history, live profiles, and prize history all survive gameplay resets. Drawing Pool CSV exports include display names but exclude contact information and notes.

After final completion, the Start/End winner screen offers an optional name/nickname field. `POST /api/final-name` accepts that display name only from the completed player's existing HttpOnly-cookie identity, preserves operator contact information and notes, and uses the same profile-history protection. Name capture never determines completion or Drawing Pool eligibility.

For field reliability, short 720p H.264 MP4 files on a CDN/object-storage service are a strong eventual choice. The current broadcast/VHS aesthetic does not require 4K delivery.

## First local test — easiest method

Install Docker Desktop, then from this folder:

```bash
docker compose up --build
```

In another terminal, generate an ignored local credential inventory and import it:

```bash
docker compose exec app npm run codes:generate -- 2500
docker compose exec app npm run codes:import
```

Then open:

- Player station: `http://localhost:3000/s/attention`
- Mission Control: `http://localhost:3000/admin` (default local passphrase: `local-development-only`)
- Public Broadcast viewer: `http://localhost:3000/broadcast`

The default passphrase is development-only and can be overridden by setting `MISSION_CONTROL_PASSPHRASE` in the operator environment before starting Compose. Production must supply a separate private value through production environment/configuration. `ADMIN_KEY=local-development-only` remains a separate server-maintenance credential and is not the Mission Control login.

Use a code from the ignored private `data/access_codes.local.csv`. Never commit that file.

## Non-Docker local setup

Requirements: Node 20+ and PostgreSQL.

Set:

```bash
DATABASE_URL=<private-postgresql-url>
ADMIN_KEY=<private-server-key>
MISSION_CONTROL_PASSPHRASE=<private-operator-passphrase>
NODE_ENV=development
```

Then:

```bash
npm install
npm run codes:generate -- 2500
npm run codes:import
npm start
```

## Cloud deployment model

Use any host that supports:

- an always-on Node 20 container/service;
- PostgreSQL;
- environment variables;
- a public HTTPS URL.

Set at minimum:

```text
DATABASE_URL=<private-postgresql-url>
ADMIN_KEY=<private-server-key>
MISSION_CONTROL_PASSPHRASE=<private-operator-passphrase>
NODE_ENV=production
PUBLIC_BASE_URL=https://your-real-domain.example
```

The `Dockerfile` is provider-neutral. The host does not need your concierge computer to stay online.

After the first deployment:

1. run `npm run codes:import -- <private-credential-csv-path>` once against the production database;
2. open `/admin` and set your video URLs;
3. test all four station routes with several access codes;
4. generate final QR art only after the permanent public domain is locked.

## Generate final printable QR files

Once the real domain exists:

```bash
npm run qr -- --base-url=https://signal.your-real-domain.example
```

This creates high-resolution PNG and SVG QR files in `qr/`, plus a `.txt` file documenting each encoded URL.

**Do not print the included QR directory until it has been regenerated for the actual permanent domain.**

## Production checklist

- Cloud service and PostgreSQL both healthy.
- `/healthz` returns `{ "ok": true }`.
- Strong random `ADMIN_KEY` configured.
- 2,500 codes imported.
- Four station URLs tested from cellular data, not venue Wi-Fi.
- All desired video slots set in `/admin`.
- Unauthorized holding video set if desired.
- Final QRs regenerated against permanent HTTPS domain.
- QR signs tested after printing.
- Several complete random-order routes tested on real phones.
- Recovery tested by entering one active code on a second phone.
- All four choices render; wrong choices persist nothing and allow retry; only the configured correct choice persists and completes each station response.
- Final reflection tested for locking, forgiving matching, retry, idempotency, and reveal safety.
- Concierge has printed backup access-code sheets/cards.
- Physical stamps remain the completion authority.

## Security / operational notes

This is a low-stakes festival credential system, not an account platform. Access codes are effectively bearer credentials: anyone who knows a code can restore that group's progress. That is deliberate for simple field recovery.

Keep the admin key and Mission Control passphrase private. Operators use only the passphrase; `ADMIN_KEY` remains a server-side maintenance credential and is never sent to the Mission Control browser.

## Files worth knowing

- `server.js` — routes and cloud behavior
- `db.js` — PostgreSQL connection
- `schema.sql` — persistent data model
- `config.default.json` — initial visual/content configuration
- `public/station.html` — player mobile interface
- `public/admin.html` — Mission Control, including the experimental Program Packager
- `data/access_codes.example.csv` — header-only format example; not a usable inventory
- `data/access_codes.local.csv` — ignored local/private inventory generated on demand
- `scripts/import-codes.js` — loads an ignored local or explicitly supplied private CSV into PostgreSQL
- `scripts/generate-qr.js` — generates final station QR files
- `FIELD_OPERATIONS_QUICKSTART.md` — what you personally do at the festival
- [`archive/DEPLOYMENT_HANDOFF_PRE_CURRENT_RUNTIME.md`](archive/DEPLOYMENT_HANDOFF_PRE_CURRENT_RUNTIME.md) — historical pre-current deployment handoff; not current implementation or deployment truth
