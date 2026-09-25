# v7.7 Acceptance Status

**Status:** ACCEPTED — 2026-09-26, `orbital_economy_v7_7_r1_modeljson.json` (SHA `5bbc29b6…`).

v7.7 adds **Construction Materials**: regional regolith extraction → processing into construction materials → colonial Refinery / Electronics / Power expansion, which now needs both capital goods and construction materials. Delivered by the repository agent as a declarative patch through `candidate.yml` (task 008), accepted in round 1 on the canonical platform. Spec, test plan, delivery and acceptance record: `tasks/008-construction-materials/`.

## Candidate gates (accepted v7.6.1 r1 → candidate v7.7, canonical platform)

```text
APPLY_PATCH             candidate SHA fe9f0f4a…  (identical on Linux CI and Windows)
LIFECYCLE_CONFORMANCE   PASS  (7 instances, 7 × kernel-v2, 0 non-conforming)
STRUCTURE_AUDIT         PASS  (151 flows / 120 boundary, unclassified 0, closed-world 0, pairs 15, symmetry mismatches 0)
RUN_TESTS               OVERALL: PASS  (Modes 0-29, 30/30; 4719 checks)
CHECK_CANDIDATE (executor's change policy)
  COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED
  Modes 0-26: 27 × common=1004, changed=0, added=66, maxAbs=0
  POLICY RESULT: PASS  (observed 2016 = expected 2016; unexpected 0, forbidden 0, required missing 0, hard blockers 0)
```

## Accepted package (canonical platform, promoted files)

```text
RUN_LAB                 OVERALL: PASS  (Modes 0-29, 30/30)
CHECK_CANDIDATE         COMPARISON RESULT: BYTE_IDENTICAL, POLICY RESULT: PASS   (accepted model as its own candidate, 30 Modes)
Series golden           lab/reference/accepted/series-digest.windows.json — 30 Modes
Lab self-tests          SELF_TEST PASS, QA 31/31, POLICY 10/10, CONFORMANCE 18/18, STRUCTURE 21/21, COMPARE PASS (Linux CI)
Tools self-test         27/27
Parameter registry      353 external values, 187 annotated, 45 asymmetric A/B pairs, 0 unannotated
```

## Promotion criteria — all met

| Criterion | Result |
|---|---|
| Modes 0–26 reproduce accepted v7.6.1 r1 on the canonical platform | met — `changed = 0`, `maxAbs = 0` in all 27 |
| Modes 27–29 validation PASS | met |
| No static QA regressions | met |
| Change policy written before the candidate (owner draft, verified on a full skeleton), finalised by the executor | met — the executor changed only `validation_sha256` |
| Manifests / SHA rebuilt, `reference/` moved to v7.6.1 r1, new canonical golden | met |
| Documentation aligned to code | met (2026-09-26) |

## Reproduce

On the canonical platform (Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8). From `lab/`:

```bat
INSTALL.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
RUN_TESTS.cmd ..\model\orbital_economy_v7_7_r1_modeljson.json ..\validation\validation-v7.7.json all
CHECK_CANDIDATE.cmd ..\reference\v7.6.1\model\orbital_economy_v7_6_1_r1_modeljson.json ..\model\orbital_economy_v7_7_r1_modeljson.json ..\docs\tasks\008-construction-materials\candidate\validation.json ..\docs\tasks\008-construction-materials\candidate\change-policy.json all
node --expose-gc src\cli.js series --modes=all --out=output\series
cd ..
node tools\verify_series.mjs lab\output\series\series-digest.json      (bit-exact against the canonical golden)
```

The regression `CHECK_CANDIDATE` uses the executor's policy, which is bound to the candidate validation (`954b6b4d…`); the accepted `validation-v7.7.json` differs from it only in its `name` field.

## Previous acceptances

- **v7.6.1 r1** (2026-09-25) — Mode 25 calibration, `V7_6_1_CALIBRATION_REPORT.md`; artefacts in `reference/v7.6.1/`, tag `v7.6.1-r1`.
- **v7.6 r2** (2026-09-25) — Energy Kernel v2, `V7_6_R1_TO_R2_FIX_REPORT.md`; tag `v7.6-r2`.
