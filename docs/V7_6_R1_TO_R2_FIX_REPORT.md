# v7.6 r1 → r2 — defects found in the first runtime run, and the fixes

**Run date:** 2026-09-25  
**Runner:** owner side (`lab/RUN_TESTS.cmd`, `simulation@9.0.0`)  
**r1 model:** `aa087cbd9b9074aa9fab7a3ab082aeb011cf096cbcabf0476b0b275a2b557095` (kept in `docs/model_v7_6_r1/`)  
**r2 model:** `a9573f5afe43d2ae2bf12fdc3066c983c264eba162e1d3fc1d5f11e3872f9e91`

r1 was delivered with static QA green and runtime unverified, because the pinned engine could not be installed in the build environment. The first runtime run failed every mode. Two defects, both invisible to static QA: one in the model, one in the validation contract.

## Defect 1 — algebraic loop in Modes 25–26 (model)

```text
Mode 25/26: Circular equation loop identified including the primitives:
A Energy Price -> A Effective Power Generation Cost -> A Power Resource Price ->
A Power Resource Fulfillment -> A Power Resource Demand -> A Desired Generation ->
A Total Requested Energy -> ... -> A Effective Energy Price -> A Energy Price
```

**Cause.** The r1 price channel read the *physical* rationing ratio:

```text
ResourcePrice = BaseResourcePrice × (1 + ScarcityStrength × (1 − ResourceFulfillment))
ResourceFulfillment = f(Inventory, ResourceDemand)      ResourceDemand = DesiredGeneration × ResourcePerEnergy
```

`DesiredGeneration` is derived from this tick's requested energy, and requested energy is derived from the energy price. Everything on that path is a VARIABLE, so the engine has to solve the whole ring simultaneously and refuses. The engine only sees the loop when `Power Resource Enabled = 1`, which is why Modes 0–24 loaded and only 25–26 aborted — and why static conformance (which walks LINKs, not taken branches) reported PASS.

**Fix.** The model already has the idiom for this: a price signal reads smoothed state, never instantaneous demand. `A/B Perceived Energy Scarcity Ratio` is built from the STOCK `X Energy Demand Signal` (3-day smoothing of total requested energy) for exactly this reason. r2 gives the resource price the same treatment — two new mirrored VARIABLEs per colony, no new state:

```text
X Perceived Power Resource Demand      = IfThenElse(X Energy Demand Signal < X Power Active Generation Capacity,
                                                    X Energy Demand Signal, X Power Active Generation Capacity)
                                         × Power Resource per Energy
X Perceived Power Resource Fulfillment = IfThenElse(Power Resource Enabled = 1,
                                             Min(1, X Power Resource Inventory /
                                                    (Power Resource Buffer Days × X Perceived Power Resource Demand + 1e-9)),
                                             1)
X Power Resource Price                 = Base Power Resource Price
                                         × (1 + Power Resource Scarcity Price Strength
                                                × (1 − X Perceived Power Resource Fulfillment))
```

`X Power Resource Fulfillment` — the physical rationing ratio in `Available Generation = Desired Generation × Fulfillment` — is unchanged. The stale LINK `X Power Resource Fulfillment → X Power Resource Price` was removed.

**Fidelity of the substitution.** The two ratios differ only by the 3-day lag of the demand signal. In the Mode 25 shock trough: physical 0.1165, perceived 0.1165 (day 500); minima 0.1068 vs 0.1129. The price path is the one r1 intended; it is now computable.

## Defect 2 — power-resource operating identity applied to legacy modes (validation)

```text
[FAIL] A power-resource operating identity: max abs error 1316.93 > 1e-8 at day 364.75
[FAIL] B power-resource operating identity: max abs error 549.99  > 1e-8 at day 12.5
```

