# v7.7.9 Acceptance Status

**Status:** ACCEPTED — 2026-10-03, `orbital_economy_v7_7_9_r1_modeljson.json` (SHA `fb27f258…`).

v7.7.9 puts **ore mining, regolith extraction, energy-resource extraction and capital-goods production on their colony energy allocator**, next to smelting, electronics and construction materials (owner decisions 2026-10-02: energy-resource extraction uses energy too; new consumers add 10–20 % to energy demand; shared transport stays an exception). Each request reads a smoothed signal of the planned rate — a same-step request closes an algebraic loop through the allocator for every one of the four — and **the energy sector's own use is served first**: without that priority, proportional rationing of fuel extraction drove colony B to zero energy and zero fuel for good. The bench first learned an `energy_consumer` node type (task 024, Lab v0.9.13) and an exact loop-audit speed-up (task 025, Lab v0.9.14); one node, one switch `Process Energy Enabled`. Planet energy demand +10.6 %. **Planet v1 P3 is 14/2/1/0** — only shared transport is left, decided at the level-of-economy step. Delivered by the repository agent through `candidate.yml` (task 026), accepted in round 1: declaration and validation byte-identical to the owner drafts, model identical to our skeleton. Record: `tasks/026-process-energy/`.

## Candidate gates (accepted v7.7.8 r1 → candidate v7.7.9, canonical platform)

```text
APPLY_PATCH             candidate SHA 5964a0c3…  (energy_consumer node expanded by the bench)
LIFECYCLE_CONFORMANCE   PASS  (11 kernel; 6 simple_capital; 6 deposit instances CONFORMING)
STRUCTURE_AUDIT         PASS  (279 flows / 224 boundary, unclassified 0, closed-world 0, pairs 25, symmetry mismatches 0;
                              algebraic loops 0 of 32768 combinations; planet closure P2 = 11/6/0/0, P3 = 14/2/1/0, P4 = 6/0)
RUN_TESTS               OVERALL: PASS  (Modes 0-47, 48/48; 15414 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED
  Modes 0-45: 46 × common=1448, changed=0, added=71, maxAbs=0
  POLICY RESULT: PASS  (observed 3632; unexpected 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-47, 48/48)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 48 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 48 Modes
Parameter registry      488 external values, 314 annotated, 63 asymmetric A/B pairs, 0 unannotated
Bench self-tests        QA 43/43, node 33/33, planet 18/18, loop 19/19, structure 21/21, conformance 18/18, compare PASS, policy 10/10 — no changes needed at promotion
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_9_r1_modeljson.json ..\validation\validation-v7.7.9.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7.8\model\orbital_economy_v7_7_8_r1_modeljson.json ..\model\orbital_economy_v7_7_9_r1_modeljson.json ..\docs\tasks\026-process-energy\candidate\validation.json ..\docs\tasks\026-process-energy\candidate\change-policy.json all
```

## Previous acceptances

- **v7.7.8 r1** (2026-10-02) — Deposits, task 023; artefacts in `reference/v7.7.8/`, tag `v7.7.8-r1`.
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
