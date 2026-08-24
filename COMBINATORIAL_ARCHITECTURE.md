# FRNN Combinatorial Architecture

> **Functionality owns truth. Media owns content. Style owns presentation.**

This document is FRNN's architectural grammar: a way to describe features as lawful combinations of small modules rather than as pages, routes, or one-off special cases.

## Repository and evidence language

- Repository: `fargo161/frnn-app`
- Current implementation statements refer to the current source on `main`, not a permanently authoritative frozen SHA.
- Historical introduction commits may be recorded for provenance, but they do not prove later repository state.

Status labels have strict meanings:

- **CURRENT** — implemented in the current source.
- **PARTIAL** — a bounded foundation exists, but not the full module described here.
- **PLANNED / TARGET DESIGN** — required direction, not proof of implementation.
- **DEFERRED** — intentionally outside the immediate build sequence.

Repository code is authoritative for implementation reality. Design documents and this grammar are authoritative for intended direction only. A target-design statement never makes a feature current.

## 1. The ownership rule

### Functionality owns truth

Functionality owns authoritative state, identity, permissions, assignments, lifecycle state, APIs, constraints, quest completion, audit history, and broadcast precedence. Today, PostgreSQL tables in `schema.sql`, the additive migration `migrations/001_frnn_event_foundation.sql`, and transactional behavior in `server.js` and `db.js` are examples.

### Media owns content

Media owns what is shown and why: stories, captions, uploads, ticker copy, Fried News packages, Breaking packages, and asset intent. Object storage owns media bytes; domain records own metadata and object keys. `media-storage.js` is a **PARTIAL** S3-compatible/R2 boundary, not a current upload or editorial pipeline.

### Style owns presentation

Style owns visual hierarchy, branding, interaction patterns, mobile behavior, Mission Control UX, output layouts, and accessibility. `public/station.html`, `public/player.html`, `public/admin.html`, and `public/styles.css` are current presentation artifacts.

The boundary is enforceable:

- Style cannot invent authoritative state.
- Media cannot redefine backend truth.
- Functionality cannot silently redefine editorial meaning or visual intent.

## 2. Combination grammar

### Diagram 2 — Combination Grammar

```text
ACTOR
  × CONTENT
  × CONTEXT
  × AUTHORITY
  × PRESENTATION
  = EXPERIENCE / SYSTEM BEHAVIOR
```

```text
                    ┌───────────┐
                    │   ACTOR   │
                    └─────┬─────┘
                          ×
┌─────────┐       ┌───────▼───────┐       ┌──────────────┐
│ CONTENT │   ×   │    CONTEXT    │   ×   │  AUTHORITY   │
└─────────┘       └───────┬───────┘       └──────────────┘
                          ×
                  ┌───────▼───────┐
                  │ PRESENTATION  │
                  └───────┬───────┘
                          =
                  LAWFUL EXPERIENCE
```

| Axis | Question | Examples |
|---|---|---|
| Actor | Who initiates, owns, consumes, or resolves? | Player, Producer, Master, Public Display, System |
| Content | What meaningful thing is handled? | Profile, upload, story, quest, announcement, broadcast package |
| Context | Where/when/for whom does it apply? | Always-On, event, temporary party, player-specific, public broadcast |
| Authority | What operation is permitted? | View, draft, edit, submit, approve, publish, assign, activate, archive, override |
| Presentation | How is authoritative state/content projected? | Player app, Mission Control, crawl, ticker, overlay, projector |

Content type alone never implies publication or authority:

```text
PLAYER UPLOAD ≠ PUBLIC FIELD REPORT
```

## 3. Actor axis

| Actor | Can own/request | Cannot directly do | Exposure |
|---|---|---|---|
| **Player** | Owns a persistent private identity and profile relationship; may request views, submit an upload, answer/complete assigned quests | Approve publication, see another access code, assign authority, activate Emergency | Private player interaction plus intentionally public persona fields |
| **Producer** | Creates/edits within individual permissions; submits work; may publish only when specifically granted | Assume global authority, manage permissions without grant, activate Emergency in v1 | Operator-facing |
| **Master** | Owns permission management, approval, overrides, player management, assignment, broadcast activation, configuration, audit visibility | Bypass audit/invariants | Private owner/operator-facing |
| **Public Display** | Requests an authorized projection such as program, crawl, ticker, or overlay | Mutate truth, approve content, retain private identity fields | Public, non-player consumer (projector, OBS, browser, mapped surface) |
| **System** | Resolves rules, schedules, lifecycle transitions, precedence, and automation | Invent editorial intent or exceed configured authority | Server-side |

