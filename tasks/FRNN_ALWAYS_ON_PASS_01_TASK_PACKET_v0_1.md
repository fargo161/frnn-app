# FRNN Always-On Pass 01 — Task Packet

**Document type:** Implementation Task Packet
**Reality state:** DESIGNED — not proof of implementation
**Baseline:** `2ff739c8bbd3b07b5f213d5c7cc9dfa735d07bed`
**Status:** Pending
**Created:** 2026-08-24

> This packet defines work requested from the stated baseline.
> Source code, runtime behavior, and behavioral tests remain authoritative for what is actually implemented.

Packet date: 2026-08-24 (America/New_York)  
Director call: prepare only; do not implement  
Implementation repository: `C:\Users\mcdon\Documents\ChatGPT\frnn-app`  
Inspected branch/SHA: `main` / `2ff739c8bbd3b07b5f213d5c7cc9dfa735d07bed`  
Repository state at inspection: clean and synchronized with `origin/main`  
Baseline test result: 183 passed, 0 failed, 1 PostgreSQL integration test skipped because `TEST_DATABASE_URL` was not supplied

## 1. Directive

Implement the first usable always-on FRNN player experience so an authenticated player can use **News, Upload, and Profile when no event is active**.

This pass must make “no active event” a normal operating state, not an error or maintenance state. It must preserve the inherited ARTPARK quest, stable QR routes, player identity, Mission Control, and production data.

This document is the task packet only. No application, database, infrastructure, deployment, or production mutation is authorized by this packet.

## 2. Executive scope

Deliver one bounded vertical slice:

1. **Always-on context:** the player shell loads from persistent FRNN platform identity with `activeEvent: null` when no event is active.
2. **News:** players can read published platform news outside events. Existing Mission Control can create drafts and explicitly publish/archive text-only items, with audit records.
3. **Upload:** players can send allowlisted image/video files directly to a private R2 quarantine bucket and see their own pending submission history. Upload does not mean publication.
4. **Profile:** players can view and update their own display name without exposing or overwriting operator-only contact information, notes, or history.
5. **Event overlay:** when an event is active, its branding, Weather / Info destination, event-scoped news, and quest entry augment the same shell. When it is inactive, News, Upload, and Profile remain.

The pass is complete only when the no-active-event path is exercised in tests and the full inherited regression suite stays green.

## 3. Why this pass is needed

Current source has the right shell shape but not the always-on behavior:

- `events.js#getDefaultEvent()` returns only event 1 when its status is `active`.
- `GET /api/event` returns HTTP 503 when that event is not active.
- `public/player.html` waits for `/api/event` and `/api/player-profile` together, so no event makes the whole shell fail.
- News and Upload are placeholders only.
- the owner profile API is read-only and returns an avatar placeholder.
- `media-storage.js` can list objects and construct public URLs but cannot create or verify private uploads.
- the configured `artpark` R2 bucket has public delivery; it is not an acceptable quarantine store for private/pending player submissions.

The current documentation already establishes the governing product rule:

```text
NO ACTIVE EVENT != FRNN OFFLINE
PLAYER UPLOAD + NO APPROVAL != PUBLIC FIELD REPORT
```

## 4. Architecture contract

### 4.1 Lawful combinations in this pass

| Actor | Content | Context | Authority | Presentation | Authoritative owner |
|---|---|---|---|---|---|
| Player | Published news | Always-On | View | Player News tab | News module / PostgreSQL |
| Player | Private upload | Always-On or active event | Submit and view own | Player Upload tab | Upload module / PostgreSQL metadata + private R2 bytes |
| Player | Own display name | Persistent identity | View/edit own public name | Player Profile tab | Profile module / PostgreSQL |
| Current Mission Control operator | Text news item | Platform or active event | Draft, explicit publish, archive | Mission Control News desk | News module / PostgreSQL + audit |
| System | Event context | Optional active event | Resolve | Player shell | Platform/Event modules / PostgreSQL |

