# v7.7.2 Acceptance Status

**Status:** ACCEPTED — 2026-09-27, `orbital_economy_v7_7_2_r1_modeljson.json` (SHA `9bd5c956…`).

v7.7.2 makes **construction materials use energy**: regolith processing is the third consumer of each colony's energy allocator, next to smelting and electronics. The plan that feeds the allocator reads a smoothed demand-signal stock; same-step demand closed an algebraic loop through refinery profit, found by the loop audit on our first skeleton. First model step under the Planet v1 counter (`PLANET_V1_CONTRACT_RU.md`, P3: 4 → 6 processes requesting energy). Delivered by the repository agent through `candidate.yml` (task 012), accepted in round 1; the agent's model is identical to our skeleton. Record: `tasks/012-construction-materials-energy/`.

## Candidate gates (accepted v7.7.1 r1 → candidate v7.7.2, canonical platform)

```text
APPLY_PATCH             candidate SHA a993dbb5…  (identical on Linux CI and Windows)
LIFECYCLE_CONFORMANCE   PASS
STRUCTURE_AUDIT         PASS  (157 flows / 126 boundary, unclassified 0, closed-world 0, symmetry mismatches 0;
                              algebraic loops 0 of 256 combinations; planet closure P3 = 6/2/9/0)
RUN_TESTS               OVERALL: PASS  (Modes 0-33, 34/34; 5702 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED
  Modes 0-31: 32 × common=1082, changed=0, added=17, maxAbs=0
  POLICY RESULT: PASS  (observed 662; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-33, 34/34)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 34 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 34 Modes
Parameter registry      360 external values, 194 annotated, 45 asymmetric A/B pairs, 0 unannotated
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_2_r1_modeljson.json ..\validation\validation-v7.7.2.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.1\model\orbital_economy_v7_7_1_r1_modeljson.json ..\model\orbital_economy_v7_7_2_r1_modeljson.json ..\docs\tasks\012-construction-materials-energy\candidate\validation.json ..\docs\tasks\012-construction-materials-energy\candidate\change-policy.json all
node --expose-gc src\cli.js series --modes=all --out=output\series
cd ..
node tools\verify_series.mjs lab\output\series\series-digest.json
```

## Previous acceptances

- **v7.7.1 r1** (2026-09-26) — Transport on Construction Materials, task 009; artefacts in `reference/v7.7.1/`, tag `v7.7.1-r1`.
- **v7.7 r1** (2026-09-26) — Construction Materials, task 008; tag `v7.7-r1`.
- **v7.6.1 r1** (2026-09-25) — Mode 25 calibration; tag `v7.6.1-r1`.
- **v7.6 r2** (2026-09-25) — Energy Kernel v2; tag `v7.6-r2`.
