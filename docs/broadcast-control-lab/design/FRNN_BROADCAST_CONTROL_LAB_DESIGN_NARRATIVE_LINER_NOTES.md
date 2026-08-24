---
document_id: BCL-NARRATIVE-001
title: FRNN Broadcast Control Lab — Design Narrative & Liner Notes
project: FRNN
status: LOCKED_DESIGN_HISTORY
locked_rounds: 1-9
companion_design: FRNN_BROADCAST_CONTROL_LAB_MODULAR_COMBINATORIAL_DESIGN.md
companion_guide: FRNN_BROADCAST_CONTROL_LAB_TRACE_SYSTEM_GUIDE.md
director_context: FRNN_BROADCAST_CONTROL_LAB_DIRECTOR_AGENT_CONTEXT_GUIDE.md
---

# FRNN Broadcast Control Lab  
## Design Narrative & Liner Notes

This document tells the design story of the FRNN Broadcast Control Lab from the first practical request through the explicit lock of Design Flow Rounds 1–9.

It is intentionally **narrative rather than merely schematic**. The prose describes how the design changed; the liner notes preserve where recommendations were made, where the owner chose, where earlier ideas were superseded, and where implementation consequences or uncertainties appeared.

The final architecture was not present at the beginning. It emerged by repeatedly separating concepts that had initially been collapsed:

- Broadcast viewer from producer control;
- packaged library from queue;
- Program from Program Unit;
- media asset from package recipe;
- ordinary scheduling from emergency interruption;
- normal ticker from emergency ticker;
- Unit audio from Program Bed and Broadcast Bed;
- live Broadcast playback from isolated Packaging Preview;
- current source reality from locked design intent.

## How to read the liner notes

Every visible note has a machine-readable comment immediately before it:

```html
<!-- @ln-example id="LN-101" type="OWNER_DECISION" round="R1"
     concepts="BCL.PKG.LIBRARY,BCL.RUNTIME.QUEUE" status="LOCKED" -->
```

The companion modular design document uses the same `LN-*` identifiers in each concept record. That allows a reader—or a light script—to move from:

> **what exists now**

back to:

> **where the choice was made and how the understanding changed**.

---

# Prologue — From “Can I Open It?” to a Real Design Boundary

The conversation began with a narrow operational problem. The Broadcast and Program Packager had been discussed, partially scaffolded, and named, but the owner could not yet sit down at a browser and truly operate them as one coherent system. The first need was not a production broadcast network. It was a place to touch the ideas, see the shared clock, and discover what was real.


<!-- @ln id="LN-001" type="QUESTION" round="PRE" concepts="BCL.SURFACE.CONTROL_LAB,BCL.SURFACE.BROADCAST_VIEWER" status="LOCKED" -->
> **LN-001 — QUESTION · Make the Broadcast testable**  
> The work began with a practical need: expose the existing Packager and Broadcast in a web program so the owner could operate and observe the system directly.

<!-- @ln id="LN-002" type="RECOMMENDATION" round="PRE" concepts="BCL.SURFACE.CONTROL_LAB,BCL.RUNTIME.MASTER_CLOCK" status="LOCKED" -->
> **LN-002 — RECOMMENDATION · Build a Broadcast Test Lab before a full media platform**  
> The first recommendation was a deliberately small lab: one page with Packager controls and an embedded live Broadcast, plus a separate Broadcast-only link. Full media ingestion, transcoding, simulcasting, and player integration were deferred.

<!-- @ln id="LN-003" type="UNDERSTANDING" round="PRE" concepts="BCL.RUNTIME.MASTER_CLOCK,BCL.SURFACE.BROADCAST_VIEWER" status="LOCKED" -->
> **LN-003 — UNDERSTANDING · The receiver must join the shared clock**  
> A second machine must not start the current clip at zero. It must ask the authoritative backend what is on air and join at the current offset.

<!-- @ln id="LN-004" type="OWNER_EXPANSION" round="PRE" concepts="BCL.PKG.PROGRAM,BCL.PKG.TRANSITION,BCL.RUNTIME.LOOP" status="LOCKED" -->
> **LN-004 — OWNER EXPANSION · Programs, Transitions, and continuing programming**  
> The owner expanded the Packager requirement: it must create individual Programs and Transitions and support continuing programming rather than merely queueing raw files.

<!-- @ln id="LN-005" type="DELIVERABLE" round="PRE" concepts="BCL.AGENT.DIRECTOR,BCL.SURFACE.CONTROL_LAB" status="LOCKED" -->
> **LN-005 — DELIVERABLE · Initial Director packet**  
> A Director-call packet was created as a planning-only pass. It required a reality audit, bounded team tasks, behavioral tests, and a separate Broadcast link, while explicitly describing the first interfaces as skeletal versions intended for later growth.

<!-- @ln id="LN-006" type="CONFLICT" round="PRE" concepts="BCL.RISK.FILE_COLLISION" status="LOCKED" -->
> **LN-006 — CONFLICT · Implementation was temporarily a moving target**  
> The first advice was to wait because durable-identity work was still touching large shared files such as server.js and admin.html. The Broadcast packet would otherwise be based on a baseline changing underneath it.

<!-- @ln id="LN-007" type="REALITY_UPDATE" round="PRE" concepts="BCL.REALITY.REPOSITORY,BCL.RISK.FILE_COLLISION" status="LOCKED" -->
> **LN-007 — REALITY UPDATE · The blocking identity work landed**  
> A later repository inspection showed durable identity had been committed. The Broadcast foundation remained present, while newer node-assignment work was initially isolated from the Broadcast subsystem.

<!-- @ln id="LN-008" type="REALITY_UPDATE" round="PRE" concepts="BCL.RUNTIME.MASTER_CLOCK,BCL.SURFACE.BROADCAST_VIEWER,BCL.SURFACE.PRODUCER_CONSOLE" status="LOCKED" -->
> **LN-008 — REALITY UPDATE · The shared-clock viewer was more real than the Packager**  
> Inspection found a server-authoritative Broadcast clock, a public /api/broadcast state, and a /broadcast viewer that polls, seeks, resynchronizes, and joins late. The weakest part was the producer surface.

<!-- @ln id="LN-009" type="LIMITATION" round="PRE" concepts="BCL.SURFACE.PRODUCER_CONSOLE,BCL.PKG.LIBRARY" status="LOCKED" -->
> **LN-009 — LIMITATION · The Packager was fixed to three rows**  
> The current producer UI rendered exactly three Program rows. It had no expandable packaged-program library and no separate semantic distinction between Program and Transition.

<!-- @ln id="LN-010" type="SUPERSESSION" round="PRE" concepts="BCL.RUNTIME.LOOP,BCL.RUNTIME.RANDOM_FALLBACK,BCL.RUNTIME.OFF_AIR" status="LOCKED" -->
> **LN-010 — SUPERSESSION · Loop stopped meaning restart item one**  
> The owner redefined LOOP. LOOP OFF means an exhausted queue becomes OFF AIR. LOOP ON means an empty queue is filled by authoritative random selection from eligible packaged programming. The earlier restart-from-item-one meaning was superseded.

<!-- @ln id="LN-011" type="OWNER_EXPANSION" round="PRE" concepts="BCL.MODULE.CONTROL.TICKER,BCL.TICKER.DATABASE,BCL.SURFACE.CONTROL_LAB" status="LOCKED" -->
> **LN-011 — OWNER EXPANSION · Ticker and modular controls entered the lab**  
> The requested interface grew into a full agent endeavor: Packager and live Broadcast together, a reserved control-module area beneath the producer controls, a Ticker toggle, and a route for managing persisted ticker messages.

<!-- @ln id="LN-012" type="PROCESS" round="PRE" concepts="BCL.PROCESS.DESIGN_FLOW" status="LOCKED" -->
> **LN-012 — PROCESS · Design Flow replaced direct prompt compilation**  
> Before compiling the Codex prompt, the owner chose a structured question/recommendation process. Assistant recommendations remained advisory; owner answers became authoritative only after synthesis and explicit lock.


The early proposal was therefore a laboratory rather than a finished station. One browser page would place producer controls next to the live result. A second URL would be opened on another machine to prove that both clients were observing one channel rather than launching independent clips.

That apparently small request immediately exposed the most important architectural claim: **the browser is a receiver, not the master clock**. Once that was accepted, the rest of the design could be judged by causality. Operator action had to alter persisted state; the runtime had to resolve that state against authoritative time; all viewers had to see the resulting current item and offset.

The first Director packet captured that experiment, but the repository itself was still moving. After the identity work stabilized, a closer inspection revealed a useful asymmetry: the backend clock and the public viewer were more developed than the producer surface. The viewer could already join late and seek. The Packager still behaved like a three-row form.

Then LOOP changed everything. It stopped being a synonym for replaying a playlist. It became the rule used **after explicitly queued programming runs out**. From that point onward, OFF AIR and random fallback became explicit channel states rather than accidental client behavior.

A full multi-agent Control Lab prompt was drafted, adding a ticker and modular control region. Before Codex received it, however, the owner chose to run Design Flow. That decision prevented a large implementation prompt from silently hardening ambiguities that had not yet been reviewed.



# R1 — Packager Object & Workspace Model

The first round answered the most basic question: what does the Packager create, where does that creation live, and how does it become programming? The decisive separation was between a reusable library of packaged objects and the live/upcoming queue.

<!-- @ln id="LN-101" type="OWNER_DECISION" round="R1" concepts="BCL.PKG.LIBRARY,BCL.PKG.PROGRAM,BCL.PKG.TRANSITION" status="LOCKED" -->
> **LN-101 — OWNER DECISION · Library before queue**  
> Assistant recommendation: **B**. Owner answer: **1B**. Creating a PROGRAM or TRANSITION first creates a persistent item in the Packaged Programming Library. It does not automatically enter the queue.

