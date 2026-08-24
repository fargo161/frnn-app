---
document_id: BCL-DIRECTOR-CONTEXT-001
title: FRNN Broadcast Control Lab — Director Agent Context Guide
project: FRNN
status: ACTIVE_HANDOFF
locked_design_rounds: 1-9
last_repo_observation:
  repository: fargo161/frnn-app
  branch: main
  observed_head: 869e5baefcae5bf1456805b8735017ac40dc13d0
  observed_at: 2026-08-24
narrative: FRNN_BROADCAST_CONTROL_LAB_DESIGN_NARRATIVE_LINER_NOTES.md
design_registry: FRNN_BROADCAST_CONTROL_LAB_MODULAR_COMBINATORIAL_DESIGN.md
trace_guide: FRNN_BROADCAST_CONTROL_LAB_TRACE_SYSTEM_GUIDE.md
---

# FRNN Broadcast Control Lab  
## Director Agent Context Guide

This is the fastest operational handoff for an incoming FRNN Director.

It does **not** authorize implementation by itself.

It tells the Director:

- what the owner has locked;
- what was last observed in `frnn-app`;
- what must be re-inspected;
- which concepts are easy to confuse;
- which invariants may not be violated;
- how to divide agent work;
- what evidence is required before stronger claims.

---

# 1. Five-Minute Brief

## Project purpose

Build a desktop **Broadcast Control Lab** that lets the owner operate and test one authoritative FRNN channel while simultaneously packaging future programming.

The workstation has three visible regions:

```text
LEFT
Producer Console

RIGHT TOP — SCREEN 1
Live Broadcast

RIGHT BOTTOM — SCREEN 2
Packaging Editor
```

The separate Broadcast-only receiver remains usable on other machines and phones.

## Locked design status

Design Flow Rounds 1–9 are explicitly **LOCKED**.

That means the intended behavior is authoritative.

It does **not** mean the repository implements it.

## Core causal loop

```text
offsite media assets
→ Program Unit recipes
→ Programs / Transitions
→ Packaged Programming Library
→ explicit queue
→ Master Clock + active snapshot
→ shared renderer
→ Control Lab Live Screen + remote Broadcast viewer
```

When the explicit queue is empty:

```text
LOOP OFF
→ OFF AIR
```

```text
LOOP ON + eligible packaged items
→ one authoritative random selection
```

## Most important safety rule

```text
ordinary changes affect future state
```

They do not interrupt or rewrite NOW.

Only:

```text
STOP
confirmed Breaking Override
```

may intentionally interrupt the current active snapshot.

## Most important source/design warning

The currently observed Broadcast implementation is much smaller than the locked design:

```text
current experimental source
≈ one ordered Program queue
+ one clock anchor
+ modulo queue wrap
+ fixed three-row Packager
+ public receiver
```

The locked design adds separate library, queue, active snapshot, Units, packaging, ticker, override, beds, Program Packs, and two actual screens.

Do not confuse names already present in source with completion of those mechanics.

---

# 2. Required Reading Order

## First pass — 15 minutes

1. Read this guide.
2. Read the Modular Design:
   - System Causal Spine;
   - Invariant Register;
   - Scope Classification;
   - Unresolved Register.
3. Read the Narrative:
   - Prologue;
   - R5 two-screen correction;
   - R6 media shift;
   - Epilogue.
4. Use the Trace Guide only when a decision needs historical explanation.

## Before assigning work

Read detailed concepts for:

```text
BCL.SURFACE.CONTROL_LAB
BCL.SURFACE.PACKAGING_EDITOR
BCL.PKG.LIBRARY
BCL.PKG.PROGRAM
BCL.PKG.UNIT
BCL.RUNTIME.QUEUE
BCL.RUNTIME.MASTER_CLOCK
BCL.RUNTIME.ACTIVE_SNAPSHOT
BCL.RUNTIME.LOOP
BCL.RUNTIME.RANDOM_FALLBACK
BCL.TICKER.EMERGENCY
BCL.OVERRIDE.BREAKING
BCL.AUDIO.BROADCAST_BED
BCL.PORTABLE.PROGRAM_PACK
```

