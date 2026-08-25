# PASS

- Task: First Broadcast Packager — barebones FRNN Web Test Lab.
- Objective: make the existing Broadcast Control Lab and public receiver repeatably owner-launchable on a laptop, while displaying a same-Wi-Fi phone URL and operational receiver QR without changing Broadcast causality.
- Active work order: `C:\Users\mcdon\Downloads\FRNN_BAREBONES_WEB_TEST_LAB_CODEX_PROMPT.md`, treated as task instructions subordinate to the owner request and repository rules.
- Branch: `main`.
- Starting SHA: `e81c886fdc85985474c2f696265f5948968402bf`.
- Server/Test Lab route: `/test-lab`, enabled by the Test Lab launcher.
- Canonical launch command: `npm run test-lab`.
- Shared-file gate: `tasks/README.md` named no current owner for `public/admin.html`; this pass did not modify that file. The pending Escape authoring packet remained untouched.

# CURRENT REALITY BEFORE PASS

- **DESIGNED:** the supplied task packet proposed one owner-facing launch path, a Web Test Lab hub, LAN receiver discovery/QR, PostgreSQL preflight, clean shutdown, and a novice guide. Its claims were checked against current source before implementation.
- **IMPLEMENTED:** current source at the starting SHA already separated Library definition → independent Queue reference → immutable copied Active Run → public Broadcast. It had authenticated `/control-lab` APIs/UI and public `/api/broadcast` plus `/broadcast` receiver behavior.
- **IMPLEMENTED:** `server.js` already bound to `0.0.0.0`, ran the normal schema and numbered migrations before listening, and used persistent PostgreSQL. It did not have a dedicated owner launcher, explicit Test Lab route, LAN URL discovery, receiver QR for the current LAN URL, or graceful pool shutdown handling.
- **TESTED:** Task Packet 01 had focused unit, client VM, real HTTP/PostgreSQL, restart, boundary, and two-receiver-tab evidence. This did not prove physical phone connectivity or owner usability.
- **VALIDATED:** the prior pass supported only the bounded claim that two local receiver tabs could converge through v1 → v2 → OFF AIR across a restart/boundary rehearsal. Production hosting, venue networking, physical devices, and real media timing were not validated.
- Documentation contradiction: the root README still described the retired fixed Mission Control Packager and a looping queue, while current source was finite Library → Queue → immutable Active Run behavior. The Broadcast Control Lab README also incorrectly called the committed Task Packet 01 state an uncommitted worktree.

# WHAT CHANGED

- Added `npm run test-lab` as the one canonical owner launch command.
- Added an ignored `.env.test-lab` workflow with a tracked placeholder example. The launcher loads only that local settings file, checks required database/authentication settings without printing values, applies the existing startup path, uses port `3000` by default, and respects `PORT`/`HOST` overrides.
- Added bounded Test Lab configuration helpers for port/host validation, private IPv4 discovery, physical-adapter-first candidate ordering, LAN reachability under the selected bind host, deterministic URL construction, environment parsing, redacted failure details, and owner-facing readiness output.
- Added explicit Test Lab server mode. Successful causality is now: owner command → configuration preflight → normal PostgreSQL migration/config read → explicit listen success → printed local/LAN URLs → `/test-lab` hub.
- Added clear startup failures for missing configuration, invalid port/host, PostgreSQL preparation failure, and `EADDRINUSE`. No random port fallback was added.
- Added `/api/test-lab/status`, which exposes only real server/database readiness, non-secret local/LAN URLs, and the same read-only public Broadcast projection used by receivers. It adds no producer mutation path.
- Added `/api/test-lab/receiver-qr.svg`, which encodes the primary reachable private-LAN `/broadcast` URL. If no reachable private address exists, the endpoint returns an explicit unavailable state and localhost operation remains available.
- Added `/test-lab` with restrained FRNN lab styling, real OFF AIR/ON AIR public status, readable/copyable receiver URLs, operational QR, concise instructions, an embedded existing authenticated `/control-lab`, and an embedded existing public `/broadcast` preview.
- Added SIGINT/SIGTERM shutdown handling that stops the HTTP server, closes idle connections and the PostgreSQL pool, and retains ordinary database state.
- Added a novice Windows owner guide covering first-time PostgreSQL/config setup, exact launch/use/phone/shutdown flow, persistence, likely troubleshooting, and the manual owner acceptance rehearsal.
- Corrected current README claims about the retired fixed Packager, finite exhaustion, current migrations, and the dedicated Control Lab/Test Lab routes.
- Added focused configuration/client tests and expanded the real spawned HTTP/PostgreSQL test to exercise the launcher, readiness output, Test Lab/status/QR routes, actual port conflict, secret non-disclosure, existing BCL behavior, and process termination.