<!-- @ln id="LN-102" type="OWNER_DECISION" round="R1" concepts="BCL.PKG.LIBRARY" status="LOCKED" -->
> **LN-102 — OWNER DECISION · Packaged objects remain reusable**  
> Assistant recommendation: **A**. Owner answer: **2A**. Programs and Transitions remain available after playback until manually deleted. Playback does not consume them.

<!-- @ln id="LN-103" type="OWNER_DECISION" round="R1" concepts="BCL.RUNTIME.QUEUE,BCL.PKG.LIBRARY" status="LOCKED" -->
> **LN-103 — OWNER DECISION · Queue entries reference packaged objects**  
> Assistant recommendation: **C**. Owner answer: **3C**. A queue entry references a packaged item and may carry a small amount of queue-specific state. It is not a full independent copy.

<!-- @ln id="LN-104" type="OWNER_DECISION" round="R1" concepts="BCL.PKG.PROGRAM,BCL.PKG.TRANSITION" status="LOCKED" -->
> **LN-104 — OWNER DECISION · Program and Transition are semantic kinds**  
> Assistant recommendation: **A**. Owner answer: **4A**. PROGRAM and TRANSITION remain distinct semantic kinds while sharing the same bounded playback machinery in v1.

<!-- @ln id="LN-105" type="OWNER_DECISION" round="R1" concepts="BCL.RUNTIME.RANDOM_POOL,BCL.RUNTIME.RANDOM_FALLBACK" status="LOCKED" -->
> **LN-105 — OWNER DECISION · Random fallback requires explicit eligibility**  
> Assistant recommendation: **C**. Owner answer: **5C**. Any packaged item may be marked LOOP ELIGIBLE. Random fallback may select only eligible packaged objects.

<!-- @ln id="LN-106" type="OWNER_DECISION" round="R1" concepts="BCL.RUNTIME.ACTIVE_SNAPSHOT,BCL.PKG.LIBRARY" status="LOCKED" -->
> **LN-106 — OWNER DECISION · Edits propagate, but NOW is protected**  
> Assistant recommendation: **A**. Owner answer: **6A**. Editing a packaged item updates future references, but the currently active run must remain a stable snapshot until its boundary.

<!-- @ln id="LN-107" type="OWNER_DECISION" round="R1" concepts="BCL.PKG.DELETION_GUARD,BCL.RUNTIME.QUEUE" status="LOCKED" -->
> **LN-107 — OWNER DECISION · Deletion is blocked while referenced**  
> Assistant recommendation: **B**. Owner answer: **7B**. A packaged item cannot be deleted while referenced by the queue or while it is on air. References must be removed first.

<!-- @ln id="LN-108" type="OWNER_DECISION" round="R1" concepts="BCL.PKG.ITEM_SCHEMA" status="LOCKED" -->
> **LN-108 — OWNER DECISION · Minimum packaged-item fields**  
> Assistant recommendation: **A**. Owner answer: **8A**. A packaged item requires title, semantic kind, playback/media type, media source, duration, and LOOP eligibility. Every required field must cause downstream behavior.

## What R1 changed

Before this round, “the Packager” could still mean an editor that directly modified the on-air queue. After R1, the system had a durable conceptual backbone:

```text
MEDIA / PACKAGE AUTHORING
        ↓
PACKAGED PROGRAMMING LIBRARY
        ├── reusable PROGRAM
        └── reusable TRANSITION
                    ↓ reference
             UPCOMING QUEUE
```

This separation later made random fallback, import/export, safe editing, and reusable Program Units possible.


# R2 — Queue, Playback & LOOP Runtime Rules

The second round turned the object model into runtime law. Normal controls would change what happens next, not what is already on air. The owner also introduced the need for an exceptional override path.

<!-- @ln id="LN-201" type="OWNER_DECISION" round="R2" concepts="BCL.RUNTIME.OFF_AIR,BCL.RUNTIME.RANDOM_POOL" status="LOCKED" -->
> **LN-201 — OWNER DECISION · Empty eligible pool resolves OFF AIR**  
> Assistant recommendation: **A**. Owner answer: **1A**. If the explicit queue is empty, LOOP is ON, and no eligible items exist, the Broadcast becomes authoritative OFF AIR rather than violating eligibility.

<!-- @ln id="LN-202" type="OWNER_DECISION" round="R2" concepts="BCL.RUNTIME.RANDOM_FALLBACK" status="LOCKED" -->
> **LN-202 — OWNER DECISION · Avoid immediate random repeats**  
> Assistant recommendation: **B**. Owner answer: **2B**. With two or more eligible items, random fallback must avoid immediately repeating the item that just played. One eligible item may repeat.

<!-- @ln id="LN-203" type="OWNER_DECISION" round="R2" concepts="BCL.RUNTIME.QUEUE,BCL.OVERRIDE.BREAKING" status="LOCKED" -->
> **LN-203 — OWNER DECISION · Explicit queue takes over at the next boundary**  
> Assistant recommendation: **B**. Owner answer: **3B, qualified**. By default, a random fallback item finishes before newly queued explicit programming begins. The owner also required a separate override capable of interrupting NOW.

<!-- @ln id="LN-204" type="OWNER_DECISION" round="R2" concepts="BCL.RUNTIME.QUEUE" status="LOCKED" -->
> **LN-204 — OWNER DECISION · New queue entries append by default**  
> Assistant recommendation: **B**. Owner answer: **4B**. Adding an item while on air appends it to the end of the upcoming queue unless the operator deliberately reorders it.

<!-- @ln id="LN-205" type="OWNER_DECISION" round="R2" concepts="BCL.RUNTIME.ACTIVE_SNAPSHOT,BCL.OVERRIDE.BREAKING" status="LOCKED" -->
> **LN-205 — OWNER DECISION · Upcoming is editable; NOW is protected**  
> Assistant recommendation: **C**. Owner answer: **5C, qualified**. Upcoming entries may be reordered while NOW remains immutable under ordinary controls. A protected emergency/breaking path is allowed to supersede NOW.

<!-- @ln id="LN-206" type="OWNER_DECISION" round="R2" concepts="BCL.RUNTIME.STOP,BCL.RUNTIME.OFF_AIR" status="LOCKED" -->
> **LN-206 — OWNER DECISION · STOP is a hard interruption**  
> Assistant recommendation: **B**. Owner answer: **6B**. STOP immediately ends the current item and enters OFF AIR. It does not delete the library or automatically clear the queue.

<!-- @ln id="LN-207" type="OWNER_DECISION" round="R2" concepts="BCL.RUNTIME.NOW_NEXT,BCL.RUNTIME.RANDOM_FALLBACK" status="LOCKED" -->
> **LN-207 — OWNER DECISION · NEXT shows AUTO during unresolved random fallback**  
> Assistant recommendation: **B**. Owner answer: **7B**. During random fallback, NEXT displays AUTO/RANDOM until a selection is actually required. The system does not pre-author a random result just to fill the label.

<!-- @ln id="LN-208" type="OWNER_DECISION" round="R2" concepts="BCL.PKG.TRANSITION,BCL.RUNTIME.QUEUE" status="LOCKED" -->
> **LN-208 — OWNER DECISION · Transitions may be queued anywhere**  
> Assistant recommendation: **A**. Owner answer: **8A**. A Transition may be placed anywhere in the explicit queue. V1 does not auto-insert or restrict Transitions to one position.

<!-- @ln id="LN-209" type="OWNER_DECISION" round="R2" concepts="BCL.RUNTIME.QUEUE,BCL.RUNTIME.ACTIVE_SNAPSHOT" status="LOCKED" -->
> **LN-209 — OWNER DECISION · Upcoming removal applies immediately**  
> Assistant recommendation: **A**. Owner answer: **9A**. An upcoming entry may be removed while on air without altering NOW or resetting the current start time.

<!-- @ln id="LN-210" type="OWNER_DECISION" round="R2" concepts="BCL.RUNTIME.LOOP,BCL.RUNTIME.BOUNDARY" status="LOCKED" -->
> **LN-210 — OWNER DECISION · LOOP changes apply at the next boundary**  
> Assistant recommendation: **B**. Owner answer: **10B**. Turning LOOP off during a random item does not cut it off. At its end, explicit queue takes priority; otherwise the channel becomes OFF AIR.

## What R2 changed

R2 established one of the Control Lab's central laws:

> **Ordinary controls change the future. Only explicitly higher authority may interrupt NOW.**

This law explains why queue mutation, LOOP changes, ticker changes, and later Broadcast Bed changes are independent of the active Program snapshot.


# R3 — Emergency Override / Breaking News

The third round gave the exceptional path its own authority model. Emergency behavior would not be smuggled into ordinary queue controls; it became an explicit, confirmed interruption with a recovery path and trace history.

<!-- @ln id="LN-301" type="OWNER_DECISION" round="R3" concepts="BCL.OVERRIDE.BREAKING,BCL.RUNTIME.QUEUE" status="LOCKED" -->
> **LN-301 — OWNER DECISION · Interrupted programming returns to the front**  
> Assistant recommendation: **D**. Owner answer: **1D**. A Program interrupted by Breaking Override is placed at the front of the upcoming queue and restarts from zero after the emergency item finishes.

<!-- @ln id="LN-302" type="OWNER_DECISION" round="R3" concepts="BCL.OVERRIDE.QUICK_CONTENT,BCL.PKG.LIBRARY" status="LOCKED" -->
> **LN-302 — OWNER DECISION · Override accepts packaged or quick content**  
> Assistant recommendation: **C**. Owner answer: **2C**. An override may select an existing packaged object or create quick temporary content that still passes through valid runtime packaging.

