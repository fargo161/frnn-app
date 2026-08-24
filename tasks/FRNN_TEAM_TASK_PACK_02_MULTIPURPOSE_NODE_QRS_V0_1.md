# TASK PACK 02 — Multipurpose Personal + Functional Nodes v0.1

**Document type:** Implementation Task Packet
**Reality state:** DESIGNED — not proof of implementation
**Preparation baseline:** `2904e4bd288077e54d0ef21fc73fc1e38f5beae0`
**Execution baseline:** BLOCKED until replaced by the reviewed full `main` SHA containing completed Task Pack 01
**Required branch:** `main`
**Status:** Pending — blocked by Task Pack 01 gate
**Created:** 2026-08-24

> This packet was source-reconciled against the preparation baseline. It must not be implemented from that SHA. Before work begins, record and audit the committed/pushed Task Pack 01 descendant SHA; source and behavioral evidence remain authoritative.

## OBJECTIVE

Establish exactly five canonical shared physical node types—one reusable Personal Start Node and four Functional nodes—then prove that one unchanged QR can resolve different, explainable results for different durable players through a bounded per-player assignment resolver.

```text
PERSONAL  → /quick-start
ESCAPE    → /s/escape
ATTENTION → /s/attention
ACCESS    → /s/access
SENSORY   → /s/sensory
```

The Personal Node is the only normal enrollment/recovery doorway. Functional nodes never create identities or profiles. Start/End is retired as an active physical node. The assignment experiment supports one typed `assigned_message` per player/node and no broader quest engine.

## CURRENT REALITY

Preparation-baseline reality confirmed at `2904e4bd288077e54d0ef21fc73fc1e38f5beae0`:

- `QR_DESTINATIONS` contains six active destinations: Start/End, four Functions, and Quick Start.
- `/quick-start` GET protects against preview/prefetch, then browser JavaScript immediately POSTs a token. The POST allocates/activates a code and sets the player cookie before the player enters a name.
- `/api/quick-start/name` subsequently creates/updates the profile name. Abandoning after allocation can leave a nameless active identity.
- a named active cookie redirects `/quick-start` to `/player`; a nameless active cookie remains on the Quick Start page.
- `/player` exposes owner name, private recovery code, fixed progress, and a link back to `/s/start-end`; it does not resolve assignments or host final reflection.
- `/s/start-end` and `POST /api/start-end` provide opening/final framing and make final reflection reachable. `/api/access` accepts code activation only when `entryPoint='start-end'`.
- Functional route HTML is public. The UI hides code entry outside Start/End and tells anonymous players to use the concierge Start/End receiver.
- `POST /api/scan/:station` can still accept a body access code; when one is supplied it may create/activate a player and immediately insert a visit. The server therefore does not yet enforce Functional-node non-enrollment.
- Functional scan records the visit before resolving video/question state. There is no profile-completion gate.
- no player/node assignment table, resolver, player-facing assigned-message mode, or Mission Control assignment surface exists.
- final reflection is server-authoritative and gated by four persisted station responses; that behavior must be moved, not discarded.
- Functions currently cause distinct authored station visit/response/video behavior. No deeper reusable Function semantics are proven.
- current QR generation is shared by the admin metadata/assets endpoints and `scripts/generate-qr.js`, all sourced from `qr-routing.js`.
- Mission Control has player lookup, profiles/history, route repair/reset, QR generation, content configuration, and shared-passphrase authorization.
- current tests explicitly expect six QR destinations, Start/End access entry, Start/End final behavior, and production reset/release semantics. These are current-regression tests, not evidence for the designed five-node model.

Task Pack 01 prerequisite reality is not present on the preparation baseline. Pack 02 remains blocked until its execution baseline proves all seven gate items.

Reality classification:

- **IMPLEMENTED:** six-route QR model, QuickStart pre-name allocation, Start/End enrollment/final context, four fixed Functional flows, player shell, Mission Control base.
- **TESTED:** current source-regression behavior; not the new node claim.
- **DESIGNED, not implemented:** five canonical nodes, atomic name-first durable enrollment, owned-only recovery, profile-gated Functional resolution, per-player node assignments.
- **NOT VALIDATED:** same QR + different durable player/assignment → different result.