---

# 3. Last Observed Repository Reality

## Observation boundary

The last repository check observed:

```text
repository: fargo161/frnn-app
branch: main
HEAD: 869e5baefcae5bf1456805b8735017ac40dc13d0
message: Add authenticated Escape assignment mutations
```

This is a **historical observation**, not permission to assume current HEAD is unchanged.

Run a fresh inspection.

## What was observed as real in the Broadcast foundation

### IMPLEMENTED / EXPERIMENTAL — reverify

- `broadcast.js`;
- PostgreSQL-backed `broadcast_programs`;
- singleton `broadcast_clock.started_at`;
- server-authoritative current Program/elapsed/remaining;
- public `/api/broadcast`;
- `/broadcast` viewer;
- late-join video seeking;
- NOW/NEXT display;
- start/stop endpoints;
- visible OFF AIR representation;
- Mission Control Packager section.

### Current Broadcast model observed

`broadcast.js` still modeled one Program row as approximately:

```text
id
title
program_type
media_ref
duration_ms
queue_position
```

Observed playback types:

```text
test_card
image
video
```

There was no separate persisted semantic kind:

```text
PROGRAM
TRANSITION
```

### Current LOOP conflict observed

The resolver still used mathematical modulo:

```text
totalElapsed % totalDuration
```

That means the current implementation automatically wraps the existing queue.

This directly conflicts with locked design:

```text
LOOP OFF → OFF AIR
LOOP ON  → authoritative eligible random fallback
```

Do not preserve modulo wrapping merely because it is already implemented.

Do not remove it casually without first establishing replacement state and behavioral tests.

### Current live-edit boundary observed

`replaceBroadcastPrograms()` still rejected changes while the clock was running:

```text
BROADCAST_RUNNING_EDIT_FORBIDDEN
```

Locked design requires a future-safe mutation model:

```text
NOW immutable
UPCOMING editable
```

The current guard is real protection. Replace it with a stronger model; do not simply delete it.

### Current Packager limitation observed

`public/admin.html` still described:

```text
Define the three v0.1 Programs while off air
```

and rendered:

```js
for (let index = 0; index < 3; index += 1)
```

This is a fixed three-row queue editor, not the locked Packaged Programming Library or Packaging Editor.

### Current public receiver observed

The receiver historically:

- polls authoritative state;
- estimates elapsed time between polls;
- seeks video to current offset;
- refreshes at boundaries;
- shows media/connection degradation.

This is a useful foundation.

Preserve or extract its good behavior rather than building an unrelated second live renderer.

## Non-Broadcast repository movement

After the earlier Broadcast preflight, several node-assignment passes landed.

The last observed commit added authenticated Escape assignment mutations and modified at least:

- `server.js`;
- `node-assignments.js`;
- tests and pass reports.

Earlier passes also integrated Escape assignment resolution and rendering.

These changes are not part of the Broadcast Control Lab design, but they increase **shared-file collision risk**, especially in `server.js`.

Do not run broad Broadcast and assignment-agent rewrites of `server.js` concurrently.

---

# 4. Locked Architecture at a Glance

## Surfaces

```text
CONTROL LAB — desktop producer application

LEFT:
Producer Console

RIGHT TOP:
Live Broadcast Screen

RIGHT BOTTOM:
Packaging Editor Screen
```

Separate:

```text
/broadcast
lightweight cross-device receiver
```

## Producer Console

Contains:

- compact NOW/NEXT/mode;
- START;
- STOP;
- LOOP ON/OFF;
- Packaged Programming Library;
- Upcoming Queue;
- explicit ADD TO QUEUE;
- upcoming reorder/remove;
- import/export entry;
- one active Control Module set;
- Ticker module first;
- visually protected Breaking Override.

## Packaging Editor

Contains:

- Program overview;
- ordered Units;
- selected Unit editor;
- new/existing Unit addition;
- shared-Unit edit guard;
- Media Bin selectors;
- trim scrubber + exact fields;
- audio layer cards;
- audio/video source mapping;
- Graphics v1 Packaging Module;
- subtitles;
- Unit boundary selection;
- Unit Preview;
- Program Preview;
- explicit SAVE/REVERT;
- bounded UNDO;
- dirty-state prompt;
- live status strip.

