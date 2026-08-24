# PASS

- Task: run the recommended Broadcast Control Lab two-receiver restart/boundary experiment from the Task Packet 01 implementation report.
- Objective: observe `v1 active → application restart → same v1 → natural boundary → v2 → queue exhaustion OFF AIR` in two independent public receiver tabs without changing database time.
- Branch: `main`.
- Baseline/current `HEAD`: `858afd24d38cb0f8f35bf0c815211abe44b16c3a`.
- Environment: local FRNN server on port 31993 using only the ignored `TEST_DATABASE_URL`, scoped to temporary schema `bcl_rehearsal_20260824` in the labeled disposable PostgreSQL container.
- Commit: no commit requested or created.

# CURRENT REALITY BEFORE PASS

- **IMPLEMENTED:** Task Packet 01 source separates reusable Library, reference Queue, immutable Active Run, and the public Broadcast projection.
- **TESTED:** disposable PostgreSQL, service, concurrency, spawned HTTP server, VM client, and single browser QA had passed.
- **VALIDATED:** the v1/v2 state-separation assumption had narrow local automated evidence.
- **MISSING:** no direct observation yet showed two receiver clients retaining v1 through an actual application-process restart, naturally crossing into v2, and naturally exhausting OFF AIR.
- **PROVISIONAL:** prior browser QA used one producer tab and did not rehearse a natural multi-client boundary sequence.

# WHAT CHANGED

- No implementation, schema, task packet, UI, API, or test source changed.
- Created one temporary database schema and started the existing application against it.
- Through the real Control Lab UI, created a v1 reusable test-card definition, queued it twice, started v1, and edited the reusable definition to v2 while v1 remained active.
- Opened two independent `/broadcast` receiver tabs.
- Stopped and restarted the Node application against the same schema before the v1 boundary.
- Observed both receivers after restart, across the natural database-clock v1→v2 boundary, and through natural v2 exhaustion to OFF AIR.
- Read the final persisted audit trail, then stopped the server, closed all three tabs, dropped only the rehearsal schema, and confirmed no temporary user schemas remained.

# WHAT IS REAL NOW

## IMPLEMENTED

- Implementation reality is unchanged from Task Packet 01. No new feature was added.

## TESTED

- The real Mission Control session and `/control-lab` UI created, queued, started, and edited the definition.
- Two public receiver tabs independently polled the real HTTP API and rendered the real viewer.
- The application process was actually terminated and restarted against the same PostgreSQL schema.
- Natural boundary advancement used database time; no test changed `started_at` or advanced the database clock artificially.

## VALIDATED

- **Stronger local validation:** both receiver tabs displayed the same active v1 after the process restart while the reusable Library already contained v2.
- Both receivers then converged on one v2 activation with the same public Program number/title and the same authoritative boundary.
- Both receivers finally converged OFF AIR after queue exhaustion.
- Persisted audits recorded one boundary transition for each run and exact prior-end start arithmetic.

# WHAT IS STILL MISSING

- This was not an isolated staging deployment.
- The two receivers were independent tabs in one in-app browser, not two physical devices or separate browser processes.
- Playback used real FRNN test-card rendering, not image/video media with decode, buffering, seeking, or audio behavior.
- Venue networking, production connection pooling, long-running load, operator training, and deployment migration remain unvalidated.
- No next BCL module was implemented or activated.

# WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

- Test-card content was intentionally authored test content, not production media.
- The temporary schema and local server were disposable rehearsal infrastructure.
- Independent tabs provide stronger client-convergence evidence than one tab, but they do not simulate independent device clocks, networks, decoding stacks, or hardware.
- `loop_eligible` remained inert; the observed final state was the Task 01 LOOP-OFF equivalent, OFF AIR.

# TESTING PERFORMED