<!-- @ln id="LN-303" type="OWNER_DECISION" round="R3" concepts="BCL.OVERRIDE.BREAKING,BCL.PKG.ITEM_KIND" status="LOCKED" -->
> **LN-303 — OWNER DECISION · Emergency is an action, not a content kind**  
> Assistant recommendation: **B**. Owner answer: **3B**. The content kinds remain PROGRAM and TRANSITION. Emergency describes the scheduling authority used to put content on air.

<!-- @ln id="LN-304" type="OWNER_DECISION" round="R3" concepts="BCL.OVERRIDE.CONFIRMATION" status="LOCKED" -->
> **LN-304 — OWNER DECISION · Override requires confirmation**  
> Assistant recommendation: **B**. Owner answer: **4B**. Breaking Override requires an explicit review/confirm step that names the current item and the consequence of interruption.

<!-- @ln id="LN-305" type="OWNER_DECISION" round="R3" concepts="BCL.OVERRIDE.BREAKING,BCL.RUNTIME.MASTER_CLOCK" status="LOCKED" -->
> **LN-305 — OWNER DECISION · Confirmed override begins immediately**  
> Assistant recommendation: **A**. Owner answer: **5A**. After confirmation, the server records a new authoritative start and the override begins immediately rather than waiting for a normal boundary.

<!-- @ln id="LN-306" type="OWNER_DECISION" round="R3" concepts="BCL.OVERRIDE.RECOVERY,BCL.RUNTIME.QUEUE" status="LOCKED" -->
> **LN-306 — OWNER DECISION · Normal queue rules resume afterward**  
> Assistant recommendation: **A**. Owner answer: **6A**. When emergency content ends, the normal resolver resumes and the interrupted item is first upcoming.

<!-- @ln id="LN-307" type="OWNER_DECISION" round="R3" concepts="BCL.OVERRIDE.NESTING_GUARD" status="LOCKED" -->
> **LN-307 — OWNER DECISION · Emergency overrides cannot nest**  
> Assistant recommendation: **B**. Owner answer: **7B**. An emergency item is protected from another emergency override. It may complete or be stopped, but v1 has no nested interrupt stack.

<!-- @ln id="LN-308" type="OWNER_DECISION" round="R3" concepts="BCL.RUNTIME.STOP,BCL.OVERRIDE.BREAKING" status="LOCKED" -->
> **LN-308 — OWNER DECISION · STOP remains separate from Breaking Override**  
> Assistant recommendation: **A**. Owner answer: **8A**. STOP means interrupt and go OFF AIR. Breaking Override means interrupt, play selected content, then return to programming.

<!-- @ln id="LN-309" type="OWNER_DECISION" round="R3" concepts="BCL.TICKER.EMERGENCY,BCL.RUNTIME.ACTIVE_SNAPSHOT" status="LOCKED" -->
> **LN-309 — OWNER DECISION · Urgent ticker may avoid Program interruption**  
> Assistant recommendation: **A**. Owner answer: **9A**. The owner established a lower-impact urgent pathway: an Emergency Ticker may force urgent information live while the current Program continues.

<!-- @ln id="LN-310" type="OWNER_DECISION" round="R3" concepts="BCL.TICKER.EMERGENCY,BCL.TICKER.NORMAL" status="LOCKED" -->
> **LN-310 — OWNER DECISION · Emergency ticker supersedes normal rotation**  
> Assistant recommendation: **A**. Owner answer: **10A**. Emergency ticker content temporarily replaces the normal ticker rotation until explicitly cleared.

<!-- @ln id="LN-311" type="OWNER_DECISION" round="R3" concepts="BCL.OVERRIDE.VISIBLE_STATE" status="LOCKED" -->
> **LN-311 — OWNER DECISION · Override state is visibly identified**  
> Assistant recommendation: **B**. Owner answer: **11B**. The live state should visibly identify BREAKING/OVERRIDE so the exceptional condition is observable rather than inferred.

<!-- @ln id="LN-312" type="OWNER_DECISION" round="R3" concepts="BCL.OVERRIDE.AUDIT" status="LOCKED" -->
> **LN-312 — OWNER DECISION · Overrides create an operational record**  
> Assistant recommendation: **C**. Owner answer: **12C**. Record timestamp, interrupted item, override item, operator, and outcome. This is operational traceability, not broad analytics.

## What R3 changed

Breaking Override and Emergency Ticker became two different escalation levels:

```text
URGENT INFORMATION
→ Emergency Ticker
→ Program continues

BREAKING PROGRAMMING
→ confirmed Breaking Override
→ Program interrupted and preserved for replay
```

The design therefore gained authority levels instead of a single undifferentiated “emergency” button.


# R4 — Ticker Database & Control Module

The fourth round made the first control module concrete. The ticker became persistent content plus an authoritative channel-level enabled state, with a separate emergency layer.

<!-- @ln id="LN-401" type="OWNER_DECISION" round="R4" concepts="BCL.TICKER.DATABASE" status="LOCKED" -->
> **LN-401 — OWNER DECISION · Ticker messages are manually ordered**  
> Assistant recommendation: **B**. Owner answer: **1B**. The operator controls message order. Creation order, alphabetical order, and random order are not authoritative.

<!-- @ln id="LN-402" type="OWNER_DECISION" round="R4" concepts="BCL.TICKER.MESSAGE" status="LOCKED" -->
> **LN-402 — OWNER DECISION · Each message has enabled state**  
> Assistant recommendation: **A**. Owner answer: **2A**. A ticker message may exist without currently participating in the crawl.

<!-- @ln id="LN-403" type="OWNER_DECISION" round="R4" concepts="BCL.TICKER.RENDERER" status="LOCKED" -->
> **LN-403 — OWNER DECISION · Enabled messages form one continuous crawl**  
> Assistant recommendation: **B**. Owner answer: **3B**. Enabled messages are concatenated in manual order into one repeating ticker stream.

<!-- @ln id="LN-404" type="OWNER_DECISION" round="R4" concepts="BCL.TICKER.RENDERER" status="LOCKED" -->
> **LN-404 — OWNER DECISION · Message separator is double slash**  
> Assistant recommendation: **B**. Owner answer: **4B**. V1 uses `//` as a fixed separator rather than adding another style control.

<!-- @ln id="LN-405" type="OWNER_DECISION" round="R4" concepts="BCL.TICKER.DATABASE,BCL.RUNTIME.ACTIVE_SNAPSHOT" status="LOCKED" -->
> **LN-405 — OWNER DECISION · Normal ticker edits go live immediately**  
> Assistant recommendation: **A**. Owner answer: **5A**. Create, edit, enable, disable, delete, and reorder operations update the crawl without waiting for a Program boundary or restarting media.

<!-- @ln id="LN-406" type="OWNER_DECISION" round="R4" concepts="BCL.TICKER.STATE" status="LOCKED" -->
> **LN-406 — OWNER DECISION · Global ticker state persists**  
> Assistant recommendation: **A**. Owner answer: **6A**. Ticker ON/OFF survives browser closure and server/application restart through authoritative persistence.

<!-- @ln id="LN-407" type="OWNER_DECISION" round="R4" concepts="BCL.TICKER.EMERGENCY" status="LOCKED" -->
> **LN-407 — OWNER DECISION · Emergency ticker may use stored or typed content**  
> Assistant recommendation: **C**. Owner answer: **7C**. The operator may select a stored message or type a one-off emergency message. Both resolve to the same authoritative emergency state.

<!-- @ln id="LN-408" type="OWNER_DECISION" round="R4" concepts="BCL.TICKER.EMERGENCY" status="LOCKED" -->
> **LN-408 — OWNER DECISION · Emergency ticker requires explicit clear**  
> Assistant recommendation: **C**. Owner answer: **8C**. Emergency content persists until the operator deliberately clears it; it does not expire after a pass or timer.

<!-- @ln id="LN-409" type="OWNER_DECISION" round="R4" concepts="BCL.TICKER.EMERGENCY,BCL.TICKER.DATABASE" status="LOCKED" -->
> **LN-409 — OWNER DECISION · One-off emergency content asks save or discard**  
> Assistant recommendation: **C**. Owner answer: **9C**. After clearing a typed emergency message, the operator chooses whether to save it into the normal ticker database or discard it.

<!-- @ln id="LN-410" type="OWNER_DECISION" round="R4" concepts="BCL.MODULE.CONTROL.TICKER" status="LOCKED" -->
> **LN-410 — OWNER DECISION · Compact Ticker module shows operational state**  
> Assistant recommendation: **A**. Owner answer: **10A**. The main module shows global ON/OFF, enabled count, crawl preview, Manage Messages, Emergency Ticker, and emergency status. Full CRUD remains elsewhere.

<!-- @ln id="LN-411" type="OWNER_DECISION" round="R4" concepts="BCL.TICKER.AUTHORITY" status="LOCKED" -->
> **LN-411 — OWNER DECISION · Emergency ticker outranks global OFF**  
> Assistant recommendation: **A**. Owner answer: **11A**. Emergency ticker may appear even when normal ticker is OFF. Clearing it restores the prior normal OFF state.

<!-- @ln id="LN-412" type="OWNER_DECISION" round="R4" concepts="BCL.TICKER.EMERGENCY,BCL.OVERRIDE.CONFIRMATION" status="LOCKED" -->
> **LN-412 — OWNER DECISION · Emergency ticker activation requires confirmation**  
> Assistant recommendation: **A**. Owner answer: **12A**. Emergency ticker activation requires a lightweight confirmation because it supersedes normal ticker authority.

## What R4 changed

Ticker became the first proof of the Control Module pattern:

- the compact module operates a live subsystem;
- the dedicated management screen maintains its content;
- emergency state may temporarily supersede normal state;
- overlay changes never mutate Program timing.

The module was therefore functional, not merely a visual card.


# R5 — Broadcast Control Lab Interface & Operator Workflow