# WHAT IS REAL NOW

- **IMPLEMENTED:** an owner can configure persistent local PostgreSQL once and start the application with `npm run test-lab`.
- **IMPLEMENTED:** startup refuses false success until migrations/config reads and the listen operation succeed, then prints exact local and discovered LAN URLs.
- **IMPLEMENTED:** the server intentionally accepts same-LAN traffic through the default `HOST=0.0.0.0` Test Lab configuration. No tunnel, router mutation, firewall mutation, deployment, or public-internet mechanism was added.
- **IMPLEMENTED:** the hub displays live public Broadcast state and uses the real Control Lab and receiver routes. Authenticated producer state remains PostgreSQL-authoritative; the phone receiver remains public/read-only.
- **IMPLEMENTED:** a QR opens the primary reachable LAN receiver URL and is explicitly distinguished from mission/station QR behavior.
- **IMPLEMENTED:** Ctrl+C/SIGTERM cleanup closes the server/pool without deleting local data.
- **TESTED:** default and override port behavior, host validation, physical-first LAN candidate ordering, loopback/no-LAN suppression, URL formatting, redaction, missing settings, and real `EADDRINUSE` behavior.
- **TESTED:** Test Lab branding, real route links/iframes, public-status rendering, ON AIR/OFF AIR/error/no-LAN states, QR target visibility, and absence of Test Lab client calls to `/api/admin/*`.
- **TESTED:** real authenticated HTTP Library creation, duplicate Queue references, immutable active v1, future v2 edit/activation, refusal/audit behavior, Start/Stop, public projection, launcher output, QR response, and clean test-process termination.
- **TESTED:** a separate self-SIGINT runtime on port `32118` printed the shutdown sequence, closed cleanly with exit code 0, and reported retained PostgreSQL data.
- **TESTED:** in-app browser inspection at 1440×900 and 390×844 showed READY server/database state, OFF AIR public state, readable URLs/QR, the honest unauthenticated Control Lab state, a synchronized public receiver preview, responsive single-column collapse, and no horizontal overflow.
- **VALIDATED:** the implementation supports the bounded technical claim that the existing BCL can be packaged behind one repeatable local launcher and one operational hub without creating a second Broadcast state model.

# WHAT IS STILL MISSING

- The owner has not personally performed the documented launch flow.
- No physical phone opened the LAN URL or scanned the QR during this pass.
- Windows firewall prompts, Wi-Fi client isolation, VPN routing, and venue networking remain unvalidated.
- No real image/video receiver timing, autoplay, decode, or long-running load rehearsal was performed.
- Production hosting, public internet access, multi-operator permission redesign, final workstation/player design, Media Bin, full Packaging Editor, Program Packs, and mission QR integration remain out of scope.
- The Test Lab route is enabled only through explicit Test Lab mode; running the ordinary server command does not claim the owner lab is active.

# WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

- `.env.test-lab.example` contains local placeholders and the existing Docker-development database coordinates, not live credentials.
- `media_ref` remains a provisional reference path rather than a Media Bin or asset registry.
- `loop_eligible` remains stored-only and causally inert; finite exhaustion still produces OFF AIR.
- The generated QR is only an operational URL opener, not mission/station QR gameplay.
- LAN address selection is a bounded local heuristic. It prioritizes physical-looking adapter names and lists remaining private candidates, but cannot prove which adapter reaches the owner's phone.
- Styling is a restrained lab shell, not the final FRNN visual system or final Mission Control workstation.
- Browser QA used a disposable temporary schema and test credentials; ordinary owner startup uses the persistent database in `.env.test-lab`.

# TESTING PERFORMED

Structural checks:

- `node --check web-test-lab-config.js`
- `node --check scripts/start-test-lab.js`
- `node --check public/web-test-lab.js`
- `node --check server.js`
- `git diff --check`
- Focused source searches for Test Lab routes, secret-like test values, public producer mutations, and `MutationObserver` references.

Behavioral checks:

- `node --test test/web-test-lab.test.js test/program-packager.test.js test/broadcast-viewer.test.js`
- Missing-config launcher invocation with database/authentication variables removed; observed exit code 1 and actionable setup text.
- With `TEST_DATABASE_URL` loaded only from ignored `.env.test.local`, after verifying localhost and database name `frnn_integration_test`: `node --test test/broadcast-control-lab-http.test.js test/broadcast-master-clock.test.js` during development.
- Final full command under the same disposable database gate: `npm test`.
- Real port conflict: a second launcher targeted the first spawned server's occupied port and exited 1 with the exact port and override instruction, without printing test secrets or schema name.
- Real graceful shutdown: a Test Lab process emitted SIGINT after readiness and printed the complete stop/data-retention sequence before exit 0.
- In-app browser: launched `/test-lab` on port `32117` against disposable schema `web_lab_browser_20260824`; inspected DOM, full-page rendering, embedded same-origin frames, 1440×900 layout, 390×844 layout, status text, and console output. The server was stopped, the temporary schema was explicitly dropped, and no QA listener remained.