**CURRENT evidence:** access-code players, a shared-passphrase Mission Control operator, and server-side resolvers exist (`server.js`, `mission-control.js`). Fine-grained Producer/Master accounts are **PLANNED**.

## 4. Content axis

| Content type | Architectural meaning | Status |
|---|---|---|
| Player profile | Public persona fields separated from private/operator fields | **PARTIAL:** `player_profiles`, `player_profile_versions`, `player-profiles.js`; avatar is not implemented |
| Player upload | Player-originated private object and metadata | **PLANNED** |
| Field report | Approved/published player contribution | **PLANNED** |
| Staff story | Staff-authored editorial item | **PLANNED** |
| Fried News package | Structured editorial/program package | **PLANNED** |
| Ticker content | Short scheduled/active text items | **PLANNED** |
| Official announcement | Authoritative event/platform notice | **PLANNED** |
| Weather information | Official event information, not arbitrary page copy | **PLANNED** |
| Quest | Reusable definition independent of assignment/context | **PARTIAL:** fixed four-station/final-reflection flow exists; generic quest records do not |
| Quest media | Puzzle/pass/fail/clue/contact assets linked by keys | **PARTIAL:** configured video URLs exist; generic roles do not |
| Clue | Quest-linked aid with its own availability rules | **PLANNED** |
| Contact/special transmission | Targeted quest communication | **PLANNED** |
| Breaking News package | Approved high-priority temporary program package | **PLANNED** |
| Emergency notice | Highest-priority audited notice | **PLANNED** |
| Future live stream | Live source assigned to a program/breaking slot | **DEFERRED — LAST FEATURE OF V1** |

## 5. Context axis

### Always-On — TARGET DESIGN

FRNN remains useful outside festivals: News Crawl, Upload, Profile, and assigned personal quests.

```text
NO ACTIVE EVENT ≠ FRNN OFFLINE
```

### Event / Festival — PARTIAL

An event is a temporary overlay: branding/icon, Weather / Info, physical puzzle nodes, event quests, announcements, and programming. Migration `001_frnn_event_foundation.sql` creates `events`, adds `event_id` to ten tables, and seeds event 1. Current APIs resolve only the default active event through `events.js` and `GET /api/event`.

### Party / Temporary Event — TARGET DESIGN

Uses the same event abstraction at smaller scope; it must not introduce a parallel identity system.

### Player-Specific — TARGET DESIGN

Targets content or assignments to one persistent player regardless of event state.

### Public Broadcast — CURRENT / EXPERIMENTAL BASE; TARGET DESIGN INCOMPLETE

The current `/broadcast` viewer projects one global Program queue and PostgreSQL-authoritative clock through public `/api/broadcast` state without exposing private identity. Approval workflows, richer editorial state, and production output infrastructure remain target design.

```text
EVENT ENDS ≠ PLAYER IDENTITY ENDS
```

## 6. Authority axis

Authority is a capability, not a synonym for actor or role:

`view`, `draft`, `edit`, `submit for approval`, `approve`, `publish`, `assign`, `activate`, `archive`, `override`, `manage permissions`.

```text
PRODUCER + DRAFT QUEST + SUBMIT PERMISSION
= PENDING QUEST CHANGE

MASTER + APPROVE + PENDING QUEST CHANGE
= APPROVED QUEST CHANGE
```

```text
ROLE ≠ PERMISSION SET
```

**CURRENT:** `MISSION_CONTROL_PASSPHRASE` creates a server-validated operator session (`mission_control_sessions`, `requireAdmin` in `server.js`), and `ADMIN_KEY` is a separate maintenance credential. **PLANNED:** accounts, per-person capabilities, Master ownership, and approval lifecycle.

## 7. Presentation axis

Presentation is independent of truth/content. Required surfaces are player app, Mission Control, News Crawl, Upload, Profile, Weather / Info, quest interruption, Breaking takeover, Emergency takeover, program display, crawl display, ticker display, overlay display, and future live-video presentation.