The current shared-passphrase Mission Control session is a **transitional privileged publisher** for this pass. It does not establish the future Master/Producer permission model. Every publish/archive transition must be explicit and audited so it can later move behind capability checks without changing the news lifecycle.

### 4.2 Ownership answers required by the architecture

1. **Actor:** player, current Mission Control operator, or system resolver.
2. **Content:** text news item, private player upload, public display name, optional event context.
3. **Context:** platform always-on by default; active event is a nullable overlay.
4. **Authority:** view own/public, edit own name, submit private upload, or authenticated draft/publish/archive.
5. **Presentation:** player shell and a bounded Mission Control News/Upload area.
6. **Truth owner:** PostgreSQL domain records and lifecycle state.
7. **Editorial owner:** news records; upload bytes alone have no editorial/public meaning.
8. **Presentation owner:** `public/player.html`, `public/admin.html`, and shared styling.
9. **Existing invariants:** identity survives events; codes/private fields never enter public serializers; PostgreSQL stores metadata, not media blobs; R2 stores bytes; upload is not publication.
10. **New invariants:** FRNN core never requires an active event; pending upload bytes are never publicly addressable; owner name edits preserve private fields; archiving an event cannot delete or disable platform content or identity.
11. **Invalid combinations to test:** no event causing 503; pending upload returning a public URL; body-supplied access code choosing upload ownership; profile edit clearing contact/notes; draft/archived news in the player feed; event-scoped news outside its event.

## 5. Product behavior

### 5.1 Shell state matrix

| State | Header/theme | Visible primary tabs | News | Profile quest area |
|---|---|---|---|---|
| No active event | Persistent FRNN / Fried News platform identity and base theme | News, Upload, Profile | Published platform items only | Profile remains; event quest CTA is hidden and archived/current fixed progress is not presented as an active assignment |
| Active event | FRNN identity plus event name/theme overlay | News, Upload, Weather / Info, Profile | Published platform items plus matching event items | Current fixed quest summary and Start / End CTA may appear |
| No player cookie | Public shell route may render, but private bootstrap redirects to `/quick-start` | N/A | No private shell session | No profile/upload data disclosed |

An event may alter context and presentation. It must not rename the platform, own the player, or be required for core bootstrap.

### 5.2 News first-pass behavior

- Text-only items: title, summary, body, scope, lifecycle, timestamps.
- Scope is either `platform` or one specific event.
- Lifecycle is `draft -> published -> archived`.
- Player feed returns only `published` items whose `published_at` is not in the future.
- With no event, the feed returns platform items only.
- With an active event, the feed returns platform items plus that event’s items.
- Newest published item appears first; pagination is bounded.
- Mission Control creates drafts, edits drafts, publishes, and archives through separate explicit actions.
- Render all operator-provided text with `textContent`; no HTML or Markdown rendering in this pass.
- Audit details contain record ID, scope, and lifecycle transition, not story body text.
- Empty feed has an intentional FRNN “no current transmission” state, not a network error.

### 5.3 Upload first-pass behavior

- Authenticated player selects one allowlisted file and optionally adds a short caption.
- Allowlist: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `video/mp4`, `video/webm`.
- Maximum file size: 25 MiB.
- Filename is display metadata only. The storage key is generated by the server and contains a UUID, never an access code or display name.
- Client requests an upload intent; server records ownership and returns a ten-minute presigned `PUT` URL for the private bucket.
- Client uploads directly to R2, then calls completion.
- Completion performs `HeadObject` and verifies expected key, content type, and byte size before transitioning to `pending_review`.
- Player can list only their own submissions and sees filename, caption, type, size, status, and submitted time.
- Player/API never receives a public URL or unrestricted object key.
- Mission Control can list bounded pending metadata for operational visibility, but cannot approve or publish in this pass.
- Limit new intents to five per player in a rolling hour and reject when the player already has three unexpired `initiated` uploads.
- Allowed lifecycle: `initiated`, `pending_review`, `expired`, `failed`. Publication states do not exist in this pass.
- The event ID captured at intent creation is nullable context metadata. It never owns the upload.

