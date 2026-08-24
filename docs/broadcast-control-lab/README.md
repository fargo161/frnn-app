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
- The current Task Packet 01 intake is [tracked as a draft](../../tasks/BCL_TASK_PACKET_01_LIBRARY_QUEUE_SNAPSHOT_DRAFT.md) and is not active until its visible revision issues are resolved.
- The initial source/design reconciliation is recorded in the [Broadcast Control Lab reality audit](../pass-reports/2026-08-24_1652_broadcast-control-lab-reality-audit.md).
