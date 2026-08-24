# FRNN Historical Deployment Evidence

These files are dated operational and test evidence from the earlier FRNN deployment and production-preflight process:

- [`FRNN_PRODUCTION_PREFLIGHT_v0_1.md`](FRNN_PRODUCTION_PREFLIGHT_v0_1.md)
- [`FRNN_READ_ONLY_DEPLOYMENT_VERIFICATION_v0_1.md`](FRNN_READ_ONLY_DEPLOYMENT_VERIFICATION_v0_1.md)

## Reality state

```text
HISTORICAL / TESTED AT RECORDED POINT IN TIME
```

They are not current production truth, deployment authorization, or operative instructions.

## Why they are preserved

The reports retain exact historical preflight findings, deployment verification, infrastructure observations, test and deployment evidence, rollback and gate evidence, and provenance that are more detailed than current canonical infrastructure documentation.

## Authority rule

Current authority remains:

```text
runtime behavior
→ current source
→ behavioral tests
→ current infrastructure documentation
→ historical evidence
```

Historical reports must not override current source or current environment inspection.

## Recorded hashes

- `FRNN_PRODUCTION_PREFLIGHT_v0_1.md`: `F69176787044C1CF5CD29CEA8E677546C3E33E73009A27FCA66E83D647D3E39C`
- `FRNN_READ_ONLY_DEPLOYMENT_VERIFICATION_v0_1.md`: `83CD9FCBC099489223DB00A72F4850AC2DD977CEA1B00D59FACAD91D715A16E7`

## Staleness warning

Render, R2, PostgreSQL, backup, and deployment state may have changed since these reports were recorded. Historical `READY` conclusions must never be executed as current authorization; re-inspect the current environment and obtain the required approval.