### 5.4 Profile first-pass behavior

- Owner sees display name and private recovery code exactly as today.
- Owner can update display name only.
- The update must lock the access-code/profile state, preserve `contact_info` and `notes`, snapshot the previous profile when changed, and attribute the version/audit source to `PLAYER`.
- Normalization, 80-character limit, and friendly `DISPLAY_NAME_TAKEN` conflict remain.
- Request body cannot choose a code or event.
- Owner projection remains `Cache-Control: no-store, private` and never includes contact info, notes, history, or internal event IDs.
- Avatar remains a placeholder. Avatar selection/cropping/publication is not part of this pass.

## 6. Data model and migration

Create one additive numbered migration, recommended name:

`migrations/002_frnn_always_on_foundation.sql`

Do not rewrite migration 001. Do not remove or reinterpret inherited quest rows. The migration must be transactional and safe under the existing migration runner/advisory lock.

### 6.1 `platform_settings`

Singleton platform identity independent of events:

- `id SMALLINT PRIMARY KEY` constrained to `1`
- `network_name`, `network_short_name`, `show_name`
- `base_theme_json JSONB` constrained to an object
- `created_at`, `updated_at`

Seed FRNN / Fried News values from the canonical documentation. The active event can overlay festival label/theme but cannot replace the platform identity record.

### 6.2 `news_items`

- `id BIGSERIAL PRIMARY KEY`
- `scope TEXT CHECK (scope IN ('platform','event'))`
- nullable `event_id REFERENCES events(id)`
- consistency check: platform scope has no event; event scope has one
- `status TEXT CHECK (status IN ('draft','published','archived'))`
- bounded `title`, `summary`, `body_text`
- `created_by`, nullable `published_by`, nullable `archived_by`
- `published_at`, `created_at`, `updated_at`
- indexes supporting published feed order, scope/event filtering, and Mission Control lifecycle lists

Do not seed fake editorial news. Tests should insert fixtures. Production may legitimately begin with the empty state.

### 6.3 `player_uploads`

- application-generated UUID `id PRIMARY KEY`
- `code REFERENCES players(code) ON DELETE CASCADE`
- nullable `event_id REFERENCES events(id)`
- unique `object_key`
- bounded `original_filename`, `caption`, `content_type`
- positive `byte_size` capped at 25 MiB
- `status CHECK (status IN ('initiated','pending_review','expired','failed'))`
- `expires_at`, nullable `confirmed_at`, `created_at`, `updated_at`
- indexes for owner history, status queue, expiry cleanup, and rate-limit queries

Do not add media bytes, presigned URLs, credentials, raw access codes, or provider response bodies to PostgreSQL.

### 6.4 Known model debt not corrected here

Migration 001 placed `event_id=1` on access codes, players, profiles, and profile history and made normalized display-name uniqueness event-scoped. This is not the final persistent multi-event identity model. Pass 01 may continue using those inherited columns because archiving event 1 does not delete the rows, but new News and Upload logic must not use inherited `event_id=1` as evidence that an event is active.

Do not broaden this packet into a full identity/event rescope migration. Record that as a later dedicated pass.

## 7. API contract

Names may be adjusted to existing route style, but behavior must remain equivalent.

### Public/context read

- `GET /api/context`
  - `200 { platform, activeEvent }`
  - `activeEvent` is an event projection or `null`; no-event is never 503.
  - theme tokens pass through the existing safe color projection.
- Keep `GET /api/event` compatible for current callers. Recommended behavior is `200 { event: null }` when none is active, with the player shell migrating to `/api/context`.

### News

- `GET /api/news?cursor=<opaque>&limit=<1..25>`
  - published, currently eligible items only
  - no access codes/operator data
