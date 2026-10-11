# v7.7.14 Acceptance Status

**Status:** ACCEPTED — 2026-10-11, `orbital_economy_v7_7_14_r1_modeljson.json` (SHA `bbb4f9ea…`).

v7.7.14 is a **recalibration** after the sensitivity study of v7.7.13 (`research/SENSITIVITY_2026-10-10_RU.md`: 352 constants over 3 years, 62 over 20 years; 27 matter in the long run). Two values sat on a threshold — a deviation one way changed almost nothing, the other way changed the picture sharply — and the owner moved both off it (decisions 2026-10-11):
- `Power Operating Reserve Factor` 1.02 → **1.10** — the thinnest reserve in the model (refinery 1.10, transport 1.15);
- `Labor Participation Share` 0.50 → **0.52** — A off the labor-shortage edge, chosen on 80-year runs;
- the labor demand signal starts at initial population × participation (A 14.56, B 4.42), as the `labor_market` node generates it;
- `Target Labor Tightness` stays 0.95 and is annotated as the key long-run wage parameter.

No structural change. Series move in every Mode, so **no Mode reproduces v7.7.13 r1** (`regression_modes` = []): the exact-regression chain that ran from v7.7.0 ends here, later steps are compared against v7.7.14. The change policy allowed every series to change and nothing structural, and required the four definitions to change; 16 checks of earlier tasks were re-thresholded (`tasks/035-recalibration/V7_7_14_RECALIBRATION_SPEC.md` §4). Delivered by the repository agent through `candidate.yml` (task 035), accepted in round 1: model equal to our skeleton, validation byte-identical to the owner draft. Record: `tasks/035-recalibration/`.

## Candidate gates (accepted v7.7.13 r1 → candidate v7.7.14, canonical platform)

```text
APPLY_PATCH             candidate SHA 8a32184b…  (4 replace_formulas; equal to the owner skeleton except the name)
LIFECYCLE_CONFORMANCE   PASS  (11 kernel; 6 simple_capital; 6 deposit; 17 labor; 2 population; 2 food; 2 labor_market instances CONFORMING)
STRUCTURE_AUDIT         PASS  (323 flows / 262 boundary, unclassified 0, closed-world 0, pairs 27, symmetry mismatches 0;
                              algebraic loops 0 of 131072 combinations; planet closure in planet_v1 mode PASS:
                              P2 = 11/8/0/0, P3 = 16/2/1/0, P4 = 6/0, P5 = 19/0, P6 = 4 per-capita norms)
RUN_TESTS               OVERALL: PASS  (Modes 0-53, 54/54; 22490 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: DIFFERENT_OUTPUTS
  POLICY RESULT: PASS  (observed 39839; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-53, 54/54)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 54 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 54 Modes
Parameter registry      582 external values, 403 annotated, 71 asymmetric A/B pairs, 0 unannotated
Bench self-tests        QA 47/47, node 59/59, planet 20/20, loop 19/19, structure 21/21, conformance 18/18, compare PASS, policy 10/10 — no changes needed at promotion
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_14_r1_modeljson.json ..\validation\validation-v7.7.14.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.13\model\orbital_economy_v7_7_13_r1_modeljson.json ..\model\orbital_economy_v7_7_14_r1_modeljson.json ..\docs\tasks\035-recalibration\candidate\validation.json ..\docs\tasks\035-recalibration\candidate\change-policy.json all
```

## Previous acceptances

- **v7.7.13 r1** (2026-10-10) — Labor Market, task 034; artefacts in `reference/v7.7.13/`, tag `v7.7.13-r1`.
- **v7.7.12 r1** (2026-10-09) — Food, task 032; tag `v7.7.12-r1`.
- **v7.7.11 r1** (2026-10-05) — Population, task 030; tag `v7.7.11-r1`.
- **v7.7.10 r1** (2026-10-04) — Labor, task 028; Planet v1 closed; tag `v7.7.10-r1`.
- **v7.7.9 r1** (2026-10-03) — Process Energy, task 026; tag `v7.7.9-r1`.
- **v7.7.8 r1** (2026-10-02) — Deposits, task 023; tag `v7.7.8-r1`.
- **v7.7.7 r1** (2026-09-30) — Power Resource Capital, task 021; tag `v7.7.7-r1`.
- **v7.7.6 r1** (2026-09-29) — Ore Capital, task 019; tag `v7.7.6-r1`.
- **v7.7.5 r1** (2026-09-28) — Regolith Capital, task 017; tag `v7.7.5-r1`.
- **v7.7.4 r1** (2026-09-27) — Capital Goods Capital, task 014; tag `v7.7.4-r1`.
- **v7.7.3 r1** (2026-09-27) — Construction Materials Capital, task 013; tag `v7.7.3-r1`.
- **v7.7.2 r1** (2026-09-27) — Construction Materials use Energy, task 012; tag `v7.7.2-r1`.
- **v7.7.1 r1** (2026-09-26) — Transport on Construction Materials, task 009; tag `v7.7.1-r1`.
- **v7.7 r1** (2026-09-26) — Construction Materials, task 008; tag `v7.7-r1`.
- **v7.6.1 r1** (2026-09-25) — Mode 25 calibration; tag `v7.6.1-r1`.
- **v7.6 r2** (2026-09-25) — Energy Kernel v2; tag `v7.6-r2`.
