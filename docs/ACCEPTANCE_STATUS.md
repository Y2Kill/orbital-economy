# v7.7.6 Acceptance Status

**Status:** ACCEPTED — 2026-09-29, `orbital_economy_v7_7_6_r1_modeljson.json` (SHA `d274f7b9…`).

v7.7.6 puts **ore mining on simple capital**: each colony has an ore mine (start A 70, B 28), the same `simple_capital` node type as the v7.7.5 regolith mine, sized from a smoothed ore demand-signal stock and expanded from capital goods and construction materials. It nests over the regolith mine on the capital-goods and construction-materials demand formulas. After this step no process runs on a constant capacity; the energy resource (unbounded extraction) is the last Planet v1 P2 exception. Delivered by the repository agent through `candidate.yml` (task 019), accepted in round 1: the declaration and validation were delivered byte-identical to the owner drafts, and the model is identical to our skeleton. Record: `tasks/019-ore-capital/`.

## Candidate gates (accepted v7.7.5 r1 → candidate v7.7.6, canonical platform)

```text
APPLY_PATCH             candidate SHA ec7ff050…  (identical on Linux CI and Windows; node declaration expanded by the bench)
LIFECYCLE_CONFORMANCE   PASS  (11 kernel instances; 4 simple_capital instances CONFORMING 23/23)
STRUCTURE_AUDIT         PASS  (225 flows / 182 boundary, unclassified 0, closed-world 0, pairs 23, symmetry mismatches 0;
                              algebraic loops 0 of 4096 combinations; planet closure P2 = 11/4/2/0)
RUN_TESTS               OVERALL: PASS  (Modes 0-41, 42/42; 10342 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED
  Modes 0-39: 40 × common=1278, changed=0, added=34, maxAbs=0
  POLICY RESULT: PASS  (observed 1521; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-41, 42/42)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 42 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 42 Modes
Parameter registry      425 external values, 251 annotated, 51 asymmetric A/B pairs, 0 unannotated
Bench self-tests        QA 42/42, node 15/15, planet 16/16, loop 15/15, structure 21/21, conformance 18/18, compare PASS, policy 10/10 — no changes needed at promotion
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_6_r1_modeljson.json ..\validation\validation-v7.7.6.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.5\model\orbital_economy_v7_7_5_r1_modeljson.json ..\model\orbital_economy_v7_7_6_r1_modeljson.json ..\docs\tasks\019-ore-capital\candidate\validation.json ..\docs\tasks\019-ore-capital\candidate\change-policy.json all
node --expose-gc src\cli.js series --modes=all --out=output\series
cd ..
node tools\verify_series.mjs lab\output\series\series-digest.json
```

## Previous acceptances

- **v7.7.5 r1** (2026-09-28) — Regolith Capital, task 017; artefacts in `reference/v7.7.5/`, tag `v7.7.5-r1`.
- **v7.7.4 r1** (2026-09-27) — Capital Goods Capital, task 014; tag `v7.7.4-r1`.
- **v7.7.3 r1** (2026-09-27) — Construction Materials Capital, task 013; tag `v7.7.3-r1`.
- **v7.7.2 r1** (2026-09-27) — Construction Materials use Energy, task 012; tag `v7.7.2-r1`.
- **v7.7.1 r1** (2026-09-26) — Transport on Construction Materials, task 009; tag `v7.7.1-r1`.
- **v7.7 r1** (2026-09-26) — Construction Materials, task 008; tag `v7.7-r1`.
- **v7.6.1 r1** (2026-09-25) — Mode 25 calibration; tag `v7.6.1-r1`.
- **v7.6 r2** (2026-09-25) — Energy Kernel v2; tag `v7.6-r2`.
