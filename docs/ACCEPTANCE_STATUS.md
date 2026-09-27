# v7.7.3 Acceptance Status

**Status:** ACCEPTED — 2026-09-27, `orbital_economy_v7_7_3_r1_modeljson.json` (SHA `a620cc65…`).

v7.7.3 puts **construction-materials capacity on capital**: each colony has a construction-materials plant on the capital lifecycle kernel (kernel-v2, no finance limit, as Power), sized to the smoothed demand signal and expanded from capital goods and construction materials. Sizing it from the production plan closed an algebraic loop, found by the loop audit on our first skeleton. Second model step under the Planet v1 counter (`PLANET_V1_CONTRACT_RU.md`, P2: 7 → 9 processes on capital). Delivered by the repository agent through `candidate.yml` (task 013), accepted in round 1; the agent's model is identical to our skeleton. Record: `tasks/013-construction-materials-capital/`.

## Candidate gates (accepted v7.7.2 r1 → candidate v7.7.3, canonical platform)

```text
APPLY_PATCH             candidate SHA 766b87a6…  (identical on Linux CI and Windows)
LIFECYCLE_CONFORMANCE   PASS  (9 instances; A/B Construction Materials Plant CONFORMING_WITH_VARIATION)
STRUCTURE_AUDIT         PASS  (175 flows / 138 boundary, unclassified 0, closed-world 0, pairs 17, symmetry mismatches 0;
                              algebraic loops 0 of 512 combinations; planet closure P2 = 9/8/0)
RUN_TESTS               OVERALL: PASS  (Modes 0-35, 36/36; 6912 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED
  Modes 0-33: 34 × common=1099, changed=0, added=69, maxAbs=0
  POLICY RESULT: PASS  (observed 2584; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-35, 36/36)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 36 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 36 Modes
Parameter registry      379 external values, 209 annotated, 47 asymmetric A/B pairs, 0 unannotated
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_3_r1_modeljson.json ..\validation\validation-v7.7.3.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.2\model\orbital_economy_v7_7_2_r1_modeljson.json ..\model\orbital_economy_v7_7_3_r1_modeljson.json ..\docs\tasks\013-construction-materials-capital\candidate\validation.json ..\docs\tasks\013-construction-materials-capital\candidate\change-policy.json all
node --expose-gc src\cli.js series --modes=all --out=output\series
cd ..
node tools\verify_series.mjs lab\output\series\series-digest.json
```

## Previous acceptances

- **v7.7.2 r1** (2026-09-27) — Construction Materials use Energy, task 012; artefacts in `reference/v7.7.2/`, tag `v7.7.2-r1`.
- **v7.7.1 r1** (2026-09-26) — Transport on Construction Materials, task 009; tag `v7.7.1-r1`.
- **v7.7 r1** (2026-09-26) — Construction Materials, task 008; tag `v7.7-r1`.
- **v7.6.1 r1** (2026-09-25) — Mode 25 calibration; tag `v7.6.1-r1`.
- **v7.6 r2** (2026-09-25) — Energy Kernel v2; tag `v7.6-r2`.
