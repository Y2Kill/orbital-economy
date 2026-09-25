# v7.6.1 — Mode 25 calibration: a resource-supply shock, not a cut-off

**Accepted:** 2026-09-25 · **Base:** accepted v7.6 r2 (`a9573f5a…`) · **Model:** `orbital_economy_v7_6_1_r1_modeljson.json`  
**Change:** `Power Resource Shock Factor` 0.1 → 0.5. Nothing else in the model's behaviour changed.

## Why

The v7.6 r1→r2 fix report flagged it as a calibration item: at 0.1, extraction in colony A falls to 10 % for 360 days against a 2-day inventory buffer. The resource stock drains, energy collapses to ~6 % and the recovery the scenario is meant to exercise becomes a restart. Mode 25 was named a supply shock and behaved as a cut-off.

It also broke the purpose of the Mode 25 / Mode 26 pair. Mode 26 is the **control**: the same kind of energy scarcity, but caused by lost generation capacity instead of a missing operating resource. A control only isolates the mechanism if the two shocks hit about equally hard. At 0.1 against Mode 26's 0.6 they differed mainly in severity.

## Evidence — sweep of Mode 25 against a no-shock control

Every value below is colony A, relative to the same scenario with the factor set to 1 (no shock). A control run is needed because the economy grows on its own: comparing against the pre-shock day understates the damage and hides the long-run scar. Window = days 360–720, "after" = days 900–1080.

| Case | Energy, window | Smelting, window | Electronics, window | Generation capacity at day 720 | Energy, after |
|---|---:|---:|---:|---:|---:|
| Mode 25, factor 0.1 (v7.6 r2) | 7 % | 7 % | 10 % | 49 % | 80 % |
| Mode 25, factor 0.15 | 11 % | 10 % | 15 % | 52 % | 82 % |
| Mode 25, factor 0.2 | 15 % | 13 % | 21 % | 55 % | 83 % |
| Mode 25, factor 0.3 | 24 % | 22 % | 34 % | 63 % | 85 % |
| **Mode 25, factor 0.5 (v7.6.1)** | **45 %** | **41 %** | **63 %** | **75.5 %** | **88.6 %** |
| Mode 25, factor 0.6 | 59 % | 56 % | 76 % | 85 % | 92 % |
| Mode 25, factor 0.8 | 88 % | 87 % | 94 % | 97 % | 97 % |
| **Mode 26 control, capacity 0.6** | **52 %** | **50 %** | **59 %** | **75.0 %** | **88.9 %** |

At 0.5 the resource shock leaves the same scar as the capacity control — generation capacity 75.5 % vs 75.0 % of control at the end of the window, energy afterwards 88.6 % vs 88.9 % — and a similar depth inside the window (45 % vs 52 % energy). The pair now differs in mechanism, which is what it is for. The economy keeps running (energy never below ~42 % of control), so the scenario exercises rationing and recovery. 0.5 is also the nominal factor of the Mode 18 ore-supply shock.

Nominal factors are not impact: Mode 26 at a nominal 0.6 drops A energy to 13 % of control at its first trough before capacity adapts. Calibration was therefore done on impact against a control run, not by copying a neighbour's factor.

**Colony B.** B is not shocked directly in either scenario, but it is not unaffected: through trade its electronics output deviates from control by up to 33–40 % in Mode 25 (factors 0.1–0.6; 7 % at 0.8) and 71 % in Mode 26. The v7.6 r1→r2 report's phrase "B is untouched in both" meant "not shocked"; it is corrected there.

## What changed in the artefacts

| Artefact | Change |
|---|---|
| model | `Power Resource Shock Factor` value 0.5 and its description; model name and description; Mode 25 scenario description ("reduced to 50 %" instead of "cut"). Names and descriptions are not semantic: the comparator sees one `definition_changed`. |
| validation `validation-v7.6.1.json` | one new Mode 25 check — **`A Energy Supply` min over days 360–720 ≥ 400** ("rationed, not cut off"). Pre-shock A energy is 1373; the threshold rejects factors ≤ 0.3 (min 308) and accepts 0.5 (min 601). Without it a silent return to 0.1 would still pass validation: all other Mode 25 checks are qualitative. Verified to fail on v7.6 r2 (min 81). |
| change policy `docs/model_v7_6_1/change-policy-v7.6.1-mode25-calibration.json` | written before the candidate was built: `series_changed` denied in Modes 0–24 and 26; one required `definition_changed` for the factor; `series_changed` allowed in Mode 25, with `A Power Resource Extraction Multiplier` required to change. |

## Gates

| Gate | Result |
|---|---|
| `LIFECYCLE_CONFORMANCE`, `STRUCTURE_AUDIT` | PASS, unchanged from v7.6 r2 |
| `RUN_TESTS` Mode 25 (new validation) | PASS 7/7 |
| control: v7.6 r2 on the new validation | FAIL on the new check only (81 < 400) — as intended |
| `CHECK_CANDIDATE`, all Modes, calibration policy r1.1 | `POLICY RESULT: PASS` — 667 events, all expected; Modes 0–24 and 26 identical except the constant's own series; Mode 25 changed by design |
| accepted package: `RUN_LAB`, self-`CHECK_CANDIDATE`, Lab and tools self-tests | PASS — see `ACCEPTANCE_STATUS.md` |

**One policy amendment, recorded.** The first `CHECK_CANDIDATE` failed on the regression guard because a VARIABLE constant is also an output series: `Power Resource Shock Factor` itself reads 0.5 instead of 0.1 in every Mode. That is the authorised change, not a behavioural difference; policy r1.1 adds one rule allowing exactly that series, placed before the guard, and nothing else. Lesson for future calibration policies: a changed constant appears both as `definition_changed` and as its own `series_changed` in every Mode.