**CURRENT/PARTIAL:** `/player`, `/admin`, `/quick-start`, `/s/start-end`, and four `/s/:station` routes render current player and operator state. Dedicated crawl, ticker, overlay, program, upload, Breaking, Emergency, and Weather surfaces are not implemented.

One state can lawfully have multiple projections:

```text
AUTHORITATIVE STATE
       │
       ├── PLAYER APP
       ├── MISSION CONTROL
       ├── PROGRAM DISPLAY
       ├── CRAWL DISPLAY
       ├── TICKER DISPLAY
       └── OVERLAY DISPLAY
```

Each surface receives only the subset it needs. No surface becomes independent truth.

## 8. Core platform module map

### Diagram 1 — Module Map

```text
FRNN PLATFORM
│
├── IDENTITY ─── PROFILE
├── EVENTS ───── QUESTS ───── ASSIGNMENTS
├── MEDIA ────── FIELD REPORTS
├── EDITORIAL / PROGRAM ───── BROADCAST STATE ───── OFFICIAL INFO
├── AUTH / PERMISSIONS ────── APPROVALS ─────────── AUDIT
├── PLAYER SURFACES
├── MISSION CONTROL
└── EXTERNAL OUTPUTS
```

### Module contracts

| Module | Responsibility and authoritative data | Inputs → outputs | Dependencies / forbidden responsibility | Status and extension |
|---|---|---|---|---|
| **Identity** | Private canonical player identity, authentication continuity, lifecycle. Owns `access_codes`, `players`, cookies, `quick_start_claims` | Access/QuickStart → stable player reference | May feed Profile/Assignments; must not expose codes publicly or own editorial meaning | **CURRENT:** `schema.sql`, `quick-start.js`, `server.js`. Extend to persistent platform identity without replacing codes |
| **Profile** | Public persona plus private operator metadata/history | Player/operator input → scoped persona/private views | Depends on Identity; must not determine completion or expose contact/notes publicly | **PARTIAL:** `player_profiles`, versions, `player-profiles.js`, `/api/player-profile`; add avatar/object key and explicit public projection |
| **Events** | Context lifecycle, branding, dates/status | Active event → context projection | May scope quests/content; must not contain/delete identity | **PARTIAL:** `events`, `events.js`, `/api/event`, migration 001; add lifecycle/selection/temporary-event management |
| **Quests** | Reusable definitions, rules, media roles, completion semantics | Definition + activation → quest state/result | May depend on Media; must not be defined by a QR or event | **PARTIAL:** fixed visits/responses/final flow in `server.js`; add generic quest tables/services |
| **Assignments** | Targets quest/content to player, event, or all players; availability/priority/consumption | Target + quest + authority → availability | Depends on Identity/Events/Quests/Auth; must not duplicate quest definition | **PLANNED:** manual first, rule-based later |
| **Media** | Asset metadata, object keys, editorial asset intent | Upload/selection → validated asset reference | Bytes in object storage; must not store blobs in PostgreSQL or mutate domain state | **PARTIAL:** `media-storage.js` supports bounded listing/public URLs; add upload/quarantine/metadata lifecycle |
| **Field Reports** | Moderation/publication lifecycle for player contributions | Player upload + approval → public report | Depends on Media/Identity/Approvals; must never publish merely because upload succeeded | **PLANNED** |
| **Editorial / Program** | Stories, Fried News packages, ticker and scheduling | Draft items → ordered program state | Depends on Media/Approvals; must not own broadcast precedence | **CURRENT / EXPERIMENTAL base:** one ordered global Program queue and bare Mission Control Packager; stories, ticker, scheduling, and approval lifecycle remain planned |
| **Broadcast State** | Normal/Breaking/Emergency precedence and active pointers | Approved activation → resolved broadcast state | Depends on Editorial/Auth/Audit; must preserve lower-priority state | **CURRENT / EXPERIMENTAL base:** one PostgreSQL master-clock anchor with explicit start/stop and looping queue; Normal/Breaking/Emergency precedence remains planned |
| **Official Info** | Weather, announcements, event info | Authorized source/editor → scoped official item | Depends on Events/Approvals; must not be arbitrary style copy | **PLANNED** |
| **Auth / Permissions** | Accounts, roles, capabilities, sessions | Credentials + policy → authorization decision | Must gate mutations and feed Audit; must not equate Producer with universal permission | **PARTIAL:** shared passphrase sessions/admin gate; add Master/Producer accounts and grants |
| **Approvals** | Draft/review/publication transitions | Submitted change + decision → approved/rejected state | Depends on Auth/Audit; must not edit payload invisibly | **PLANNED** |
| **Audit** | Immutable operator/system action history | Authorized action → actor/time/detail record | Receives from all mutating modules; must not become editable content | **PARTIAL:** `mission_control_audit`, profile versions, `prize_draws`; expand to all privileged lifecycle transitions |
| **Player Surfaces** | Mobile projections and interactions | Scoped APIs → player UX/commands | Depends on domain APIs; must not invent completion/publication | **PARTIAL:** `public/station.html`, `player.html`, `quick-start.html`; add always-on shell/upload/crawl/personal quest views |
| **Mission Control** | Operator projection and allowed commands | Authenticated APIs → operational UX | Depends on Auth/domain modules/Audit; must not become the database or bypass approvals | **CURRENT base / PARTIAL target:** `public/admin.html` plus `/api/admin/*`; add accounts, permissions, drafts, review |
| **External Outputs** | Read-only public program/crawl/ticker/overlay projections | Resolved public state → browser/OBS/projector output | Depends on Broadcast/Editorial; must not expose secrets or own state | **CURRENT / EXPERIMENTAL base:** public `/api/broadcast` and minimal `/broadcast` viewer; crawl, ticker, overlay, OBS, and projector outputs remain planned |

