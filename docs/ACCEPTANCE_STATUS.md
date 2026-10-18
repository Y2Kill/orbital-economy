# v7.7.17 Acceptance Status

**Status:** ACCEPTED — 2026-10-18, `orbital_economy_v7_7_17_r1_modeljson.json` (SHA `43625d45…`).

v7.7.17 is **full money accounting, step 2: money** (owner decisions 2026-10-17; prototype `research/MONEY_ACCOUNTING_PROTOTYPE_2026-10-17_RU.md`):
- each region has household money and the money of one consolidated firm sector; the shared transport holds the freight;
- every payment is booked on both sides — wages, rent at the old base prices, dividends, household purchases, exports, imports, freight; total money is conserved and the exports of one region are the imports of the other;
- rent and dividends go to the households of the region; the transport pays the freight out over 30 days to the households of both regions by trade share;
- household budgets: spending plan = smoothed income + (money − 60 days of income) / 180 days; food is paid first, metal and electronics demand is scaled by the rest; the start is an equilibrium (fixed point of year 5).

The prototype showed that on cost prices (v7.7.16) the money circuit is closed — each region's household saving equals its balance of payments — and left two leaks: B's chronic trade deficit and freight with no owner. Budgets and the transport payout close both; over 80 years money holds at target. On the old prices budgets wipe out both regions, so money works only with cost pricing.

Every replacement is wrapped by the switch `Money Enabled`, so Modes 0–57 reproduce v7.7.16 r1 bit for bit. The new Modes:
- **Mode 58** — Mode 56 (cost pricing) with money: B metal demand ends at 3.40 instead of 5.85, B's balance of payments at −37 instead of −238; budget factor A / B 1.10 / 0.58; B household money stays positive (min 37 537);
- **Mode 59** — the transport surge with cost pricing and money: the A metal price peaks at 60.4 instead of 78.1, A's labor availability stays above 0.998 (0.957 without money), B's balance of payments ends at −33 instead of −255.

The bench first learned a `money` node type (task 040, Lab v0.9.21, two rounds). Delivered by the repository agent (task 041), accepted in round 1: model identical to our skeleton, declaration and validation byte-identical to the owner drafts, all new parameters annotated. The agent's `candidate.yml` run was cancelled by its 60-minute job limit at Gate 5 (60 Modes take longer); the gates below are our own canonical run. Record: `tasks/041-money/`.

## Candidate gates (accepted v7.7.16 r1 → candidate v7.7.17, canonical platform)

```text
APPLY_PATCH             candidate SHA d4601db8…  (money node expanded by the bench; switch Money Enabled; fingerprint d2567e8bf199a505)
LIFECYCLE_CONFORMANCE   PASS  (11 kernel; 6 simple_capital; 6 deposit; 17 labor; 2 population; 2 food; 2 labor_market; 2 wage_pricing; 2 cost_pricing; 2 money instances CONFORMING)
STRUCTURE_AUDIT         PASS  (363 flows / 302 boundary, unclassified 0, closed-world 0, pairs 27, symmetry mismatches 0;
                              algebraic loops 0 of 1048576 combinations; planet closure in planet_v1 mode PASS:
                              P2 = 11/8/0/0, P3 = 16/2/1/0, P4 = 6/0, P5 = 19/0, P6 = 4 per-capita norms)
RUN_TESTS               OVERALL: PASS  (Modes 0-59, 60/60; 29220 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: COMMON_OUTPUTS_IDENTICAL_WITH_NEW_MODES
  Modes 0-57: 58 × common=1863, changed=0, added=68, maxAbs=0
  POLICY RESULT: PASS  (observed 4212; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-59, 60/60)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 60 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 60 Modes
Parameter registry      627 external values, 452 annotated, 88 asymmetric A/B pairs, 0 unannotated
Bench self-tests        QA 50/50, node 80/80, planet 20/20, loop 19/19, structure 21/21, conformance 18/18, compare PASS, policy 10/10 — no changes needed at promotion
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_17_r1_modeljson.json ..\validation\validation-v7.7.17.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.16\model\orbital_economy_v7_7_16_r1_modeljson.json ..\model\orbital_economy_v7_7_17_r1_modeljson.json ..\docs\tasks\041-money\candidate\validation.json ..\docs\tasks\041-money\candidate\change-policy.json all
```

## Previous acceptances

- **v7.7.16 r1** (2026-10-17) — Cost Pricing, task 039; artefacts in `reference/v7.7.16/`, tag `v7.7.16-r1`.
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
