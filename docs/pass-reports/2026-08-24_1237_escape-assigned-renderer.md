# 1. PASS

- Pass/task name: Escape assigned-mode station-page renderer experiment
- Objective: Make the existing Escape assignment response visibly render in the current station page without requiring normal player/progress/puzzle fields and without changing unassigned Escape or other Functional behavior.
- Branch: `main`
- Execution baseline: `5902612f393c8ccc3d5232c570872f6f7695fc3a`
- Packet baseline: `a92f9ad55da7e84fa29f8c6e195133ce3b745996`
- Baseline reconciliation: execution baseline added only the committed renderer Task Pack, Director report, and report-index entry; application source matched the packet assumptions.

# 2. CURRENT REALITY BEFORE PASS

- **IMPLEMENTED and TESTED:** the Escape backend returned `{ mode: 'assignment', nodeKey: 'escape', assignedMessage }` before visit mutation and preserved existing fallback behavior for missing/inactive assignments.
- **VALIDATED, narrowly:** the real Escape HTTP endpoint could branch by persisted player assignment while leaving Attention, Access, and Sensory assignment-unaware.
- **IMPLEMENTED:** `public/station.html` handled successful Functional scans only as composite station responses requiring `data.player`, progress, stage, mission/answer state, and media fields.
- **NOT IMPLEMENTED:** no assignment DOM, renderer, or response dispatch existed. Assigned mode reached `data.player.accessCode`, threw, and entered retry.
- **IMPLEMENTED:** existing `.card`, `.signal`, `.tiny`, `.state-badge`, `.meta`, and `.hidden` primitives were sufficient for a bounded presentation.
- **TESTED:** repository frontend tests already used Node `vm` and purpose-built fake DOMs, but no test exercised assigned station presentation.
- Real browser, mobile/device, deployed, printed-QR, production, concurrent-device, authoring, and field behavior were **UNVERIFIED**.

# 3. WHAT CHANGED

- Added an initially hidden `assignmentArea` inside the existing authorized section with fixed receiver framing and an `aria-live` `assignmentMessage` element.
- Added `fieldAccess` as an ID on the existing field-code metadata container so assignment mode can hide the whole statement without inventing a player code.
- Added `renderAssignment(data)`, which validates Escape page/node identity and a nonblank string message, sets bounded assigned framing, writes the trimmed message through `textContent`, and hides normal progress, media, choices, final, and field-code elements.
- Added an early `data.mode === 'assignment'` dispatch after successful gate handling and before any `data.player`, `progress`, Start/End, or `renderStation` access.
- Preserved the existing normal composite-response path rather than rewriting or duplicating it.
- Updated the previous structural assertion that assignment UI was absent.
- Added a focused Node `vm`/fake-DOM suite exercising actual station script dispatch and DOM consequences.
- No backend, resolver, schema, migration, CSS, QR, QuickStart, Mission Control, Start/End, production, or deployment behavior changed.

# 4. WHAT IS REAL NOW

## DOM and renderer

- **IMPLEMENTED:** `assignmentArea` uses existing card/state/signal styles and is hidden by default.
- **IMPLEMENTED:** `assignmentMessage` is an `aria-live="polite"` signal element.
- **IMPLEMENTED:** assignment mode displays fixed `ASSIGNED TRANSMISSION`, `ESCAPE // DIRECT CHANNEL`, and receiver framing plus only the public `assignedMessage` value.
- **IMPLEMENTED:** message output uses `textContent`; HTML-like input remains literal text.
- **IMPLEMENTED:** assignment mode hides `progressSummary`, `progress`, `mediaBox`, `mediaControls`, `responseArea`, `finalArea`, and `fieldAccess`.
- **IMPLEMENTED:** validation rejects non-Escape pages, non-Escape node keys, non-string messages, and blank messages through the existing retry path.

## Dispatch and preserved paths

- **IMPLEMENTED:** `scan()` selects assignment mode only from explicit `data.mode === 'assignment'` after successful HTTP/gate handling.
- **IMPLEMENTED:** assignment dispatch returns before `data.player.accessCode`, `progress(data.player)`, Start/End rendering, or `renderStation(data, false)`.
- **TESTED:** an assignment response with no player, stage, stage metadata, mission state, answers, choices, or media renders successfully.
- **TESTED:** `progress`, `renderStation`, `renderChoices`, and `renderMedia` are not invoked for assigned mode.
- **TESTED:** normal Escape, Attention, Access, and Sensory composite responses retain current field-code, progress, stage, choices, media, and renderer behavior.
- **TESTED:** assignment-shaped responses on non-Escape pages and malformed assignment responses use retry rather than becoming fake defaults.
- **TESTED:** failed/non-OK scan behavior remains retry behavior.
- **VALIDATED, narrowly at script/DOM-harness level:** the current station-page script can visibly present the bounded Escape assignment response while preserving the normal renderer path.
- A real browser/mobile device has not been exercised, so layout, device interaction, and field readability remain unvalidated.

# 5. WHAT IS STILL MISSING

- No assignment authoring, edit, clear, or Mission Control workflow exists.
- Attention, Access, and Sensory remain intentionally without assignment presentation.
- Assignment mode has no video, image, response, progress, final, or field-code presentation.
- No real browser, mobile device, deployed network, printed Escape QR, concurrent-device, production, or field test occurred.
- No broader responsive/accessibility review occurred beyond the bounded live region and existing page primitives.
- Broader Task Pack 02 and the player-specific assignment system remain incomplete.

# 6. WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

