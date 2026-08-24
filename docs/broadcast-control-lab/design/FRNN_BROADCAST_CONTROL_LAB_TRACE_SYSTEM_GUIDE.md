---
document_id: BCL-TRACE-GUIDE-001
title: FRNN Broadcast Control Lab — Narrative / Design Trace System Guide
project: FRNN
status: ACTIVE_GUIDE
narrative: FRNN_BROADCAST_CONTROL_LAB_DESIGN_NARRATIVE_LINER_NOTES.md
design_registry: FRNN_BROADCAST_CONTROL_LAB_MODULAR_COMBINATORIAL_DESIGN.md
director_context: FRNN_BROADCAST_CONTROL_LAB_DIRECTOR_AGENT_CONTEXT_GUIDE.md
---

# FRNN Broadcast Control Lab  
## Narrative / Design Trace System Guide

This short guide explains how the companion documents work independently and become more useful together.

The system has four artifacts:

| File | Primary question |
|---|---|
| `FRNN_BROADCAST_CONTROL_LAB_DESIGN_NARRATIVE_LINER_NOTES.md` | **What happened, what was recommended, what did the owner choose, and why did the design change?** |
| `FRNN_BROADCAST_CONTROL_LAB_MODULAR_COMBINATORIAL_DESIGN.md` | **What concepts and rules are operative now, how do they combine, and what do they cause?** |
| `FRNN_BROADCAST_CONTROL_LAB_TRACE_SYSTEM_GUIDE.md` | **How do the narrative and modular design cross-reference each other?** |
| `FRNN_BROADCAST_CONTROL_LAB_DIRECTOR_AGENT_CONTEXT_GUIDE.md` | **What must an incoming Director know and do before assigning implementation?** |

None of the four files is intended to replace the others.

---

# 1. The Core Relationship

```text
NARRATIVE
chronology + recommendations + owner choices + supersessions
        │
        │ LN-* trace IDs
        ▼
MODULAR DESIGN
concepts + dependencies + causal rules + tests + unresolved items
        │
        │ BCL.* concept IDs
        ▼
DIRECTOR CONTEXT
operational reading order + source reality boundary + task discipline
```

The narrative answers:

> How did we get here?

The modular design answers:

> What is the locked intended system now?

The Director guide answers:

> What should an implementation agent trust, inspect, preserve, and test?

---

# 2. Liner Note IDs

Liner notes use stable identifiers:

```text
LN-001
LN-101
LN-519
LN-624
LN-999
```

The hundreds digit generally identifies a Design Flow round:

| Pattern | Meaning |
|---|---|
| `LN-001–LN-012` | pre-round discovery and repository reality |
| `LN-101–LN-108` | Round 1 |
| `LN-201–LN-210` | Round 2 |
| `LN-301–LN-312` | Round 3 |
| `LN-401–LN-412` | Round 4 |
| `LN-501–LN-520` | Round 5 |
| `LN-601–LN-624` | Round 6 |
| `LN-701–LN-724` | Round 7 |
| `LN-801–LN-816` | Round 8 |
| `LN-901–LN-908` | Round 9 |
| `LN-999` | explicit lock of Rounds 1–9 |

A liner note preserves more than the final rule. It records:

- the recommendation;
- the owner answer;
- any qualification;
- whether the moment was a conflict, expansion, supersession, or lock;
- which current concepts it affects.

Example:

```html
<!-- @ln id="LN-519"
     type="OWNER_DECISION"
     round="R5"
     concepts="BCL.SURFACE.LIVE_SCREEN,BCL.SURFACE.PACKAGING_EDITOR"
     status="LOCKED" -->
```

That note marks the image-driven clarification that the interface contains **two actual screens**: Live Broadcast and Packaging Editor.

---

# 3. Concept IDs

Current design concepts use stable dotted IDs:

```text
BCL.PKG.UNIT
BCL.RUNTIME.LOOP
BCL.TICKER.EMERGENCY
BCL.AUDIO.BROADCAST_BED
BCL.PORTABLE.PROGRAM_PACK
```

The prefix encodes a broad layer:

| Prefix | Layer |
|---|---|
| `BCL.SURFACE.*` | visible application surfaces |
| `BCL.PKG.*` | packaging objects and authoring rules |
| `BCL.MEDIA.*` | offsite media identity, trims, mapping, availability |
| `BCL.RUNTIME.*` | queue, clock, active state, LOOP, fallback, OFF AIR |
| `BCL.PREVIEW.*` | isolated authoring previews |
| `BCL.RENDERER.*` | shared composition/playback interpretation |
| `BCL.TICKER.*` | normal/emergency ticker data and authority |
| `BCL.OVERRIDE.*` | Breaking Override, confirmation, recovery, audit |
| `BCL.AUDIO.*` | Unit audio and continuous beds |
| `BCL.MODULE.*` | Control Module and Packaging Module extension boundaries |
| `BCL.TEXT.*` | subtitles and other timed text |
| `BCL.PORTABLE.*` | Program Packs and import/export |
| `BCL.PROCESS.*` | design governance |
| `BCL.AGENT.*` | agent roles |
| `BCL.REALITY.*` | moving source/runtime reality |

