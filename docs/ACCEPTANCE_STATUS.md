# v7.6.1 Acceptance Status

**Status:** ACCEPTED — 2026-09-25, `orbital_economy_v7_6_1_r1_modeljson.json` (SHA `16e8ca6c…`).

v7.6.1 is a calibration of the accepted v7.6 r2: `Power Resource Shock Factor` 0.1 → 0.5, so that Mode 25 is a resource-supply shock rather than a cut-off, impact-matched to the Mode 26 capacity control. Evidence and rationale: `V7_6_1_CALIBRATION_REPORT.md`. The change was made and accepted on the owner side, with the change policy written before the candidate was built.

## Candidate gates (accepted v7.6 r2 → candidate v7.6.1 r1)

```text
LIFECYCLE_CONFORMANCE   PASS  (7 instances, 7 × kernel-v2, 0 non-conforming)
STRUCTURE_AUDIT         PASS  (139 flows / 108 boundary, unclassified 0, closed-world 0, pairs 13, symmetry mismatches 0)
RUN_TESTS Mode 25       PASS  (7/7 incl. the new check "A energy is rationed, not cut off")
control: v7.6 r2 against the new validation, Mode 25
                        FAIL on the new check (A energy min 81 < 400) — the check is not a tautology
CHECK_CANDIDATE (all Modes, docs/model_v7_6_1/change-policy-v7.6.1-mode25-calibration.json)
  COMPARISON RESULT: DIFFERENT_OUTPUTS
  Modes 0-24, 26: 26 × common=1004, changed=1 — the constant's own series (0.1 -> 0.5); every other series identical
  Mode 25:        640 series changed (639 + the constant), by design
  POLICY RESULT: PASS  (observed 667 = expected 667; unexpected 0, forbidden 0, threshold 0, required missing 0)
```

The change policy needed one rule after the first run: a VARIABLE constant is itself an output series, so the recalibrated constant's own series changes in every Mode. Policy r1.1 allows exactly that one series everywhere, before the regression guard, and says so in its description; no other rule changed.

## Accepted package (self-consistency, clean workspace)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-26, 27/27)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate)
Lab self-tests          SELF_TEST PASS, QA 30/30, POLICY 10/10, CONFORMANCE 18/18, STRUCTURE 21/21, COMPARE PASS
Tools self-test         22/22
Parameter registry      325 external values, 159 annotated, 41 asymmetric A/B pairs, 0 unannotated
```

## Promotion criteria — all met

| Criterion | Result |
|---|---|
| Modes 0–24 and 26 reproduce accepted v7.6 r2 | met — every series except the recalibrated constant's own |
| Mode 25 validation PASS, including the new calibration check | met |
| New check fails on the previous calibration | met (v7.6 r2: 81 < 400) |
| No static QA regressions | met |
| Change policy written before the candidate; every rule explained | met (r1.1 amendment documented) |
| Manifests / SHA rebuilt, `reference/` moved to v7.6 r2 | met |
| Documentation aligned to code | met (2026-09-25) |

## Reproduce

From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_6_1_r1_modeljson.json ..\validation\validation-v7.6.1.json all
CHECK_CANDIDATE.cmd ..\reference\v7.6\model\orbital_economy_v7_6_r2_modeljson.json ..\model\orbital_economy_v7_6_1_r1_modeljson.json ..\validation\validation-v7.6.1.json ..\docs\model_v7_6_1\change-policy-v7.6.1-mode25-calibration.json all
```

## Previous acceptance — v7.6 r2 (2026-09-25)

v7.6 r1 passed static QA but had never been executed; the first runtime run failed all 27 Modes on two defects fixed in r2 (`V7_6_R1_TO_R2_FIX_REPORT.md`). r2: validation 27/27 PASS; Modes 0–24 reproduced v7.5.1 r1 exactly (25 × `common=963, changed=0, added=41, maxAbs=0`, `OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED`); self-policy `BYTE_IDENTICAL`. The v7.6 r2 artefacts are in `reference/v7.6/` and at git tag `v7.6-r2`.
