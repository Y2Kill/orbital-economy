# Orbital Economy Lab — model-to-model comparison

- generated: 2026-09-21T19:02:08.879Z
- engine: simulation 9.0.0; Node v24.11.1
- run status: **COMPLETE**
- comparison result: **OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED**
- byte-identical: **NO**

## Models

- accepted: Orbital Economy v7.4 Intermediate Inputs candidate r2
  - SHA-256: `5de080f30bcfd2229c600121cf32cb48c28f6eec1d98215fdd36f907fe2d6ee3`
  - file: <old-project>\orbital-economy-baseline-v7.4\lab\reference\accepted\model\orbital_economy_v7_4_modeljson.json
- candidate: Orbital Economy v7.5 SKELETON (A: capital goods + refinery/power expansion)
  - SHA-256: `7406c4e4c08ca4a12946df3a5ef66a93b617d3434f40e9c17b076fbd233427f1`
  - file: <old-project>\orbital-economy-baseline-v7.4\lab\output\skeleton-v75\candidate.json
- validation SHA-256: `b840b9a7f333751a5c8e15d66fbe2b84e77a178f46d4fcf6cbb226ef3f2f85ad`
- comparison settings: absTolerance=0; relTolerance=disabled; relFloor=1e-12

## Static validation

- accepted: **PASS**
- candidate: **PASS**
- accepted kernel conformance: **PASS** — A Electronics=CONFORMING_WITH_VARIATION, B Electronics=CONFORMING_WITH_VARIATION, A Power=CONFORMING_WITH_VARIATION, B Power=CONFORMING_WITH_VARIATION, A Refinery=CONFORMING, B Refinery=CONFORMING, Transport=CONFORMING
- candidate kernel conformance: **PASS** — A Electronics=CONFORMING_WITH_VARIATION, B Electronics=CONFORMING_WITH_VARIATION, A Power=CONFORMING_WITH_VARIATION, B Power=CONFORMING_WITH_VARIATION, A Refinery=CONFORMING, B Refinery=CONFORMING, Transport=CONFORMING
- accepted structure audits: **PASS** — open boundaries 90 (unclassified 0, closed-world violations 7); colony symmetry mismatches 0
- candidate structure audits: **PASS** — open boundaries 95 (unclassified 5, closed-world violations 7); colony symmetry mismatches 59

## Structural / behavioral definition diff