The fifth round organized the workstation. The first version remained desktop-oriented, producer-heavy, and deliberately separated ordinary controls from protected authority. A later image-based clarification changed the right side into two actual screens.

<!-- @ln id="LN-501" type="OWNER_DECISION" round="R5" concepts="BCL.SURFACE.CONTROL_LAB" status="LOCKED" -->
> **LN-501 — OWNER DECISION · Producer side is wider than the live pane**  
> Assistant recommendation: **B**. Owner answer: **1B**. The desktop layout gives roughly 60–65% of the width to producer controls and 35–40% to the right-side screen column.

<!-- @ln id="LN-502" type="OWNER_DECISION" round="R5" concepts="BCL.PKG.LIBRARY,BCL.RUNTIME.QUEUE,BCL.PORTABLE.PROGRAM_PACK" status="LOCKED" -->
> **LN-502 — OWNER DECISION · Library and queue are simultaneously visible**  
> Assistant recommendation: **B**. Owner answer: **2B, qualified**. The packaged library sits beside the upcoming queue. The owner added import/export so a growing collection remains manageable.

<!-- @ln id="LN-503" type="OWNER_DECISION" round="R5" concepts="BCL.SURFACE.PRODUCER_CONSOLE" status="LOCKED" -->
> **LN-503 — OWNER DECISION · Queue sits beside the library**  
> Assistant recommendation: **A**. Owner answer: **3A**. The visible relationship is AVAILABLE PROGRAMMING → UPCOMING QUEUE rather than separate pages.

<!-- @ln id="LN-504" type="OWNER_DECISION" round="R5" concepts="BCL.RUNTIME.NOW_NEXT" status="LOCKED" -->
> **LN-504 — OWNER DECISION · Producer side has a compact NOW/NEXT strip**  
> Assistant recommendation: **B**. Owner answer: **4B**. The operator can read current and next state without studying the live picture. Modes must correspond to real runtime states.

<!-- @ln id="LN-505" type="OWNER_DECISION" round="R5" concepts="BCL.SURFACE.PACKAGING_EDITOR" status="LOCKED" -->
> **LN-505 — OWNER DECISION · Creation initially used a focused editor**  
> Assistant recommendation: **B**. Owner answer: **5B, later superseded**. The initial choice was +PROGRAM/+TRANSITION opening a focused editor rather than an always-open inline form. A later two-screen insight superseded the modal/location, not the field model.

<!-- @ln id="LN-506" type="OWNER_DECISION" round="R5" concepts="BCL.SURFACE.PACKAGING_EDITOR" status="LOCKED" -->
> **LN-506 — OWNER DECISION · Existing items use the same editor model**  
> Assistant recommendation: **A**. Owner answer: **6A**. Create and edit share one interaction model, with warnings for queued, shared, or on-air items.

<!-- @ln id="LN-507" type="OWNER_DECISION" round="R5" concepts="BCL.RUNTIME.QUEUE" status="LOCKED" -->
> **LN-507 — OWNER DECISION · Add-to-queue has an explicit button**  
> Assistant recommendation: **C**. Owner answer: **7C**. An explicit ADD TO QUEUE control is required; drag-and-drop is only an optional convenience.

<!-- @ln id="LN-508" type="OWNER_DECISION" round="R5" concepts="BCL.RUNTIME.QUEUE" status="LOCKED" -->
> **LN-508 — OWNER DECISION · Queue reordering uses drag plus arrows**  
> Assistant recommendation: **C**. Owner answer: **8C**. Upcoming entries support drag/drop and explicit up/down buttons. NOW remains outside ordinary reordering.

<!-- @ln id="LN-509" type="OWNER_DECISION" round="R5" concepts="BCL.SURFACE.PRODUCER_CONSOLE" status="LOCKED" -->
> **LN-509 — OWNER DECISION · Broadcast controls sit above the queue**  
> Assistant recommendation: **A**. Owner answer: **9A**. START, STOP, and LOOP belong near the queue they govern rather than inside the public/live renderer.

<!-- @ln id="LN-510" type="OWNER_DECISION" round="R5" concepts="BCL.OVERRIDE.BREAKING,BCL.SURFACE.PRODUCER_CONSOLE" status="LOCKED" -->
> **LN-510 — OWNER DECISION · Breaking Override is visually protected**  
> Assistant recommendation: **B**. Owner answer: **10B**. The override control occupies a distinct authority region with confirmation, separate from ordinary controls.

<!-- @ln id="LN-511" type="OWNER_DECISION" round="R5" concepts="BCL.MODULE.CONTROL.REGION" status="LOCKED" -->
> **LN-511 — OWNER DECISION · Control modules live below core Packager controls**  
> Assistant recommendation: **A**. Owner answer: **11A**. The producer side reads as core Packager, then module region, then protected override controls.

<!-- @ln id="LN-512" type="OWNER_DECISION" round="R5" concepts="BCL.MODULE.CONTROL.REGION" status="LOCKED" -->
> **LN-512 — OWNER DECISION · Only one module set is active in v1**  
> Assistant recommendation: **B**. Owner answer: **12B, qualified**. The module region is extensible, but v1 presents one actual module set at a time. Ticker is the first set; nonexistent modules are not represented as fake features.

<!-- @ln id="LN-513" type="OWNER_DECISION" round="R5" concepts="BCL.SURFACE.CONTROL_LAB,BCL.SURFACE.BROADCAST_VIEWER" status="LOCKED" -->
> **LN-513 — OWNER DECISION · Control Lab is desktop-only initially**  
> Assistant recommendation: **C**. Owner answer: **13, owner supersession**. The producer workstation does not need a phone layout in v1. The separate Broadcast-only viewer remains the lightweight cross-device surface.

<!-- @ln id="LN-514" type="OWNER_DECISION" round="R5" concepts="BCL.RENDERER.SHARED" status="LOCKED" -->
> **LN-514 — OWNER DECISION · Control Lab and /broadcast share renderer logic**  
> Assistant recommendation: **A**. Owner answer: **14A**. Both live surfaces should use the same state and rendering engine rather than separate playback implementations.

<!-- @ln id="LN-515" type="OWNER_DECISION" round="R5" concepts="BCL.TICKER.DATABASE,BCL.SURFACE.TICKER_MANAGER" status="LOCKED" -->
> **LN-515 — OWNER DECISION · Ticker management gets a dedicated route**  
> Assistant recommendation: **C**. Owner answer: **15C**. MANAGE TICKER MESSAGES opens a focused management page with a return path to Broadcast Control.

<!-- @ln id="LN-516" type="OWNER_DECISION" round="R5" concepts="BCL.OVERRIDE.QUICK_CONTENT" status="LOCKED" -->
> **LN-516 — OWNER DECISION · Quick Override uses a dedicated overlay/editor**  
> Assistant recommendation: **D**. Owner answer: **16D**. The operator may select existing packaged content or build quick temporary content, review it, and then confirm interruption.

<!-- @ln id="LN-517" type="OWNER_DECISION" round="R5" concepts="BCL.OVERRIDE.QUICK_CONTENT,BCL.PKG.LIBRARY" status="LOCKED" -->
> **LN-517 — OWNER DECISION · Quick Override asks save or discard afterward**  
> Assistant recommendation: **C**. Owner answer: **17C**. Temporary override content is not automatically permanent. After use, the operator chooses save to library or discard.

<!-- @ln id="LN-518" type="OWNER_DECISION" round="R5" concepts="BCL.OVERRIDE.RECOVERY" status="LOCKED" -->
> **LN-518 — OWNER DECISION · Failed override media restores interrupted programming**  
> Assistant recommendation: **B**. Owner answer: **18B**. If emergency media fails after interruption, mark the override failed and restore the interrupted item from zero rather than going random or silently off air.

<!-- @ln id="LN-519" type="OWNER_DECISION" round="R5" concepts="BCL.SURFACE.LIVE_SCREEN,BCL.SURFACE.PACKAGING_EDITOR" status="LOCKED" -->
> **LN-519 — OWNER DECISION · Two actual screens were identified**  
> Assistant recommendation: **OWNER_REVISION**. Owner answer: **image clarification**. The right column contains two dedicated screens: Live Broadcast above and persistent Packaging Editor below. The left side remains the producer console rather than being counted as one of the two screens.

<!-- @ln id="LN-520" type="OWNER_DECISION" round="R5" concepts="BCL.SURFACE.PACKAGING_EDITOR" status="LOCKED" -->
> **LN-520 — OWNER DECISION · Persistent Packaging Editor supersedes modal placement**  
> Assistant recommendation: **SUPERSESSION**. Owner answer: **owner agreement**. Selecting or creating content loads the lower-right Packaging Editor. The earlier modal/focused-editor recommendation survives only as a focus principle, not as the physical interface location.

## The two-screen correction

The fifth round initially treated the Packager as the main left workspace and the live Broadcast as the right pane. The owner's annotated interface image produced a more precise interpretation:

```text
LEFT
Producer console:
library, queue, controls, modules, override

RIGHT TOP — SCREEN 1
Live Broadcast

RIGHT BOTTOM — SCREEN 2
Packaging Editor
```

That revision did not discard the earlier editor decisions. It relocated them into a permanent contextual screen, which gave future packaging complexity somewhere to grow without expanding the queue or library into a full editor.


# R6 — Program Units, Offsite Media & Package Composition

The sixth round changed the media grammar. A Program was no longer assumed to be one long clip. Short reusable Program Units became the authored building blocks; offsite media remained heavy, while packages held references and recipes.

<!-- @ln id="LN-601" type="OWNER_DECISION" round="R6" concepts="BCL.PKG.UNIT" status="LOCKED" -->
> **LN-601 — OWNER DECISION · Program Units target five minutes or less**  
> Assistant recommendation: **B**. Owner answer: **1B**. Five minutes is a preferred target, not a hard wall. Slightly longer Units are allowed when arbitrary splitting would damage the material.

