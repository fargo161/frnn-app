# TASK PACK 02 — Minimal Escape Mission Control Authoring Control v0.1

**Document type:** Implementation Task Packet
**Reality state:** DESIGNED — not proof of implementation
**Baseline:** `869e5baefcae5bf1456805b8735017ac40dc13d0`
**Required branch:** `main`
**Status:** Pending
**Created:** 2026-08-24

> This packet defines work requested from the stated baseline. Current source, runtime behavior, and behavioral tests remain authoritative for what is actually implemented.

## PRIMARY OBJECTIVE

Add the smallest Mission Control control required to select one existing durable player and SET or CLEAR that player's Escape `assigned_message` through the already-implemented authenticated server endpoints.

The experiment must answer only this question:

> Can a Mission Control operator deliberately target one existing durable player, invoke the proven Escape SET/CLEAR contract, and understand the exact result without direct SQL or target/message confusion?

Required SET chain:

```text
authenticated Mission Control operator
→ existing player lookup/search selects Player A
→ durable target is visibly identified
→ operator enters Message A
→ existing PUT endpoint
→ response confirms Player A / Escape / active / Message A
```

Required CLEAR chain:

```text
same visibly selected Player A
→ explicit Player A confirmation
→ existing DELETE endpoint
→ response confirms Player A / Escape / inactive
```

Do not create a second mutation mechanism, generalized assignment UI, or controls for any other Function.

## CURRENT REALITY AT BASELINE

### Baseline and working tree

- `main`, local `HEAD`, and `origin/main` are synchronized at `869e5baefcae5bf1456805b8735017ac40dc13d0`.
- The working tree was clean during the Director inspection.
- Before implementation, compare `HEAD` with this baseline. A later commit containing only this packet and Director report is not material application drift. Stop on other material drift affecting the surfaces below.

### Mission Control entry point and authentication

- `public/admin.html` is the existing Mission Control HTML and inline client script. There is no parallel admin application or build step.
- `/admin` serves that file.
- `connectAdmin()` posts passphrase/operator to `POST /api/mission-control/login`; the server sets an HttpOnly, SameSite=Strict Mission Control cookie.
- `restoreSession()` calls `GET /api/mission-control/session` and reveals the existing dashboard when the cookie session is valid.
- The shared `api(url, options={})` helper uses same-origin `fetch`; it does not and must not expose `ADMIN_KEY`. It parses JSON and throws `Error(data.error || HTTP status)` for non-OK responses.
- Server-side `requireAdmin` remains authoritative for all assignment mutations. The new UI must add no frontend-only privilege or auth token.

### Existing player targeting surfaces

- The **Active Receivers** cards are rendered by `loadActiveReceivers()`. Each card shows formatted `receiver.accessCode`, optional `displayName`, active/complete status, progress, route, and last signal. Clicking its code places the code in `lookupCodeInput` and calls `lookupPlayer()`.
- The **Field Access** section already has `lookupCode`, `lookup`, `playerResult`, and an exact-code/name-search flow.
- `lookupPlayer()` normalizes a six-character input, sets formatted `currentCode`, requests `GET /api/admin/player/:accessCode`, renders player state, and loads the selected profile.
- Non-six-character input goes to existing bounded `searchProfiles(query)`. Results show formatted code, display name, and test marker; selecting one returns through `lookupPlayer()`.
- `loadPlayerProfile()` already retrieves display name and private operator-only profile fields, but assignment targeting must use only the display name, formatted code, and current player status. Do not display contact information, notes, profile history, final answer, or other private data in the assignment control.
- Important current boundary: `GET /api/admin/player/:accessCode` can return an access-code record even if its `players` row is absent. Its `player.createdAt` is `null` when no durable player row exists. Therefore a successful lookup alone is not sufficient to enable assignment mutation. The client target must require a non-null `player.createdAt`; the server endpoint remains authoritative and still rechecks `players.code` transactionally.
- `currentCode` is shared by repair/profile actions and is only a lookup candidate. Do not use it alone as assignment authority. Add a separate selected-assignment target state populated only after the durable-player check succeeds.

### Existing mutation and feedback conventions