Each detailed concept record includes:

```text
definition
owns
does_not_own
causes
dependencies
relations
source_liner_notes
tags
invariants
test_obligations
```

---

# 4. Fine-grained Aliases

The narrative occasionally names a more specific concept than the detailed registry promotes to a full record, for example:

```text
BCL.PKG.DELETION_GUARD
BCL.RUNTIME.NOW_NEXT
BCL.OVERRIDE.CONFIRMATION
```

These are **fine-grained aliases**, not hidden new systems.

Use this rule:

```text
detailed registry concept
= stable architectural node

fine-grained alias
= trace/search label for a subrule owned by a stable node
```

Examples:

| Alias | Owning detailed concept |
|---|---|
| `BCL.PKG.DELETION_GUARD` | `BCL.PKG.LIBRARY` |
| `BCL.RUNTIME.NOW_NEXT` | `BCL.SURFACE.PRODUCER_CONSOLE` + `BCL.RUNTIME.QUEUE` |
| `BCL.OVERRIDE.CONFIRMATION` | `BCL.OVERRIDE.BREAKING` |
| `BCL.OVERRIDE.NESTING_GUARD` | `BCL.OVERRIDE.BREAKING` |
| `BCL.AUDIO.CONTINUE_LAYER` | `BCL.RUNTIME.UNIT_BOUNDARY` + `BCL.AUDIO.UNIT_LAYER` |
| `BCL.TICKER.STATE` | `BCL.TICKER.NORMAL` |
| `BCL.TICKER.AUTHORITY` | `BCL.TICKER.EMERGENCY` |
| `BCL.PORTABLE.IMPORT_PREVIEW` | `BCL.PORTABLE.IMPORT_PREVIEW` when promoted as a detailed record |

An alias should be promoted into a full concept only when it gains its own:

- persistent state;
- independent rules;
- meaningful dependencies;
- downstream effects;
- test obligations.

---

# 5. Manual Navigation

## From current design to history

Suppose the modular document says:

```text
BCL.RUNTIME.LOOP
source_liner_notes:
- LN-010
- LN-201
- LN-210
```

Open the narrative and search for those IDs.

You will see:

1. `LN-010` — the old “restart item one” meaning was superseded;
2. `LN-201` — empty eligible pool resolves OFF AIR;
3. `LN-210` — LOOP changes apply at the next boundary.

The final concept therefore retains the entire reasoned path rather than only the last label.

## From history to current design

Suppose the narrative says:

```text
LN-624 — Unit boundaries use a small real grammar
concepts:
BCL.RUNTIME.UNIT_BOUNDARY
```

Search the modular design for:

```text
BCL.RUNTIME.UNIT_BOUNDARY
```

That record shows:

- exact modes;
- dependencies on A/B decks, audio continuation, and graphics;
- invariant that the modes must produce different playback;
- required behavioral test.

## From Director question to both files

A Director asks:

> Why can’t a normal queue edit interrupt NOW?

1. Search the Director guide for `NOW protection`.
2. Follow concept `BCL.RUNTIME.ACTIVE_SNAPSHOT`.
3. Follow its liner notes:
   - `LN-106`;
   - `LN-205`;
   - `LN-209`;
   - `LN-721`;
   - `LN-814`.
4. Observe that the rule recurs across library edits, queue edits, on-air package edits, and Broadcast Bed switching.

This indicates a true cross-system invariant rather than a local UI preference.

---

# 6. Tag Queries

The modular design uses namespaced tags.

Examples:

```text
layer:audio
```

Finds audio concepts.

```text
authority:server
```

Finds behavior that must happen authoritatively rather than in viewers.

```text
timing:now
```

Finds current-state concepts.

```text
mutability:immutable-run
```

Finds state protected during active playback.

```text
scope:experiment
```

Finds designed experiments that should not be presented as validated systems.

Useful intersections:

```text
layer:runtime AND timing:now
```

```text
layer:module AND module-kind:packaging
```

```text
layer:audio AND reality:unvalidated
```

```text
layer:portability AND authority:owner-confirmation
```

---

# 7. Light Script Use

The modular design contains a copyable `trace-tools.mjs` script.

Basic usage:

```bash
node trace-tools.mjs   FRNN_BROADCAST_CONTROL_LAB_DESIGN_NARRATIVE_LINER_NOTES.md   FRNN_BROADCAST_CONTROL_LAB_MODULAR_COMBINATORIAL_DESIGN.md   traces BCL.RUNTIME.LOOP
```