<!-- @ln id="LN-602" type="OWNER_DECISION" round="R6" concepts="BCL.PKG.PROGRAM,BCL.PKG.UNIT" status="LOCKED" -->
> **LN-602 — OWNER DECISION · Long Programs are ordered Unit compositions**  
> Assistant recommendation: **A**. Owner answer: **2A**. A longer Program is represented as an ordered sequence of Units rather than one rendered long file or multiple unrelated queue Programs.

<!-- @ln id="LN-603" type="OWNER_DECISION" round="R6" concepts="BCL.PKG.UNIT_LIBRARY" status="LOCKED" -->
> **LN-603 — OWNER DECISION · Units may exist independently**  
> Assistant recommendation: **A**. Owner answer: **3A**. A Unit may be created and stored before belonging to any Program.

<!-- @ln id="LN-604" type="OWNER_DECISION" round="R6" concepts="BCL.PKG.UNIT_LIBRARY" status="LOCKED" -->
> **LN-604 — OWNER DECISION · Units are reusable by reference**  
> Assistant recommendation: **A**. Owner answer: **4A**. The same Unit may participate in multiple Programs without duplicating its media.

<!-- @ln id="LN-605" type="OWNER_DECISION" round="R6" concepts="BCL.MEDIA.VIDEO,BCL.PKG.UNIT" status="LOCKED" -->
> **LN-605 — OWNER DECISION · One video source maximum per Unit**  
> Assistant recommendation: **A**. Owner answer: **5A**. A Unit may have zero or one video source. V1 does not become a layered nonlinear video compositor.

<!-- @ln id="LN-606" type="OWNER_DECISION" round="R6" concepts="BCL.MEDIA.AUDIO,BCL.MEDIA.TIMECODE_MAP" status="LOCKED" -->
> **LN-606 — OWNER DECISION · Audio is layered and stored offsite**  
> Assistant recommendation: **B**. Owner answer: **6B, qualified**. A Unit supports one primary audio track and optional simultaneous secondary layers. Audio assets live offsite like video and may retain known mappings to source-video timecode.

<!-- @ln id="LN-607" type="OWNER_DECISION" round="R6" concepts="BCL.AUDIO.UNIT_LAYER" status="LOCKED" -->
> **LN-607 — OWNER DECISION · Audio layers have source stop/start and Unit offset**  
> Assistant recommendation: **B**. Owner answer: **7B, qualified**. Each layer may select source start/stop, Unit start offset, and volume. No DAW automation, EQ, or arbitrary keyframes are introduced.

<!-- @ln id="LN-608" type="OWNER_DECISION" round="R6" concepts="BCL.MEDIA.TRIM" status="LOCKED" -->
> **LN-608 — OWNER DECISION · Video trimming is nondestructive**  
> Assistant recommendation: **A**. Owner answer: **8A**. A Unit stores source IN/OUT rather than generating a new shortened media file.

<!-- @ln id="LN-609" type="OWNER_DECISION" round="R6" concepts="BCL.PKG.UNIT_DUPLICATION" status="LOCKED" -->
> **LN-609 — OWNER DECISION · Duplication copies the recipe**  
> Assistant recommendation: **A**. Owner answer: **9A**. Duplicating a Unit creates a new independent definition referencing the same media assets.

<!-- @ln id="LN-610" type="OWNER_DECISION" round="R6" concepts="BCL.MODULE.PACKAGING.GRAPHICS_V1" status="LOCKED" -->
> **LN-610 — OWNER DECISION · Graphics allow multiple simple overlays**  
> Assistant recommendation: **B**. Owner answer: **10B, qualified**. V1 permits several text/graphic overlays plus a bounded vocabulary of static, fade, jump, and crawl in/out effects. Graphics belong to a swappable Packaging Module boundary.

<!-- @ln id="LN-611" type="OWNER_DECISION" round="R6" concepts="BCL.MODULE.PACKAGING.GRAPHICS_V1" status="LOCKED" -->
> **LN-611 — OWNER DECISION · Placement uses presets plus slight dragging**  
> Assistant recommendation: **B**. Owner answer: **11B, qualified**. Choose a region such as lower-third or top-right, then allow small constrained dragging inside that region. Arbitrary canvas placement is deferred.

<!-- @ln id="LN-612" type="OWNER_DECISION" round="R6" concepts="BCL.MEDIA.ASSET_REGISTRY" status="LOCKED" -->
> **LN-612 — OWNER DECISION · Units reference stable asset IDs**  
> Assistant recommendation: **B**. Owner answer: **12B**. Package definitions store stable asset IDs that resolve to current offsite locations instead of hard-coding provider URLs.

<!-- @ln id="LN-613" type="OWNER_DECISION" round="R6" concepts="BCL.MEDIA.ASSET_REGISTRY" status="LOCKED" -->
> **LN-613 — OWNER DECISION · Media Bin UI is a minimal selectable registry**  
> Assistant recommendation: **B**. Owner answer: **13B**. V1 needs asset browsing/selection and status, not a full upload/DAM system. Ingestion may remain external/manual.

<!-- @ln id="LN-614" type="OWNER_DECISION" round="R6" concepts="BCL.MEDIA.AVAILABILITY_GUARD" status="LOCKED" -->
> **LN-614 — OWNER DECISION · Unavailable media blocks live use**  
> Assistant recommendation: **B**. Owner answer: **14B**. A Unit with an unresolved required asset is marked unavailable and may not enter live programming until fixed.

<!-- @ln id="LN-615" type="OWNER_DECISION" round="R6" concepts="BCL.PKG.UNIT,BCL.RUNTIME.QUEUE" status="LOCKED" -->
> **LN-615 — OWNER DECISION · A Unit may air directly**  
> Assistant recommendation: **A**. Owner answer: **15A**. Short Units can be queued directly without pointless one-Unit wrapper Programs.

<!-- @ln id="LN-616" type="OWNER_DECISION" round="R6" concepts="BCL.PKG.TRANSITION,BCL.PKG.UNIT" status="LOCKED" -->
> **LN-616 — OWNER DECISION · Transition may be one Unit or a short composition**  
> Assistant recommendation: **D**. Owner answer: **16D**. TRANSITION remains semantic and may contain one Unit or a short ordered Unit composition.

<!-- @ln id="LN-617" type="OWNER_DECISION" round="R6" concepts="BCL.MEDIA.AUDIO_PRIORITY" status="LOCKED" -->
> **LN-617 — OWNER DECISION · Audio receives quality/reliability priority**  
> Assistant recommendation: **B**. Owner answer: **17B**. When storage, staging, bandwidth, or delivery tradeoffs occur, preserve audio quality and reliability before maximizing video quality.

<!-- @ln id="LN-618" type="OWNER_DECISION" round="R6" concepts="BCL.PKG.UNIT,BCL.MEDIA.ASSET_REGISTRY" status="LOCKED" -->
> **LN-618 — OWNER DECISION · Units contain recipes, not media bytes**  
> Assistant recommendation: **A**. Owner answer: **18A**. Unit definitions carry asset references, trims, layers, graphics recipes, and timing—not embedded heavy media.

<!-- @ln id="LN-619" type="OWNER_DECISION" round="R6" concepts="BCL.PORTABLE.PROGRAM_PACK" status="LOCKED" -->
> **LN-619 — OWNER DECISION · Program export includes dependent Units**  
> Assistant recommendation: **B**. Owner answer: **19B**. Moving a Program carries the Program definition plus all Unit definitions it depends on, while media remains offsite.

<!-- @ln id="LN-620" type="OWNER_DECISION" round="R6" concepts="BCL.RUNTIME.STAGING" status="LOCKED" -->
> **LN-620 — OWNER DECISION · Initial live staging is NOW plus NEXT**  
> Assistant recommendation: **C**. Owner answer: **20C**. Do not hard-code a six-clip cache before evidence. Begin by staging immediate playback needs and expand only if testing proves buffering requires it.

<!-- @ln id="LN-621" type="OWNER_DECISION" round="R6" concepts="BCL.PREVIEW.ISOLATION,BCL.RUNTIME.STAGING" status="LOCKED" -->
> **LN-621 — OWNER DECISION · Packaging and live staging are independent**  
> Assistant recommendation: **UNDERSTANDING**. Owner answer: **owner question answered**. The Packaging Editor may browse and preview the wider offsite registry while the live path stages NOW and NEXT. Preview must never alter queue, clock, or on-air state.

<!-- @ln id="LN-622" type="OWNER_DECISION" round="R6" concepts="BCL.RUNTIME.PROGRAM_CLOCK" status="LOCKED" -->
> **LN-622 — OWNER DECISION · Program clock spans Unit boundaries**  
> Assistant recommendation: **OWNER_AGREEMENT**. Owner answer: **seamless-flow recommendation accepted**. The Program—not each Unit—is the continuous audience-facing playback object. The resolver maps Program elapsed time to current Unit and Unit offset.

<!-- @ln id="LN-623" type="OWNER_DECISION" round="R6" concepts="BCL.RUNTIME.AB_DECKS" status="LOCKED" -->
> **LN-623 — OWNER DECISION · A/B decks preload the next Unit**  
> Assistant recommendation: **OWNER_AGREEMENT**. Owner answer: **seamless-flow recommendation accepted**. Where practical, playback alternates between one active deck and one preloaded deck so the next Unit is ready before the boundary.

<!-- @ln id="LN-624" type="OWNER_DECISION" round="R6" concepts="BCL.RUNTIME.UNIT_BOUNDARY" status="LOCKED" -->
> **LN-624 — OWNER DECISION · Unit boundaries use a small real grammar**  
> Assistant recommendation: **OWNER_AGREEMENT**. Owner answer: **seamless-flow recommendation accepted**. CLEAN CUT, SHORT AUDIO CROSSFADE, CONTINUE AUDIO BED, and GRAPHIC COVER are the initial boundary modes. They must change playback behavior, not merely label it.

