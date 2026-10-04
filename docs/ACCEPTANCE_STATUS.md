# v7.7.10 Acceptance Status

**Status:** ACCEPTED — 2026-10-04, `orbital_economy_v7_7_10_r1_modeljson.json` (SHA `3cb40c88…`).

v7.7.10 gives **every process a declared labor requirement = output × labor intensity × automation factor**, with the automation factor in the formula from the start (owner decisions 2026-10-03; automation 0 at start, intensities per process; factor = 1 − (1 − h)(1 − (1 − level)^k), exactly 1 at level 0). Nothing else changes, so the step needs **no switch**: Modes 0–47 reproduce v7.7.9 r1 bit for bit. Metal and electronics unit costs read intensity × factor, which the automation probe Mode 48 exercises (colony A at automation 0.5: labor −43 %, metal unit cost −18 %). The bench first learned a `labor` node type and a strict `labor.requirement` check (task 027, Lab v0.9.15). **Planet v1 is closed: `planet_closure` runs in `planet_v1` mode** — P5 17/0, P2 and P4 closed, P3 with one exception with a reason (shared transport energy), P6 declared. Delivered by the repository agent through `candidate.yml` (task 028), accepted in round 1: declaration and validation byte-identical to the owner drafts, model identical to our skeleton. Record: `tasks/028-labor/`.

## Candidate gates (accepted v7.7.9 r1 → candidate v7.7.10, canonical platform)

```text
APPLY_PATCH             candidate SHA e4a3a16f…  (labor node expanded by the bench; no switch)
LIFECYCLE_CONFORMANCE   PASS  (11 kernel; 6 simple_capital; 6 deposit; 17 labor instances CONFORMING)
STRUCTURE_AUDIT         PASS  (279 flows / 224 boundary, unclassified 0, closed-world 0, pairs 25, symmetry mismatches 0;
                              algebraic loops 0 of 32768 combinations; planet closure in planet_v1 mode PASS:
                              P2 = 11/6/0/0, P3 = 14/2/1/0, P4 = 6/0, P5 = 17/0, P6 = 4)
RUN_TESTS               OVERALL: PASS  (Modes 0-48, 49/49; 19007 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: COMMON_OUTPUTS_IDENTICAL_WITH_NEW_MODES
  Modes 0-47: 48 × common=1519, changed=0, added=69, maxAbs=0
  POLICY RESULT: PASS  (observed 3509; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-48, 49/49)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 49 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 49 Modes
Parameter registry      520 external values, 346 annotated, 63 asymmetric A/B pairs, 0 unannotated
Bench self-tests        QA 44/44, node 39/39, planet 20/20, loop 19/19, structure 21/21, conformance 18/18, compare PASS, policy 10/10 — no changes needed at promotion
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_10_r1_modeljson.json ..\validation\validation-v7.7.10.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.9\model\orbital_economy_v7_7_9_r1_modeljson.json ..\model\orbital_economy_v7_7_10_r1_modeljson.json ..\docs\tasks\028-labor\candidate\validation.json ..\docs\tasks\028-labor\candidate\change-policy.json all
```

## Previous acceptances

- **v7.7.9 r1** (2026-10-03) — Process Energy, task 026; artefacts in `reference/v7.7.9/`, tag `v7.7.9-r1`.
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
