# 1. PASS

- Pass/task name: Repair commit-oriented report ordering
- Objective: Make the standing instruction require pass reports and index updates before a requested final commit so reporting does not create a recursive tail of uncommitted artifacts.
- Branch: `main`
- Relevant current commit: `6e3722184725442088f6061302cba0d11d1e5800`

# 2. CURRENT REALITY BEFORE PASS

- **IMPLEMENTED:** Section 11 required a timestamped report and chronological index entry after every meaningful pass.
- **IMPLEMENTED:** The instruction required one of four commit-status values but provided no provisional state for a report written before its final commit existed.
- No ordering rule required a commit-oriented pass to generate and stage its report before the final commit.
- The earlier commit-oriented pass therefore left its report and index update uncommitted after creating commit `6e3722184725442088f6061302cba0d11d1e5800`.
- No application behavior was inspected, tested, or validated in this documentation/process pass.

# 3. WHAT CHANGED

- Added `Commit-Oriented Passes` under `AGENTS.md` section 11 with an explicit seven-step sequence: finish work, test, create the report, update the index, review accuracy, stage all pass artifacts together, then commit.
- Stated that the report is part of the pass and should normally be included in the same final commit it documents.
- Added `PENDING FINAL COMMIT` for reports prepared before their final commit SHA exists, without requiring a later report-only commit to backfill the SHA.
- Prohibited silent historical amendments and preserved final-chat SHA reporting.
- Added `Non-Commit Passes`, retaining mandatory reporting and `NOT COMMITTED` status when no commit is requested.
- Commit-oriented work → checks complete → report and index created → all pass artifacts staged together → one final commit → no recursive report-only tail.

# 4. WHAT IS REAL NOW

The standing instruction explicitly places report generation and index maintenance before the final commit in commit-oriented passes. It also distinguishes non-commit passes and permits an accurate provisional status when the final SHA does not yet exist.

All existing requirements for timestamped standalone reports, non-overwrite behavior, twelve required sections, evidence calibration, testing distinctions, chronological indexing, and failed or incomplete pass reporting remain present.

# 5. WHAT IS STILL MISSING

- No automated check enforces the documented ordering.
- The earlier `2026-08-24_1017_commit-standing-post-pass-reporting.md` report and its index entry remain uncommitted; this repair does not retroactively amend or commit them.

# 6. WHAT IS FAKE, PLACEHOLDER, OR PROVISIONAL

None identified in this pass.

# 7. TESTING PERFORMED

## Structural checks

- Inspected the changed section 11 in full.
- Searched `AGENTS.md` for commit/report ordering language that could contradict the new sequence.
- Verified that the twelve required report sections and existing reporting invariants remain present.
- Reviewed the scoped diff and working-tree status to distinguish this pass from pre-existing unrelated edits.
- Verified all three indexed report link targets exist.

## Behavioral checks

- None. This is a documentation/process repair; no application runtime behavior was tested.

# 8. TEST RESULTS

- Structural review confirms report and index creation now precede staging and the final commit.
- `PENDING FINAL COMMIT` closes the SHA-timing gap without requiring another commit solely for metadata backfill.
- Non-commit passes still require reports with `NOT COMMITTED` status.
- No contradictory report-after-commit rule was identified in `AGENTS.md`.
- No application tests were run.

# 9. IMPORTANT UNCERTAINTIES

- The workflow remains instruction-driven rather than mechanically enforced.
- A user may request multiple intermediate commits within one broader pass; the instruction defines the final pass commit but does not prescribe a report for every intermediate commit.

# 10. RECOMMENDED NEXT EXPERIMENT

- **NEXT:** Current claim: one pre-commit report closes the recursive tail → biggest uncertainty: agents follow the ordering consistently → minimum experiment: use the repaired sequence for the next explicitly requested commit pass → observable result: substantive changes, report, and index land together in one commit with no new report-only residue.

# 11. FILES MODIFIED

- `AGENTS.md`
- `docs/pass-reports/README.md`
- `docs/pass-reports/2026-08-24_1022_repair-commit-report-ordering.md`

# 12. COMMIT STATUS

`NOT COMMITTED`