- `GET /api/admin/news?status=<...>&cursor=<...>` — authenticated, bounded
- `POST /api/admin/news` — authenticated draft creation only
- `PUT /api/admin/news/:id` — authenticated draft edit only
- `POST /api/admin/news/:id/publish` — explicit transition and audit
- `POST /api/admin/news/:id/archive` — explicit transition and audit

Use transactional compare-and-set lifecycle updates so concurrent publish/archive requests converge cleanly.

### Upload

- `POST /api/player-uploads/intents`
  - cookie-authorized; body contains only filename, caption, content type, byte size
  - `201 { upload: ownerProjection, putUrl, expiresAt }`
- `POST /api/player-uploads/:id/complete`
  - cookie-authorized and owner-scoped
  - verifies private object metadata before lifecycle transition
- `GET /api/player-uploads?cursor=<opaque>&limit=<1..25>`
  - cookie-authorized, owner-only metadata
- `GET /api/admin/player-uploads?status=pending_review&cursor=<...>`
  - authenticated bounded metadata queue; no publication action

All new player mutation routes must reject cross-origin browser requests and ignore/reject body-supplied access codes.

### Profile

- retain `GET /api/player-profile`
- add `PUT /api/player-profile`
  - cookie-authorized
  - accepts `{ displayName }` only
  - `200` owner projection
  - `400` invalid/missing name
  - `409` normalized name conflict

Do not call the generic `normalizeProfileInput()` with omitted private fields and then save blanks. Add/use an owner-specific name command that explicitly preserves private fields.

## 8. Storage and infrastructure gate

### Required before production upload enablement

Provision a separate private R2 bucket or equivalent private storage boundary for quarantine uploads. The existing public `artpark` bucket and its `r2.dev` delivery URL must not be used for pending submissions.

Recommended new environment contract:

- `R2_UPLOAD_BUCKET_NAME`
- reuse the verified account endpoint and least-privilege credentials only if those credentials are explicitly granted access to the private bucket
- no `R2_UPLOAD_PUBLIC_BASE_URL`
- allowed-origin configuration for the production FRNN origin and local development origin, limited to presigned `PUT` requirements

The credential should have only the object operations required for intent/verification and later cleanup on the upload bucket. It should not grant account-wide administration.

Extend `media-storage.js` through provider-neutral methods for presigned put and head metadata. Keep dependency injection so tests do not require network credentials. Add `@aws-sdk/s3-request-presigner` as an explicit dependency if used directly.

If private upload storage is absent:

- application startup and News/Profile must remain healthy;
- Upload tab must show a controlled “submissions temporarily unavailable” state;
- intent API returns a controlled 503 such as `UPLOAD_STORAGE_NOT_CONFIGURED`;
- no fallback to local disk, PostgreSQL blobs, or the public media bucket is allowed.

## 9. Implementation work packages

### WP-01 — Context resolver and no-event shell

- Add persistent platform settings projection.
- Resolve zero-or-one active event without assuming ID 1 is active.
- Make `/api/context` and `/api/event` no-event-safe.
- Bootstrap shell from platform context plus owner profile.
- Render only News, Upload, Profile outside events; add Weather / Info and event quest presentation only when active.
- Preserve stable `/quick-start`, `/player`, `/s/start-end`, and four station routes.

### WP-02 — News domain and player feed

- Add migration tables/indexes and `news.js` domain helpers.
- Add bounded published feed query and serializers.
- Add Mission Control draft/edit/publish/archive endpoints with transactions and audit.
- Add a minimal text News desk to Mission Control.
- Replace the player News placeholder with loading, empty, item, and error states.

### WP-03 — Owner profile editing

- Add dedicated owner-name service/route preserving private fields and history.
- Add inline edit/save/cancel UI and conflict messaging.
- Hide event-only quest presentation when no event is active.
- Keep recovery code private and uncached.

### WP-04 — Private upload submission

