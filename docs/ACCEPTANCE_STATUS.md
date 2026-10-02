# v7.7.8 Acceptance Status

**Status:** ACCEPTED — 2026-10-02, `orbital_economy_v7_7_8_r1_modeljson.json` (SHA `17794e6c…`).

v7.7.8 makes every extraction — ore, regolith, the energy resource — **draw from proven reserves**, which **capital-backed exploration** replenishes from a planetary-scale undiscovered resource (owner decision 2026-09-30: deposits are proven, not total reserves, and can grow as well as shrink). The bench first learned a `deposit` node type and to re-source a flow from ∅ to a stock (task 022, Lab v0.9.12); one deposit node covers all three resources with one switch, `Deposits Enabled`. In the transport surge exploration competes with construction for capital goods in colony B. **Planet v1 P4 is closed** (6/0); with P2 closed in v7.7.7, every production capacity is capital and every extraction draws from a declared deposit. Delivered by the repository agent through `candidate.yml` (task 023), accepted in round 1: declaration and validation byte-identical to the owner drafts, model identical to our skeleton. Record: `tasks/023-deposits/`.

## Candidate gates (accepted v7.7.7 r1 → candidate v7.7.8, canonical platform)

```text
APPLY_PATCH             candidate SHA 9d1d0ff9…  (deposit node expanded by the bench, extraction flows re-sourced)
LIFECYCLE_CONFORMANCE   PASS  (11 kernel; 6 simple_capital; 6 deposit instances CONFORMING)
STRUCTURE_AUDIT         PASS  (263 flows / 208 boundary, unclassified 0, closed-world 0, pairs 25, symmetry mismatches 0;
                              algebraic loops 0 of 16384 combinations; planet closure P2 = 11/6/0/0, P4 = 6/0)
RUN_TESTS               OVERALL: PASS  (Modes 0-45, 46/46; 13600 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED
  Modes 0-43: 44 × common=1348, changed=0, added=100, maxAbs=0
  POLICY RESULT: PASS  (observed 4773; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-45, 46/46)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 46 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 46 Modes
Parameter registry      471 external values, 297 annotated, 61 asymmetric A/B pairs, 0 unannotated
Bench self-tests        QA 42/42, node 27/27, planet 16/16, loop 15/15, structure 21/21, conformance 18/18, compare PASS, policy 10/10 — no changes needed at promotion
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_8_r1_modeljson.json ..\validation\validation-v7.7.8.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.7\model\orbital_economy_v7_7_7_r1_modeljson.json ..\model\orbital_economy_v7_7_8_r1_modeljson.json ..\docs\tasks\023-deposits\candidate\validation.json ..\docs\tasks\023-deposits\candidate\change-policy.json all
node --expose-gc src\cli.js series --modes=all --out=output\series
cd ..
node tools\verify_series.mjs lab\output\series\series-digest.json
```

## Previous acceptances

- **v7.7.7 r1** (2026-09-30) — Power Resource Capital, task 021; artefacts in `reference/v7.7.7/`, tag `v7.7.7-r1`.
- **v7.7.6 r1** (2026-09-29) — Ore Capital, task 019; tag `v7.7.6-r1`.
- **v7.7.5 r1** (2026-09-28) — Regolith Capital, task 017; tag `v7.7.5-r1`.
- **v7.7.4 r1** (2026-09-27) — Capital Goods Capital, task 014; tag `v7.7.4-r1`.
- **v7.7.3 r1** (2026-09-27) — Construction Materials Capital, task 013; tag `v7.7.3-r1`.
- **v7.7.2 r1** (2026-09-27) — Construction Materials use Energy, task 012; tag `v7.7.2-r1`.
- **v7.7.1 r1** (2026-09-26) — Transport on Construction Materials, task 009; tag `v7.7.1-r1`.
- **v7.7 r1** (2026-09-26) — Construction Materials, task 008; tag `v7.7-r1`.
- **v7.6.1 r1** (2026-09-25) — Mode 25 calibration; tag `v7.6.1-r1`.
- **v7.6 r2** (2026-09-25) — Energy Kernel v2; tag `v7.6-r2`.
