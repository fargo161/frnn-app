# 1. PASS

- Pass/task name: Broadcast packaging/media and QR-mission integration brainstorm
- Objective: Determine whether FRNN can build the Broadcast Packager, media, and Broadcast domains first while retaining a safe later integration path to the QR mission system, and recommend a bounded agent-team sequence without implementation.
- Branch: `main`
- Baseline: `869e5baefcae5bf1456805b8735017ac40dc13d0`

# 2. CURRENT REALITY BEFORE PASS

- **IMPLEMENTED and TESTED in part:** the QR mission system owns durable player identity, scans/routes, visits, reflective responses, final completion, Escape assignment behavior, and player-facing media roles.
- **IMPLEMENTED and TESTED in part:** Broadcast v0.1 owns a global clock anchor, flat looping Program list, public state, receiver, and fixed three-row Packager.
- **DESIGNED and LOCKED:** the Broadcast Control Lab introduces stable media assets, reusable Program Units, Programs/Transitions, packaged library, explicit queue, active snapshot, isolated preview, and shared rendering.
- **NOT IMPLEMENTED:** there is no Program Unit schema or shared media-composition renderer that the mission system could reference.
- The Broadcast and mission systems currently meet only in shared repository/server/UI infrastructure; they do not share domain state or media definitions.

# 3. WHAT CHANGED

- No application code, schema, migration, API, UI, test, or runtime behavior changed.
- Established a proposed integration boundary:
  - shared presentation ingredients may include stable media assets and, after testing, reusable Program Unit/composition recipes;
  - Broadcast retains ownership of Programs, Transitions, library, queue, active snapshot, Master Clock, LOOP, ticker, and override;
  - the QR mission system retains ownership of access codes, player identity, QR routing, four Functions of Behavior, assignments, visits, responses, completion, and player-specific gating;
  - later integration occurs through explicit references and commands/events, not cross-domain table writes.
- Proposed a staged agent-team plan and one later QR/Broadcast integration experiment.

# 4. WHAT IS REAL NOW

- The proposed boundary is **DESIGNED in this brainstorm only** and is not an approved task packet or implementation.
- Existing QR and Broadcast behavior remains unchanged.
- Program Units cannot currently be shared because they do not exist in source.

# 5. WHAT IS STILL MISSING

- Owner approval of the proposed shared boundary.
- Library/queue/active-snapshot implementation.
- Stable media asset registry and availability rules.
- Minimal Program Unit recipe and shared renderer.
- A safe player-facing projection of a Unit recipe.
- A mission-to-Broadcast integration command/event contract, idempotency, audit, privacy rules, and authority policy.
- Behavioral evidence that one recipe can render correctly in preview, Broadcast, and mission contexts without sharing runtime authority.

# 6. WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

- “Shared Program Units” is a proposed seam, not current behavior.
- Proposed domain events/commands and trigger mappings do not exist.
- Suggested agent partitions and packet sequence are planning guidance only.
- No claim is made that current mission media roles or Broadcast rows are already compatible with Program Units.

# 7. TESTING PERFORMED

## Structural checks

- Reconfirmed current HEAD, branch, and dirty-worktree state.
- Relied on the immediately preceding exhaustive Broadcast audit and current-source inspection; no source was reinterpreted as changed.

## Behavioral checks

- None. This was a design-only brainstorm.

# 8. TEST RESULTS

- No tests were run and no runtime claim changed.
- Existing Broadcast and mission test evidence remains bounded as recorded in prior reports.

# 9. IMPORTANT UNCERTAINTIES

- Whether the locked Broadcast Program Unit is sufficiently presentation-focused to be reused by a mission surface without importing Broadcast-only boundary/bed semantics.
- Whether a smaller shared composition recipe should eventually be extracted beneath Program Units; this should not be generalized before one real cross-context rendering experiment.
- Whether mission-triggered Broadcast actions require operator confirmation, automatic policy, or both.
- How repeated scans, concurrent players, and retries become idempotent without exposing player identity on the public channel.
- Whether changing a shared Unit should affect future mission presentations immediately or use explicit versions/snapshots.
- Whether broader Normal/Breaking/Emergency and approval/account design must be resolved before mission-triggered channel actions.

# 10. RECOMMENDED NEXT EXPERIMENT

- **NOW:** implement Broadcast as an independent domain in packets: (1) library/queue/active snapshot; (2) stable media registry; (3) minimal Program Unit plus shared preview/live renderer; (4) dedicated Control Lab/Packaging Editor; (5) Broadcast stabilization.
- **Boundary rule:** share asset IDs and tested presentation recipes, not scheduling, player state, mission completion, or authority.
- **NEXT integration experiment:** after Units are real, let one existing mission media role reference one fixed Program Unit for presentation only. Render it locally from zero in the player surface while the Broadcast continues independently. Verify that mission completion remains server-rule-driven and that Unit playback cannot mutate visits, responses, queue, or Master Clock.
- **Later trigger experiment:** map one authoritative, idempotent mission-completion event to an authenticated `add packaged item to queue` command. The mapping—not the Unit—owns the trigger. Verify one completion produces at most one queue entry, NOW remains unchanged, no player code/name reaches public state, and retries are harmless.
- **PARK:** one universal “content object” owning mission logic and Broadcast timing, direct QR writes into Broadcast tables, Program Units containing player/access-code/Function fields, and broad event-bus infrastructure before a single integration proves need.

# 11. FILES MODIFIED

- `docs/pass-reports/2026-08-24_1708_broadcast-qr-integration-brainstorm.md`
- `docs/pass-reports/README.md`

# 12. COMMIT STATUS

`INCLUDED IN THIS COMMIT`