# TEST RESULTS

- Final full suite: **234 passed, 0 failed, 0 skipped**.
- Final focused UI/viewer suite: **13 passed, 0 failed, 0 skipped**.
- Real focused BCL HTTP test after launcher/port-conflict changes: **1 passed, 0 failed, 0 skipped**.
- Missing configuration: expected failure, exit code 1, no false-ready output.
- Occupied port: expected failure, exit code 1, clear `EADDRINUSE` explanation.
- Self-SIGINT shutdown: expected success, exit code 0, pool/server closure messages, data-retention message.
- Initial full-suite attempt exposed that a browser asset named `test-lab.js` was auto-discovered by Node as a test and failed without a DOM. The asset and helper were renamed outside Node's test discovery pattern; the final full suite passed.
- One intermediate HTTP assertion expected shutdown log delivery after Windows `child.kill()`. Windows terminates that child without reliable signal-log delivery, so the invalid log assertion was removed; bounded process exit remains asserted and a separate in-process SIGINT runtime supplied direct graceful-shutdown evidence.
- Browser layout/result: laptop and narrow layouts rendered without horizontal overflow. The in-app browser harness logged `MutationObserver.observe` errors while instrumenting the iframe page. No repository source uses `MutationObserver`, the errors appeared at harness/reload timestamps, and the app status/frames remained healthy. This is recorded as browser-tool noise; the pass does not claim a perfectly clean raw harness console.
- Physical-device result: untested; no phone-validation claim is made.

# IMPORTANT UNCERTAINTIES

- Whether the owner can complete first-time `.env.test-lab` and PostgreSQL setup without assistance.
- Whether Windows identifies/permits the Node listener on the owner's private network profile.
- Whether the physical phone can reach the primary Wi-Fi candidate when virtual adapters or VPN software are present.
- Whether one long owner session, real media references, and phone decode timing remain stable.
- Whether embedding the full Control Lab is comfortable enough for repeated owner use after authentication; this pass proves operability, not final workstation ergonomics.

# RECOMMENDED NEXT EXPERIMENT

**NOW — current claim → biggest uncertainty → minimum experiment → observable result**

The Web Test Lab is technically launchable and routes real BCL/public state → owner usability and physical same-Wi-Fi reachability remain unvalidated → the owner personally follows `WEB_TEST_LAB.md`, launches with `npm run test-lab`, signs in and operates one Library item on the laptop, then opens the displayed receiver URL/QR on one physical phone → laptop preview and phone converge through OFF AIR → ON AIR → OFF AIR, and Ctrl+C stops the server while the Library persists for the next launch.

Do not begin Media Bin, LOOP, Packaging Editor, Program Packs, or hosting work until this smallest owner rehearsal identifies the next actual friction.

# FILES MODIFIED

- `.env.test-lab.example` — placeholder local settings template.
- `.gitignore` — permits tracking the Test Lab example while keeping real Test Lab settings ignored.
- `README.md` — current Broadcast reality, routes, and owner Test Lab entry point.
- `docs/broadcast-control-lab/README.md` — corrected Task Packet 01 commit reality and linked the owner guide.
- `docs/broadcast-control-lab/WEB_TEST_LAB.md` — novice setup, launch, operation, phone, persistence, shutdown, troubleshooting, and acceptance guide.
- `docs/pass-reports/2026-08-24_2312_first-broadcast-packager-web-test-lab.md` — this audit report.
- `docs/pass-reports/README.md` — chronological report index entry.
- `package.json` — canonical `test-lab` script.
- `public/test-lab.css` — responsive lab-shell presentation.
- `public/test-lab.html` — owner hub structure and real iframe surfaces.
- `public/web-test-lab.js` — public status/URL/QR rendering and bounded refresh/reload/copy behavior.
- `scripts/start-test-lab.js` — settings loader and owner preflight wrapper around the existing server.
- `server.js` — Test Lab mode/routes, host/port validation, readiness output, and graceful shutdown.
- `test/broadcast-control-lab-http.test.js` — real launcher/status/QR/port-conflict/secrecy/termination coverage while retaining BCL causal regression.
- `test/web-test-lab.test.js` — configuration, LAN, startup-copy, hub-boundary, rendering, no-LAN, and error behavior coverage.
- `web-test-lab-config.js` — shared Test Lab configuration, network, URL, redaction, and output helpers.

# COMMIT STATUS

NOT COMMITTED