## 9. Lawful combinations

```text
PLAYER + ACCESS CODE = PERSISTENT IDENTITY
PLAYER + PROFILE = PUBLIC PLAYER PERSONA
PLAYER + QUEST + PLAYER ASSIGNMENT = PRIVATE QUEST
PLAYER + QUEST + EVENT ASSIGNMENT = EVENT QUEST
QUEST + PHYSICAL STATION = QR-TRIGGERED QUEST
EVENT + EVENT BRANDING + QUEST SET + OFFICIAL INFO = FESTIVAL MODE
NO ACTIVE EVENT + FRNN CORE = ALWAYS-ON MODE
PLAYER UPLOAD + APPROVAL + PUBLICATION + FRNN PRESENTATION = PUBLIC FIELD REPORT
STAFF MEDIA + EDITORIAL PACKAGE + PUBLICATION = FRNN STORY
PRODUCER + DRAFT CHANGE + MASTER APPROVAL = LIVE CHANGE
PRODUCER + DIRECT-PUBLISH PERMISSION + ORDINARY STORY = LIVE STORY
NORMAL PROGRAM + BREAKING STATE = BREAKING PROGRAM
ANY CURRENT STATE + EMERGENCY = EMERGENCY PRESENTATION
ONE BROADCAST STATE + PLAYER APP = PLAYER PRESENTATION
ONE BROADCAST STATE + PROGRAM DISPLAY = PROJECTOR PRESENTATION
ONE TICKER STATE + TRANSPARENT OUTPUT = PROJECTION-MAPPING TICKER
PLAYER + PERSONAL QUEST ASSIGNMENT + NO ACTIVE EVENT = BETWEEN-EVENT QUEST
EVENT ENDS + PERSISTENT PLAYER = ARCHIVED EVENT PROGRESS + CONTINUING FRNN IDENTITY
```

These are design equations, not a claim that every operand is implemented.

## 10. Invalid combinations

```text
PLAYER UPLOAD + NO APPROVAL ≠ PUBLIC FIELD REPORT
PUBLIC FIELD REPORT + ACCESS CODE = PRIVACY VIOLATION
PRODUCER + NO ASSIGN PERMISSION ≠ PLAYER QUEST ASSIGNMENT
PRODUCER + EMERGENCY ACTIVATE = FORBIDDEN IN V1
STYLE + FAKE STATE = INVALID UX
MEDIA + BACKEND STATE CHANGE = OWNERSHIP VIOLATION
EVENT ENDS + DELETE PLAYER = INVALID
R2 OBJECT + POSTGRESQL BLOB DUPLICATION = INVALID STORAGE MODEL
BREAKING NEWS + DELETE NORMAL PROGRAM = INVALID
EXPERIMENTAL BRANCH + UNREVIEWED MERGE = INVALID DELIVERY PATH
```

Breaking and Emergency override presentation; they do not erase normal programming.

