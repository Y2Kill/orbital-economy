# v7.7.4 Acceptance Status

**Status:** ACCEPTED — 2026-09-27, `orbital_economy_v7_7_4_r1_modeljson.json` (SHA `8a71fe66…`).

v7.7.4 puts **capital-goods production capacity on capital**: each colony has a capital-goods plant on the capital lifecycle kernel, like the v7.7.3 construction-materials plant, sized to a new smoothed capital-goods demand-signal stock. The former hard ceiling on all construction (A 2, B 1 per day) is gone: in Mode 36 A's plant grows past its starting capacity. Third model step under the Planet v1 counter (`PLANET_V1_CONTRACT_RU.md`, P2: 9 → 11 processes on capital). Delivered by the repository agent through `candidate.yml` (task 014), accepted in round 1 after three validation revisions; the agent's model is identical to our skeleton. Record: `tasks/014-capital-goods-capital/`.

## Candidate gates (accepted v7.7.3 r1 → candidate v7.7.4, canonical platform)

```text
APPLY_PATCH             candidate SHA b5c12954…  (identical on Linux CI and Windows)
LIFECYCLE_CONFORMANCE   PASS  (11 instances; A/B Capital Goods Plant CONFORMING_WITH_VARIATION)
STRUCTURE_AUDIT         PASS  (197 flows / 154 boundary, unclassified 0, closed-world 0, pairs 19, symmetry mismatches 0;
                              algebraic loops 0 of 1024 combinations; planet closure P2 = 11/6/0)
RUN_TESTS               OVERALL: PASS  (Modes 0-37, 38/38; 8219 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED
  Modes 0-35: 36 × common=1168, changed=0, added=76, maxAbs=0
  POLICY RESULT: PASS  (observed 2995; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-37, 38/38)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 38 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 38 Modes
Parameter registry      401 external values, 227 annotated, 49 asymmetric A/B pairs, 0 unannotated
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_4_r1_modeljson.json ..\validation\validation-v7.7.4.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.3\model\orbital_economy_v7_7_3_r1_modeljson.json ..\model\orbital_economy_v7_7_4_r1_modeljson.json ..\docs\tasks\014-capital-goods-capital\candidate\validation.json ..\docs\tasks\014-capital-goods-capital\candidate\change-policy.json all
node --expose-gc src\cli.js series --modes=all --out=output\series
cd ..
node tools\verify_series.mjs lab\output\series\series-digest.json
```

## Previous acceptances

- **v7.7.3 r1** (2026-09-27) — Construction Materials Capital, task 013; artefacts in `reference/v7.7.3/`, tag `v7.7.3-r1`.
- **v7.7.2 r1** (2026-09-27) — Construction Materials use Energy, task 012; tag `v7.7.2-r1`.
- **v7.7.1 r1** (2026-09-26) — Transport on Construction Materials, task 009; tag `v7.7.1-r1`.
- **v7.7 r1** (2026-09-26) — Construction Materials, task 008; tag `v7.7-r1`.
- **v7.6.1 r1** (2026-09-25) — Mode 25 calibration; tag `v7.6.1-r1`.
- **v7.6 r2** (2026-09-25) — Energy Kernel v2; tag `v7.6-r2`.
