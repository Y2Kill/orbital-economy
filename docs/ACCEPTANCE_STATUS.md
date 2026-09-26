# v7.7.1 Acceptance Status

**Status:** ACCEPTED — 2026-09-26, `orbital_economy_v7_7_1_r1_modeljson.json` (SHA `d53d014d…`).

v7.7.1 puts shared **Transport on construction materials**: transport expansion needs both capital goods and construction materials, drawn from the A and B inventories (two legs, as capital goods since v7.5.1). Mode 31 (transport surge) is the first Mode in which colony B produces construction materials. Delivered by the repository agent through `candidate.yml` (task 009), accepted in round 1; the agent's model is identical to our skeleton. Record: `tasks/009-transport-construction-materials/`.

## Candidate gates (accepted v7.7 r1 → candidate v7.7.1, canonical platform)

```text
APPLY_PATCH             candidate SHA a3c37139…  (identical on Linux CI and Windows)
LIFECYCLE_CONFORMANCE   PASS  (7 instances; Transport keeps its shared-infrastructure variation)
STRUCTURE_AUDIT         PASS  (153 flows / 122 boundary, unclassified 0, closed-world 0, pairs 15, symmetry mismatches 0)
RUN_TESTS               OVERALL: PASS  (Modes 0-31, 32/32; 5120 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED
  Modes 0-29: 30 × common=1070, changed=0, added=12, maxAbs=0
  POLICY RESULT: PASS  (observed 441 = expected 441; unexpected 0, forbidden 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-31, 32/32)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 32 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 32 Modes
Tools self-test         27/27
Parameter registry      355 external values, 189 annotated, 45 asymmetric A/B pairs, 0 unannotated
```

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_1_r1_modeljson.json ..\validation\validation-v7.7.1.json all
CHECK_CANDIDATE.cmd ..\reference\v7.7\model\orbital_economy_v7_7_r1_modeljson.json ..\model\orbital_economy_v7_7_1_r1_modeljson.json ..\docs\tasks\009-transport-construction-materials\candidate\validation.json ..\docs\tasks\009-transport-construction-materials\candidate\change-policy.json all
node --expose-gc src\cli.js series --modes=all --out=output\series
cd ..
node tools\verify_series.mjs lab\output\series\series-digest.json
```

## Previous acceptances

- **v7.7 r1** (2026-09-26) — Construction Materials, task 008; artefacts in `reference/v7.7/`, tag `v7.7-r1`.
- **v7.6.1 r1** (2026-09-25) — Mode 25 calibration; tag `v7.6.1-r1`.
- **v7.6 r2** (2026-09-25) — Energy Kernel v2; tag `v7.6-r2`.