- Add migration table and `player-uploads.js` lifecycle/validation helpers.
- Extend the R2 adapter for presigned `PUT` and `HeadObject` verification.
- Add intent, completion, owner history, quotas, and controlled unavailable state.
- Add player file/caption/progress/status UI.
- Add read-only pending upload metadata to Mission Control.
- Never expose or publish a pending object.

### WP-05 — Verification and documentation

- Add unit/static tests alongside dedicated PostgreSQL integration coverage.
- Run the complete suite against disposable PostgreSQL so no database test is skipped.
- Update `.env.example`, README current/planned labels, `docs/INFRASTRUCTURE.md`, and architecture implementation-reality status only after behavior exists.
- Produce a deployment/readiness handoff; do not deploy without a separate call.

Recommended commit order mirrors the work packages. Each commit should keep tests green or include its associated tests.

## 10. Expected file map

### New files

- `migrations/002_frnn_always_on_foundation.sql`
- `platform-context.js`
- `news.js`
- `player-uploads.js`
- focused tests such as `test/always-on.test.js`, `test/news.test.js`, and `test/player-uploads.test.js`

### Expected edits

- `server.js`
- `events.js`
- `player-shell.js`
- `player-profiles.js`
- `media-storage.js`
- `public/player.html`
- `public/admin.html`
- `public/styles.css` if shared styling is extracted
- `package.json` / `package-lock.json`
- `.env.example`
- `README.md`
- `docs/INFRASTRUCTURE.md`
- `COMBINATORIAL_ARCHITECTURE.md` implementation-reality labels only

Do not edit `migrations/001_frnn_event_foundation.sql`. Avoid unrelated formatting of the large HTML files and `server.js` so review stays bounded.

## 11. Acceptance criteria

### Always-on mode

- [ ] With every event archived, `/healthz` remains healthy.
- [ ] `GET /api/context` returns FRNN platform identity and `activeEvent: null`.
- [ ] An authenticated player loads `/player` without a shell error.
- [ ] Exactly News, Upload, and Profile are primary destinations outside events.
- [ ] QuickStart still enters `/player` and does not consume another code for an existing identity.
- [ ] Archiving an event does not delete/change player, profile, news, or upload records.

### News

- [ ] Published platform items appear outside events newest-first.
- [ ] Draft, archived, and future-published items do not appear.
- [ ] Event items appear only for their active event.
- [ ] Empty state is deliberate and accessible.
- [ ] Mission Control mutations require authentication and write an audit transition without body text.
- [ ] Player serializer contains no code, operator, or private metadata.

### Upload

- [ ] Missing private storage produces a controlled unavailable state without breaking News/Profile/startup.
- [ ] Valid allowlisted upload completes only after storage metadata verification.
- [ ] Wrong owner, wrong object metadata, over-limit size, disallowed MIME, expired intent, quota excess, and cross-origin mutation are rejected.
- [ ] Player sees only their submissions.
- [ ] Pending response contains no public URL or raw access code.
- [ ] Object key contains no code, name, or original filename.
- [ ] No pending object is written to the public bucket, local disk, or PostgreSQL.
- [ ] Upload success never creates a News item or published field report.

### Profile

- [ ] Owner can change display name from Profile outside events.
- [ ] Normalization and conflict behavior match QuickStart.
- [ ] Contact info and notes remain byte-for-byte preserved through owner rename.
- [ ] Previous changed state is recoverable in profile history.
- [ ] Another player cannot be targeted through params/body.
- [ ] Owner response excludes contact info, notes, history, and internal IDs.

### Regression and quality

- [ ] Complete existing suite passes.
- [ ] New suite passes against disposable PostgreSQL with zero skipped database tests.
- [ ] Migration 002 applies once and direct rerun/idempotency expectations are documented/tested where applicable.
- [ ] Historical stable routes and fixed quest/final behavior remain unchanged.
- [ ] JavaScript syntax, Docker build, and `/healthz` smoke check pass.
- [ ] Mobile touch/keyboard, focus, reduced-motion, and screen-reader status/error states are covered proportionately.