- Existing client mutations call `api(...)`, use explicit buttons/event listeners, update a nearby `.meta` status element, and apply `.success` or `.error` classes.
- Existing risky operations use native `window.confirm` or `window.prompt`; no modal system exists.
- Reset and identity release already appear in Field Access and have materially different consequences. Assignment copy must say `SET ESCAPE ASSIGNMENT` and `CLEAR ESCAPE ASSIGNMENT`; it must not use reset/delete/release language.
- Existing CSS primitives in `public/styles.css` are sufficient: `.admin-section`, `.card`, `.signal`, `.meta`, `.success`, `.error`, `.toolbar`, `.danger`, `.hidden`, and current input/textarea/button styles. Do not add stylesheet rules unless a concrete accessibility/layout defect blocks the bounded control.

### Proven server contract

`server.js` already implements, under `requireAdmin`:

```text
PUT    /api/admin/player/:accessCode/escape-assignment
DELETE /api/admin/player/:accessCode/escape-assignment
```

SET body:

```js
{ assignedMessage: 'Message A' }
```

SET success, HTTP 200:

```js
{
  accessCode: 'AAA-111',
  nodeKey: 'escape',
  active: true,
  assignedMessage: 'Message A'
}
```

CLEAR success, including known inactive/absent assignment state, HTTP 200:

```js
{
  accessCode: 'AAA-111',
  nodeKey: 'escape',
  active: false
}
```

Bounded errors used by the control:

- `MISSION_CONTROL_ACCESS_REQUIRED` with HTTP 401;
- `INVALID_ASSIGNMENT_MESSAGE` with HTTP 400;
- `PLAYER_NOT_FOUND` with HTTP 404;
- `HTTP <status>` or another bounded server code for temporary/unexpected failure through the current `api()` helper.

SET trims and validates one string of 1..1000 characters. CLEAR deactivates and is idempotent for a known player. Both successful mutations write durable server-side audit records. The UI must not duplicate audit records.

### Current assignment read boundary

- No current Mission Control or server endpoint reads the selected player's current assignment state.
- The mutation responses are sufficient for this experiment: SET returns the exact active message, and CLEAR returns exact inactive state.
- Do not add a GET endpoint, assignment listing query, or synthetic client-side claim about initial persistence.
- On a newly selected player, visibly state `CURRENT ESCAPE ASSIGNMENT STATE NOT LOADED` (or equivalent). This is an honest unknown, not an error. CLEAR remains safe because the proven server operation is idempotent for a known player.
- After SET or CLEAR, display only the state returned by that mutation. Switching targets must reset the result to unknown and clear message/status so Player A state cannot appear under Player B.

### Audit visibility

- The server writes `ESCAPE_ASSIGNMENT_SET` and `ESCAPE_ASSIGNMENT_CLEARED` to `mission_control_audit` transactionally.
- Current Mission Control does not display a general audit log. Do not add one, and do not claim that a local success message is audit evidence.

### Existing frontend test approach

- `test/program-packager.test.js` executes the real inline `public/admin.html` script in Node `vm` with a purpose-built fake DOM and instrumented `fetch`.
- Other Mission Control tests combine source-boundary assertions with small behavior harnesses; no browser automation framework or DOM package is installed.
- `test/escape-assignment-mutation.test.js` already supplies spawned-server/disposable-PostgreSQL evidence for the exact backend endpoints and Escape consequences.
- Reuse these patterns. Do not add JSDOM, Playwright, Puppeteer, or a client framework for this experiment.

## REQUIRED UI CHANGES

### 1. Add one Escape-only authoring card

In `public/admin.html`, add one initially hidden card immediately after the existing Field Access section and before Player Profile:

```html
<div id="escapeAssignmentArea" class="admin-section card hidden">
  <h2>ESCAPE ASSIGNMENT</h2>
  <div class="meta">Plain-text direct transmission for one selected durable player. This does not reset progress or release a credential.</div>
  <div class="tiny">SELECTED PLAYER</div>
  <div id="escapeAssignmentTarget" class="signal" aria-live="polite"></div>
  <label for="escapeAssignmentMessage">ESCAPE ASSIGNED MESSAGE</label>
  <textarea id="escapeAssignmentMessage" maxlength="1000"></textarea>
  <div class="toolbar">
    <button id="setEscapeAssignment">SET ESCAPE ASSIGNMENT</button>
    <button id="clearEscapeAssignment" class="danger">CLEAR ESCAPE ASSIGNMENT</button>
  </div>
  <div id="escapeAssignmentStatus" class="meta" aria-live="polite"></div>
</div>
```