## 11. Architectural invariants

1. Access code is private canonical identity.
2. Display name/avatar are public identity; avatar remains planned.
3. Player identity persists beyond event lifetime.
4. Events are contextual overlays, not identity containers.
5. FRNN can operate without an active event.
6. Quests can exist with or without events.
7. Quests can be assigned to specific players at any time.
8. Physical QR stations are one activation mechanism, not the definition of a quest.
9. Player uploads are private/pending until approved and published.
10. Public serializers never expose access codes or operator-only fields.
11. Master controls Producer permissions.
12. Producer changes default to draft/approval unless direct authority is explicitly granted.
13. Emergency outranks Breaking.
14. Breaking outranks Normal.
15. Breaking/Emergency override presentation rather than destroying lower-priority state.
16. PostgreSQL owns authoritative state and metadata.
17. Object storage owns media bytes.
18. Render/local filesystem is not durable media storage.
19. Functionality owns truth.
20. Media owns content.
21. Style owns presentation.
22. Public displays consume authoritative state; they do not become independent truth.
23. Current repository code is authoritative for implementation reality.
24. Design docs are authoritative for intended direction, not proof of implementation.

## 12. Persistent, event-scoped, and ephemeral state

### Diagram 3 — Persistent Platform vs Event Overlay

```text
PERSISTENT PLATFORM
│   player identity, profile, roles, permissions, audit, reusable quests,
│   personal history, media metadata/assets, general content, always-on crawl
│
└── EVENT OVERLAY
    │   branding, icon, dates/status, event quests/info/program,
    │   event assignments and event progress
    │
    └── EPHEMERAL RUNTIME
        current tab, playback position, interruption, active-mode pointer,
        upload intent, session state
```

| Lifetime | Examples | Why it matters |
|---|---|---|
| Persistent/platform | Access code, player identity/profile, roles/permissions, audit, non-event quest definitions/history, media assets, general content, always-on crawl | Survives event closure and service restarts |
| Event-scoped | Branding/icon, quest set, Weather / Info, announcements, programming, assignments, dates/status, event progress | Can archive without deleting the player/platform |
| Ephemeral/runtime | UI tab, playback, interruption, resolved mode pointer, upload intent, session | Recomputable; never the only durable record |

## 13. Player-specific quest model — TARGET DESIGN

> **A quest is a platform object. An event association is optional.**

```text
QUEST
├── definition
├── answer rules
├── puzzle media
├── pass/fail media
├── clue/contact media
└── optional event relationship

QUEST ASSIGNMENT
├── target player / target event / all players
├── start/end availability
├── status
├── priority
└── completion/consumption state
```

The assignment model must support manual player assignment, event-wide assignment, between-event assignment, QR-triggered activation, and later rule-based assignment. V1 should implement manual/event/QR paths first; sophisticated automatic triggers remain deferred.

The current four-station behavior uses `visits`, `video_answers`, `final_reflections`, `/api/scan/:station`, `/api/response/:station`, and `/api/final-reflection`. It proves completion and interruption patterns, but it is not yet a generic Quest/Assignment model.

## 14. Master, Producer, and approval grammar — TARGET DESIGN

### Master

Ultimate authority over accounts/permissions, approval, direct publish, overrides, player management, quest assignment, broadcast activation, system configuration, and audit visibility.

### Producer

Operational creator/editor who may draft, upload, moderate, prepare quests/ticker/news/announcements, and submit for approval—only within individual permissions.

### Diagram 4 — Authority / Approval Flow

```text
ROLE ≠ PERMISSION SET

DRAFT
  → PENDING APPROVAL
      ├──→ APPROVED / SCHEDULED → LIVE → ARCHIVED
      ├──→ CHANGES REQUESTED → DRAFT
      └──→ REJECTED
```

Quests, assignments, stories, ticker changes, announcements, Breaking packages, and station-media changes should normally use this lifecycle. Explicit Master-granted direct-publish permission is a narrow exception. Every transition is audited.

## 15. Broadcast grammar — TARGET DESIGN

### Diagram 5 — Broadcast Priority

```text
          EMERGENCY
              ▲
              │ outranks
          BREAKING
              ▲
              │ outranks
            NORMAL
```

