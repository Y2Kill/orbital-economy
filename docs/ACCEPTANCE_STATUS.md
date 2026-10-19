# v7.7.18 Acceptance Status

**Status:** ACCEPTED — 2026-10-19, `orbital_economy_v7_7_18_r1_modeljson.json` (SHA `43034a28…`).

v7.7.18 is the **recalibration onto cost prices** (owner decision 2026-10-18, option A; experiments `research/RECALIBRATION_PREP_2026-10-18_RU.md`):
- `Cost Pricing Enabled` = 1 in every Mode, `Money Enabled` = 1 in the full Modes 52–55 (and 58–59, as before). Money stays out of the ladder Modes 0–48: its equilibrium start belongs to the full economy, and there it would choke region B;
- the cost terms of `cost_pricing` are gated by the switches of their physical layers (Lab v0.9.22, task 042). Without gates the full cost counted the power resource, process energy and capital wear in Modes without those layers: 50 failing checks in Modes 0–24 and dead surge responses;
- the demand reference prices of wage pricing are recalibrated to cost prices (old × the cost scale of the good); before, price demand cut the demand of Modes 54–55 by a third.

Modes 56–59 keep their inputs and every gate is 1 there, so they reproduce v7.7.17 r1 bit for bit except 8 series nothing reads (demand references of wage pricing and their price demand factors). Modes 0–55 change by design.

Behavior:
- the price level is about ×2 with the same shock mechanisms;
- in Mode 21 region B no longer contracts: it spends its starting capital goods on power, then builds nothing;
- in the surges region B wins fewer orders: its cost price carries its wage;
- Modes 52–55 behave like 58–59;
- Modes 54–55 are nearly equal to 52–53: next to household budgets, wage pricing adds little.

61 checks of earlier tasks were rebased on the new levels with the same factors. This includes passing ones that would have tested nothing on cost prices. 9 money checks were added to Modes 52–53.

The bench first learned layer gates (task 042, Lab v0.9.22, three rounds). Delivered by the repository agent (task 043), accepted in round 1:
- model identical to our skeleton;
- validation byte-identical and policy rules identical to the owner drafts;
- five annotations updated;
- `candidate.yml` 5/5 and `ci.yml` green.

Record: `tasks/043-recalibration/`.

## Candidate gates (accepted v7.7.17 r1 → candidate v7.7.18, canonical platform)

```text
APPLY_PATCH             candidate SHA 80a03e92…  (24 replacements, 64 links, 56 scenario edits; fingerprint 024f99393d36e71e)
LIFECYCLE_CONFORMANCE   PASS  (11 kernel; 6 simple_capital; 6 deposit; 17 labor; 2 population; 2 food; 2 labor_market; 2 wage_pricing; 2 cost_pricing; 2 money instances CONFORMING)
STRUCTURE_AUDIT         PASS  (363 flows / 302 boundary, unclassified 0, closed-world 0, pairs 27, symmetry mismatches 0;
                              algebraic loops 0 of 1048576 combinations; planet closure in planet_v1 mode PASS:
                              P2 = 11/8/0/0, P3 = 16/2/1/0, P4 = 6/0, P5 = 19/0, P6 = 4 per-capita norms)
RUN_TESTS               OVERALL: PASS  (Modes 0-59, 60/60; 29229 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: DIFFERENT (a recalibration)
  Modes 56-59: changed only the 8 dead demand-reference series; Modes 0-55: 707вЂ“1263 series changed per Mode
  POLICY RESULT: PASS  (observed 56506; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-59, 60/60)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 60 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 60 Modes
Parameter registry      627 external values, 452 annotated, 88 asymmetric A/B pairs, 0 unannotated
Bench self-tests        QA 50/50, node 87/87, planet 20/20, loop 19/19, structure 21/21, conformance 18/18, compare PASS, policy 10/10 — no changes needed at promotion
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_18_r1_modeljson.json ..\validation\validation-v7.7.18.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.17\model\orbital_economy_v7_7_17_r1_modeljson.json ..\model\orbital_economy_v7_7_18_r1_modeljson.json ..\docs\tasks\043-recalibration\candidate\validation.json ..\docs\tasks\043-recalibration\candidate\change-policy.json all
```

## Previous acceptances

- **v7.7.17 r1** (2026-10-18) — Money, task 041; artefacts in `reference/v7.7.17/`, tag `v7.7.17-r1`.
- **v7.7.16 r1** (2026-10-17) — Cost Pricing, task 039; tag `v7.7.16-r1`.
- **v7.7.15 r1** (2026-10-16) — Wage Pricing, task 037; tag `v7.7.15-r1`.
- **v7.7.14 r1** (2026-10-11) — Recalibration, task 035; tag `v7.7.14-r1`.
- **v7.7.13 r1** (2026-10-10) — Labor Market, task 034; tag `v7.7.13-r1`.
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