## Packaging objects

```text
Media Asset
→ Program Unit
→ Program / Transition
→ Library
→ Queue
```

`PROGRAM`/`TRANSITION` semantic kind must remain separate from playback/media type.

## Program Units

Target roughly five minutes or less, with bounded exceptions.

A Unit supports:

```text
0..1 video
1 primary audio
0..N secondary audio layers
trims/offsets/volume
subtitles
Graphics v1 recipe
bed relationship
boundary mode
```

Media remains offsite. Units contain stable references and recipes.

## Runtime

Separate:

```text
library
queue
active snapshot
random pool
```

Never collapse these into one table merely because the current experimental schema does.

## Live layers

Separate from queue scheduling:

- normal ticker;
- emergency ticker;
- Program Bed;
- Broadcast Bed;
- Off-Air Bed;
- subtitles;
- graphics.

A field matters only if it changes public output or runtime behavior.

---

# 5. Non-Negotiable Invariants

1. **One authoritative Master Clock.**
2. **Library ≠ Queue ≠ Active Snapshot.**
3. **PROGRAM/TRANSITION kind ≠ media playback type.**
4. **Ordinary controls do not interrupt NOW.**
5. **Only STOP and confirmed Breaking Override interrupt NOW.**
6. **Viewer clients never choose random fallback.**
7. **LOOP never means restart queue item one.**
8. **Empty queue + LOOP OFF = OFF AIR.**
9. **Empty queue + LOOP ON + empty eligible pool = OFF AIR.**
10. **Random fallback uses packaged eligible objects, not raw media.**
11. **Preview never changes live state.**
12. **Current on-air definition is a stable snapshot.**
13. **Ticker changes do not restart Program playback.**
14. **Bed changes do not restart Program playback.**
15. **Emergency Ticker may override normal ticker but not the Program.**
16. **Breaking Override is confirmed, non-nesting, recoverable, and audited.**
17. **A Unit has no more than one video source in v1.**
18. **Audio/media quality tradeoffs prioritize reliable audio.**
19. **Unavailable required media is blocked before airtime.**
20. **Program Packs contain recipes/references, not media binaries.**
21. **The public viewer does not require a persistent elapsed-time display.**
22. **Locked design is not proof of implementation.**

Any task packet violating one of these must stop and request an explicit design supersession.

---

# 6. High-Risk Concept Collapses

These are likely implementation mistakes.

## Mistake: Program row = packaged object = queue entry

Correct separation:

```text
Packaged object
persistent definition

Queue entry
ordered reference / future scheduling state

Active snapshot
current immutable run
```

## Mistake: `program_type` stores PROGRAM/TRANSITION

Current `program_type` means media playback type.

Locked design needs a separate semantic kind.

## Mistake: random choice in browser

Random fallback must be chosen once by authoritative runtime state.

## Mistake: Packaging Preview reuses live state

The composition engine may be shared.

State authority must not be shared.

## Mistake: Ticker implemented as a Program

Ticker is an independent channel overlay.

## Mistake: Broadcast Bed implemented as Unit audio

Broadcast Bed is channel scope and may span Programs.

## Mistake: Emergency is a third content kind

Emergency is a scheduling/authority action applied to valid packaged content.

## Mistake: module card with no downstream behavior

A module exists only when:

```text
operator action
→ authoritative state
→ rule
→ observable output
```

---

# 7. Recommended Implementation Strategy

This is a **recommended staging plan**, not a new owner design decision.

Do not attempt all locked mechanics in one uncontrolled pass.

## Phase 0 — Read-only reconciliation

Objective:

```text
locked design
vs
current source
```

Required output:

- exact HEAD;
- clean/dirty state;
- current Broadcast tables/migrations;
- current API routes;
- current viewer renderer;
- current admin Packager;
- current tests;
- file collision map;
- reality classification.

Do not implement during this phase.

## Phase 1 — Two-screen shell + shared renderer extraction