- **Normal:** crawl, approved player reports, staff stories, Fried News, ticker.
- **Breaking:** temporary takeover; prerecorded video first; preserves normal state underneath.
- **Emergency:** rare, system-wide, highest priority, Master-only in v1, audited, and explicitly cleared so lower-priority state resumes.

```text
LIVE SOURCE + BREAKING / PROGRAM SLOT = LIVE FRNN PRESENTATION
```

Livestreaming with audio is **DEFERRED — LAST FEATURE OF V1**.

## 16. Mode grammar

```text
ALWAYS-ON MODE
FRNN CORE = NEWS + UPLOAD + PROFILE + PERSONAL QUESTS

EVENT MODE
FRNN CORE + EVENT CONTEXT
= EVENT-BRANDED FRNN
 + WEATHER / INFO
 + EVENT QUESTS
 + PHYSICAL STATION INTERRUPTIONS
 + EVENT ANNOUNCEMENTS

PLAYER-SPECIFIC OVERLAY
PLAYER + ACTIVE PERSONAL ASSIGNMENT = PERSONAL QUEST AVAILABLE
```

Always-On and Event modes can coexist; player-specific context overlays either. Ending an event removes/archives its overlay, not FRNN Core or Player Identity.

## 17. Implementation reality

| Classification | Capability | Evidence / limitation |
|---|---|---|
| **CURRENT / proven foundation** | Node/Express/PostgreSQL | `package.json`, `server.js`, `db.js`, `schema.sql` |
| **CURRENT** | Durable access-code ownership, player cookies, QuickStart | `access_codes.claimed_at`, `players`, `quick_start_claims`; `player-identity.js`; `quick-start.js`; `/api/access`, `/api/quick-start` |
| **CURRENT** | Unique-name and profile-history foundation | `player_profiles`, generated normalized name in migration 001, `player-profiles.js` |
| **PARTIAL** | Event/player-shell foundation | `events.js`, `/api/event`, `/player`, `player-shell.js`; only default event/current shell |
| **CURRENT fixed workflow** | Four station routes and Start/End | route constants in `lib.js`; `/api/scan/:station`, `/api/start-end`; `public/station.html` |
| **CURRENT base** | Mission Control | `mission_control_sessions`, `mission_control_audit`, `/api/admin/*`, `public/admin.html` |
| **CURRENT** | QR generation | `qr-routing.js`, `/api/admin/qr`, `scripts/generate-qr.js` |
| **PARTIAL** | R2 adapter boundary | `media-storage.js` lists bounded keys/builds public URLs; no upload pipeline |
| **PLANNED** | Always-on news/upload mode, avatars, upload pipeline, field reports, moderation, crawl, ticker | No corresponding domain tables/services/routes in inspected commit |
| **PLANNED** | Generic player-specific quest assignments | Current journey is hardcoded to station/final-reflection tables |
| **PLANNED** | Master/Producer accounts, permissions, approval workflow | Current operator auth is shared-passphrase/admin gate |
| **PLANNED** | Weather/info, Breaking, Emergency, output displays | No authoritative modules or dedicated output routes yet |
| **DEFERRED** | Livestreaming with audio, sophisticated automatic quest triggers, complex segmentation, advanced switching, AI moderation, social graph/chat | Explicitly outside immediate scope |

## 18. Mandatory design rule for new features

> **No new FRNN feature should be introduced only as a page, route, or hardcoded special case. First express it as a lawful combination of existing modules or explicitly define the new module/invariant being added.**

Every future task packet must answer:

1. Which actor?
2. Which content?
3. Which context?
4. Which authority?
5. Which presentation?
6. Which module owns authoritative state?
7. Which module owns editorial content?
8. Which module owns presentation?
9. What existing invariants apply?
10. What new invariant is required?
11. What invalid combinations must be tested?

## 19. Worked examples

### A. Player posts a weird photo between festivals

Player × Upload × Always-On × submit × Upload surface creates a private pending upload. Media stores bytes in object storage; Functionality stores ownership/status/object key. A permitted Producer moderates it; Master or a Producer with publication authority approves/publishes it. Only then Field Reports and News Crawl project it publicly. The access code never enters the public serializer.

### B. Master gives one player a secret puzzle

Master × Quest × Player-Specific × assign × private player presentation creates a Quest Assignment to the persistent player. No event is required. The player app exposes it only to that identity; completion persists independently of event closure.

### C. Festival station QR interrupts Upload