## The decisive media shift

R6 was the largest conceptual expansion in the entire sequence.

The earlier design still implied:

```text
PROGRAM ≈ one media item
```

The new model became:

```text
OFFSITE MEDIA ASSETS
        ↓ stable references
PROGRAM UNITS
        ↓ ordered composition
PROGRAM / TRANSITION
        ↓ queue
BROADCAST
```

The package—not the raw clip—became the authored artifact. A single source video could support several Unit recipes with different trims, audio, overlays, subtitles, and boundary behavior.

The owner then asked whether short Units could actually feel continuous. The accepted answer was not to pretend each Unit was a new Broadcast. The Program owns a continuous clock; the runtime resolves the current Unit and offset inside it. One deck plays while the next is preloaded. Audio may bridge boundaries independently of video.


# R7 — Packaging Editor Workflow & Program/Unit Assembly

The seventh round made the second screen operational. It defined a Program overview, selected-Unit editor, reusable asset selection, previews isolated from air, explicit save/undo, and the first hint that audio might need to live above Unit scope.

<!-- @ln id="LN-701" type="OWNER_DECISION" round="R7" concepts="BCL.SURFACE.PACKAGING_EDITOR" status="LOCKED" -->
> **LN-701 — OWNER DECISION · Program overview and selected Unit appear together**  
> Assistant recommendation: **B**. Owner answer: **1B**. The editor shows ordered Units and the selected Unit's detailed composition in one screen, avoiding both a full timeline and separate page per Unit.

<!-- @ln id="LN-702" type="OWNER_DECISION" round="R7" concepts="BCL.PKG.PROGRAM" status="LOCKED" -->
> **LN-702 — OWNER DECISION · New Programs begin empty**  
> Assistant recommendation: **A**. Owner answer: **2A**. A Program is created as an empty container; no placeholder Unit or media is invented.

<!-- @ln id="LN-703" type="OWNER_DECISION" round="R7" concepts="BCL.PKG.UNIT_LIBRARY" status="LOCKED" -->
> **LN-703 — OWNER DECISION · Programs accept new or existing Units**  
> Assistant recommendation: **C**. Owner answer: **3C**. The editor supports both CREATE UNIT and ADD EXISTING UNIT.

<!-- @ln id="LN-704" type="OWNER_DECISION" round="R7" concepts="BCL.PKG.SHARED_EDIT_GUARD" status="LOCKED" -->
> **LN-704 — OWNER DECISION · Shared Unit edits require an explicit choice**  
> Assistant recommendation: **C**. Owner answer: **4C**. When a Unit is reused, the operator chooses EDIT SHARED UNIT or DUPLICATE & EDIT rather than silently propagating changes.

<!-- @ln id="LN-705" type="OWNER_DECISION" round="R7" concepts="BCL.PKG.PROGRAM" status="LOCKED" -->
> **LN-705 — OWNER DECISION · Unit order uses drag plus arrows**  
> Assistant recommendation: **C**. Owner answer: **5C**. Program Unit order supports drag/drop and explicit up/down controls.

<!-- @ln id="LN-706" type="OWNER_DECISION" round="R7" concepts="BCL.MEDIA.ASSET_REGISTRY,BCL.SURFACE.PACKAGING_EDITOR" status="LOCKED" -->
> **LN-706 — OWNER DECISION · Media selection happens inside the editor**  
> Assistant recommendation: **B**. Owner answer: **6B**. The editor opens a simple Media Bin selector and stores stable asset IDs, not raw URLs entered by hand.

<!-- @ln id="LN-707" type="OWNER_DECISION" round="R7" concepts="BCL.MEDIA.TIMECODE_MAP" status="LOCKED" -->
> **LN-707 — OWNER DECISION · Known audio/video mapping is visible**  
> Assistant recommendation: **B**. Owner answer: **7B**. The editor exposes source relationships and an ALIGN TO SOURCE action. Alignment remains optional so intentional mismatch is possible.

<!-- @ln id="LN-708" type="OWNER_DECISION" round="R7" concepts="BCL.MEDIA.TRIM" status="LOCKED" -->
> **LN-708 — OWNER DECISION · Trimming uses scrubber plus exact fields**  
> Assistant recommendation: **B**. Owner answer: **8B**. A bounded preview scrubber with IN/OUT handles works alongside exact time inputs.

<!-- @ln id="LN-709" type="OWNER_DECISION" round="R7" concepts="BCL.AUDIO.UNIT_LAYER" status="LOCKED" -->
> **LN-709 — OWNER DECISION · Audio layers appear as compact cards**  
> Assistant recommendation: **B**. Owner answer: **9B**. Primary and secondary audio are displayed as stacked layer cards rather than DAW tracks.

<!-- @ln id="LN-710" type="OWNER_DECISION" round="R7" concepts="BCL.MODULE.PACKAGING.GRAPHICS_V1" status="LOCKED" -->
> **LN-710 — OWNER DECISION · Graphics occupies a swappable Packaging Module region**  
> Assistant recommendation: **B**. Owner answer: **10B**. The Graphics v1 module sits inside the editor but remains outside the durable core Unit schema boundary where possible.

<!-- @ln id="LN-711" type="OWNER_DECISION" round="R7" concepts="BCL.MODULE.PACKAGING.GRAPHICS_V1" status="LOCKED" -->
> **LN-711 — OWNER DECISION · Graphics use preset region plus bounded dragging**  
> Assistant recommendation: **B**. Owner answer: **11B**. The editor preserves the authored-region rule with slight constrained adjustment.

<!-- @ln id="LN-712" type="OWNER_DECISION" round="R7" concepts="BCL.RUNTIME.UNIT_BOUNDARY" status="LOCKED" -->
> **LN-712 — OWNER DECISION · Four Unit-boundary modes are exposed**  
> Assistant recommendation: **A**. Owner answer: **12A**. The Packaging Editor exposes CLEAN CUT, SHORT AUDIO CROSSFADE, CONTINUE AUDIO BED, and GRAPHIC COVER.

<!-- @ln id="LN-713" type="OWNER_DECISION" round="R7" concepts="BCL.AUDIO.CONTINUE_LAYER,BCL.AUDIO.PROGRAM_BED,BCL.AUDIO.BROADCAST_BED" status="LOCKED" -->
> **LN-713 — OWNER DECISION · Continue-bed selects a specific layer**  
> Assistant recommendation: **B**. Owner answer: **13B, qualified**. The boundary chooses which Unit audio layer continues. The owner also raised a broader possibility: an audio track may exist at Program or Broadcast scope outside Units.

<!-- @ln id="LN-714" type="OWNER_DECISION" round="R7" concepts="BCL.PREVIEW.UNIT" status="LOCKED" -->
> **LN-714 — OWNER DECISION · Unit Preview renders the actual package**  
> Assistant recommendation: **B**. Owner answer: **14B**. Preview includes video, audio layers, trims, graphics, subtitles/effects when present, and remains isolated from live state.

<!-- @ln id="LN-715" type="OWNER_DECISION" round="R7" concepts="BCL.PREVIEW.PROGRAM" status="LOCKED" -->
> **LN-715 — OWNER DECISION · Program Preview runs the full assembled sequence**  
> Assistant recommendation: **B**. Owner answer: **15B**. Program Preview exercises Unit order and boundary modes as one continuous composition.

<!-- @ln id="LN-716" type="OWNER_DECISION" round="R7" concepts="BCL.RENDERER.SHARED" status="LOCKED" -->
> **LN-716 — OWNER DECISION · Preview reuses the playback engine**  
> Assistant recommendation: **A**. Owner answer: **16A**. Preview and Broadcast should share the media-composition engine wherever possible; Broadcast adds authoritative scheduling and clock state.

<!-- @ln id="LN-717" type="OWNER_DECISION" round="R7" concepts="BCL.EDITOR.SAVE_UNDO" status="LOCKED" -->
> **LN-717 — OWNER DECISION · Saving is explicit and Undo is required**  
> Assistant recommendation: **B**. Owner answer: **17B, qualified**. The editor shows unsaved state with SAVE and REVERT, plus bounded UNDO for current-session changes.

<!-- @ln id="LN-718" type="OWNER_DECISION" round="R7" concepts="BCL.EDITOR.DIRTY_GUARD" status="LOCKED" -->
> **LN-718 — OWNER DECISION · Leaving dirty state prompts**  
> Assistant recommendation: **B**. Owner answer: **18B**. Switching items or leaving with unsaved changes prompts SAVE, DISCARD, or CANCEL.

<!-- @ln id="LN-719" type="OWNER_DECISION" round="R7" concepts="BCL.PKG.UNIT_DUPLICATION" status="LOCKED" -->
> **LN-719 — OWNER DECISION · Duplicate Unit copies the recipe**  
> Assistant recommendation: **A**. Owner answer: **19A**. DUPLICATE UNIT creates a new ID with the same asset references and independent package recipe.

<!-- @ln id="LN-720" type="OWNER_DECISION" round="R7" concepts="BCL.SURFACE.PACKAGING_EDITOR,BCL.RUNTIME.NOW_NEXT" status="LOCKED" -->
> **LN-720 — OWNER DECISION · Editor shows a small live-state strip**  
> Assistant recommendation: **B**. Owner answer: **20B**. The Packaging Editor shows LIVE/NEXT text while the actual live screen remains directly above it. Preview and Air remain visually distinct.

<!-- @ln id="LN-721" type="OWNER_DECISION" round="R7" concepts="BCL.RUNTIME.ACTIVE_SNAPSHOT" status="LOCKED" -->
> **LN-721 — OWNER DECISION · On-air edits affect future use only**  
> Assistant recommendation: **B**. Owner answer: **21B**. Editing and saving the item currently on air updates the future definition; the active snapshot remains unchanged.

