# v7.7.16 Acceptance Status

**Status:** ACCEPTED — 2026-10-17, `orbital_economy_v7_7_16_r1_modeljson.json` (SHA `e512efbb…`).

v7.7.16 is **full money accounting, step 1: prices at full unit cost** (owner decisions 2026-10-16; prototype `research/COST_PRICES_PROTOTYPE_2026-10-16_RU.md`):
- ore, power resource, energy and food prices = full unit cost (materials and energy at smoothed regional prices, labor × wage, capital wear, rent = the old base price) × 1.15 × the old scarcity factor;
- capital goods, construction materials and regolith get cost prices; one 15 % markup for every good;
- reference prices and the price index are scaled per region, so demand and the real wage keep their level.

The old prices of power resource, energy, ore and food lay below their labor content, so wages paid did not come back through prices; at cost prices the price level is about ×2.2. Money stocks come next.

Every replacement is wrapped by the switch `Cost Pricing Enabled`, so Modes 0–55 reproduce v7.7.15 r1 bit for bit. The new Modes:
- **Mode 56** — Mode 52 with cost pricing: A energy 0.57 instead of 0.12, A metal about 59 instead of 26, the A refinery earns about 333 a day instead of 70; the price index and the real wage keep their level;
- **Mode 57** — the transport surge with cost pricing: the A metal price peaks at 78, the labor guard bites a little less.

Over 80 years (research) the real wage of A holds near 118 and B smelts 7.1 instead of 2.3. The bench first learned a `cost_pricing` node type (task 038, Lab v0.9.20). Delivered by the repository agent through `candidate.yml` (task 039), accepted in round 1: model identical to our skeleton, declaration and validation byte-identical to the owner drafts, all new parameters annotated. Record: `tasks/039-cost-pricing/`.

## Candidate gates (accepted v7.7.15 r1 → candidate v7.7.16, canonical platform)

```text
APPLY_PATCH             candidate SHA 553e82b0…  (cost_pricing node expanded by the bench; switch Cost Pricing Enabled; fingerprint f1c2544d52c72781)
LIFECYCLE_CONFORMANCE   PASS  (11 kernel; 6 simple_capital; 6 deposit; 17 labor; 2 population; 2 food; 2 labor_market; 2 wage_pricing; 2 cost_pricing instances CONFORMING)
STRUCTURE_AUDIT         PASS  (351 flows / 290 boundary, unclassified 0, closed-world 0, pairs 27, symmetry mismatches 0;
                              algebraic loops 0 of 524288 combinations; planet closure in planet_v1 mode PASS:
                              P2 = 11/8/0/0, P3 = 16/2/1/0, P4 = 6/0, P5 = 19/0, P6 = 4 per-capita norms)
RUN_TESTS               OVERALL: PASS  (Modes 0-57, 58/58; 27882 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: COMMON_OUTPUTS_IDENTICAL_WITH_NEW_MODES
  Modes 0-55: 56 × common=1782, changed=0, added=81, maxAbs=0
  POLICY RESULT: PASS  (observed 4998; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-57, 58/58)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 58 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 58 Modes
Parameter registry      613 external values, 438 annotated, 85 asymmetric A/B pairs, 0 unannotated
Bench self-tests        QA 49/49, node 73/73, planet 20/20, loop 19/19, structure 21/21, conformance 18/18, compare PASS, policy 10/10 — no changes needed at promotion
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_16_r1_modeljson.json ..\validation\validation-v7.7.16.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.15\model\orbital_economy_v7_7_15_r1_modeljson.json ..\model\orbital_economy_v7_7_16_r1_modeljson.json ..\docs\tasks\039-cost-pricing\candidate\validation.json ..\docs\tasks\039-cost-pricing\candidate\change-policy.json all
```

## Previous acceptances

- **v7.7.15 r1** (2026-10-16) — Wage Pricing, task 037; artefacts in `reference/v7.7.15/`, tag `v7.7.15-r1`.
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
