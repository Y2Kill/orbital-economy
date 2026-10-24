# v7.7.19 Acceptance Status

**Status:** ACCEPTED — 2026-10-24, `orbital_economy_v7_7_19_r1_modeljson.json` (SHA `d59c1aa0…`).

v7.7.19 is the **nominal anchor** (owner decision 2026-10-23; long runs `research/LONGRUN_V7_7_18_2026-10-23_RU.md`, prototypes `research/NOMINAL_ANCHOR_2026-10-23_RU.md`).

**Why.** On cost prices v7.7.18 showed a nominal deflation without a floor:
- the wage drifted whenever labor tightness was off its target 0.95, and labor demand did not depend on the wage;
- cost prices followed the wage down.

**What changes.** Labor demand now follows the wage with elasticity 1.5: `{C} Total Labor Requirement` × (wage / initial wage)^(−1.5) under `Labor Market Enabled` (Lab v0.9.23, `model/nodes/labor_market.json`). Cheaper labor puts more people on a unit of output, so employment and tightness rise and the wage stops drifting.

**Prototypes, 80 years.** Drift per decade fell from −2.4 / −3.2 % to +0.7 / −0.5 %. Employment is 0.96 / 0.94, real wages rise, region B develops; the cost is a shift of people from A to B. A nominal wage norm was rejected: it froze B's high starting wage and stalled region B.

**Modes.**
- Modes 0–51 run without the labor market and reproduce v7.7.18 r1 bit for bit.
- Modes 52–59 change.
- Two Mode 55 checks were rebased on the new Mode 53 levels; three checks of the mechanism were added: B labor demand and employment are higher in Modes 52–53.

**Delivery.** The bench first learned the optional elasticity (task 044, Lab v0.9.23, three rounds). Delivered by the repository agent (task 045), accepted in round 1:
- model identical to our skeleton;
- validation byte-identical and policy rules identical to the owner drafts;
- `candidate.yml` 5/5 and `ci.yml` green.

Record: `tasks/045-nominal-anchor/`.

## Candidate gates (accepted v7.7.18 r1 → candidate v7.7.19, canonical platform)

```text
APPLY_PATCH             candidate SHA 8ef833c4…  (1 parameter, 2 replacements, 8 links; fingerprint 4aa09d6a1d73caa3)
LIFECYCLE_CONFORMANCE   PASS  (11 kernel; 6 simple_capital; 6 deposit; 17 labor; 2 population; 2 food; 2 labor_market; 2 wage_pricing; 2 cost_pricing; 2 money instances CONFORMING)
STRUCTURE_AUDIT         PASS  (363 flows / 302 boundary, unclassified 0, closed-world 0, pairs 27, symmetry mismatches 0;
                              algebraic loops 0 of 1048576 combinations; planet closure in planet_v1 mode PASS:
                              P2 = 11/8/0/0, P3 = 16/2/1/0, P4 = 6/0, P5 = 19/0, P6 = 4 per-capita norms)
RUN_TESTS               OVERALL: PASS  (Modes 0-59, 60/60; 29232 checks)
CHECK_CANDIDATE (executor's change policy)
  Modes 0-51: 52 x IDENTICAL (labor market off); Modes 52-59: 1151вЂ“1205 series changed per Mode
  POLICY RESULT: PASS  (observed 9580; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-59, 60/60)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 60 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 60 Modes
Parameter registry      628 external values, 453 annotated, 88 asymmetric A/B pairs, 0 unannotated
Bench self-tests        QA 50/50, node 94/94, planet 20/20, loop 19/19, structure 21/21, conformance 18/18, compare PASS, policy 10/10 — no changes needed at promotion
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_19_r1_modeljson.json ..\validation\validation-v7.7.19.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.18\model\orbital_economy_v7_7_18_r1_modeljson.json ..\model\orbital_economy_v7_7_19_r1_modeljson.json ..\docs\tasks\045-nominal-anchor\candidate\validation.json ..\docs\tasks\045-nominal-anchor\candidate\change-policy.json all
```

## Previous acceptances

- **v7.7.18 r1** (2026-10-19) — Recalibration onto Cost Prices, task 043; artefacts in `reference/v7.7.18/`, tag `v7.7.18-r1`.
- **v7.7.17 r1** (2026-10-18) — Money, task 041; tag `v7.7.17-r1`.
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
