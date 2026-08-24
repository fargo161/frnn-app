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

## 11. Mandatory Post-Pass Reports

After every meaningful design, implementation, repair, refactor, stabilization, or documentation pass, create a standalone Markdown audit report. This is mandatory even when the pass fails, is incomplete, or makes no code changes.

Save reports under `docs/pass-reports/` with the filename:

`YYYY-MM-DD_HHMM_<short-pass-name>.md`

Do not overwrite an earlier report. Maintain `docs/pass-reports/README.md` as a chronological index containing only the date, pass name, commit, and report link.

### Commit-Oriented Passes

The report is part of the pass, not an afterthought to its commit. When a pass includes creating a final commit:

1. Finish the substantive design, edit, or implementation work.
2. Perform the required checks and tests.
3. Create the mandatory timestamped report for the pass.
4. Update `docs/pass-reports/README.md`.
5. Review the final diff and verify the report against the evidence.
6. Stage the substantive changes, pass report, and report-index update together.
7. Create the final commit.

The report and index update should therefore normally be included in the same final commit they document.

The final commit SHA may not exist when its report is written. Record the pre-commit state accurately as `PENDING FINAL COMMIT`; do not create a second report-only commit solely to insert the resulting SHA. The final chat response may provide the resulting SHA. Do not amend older reports to backfill commit metadata unless explicitly requested, and never rewrite or falsify report history.

### Non-Commit Passes

When no commit is requested, still create the mandatory report and update the report index. Record the pass as `NOT COMMITTED`.

Every report must contain these sections:

1. `PASS` — task name, objective, branch if applicable, and relevant commit SHA if one exists.
2. `CURRENT REALITY BEFORE PASS` — what actually existed, using SPECULATIVE, DESIGNED, IMPLEMENTED, TESTED, and VALIDATED precisely.
3. `WHAT CHANGED` — actual file, code-surface, state, and user-visible changes, described causally where relevant.
4. `WHAT IS REAL NOW` — behavior actually present in current source after the pass.
5. `WHAT IS STILL MISSING` — unmet objective requirements and partial implementations.
6. `WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL` — mocks, temporary UI, hard-coded values, fake integrations, stubs, placeholder persistence, simulations, and authored shortcuts presented as systemic behavior. If none, write `None identified in this pass.`
7. `TESTING PERFORMED` — exact structural and behavioral checks, kept separate, with commands when useful.
8. `TEST RESULTS` — passes, failures, untested behavior, and environmental limitations.
9. `IMPORTANT UNCERTAINTIES` — the most important remaining unknowns about behavior and causality.
10. `RECOMMENDED NEXT EXPERIMENT` — the smallest experiment resolving the largest uncertainty, using `current claim → biggest uncertainty → minimum experiment → observable result` and NOW/NEXT/LATER/PARK when useful.
11. `FILES MODIFIED` — every file created, modified, moved, or deleted during the pass.
12. `COMMIT STATUS` — exactly one of `PENDING FINAL COMMIT`, `NOT COMMITTED`, `COMMITTED LOCALLY`, `PUSHED`, or `MERGED`, with SHA when available. Use `PENDING FINAL COMMIT` only when the report will be included in the final commit for the pass.

The report is an audit artifact, not promotional documentation. Never silently convert intended design into an implementation claim or hide failures, unfinished work, shortcuts, or contradictions. Do not use claims such as complete, robust, production-ready, fully implemented, validated, or emergent unless the pass contains supporting evidence.

In the final chat response, summarize what actually changed, tests run, remaining uncertainty, and link to the standalone report. Do not describe a feature as validated merely because its implementation task succeeded.

---

## 12. FRNN Project Boundary

FRNN is its own project.

Do not import mechanics, terminology, architecture, assumptions, or history from unrelated projects unless an active task explicitly requests comparison or reuse.

Similarity is not authorization.

---

## 13. Sole Active Workspace

`C:\Users\mcdon\Documents\ChatGPT\frnn-app` is the only active FRNN workspace for Codex. Implementation, design changes, task packets, tests, migrations, documentation changes, audits of current behavior, and deployment-configuration work must operate from this tracked repository.

`C:\Users\mcdon\Documents\ChatGPT\frnn` is historical/reference material only. Do not implement features, create task packets, treat it as a parallel repository, infer current FRNN truth from it, or write new active FRNN work there unless the user explicitly requests a historical investigation.

If content exists in both locations, `frnn-app` wins for current FRNN work. Historical provenance may still be inspected in `frnn`, but it does not override the tracked repository.

---

# Default Working Rule

When uncertain, do not invent missing architecture.

Inspect what exists.

State what is known.

State what remains uncertain.

Make the smallest change necessary to answer the current design question.

**FRNN becomes more sophisticated when its foundations survive testing, not when additional layers make it appear sophisticated.**