Equivalent copy is acceptable only if it remains explicit about Escape, selected durable player, plain text, and non-reset/non-release consequences. Use these exact IDs so behavior is testable.

Do not add a node selector, type selector, assignment table, current-state fetch, preview, formatting, media, or history.

### 2. Add separate selected-target state

Alongside `currentCode`, add one bounded variable such as:

```js
let escapeAssignmentTarget = null;
```

The object may contain only data needed for safe targeting/presentation:

```js
{
  accessCode: player.accessCode,
  displayName: profile.displayName || '',
  status: player.status,
  active: player.active
}
```

Do not store contact information, notes, history, final answer, or an assignment row locally.

Add small functions with clear responsibilities, preferably:

- `clearEscapeAssignmentTarget()`;
- `selectEscapeAssignmentTarget(player, displayName)`;
- `setEscapeAssignmentStatus(message, isError=false)`;
- `setEscapeAssignmentBusy(busy)`;
- `escapeAssignmentErrorMessage(error)`.

Exact names may differ, but tests must exercise the actual state transitions.

`clearEscapeAssignmentTarget()` must:

- set the selected target to null;
- hide `escapeAssignmentArea`;
- clear the message and status;
- disable SET and CLEAR;
- remove any previously rendered Player A target/result before a new search or selection attempt.

`selectEscapeAssignmentTarget(...)` must:

- refuse a player without `createdAt` and leave the control hidden/disabled;
- set the target from server-returned `player.accessCode`, not raw lookup input;
- use `textContent` to visibly render formatted code, optional display name, status, and active state;
- reveal the card;
- clear the textarea and prior result;
- show honest initial feedback such as `CURRENT ESCAPE ASSIGNMENT STATE NOT LOADED.`;
- enable CLEAR and enable SET only when the message becomes locally valid.

The selected target must remain visible during requests and after success/error. Never derive the mutation URL from `lookupCodeInput` after selection; use the separate selected target object.

### 3. Integrate with current lookup/search flow

Preserve the existing Active Receivers and name-search selection chain; do not build a new directory.

Modify `lookupPlayer()` minimally:

1. clear any prior assignment target before beginning a new exact-code lookup;
2. retain current normalization and `GET /api/admin/player/:accessCode` behavior;
3. after a successful player response and `loadPlayerProfile()`, select the assignment target only if `player.createdAt` is non-null;
4. pass only the profile display name into assignment targeting;
5. if no durable player exists, keep the assignment control hidden/disabled and leave existing player lookup behavior authoritative;
6. on lookup/profile failure, clear assignment selection so a stale Player A target cannot survive a failed Player B lookup.

Modify `searchProfiles(query)` to clear the previous assignment target before presenting results. Clicking a result must continue through exact `lookupPlayer()`; a search-result button alone must not become mutation authority.

Have `loadPlayerProfile()` return its loaded profile data or otherwise update the selected target display name when the selected player's profile name changes. The visible target must not retain a stale display name after an existing profile save/clear/restore operation.

Do not change the player lookup APIs or Active Receivers endpoint.

### 4. Client validation and button state

Add one small pure/client helper such as `validEscapeAssignmentMessage()` that:

- requires `typeof value === 'string'`;
- trims for validation;
- accepts trimmed length 1..1000.

The server remains authoritative. The textarea `maxlength=1000` is operator assistance, not security.

On message input:

- clear stale SET-success presentation or return status to the honest selected/unknown state;
- enable SET only when a durable target exists, no request is active, and the trimmed message is valid;
- keep CLEAR enabled whenever a durable target exists and no request is active.

Before each mutation, capture the selected target object locally and use it consistently for URL and result checks. If selection changes before completion, do not render the old response as the new target's state.

During SET or CLEAR:

- disable both mutation buttons and the message textarea;
- ignore/reject duplicate clicks while busy;
- restore controls after completion only if the same target remains selected.

Do not build a generalized request/state manager.

## REQUIRED SET FLOW

Add `setEscapeAssignment()` and attach it through an explicit event listener.

Required behavior:

1. require the separate durable selected-target object;
2. trim and locally validate `escapeAssignmentMessage.value`;
3. if invalid, make no request and show `ENTER 1–1000 NON-WHITESPACE CHARACTERS.` (or equivalent bounded feedback);
4. set busy state;
5. call exactly:

