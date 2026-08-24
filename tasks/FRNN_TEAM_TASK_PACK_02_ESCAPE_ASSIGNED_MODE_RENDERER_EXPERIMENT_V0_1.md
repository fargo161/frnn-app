# TASK PACK 02 — Escape Assigned-Mode Station-Page Renderer Experiment v0.1

**Document type:** Implementation Task Packet
**Reality state:** DESIGNED — not proof of implementation
**Baseline:** `a92f9ad55da7e84fa29f8c6e195133ce3b745996`
**Required branch:** `main`
**Status:** Pending
**Created:** 2026-08-24

> This packet defines work requested from the stated baseline. Source code, runtime behavior, and behavioral tests remain authoritative for what is actually implemented.

## PRIMARY OBJECTIVE

Add the smallest dedicated Escape assigned-mode renderer to `public/station.html` so the already-implemented backend assignment result is visibly readable by a player without invoking the normal station renderer.

The experiment must answer only this question:

> Can the existing station page present the current Escape `{ mode: 'assignment', nodeKey: 'escape', assignedMessage }` response while leaving unassigned Escape and all other Functional station behavior unchanged?

Required assigned chain:

```text
successful Escape scan
→ existing backend returns mode: assignment
→ station page validates Escape assignment mode
→ dedicated assignment renderer
→ assignedMessage becomes visible
→ no player/progress/puzzle/media renderer access
```

Required default chain:

```text
successful normal station scan
→ current composite response
→ existing player/progress/renderStation path
→ existing station experience unchanged
```

Do not change backend behavior or add assignment rendering for Attention, Access, or Sensory.

## CURRENT REALITY AT BASELINE

### Backend contract is already real

- **IMPLEMENTED and TESTED:** `POST /api/scan/:station` resolves assignments only when `station === 'escape'`, after current identity establishment and before normal visit mutation.
- **IMPLEMENTED:** active Escape assignment returns exactly:

```js
{
  mode: 'assignment',
  nodeKey: 'escape',
  assignedMessage: 'Message A'
}
```

- **IMPLEMENTED and TESTED:** missing/inactive Escape assignment falls through to the existing composite Escape response and normal visit behavior.
- **IMPLEMENTED and TESTED:** Attention, Access, and Sensory ignore assignment rows and retain current behavior.
- **VALIDATED, narrowly:** the real Escape HTTP endpoint can branch on persisted assignment state before visit mutation.

Do not modify `server.js`, `node-assignments.js`, migration `004`, schema, or the response contract during this pass.

### Exact current station-page structure

`public/station.html` contains one receiver page with:

- top-level `stationTitle`, `stageLabel`, and `signalText` elements;
- mutually exclusive `gate`, `authorized`, and `retry` sections controlled by `show(id)`;
- inside `authorized`: `progressSummary`, `progress`, `mediaBox`, `mediaControls`, `responseArea`, `finalArea`, and a field-code metadata line containing `fieldCode`;
- no assignment-specific DOM area;
- existing reusable `.card`, `.signal`, `.tiny`, `.state-badge`, `.meta`, and `.hidden` CSS primitives from `public/styles.css`.

No new stylesheet rule is required for the minimum experiment.

### Exact current response dispatch

At baseline `public/station.html` line 89, `scan()`:

1. selects `/api/start-end` or `/api/scan/${station}`;
2. POSTs an empty JSON body;
3. parses JSON;
4. sends 401/403 to `showGate()`;
5. sends other non-OK responses to the existing catch/retry path;
6. calls `show('authorized')`;
7. hides `responseArea` and `finalArea`;
8. sets the normal title;
9. immediately reads `data.player.accessCode`;
10. calls `progress(data.player)`;
11. dispatches Start/End separately;
12. otherwise calls `renderStation(data, false)`.

The assignment dispatch must occur after successful response/gate handling and `show('authorized')`, but before any read of `data.player`, any `progress` call, and any Start/End/default renderer call.