Other commands:

```bash
# Show one narrative note
node trace-tools.mjs <narrative> <design> note LN-519

# Show one concept marker
node trace-tools.mjs <narrative> <design> concept BCL.PKG.UNIT

# Show every concept connected to a note
node trace-tools.mjs <narrative> <design> concepts-for-note LN-624

# Show concepts carrying a tag
node trace-tools.mjs <narrative> <design> tag layer:audio

# Show dependents, relations, and history
node trace-tools.mjs <narrative> <design> impact BCL.PKG.UNIT

# Check references
node trace-tools.mjs <narrative> <design> validate
```

The script is intentionally light.

It does **not** decide semantic truth.

It indexes the truth already recorded in the documents.

---

# 8. Integrity Rules

A healthy trace system obeys these rules:

1. **Never change an old liner note to make history cleaner.**
2. Add a new `SUPERSESSION` or `QUALIFICATION` note instead.
3. A concept may cite several notes from different rounds.
4. A locked concept may still have `reality: DESIGNED`.
5. Implementation evidence changes reality state, not design history.
6. A test failure may weaken or qualify a concept without erasing the owner decision.
7. An unresolved item remains visible until an owner decision or experiment resolves it.
8. Tags must describe actual context or causal role.
9. Avoid cosmetic tags that do not improve filtering or impact analysis.
10. Do not promote every small rule into a full concept record.
11. Do not hide a new persistent state inside an alias.
12. Keep source reality and locked design separate.

---

# 9. Updating the System

## New owner decision

```text
QUESTION
→ recommendation
→ owner answer
→ synthesis
→ new LN ID
→ affected concept update
→ explicit lock
```

## New implementation evidence

```text
TEST / RUNTIME OBSERVATION
→ evidence note
→ affected concept reality update
→ test register update
→ unresolved consequences
```

Do not rewrite the original design note.

## Supersession

Example:

```text
old:
LOOP means restart queue item one

new:
LOOP is an empty-queue rule
```

Required record:

```text
old note remains
+
new SUPERSESSION note
+
current LOOP concept points to both
+
invariant forbids silent resurrection
```

## New module

A new module should not be added merely as a card.

It needs:

```text
module concept
persistent/authoritative state
operator action
rule
downstream result
test obligation
liner-note trace
```

---

# 10. Recommended Reading Paths

## Ten-minute orientation

1. Director Guide — Executive Summary.
2. Modular Design — System Causal Spine.
3. Modular Design — Invariant Register.
4. Narrative — Prologue and Epilogue.
5. Modular Design — unresolved register.

## Understanding the media model

1. Narrative R6.
2. Concepts:
   - `BCL.MEDIA.ASSET_REGISTRY`
   - `BCL.PKG.UNIT`
   - `BCL.PKG.PROGRAM`
   - `BCL.RUNTIME.PROGRAM_CLOCK`
3. Narrative notes `LN-601–LN-624`.

## Understanding live authority

1. Concepts:
   - `BCL.RUNTIME.ACTIVE_SNAPSHOT`
   - `BCL.RUNTIME.QUEUE`
   - `BCL.OVERRIDE.BREAKING`
   - `BCL.TICKER.EMERGENCY`
2. Narrative R2–R4.

## Understanding the two screens

1. Narrative `LN-519` and `LN-520`.
2. Concepts:
   - `BCL.SURFACE.LIVE_SCREEN`
   - `BCL.SURFACE.PACKAGING_EDITOR`
   - `BCL.SURFACE.PRODUCER_CONSOLE`.

## Understanding audio

1. Narrative R6–R8.
2. Filter `layer:audio`.
3. Read unresolved items concerning browser mixing and Bed control-module scope.

---

# 11. What Each Document Must Not Become

## Narrative must not become

- the only current-state specification;
- a cleaned-up fiction where every idea was always accepted;
- implementation evidence.

## Modular design must not become

- an unreadable tag dump;
- a replacement for source inspection;
- a list of names without causal effects.

## Trace guide must not become

- another design authority;
- a duplicate of the narrative or registry.

## Director guide must not become

- a permission slip to implement everything at once;
- a substitute for inspecting current `frnn-app`;
- a claim that locked design is already real.

---

# 12. Compact Mental Model

```text
LN-* IDs
= decision history anchors

BCL.* IDs
= current concept anchors

tags
= context filters

relations/dependencies
= impact graph

invariants
= behavior that must survive

test obligations
= evidence required

reality state
= what has actually been demonstrated
```

Together, the documents preserve both:

```text
WHY THE DESIGN EXISTS
```

and:

```text
WHAT THE DESIGN CURRENTLY REQUIRES
```