- Fixed assigned-transmission framing is provisional interface copy, not field-validated language.
- The Escape-only renderer is an experiment, not a generalized assignment component.
- The Node `vm`/fake-DOM harness exercises real script logic but is not a browser rendering engine or real device.
- The harness manually models the page's required DOM elements and instruments renderer calls; it does not calculate CSS layout.
- Backend assignment selection and visit suppression remain the existing API contract; this pass only presents their result.

# 7. TESTING PERFORMED

## Pre-implementation checks

- `node --test test/escape-assignment-integration.test.js test/node-assignments.test.js`
- `node --test test/station-video-state.test.js test/video-answers-identity.test.js test/start-end-qr.test.js`

## Structural checks

- `git diff --check`
- Verified assignment DOM IDs, live region, `textContent` boundary, dispatch ordering, one existing `renderStation`, and unchanged backend/resolver/schema/migration/QR/QuickStart/Mission Control surfaces.
- Updated the existing Escape integration boundary assertion without weakening backend causal tests.

## VM/fake-DOM behavioral checks

- `node --test test/escape-assignment-renderer.test.js`
- The harness evaluated the actual inline station script with controlled page path, DOM, configuration/scan responses, fetch calls, and instrumented renderer calls.

## Existing regressions without PostgreSQL

- `node --test test/escape-assignment-integration.test.js test/node-assignments.test.js`
- `node --test test/station-video-state.test.js test/video-answers-identity.test.js test/start-end-qr.test.js`

## PostgreSQL-backed evidence

- Started the repository-local database with `docker compose up -d db`.
- Used `TEST_DATABASE_URL=postgres://artpark:artpark@localhost:5432/artpark`; database tests created and dropped isolated schemas.
- `TEST_DATABASE_URL=... node --test test/escape-assignment-renderer.test.js test/escape-assignment-integration.test.js test/node-assignments.test.js test/station-video-state.test.js test/video-answers-identity.test.js test/start-end-qr.test.js`
- `TEST_DATABASE_URL=... npm test`
- Stopped the local database with `docker compose stop db`.

# 8. TEST RESULTS

- Pre-pass resolver/HTTP set without PostgreSQL: 9 passed, 0 failed, 2 optional PostgreSQL cases skipped.
- Pre-pass station/video/Start-End set: 62 passed, 0 failed, 0 skipped.
- Focused renderer suite: 6 passed, 0 failed, 0 skipped. It was rerun after the final structural assertions with the same result.
- Existing resolver/HTTP set after implementation without PostgreSQL: 9 passed, 0 failed, 2 optional PostgreSQL cases skipped.
- Existing station/video/Start-End set after implementation: 62 passed, 0 failed, 0 skipped.
- PostgreSQL-backed targeted set: 79 passed, 0 failed, 0 skipped.
- Full PostgreSQL-backed suite: 233 passed, 0 failed, 0 skipped.
- No test failure occurred during this implementation pass.
- No production database, deployment, external service, printed QR, or field device was mutated.

## Causal proof

### Assigned player — separated evidence

Existing real HTTP/PostgreSQL evidence:

```text
Player A + Escape assignment
→ server returns { mode: assignment, nodeKey: escape, assignedMessage: Message A }
→ normal Escape visit remains absent
```

New VM/fake-DOM frontend evidence:

```text
same response delivered to /s/escape page script
→ scan selects renderAssignment before data.player access
→ authorized visible; gate/retry hidden
→ assignmentArea visible
→ assignmentMessage.textContent = Message A
→ progress/media/choices/final/field-code hidden
→ progress/renderStation/renderChoices/renderMedia call counts remain zero
```

### Unassigned player — separated evidence

Existing real HTTP/PostgreSQL evidence:

```text
Player B + no active Escape assignment
→ server returns existing composite Escape payload
→ normal Escape visit recorded once
```

New VM/fake-DOM frontend evidence:

```text
representative composite Escape response delivered to /s/escape page script
→ assignment dispatch not selected
→ field code and progress render
→ renderStation and renderChoices each execute
→ stage and normal choices become visible
```

Together these validate the bounded API-to-script contract, not real-device or deployed-field behavior.

# 9. IMPORTANT UNCERTAINTIES

- Whether the card, copy, and message remain readable and well-positioned on real mobile browsers.
- Whether players understand that assignment mode is separate from normal Escape progress.
- Whether the bounded `aria-live` behavior is sufficient with actual assistive technologies.
- Whether operators can safely author and clear assignments without database access.
- Whether other Functions should eventually share an assignment presentation rule.
- Concurrent device behavior, production deployment, printed QR usage, network conditions, and field usability remain unverified.

# 10. RECOMMENDED NEXT EXPERIMENT

- **NOW:** Current claim: assigned Escape is visible and isolated in the station script → biggest uncertainty: whether operators can create and clear one assignment safely without direct SQL → minimum experiment: design one bounded authenticated assignment set/clear contract for one player and Escape only, without UI or other-Function integration → observable result: authorized set changes the next Escape response to assignment mode and authorized clear restores the existing default route, with audit/privacy evidence.
- Do not begin that experiment automatically.
- **NEXT:** after mutation-contract evidence, consider a minimal Mission Control authoring surface.
- **LATER:** real mobile/device readability, assistive-technology behavior, and broader Function applicability.
- **PARK:** generalized assignment components, five-node QR conversion, scheduling, segmentation, campaigns, and identity redesign.

# 11. FILES MODIFIED

- `public/station.html`
- `test/escape-assignment-integration.test.js`
- `test/escape-assignment-renderer.test.js`
- `docs/pass-reports/2026-08-24_1237_escape-assigned-renderer.md`
- `docs/pass-reports/README.md`

# 12. COMMIT STATUS

`INCLUDED IN THIS COMMIT`