### Exact existing render and failure behavior

- `show(id)` hides `gate`, `authorized`, and `retry`, then shows only the requested section.
- `progress(player)` requires `player.stationMissions`, `player.visits`, and `player.videoAnswerCount`.
- `renderStation(data, ...)` requires stage, stage metadata, mission/answer state, player, and media fields; it calls `renderChoices` and normal media behavior.
- `showGate()` preserves Start/End-only access entry and directs unauthorized Functional scans to the concierge.
- `scan()` catches request, parsing, validation, or rendering failure, shows `retry`, and sets `signalText` to `SIGNAL TEMPORARILY UNAVAILABLE.`
- `submitChoice` and final handlers are independent mutation paths. Assignment mode must not call them.

### Current presentation defect

The assigned response deliberately has no `player`, stage, mission, answer, or media fields. Current `scan()` tries to read `data.player.accessCode`, throws, and enters retry. The API works but assignment mode is not player-presentable.

### Existing test strategy

- `test/escape-assignment-integration.test.js` provides real HTTP/PostgreSQL backend evidence and currently asserts the page has no assignment-mode branch.
- Most station-page tests use source assertions.
- `test/broadcast-viewer.test.js` and `test/program-packager.test.js` demonstrate the repository's existing Node `vm` plus small fake-DOM strategy for behavioral frontend tests.
- No browser automation framework or DOM library is installed. Do not add one for this experiment.

### Baseline drift rule

Before implementation, compare current `HEAD` with `a92f9ad55da7e84fa29f8c6e195133ce3b745996`. Stop on material application drift. A later commit containing only this packet and its Director report is not material drift.

## REQUIRED CHANGES

### 1. Add one dedicated assignment presentation area

Inside the existing `authorized` section of `public/station.html`, add one initially hidden assignment area using existing DOM/CSS primitives. Use these exact IDs so the rendering contract is testable:

```html
<section id="assignmentArea" class="card hidden">
  <div class="tiny">DIRECT CHANNEL // ASSIGNED TRANSMISSION</div>
  <div id="assignmentStateBadge" class="state-badge pending">ASSIGNED TRANSMISSION</div>
  <h2>YOUR TRANSMISSION</h2>
  <div id="assignmentMessage" class="signal" aria-live="polite"></div>
</section>
```

Equivalent current-interface copy is acceptable only if it remains bounded and does not imply visit, puzzle, response, mission, or final completion. The message content itself must come only from `data.assignedMessage`.

Add `id="fieldAccess"` to the existing metadata container that displays `fieldCode` so assignment mode can hide the entire field-code statement without inventing a missing player code.

Do not add assignment video, image, choices, buttons, progress, stage, final, or authoring controls.

### 2. Add one narrow renderer

Add one small function named `renderAssignment(data)` alongside the current renderer functions.

It must:

1. validate that the current page station is exactly `escape`;
2. validate `data.nodeKey === 'escape'`;
3. validate `data.assignedMessage` is a non-empty string after trimming;
4. set the top-level copy to a clearly distinct assigned state using existing receiver language;
5. set `assignmentMessage.textContent` from the trimmed `data.assignedMessage`;
6. show `assignmentArea`;
7. hide `progressSummary`, `progress`, `mediaBox`, `mediaControls`, `responseArea`, `finalArea`, and `fieldAccess`;
8. avoid reading `data.player`, stage, mission, answer, or media fields;
9. avoid calling `progress`, `renderStation`, `renderChoices`, `renderMedia`, response submission, or final functions.

Use `textContent`, not `innerHTML`, for the assigned message so HTML-like content remains literal public text.

If validation fails, throw an error so the existing `scan()` catch/retry behavior remains authoritative. Do not silently convert malformed assignment mode into a normal default response.

Suggested bounded top-level copy:

