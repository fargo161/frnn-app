# FRNN — Codex Repository Instructions

## Purpose

These instructions define how Codex should work inside the FRNN repository.

They are **permanent operating rules**, not a feature specification or task packet.

Specific implementation work should come from the active task packet.

The goal is not to make FRNN appear complete.

**Progress means reducing important unknowns through working, inspectable behavior.**

---

## 1. Establish Reality Before Changing Anything

Before implementation, inspect the relevant current source.

For important claims, distinguish between:

- **SPECULATIVE** — idea under discussion
- **DESIGNED** — intended behavior has been agreed
- **IMPLEMENTED** — behavior exists in current source
- **TESTED** — behavior has been meaningfully exercised
- **VALIDATED** — evidence supports the underlying design assumption

Do not treat documentation, comments, schemas, UI labels, variable names, task packets, or test counts as proof that behavior works.

When evidence conflicts, prefer:

**runtime behavior → current source → behavioral tests → approved design → documentation**

Report contradictions rather than silently resolving them.

---

## 2. Task Packets Are Work Orders

Repository instructions define **how to work**.

Task packets define **what to work on**.

When a task packet is active:

1. Read these repository instructions.
2. Inspect the relevant current implementation.
3. Read the active task packet.
4. Compare the packet's assumptions against current source.
5. Report important contradictions before building on them.
6. Implement only the bounded objective.
7. Test the resulting behavior.
8. Report what actually changed.

Do not treat old task packets as active requirements.

Do not silently resurrect removed, deferred, superseded, or experimental mechanics.

---

## 3. Trace Causality

For every meaningful mechanic, determine:

**player action → recorded state → available information → rule evaluation → state change → observable result**

A field, tag, score, permission, profile value, station identity, or metadata value is not a functioning mechanic merely because it exists.

Ask:

**What changes because this exists?**

If nothing downstream changes, describe it as inert, cosmetic, provisional, or infrastructure rather than functional gameplay.

---

## 4. Preserve the Four Functions of Behavior

FRNN uses four Functions of Behavior:

- **ESCAPE**
- **ATTENTION**
- **ACCESS**
- **SENSORY**

Do not rename, merge, replace, or silently redefine them.

Do not assume they have systemic effects simply because they appear in station names, UI, data, or documentation.

When working with a Function, determine what it actually changes downstream.

If the Functions currently operate only as themes, labels, station identities, or categorization, report that accurately.

Any new causal behavior involving the Functions should come from an explicit task packet or approved design decision.

---

## 5. Prefer Systemic Rules Over Disguised Branches

FRNN may use combinatorial systems.

Combinations should produce consequences through reusable rules rather than large collections of disguised authored outcomes.

Flag situations where:

- many combinations collapse into a few hard-coded results;
- tags exist without downstream effects;
- predetermined reactions are presented as simulation;
- randomness is being presented as emergence;
- hidden templates are being presented as combinatorial behavior;
- one-off exceptions are replacing a reusable mechanic.

Ask:

**Was this result directly authored, or was it produced by reusable rules acting on authored components?**

Randomness by itself is not emergence.

Prefer outcomes whose causes can be inspected and explained.

---

## 6. Keep Experiments Small

Prefer vertical experiments over horizontal expansion.

A prototype should answer a design question.

Use:

**current claim → biggest uncertainty → minimum experiment → observable result**

Prefer:

- one meaningful loop over several shallow systems;
- one concrete deployment case over speculative generality;
- small rules with observable consequences;
- authored bounds with systemic variation;
- inspectable state over invisible complexity.

Do not solve weak behavior merely by adding more content.

---

## 7. Control Scope

Stay inside the active task packet.

When useful, classify discoveries as:

- **NOW** — required for the current experiment
- **NEXT** — justified after the current uncertainty is resolved
- **LATER** — compatible future expansion
- **PARK** — interesting but distracting from the current experiment

Do not implement NEXT, LATER, or PARK work unless explicitly instructed.

Avoid unrelated refactors.

If an unrelated defect blocks the task, report it and make only the minimum repair necessary to continue.

---

## 8. Tests Must Demonstrate Consequences

Do not use test quantity as evidence of system quality.

Prefer behavioral tests demonstrating things such as:

- state transitions;
- gating;
- permissions;
- persistence;
- ordering;
- visibility;
- recovery;
- player-facing consequences.

For combinatorial behavior, whenever practical:

**change one meaningful input → hold the others constant → verify that the downstream result changes appropriately**

A test proving that a component, schema, endpoint, field, or function exists is structural evidence only.

It does not prove the intended mechanic works.

---

## 9. Keep Current Source and Documentation Distinct

Documentation describes intended or observed behavior.

It does not override current runtime reality.

If documentation claims behavior that current source does not provide, report the discrepancy.

Do not implement undocumented assumptions merely to make source match prose.

After implementation, update documentation only when required by the task or when necessary to prevent a material contradiction.

Never rewrite history to make an experiment appear successful.

---

## 10. Repository Changes Should Be Inspectable

Keep changes bounded and easy to review.

Prefer:

- small diffs;
- explicit state transitions;
- obvious rule locations;
- deterministic behavior where randomness is unnecessary;
- behavioral tests near the mechanic they verify;
- clear failure states.

Avoid unnecessary abstractions introduced only for hypothetical future flexibility.

Do not perform broad architectural cleanup during a feature pass unless the task explicitly requires it.

---

## 11. Implementation Reports

At the end of an implementation pass, report:

### WHAT WAS REAL BEFORE
Relevant behavior confirmed in the source before modification.

### WHAT CHANGED
Exact behavior introduced, removed, or modified.

### FILES CHANGED
Important files and their purpose.

### BEHAVIORAL PATH
Describe:

**player action → recorded state → rule → state change → observable result**

### TESTS RUN
State what was actually executed and what each meaningful test demonstrates.

### WHAT REMAINS UNVERIFIED
Anything that was not meaningfully exercised.

### CONTRADICTIONS / PROVISIONAL ELEMENTS
Mocks, placeholders, inert fields, temporary logic, documentation mismatches, or other misleading surfaces.

### NEXT EXPERIMENT
Recommend the smallest experiment that would resolve the largest remaining uncertainty.

Do not describe a feature as validated merely because its implementation task succeeded.

---

## 12. FRNN Project Boundary

FRNN is its own project.

Do not import mechanics, terminology, architecture, assumptions, or history from unrelated projects unless an active task explicitly requests comparison or reuse.

Similarity is not authorization.

---

# Default Working Rule

When uncertain, do not invent missing architecture.

Inspect what exists.

State what is known.

State what remains uncertain.

Make the smallest change necessary to answer the current design question.

**FRNN becomes more sophisticated when its foundations survive testing, not when additional layers make it appear sophisticated.**