## DESIGN CLAIM

A stable node URL can remain content-agnostic while authoritative player identity and one bounded player/node assignment produce different results:

```text
SAME QR
+ durable Player A + assignment A
→ RESULT A

SAME QR
+ durable Player B + assignment B
→ RESULT B
```

The result must come from one reusable resolver keyed by durable player identity and canonical node key. It must not come from player-specific URLs, encoded access codes, name branches, route duplication, or random choice.

## BIGGEST UNCERTAINTY

Whether Personal Node onboarding, status/final context, assigned messages, and legacy Start/End compatibility can be unified without creating a second enrollment path or hiding authoritative final-reflection access. The minimum implementation must define explicit Personal Node precedence and prove that Functional assignment overrides do not mutate the default quest.

## TEAM ROLES

### 1. Prerequisite / Reality Auditor

- **Responsibility:** Record the actual Pack 01 SHA, prove all seven gate items, and re-audit node, profile, final, QR, and recovery behavior on that descendant.
- **Likely areas:** Pack 01 report/tests, `server.js`, `quick-start.js`, `schema.sql`, migrations, route/UI files, QR routing, Mission Control, docs.
- **Required inputs:** completed Pack 01 commit/push evidence.
- **Required outputs:** gate verdict, execution baseline SHA, refreshed route/state matrix, and any material drift from this preparation reality.
- **Dependencies:** successful Task Pack 01. No other role begins until this role reports GO.

### 2. Data & Node Resolver Engineer

- **Responsibility:** Add the smallest typed assignment model and reusable server-side resolver contract.
- **Likely owned files:** `schema.sql`, the next numbered migration after Pack 01, a focused `node-assignments.js` module, and its unit tests.
- **Required inputs:** confirmed durable identity schema and canonical node-key contract.
- **Required outputs:** one assignment per player/node, typed and bounded fields, private operator-note boundary if retained, public projection, lookup/set/clear helpers.
- **Dependencies:** Prerequisite / Reality Auditor.

### 3. Server / Domain Engineer

- **Responsibility:** Own all route/state-machine integration: Personal onboarding/recovery/context, Functional gates/resolution, assignment APIs, final-context relocation, and Start/End compatibility.
- **Likely owned files:** `server.js`, `quick-start.js`, narrowly required domain helpers.
- **Required inputs:** durable ownership API from Pack 01 and resolver module/API contract.
- **Required outputs:** cookie-authoritative player resolution, atomic first enrollment, owned-only recovery, profile gates, assignment-before-visit behavior, audited privileged mutation routes, Personal state response, safe legacy redirect.
- **Dependencies:** Data & Node Resolver Engineer. This is the sole `server.js` owner.

### 4. Player / Node UI Engineer

- **Responsibility:** Build the one Personal Node experience and Functional assigned-message/default/gate presentations without inventing new server authority.
- **Likely owned files:** `public/quick-start.html`, `public/player.html`, `public/station.html`, narrowly required styles.
- **Required inputs:** stable server response modes and error contracts.
- **Required outputs:** immediate first-use name form without pre-allocation, returning personal context, recovery UI, final reflection access, assigned-message rendering, anonymous/nameless direction to Personal Node.
- **Dependencies:** Server / Domain Engineer contract.

### 5. Mission Control / Assignment UI Engineer

- **Responsibility:** Add a bounded privileged surface to inspect, set/edit, and clear one message for one player/node.
- **Likely owned files:** `public/admin.html`, narrowly required styles.
- **Required inputs:** authenticated assignment API and five canonical node keys.
- **Required outputs:** player-scoped editor, node selector, current assignment display, clear control, safe text rendering, and understandable success/failure states.
- **Dependencies:** Server / Domain Engineer contract. May run in parallel with Player UI after the API stabilizes.

### 6. Test / Adversarial QA

- **Responsibility:** Prove identity/profile gates, two-player same-QR causality, non-mutation on overrides, Personal final flow, recovery safety, and exactly five canonical QRs.
- **Likely owned files:** focused node-resolution integration tests plus updates to obsolete Start/End/six-QR expectations.
- **Required inputs:** stable resolver, routes, and UI contracts.
- **Required outputs:** domain tests, disposable PostgreSQL/API behavior when available, regression evidence, and explicit unverified real-device risks.
- **Dependencies:** Data, Server, and UI roles.