```js
api(`/api/admin/player/${encodeURIComponent(target.accessCode)}/escape-assignment`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ assignedMessage })
})
```

6. validate the success projection before claiming success:
   - `data.accessCode === target.accessCode`;
   - `data.nodeKey === 'escape'`;
   - `data.active === true`;
   - `data.assignedMessage` is a nonblank string;
7. write `data.assignedMessage` back into the textarea so server trimming/result is reflected exactly;
8. show a success statement through `textContent` that includes the exact selected formatted code, optional selected display name, `ESCAPE ASSIGNMENT ACTIVE`, and returned message;
9. keep the target visibly selected;
10. on malformed success data, treat it as temporary failure rather than inventing state.

SET requires no additional confirmation: the visible selected-target block, bounded message, and explicit `SET ESCAPE ASSIGNMENT` button are the minimum error-prevention mechanism. Do not add a modal system.

## REQUIRED CLEAR FLOW

Add `clearEscapeAssignment()` and attach it through an explicit event listener.

Before the request, use the existing native confirmation convention. The confirmation must include exact target identity and consequence, for example:

```text
CLEAR ESCAPE ASSIGNMENT FOR PLAYER A / AAA-111?

This restores normal Escape fallback. It does not reset progress or release the credential.
```

If no display name exists, show the formatted code without an empty separator. Cancellation makes no request and must not show success.

On confirmation:

1. capture the selected target;
2. set busy state;
3. call exactly the same selected-player URL with `{ method: 'DELETE' }`;
4. validate `data.accessCode === target.accessCode`, `data.nodeKey === 'escape'`, and `data.active === false`;
5. clear the textarea so an inactive assignment is not visually paired with a stale active message;
6. show success via `textContent`, including exact target and `ESCAPE ASSIGNMENT CLEARED // NORMAL ESCAPE FALLBACK RESTORED` (or equivalent);
7. treat idempotent HTTP 200 CLEAR exactly as success;
8. keep the target visibly selected for re-SET.

Do not call reset, visit repair, identity release, profile clear, activation, or any other endpoint.

## REQUIRED ERROR AND AUTH FEEDBACK

Map only the known errors needed for this control:

- `INVALID_ASSIGNMENT_MESSAGE` → `MESSAGE MUST CONTAIN 1–1000 NON-WHITESPACE CHARACTERS.`
- `PLAYER_NOT_FOUND` → `SELECTED DURABLE PLAYER NO LONGER EXISTS. SEARCH AGAIN.`
- `MISSION_CONTROL_ACCESS_REQUIRED` → `MISSION CONTROL SESSION EXPIRED. ENTER CONTROL AGAIN.`
- anything else → `ESCAPE ASSIGNMENT REQUEST FAILED. TRY AGAIN.`

For `PLAYER_NOT_FOUND`:

- show the exact stale target in the selected-target block with a clear stale/error label;
- disable further mutation until a new lookup succeeds;
- do not create a player or silently switch targets.

For `MISSION_CONTROL_ACCESS_REQUIRED`:

- do not show mutation success;
- clear the assignment selection;
- hide the dashboard and reveal the existing login section;
- set `loginError` to the bounded session-expired message;
- do not redesign login/session behavior.

For other errors, keep the selected target visible and allow a bounded retry after busy state clears.

Never display raw response objects, stack traces, database errors, cookies, audit internals, contact information, notes, or another player's data.

## REQUIRED FRONTEND BEHAVIORAL TESTS

Create `test/escape-assignment-authoring.test.js` using the existing Node `vm`, fake-DOM, and instrumented-fetch approach from `test/program-packager.test.js`. Execute the real inline Mission Control functions; do not satisfy this packet only with regex assertions.

Expose only the functions/elements needed by the test harness after removing the terminal `restoreSession()` call. The fake elements must support `textContent`, `value`, `disabled`, `classList`, event listeners, and the current methods touched by lookup/profile rendering. Use `textContent` assertions for target and assignment feedback.

### Test A — target must be explicit and durable

Given Player A and Player B fixtures:

- exact lookup of Player A plus its profile selects only Player A;
- visible target includes `AAA-111`, optional `PLAYER A`, and current status;
- assignment card remains hidden before lookup and for a returned record with `createdAt:null`;
- selecting/searching Player B clears all prior Player A message/result state before Player B becomes authoritative;
- name-search results do not become assignment targets until their exact lookup succeeds.

