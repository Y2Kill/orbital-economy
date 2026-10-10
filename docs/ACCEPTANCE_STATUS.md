# v7.7.13 Acceptance Status

**Status:** ACCEPTED — 2026-10-10, `orbital_economy_v7_7_13_r1_modeljson.json` (SHA `cede8ecf…`).

v7.7.13 is **Planet v2, step 3: the labor market closes the loop** population → demand → output → labor → wage (owner decisions 2026-10-04 and 2026-10-10; prototype `research/CLOSURE_PROTOTYPE_2026-10-09_RU.md`):
- demand for metal and electronics follows population at a per-capita norm (A level);
- the wage follows labor tightness (10 %/year, floor 30 %, target 0.95);
- every process rate is limited by labor availability, as a guard.

Household-income demand is deferred to the finance layer: in the prototype it drives a wage spiral.

Every replacement is wrapped by the switch `Labor Market Enabled`, and the former constants are kept in parameters, so Modes 0–51 reproduce v7.7.12 r1 bit for bit. The new Modes:
- **Mode 52** — Mode 49 with the labor market: B's demand drops from 22 to about 5, B smelts 1.7 instead of 8.9, A's metal is cheaper, transport shrinks to about 11, B's wage falls.
- **Mode 53** — the transport surge with the labor market: the labor guard bites (A's availability down to 0.96).

Planet v2 redeclares the P6 demand drivers as the per-capita norms. The bench first learned a `labor_market` node type (task 033, Lab v0.9.18). Delivered by the repository agent through `candidate.yml` (task 034), accepted in round 1: declaration and validation byte-identical to the owner drafts, model identical to our skeleton, all 12 new parameters annotated. Record: `tasks/034-labor-market/`.

## Candidate gates (accepted v7.7.12 r1 → candidate v7.7.13, canonical platform)

```text
APPLY_PATCH             candidate SHA c42eae81…  (labor_market node expanded by the bench; switch Labor Market Enabled; fingerprint 24d60e1f1ed20d62)
LIFECYCLE_CONFORMANCE   PASS  (11 kernel; 6 simple_capital; 6 deposit; 17 labor; 2 population; 2 food; 2 labor_market instances CONFORMING)
STRUCTURE_AUDIT         PASS  (323 flows / 262 boundary, unclassified 0, closed-world 0, pairs 27, symmetry mismatches 0;
                              algebraic loops 0 of 131072 combinations; planet closure in planet_v1 mode PASS:
                              P2 = 11/8/0/0, P3 = 16/2/1/0, P4 = 6/0, P5 = 19/0, P6 = 4 per-capita norms)
RUN_TESTS               OVERALL: PASS  (Modes 0-53, 54/54; 22489 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: COMMON_OUTPUTS_IDENTICAL_WITH_NEW_MODES
  Modes 0-51: 52 × common=1733, changed=0, added=31, maxAbs=0
  POLICY RESULT: PASS  (observed 1778; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-53, 54/54)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 54 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 54 Modes
Parameter registry      582 external values, 403 annotated, 71 asymmetric A/B pairs, 0 unannotated
Bench self-tests        QA 47/47, node 59/59, planet 20/20, loop 19/19, structure 21/21, conformance 18/18, compare PASS, policy 10/10 — no changes needed at promotion
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_13_r1_modeljson.json ..\validation\validation-v7.7.13.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.12\model\orbital_economy_v7_7_12_r1_modeljson.json ..\model\orbital_economy_v7_7_13_r1_modeljson.json ..\docs\tasks\034-labor-market\candidate\validation.json ..\docs\tasks\034-labor-market\candidate\change-policy.json all
```

## Previous acceptances

- **v7.7.12 r1** (2026-10-09) — Food, task 032; artefacts in `reference/v7.7.12/`, tag `v7.7.12-r1`.
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
