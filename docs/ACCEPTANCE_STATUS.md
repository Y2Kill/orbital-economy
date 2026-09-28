# v7.7.5 Acceptance Status

**Status:** ACCEPTED — 2026-09-28, `orbital_economy_v7_7_5_r1_modeljson.json` (SHA `b0b60e63…`).

v7.7.5 puts **regolith extraction on simple capital**: each colony has a regolith mine — one capacity stock, expanded from capital goods and construction materials toward a desired capacity sized from a new smoothed regolith demand-signal stock, with depreciation and retirement of the excess. It is the first sector generated from a node declaration (`model/nodes/regolith-mine.json`, type `simple_capital`): the executor delivered the declaration in the `nodes` section of the patch, and only the scenario wiring was hand-written. In Mode 39 colony B rebuilds its mine during the transport surge. Model step under the Planet v1 counter (`PLANET_V1_CONTRACT_RU.md`, P2 exceptions 6 → 4). Delivered by the repository agent through `candidate.yml` (task 017), accepted in round 1 after two validation revisions; the agent's model is identical to our skeleton. Record: `tasks/017-regolith-capital/`.

## Candidate gates (accepted v7.7.4 r1 → candidate v7.7.5, canonical platform)

```text
APPLY_PATCH             candidate SHA 2f7c7e46…  (identical on Linux CI and Windows; node declaration expanded by the bench)
LIFECYCLE_CONFORMANCE   PASS  (11 kernel instances; A/B Regolith Mine simple_capital CONFORMING 23/23)
STRUCTURE_AUDIT         PASS  (211 flows / 168 boundary, unclassified 0, closed-world 0, pairs 21, symmetry mismatches 0;
                              algebraic loops 0 of 2048 combinations; planet closure P2 = 11/2/4/0)
RUN_TESTS               OVERALL: PASS  (Modes 0-39, 40/40; 9291 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED
  Modes 0-37: 38 × common=1244, changed=0, added=34, maxAbs=0
  POLICY RESULT: PASS  (observed 1451; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-39, 40/40)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 40 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 40 Modes
Parameter registry      413 external values, 239 annotated, 50 asymmetric A/B pairs, 0 unannotated
Bench self-tests        QA 32/32, node 15/15, planet 16/16, loop 15/15, structure 21/21, conformance 18/18, compare PASS, policy 10/10
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_5_r1_modeljson.json ..\validation\validation-v7.7.5.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.4\model\orbital_economy_v7_7_4_r1_modeljson.json ..\model\orbital_economy_v7_7_5_r1_modeljson.json ..\docs\tasks\017-regolith-capital\candidate\validation.json ..\docs\tasks\017-regolith-capital\candidate\change-policy.json all
node --expose-gc src\cli.js series --modes=all --out=output\series
cd ..
node tools\verify_series.mjs lab\output\series\series-digest.json
```

## Previous acceptances

- **v7.7.4 r1** (2026-09-27) — Capital Goods Capital, task 014; artefacts in `reference/v7.7.4/`, tag `v7.7.4-r1`.
- **v7.7.3 r1** (2026-09-27) — Construction Materials Capital, task 013; tag `v7.7.3-r1`.
- **v7.7.2 r1** (2026-09-27) — Construction Materials use Energy, task 012; tag `v7.7.2-r1`.
- **v7.7.1 r1** (2026-09-26) — Transport on Construction Materials, task 009; tag `v7.7.1-r1`.
- **v7.7 r1** (2026-09-26) — Construction Materials, task 008; tag `v7.7-r1`.
- **v7.6.1 r1** (2026-09-25) — Mode 25 calibration; tag `v7.6.1-r1`.
- **v7.6 r2** (2026-09-25) — Energy Kernel v2; tag `v7.6-r2`.