- Verified container state before setup: running, healthy, label `frnn.purpose=disposable-integration-tests`, restart policy `no`, and tmpfs PostgreSQL storage.
- Verified `TEST_DATABASE_URL` targeted localhost and database `frnn_integration_test` without printing its value.
- Created only schema `bcl_rehearsal_20260824`.
- Started `server.js` with `NODE_ENV=test`, no `DATABASE_URL`, and the schema-scoped `TEST_DATABASE_URL`.
- Browser sequence:
  1. authenticate through Mission Control;
  2. create one reusable PROGRAM/test-card v1;
  3. add two queue references;
  4. Start v1;
  5. edit the reusable source to v2;
  6. observe v1 in two receivers;
  7. restart the server process;
  8. observe the same persisted v1 in both receivers;
  9. wait for the natural v1 boundary and observe v2 in both receivers;
  10. wait for natural v2 completion and observe OFF AIR in both receivers.
- Queried final Library, active singleton, queue count, and `BROADCAST_%` audit records read-only.
- Checked producer and both receiver browser consoles for warnings/errors.
- Dropped only `bcl_rehearsal_20260824`; final query returned `remaining_user_schemas=[]`.

# TEST RESULTS

- First timing attempt used v1=30 seconds and v2=8 seconds. The server restarted, but both runs naturally completed before the post-restart observation was captured. Both receivers correctly showed OFF AIR. This attempt was **not counted** as proof of the intended visible restart→v1→v2 sequence.
- Successful controlled attempt used v1=90 seconds and v2=15 seconds.
- Before edit: active run `3`, definition `v1`, start `2026-08-24T23:29:14.701Z`, duration 90000 ms.
- After reusable edit: Control Lab still showed byte-identical run `3`/v1/start/duration; Library showed v2 with duration 15000 ms.
- Before restart: both receivers showed `Long v1`, Program 1, with the same next item.
- After restart: both receivers still showed `Long v1`; Control Lab still showed run `3`, v1, and the original start.
- Natural boundary: audit recorded run `3` → run `4` at exactly `2026-08-24T23:30:44.701Z`, 90000 ms after the v1 start.
- Both receivers showed `Long v2`, Program 2, elapsed 00:00, remaining 00:14, and no next item.
- Exhaustion: audit recorded run `4` → OFF AIR at exactly `2026-08-24T23:30:59.701Z`, 15000 ms after the v2 start.
- Final authoritative state: active run null, queue count 0, Library retained v2.
- Browser console results: producer 0 warnings/errors; receiver one 0; receiver two 0.
- Cleanup: passed; no temporary schemas remained.
- Automated suite was not rerun because this pass changed no implementation or test source.

# IMPORTANT UNCERTAINTIES

- Tabs in one browser may share process scheduling and network conditions, so this does not prove cross-device synchronization.
- Test cards do not exercise real media decoding or late video seeking through restart/boundary transitions.
- Localhost removes venue latency, intermittent connectivity, TLS/proxy behavior, and production hosting constraints.
- One operator and two receivers do not establish load capacity for sustained polling or multiple simultaneous producers.

# RECOMMENDED NEXT EXPERIMENT

**Do not start automatically.**

- **Current claim:** Task 01 now survives a real local process restart and natural database-clock boundaries while two receiver tabs converge on v1, v2, and OFF AIR.
- **Biggest uncertainty:** whether independent physical devices with real image/video media converge under staging/venue network conditions.
- **Minimum experiment:** deploy the existing Task 01 worktree to an isolated staging instance, use one short muted video or image-backed v1 definition queued twice, edit to v2, restart the application before the boundary, and observe two physical receiver devices through v1→v2→OFF AIR while recording API run IDs/timestamps and visible playback.
- **Observable result:** both devices retain v1 through restart, switch once to the same run/version/start at the boundary, render/seek the real media acceptably, and become OFF AIR together without duplicate consumption.

# FILES MODIFIED

- `docs/pass-reports/2026-08-24_1932_bcl-two-receiver-restart-rehearsal.md` — created.
- `docs/pass-reports/README.md` — chronological index entry added.
- No implementation, migration, UI, API, test, task-packet, dependency, or configuration file changed.

# COMMIT STATUS

NOT COMMITTED