**Cause.** `Power Resource Consumption = Energy Supply × Power Resource per Energy` sat in `global_checks`, i.e. it was asserted in all 27 modes. The consumption FLOW is gated by `Power Resource Enabled`, so in Modes 0–24 it is 0 while `Energy Supply` is 1300–1800 (A) and ~550 (B) — the reported error is simply the energy supply of that mode. The identity was false by construction in every legacy mode; the failing magnitudes are the tell.

**Fix (validation only, the model is right).** The identity moves into Modes 25–26, where the mechanic is on. Modes 0–24 assert the switch-off state instead, five checks per colony:

| Check | Assertion |
|---|---|
| `X power resource consumption is zero (switch off)` | max ≤ 0 |
| `X power resource extraction is zero (switch off)` | max ≤ 0 |
| `X power resource fulfillment is 1 (switch off)` | min ≥ 1 |
| `X power resource inventory is a dead stock (switch off)` | min ≥ 5000 |
| `X power resource price stays at base (switch off)` | max ≤ 0.04 |

This is the rule already recorded for the v7.5 capital-goods pairs in `validation.notes`: **a pair identity is only valid in the modes where its flow is enabled.** The last check is new relative to that precedent and exists because of defect 1 — it pins the price channel to `Base Power Resource Price` whenever the kernel is off.

## Verification of r2

| Gate | Result |
|---|---|
| `LIFECYCLE_CONFORMANCE` | **PASS** — 7 instances, 7 × kernel-v2 variation, 0 non-conforming |
| `STRUCTURE_AUDIT` | **PASS** — 139 flows / 108 boundary, unclassified 0, pairs 13 (unpaired 0), closed-world violations **0**; symmetry mismatches 0, exceptions 0 |
| `RUN_TESTS` Modes 0–26 | **OVERALL: PASS** — 27/27 |
| `COMPARE_MODELS` Modes 0–24 vs accepted v7.5.1 r1 | 25 × `common = 963, changed = 0, maxAbs = 0`, added 41, removed 0 |
| Lab self-tests | QA 29/29, POLICY 10/10, CONFORMANCE 18/18, STRUCTURE 21/21, COMPARE PASS |
| Parameter registry | 325 external values, 159 annotated, 41 asymmetric A/B pairs, **0** of them unannotated |

`COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED` — the scenario contract changed because Modes 0–24 now also set `Power Resource Enabled = 0`; every common series is bit-identical.

## Mode 25 / Mode 26 behaviour (r2)

| Series (colony A) | Mode 25 @360 | Mode 25 @720 | Mode 26 @360 | Mode 26 @720 |
|---|---:|---:|---:|---:|
| Power Resource Fulfillment | 1.000 | 0.116 | 1.000 | 1.000 |
| Power Resource Inventory | 6460 | 162 | 6460 | 3161 |
| Power Resource Price | 0.040 | 0.181 | 0.040 | 0.040 |
| Active Generation Capacity | 1373 | 722 | 824 | 1100 |
| Energy Supply | 1373 | 81 | 173 | 1075 |
| Energy Price | 0.158 | 0.261 | 0.503 | 0.120 |
| Smelting Rate | 38.6 | 2.0 | 5.8 | 28.7 |

The two scenarios separate the intended way. Mode 25: capital survives (installed generation capital 1379 → 1285, −7 %) while the resource runs out and energy collapses — a resource-limited outage. Mode 26: the resource stays whole (fulfillment 1.000, price at base) and the outage is capacity-limited. B is untouched in both.

## Observation not fixed here (calibration, not a defect)

The Mode 25 shock is severe: extraction × 0.1 for 360 days against a 2-day inventory buffer drains a 6460-unit stock to 162 and cuts A smelting 38.6 → 2.0 and A electronics production 17.9 → 1.7. Nothing in the contract is violated — the scenario is meant to bind — but the shock is closer to "resource cut off" than to "resource supply shock", and the recovery it exercises is a restart rather than a recovery. If a milder resource shock is wanted for comparability with Modes 18 and 22, the parameter to move is `Power Resource Shock Factor` (0.1), not the kernel. Flagged for the next calibration pass.