- named elements: accepted 852, candidate 874
- added elements (22): A Capital Goods Demand, A Capital Goods Electronics Consumption, A Capital Goods Fulfillment, A Capital Goods Inventory, A Capital Goods Metal Consumption, A Capital Goods Production, A Capital Goods Production Capacity, A Capital Goods Production Rate, A Capital Goods Target Inventory, A Desired Capital Goods Production, A Power Capital Goods Consumption, A Power Capital Goods per Capacity, A Power Desired Expansion, A Refinery Capital Goods Consumption, A Refinery Capital Goods per Capacity, A Refinery Desired Expansion, Capital Goods Adjustment Time, Capital Goods Buffer, Capital Goods Enabled, Capital Goods Target Days, Electronics per Capital Goods Unit, Metal per Capital Goods Unit
- removed elements (0): none
- changed semantic definitions (2): A Power Generation Expansion, A Refinery Expansion
- type changes (0): none
- added LINK pairs (39): A Capital Goods Demand -> A Capital Goods Target Inventory, A Capital Goods Demand -> A Desired Capital Goods Production, A Capital Goods Fulfillment -> A Power Generation Expansion, A Capital Goods Fulfillment -> A Refinery Expansion, A Capital Goods Inventory -> A Capital Goods Fulfillment, A Capital Goods Inventory -> A Desired Capital Goods Production, A Capital Goods Production Capacity -> A Capital Goods Production Rate, A Capital Goods Production Rate -> A Capital Goods Electronics Consumption, A Capital Goods Production Rate -> A Capital Goods Metal Consumption, A Capital Goods Production Rate -> A Capital Goods Production, A Capital Goods Target Inventory -> A Desired Capital Goods Production, A Desired Capital Goods Production -> A Capital Goods Production Rate, A Electronics Buffer -> A Capital Goods Production Rate, A Electronics Inventory -> A Capital Goods Production Rate, A Metal Buffer -> A Capital Goods Production Rate, A Metal Inventory -> A Capital Goods Production Rate, A Power Capital Goods per Capacity -> A Capital Goods Demand, A Power Capital Goods per Capacity -> A Power Capital Goods Consumption, A Power Desired Expansion -> A Capital Goods Demand, A Power Desired Expansion -> A Power Generation Expansion, A Power Gap Limited Construction -> A Power Desired Expansion, A Power Generation Expansion -> A Power Capital Goods Consumption, A Refinery Capital Goods per Capacity -> A Capital Goods Demand, A Refinery Capital Goods per Capacity -> A Refinery Capital Goods Consumption, A Refinery Desired Expansion -> A Capital Goods Demand, A Refinery Desired Expansion -> A Refinery Expansion, A Refinery Expansion -> A Refinery Capital Goods Consumption, A Refinery Finance Limited Construction -> A Refinery Desired Expansion, A Refinery Gap Limited Construction -> A Refinery Desired Expansion, Capital Goods Adjustment Time -> A Desired Capital Goods Production … (+9)
- removed LINK pairs (0): none
- simulation settings changed: **NO**
- added Modes: 21
- removed Modes: none
- changed scenario inputs: 21
  - Mode 0: accepted={"Timed Test Mode":0,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}; candidate={"Timed Test Mode":0,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0,"Capital Goods Enabled":0}
  - Mode 1: accepted={"Timed Test Mode":1,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}; candidate={"Timed Test Mode":1,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0,"Capital Goods Enabled":0}
  - Mode 2: accepted={"Timed Test Mode":2,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}; candidate={"Timed Test Mode":2,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0,"Capital Goods Enabled":0}
  - Mode 3: accepted={"Timed Test Mode":3,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}; candidate={"Timed Test Mode":3,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0,"Capital Goods Enabled":0}
  - Mode 4: accepted={"Timed Test Mode":4,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}; candidate={"Timed Test Mode":4,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0,"Capital Goods Enabled":0}
  - Mode 5: accepted={"Timed Test Mode":5,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}; candidate={"Timed Test Mode":5,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0,"Capital Goods Enabled":0}
  - Mode 6: accepted={"Timed Test Mode":6,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}; candidate={"Timed Test Mode":6,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0,"Capital Goods Enabled":0}
  - Mode 7: accepted={"Timed Test Mode":7,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}; candidate={"Timed Test Mode":7,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0,"Capital Goods Enabled":0}
  - Mode 8: accepted={"Timed Test Mode":8,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}; candidate={"Timed Test Mode":8,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0,"Capital Goods Enabled":0}
  - Mode 9: accepted={"Timed Test Mode":9,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}; candidate={"Timed Test Mode":9,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0,"Capital Goods Enabled":0}
  - Mode 10: accepted={"Timed Test Mode":10,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}; candidate={"Timed Test Mode":10,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0,"Capital Goods Enabled":0}
  - Mode 11: accepted={"Timed Test Mode":11,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}; candidate={"Timed Test Mode":11,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0,"Capital Goods Enabled":0}
  - Mode 12: accepted={"Timed Test Mode":12,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":0}; candidate={"Timed Test Mode":12,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":0,"Capital Goods Enabled":0}
  - Mode 13: accepted={"Timed Test Mode":13,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":0}; candidate={"Timed Test Mode":13,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":0,"Capital Goods Enabled":0}
  - Mode 14: accepted={"Timed Test Mode":14,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":0}; candidate={"Timed Test Mode":14,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":0,"Capital Goods Enabled":0}
  - Mode 15: accepted={"Timed Test Mode":15,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":0}; candidate={"Timed Test Mode":15,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":0,"Capital Goods Enabled":0}
  - Mode 16: accepted={"Timed Test Mode":16,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":0}; candidate={"Timed Test Mode":16,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":0,"Capital Goods Enabled":0}
  - Mode 17: accepted={"Timed Test Mode":17,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":1}; candidate={"Timed Test Mode":17,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":1,"Capital Goods Enabled":0}
  - Mode 18: accepted={"Timed Test Mode":18,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":1}; candidate={"Timed Test Mode":18,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":1,"Capital Goods Enabled":0}
  - Mode 19: accepted={"Timed Test Mode":19,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":1}; candidate={"Timed Test Mode":19,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":1,"Capital Goods Enabled":0}

## Scenario comparison

| Mode | Candidate scenario | Candidate validation | Output | Common | Changed | Added | Removed | Max abs diff |
|---:|---|:---:|:---:|---:|---:|---:|---:|---:|
| 0 | Baseline Control | PASS | IDENTICAL | 852 | 0 | 22 | 0 | 0 |
| 12 | v7.3 Lifecycle Baseline | PASS | IDENTICAL | 852 | 0 | 22 | 0 | 0 |
| 17 | v7.4 Intermediate Inputs Baseline | PASS | IDENTICAL | 852 | 0 | 22 | 0 | 0 |