### 7. Integrator / Documentation Stabilizer

- **Responsibility:** Merge in dependency order, preserve Pack 01 invariants, reconcile current docs, run stabilization, and report the causal proof.
- **Likely owned files:** `README.md`, `FIELD_OPERATIONS_QUICKSTART.md`, current operations/architecture docs, packet report if used.
- **Required inputs:** all role outputs and QA evidence.
- **Required outputs:** bounded coherent five-node diff, calibrated reality labels, no stale active Start/End instructions, and final implementation report.
- **Dependencies:** all roles.

## REQUIRED CHANGES

### Canonical node and QR model

- Define exactly `personal`, `escape`, `attention`, `access`, and `sensory` as node keys.
- Keep `/quick-start` as the canonical Personal physical QR and the four existing Function routes unchanged.
- Remove Start/End from active QR destinations and generated/downloadable canonical assets.
- Keep `/s/start-end` only as a backwards-safe redirect/deprecation route to `/quick-start` if compatibility is required. It must not enroll, activate, or remain a separate node.
- Generate no player-specific QR, access-code URL, or assignment-bearing URL.

### Personal Node enrollment and recovery

- A fresh direct `/quick-start` open shows name/nickname entry immediately and consumes no credential.
- On successful validated name submission, one transaction must select a never-owned real credential, establish Pack 01 ownership, create/converge the player, save the profile name, bind QuickStart/browser continuity, and set the player cookie.
- Retain preview/prefetch and no-store protections. Page open, preview, invalid name, and abandoned form must consume no durable identity.
- A returning owned cookie/token resolves the same player and does not allocate or require a new name unless the existing profile is incomplete.
- Recovery may attach only an already-owned identity. It must reject never-owned codes without setting ownership or creating a player/profile. Reuse `/api/access` only if its contract is made unambiguously recovery-only; otherwise introduce a narrow recovery route and deprecate the old activation contract.
- `/player` may remain the Personal presentation target, but it must not become another enrollment route.

### Personal context and final reflection

- Move current status/final behavior behind Personal Node resolution so `/s/start-end` is unnecessary.
- Define explicit server-authoritative Personal state: onboarding/profile incomplete; current status/quest incomplete; final available; final completed.
- Personal `assigned_message` is additional authoritative context after profile completion. It must visibly change the result without making final reflection unreachable. The resolver response should keep current/final state available alongside assigned content or define another tested non-blocking presentation.
- Preserve current four-response gate, matching, idempotency, final video roles, completion persistence, and private accepted-phrase boundary.

### Functional identity/profile gate

- Public Functional GETs may render a shell but must not mutate state.
- Functional scan/resolve authority comes only from the durable player cookie/session, never an arbitrary request-body code.
- Anonymous scan: no player, profile, or visit; return a Personal Node-required state.
- Owned but nameless/profile-incomplete scan: no visit; return profile-completion-required state.
- Owned and profiled scan: resolve assignment first, then either assigned behavior or current default station flow.
- Do not use `ensurePlayerIdentity` or any equivalent creation path from a Functional scan.

### Minimal assignment model and resolver

- Add one typed row per `(code, node_key)` with `assignment_type='assigned_message'`, bounded `title` and `body`, optional bounded operator note, timestamps, and ordinary relational constraints.
- Row presence may represent the one active assignment; clearing may delete it. Do not add scheduling, version stacks, generic JSON payloads, or multiple assignment types.
- Implement one resolver callable for Personal and all four Functions. Its public projection exposes only type/title/body and never code, contact info, profile history, or operator note.
- Public resolution derives code only from the current durable identity cookie/session.
- Mission Control can read/set/edit/clear one player/node assignment under existing authenticated privilege. Every mutation writes a dedicated audit action without private message bodies if the existing audit policy avoids content.

### Assignment versus default behavior

