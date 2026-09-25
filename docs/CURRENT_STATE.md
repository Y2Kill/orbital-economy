# Current State

**Document status:** CURRENT  
**Describes code:** Orbital Economy v7.6.1 r1 — Energy Kernel v2, Mode 25 calibrated  
**Base:** accepted v7.6 r2 (itself built on v7.5.1 r1)  
**Model SHA-256:** `16e8ca6c5719e67422e16a6ec1ea2724b6121a062200eaf91e81389a2a180cd1`

## 1. Checkpoint

| Property | Value |
|---|---:|
| ModelJSON elements | 2944 |
| VARIABLE | 798 |
| STOCK | 67 |
| FLOW | 139 |
| LINK | 1940 |
| Named primitives | 1004 |
| Scenarios | 27 |
| Simulation | 0..1080 days |
| Time step | 0.25 day |
| Engine | `simulation@9.0.0` |

## 2. Existing material economy

The accepted v7.5.1 production graph is preserved:

```text
Ore → Metal → Electronics
          ↘       ↙
          Capital Goods
               ↓
Refinery / Electronics / Power / Transport expansion
```

Capital expansion remains physically backed. The declared external-capital expansion audit remains at zero violations.

## 3. Energy Kernel v2

The old abstraction was effectively:

```text
Active Generation Capacity → Energy available to industry
```

v7.6 inserts an explicit operating-resource constraint:

```text
Power Resource Extraction
          ↓
Power Resource Inventory
          ↓
Power Resource Fulfillment ─────────────┐
                                        ↓
Requested Energy → Desired Generation ← Active Generation Capacity
                                        ↓
                              Available Generation
                                        ↓
                               Energy Fulfillment
                                        ↓
                              Metal / Electronics
                                        ↓
                              actual Energy Supply
                                        ↓
                           Power Resource Consumption
```

For each region:

- `Desired Generation = min(Total Requested Energy, Active Generation Capacity)`;
- `Power Resource Demand = Desired Generation × Power Resource per Energy`;
- fulfillment depends on physical inventory relative to configured buffer coverage;
- `Available Generation = Desired Generation × Resource Fulfillment` when the kernel is enabled;
- actual resource consumption equals delivered `Energy Supply × Power Resource per Energy`;
- resource scarcity contributes to `Effective Power Generation Cost` and therefore to energy price — through `Perceived Power Resource Fulfillment`, the coverage of the **smoothed** demand signal, not through this tick's rationing ratio (see §4a).

### 3a. Two scarcity ratios — physical and perceived

Energy price feeds industrial demand, industrial demand sets requested energy, requested energy sets desired generation and therefore resource demand. If the resource **price** then read the same-tick rationing ratio, the chain would close on itself; in r1 it did, and Modes 25–26 aborted with an algebraic loop. The model's own idiom fixes it: price signals read smoothed state, not instantaneous demand.

```text
X Perceived Power Resource Demand      = min(X Energy Demand Signal, X Power Active Generation Capacity) x Power Resource per Energy
X Perceived Power Resource Fulfillment = min(1, Inventory / (Buffer Days x Perceived Demand))   -> price channel
X Power Resource Fulfillment           = min(1, Inventory / (Buffer Days x Resource Demand))    -> physical rationing
```

`X Energy Demand Signal` is the existing STOCK that smooths total requested energy (`Energy Demand Signal Adjustment Time` = 3 days) and already serves `X Perceived Energy Scarcity Ratio` the same way. Both ratios are 1 when the kernel switch is off.

### Resource extraction abstraction

The resource is intentionally generic in v7.6. It represents the physical operating input of a dispatchable resource-dependent generation technology. It is a kernel/proof-of-architecture layer, **not** a claim that all future power technologies consume one universal fuel.

Extraction adjusts toward current resource demand plus a target-inventory correction. This gives the kernel a replenishable physical source while preserving scarcity and stock depletion under supply shocks.

## 4. Switch and regression contract

`Power Resource Enabled` is the v7.6 master switch.

- `0`: all new resource flows are inert; `Available Generation` falls back to the accepted active-capacity path; generation cost falls back to the accepted v7.5.1 expression.
- `1`: Energy Kernel v2 operates.

In v7.6, Modes **0–24** were the exact-regression scope against v7.5.1 and Modes **25–26** were new. In v7.6.1, Modes **0–24** and **26** reproduce v7.6 r2 exactly (every series except the recalibrated constant's own series); Mode 25 changes by design.

## 5. New scenarios

### Mode 25 — Energy Resource Supply Shock

A-only primary resource extraction is temporarily reduced to **50 %** (`Power Resource Shock Factor = 0.5`, since v7.6.1; 0.1 before) during the standard shock window. Generation capital is not directly damaged. The scenario demonstrates resource-limited generation, physical stock drawdown, higher scarcity cost and recovery: A energy stays at ~45 % of the no-shock control over the window (validated: never below 400 against a pre-shock 1373), and the lasting damage to A generation capital matches the Mode 26 control. At 0.1 the scenario was a cut-off (~7 % of control energy) and exercised a restart rather than a recovery — see `V7_6_1_CALIBRATION_REPORT.md`.

### Mode 26 — Energy Capacity-Only Control Shock

A-only active generation capacity is temporarily reduced (factor 0.6) while resource extraction remains normal. This control scenario separates **capacity scarcity** from **operating-resource scarcity**; since v7.6.1 the two shocks are impact-matched, so the pair differs in mechanism rather than in severity.

Both shock wirings use symmetric A/B applicability flags; A=1 and B=0. This preserves the structural symmetry audit while deliberately applying the experiment to A. B is not shocked, but it is not unaffected: through trade its electronics output moves by up to ~40 % (Mode 25) and ~70 % (Mode 26) against the no-shock control.

## 6. Static QA

| Metric | v7.6.1 r1 (= v7.6 r2) |
|---|---:|
| FLOW | 139 |
| Boundary flows | 108 |
| Unclassified boundary flows | 0 |
| Declared transformation pairs | 13 |
| Unpaired transformation flows | 0 |
| Declared external-capital violations | **0** |
| A/B symmetry mismatches | **0** |
| A/B parameter differences | 94 |
| Capital lifecycle instances | 7 |
| Capital lifecycle non-conforming | **0** |

Executable validation Modes 0–26 (`validation/validation-v7.6.1.json`, one new Mode 25 check) was run locally on 2026-09-25: **27/27 PASS**; Modes 0–24 and 26 reproduce v7.6 r2 exactly apart from the recalibrated constant's own series (26 × `common=1004, changed=1`). v7.6 r2 in its turn reproduced v7.5.1 r1 exactly in Modes 0–24 (25 × `common=963, changed=0, maxAbs=0`, 41 added series). See `ACCEPTANCE_STATUS.md`.

## 7. What v7.6 deliberately does not implement

- separate coal/oil/gas/uranium chains;
- nuclear enrichment;
- solar/wind/hydro/geothermal technology models;
- batteries or grid storage;
- transmission/network losses;
- peak/off-peak dispatch;
- power-grid stability/frequency;
- energy demand for every future industry.

Those are later layers on top of the kernel, not part of this change.
