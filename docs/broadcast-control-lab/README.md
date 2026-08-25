# Broadcast Control Lab Design System

This directory tracks the owner-locked Broadcast Control Lab design context. These documents define intended behavior and its decision history; they do not prove that the behavior exists in current source.

## Reading order

1. [Director Agent Context Guide](design/FRNN_BROADCAST_CONTROL_LAB_DIRECTOR_AGENT_CONTEXT_GUIDE.md) — rapid orientation and source-reality boundary.
2. [Design Narrative and Liner Notes](design/FRNN_BROADCAST_CONTROL_LAB_DESIGN_NARRATIVE_LINER_NOTES.md) — design history, recommendations, owner decisions, qualifications, and supersessions using `LN-*` IDs.
3. [Modular Combinatorial Design](design/FRNN_BROADCAST_CONTROL_LAB_MODULAR_COMBINATORIAL_DESIGN.md) — current locked concept registry, invariants, causal rules, tests, and unresolved items using `BCL.*` IDs.
4. [Trace System Guide](design/FRNN_BROADCAST_CONTROL_LAB_TRACE_SYSTEM_GUIDE.md) — navigation between `LN-*` history and `BCL.*` concepts.

## Implementation boundary

- Reinspect current `frnn-app` source before using any historical reality statement.
- Treat task packets as bounded work orders, not implementation evidence.
- [Task Packet 01](../../tasks/BCL_TASK_PACKET_01_LIBRARY_QUEUE_SNAPSHOT.md) is implemented and locally tested in current source, with its exact pass committed at `e81c886fdc85985474c2f696265f5948968402bf`. This establishes the bounded Library → Queue → immutable Active Run experiment; it does not implement the full locked Broadcast Control Lab or prove deployment/field behavior. Its [original draft intake](../../tasks/BCL_TASK_PACKET_01_LIBRARY_QUEUE_SNAPSHOT_DRAFT.md) is retained as a supersession pointer.
- [Web Test Lab owner guide](WEB_TEST_LAB.md) describes the explicit local launch path and laptop/phone rehearsal around that existing behavior.
- The initial source/design reconciliation is recorded in the [Broadcast Control Lab reality audit](../pass-reports/2026-08-24_1652_broadcast-control-lab-reality-audit.md).
- Implementation evidence and remaining limits are recorded in the [Task Packet 01 implementation report](../pass-reports/2026-08-24_1851_bcl-library-queue-active-run.md).