```text
stationTitle: ASSIGNED TRANSMISSION
stageLabel: ESCAPE // DIRECT CHANNEL
signalText: A DIRECT TRANSMISSION HAS BEEN ASSIGNED TO THIS RECEIVER.
```

This copy is interface framing only. Do not invent player-specific content beyond `assignedMessage`.

### 3. Dispatch assignment mode before normal response access

In `scan()`, preserve all request, JSON, 401/403, non-OK, gate, and catch behavior.

After `show('authorized')` and the current initial hiding of normal response/final areas, add:

```js
if (data.mode === 'assignment') {
  renderAssignment(data);
  return;
}
```

This branch must precede:

- `data.player.accessCode`;
- `progress(data.player)`;
- Start/End rendering;
- `renderStation(data, false)`.

Do not infer assignment mode from missing fields, URL parameters, `assignedMessage` alone, or local state. `data.mode === 'assignment'` is required, and `renderAssignment` must enforce Escape page/node identity.

### 4. Preserve normal renderer state

The normal composite response must continue through the existing code. Do not rewrite or duplicate `renderStation`, `progress`, `renderChoices`, media logic, gate logic, or retry logic.

Ensure the assignment area remains hidden for normal responses. Because it is initially hidden and a page scan normally selects one terminal mode, the smallest implementation may explicitly add `assignmentArea.classList.add('hidden')` immediately before the normal path. Do not build a generalized view-state manager.

Do not add assignment handling to `submitChoice`, response endpoints, final rendering, Start/End, or other pages.

## REQUIRED BEHAVIORAL TESTS

Create a focused test file, preferably `test/escape-assignment-renderer.test.js`.

Use the repository's existing Node `vm` and purpose-built fake-DOM approach. Extract/evaluate the station page script with controlled `location`, `document`, `fetch`, DOM elements, and call tracking. Do not add JSDOM, Playwright, Puppeteer, or another frontend framework.

The harness must exercise actual page script behavior rather than only assert that strings exist.

### Test A — assigned Escape visibly renders

Given:

```js
{ mode: 'assignment', nodeKey: 'escape', assignedMessage: 'Message A' }
```

with a successful `/api/scan/escape` response, prove:

- `authorized` is visible;
- `retry` and `gate` are hidden;
- `assignmentArea` is visible;
- `assignmentMessage.textContent === 'Message A'`;
- assigned top-level framing is visible;
- normal response choices, media, progress, final state, and field-code statement are hidden;
- the message is handled as text, including an HTML-like fixture that does not become DOM markup.

### Test B — assigned response requires no normal payload

Use an assignment response containing no `player`, stage, stage metadata, mission state, answers, choices, or media fields. Prove:

- no exception/retry occurs;
- `progress` is not invoked;
- `renderStation`, `renderChoices`, and `renderMedia` are not invoked for the assignment response;
- no `/api/response/*` or final mutation request occurs.

Use call tracking or controlled throwing stubs where practical. Do not satisfy this only with source regex.

### Test C — normal Escape remains unchanged

Given a representative current composite Escape response:

- assignment area remains hidden;
- current field code and progress render;
- `renderStation` executes;
- normal response choices and stage copy appear;
- assignment renderer is not selected.

Reuse the current response shape established by endpoint tests or a minimal faithful fixture. Do not create a separate default Escape renderer.

### Test D — Attention, Access, and Sensory remain normal

For normal composite responses on each other Functional page, prove the existing path still calls current progress/station rendering and never shows `assignmentArea`.

Also pass an assignment-shaped response on a non-Escape page and prove it is rejected into the existing retry state rather than rendered. Do not add assignment support for those nodes.

### Test E — public projection/privacy boundary

Given an assignment response containing extra prohibited fixture fields such as `code`, `is_active`, `updated_at`, or a database ID, prove the visible assignment content comes only from `assignedMessage` and fixed interface framing. No prohibited value may appear in any assignment DOM element.

