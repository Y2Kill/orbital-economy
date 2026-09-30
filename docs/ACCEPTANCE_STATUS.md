# v7.7.7 Acceptance Status

**Status:** ACCEPTED — 2026-09-30, `orbital_economy_v7_7_7_r1_modeljson.json` (SHA `befccae9…`).

v7.7.7 gives **energy-resource extraction a mine on simple capital**. The extraction rate had no capacity at all, so the bench first learned to cap an uncapped rate smoothly (task 020, Lab v0.9.11): the old rate is kept verbatim as `X Power Resource Mine Uncapped Output`, and with the switch on it is capped by the mine capacity with the ore-mining saturation form. The two-day inventory buffer absorbs most of the cap; in Mode 43 colony B rebuilds its mine during the transport surge. **Planet v1 P2 is closed** (kernel 11 / simple 6 / exceptions 0): every production capacity in the model is capital. Delivered by the repository agent through `candidate.yml` (task 021), accepted in round 1: declaration and validation byte-identical to the owner drafts, model identical to our skeleton. Record: `tasks/021-power-resource-capital/`.

## Candidate gates (accepted v7.7.6 r1 → candidate v7.7.7, canonical platform)

```text
APPLY_PATCH             candidate SHA 8d3ddb4a…  (node declaration in smooth-cap mode expanded by the bench)
LIFECYCLE_CONFORMANCE   PASS  (11 kernel instances; 6 simple_capital instances CONFORMING 23/23)
STRUCTURE_AUDIT         PASS  (239 flows / 196 boundary, unclassified 0, closed-world 0, pairs 25, symmetry mismatches 0;
                              algebraic loops 0 of 8192 combinations; planet closure P2 = 11/6/0/0)
RUN_TESTS               OVERALL: PASS  (Modes 0-43, 44/44; 11531 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED
  Modes 0-41: 42 × common=1312, changed=0, added=36, maxAbs=0
  POLICY RESULT: PASS  (observed 1693; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-43, 44/44)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 44 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 44 Modes
Parameter registry      437 external values, 263 annotated, 53 asymmetric A/B pairs, 0 unannotated
Bench self-tests        QA 42/42, node 21/21, planet 16/16, loop 15/15, structure 21/21, conformance 18/18, compare PASS, policy 10/10 — no changes needed at promotion
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_7_r1_modeljson.json ..\validation\validation-v7.7.7.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.6\model\orbital_economy_v7_7_6_r1_modeljson.json ..\model\orbital_economy_v7_7_7_r1_modeljson.json ..\docs\tasks\021-power-resource-capital\candidate\validation.json ..\docs\tasks\021-power-resource-capital\candidate\change-policy.json all
node --expose-gc src\cli.js series --modes=all --out=output\series
cd ..
node tools\verify_series.mjs lab\output\series\series-digest.json
```

## Previous acceptances

- **v7.7.6 r1** (2026-09-29) — Ore Capital, task 019; artefacts in `reference/v7.7.6/`, tag `v7.7.6-r1`.
- **v7.7.5 r1** (2026-09-28) — Regolith Capital, task 017; tag `v7.7.5-r1`.
- **v7.7.4 r1** (2026-09-27) — Capital Goods Capital, task 014; tag `v7.7.4-r1`.
- **v7.7.3 r1** (2026-09-27) — Construction Materials Capital, task 013; tag `v7.7.3-r1`.
- **v7.7.2 r1** (2026-09-27) — Construction Materials use Energy, task 012; tag `v7.7.2-r1`.
- **v7.7.1 r1** (2026-09-26) — Transport on Construction Materials, task 009; tag `v7.7.1-r1`.
- **v7.7 r1** (2026-09-26) — Construction Materials, task 008; tag `v7.7-r1`.
- **v7.6.1 r1** (2026-09-25) — Mode 25 calibration; tag `v7.6.1-r1`.
- **v7.6 r2** (2026-09-25) — Energy Kernel v2; tag `v7.6-r2`.