### Test B — SET targets only selected Player A

Given Player A selected and `Message A` entered:

- SET becomes enabled;
- click/function invocation makes exactly one `PUT` to `/api/admin/player/AAA-111/escape-assignment`;
- request JSON is exactly `{ assignedMessage: 'Message A' }`;
- no Player B or unrelated admin URL is called;
- both buttons and textarea are disabled while the promise is pending;
- successful response keeps Player A visible and shows active Message A;
- returned trimming is reflected from response rather than assumed locally.

### Test C — CLEAR confirmation and target isolation

Given Player A selected:

- native confirmation text names Player A/code and says normal fallback without reset/release;
- cancellation sends no request;
- confirmation sends exactly one Player A `DELETE` request;
- success reports Player A cleared/inactive, clears the message field, and retains Player A selection;
- Player B is never targeted.

### Test D — re-SET

After CLEAR, enter `Message C` and SET again:

- the same control sends the same Player A PUT endpoint;
- success reports active Message C;
- no client-side list, duplicate object, or secondary mutation contract is created.

### Test E — validation and server errors

- blank, whitespace-only, and programmatically over-1000-character messages make no SET request and never show success;
- a server `INVALID_ASSIGNMENT_MESSAGE` response maps to bounded message feedback;
- `PLAYER_NOT_FOUND` preserves visible stale target identity, disables mutation, and does not call player creation/activation;
- an unexpected HTTP failure shows bounded retry feedback and preserves target selection.

### Test F — session expiration

When SET or CLEAR returns `MISSION_CONTROL_ACCESS_REQUIRED`:

- no success copy appears;
- assignment target is cleared;
- dashboard is hidden;
- existing login section is shown with session-expired feedback.

### Test G — request boundary

Instrument all requests from assignment actions and prove they never call:

- `/reset`;
- `/identity`;
- `/visits`;
- `/codes/issue`;
- profile endpoints;
- QuickStart;
- response/final endpoints;
- Attention, Access, or Sensory assignment endpoints.

### Required source assertions

- Exact assignment element IDs exist and use explicit DOM references/event listeners.
- No inline `onclick`/`onchange` handlers or raw `ADMIN_KEY` are introduced.
- The message and selected/result state use `textContent`, not `innerHTML`.
- No Attention, Access, Sensory, node-select, assignment-type-select, assignment list, or assignment GET call exists.
- `server.js`, `node-assignments.js`, schema, migrations, station page, resolver, scan route, QR, and player pages remain unchanged.

Update the obsolete assertion in `test/escape-assignment-mutation.test.js` that currently requires `public/admin.html` not to contain `escape-assignment`. Replace only that no-UI expectation with a bounded assertion that the client references the two existing fixed endpoints; preserve all backend causal tests.

Update `test/lib.test.js` to include the new explicit assignment control IDs and event listeners in its existing admin-control boundary test.

## REQUIRED LOCAL CAUSAL OPERATOR PROOF

Because the repository already has both a fake-DOM Mission Control harness and a spawned-server/disposable-PostgreSQL harness, add one bounded integrated test in `test/escape-assignment-authoring.test.js` when `TEST_DATABASE_URL` is available. Do not add browser infrastructure.

Use:

- an isolated PostgreSQL schema;
- the real spawned Express server;
- a test `MISSION_CONTROL_PASSPHRASE`;
- one real login request and a small cookie-aware fetch wrapper for the VM harness;
- synthetic durable Player A and Player B;
- the real Mission Control lookup/profile/SET/CLEAR functions;
- direct database reads and the existing real Escape scan endpoint for consequence checks.

Prove:

```text
VM Mission Control selects Player A / AAA-111
→ VM SET sends existing cookie-authenticated PUT
→ one active database row stores Message A
→ VM confirms Player A / Message A
→ real Player A Escape scan returns assignment mode / Message A
→ no normal Escape visit
```

Then:

```text
same VM target confirms CLEAR
→ existing cookie-authenticated DELETE
→ database row remains and is inactive
→ VM confirms Player A cleared
→ real Player A Escape scan returns normal fallback
→ normal Escape visit is recorded
```