Biggest uncertainty reduced:

> Can the owner use a desktop Control Lab with an actual Live Screen and persistent Packaging Editor while preserving the existing receiver?

Minimum behavior:

- new Control Lab route;
- left producer shell;
- right Live Screen using shared renderer;
- right Packaging Editor placeholder with selected-state contract;
- remote `/broadcast` still works;
- no new media model yet;
- no fake controls.

This proves the interface boundary before deeper data migration.

## Phase 2 — Separate library, queue, active snapshot

Biggest uncertainty reduced:

> Can future definitions change while NOW remains stable?

Minimum behavior:

- semantic Program/Transition kind;
- persistent packaged library;
- explicit queue references;
- active snapshot;
- add/remove/reorder upcoming;
- current item protection;
- behavioral tests.

Do not add random fallback until these layers are real.

## Phase 3 — Minimal Program Unit vertical slice

Use one deliberately small fixture:

```text
Program
├── Unit A
└── Unit B
```

Each Unit may initially use:

- one video/test card;
- one primary audio track;
- simple duration/trim;
- one boundary mode.

Prove:

- Program clock spans Units;
- preview is isolated;
- live and preview share composition behavior;
- second viewer joins correct Unit/offset.

This is the key media-architecture experiment.

## Phase 4 — Ticker as first Control Module

Implement:

- persisted normal messages;
- order/enabled state;
- global ON/OFF;
- continuous `//` crawl;
- management route;
- emergency ticker;
- no Program restart.

This proves the live module architecture.

## Phase 5 — Queue exhaustion

Only after queue/active state is stable:

- LOOP OFF → OFF AIR;
- LOOP ON → authoritative eligible random selection;
- no immediate repeat where possible;
- explicit queue retakes priority at boundary.

## Phase 6 — Breaking Override

Only after active snapshot/queue recovery is reliable:

- existing or quick content;
- review/confirm;
- front-requeue interrupted item;
- immediate authoritative start;
- no nesting;
- recovery on failure;
- audit.

## Phase 7 — Richer packaging

Add incrementally:

- secondary audio layers;
- timecode mapping;
- Graphics v1;
- subtitles;
- Program/ Broadcast Beds;
- Program Packs/import preview.

Every addition must answer a separate uncertainty.

---

# 8. Agent Team Partition

Use the smallest team consistent with clear ownership.

## Director / Integration Lead

Owns:

- baseline;
- file map;
- schema contracts;
- sequencing;
- merges;
- full causal verification;
- reality report.

Does not delegate final integration truth.

## Runtime Agent

Owns:

- `broadcast.js` or replacement focused runtime modules;
- clock;
- queue resolver;
- active snapshot;
- boundaries;
- LOOP/OFF AIR/random;
- override state.

Must not build producer UI.

## Persistence / Model Agent

Owns:

- migrations;
- packaged library;
- queue references;
- Unit/Program definitions;
- ticker state;
- stable asset registry contracts.

Must coordinate schema before runtime/UI agents begin.

## Renderer / Playback Agent

Owns:

- shared Unit/Program renderer;
- late join;
- A/B decks;
- subtitles;
- graphics output;
- audio composition experiments.

Must not invent authoritative scheduling.

## Control Lab UI Agent

Owns:

- desktop shell;
- producer console;
- Live Screen placement;
- Packaging Editor placement;
- ordinary controls and visible restrictions.

Must reuse renderer contract.

## Packaging Editor Agent

Owns:

- Program/Unit authoring;
- Media Bin selection;
- trim/audio/graphics/subtitle forms;
- preview isolation;
- save/undo/dirty state.

Must not mutate live state.

## Ticker Agent

Owns:

- ticker DB;
- public projection;
- Ticker Control Module;
- management route;
- emergency ticker.

Must prove media continuity through ticker changes.

## Verification / Stabilization Agent

Owns behavioral evidence across subsystem boundaries.

Must vary one meaningful input and verify the downstream difference.

---

# 9. File Ownership and Collision Control

## Likely shared files

