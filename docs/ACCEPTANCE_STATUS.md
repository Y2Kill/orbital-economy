# v7.7.11 Acceptance Status

**Status:** ACCEPTED — 2026-10-05, `orbital_economy_v7_7_11_r1_modeljson.json` (SHA `dbe824b3…`).

v7.7.11 is **Planet v2, step 1: each region has a population** — births, deaths (the base rate divided by the living standard) and pairwise migration toward the region with the higher perceived attractiveness = real wage × employment × living standard — and **labor is accounted**: labor force = population × participation, employment, unemployment and labor shortage against the processes' total labor requirement (owner decisions 2026-10-04; order and calibration from prototype experiments, `research/POPULATION_PROTOTYPE_2026-10-04_RU.md`). The living standard is energy fulfillment for now and the wage is fixed. It is **accounting only** — nothing in the economy reads the population — so the step needs **no switch and no new Mode**: Modes 0–48 reproduce v7.7.10 r1 bit for bit. Over the 3-year horizon B gains people (Mode 46: 8.5 → 9.53) on its higher real wage while planet population stays near 36.5. The bench first learned a `population` node type (task 029, Lab v0.9.16). Delivered by the repository agent through `candidate.yml` (task 030), accepted in round 1: declaration and validation byte-identical to the owner drafts, model identical to our skeleton. Record: `tasks/030-population/`.

## Candidate gates (accepted v7.7.10 r1 → candidate v7.7.11, canonical platform)

```text
APPLY_PATCH             candidate SHA 994d140e…  (population node expanded by the bench; no switch; fingerprint 35d24655fc422942)
LIFECYCLE_CONFORMANCE   PASS  (11 kernel; 6 simple_capital; 6 deposit; 17 labor; 2 population instances CONFORMING)
STRUCTURE_AUDIT         PASS  (289 flows / 232 boundary, unclassified 0, closed-world 0, pairs 25, symmetry mismatches 0;
                              algebraic loops 0 of 32768 combinations; planet closure in planet_v1 mode PASS:
                              P2 = 11/6/0/0, P3 = 14/2/1/0, P4 = 6/0, P5 = 17/0, P6 = 4)
RUN_TESTS               OVERALL: PASS  (Modes 0-48, 49/49; 19451 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: OUTPUTS_IDENTICAL_WITH_NEW_SERIES
  Modes 0-48: 49 × common=1588, changed=0, added=49, maxAbs=0
  POLICY RESULT: PASS  (observed 2540; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-48, 49/49)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 49 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 49 Modes
Parameter registry      536 external values, 359 annotated, 64 asymmetric A/B pairs, 0 unannotated
Bench self-tests        QA 45/45, node 45/45, planet 20/20, loop 19/19, structure 21/21, conformance 18/18, compare PASS, policy 10/10 — no changes needed at promotion
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_11_r1_modeljson.json ..\validation\validation-v7.7.11.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.10\model\orbital_economy_v7_7_10_r1_modeljson.json ..\model\orbital_economy_v7_7_11_r1_modeljson.json ..\docs\tasks\030-population\candidate\validation.json ..\docs\tasks\030-population\candidate\change-policy.json all
```

## Previous acceptances

- **v7.7.10 r1** (2026-10-04) — Labor, task 028; Planet v1 closed; artefacts in `reference/v7.7.10/`, tag `v7.7.10-r1`.
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