The renderer need not mutate or sanitize the response object; it must simply ignore fields outside the public projection.

### Test F — real failure/retry remains unchanged

Given a failed or non-OK scan response, prove the existing retry section is shown and assignment mode is not rendered. Given malformed assignment mode—wrong node or blank/non-string message—prove the same existing retry path is used.

### Required source-boundary assertions

- The assignment branch occurs after successful response/gate handling and before `data.player`, `progress`, and `renderStation` access.
- `renderAssignment` uses `textContent` for the message.
- `renderStation` remains present and is not duplicated.
- No assignment handling is added to response/final mutation functions.
- `server.js`, `node-assignments.js`, schema, migration `004`, QR routing, QuickStart, Mission Control, and other player pages are unchanged.

Update `test/escape-assignment-integration.test.js`, which currently asserts that no assignment-mode UI branch exists. Replace only that obsolete assertion with the expected narrow Escape renderer boundary while preserving its backend route evidence.

## PRESENTATION AND STATE INVARIANTS

- The API response remains the only assignment authority.
- Render assignment mode only for `mode === 'assignment'` on the Escape page with `nodeKey === 'escape'`.
- Display only `assignedMessage` plus fixed interface framing.
- Do not fabricate `player`, access code, visits, stage, progress, mission completion, answer completion, or final state.
- Do not expose normal Escape choices, prompt, response submission, media, final UI, or field-code copy in assignment mode.
- Do not imply the assignment is a normal visit or completed Function.
- Preserve gate, authorization, Start/End, retry, response, final, and normal Functional behavior.
- Preserve ESCAPE, ATTENTION, ACCESS, and SENSORY names and current meanings.
- Do not claim deeper ESCAPE Function semantics from this presentation experiment.

## OUT OF SCOPE

- Backend response or route changes
- Resolver, schema, or migration changes
- Assignment authoring, CRUD, Mission Control UI, edit, or clear behavior
- Assignment rendering for Attention, Access, or Sensory
- Generalized assignment components or page-state architecture
- Broad station-page, responsive, accessibility-system, typography, theme, or media redesign
- Assignment video, images, captions, font choices, or controls
- Visit, progress, response, or final integration
- Personal node, five-node QR conversion, QR changes, or player-specific URLs
- Start/End, QuickStart, recovery, cookie authority, profile gate, or identity redesign
- Scheduling, expiration, segmentation, cohorts, campaigns, or content engines
- Production migration, deployment, real-device, printed-QR, or field testing
- Unrelated refactors or documentation expansion

## STOP CONDITIONS

Stop and report without widening scope if:

1. Current `HEAD` contains material application drift from the pinned baseline.
2. The tested Escape assignment route or response contract is absent or failing.
3. The page cannot branch on the current payload without changing the backend contract.
4. Rendering requires fake player, stage, visit, progress, mission, or answer data.
5. The implementation requires rewriting or duplicating `renderStation`.
6. Attention, Access, or Sensory must gain assignment rendering.
7. Gate, authorization, or retry behavior would need redesign.
8. Private backend fields would be required or exposed.
9. Credible behavioral proof requires a large frontend framework or browser infrastructure.
10. Unrelated working-tree changes cannot be isolated.
11. Deployment or production mutation is required to prove the experiment.

## ACCEPTANCE CRITERIA

The implementation pass succeeds only if:

