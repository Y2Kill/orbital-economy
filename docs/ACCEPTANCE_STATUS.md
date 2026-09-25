# v7.6 Acceptance Status

**Status:** ACCEPTED — runtime verified 2026-09-25 on `orbital_economy_v7_6_r2_modeljson.json`.

r1 passed static QA but had never been executed (the pinned engine could not be installed in the build environment). The first runtime run failed all 27 modes; two defects were found and fixed in r2 — see `V7_6_R1_TO_R2_FIX_REPORT.md`.

## Static QA (r2)

- ModelJSON reference integrity: PASS.
- Formula dependency LINK completeness: PASS.
- Capital Lifecycle Kernel conformance: PASS, 7/7 (7 × kernel-v2 variation, 0 non-conforming).
- Structure audit: PASS. Boundary classification 108/108; declared external-capital violations 0; transformation pairs 13, unpaired 0.
- A/B structural symmetry: 0 mismatches, 0 exceptions.
- Parameter registry: 325 external values, 159 annotated, 41 asymmetric A/B pairs, 0 of them unannotated.

## Runtime (r2)

Validation, all Modes:

```text
RUN_TESTS.cmd ..\model\orbital_economy_v7_6_r2_modeljson.json ..\validation\validation-v7.6.json all
  OVERALL: PASS  (Modes 0-26, 27/27)
```

Exact regression against the previous accepted baseline:

```text
COMPARE_MODELS.cmd ..\reference\v7.5.1\model\orbital_economy_v7_5_1_r1_modeljson.json ..\model\orbital_economy_v7_6_r2_modeljson.json ..\validation\validation-v7.6.json 0-24
  25 x common=963, changed=0, added=41, removed=0, maxAbs=0
  COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED
```

The scenario contract changed because Modes 0–24 now also set `Power Resource Enabled = 0`; every common series is bit-identical.

Self-consistency of the accepted package (accepted model as its own candidate):

```text
CHECK_CANDIDATE.cmd
  COMPARISON RESULT: BYTE_IDENTICAL   (1004 series x 27 Modes)
  POLICY RESULT: PASS                 (unexpected 0, forbidden 0, required missing 0, hard blockers 0)
```

Lab self-tests: QA 29/29, POLICY 10/10, CONFORMANCE 18/18, STRUCTURE 21/21, COMPARE PASS.

## Promotion criteria — all met

| Criterion | Result |
|---|---|
| Modes 0–24 exact regression against accepted v7.5.1 r1 | met (`changed=0`, `maxAbs=0`) |
| Modes 25–26 validation PASS | met |
| No static QA regressions | met |
| Manifests/SHA rebuilt | met (`BASELINE_MANIFEST.json`, `SHA256SUMS.txt`, `lab/SHA256SUMS.txt`) |
| Documentation aligned to code | met (2026-09-25) |

## Reproduce

All commands are run from `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_6_r2_modeljson.json ..\validation\validation-v7.6.json all
COMPARE_MODELS.cmd ..\reference\v7.5.1\model\orbital_economy_v7_5_1_r1_modeljson.json ..\model\orbital_economy_v7_6_r2_modeljson.json ..\validation\validation-v7.6.json 0-24
LIFECYCLE_CONFORMANCE.cmd ..\model\orbital_economy_v7_6_r2_modeljson.json ..\validation\validation-v7.6.json
STRUCTURE_AUDIT.cmd ..\model\orbital_economy_v7_6_r2_modeljson.json ..\validation\validation-v7.6.json
PARAMETER_REGISTRY.cmd
CHECK_CANDIDATE.cmd
```

`RUN_LAB.cmd` and `CHECK_CANDIDATE.cmd` need no arguments: `lab/input/` and `lab/reference/accepted/` already hold the accepted artefacts.