### Mode 0 — Baseline Control

- status: **IDENTICAL**
- scenario inputs equal: **NO**
- runtime: accepted 7.8983203 s; candidate 8.3719519 s
- candidate validation: **PASS**
- output: **IDENTICAL**
- time axis exact: true; rows accepted/candidate: 4321/4321; max time diff: 0
- series: accepted 852; candidate 874; common 852; comparable 852
- changed series: 0; changed points: 0
- added series (22): A Capital Goods Demand, A Capital Goods Electronics Consumption, A Capital Goods Fulfillment, A Capital Goods Inventory, A Capital Goods Metal Consumption, A Capital Goods Production, A Capital Goods Production Capacity, A Capital Goods Production Rate, A Capital Goods Target Inventory, A Desired Capital Goods Production, A Power Capital Goods Consumption, A Power Capital Goods per Capacity, A Power Desired Expansion, A Refinery Capital Goods Consumption, A Refinery Capital Goods per Capacity, A Refinery Desired Expansion, Capital Goods Adjustment Time, Capital Goods Buffer, Capital Goods Enabled, Capital Goods Target Days, Electronics per Capital Goods Unit, Metal per Capital Goods Unit
- removed series (0): none
- max abs diff: 0; max rel diff: 0

### Mode 12 — v7.3 Lifecycle Baseline

- status: **IDENTICAL**
- scenario inputs equal: **NO**
- runtime: accepted 8.0863707 s; candidate 8.4229355 s
- candidate validation: **PASS**
- output: **IDENTICAL**
- time axis exact: true; rows accepted/candidate: 4321/4321; max time diff: 0
- series: accepted 852; candidate 874; common 852; comparable 852
- changed series: 0; changed points: 0
- added series (22): A Capital Goods Demand, A Capital Goods Electronics Consumption, A Capital Goods Fulfillment, A Capital Goods Inventory, A Capital Goods Metal Consumption, A Capital Goods Production, A Capital Goods Production Capacity, A Capital Goods Production Rate, A Capital Goods Target Inventory, A Desired Capital Goods Production, A Power Capital Goods Consumption, A Power Capital Goods per Capacity, A Power Desired Expansion, A Refinery Capital Goods Consumption, A Refinery Capital Goods per Capacity, A Refinery Desired Expansion, Capital Goods Adjustment Time, Capital Goods Buffer, Capital Goods Enabled, Capital Goods Target Days, Electronics per Capital Goods Unit, Metal per Capital Goods Unit
- removed series (0): none
- max abs diff: 0; max rel diff: 0

### Mode 17 — v7.4 Intermediate Inputs Baseline

- status: **IDENTICAL**
- scenario inputs equal: **NO**
- runtime: accepted 8.8941998 s; candidate 8.4989945 s
- candidate validation: **PASS**
- output: **IDENTICAL**
- time axis exact: true; rows accepted/candidate: 4321/4321; max time diff: 0
- series: accepted 852; candidate 874; common 852; comparable 852
- changed series: 0; changed points: 0
- added series (22): A Capital Goods Demand, A Capital Goods Electronics Consumption, A Capital Goods Fulfillment, A Capital Goods Inventory, A Capital Goods Metal Consumption, A Capital Goods Production, A Capital Goods Production Capacity, A Capital Goods Production Rate, A Capital Goods Target Inventory, A Desired Capital Goods Production, A Power Capital Goods Consumption, A Power Capital Goods per Capacity, A Power Desired Expansion, A Refinery Capital Goods Consumption, A Refinery Capital Goods per Capacity, A Refinery Desired Expansion, Capital Goods Adjustment Time, Capital Goods Buffer, Capital Goods Enabled, Capital Goods Target Days, Electronics per Capital Goods Unit, Metal per Capital Goods Unit
- removed series (0): none
- max abs diff: 0; max rel diff: 0

## Interpretation

- `BYTE_IDENTICAL`: files have the same SHA-256 and compared outputs are identical.
- `OUTPUTS_IDENTICAL`: ModelJSON files differ, but all compared scenario outputs are identical at the selected tolerance.
- `DIFFERENT_OUTPUTS`: at least one common scenario produces a changed time series, time axis, or added/removed output series. This is a factual diff, not an automatic judgment that the change is wrong.
- `COMMON_OUTPUTS_IDENTICAL_WITH_NEW_MODES`: all common Modes are output-identical and candidate only adds new Modes; candidate-only Modes are still simulated and validated.
- `NOT_FULLY_COMPARABLE`: candidate is missing at least one Mode that exists in accepted.
- Candidate HARD/physics validation failures are reported separately and make the comparison run FAILED.