<!-- @ln id="LN-722" type="OWNER_DECISION" round="R7" concepts="BCL.SURFACE.BROADCAST_VIEWER" status="LOCKED" -->
> **LN-722 — OWNER DECISION · Public viewer hides persistent elapsed clock**  
> Assistant recommendation: **D**. Owner answer: **22D**. The audience-facing Broadcast should feel like old television rather than a debug monitor. Persistent elapsed/remaining time stays on the producer side.

<!-- @ln id="LN-723" type="OWNER_DECISION" round="R7" concepts="BCL.TICKER.CLOCK" status="LOCKED" -->
> **LN-723 — OWNER DECISION · Ticker may optionally show wall-clock time**  
> Assistant recommendation: **OWNER_QUALIFICATION**. Owner answer: **22 qualification**. A simple ticker presentation option may show current wall-clock time. It is not Program elapsed time and does not affect the Master Clock.

<!-- @ln id="LN-724" type="OWNER_DECISION" round="R7" concepts="BCL.AUDIO.PROGRAM_BED,BCL.AUDIO.BROADCAST_BED" status="LOCKED" -->
> **LN-724 — OWNER DECISION · Audio above Unit scope became a formal question**  
> Assistant recommendation: **CONCEPT_EXPANSION**. Owner answer: **owner question**. The discussion distinguished Unit audio, Program Bed, and Broadcast Bed, leading directly to Round 8.

## What the Packaging Editor became

The Packaging Editor now had a precise job: assemble future programming while the live channel continues elsewhere.

It is not the queue. It is not the public viewer. It is not a full nonlinear editor.

Its core interaction is:

```text
PROGRAM OVERVIEW
+ selected Unit details
+ isolated Unit/Program preview
+ explicit save/undo
```

The owner also removed a persistent audience elapsed clock in favor of an old-television presentation. Technical timing remains visible to the producer, while an optional wall clock may appear as part of the ticker presentation.


# R8 — Continuous Audio / Broadcast Bed

The eighth round completed the audio hierarchy. Unit audio remained local; Program Beds could span Units; Broadcast Beds could span Programs and Transitions. All of them still had to respect authoritative timing and explicit authority changes.

<!-- @ln id="LN-801" type="OWNER_DECISION" round="R8" concepts="BCL.AUDIO.PROGRAM_BED,BCL.AUDIO.BROADCAST_BED" status="LOCKED" -->
> **LN-801 — OWNER DECISION · Support both Program Bed and Broadcast Bed**  
> Assistant recommendation: **C**. Owner answer: **1C**. V1 design supports a Program-scoped continuous bed and a channel-scoped Broadcast Bed.

<!-- @ln id="LN-802" type="OWNER_DECISION" round="R8" concepts="BCL.AUDIO.BROADCAST_BED" status="LOCKED" -->
> **LN-802 — OWNER DECISION · Broadcast Bed spans Program and Transition boundaries**  
> Assistant recommendation: **A**. Owner answer: **2A**. The channel bed continues until explicitly stopped or replaced, regardless of normal Program/Transition changes.

<!-- @ln id="LN-803" type="OWNER_DECISION" round="R8" concepts="BCL.AUDIO.PROGRAM_BED,BCL.AUDIO.BROADCAST_BED" status="LOCKED" -->
> **LN-803 — OWNER DECISION · Program chooses mix or replace relationship**  
> Assistant recommendation: **D**. Owner answer: **3D**. Each Program chooses whether its Program Bed mixes with or temporarily replaces the Broadcast Bed.

<!-- @ln id="LN-804" type="OWNER_DECISION" round="R8" concepts="BCL.AUDIO.BED_RELATION" status="LOCKED" -->
> **LN-804 — OWNER DECISION · Units choose KEEP, DUCK, or MUTE**  
> Assistant recommendation: **C**. Owner answer: **4C**. Each Unit explicitly determines how the currently relevant continuous bed behaves under its local audio.

<!-- @ln id="LN-805" type="OWNER_DECISION" round="R8" concepts="BCL.AUDIO.BED_RELATION" status="LOCKED" -->
> **LN-805 — OWNER DECISION · DUCK uses an authored percentage**  
> Assistant recommendation: **B**. Owner answer: **5B**. V1 uses a simple bed level percentage rather than automatic speech detection or envelopes.

<!-- @ln id="LN-806" type="OWNER_DECISION" round="R8" concepts="BCL.OVERRIDE.BREAKING,BCL.AUDIO.BROADCAST_BED" status="LOCKED" -->
> **LN-806 — OWNER DECISION · Breaking Override chooses KEEP/DUCK/MUTE**  
> Assistant recommendation: **C**. Owner answer: **6C**. Emergency content explicitly declares its relationship to the Broadcast Bed, and prior state returns afterward.

<!-- @ln id="LN-807" type="OWNER_DECISION" round="R8" concepts="BCL.RUNTIME.STOP,BCL.AUDIO.BROADCAST_BED" status="LOCKED" -->
> **LN-807 — OWNER DECISION · STOP stops the Broadcast Bed**  
> Assistant recommendation: **A**. Owner answer: **7A**. STOP ends normal programming and the active Broadcast Bed before OFF AIR begins.

<!-- @ln id="LN-808" type="OWNER_DECISION" round="R8" concepts="BCL.AUDIO.OFF_AIR_BED,BCL.RUNTIME.OFF_AIR" status="LOCKED" -->
> **LN-808 — OWNER DECISION · OFF AIR may have a dedicated bed**  
> Assistant recommendation: **A**. Owner answer: **8A**. OFF AIR may use an optional explicit Off-Air Bed; it is not the previous Broadcast Bed leaking through.

<!-- @ln id="LN-809" type="OWNER_DECISION" round="R8" concepts="BCL.RUNTIME.RANDOM_FALLBACK,BCL.AUDIO.BROADCAST_BED" status="LOCKED" -->
> **LN-809 — OWNER DECISION · Random fallback preserves Broadcast Bed continuity**  
> Assistant recommendation: **A**. Owner answer: **9A**. LOOP/random selection changes programming, not channel-level bed authority. Content may still KEEP/DUCK/MUTE it.

<!-- @ln id="LN-810" type="OWNER_DECISION" round="R8" concepts="BCL.MEDIA.AUDIO,BCL.MEDIA.ASSET_REGISTRY" status="LOCKED" -->
> **LN-810 — OWNER DECISION · Beds use the same offsite audio registry**  
> Assistant recommendation: **A**. Owner answer: **10A**. Unit audio, Program Bed, Broadcast Bed, and Off-Air Bed all reference the same stable offsite audio assets in different roles.

<!-- @ln id="LN-811" type="OWNER_DECISION" round="R8" concepts="BCL.RUNTIME.MASTER_CLOCK,BCL.AUDIO.BROADCAST_BED" status="LOCKED" -->
> **LN-811 — OWNER DECISION · Beds use the authoritative Master Clock**  
> Assistant recommendation: **A**. Owner answer: **11A**. A viewer joining late resolves the same bed asset and current offset rather than starting it locally at zero.

<!-- @ln id="LN-812" type="OWNER_DECISION" round="R8" concepts="BCL.AUDIO.BED_PLAYBACK_MODE" status="LOCKED" -->
> **LN-812 — OWNER DECISION · Bed playback mode is LOOP or ONCE**  
> Assistant recommendation: **D**. Owner answer: **12D**. Each bed declares whether its source loops or plays once.

<!-- @ln id="LN-813" type="OWNER_DECISION" round="R8" concepts="BCL.AUDIO.PROGRAM_BED,BCL.AUDIO.BROADCAST_BED" status="LOCKED" -->
> **LN-813 — OWNER DECISION · Completed ONCE Program Bed falls back**  
> Assistant recommendation: **C**. Owner answer: **13C**. When a one-shot Program Bed ends, the Broadcast Bed becomes audible again if present; otherwise the continuous layer becomes silent.

<!-- @ln id="LN-814" type="OWNER_DECISION" round="R8" concepts="BCL.AUDIO.BROADCAST_BED,BCL.RUNTIME.ACTIVE_SNAPSHOT" status="LOCKED" -->
> **LN-814 — OWNER DECISION · Changing Broadcast Bed does not restart Program**  
> Assistant recommendation: **B**. Owner answer: **14B**. Bed switching is an independent live layer operation, like ticker changes, and must not mutate current Program timing.

<!-- @ln id="LN-815" type="OWNER_DECISION" round="R8" concepts="BCL.AUDIO.BED_SWITCH" status="LOCKED" -->
> **LN-815 — OWNER DECISION · Bed switches allow CUT or short crossfade**  
> Assistant recommendation: **C**. Owner answer: **15C**. V1 supports an immediate cut or one bounded short crossfade, not a fade automation editor.

<!-- @ln id="LN-816" type="OWNER_DECISION" round="R8" concepts="BCL.MODULE.CONTROL.AUDIO_BED" status="LOCKED" -->
> **LN-816 — OWNER DECISION · Bed controls belong to the module system**  
> Assistant recommendation: **B**. Owner answer: **16B**. The full Broadcast Bed control surface belongs in the producer Control Module region. Whether it ships in the same first module set as Ticker remains an explicit scope question.

## The completed audio hierarchy

R8 turned audio priority into architecture:

```text
BROADCAST BED
channel-wide continuity

PROGRAM BED
Program-wide continuity

UNIT AUDIO
local authored composition
```

The hierarchy is controlled rather than magical. Programs choose mix or replace; Units choose KEEP, DUCK, or MUTE; overrides declare their bed relationship; STOP ends the bed; OFF AIR may have its own explicit bed.


# R9 — Portable Program Packs + Simple Subtitles