- Functional assignment lookup must occur before visit insertion.
- Active assignment: return assigned-message mode and do not create a default visit, response, stage, or completion.
- No assignment: preserve current authored Function fallback—visit/stage, loop video, four choices, wrong hint, correct completion.
- Clear assignment: the same player and same route return to the default Function behavior.
- The four Function names remain station identities; an assignment at ESCAPE is not evidence of deeper ESCAPE semantics.

### Documentation and existing tests

- Reconcile README/current operations/architecture wording to five active node types, Personal-only enrollment/recovery, profile gate, and Start/End legacy status.
- Preserve archived/history documents as history.
- Update tests that intentionally freeze six QRs, Start/End enrollment/final access, body-code Functional activation, or QuickStart pre-name allocation.
- Keep all Pack 01 durability tests green.

## DATA / STATE TRANSITIONS

### New player

```text
fresh browser scans /quick-start
→ Personal page shows name; no credential state changes
→ valid name submitted
→ never-owned credential row locked
→ durable ownership + player + profile + browser continuity committed atomically
→ cookie set
→ Personal status/assignment context rendered
```

### Returning/recovering player

```text
owned cookie/token scans /quick-start
→ durable identity resolved
→ completed profile checked
→ current game/final state + personal assignment resolved
→ same identity-specific Personal result

new browser enters recovery code
→ rule: credential must already be durably owned
→ existing identity attached
→ no new player/profile/claim created
```

### Functional default

```text
profiled durable player scans /s/escape
→ cookie identity resolved
→ profile gate passes
→ resolver finds no escape assignment
→ default visit/stage rule runs
→ Escape puzzle/video result appears
```

### Functional assigned result

```text
profiled durable player scans same /s/escape
→ cookie identity resolved
→ profile gate passes
→ resolver finds player's escape assigned_message
→ assigned content returned
→ no default visit/response/completion mutation
→ player sees their message
```

### Clear assignment

```text
Mission Control clears Player A + escape
→ assignment row removed + audit recorded
→ Player A scans unchanged /s/escape
→ resolver finds no assignment
→ default Escape behavior resumes
```

## INVARIANTS

- Task Pack 01 ownership, non-recycling reset, recovery continuity, privileged release, and private credential workflow remain intact.
- `/quick-start` is the only normal enrollment/start node.
- Functional routes never claim credentials, create players, create profiles, or accept a body code as player authority.
- Anonymous/nameless Functional resolution creates no visit or completion state.
- Assigned Functional resolution creates no default quest state.
- Exactly four Functions remain: ESCAPE, ATTENTION, ACCESS, SENSORY.
- QRs identify nodes only; identity and assignment remain server-side.
- No private code, contact info, operator note, history, or another player's assignment is exposed.
- Final reflection remains server-authoritative and reachable from Personal context.
- Existing Mission Control is provisional privilege, not a claimed Master/Producer system.
- Default authored station behavior remains a fallback and is not mislabeled as emergence.

## OUT OF SCOPE

- Generic quest/assignment engines, multiple or scheduled assignments, cohorts/groups, geography, branching graphs, rewards, or node automation.
- Player-specific QRs, QR payload state, push notifications, advanced media packages, or live media.
- Full accounts/RBAC/Master/Producer system.
- Broadcast, News, Upload, Weather, media-library, or unrelated player-shell expansion.
- Production deployment/migration, provider changes, QR printing, or real credential rotation.
- Deleting existing player progress merely to simplify route migration.

## STOP CONDITIONS

Stop and report rather than compensate if:

- any one of the seven Pack 01 gate items is unproven on the execution SHA;
- execution baseline is not the reviewed committed/pushed Pack 01 descendant or remote `main` diverges;
- moving final/current state from Start/End would destroy or reinterpret existing player progress;
- legacy route compatibility would require retaining Start/End as an enrollment/activation path;
- Functional fallback cannot be preserved without a broad quest redesign;
- assignment behavior requires generic JSON, scheduling, segmentation, multiple modes, or player-specific routes;
- anonymous/profile gate enforcement conflicts with an undocumented production dependency;
- a production database/provider/deployment/QR mutation is required;
- server-authoritative final behavior would become unreachable under Personal assignments.

## ACCEPTANCE CRITERIA