Active Event × Physical Station × Quest × scan authority × quest-interruption presentation resolves a quest activation. The player may solve or quit; either outcome returns to the same FRNN shell state. QR location activates the quest but does not define it. Current station routes demonstrate an interruption pattern; generic return-to-shell quest composition is planned.

### D. Producer prepares Breaking News

Producer × Breaking package × Public Broadcast × draft/submit × Mission Control creates a pending package. Master approval makes it eligible; explicit Breaking activation changes the resolved broadcast pointer. Program outputs take over temporarily while Normal remains stored underneath.

### E. Emergency

Master × Emergency notice × all active contexts × activate × all subscribed surfaces creates the highest-priority audited state. Explicit clear returns each surface to the preserved Breaking or Normal state. Producer activation is forbidden in v1.

### F. Future livestream

Live source × program/breaking slot × approved activation × player/projector presentations creates live FRNN output. The media pipeline must handle audio, latency, and source health; player browsers require autoplay-safe UX while controlled projector browsers may differ. This is **DEFERRED — LAST FEATURE OF V1**.

## 20. Glossary

| Term | Meaning |
|---|---|
| FRNN | Fried Rice News Network, the persistent platform/network |
| Fried News | Primary editorial/show identity within FRNN |
| As Above So Below | Seed/current festival context represented by default event 1 |
| Player | Persistent participant identified privately by access code |
| Access Code | Private bearer credential and canonical player key; never public persona data |
| Profile | Player persona plus separately scoped private operator metadata |
| Event | Temporary contextual overlay on the persistent platform |
| Quest | Reusable platform challenge definition; optional event relationship |
| Quest Assignment | Targeting/availability/completion relationship between a quest and player/event/audience |
| Physical Station | QR/location activation mechanism for a quest |
| Field Report | Approved and published player contribution |
| Program Item | Schedulable editorial unit for public presentation |
| Producer | Operational creator/editor with configurable capabilities |
| Master | Ultimate platform authority and permission owner |
| Approval | Audited decision allowing a pending change to advance |
| Broadcast State | Authoritative resolved Normal/Breaking/Emergency mode and active references |
| Breaking | Temporary priority takeover that preserves Normal underneath |
| Emergency | Highest-priority, rare, Master-only v1 takeover |
| Output Surface | Read-only projection such as player app, projector, crawl, ticker, or overlay |
| Always-On Mode | FRNN Core operating without requiring an active event |

## 21. Evidence and accuracy notes

Concrete current evidence includes:

- `db.js`: startup schema application, numbered migration runner, transactions, health check.
- `schema.sql`: identity, visits, responses, configuration, sessions, claims, profiles/history, prize draws, and audit tables.
- `migrations/001_frnn_event_foundation.sql`: event table, default event, event-scoped foreign keys/indexes, normalized-name uniqueness.
- `migrations/002_broadcast_master_clock.sql`: ordered Program persistence and singleton broadcast clock anchor.
- `migrations/003_durable_player_identity.sql`: deterministic non-test player ownership backfill and never-owned allocation index.
- `broadcast.js`: Program validation, authoritative state resolution, queue replacement, and explicit start/stop behavior.
- `server.js`: `/healthz`, `/api/event`, `/api/me`, profile, access, scan/response/final, Start/End, Mission Control, profile/history, drawing, QR, config, Program, and Broadcast routes.
- `quick-start.js`: idempotent token hashing and locked code allocation.
- `player-profiles.js`: scoped serializers, normalization, history-preserving changes.
- `events.js`: safe theme projection and default active-event lookup.
- `media-storage.js`: R2/S3 configuration, bounded list, public object URL boundary.
- `public/station.html`, `public/player.html`, `public/admin.html`, `public/quick-start.html`, `public/broadcast.html`: current presentation surfaces.

Design assumptions not proven by current source—and therefore kept **PLANNED/TARGET DESIGN**—include generic quests/assignments, persistent always-on editorial content, uploads/moderation/publication, Master/Producer accounts and grants, approvals, Weather / Info, broadcast precedence, Breaking/Emergency activation, and richer crawl/ticker/overlay/OBS/projector outputs. Avatar support is visibly incomplete (`ownerProfileView` currently returns `avatarUrl: null`).

This document defines how those systems should combine. It does not claim that their schemas, APIs, permission checks, or interfaces already exist.