Then re-SET Message C through the same VM control and prove the same row is active and the next Escape response returns Message C.

Prove Player B assignment and behavior remain unchanged. This is a local synthetic operator chain, not real-browser or field validation.

## PRESENTATION AND STATE INVARIANTS

- Only a successfully looked-up durable player can become the assignment target.
- The mutation URL comes from selected server-returned `player.accessCode`, never live lookup input.
- Target code, optional display name, and status remain visible before and after mutation.
- Switching/searching targets clears prior message/result state immediately.
- Initial assignment persistence is labeled unknown; no GET/list state is fabricated.
- Plain text only; use `textContent` for target/result/message feedback.
- SET and CLEAR use only the existing fixed Escape endpoints.
- Server responses are checked against selected target and Escape state before success is shown.
- CLEAR is visually distinct and explicitly confirmed; SET relies on the visible target/message/button.
- Duplicate submissions are prevented while a request is active.
- Unauthorized, invalid, unknown, and temporary failures are never shown as success.
- Existing server audit remains the only durable mutation audit.
- Preserve ESCAPE, ATTENTION, ACCESS, and SENSORY names and current meanings.

## OUT OF SCOPE

- Assignment GET/list/search/history endpoints or UI
- Current assignment preloading or synchronization across operators
- Bulk or multi-player assignment
- Attention, Access, Sensory, Personal, or Start/End assignment controls
- Node/type dropdowns or generic assignment components/services
- Rich text, HTML, Markdown, fonts, templates, preview, media, scheduling, expiration, priority, targeting, segmentation, cohorts, or campaigns
- New player directory, fuzzy search, profile search redesign, or Active Receivers redesign
- Player creation, activation, claim, recovery, reset, visit repair, profile mutation, or credential release
- Mission Control auth/accounts/roles/session redesign
- Audit history UI or client-generated audit records
- Station page, resolver, scan route, visit suppression, fallback, player UI, QR, or QuickStart changes
- CSS/theme/responsive redesign
- New frontend framework or browser automation dependency
- Deployment, production mutation, real-device testing, field testing, or simultaneous-operator resolution
- Unrelated refactors or documentation expansion

## STOP CONDITIONS

Stop and report without widening scope if:

1. Current `HEAD` contains material application drift from the pinned baseline.
2. Current Mission Control login/session and `api()` mutation pattern cannot be reused.
3. Existing Field Access/Active Receivers/profile search cannot produce an explicit durable target without a broad new directory.
4. The proven PUT/DELETE contract or response shapes are absent or failing.
5. Safe operation requires direct database access from the client.
6. A generalized assignment GET/list API is required merely to render this control.
7. UI operation requires player-side resolver/scan/renderer changes.
8. Attention, Access, or Sensory must gain assignment controls.
9. Credible frontend behavior cannot be tested with the existing VM/fake-DOM approach.
10. A large frontend/browser framework or architecture must be introduced.
11. Unrelated working-tree changes cannot be isolated.
12. Deployment or production mutation is required for local proof.

## ACCEPTANCE CRITERIA

The experiment succeeds only if:

1. Mission Control contains one Escape-only assignment card using existing styles.
2. Existing lookup/search/Active Receivers selection is reused; no new directory exists.
3. Only a server-returned record with non-null `player.createdAt` becomes a target.
4. Target code, optional display name, and current status are visible before mutation.
5. Assignment target state is separate from mutable lookup input/current repair state.
6. Switching/searching/failing lookup clears stale target/message/result state.
7. Initial persisted assignment state is honestly marked not loaded; no GET/list endpoint is added.
8. Plain-text input and client feedback align with the server's trimmed 1..1000 boundary while leaving server validation authoritative.
9. SET calls only the existing selected-player PUT endpoint and validates the returned target/node/active/message before success.
10. CLEAR confirmation names the exact target and distinguishes fallback restoration from reset/release.
11. CLEAR calls only the existing selected-player DELETE endpoint, accepts idempotent success, and validates returned target/node/inactive state.
12. SET/CLEAR prevent duplicate submission while pending.
13. Re-SET works through the same selected-target control.
14. Unknown, invalid, unauthorized, malformed-success, and temporary failures are never presented as success.
15. Session expiration returns to the existing login surface without auth redesign.
16. No reset, release, visit repair, activation, creation, profile, response, final, or other-Function mutation is called.
17. No private profile fields or other-player assignment information appears in the control.
18. Server audit remains unchanged and authoritative.
19. VM/fake-DOM target, request, busy, success, CLEAR confirmation, error, session, re-SET, and isolation tests pass.
20. The integrated VM/session/HTTP/PostgreSQL SET → CLEAR → re-SET causal chain passes without skips in the final evidence run.
21. Existing mutation, Escape route, renderer, Mission Control, profile, identity, and full regression suites remain green.
22. Server, schema, migrations, resolver, station page, player UI, QR, other Functions, deployment, and production remain unchanged.