1. Existing Escape assignment API contract remains unchanged.
2. `scan()` recognizes assignment mode before any normal payload access.
3. Renderer validates Escape page, Escape node, and nonblank string message.
4. Assigned message is visibly rendered through `textContent`.
5. Assigned rendering does not call or require `progress`, `renderStation`, `renderChoices`, `renderMedia`, or `data.player`.
6. Assigned rendering hides normal choices, media, progress, final state, and field-code statement.
7. Assigned rendering fabricates no visit/progress/mission/final state.
8. Unassigned Escape uses the current renderer and presentation unchanged.
9. Attention, Access, and Sensory retain current normal rendering and reject assignment mode.
10. Existing gate/unauthorized behavior remains unchanged.
11. Existing failure/retry behavior handles network, non-OK, and malformed assignment cases.
12. No backend, schema, migration, QR, Mission Control, QuickStart, Start/End, or other page changes occur.
13. Focused VM/DOM behavioral tests pass.
14. Existing real Escape endpoint integration tests remain green.
15. Existing station tests and full regression suite remain green.
16. Disposable PostgreSQL endpoint evidence is rerun where available.
17. Implementation report separates VM/DOM, HTTP/PostgreSQL, and real-device evidence.
18. Broader Task Pack 02 and the player-specific assignment system are not called complete.

## REQUIRED TEST COMMANDS

Run and report at minimum:

```text
node --test test/escape-assignment-renderer.test.js
node --test test/escape-assignment-integration.test.js test/node-assignments.test.js
node --test test/station-video-state.test.js test/video-answers-identity.test.js test/start-end-qr.test.js
npm test
```

Run the real Escape integration and full suite with `TEST_DATABASE_URL` against disposable PostgreSQL when safely available. Never use production data.

Separate:

- structural source-order evidence;
- VM/fake-DOM behavioral evidence;
- real HTTP/PostgreSQL backend evidence;
- full regression evidence;
- unverified real browser/device behavior.

## REQUIRED CAUSAL PROOF

The implementation report must include both traces and identify the evidence source for each step.

### Assigned player

```text
Player A scans Escape
→ tested server returns { mode: assignment, nodeKey: escape, assignedMessage: Message A }
→ station-page scan dispatch selects renderAssignment
→ assignmentArea visible and Message A set through textContent
→ progress/renderStation/choices/media/final/field-code path not used
→ backend Escape visit remains absent from the prior HTTP evidence
```

### Unassigned player

```text
Player B scans the same Escape route
→ tested server returns existing composite payload
→ assignment dispatch not selected
→ current data.player/progress/renderStation path executes
→ normal stage, choices, and station presentation appear
→ existing HTTP evidence records the normal Escape visit
```

Do not merge frontend VM evidence and backend HTTP evidence into a claim of real-device validation.

## REQUIRED IMPLEMENTATION REPORT

Create the repository-mandated standalone report under `docs/pass-reports/` and include:

### WHAT IS REAL

- exact DOM additions, renderer, validation, dispatch point, visible copy, hidden normal elements, and unchanged normal path.

### WHAT IS MISSING

- authoring, other-Function rendering, backend follow-on, real device, deployment, production, and broader Task Pack 02 work.

### WHAT IS PROVISIONAL

- Escape-only renderer, fixed framing copy, VM/fake-DOM harness, and API-only assignment lifecycle.

### WHAT WORKS

- only DOM/script, HTTP, and regression behavior actually exercised.

### WHAT IS UNCERTAIN

- real browser/mobile layout, field readability, accessibility beyond the bounded live region, concurrent devices, production/deployment, authoring, and other Functions.

### TEST EVIDENCE

- exact commands, pass/fail/skip results, harness/environment, and evidence boundaries.

### CAUSAL PROOF

- the assigned and unassigned traces above, separating backend and frontend evidence.

### NEXT EXPERIMENT

- recommend the smallest next experiment after reviewing presentation evidence; do not begin it.

Use **DESIGNED**, **IMPLEMENTED**, **TESTED**, **VALIDATED**, and **UNVERIFIED** precisely. Do not call Task Pack 02 complete, the assignment system complete, or real-device/field behavior validated.

## COMMIT / DEPLOYMENT BOUNDARY

This packet does not itself authorize a commit, push, deployment, production mutation, QR work, authoring follow-on, or the next experiment. If later commit instructions are supplied, include implementation, tests, mandatory pass report, and report-index update together using `INCLUDED IN THIS COMMIT`.
