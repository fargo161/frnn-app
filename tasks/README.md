# FRNN Task Packet Protocol

Task packets are **bounded implementation instructions tied to a known repository baseline**. They specify work to perform; they are not canonical implementation truth.

A packet may describe behavior that is designed, partially implemented, or completely absent. Its existence proves only that the work was specified. It does not prove implementation, runtime behavior, passing tests, deployment, production state, or validation. Repository source and observed runtime behavior remain authoritative for current implementation reality.

## Reality states

- **SPECULATIVE** — an idea under discussion.
- **DESIGNED** — agreed intended behavior.
- **IMPLEMENTED** — present in the current source.
- **TESTED** — meaningfully exercised by identified tests.
- **VALIDATED** — evidence supports the underlying design assumption.

These states are not interchangeable. In particular, a task packet normally records DESIGNED work, and passing tests alone does not establish broad architectural validation.

## Standard packet header

Future FRNN task packets should begin with this compact header:

```md
# <Task Name>

**Document type:** Implementation Task Packet
**Reality state:** DESIGNED — not proof of implementation
**Baseline:** `<commit SHA>`
**Status:** Pending | In Progress | Implemented | Superseded
**Created:** `<date>`

> This packet defines work requested from the stated baseline.
> Source code, runtime behavior, and behavioral tests remain authoritative for what is actually implemented.
```

Use the status that describes the packet's actual progress. Do not infer implementation from the packet's presence or status label alone.

## Baseline rule

Every packet must identify the full commit SHA from which its assumptions were made. Before implementation begins, compare the packet baseline with the current `HEAD` and verify that its assumptions still hold. If the repository has advanced materially, distinguish the packet baseline from the current implementation and record any consequences; do not execute stale instructions blindly.

## Preferred packet structure

Substantial implementation packets should preferably contain:

```text
OBJECTIVE
CURRENT REALITY
REQUIRED CHANGES
INVARIANTS
OUT OF SCOPE
ACCEPTANCE CRITERIA
BEHAVIORAL TESTS
IMPLEMENTATION REPORT
```

The implementation report may begin empty or marked pending. Preserve the original assignment after work starts; do not rewrite it later to make the requested work appear to match the implementation perfectly.

Small maintenance packets may be shorter. When prioritization helps, use `NOW`, `NEXT`, `LATER`, and `PARK`, but this categorization is not mandatory for tiny changes. Keep each packet bounded enough for one implementation pass whenever practical.

## Preservation and history

Once implementation begins, do not silently rewrite the original requirements. If a request proves wrong, impossible, unnecessary, or intentionally changes, preserve the request and explain the result in the implementation report:

```text
Task requested A.
Implementation discovered constraint B.
A was not implemented.
C was implemented instead.
Reason: ...
```

Do not change A to C retroactively and then claim exact completion. Historical packet requirements must remain inspectable, and no task packet may silently redefine canonical architecture.

## Causality and behavioral evidence

Describe important behavior through consequences wherever possible:

```text
player action
→ recorded state
→ rule evaluation
→ state change
→ observable result
```

For each important state field, tag, flag, column, or label, ask: **What changes because this exists?** Metadata without a defined downstream consequence is not a complete behavioral requirement.

Distinguish structural tests from behavioral tests:

```text
Structural: table exists; endpoint exists; field exists.

Behavioral: event becomes inactive
→ player identity remains usable
→ always-on profile remains accessible.
```

Prefer behavioral tests for state transitions, permissions, visibility, gating, persistence, lifecycle transitions, failure recovery, and user-facing consequences. Report exact tests and results; raw test counts are not proof of broad correctness.

## Implementation report protocol

The implementation report is evidence about what actually happened. It should answer:

```text
WHAT CHANGED
WHAT DID NOT CHANGE
DEVIATIONS FROM PACKET
FILES CHANGED
MIGRATIONS
TESTS RUN
TEST RESULTS
UNVERIFIED AREAS
KNOWN RISKS
NEXT EXPERIMENT
```

When useful, classify individual results as `IMPLEMENTED`, `TESTED`, `VALIDATED`, `UNVERIFIED`, or `DEFERRED`. Claim `VALIDATED` only when evidence supports the relevant design assumption, not merely because tests passed.

## Repository authority

The intended evidence chain is:

```text
CANONICAL DESIGN
        ↓
TASK PACKET
        ↓
IMPLEMENTATION
        ↓
BEHAVIORAL EVIDENCE
        ↓
IMPLEMENTATION REPORT
```

These artifacts are related, but they are not interchangeable reality states. Apply these invariants:

1. Task packet ≠ implementation.
2. Documentation ≠ runtime evidence.
3. Test count ≠ validation.
4. Historical packet requirements remain inspectable.
5. Current source remains authoritative for implementation reality.
6. Runtime behavior outranks documentation when they conflict.
7. No task packet silently redefines canonical architecture.
8. No completed packet is rewritten to manufacture agreement with implementation.
9. Every packet is tied to a baseline commit.
10. Packets remain bounded enough for one implementation pass whenever practical.