## 12. Required test scenarios

At minimum, automate these scenarios:

1. Archive event 1; context returns null event and shell core remains usable.
2. Reactivate event 1; event overlay returns without changing core records.
3. Platform/event/draft/archived/future news filtering.
4. Concurrent news publish attempts produce one valid transition and bounded audit behavior.
5. Owner rename preserves operator-only fields and creates expected history.
6. Concurrent normalized display-name collision allows one owner.
7. Upload intent validation, rate limits, ownership, expiry, and completion compare-and-set.
8. Injected storage reports mismatched size/type/missing object; completion remains non-published.
9. Upload endpoints cannot accept another code from request data.
10. API responses and HTML contain no pending public URL, credentials, private profile data, or unsafe HTML insertion.
11. News/Profile continue when upload storage configuration is missing.
12. Existing QuickStart, Start/End, station, final reflection, Mission Control, Drawing Pool, QR, and profile recovery tests stay green.

## 13. Non-goals

Do not include these in Pass 01:

- avatar upload, cropping, or public avatar projection;
- moderation decisions or publication of player uploads;
- conversion from upload to Field Report or News;
- public media/gallery/crawl/ticker/output displays;
- rich text, embeds, comments, likes, follows, chat, or social graph;
- Master/Producer accounts, granular permissions, or general approval engine;
- Breaking News, Emergency, broadcast precedence, scheduling UI, or livestreaming;
- generic quests/assignments or refactoring the fixed station quest;
- automatic weather ingestion;
- multi-event identity/profile rescope;
- production deployment or infrastructure mutation.

## 14. Risks and stop conditions

### R1 — Private storage is not currently evidenced

Stop production upload enablement unless a non-public upload bucket, least-privilege access, and correct CORS are verified. Never treat unguessable keys in a public bucket as privacy.

### R2 — Reviewed deployment SHA has moved

The production preflight pinned `91f60d8`, while current canonical `main` is `2ff739c` because documentation was reconciled afterward. Before any later deployment, repeat the affected SHA/build/test/preflight gates against the actual implementation commit.

### R3 — Event uniqueness is not enforced

Current schema permits multiple rows with `status='active'`. This pass must either add a safe unique partial index or define a deterministic resolver and reject ambiguous active state. Preferred: migration audit plus unique partial index allowing at most one active event. Stop migration if production has more than one active row; do not silently archive one.

### R4 — Legacy identity is event-stamped

Do not use inherited `event_id=1` as an authorization or current-context check. Do not attempt a broad corrective migration inside this pass.

### R5 — Large-file handling

Do not route 25 MiB bodies through `express.json`, memory buffers, or Render’s ephemeral disk. Use presigned direct upload and provider metadata verification.

### R6 — Scope pressure

If implementation requires publication/moderation of player uploads, public asset delivery, avatar support, or granular roles to satisfy a proposed choice, stop and issue a follow-on packet instead of silently expanding Pass 01.

## 15. Verification and release handoff

Implementation completion is not deployment approval. The implementer should return:

- final branch and SHA;
- concise file/migration/API summary;
- full test/Docker results;
- disposable PostgreSQL migration evidence;
- private upload storage configuration contract with no secret values;
- manual no-event and active-event smoke results;
- security/privacy checks;
- known debt and follow-on recommendations;
- a fresh controlled-deployment packet based on the final SHA.

Database rollback should favor application rollback while leaving additive tables in place unless verified data corruption requires restoration. Do not create a destructive down migration merely for ordinary application rollback.

## 16. Director decision

**TASK PACKET READY FOR REVIEW — IMPLEMENTATION NOT STARTED**

Recommended approval is for the bounded scope above, with private upload storage treated as a production enablement gate and with avatar/moderation/publication deferred.