1. Execution baseline records the completed Pack 01 SHA and all seven prerequisites have cited evidence.
2. QR routing and both QR generators expose exactly five canonical destinations: Personal plus four Functions.
3. Fresh `/quick-start` immediately shows name entry and consumes no credential until valid submission.
4. Successful onboarding atomically creates durable ownership, player, profile name, continuity, and cookie for exactly one credential.
5. Returning Personal scans reuse the same identity; preview, invalid input, and abandoned onboarding consume none.
6. Recovery attaches only an already-owned identity and rejects unowned credentials without mutation.
7. Start/End is not a canonical QR or alternate enrollment path; legacy route behavior is redirect/deprecation only if retained.
8. Personal context exposes profile/current status, final availability/completion, and player-specific assigned content without making final reflection unreachable.
9. Anonymous and nameless Functional scans create no player, profile, visit, response, or completion.
10. Profiled players with no assignment retain current default Function behavior.
11. One bounded assignment row per player/node exists and Mission Control can inspect, set/edit, and clear it under authentication.
12. Assignment mutations are audited and private fields/content boundaries are respected.
13. Player A and Player B receive different assigned results from the identical URL/QR through the reusable resolver.
14. Assigned Functional resolution does not create default quest state; clearing restores default behavior.
15. No player identifier, access code, or assignment appears in a QR/URL.
16. All Pack 01 tests and current unaffected quest regressions remain green.
17. Targeted behavior, safe PostgreSQL/API evidence when available, full `npm test`, and `git diff --check` pass.

## BEHAVIORAL TESTS

### Hard prerequisite

- Re-run and cite Pack 01's A-reset/B-fresh/A-recovery system test on the execution SHA.
- Fail closed if an owned reset identity is allocatable or release occurs outside the dedicated privileged action.

### Personal enrollment

```text
GET /quick-start without identity
→ render name form
→ assert inventory unchanged

submit invalid name / abandon
→ assert inventory unchanged

submit valid name once
→ exactly one durable claim + player + profile + continuity
→ Personal context returned
```

- Repeat/concurrent submission with the same browser token must converge and consume one credential.
- Prefetch/preview must consume none.

### Return and recovery

- Same cookie/token revisits `/quick-start` and receives the same identity without onboarding or allocation.
- New browser recovers an owned code and receives that existing identity.
- New browser submits a never-owned code as recovery; server rejects it and creates no player/profile/claim.

### Functional gates

- Anonymous `/s/escape` resolution produces Personal-required output and zero state changes.
- Durable but blank-profile player produces profile-required output and zero visit changes.
- Profiled player with no assignment receives current Escape default and its intended visit/state consequences.

### Required same-QR causal proof

```text
Player A: escape → MESSAGE A
Player B: escape → MESSAGE B

same route for both: /s/escape

cookie A → MESSAGE A
cookie B → MESSAGE B
```

Assert the URL is identical, no code/player identifier is present, and the resolver contains no name-specific branch.

### Assigned versus default and clear

- Player A with Escape assignment gets assigned-message mode and no visit/stage/response/completion mutation.
- Player B without Escape assignment gets normal Escape fallback from the same route.
- Clear A's assignment; the next unchanged-route scan gives A the default fallback and only then records default visit state.

### Personal assignments and final

- A and B have different Personal messages and resolve their own content from identical `/quick-start` URLs.
- Complete four Functional responses, visit Personal, and prove final reflection is available without Start/End.
- Accept final, revisit Personal, and prove completion persists.
- Repeat with an active Personal assignment and prove final remains reachable.

### Mission Control and privacy

- Unauthenticated read/mutation fails.
- Authenticated set/edit/clear is player/node scoped and audited.
- Public responses omit code, contact info, profile history, operator note, and another player's content.

### QR and compatibility

- Destination list and admin/script generators contain exactly the five canonical routes.
- No Start/End or player-specific asset is generated.
- `/s/start-end`, if retained, redirects safely to Personal and cannot activate an unowned code.

### Evidence levels