- `server.js`;
- `broadcast.js`;
- `schema.sql`;
- numbered migrations;
- `public/admin.html`;
- `public/broadcast.html`;
- global CSS;
- Broadcast tests.

## Director rule

Before parallel work:

```text
list candidate files
→ assign one primary owner per large shared file
→ define interfaces
→ sequence dependent changes
```

Prefer new focused modules:

```text
broadcast-runtime.js
program-library.js
program-units.js
ticker.js
broadcast-renderer.js
```

over several agents independently expanding `server.js`.

Do not refactor merely for aesthetics. Create a module when it reduces a real collision or clarifies a causal boundary.

## Current extra collision risk

Recent Escape assignment work uses `server.js`.

Pause or sequence any next assignment UI/server pass before a broad Broadcast server integration.

---

# 10. Reality Audit Checklist

Before producing a task packet, answer:

## Repository

- What is exact HEAD?
- Is the worktree clean?
- Are there unpushed/local changes?
- Which branch is authoritative?
- Are there active PRs or agent branches?

## Broadcast runtime

- Which functions calculate current state?
- Which persistence rows anchor the clock?
- How does empty queue behave now?
- Where is modulo wrapping encoded?
- Which route publishes public state?
- What state survives restart?

## Producer surface

- Where are the three rows hard-coded?
- Which endpoint saves them?
- Is queue state also acting as library state?
- Which controls require Mission Control auth?

## Viewer

- Which logic seeks late?
- What renderer code can be extracted/shared?
- How are media failures shown?
- Does the receiver remain phone-usable?

## Tests

- Which tests prove clock behavior?
- Which prove browser/client behavior?
- Which are structural only?
- Is PostgreSQL used in behavioral tests?
- Which current behaviors will intentionally change?

## Shared-file risk

- What recent non-Broadcast work touched `server.js` or admin?
- Can routes be isolated in new modules?
- Which task must land first?

---

# 11. Minimum Behavioral Evidence

Do not claim the Control Lab works because routes and tables exist.

## Clock

```text
same Program start
+ later server time
→ later correct offset
```

## Cross-client

```text
client A open
client B opens later
→ same Program/Unit
→ approximately same offset
```

## Active snapshot

```text
edit future definition
→ NOW unchanged
→ later use reflects edit
```

## Queue

```text
reorder upcoming
→ NEXT/LATER change
→ NOW ID/start unchanged
```

## Multi-Unit Program

```text
Unit A → boundary → Unit B
→ one Program identity
→ correct Program elapsed
```

## Preview isolation

```text
run Program Preview
→ live state/clock unchanged
```

## Ticker

```text
edit/toggle ticker
→ overlay changes on both viewers
→ media does not restart
```

## LOOP

```text
empty queue + off
→ OFF AIR
```

```text
empty queue + on + deterministic selector
→ one recorded eligible item
→ both clients agree
```

## Override

```text
confirm
→ current interrupted
→ old item front-queued
→ override NOW
→ completion restores queue
```

## Import

```text
select Pack with conflict
→ preview only
→ no mutation until confirm
```

---

# 12. Required Failure Visibility

Never silently substitute fake behavior.

Visible states are required for:

- empty queue;
- LOOP ON with empty eligible pool;
- missing Program/Unit;
- unavailable asset;
- invalid duration;
- invalid package recipe;
- clock state missing/corrupt;
- public-state fetch failure;
- autoplay blocked;
- audio layer failure;
- Unit preload failure;
- ticker fetch failure;
- emergency ticker with invalid text;
- override media failure;
- import conflict/version mismatch;
- unsafe attempt to mutate NOW.

---

# 13. Stop Conditions

Stop and request owner input when:

1. implementation requires changing a locked owner decision;
2. two viable data models create materially different owner workflows;
3. a later feature must be pulled into NOW to make a weak design seem complete;
4. current source contradicts the last reality audit;
5. a test disproves seamlessness, mixing, or synchronization assumptions;
6. Program Pack schema would prematurely freeze an untested module recipe;
7. an agent proposes client-local random choice or local-only ticker state;
8. a task would silently alter player/QR/Functional-node systems;
9. file collision makes causal attribution unclear;
10. acceptance requires a real device/deployment test the agents have not performed.