The ninth and final round defined what moves between systems. The portable artifact became a versioned recipe containing Programs, Transitions, dependent Units, optional scheduling/ticker state, and an asset manifest. Subtitles entered as simple timed Unit data.

<!-- @ln id="LN-901" type="OWNER_DECISION" round="R9" concepts="BCL.PORTABLE.PROGRAM_PACK" status="LOCKED" -->
> **LN-901 — OWNER DECISION · Program Pack includes selected Programs/Transitions and dependent Units**  
> Assistant recommendation: **B**. Owner answer: **1B**. A portable Pack is self-describing at the definition level and includes every Unit needed by the selected Program/Transition definitions.

<!-- @ln id="LN-902" type="OWNER_DECISION" round="R9" concepts="BCL.PORTABLE.PROGRAM_PACK,BCL.MEDIA.ASSET_REGISTRY" status="LOCKED" -->
> **LN-902 — OWNER DECISION · Program Packs exclude media binaries**  
> Assistant recommendation: **B**. Owner answer: **2B**. Video, audio, and graphics remain in the offsite Media Bin. The Pack carries stable references and recipes.

<!-- @ln id="LN-903" type="OWNER_DECISION" round="R9" concepts="BCL.PORTABLE.PROGRAM_PACK" status="LOCKED" -->
> **LN-903 — OWNER DECISION · Queue and ticker are optional Pack components**  
> Assistant recommendation: **C**. Owner answer: **3C**. Export may optionally include a prepared queue and ticker message set without pretending they are part of Program identity.

<!-- @ln id="LN-904" type="OWNER_DECISION" round="R9" concepts="BCL.PORTABLE.FORMAT" status="LOCKED" -->
> **LN-904 — OWNER DECISION · Program Pack format is versioned human-readable JSON**  
> Assistant recommendation: **A**. Owner answer: **4A**. V1 uses an inspectable JSON format with an explicit version so future module recipes can evolve safely.

<!-- @ln id="LN-905" type="OWNER_DECISION" round="R9" concepts="BCL.PORTABLE.IMPORT_PREVIEW" status="LOCKED" -->
> **LN-905 — OWNER DECISION · Import requires preview before persistence**  
> Assistant recommendation: **B**. Owner answer: **5B**. Import parses, validates, reports missing assets and conflicts, and requires owner confirmation before changing persistent state.

<!-- @ln id="LN-906" type="OWNER_DECISION" round="R9" concepts="BCL.MEDIA.ASSET_REGISTRY,BCL.PORTABLE.PROGRAM_PACK" status="LOCKED" -->
> **LN-906 — OWNER DECISION · Existing assets are reused by stable ID**  
> Assistant recommendation: **A**. Owner answer: **6A**. Imported definitions reference an existing local registry asset when the stable ID already resolves.

<!-- @ln id="LN-907" type="OWNER_DECISION" round="R9" concepts="BCL.TEXT.SUBTITLE" status="LOCKED" -->
> **LN-907 — OWNER DECISION · Subtitles are timed Unit data**  
> Assistant recommendation: **A**. Owner answer: **7A**. Subtitles store start, end, and text in the Unit recipe rather than being burned into source video.

<!-- @ln id="LN-908" type="OWNER_DECISION" round="R9" concepts="BCL.TEXT.SUBTITLE" status="LOCKED" -->
> **LN-908 — OWNER DECISION · Subtitles use a few style presets**  
> Assistant recommendation: **B**. Owner answer: **8B**. V1 uses bounded presets such as Standard, News, Terminal, and Large Accessible. Expressive motion/graphics remain the Graphics Packaging Module's responsibility.

## The portable artifact

By the final round, import/export no longer meant copying three rows of URLs. A Program Pack became a versioned recipe:

```text
Programs / Transitions
+ dependent Unit definitions
+ asset requirement manifest
+ optional queue
+ optional ticker set
```

The media remains offsite. Stable IDs let imported packages identify what already exists and what is missing. Subtitles fit naturally as timed Unit data rather than burned-in pixels.


# Epilogue — The Lock

<!-- @ln id="LN-999" type="LOCK" round="LOCK"
     concepts="BCL.PROCESS.DESIGN_FLOW,BCL.SYSTEM.ALL" status="LOCKED" -->
> **LN-999 — LOCK · Rounds 1–9 committed**  
> The owner explicitly said **“lock rounds 1–9.”** All owner-selected decisions and preserved qualifications in R1–R9 became the locked design baseline. Implementation was not thereby proven; the lock governs intended behavior, not source reality.

The locked design now describes a Broadcast Control Lab with three visible workstation regions:

```text
LEFT — PRODUCER CONSOLE
library, queue, NOW/NEXT, start/stop/loop,
Ticker module, protected override controls

RIGHT TOP — LIVE BROADCAST SCREEN
the actual audience-facing channel output

RIGHT BOTTOM — PACKAGING EDITOR SCREEN
Program/Unit assembly, media selection, audio,
graphics module, subtitles, previews, save/undo
```

Behind those screens is a larger causal architecture:

```text
OFFSITE MEDIA BIN
        ↓
ASSET REGISTRY
        ↓
PROGRAM UNIT RECIPES
        ↓
PROGRAMS / TRANSITIONS
        ↓
EXPLICIT QUEUE
        ↓
MASTER CLOCK + ACTIVE SNAPSHOT
        ↓
LIVE BROADCAST

queue empty:
LOOP OFF → OFF AIR
LOOP ON  → authoritative random eligible programming
```

Separate live layers—Ticker, Emergency Ticker, Broadcast Bed, Program Bed, subtitles, and graphics—must remain causally distinct from queue scheduling.

## What the lock does not prove

The lock does **not** mean the current repository implements this architecture.

At the time of design, important parts were only designed:

- reusable packaged library;
- Program/Transition semantic schema;
- Program Units;
- Program composition;
- A/B Unit playback;
- audio layering and beds;
- ticker database and emergency ticker;
- two-screen Control Lab;
- Packaging Editor;
- Program Packs;
- subtitles;
- protected Breaking Override;
- safe live queue mutation.

The existing repository had an experimental shared-clock Broadcast and a much smaller fixed-row Packager. A Director must still reconcile current source with this locked design before assigning implementation.

## Why the path matters

The final design can look inevitable when presented only as a diagram. It was not.

It came from successive discoveries:

1. the real viewer was stronger than the producer UI;
2. LOOP needed to be a queue-exhaustion rule;
3. a library and a queue were different objects;
4. ordinary controls and interruption authority needed different pathways;
5. ticker was a live layer, not a Program;
6. a dedicated Packaging Editor was the missing second screen;
7. long Programs should be composed from short reusable Units;
8. seamlessness required a continuous Program clock and prepared next Unit;
9. audio deserved scope above individual Units;
10. portable value lived in recipes and stable references, not copied media.

The liner notes preserve those turns so future work can return to the reasons rather than treating names and schemas as self-justifying truth.

---

# Liner Note Index

| Range | Subject |
|---|---|
| LN-001–LN-012 | Initial Test Lab, repository reality, LOOP supersession, Design Flow adoption |
| LN-101–LN-108 | Round 1 — Packager object model |
| LN-201–LN-210 | Round 2 — Queue, runtime, and ordinary control boundaries |
| LN-301–LN-312 | Round 3 — Breaking Override and emergency authority |
| LN-401–LN-412 | Round 4 — Ticker database and first Control Module |
| LN-501–LN-520 | Round 5 — Workstation layout and two-screen correction |
| LN-601–LN-624 | Round 6 — Program Units, offsite media, seamless flow |
| LN-701–LN-724 | Round 7 — Packaging Editor and previews |
| LN-801–LN-816 | Round 8 — Program/Broadcast Beds |
| LN-901–LN-908 | Round 9 — Program Packs and subtitles |
| LN-999 | Explicit lock of Rounds 1–9 |
| LN-1000–LN-1002 | Documentation-system and Director-handoff decisions |

---


# Coda — The Documentation System Becomes a Deliverable

<!-- @ln id="LN-1000" type="OWNER_DECISION" round="DOCS"
     concepts="BCL.PROCESS.DESIGN_FLOW,BCL.SYSTEM.ALL" status="LOCKED" -->
> **LN-1000 — OWNER DECISION · Preserve history and current design as different artifacts**  
> After locking Rounds 1–9, the owner explicitly deferred Codex prompt compilation and requested a storylike full-chat narrative with liner notes, a modular combinatorial design document keyed to those notes, and a small guide explaining their relationship.

<!-- @ln id="LN-1001" type="OWNER_EXPANSION" round="DOCS"
     concepts="BCL.AGENT.DIRECTOR,BCL.REALITY.REPOSITORY" status="LOCKED" -->
> **LN-1001 — OWNER EXPANSION · Add a rapid Director handoff**  
> The owner added a fourth deliverable: an agentic context guide that lets a Director understand the locked design, current-source boundary, file-collision risks, testing discipline, and required reading path without treating the narrative as implementation instructions.

<!-- @ln id="LN-1002" type="EXECUTION_BOUNDARY" round="DOCS"
     concepts="BCL.PROCESS.DESIGN_FLOW,BCL.AGENT.DIRECTOR" status="LOCKED" -->
> **LN-1002 — EXECUTION BOUNDARY · Documentation first, compilation later**  
> The owner authorized creation of all four documents with maximum effort while preserving the instruction not to compile the final Codex implementation prompt yet.


# Current Narrative Status

- **Decision history:** preserved.
- **Assistant recommendations:** preserved separately from owner answers.
- **Qualified answers:** preserved.
- **Superseded mechanics:** identified rather than silently rewritten.
- **Locked design:** Rounds 1–9.
- **Implementation evidence:** not inferred from the lock.
- **Next compilation:** intentionally deferred until this documentation system is complete.
