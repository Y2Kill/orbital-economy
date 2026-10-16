# v7.7.15 Acceptance Status

**Status:** ACCEPTED — 2026-10-16, `orbital_economy_v7_7_15_r1_modeljson.json` (SHA `a5a23312…`).

v7.7.15 is **the finance layer, intermediate step: the wage enters prices** (owner decisions 2026-10-12; prototypes `research/FINANCE_PROTOTYPE_2026-10-12_RU.md`):
- ore, energy and food prices of each region follow its wage proportionally (declared labor shares, at most 1);
- final metal and electronics demand responds to its price (elasticity 0.5).

Household budgets on the present prices collapse the economy — the money circuit is not closed — so real income and wage pass-through come first and full money accounting follows.

Every replacement is wrapped by the switch `Wage Pricing Enabled`, so Modes 0–53 reproduce v7.7.14 r1 bit for bit. The new Modes:
- **Mode 54** — Mode 52 with wage pricing: B's ore, energy and food get cheaper as its wage falls;
- **Mode 55** — the transport surge with wage pricing: the labor guard bites less (A's availability down to 0.964 instead of 0.946) and the A metal price peaks lower (33.4 instead of 36.5).

Over 80 years (research) B smelts 7.8 instead of 1.7 and real incomes per head converge. The bench first learned a `wage_pricing` node type (task 036, Lab v0.9.19). Delivered by the repository agent through `candidate.yml` (task 037), accepted in round 1: model identical to our skeleton, declaration byte-identical and validation equal in value to the owner drafts, all new parameters annotated. Record: `tasks/037-wage-pricing/`.

## Candidate gates (accepted v7.7.14 r1 → candidate v7.7.15, canonical platform)

```text
APPLY_PATCH             candidate SHA 426ec607…  (wage_pricing node expanded by the bench; switch Wage Pricing Enabled; fingerprint f824db7010959d6d)
LIFECYCLE_CONFORMANCE   PASS  (11 kernel; 6 simple_capital; 6 deposit; 17 labor; 2 population; 2 food; 2 labor_market; 2 wage_pricing instances CONFORMING)
STRUCTURE_AUDIT         PASS  (323 flows / 262 boundary, unclassified 0, closed-world 0, pairs 27, symmetry mismatches 0;
                              algebraic loops 0 of 262144 combinations; planet closure in planet_v1 mode PASS:
                              P2 = 11/8/0/0, P3 = 16/2/1/0, P4 = 6/0, P5 = 19/0, P6 = 4 per-capita norms)
RUN_TESTS               OVERALL: PASS  (Modes 0-55, 56/56; 24669 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: COMMON_OUTPUTS_IDENTICAL_WITH_NEW_MODES
  Modes 0-53: 54 × common=1764, changed=0, added=18, maxAbs=0
  POLICY RESULT: PASS  (observed 1045; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-55, 56/56)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 56 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 56 Modes
Parameter registry      594 external values, 415 annotated, 75 asymmetric A/B pairs, 0 unannotated
Bench self-tests        QA 48/48, node 66/66, planet 20/20, loop 19/19, structure 21/21, conformance 18/18, compare PASS, policy 10/10 — no changes needed at promotion
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_15_r1_modeljson.json ..\validation\validation-v7.7.15.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.14\model\orbital_economy_v7_7_14_r1_modeljson.json ..\model\orbital_economy_v7_7_15_r1_modeljson.json ..\docs\tasks\037-wage-pricing\candidate\validation.json ..\docs\tasks\037-wage-pricing\candidate\change-policy.json all
```

## Previous acceptances

- **v7.7.14 r1** (2026-10-11) — Recalibration, task 035; artefacts in `reference/v7.7.14/`, tag `v7.7.14-r1`.
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