---

# 14. How to Use the Documentation Set

## Need the final current rule?

Open the Modular Design and search the `BCL.*` concept.

## Need to understand why?

Follow `source_liner_notes` into the Narrative.

## Need to know whether it is implemented?

Ignore the lock status and inspect:

```text
reality
current source
runtime
tests
```

Then update the reality report.

## Need to find affected concepts?

Use the trace script:

```bash
node trace-tools.mjs   FRNN_BROADCAST_CONTROL_LAB_DESIGN_NARRATIVE_LINER_NOTES.md   FRNN_BROADCAST_CONTROL_LAB_MODULAR_COMBINATORIAL_DESIGN.md   impact BCL.PKG.UNIT
```

## Need a quick operational summary?

Use this Director guide, then verify everything against current HEAD.

---

# 15. Director Task-Packet Template

Every agent task should contain:

## OBJECTIVE

One primary uncertainty or causal capability.

## CURRENT REALITY

Exact files, functions, routes, tables, tests, and observed limitations.

## REQUIRED CHANGES

Bounded changes only.

## INVARIANTS

Relevant `INV-*` and `BCL.*` concepts.

## OUT OF SCOPE

Prevent adjacent expansion.

## ACCEPTANCE CRITERIA

Observable behavior.

## BEHAVIORAL TESTS

State transition and user-facing consequence.

## FILE OWNERSHIP

Primary files and forbidden overlap.

## IMPLEMENTATION REPORT

- files changed;
- behavior implemented;
- commands run;
- pass/fail/skip;
- assumptions;
- unverified claims;
- reality-state updates;
- next uncertainty.

---

# 16. Director Completion Report

At the end of any implementation endeavor, report:

# WHAT WAS REAL BEFORE

Use exact source evidence.

# WHAT CHANGED

Trace operator action to visible result.

# WHAT IS REAL NOW

Classify each relevant concept:

```text
SPECULATIVE
DESIGNED
IMPLEMENTED
TESTED
VALIDATED
```

# WHAT IS MISSING

Do not hide deferred dependencies.

# WHAT IS PROVISIONAL / FAKE

Call out:

- fixtures;
- hard-coded test media;
- fake-DOM tests;
- local-only state;
- untested browser mixing;
- untested deployment behavior.

# TEST EVIDENCE

Commands and behavioral meaning.

# OWNER MANUAL TEST

Exact routes and steps.

# BIGGEST REMAINING UNCERTAINTY

One sentence.

# NEXT EXPERIMENT

Smallest experiment that resolves it.

Do not begin automatically.

---

# 17. Immediate Director Boot Sequence

```text
1. Confirm repository and branch.
2. Record exact HEAD.
3. Confirm clean/dirty worktree.
4. Read latest pass reports.
5. Inspect broadcast.js, migrations, server routes, admin Packager, broadcast viewer.
6. Run focused Broadcast tests.
7. Run full suite with disposable PostgreSQL if supported.
8. Compare source against BCL concepts.
9. Publish read-only reality audit.
10. Propose one vertical implementation packet.
11. Wait for explicit authorization before implementation.
```

---

# 18. Strongest Honest Starting Claim

A Director may begin with:

> FRNN currently appears to have an experimental PostgreSQL-authoritative Broadcast clock and remote receiver, plus a fixed three-row Mission Control Packager. The richer Broadcast Control Lab described by locked Rounds 1–9 is designed but remains largely unimplemented and unvalidated. Current HEAD and behavior must be re-inspected before task assignment.

Do not begin with:

> The Broadcast Control Lab is fully implemented.

Do not end with that claim unless actual runtime and owner/device evidence supports it.

---

# 19. Next Handoff Boundary

These four documents complete the requested context system.

They do **not** compile the final Codex implementation prompt.

The next valid action, only when explicitly requested, is:

```text
compile Codex / Director implementation prompt
from locked Rounds 1–9
using current repository reality
and a bounded vertical implementation strategy
```

The compiled prompt should cite concept IDs and invariants rather than reproducing the entire narrative.
