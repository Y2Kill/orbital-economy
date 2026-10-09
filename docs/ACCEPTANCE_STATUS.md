# v7.7.12 Acceptance Status

**Status:** ACCEPTED — 2026-10-09, `orbital_economy_v7_7_12_r1_modeljson.json` (SHA `e8829fa5…`).

v7.7.12 is **Planet v2, step 2: food and farms**. Each region has a food stock and a need of one unit a person a day. Farms are capital on regional land: built from capital goods, energy served in the priority group with the energy sector, labor 0.15 a unit. Land is A 22, B 60 — fertile B is the start state, equal land a probe. Food is traded by need and goes first on the shared transport. A food shortage lowers the living standard (food^0.5 × energy^0.5), raises deaths and lowers births (owner decisions 2026-10-04/05; prototype `research/FOOD_PROTOTYPE_2026-10-05_RU.md`).

Every replacement is wrapped by the switch `Food Enabled`, so Modes 0–48 reproduce v7.7.11 r1 bit for bit. The new Modes:
- **Mode 49** — fertile B feeds A 5–8 a day; its farm jobs keep B fully employed.
- **Mode 50** — the transport surge with food: farms keep their energy and A stays fed.
- **Mode 51** — equal land: A builds its own farms and trade dies out.

The bench first learned a `food` node type (task 031, Lab v0.9.17, round 2: our reference missed two runtime contracts). Delivered by the repository agent through `candidate.yml` (task 032), accepted in round 1: declaration and validation byte-identical to the owner drafts, model identical to our skeleton, all 28 new parameters annotated. Record: `tasks/032-food/`.

## Candidate gates (accepted v7.7.11 r1 → candidate v7.7.12, canonical platform)

```text
APPLY_PATCH             candidate SHA bc2dfa93…  (food node expanded by the bench; switch Food Enabled; fingerprint c2ce1d6b11f56df8)
LIFECYCLE_CONFORMANCE   PASS  (11 kernel; 6 simple_capital; 6 deposit; 17 labor; 2 population; 2 food instances CONFORMING)
STRUCTURE_AUDIT         PASS  (315 flows / 254 boundary, unclassified 0, closed-world 0, pairs 27, symmetry mismatches 0;
                              algebraic loops 0 of 65536 combinations; planet closure in planet_v1 mode PASS:
                              P2 = 11/8/0/0, P3 = 16/2/1/0, P4 = 6/0, P5 = 19/0, P6 = 4)
RUN_TESTS               OVERALL: PASS  (Modes 0-51, 52/52; 21241 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: COMMON_OUTPUTS_IDENTICAL_WITH_NEW_MODES
  Modes 0-48: 49 × common=1637, changed=0, added=96, maxAbs=0
  POLICY RESULT: PASS  (observed 5067; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-51, 52/52)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 52 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 52 Modes
Parameter registry      571 external values, 392 annotated, 69 asymmetric A/B pairs, 0 unannotated
Bench self-tests        QA 46/46, node 52/52, planet 20/20, loop 19/19, structure 21/21, conformance 18/18, compare PASS, policy 10/10 — no changes needed at promotion
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_12_r1_modeljson.json ..\validation\validation-v7.7.12.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.11\model\orbital_economy_v7_7_11_r1_modeljson.json ..\model\orbital_economy_v7_7_12_r1_modeljson.json ..\docs\tasks\032-food\candidate\validation.json ..\docs\tasks\032-food\candidate\change-policy.json all
```

## Previous acceptances

- **v7.7.11 r1** (2026-10-05) — Population, task 030; artefacts in `reference/v7.7.11/`, tag `v7.7.11-r1`.
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