## REQUIRED TEST COMMANDS

Run before and after implementation, using disposable PostgreSQL through `TEST_DATABASE_URL` where applicable:

```text
node --test test/escape-assignment-mutation.test.js
node --test test/escape-assignment-renderer.test.js test/escape-assignment-integration.test.js test/node-assignments.test.js
node --test test/mission-control.test.js test/lib.test.js test/player-profiles.test.js test/durable-player-identity.test.js
npm test
```

After implementation also run:

```text
node --test test/escape-assignment-authoring.test.js
```

The final full-suite run must provide real PostgreSQL authoring/mutation/scan evidence without database skips. Never use production or shared player data.

Report separately:

- structural source evidence;
- VM/fake-DOM Mission Control behavior;
- cookie-authenticated VM-to-real-server/PostgreSQL behavior;
- real Escape endpoint consequence;
- existing station renderer regression;
- full-suite regression;
- unverified real browser/device/operator/field behavior.

## REQUIRED CAUSAL PROOF

The implementation report must show evidence for each link.

### SET

```text
Mission Control session
→ existing lookup selects durable PLAYER A / AAA-111
→ target remains visible
→ Message A entered
→ existing PUT endpoint
→ one active Escape row + server audit committed
→ UI validates and confirms PLAYER A / Message A
→ real Player A Escape scan returns assignment mode / Message A
→ normal Escape visit suppressed
```

### CLEAR

```text
same visible PLAYER A target
→ explicit CLEAR confirmation names Player A and fallback consequence
→ existing DELETE endpoint
→ row inactive + server audit committed
→ UI validates and confirms PLAYER A cleared
→ real Player A Escape scan returns normal fallback
→ normal Escape visit recorded
```

### RE-SET AND ISOLATION

```text
same Player A target
→ Message C
→ same PUT contract and same row active
→ next Player A Escape response is Message C

Player B never selected
→ no assignment request targets Player B
→ Player B row and Escape behavior unchanged
```

Do not merge VM/local synthetic evidence into a claim of real operator or field validation.

## REQUIRED IMPLEMENTATION REPORT

Create the mandatory timestamped report under `docs/pass-reports/`, update its index, and include the repository-required 12 sections.

The report must distinguish:

- **IMPLEMENTED:** actual Mission Control target state, UI controls, client validation, PUT/DELETE calls, busy state, confirmation, response checks, and feedback present in source;
- **TESTED:** exact VM behavior, cookie/session real-server/PostgreSQL chain, Escape consequences, and regressions exercised;
- **VALIDATED:** only if evidence supports that the bounded Mission Control control can deliberately target one synthetic durable player and set/clear that player without direct SQL or unintended mutation in the tested harness;
- **UNVERIFIED:** real operator under event pressure, target mistakes in the field, mobile/tablet usability, production security, deployed latency/network failure, simultaneous operators, other Functions, and long-term lifecycle.

Document that no initial assignment read exists, the initial state is intentionally unknown, and successful mutation responses are the only displayed current result. Include exact test commands/results/skips/failures, the three causal traces, unchanged server boundary, and remaining uncertainty. Do not call Mission Control assignment management, the assignment system, or Task Pack 02 complete.

## NEXT-STEP DISCIPLINE

After implementation, stop.

Use the evidence to choose—do not automatically begin—one of:

- real-device/operator usability before event use;
- production authorization stabilization;
- a separately authorized second-Function experiment.

Do not generalize to all Functions automatically.

## COMMIT / DEPLOYMENT BOUNDARY

This packet does not itself authorize a commit, push, deployment, production mutation, second Function, or next experiment. If later commit instructions are supplied, include implementation, tests, mandatory pass report, and report-index update together using `INCLUDED IN THIS COMMIT`.