- Route/table existence is **structural** evidence only.
- Resolver unit tests are **TESTED logic**, not the same-QR design proof by themselves.
- The two-cookie/same-route/state-delta scenario is the required causal proof.
- Real printed-QR, multi-device, and production behavior remains **UNVERIFIED** until a separately authorized field/deployment pass.

## INTEGRATION ORDER

```text
Prerequisite / Reality Auditor
        ↓ GO only after all seven Pack 01 gates
Data & Node Resolver Engineer
        ↓
Server / Domain Engineer
        ├──────────────→ Player / Node UI Engineer
        └──────────────→ Mission Control / Assignment UI Engineer
                                  ↓
                         Test / Adversarial QA
                                  ↓
                    Integrator / Documentation Stabilizer
```

The two UI roles may proceed in parallel after the server contract freezes because they own different files. Only the Server / Domain Engineer edits `server.js`. Resolver/schema lands before route integration; QA integrates after both UI surfaces are available.

## STABILIZATION CHECK

- Record the full execution baseline SHA and Pack 01 gate evidence in the implementation report.
- Search all player creation/ownership helpers and prove none are reachable from Functional resolution.
- Search all visit inserts and prove assignment/profile gates precede them.
- Search QR destinations and generated asset paths; exactly five canonical node types must remain.
- Verify `/s/start-end` and `/api/access` cannot act as alternate enrollment paths.
- Verify current final-reflection state is preserved and reachable from Personal with and without a Personal assignment.
- Run the same-QR two-player test, assigned-no-visit test, recovery-unowned rejection, Pack 01 suite, unaffected quest regressions, full `npm test`, and `git diff --check`.
- Run safe disposable PostgreSQL/API tests if configured; otherwise report the gap, do not imply database validation.
- Review current docs for stale six-QR, Start/End enrollment/final-only, or Functional body-code instructions.
- Confirm no deployment, production migration, credential mutation, or QR printing occurred.

## IMPLEMENTATION REPORT

The implementing team must return exactly these subsections:

### WHAT WAS REAL BEFORE

Execution-baseline QuickStart, Start/End, Functional, profile, QR, assignment, and Pack 01 durability behavior.

### WHAT CHANGED

Exact five-node model, enrollment/recovery semantics, resolver, gates, Start/End compatibility, and UI changes.

### FILES CHANGED

Each important file and its bounded purpose.

### PERSONAL NODE FLOW

```text
new player
returning player
profile incomplete
owned-code recovery
personal assigned message
final available / final complete
```

### FUNCTIONAL NODE FLOW

```text
anonymous
nameless durable identity
profiled default
profiled assigned
assignment cleared
```

### ASSIGNMENT MODEL

Migration/table, typed limits, resolver precedence, privacy projection, authoring API/UI, and audit behavior.

### CAUSAL PROOF

Report the exact test and state delta:

```text
same /s/escape QR
Player A → Message A
Player B → Message B
assigned scan → no default visit
clear → default Escape returns
```

### QR RESULT

List the five canonical routes and any legacy redirect; report that no player-specific QR exists.

### TESTS RUN

Separate structural, resolver unit, state-transition/API, PostgreSQL, full regression, and manual browser/device evidence.

### WHAT REMAINS UNVERIFIED

Especially printed QR, multi-device recovery, production migration/deployment, concurrency not exercised against PostgreSQL, and field usability.

### CONTRADICTIONS / PROVISIONAL ELEMENTS

Include the limited message assignment, authored Function fallback, legacy redirect, and shared-passphrase privilege.

### COMMIT / PUSH

Full commit SHA, remote result, and confirmation that no deployment or production mutation occurred.

### NEXT EXPERIMENT

Recommend the smallest experiment that tests the largest remaining uncertainty. Do not implement it automatically.

## COMMIT / PUSH BOUNDARY

The implementation team may commit one bounded Pack 02 application/documentation change to `main` only after the Pack 01 gate, all acceptance criteria, and stabilization checks pass. Recommended commit message: `feat: add multipurpose personal and station nodes`.

Push to `origin main` is permitted only from synchronized `main`, with no unrelated changes and no force push. The push does not authorize deployment, production database migration, provider mutation, credential rotation, or QR printing. The Director preparing this packet must not implement or commit Pack 02 application changes.
