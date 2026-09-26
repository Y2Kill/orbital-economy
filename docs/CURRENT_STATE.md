# Current State

**Document status:** CURRENT  
**Describes code:** Orbital Economy v7.7 r1 — Construction Materials  
**Base:** accepted v7.6.1 r1 (Energy Kernel v2, Mode 25 calibrated)  
**Model SHA-256:** `5bbc29b6e18caa64ec22267892b6cd0669649722c8fc029d8dba43a77a34d5a1`

## 1. Checkpoint

| Property | Value |
|---|---:|
| ModelJSON elements | 3142 |
| VARIABLE | 848 |
| STOCK | 71 |
| FLOW | 151 |
| LINK | 2072 |
| Named primitives | 1070 |
| Scenarios | 30 |
| Simulation | 0..1080 days |
| Time step | 0.25 day |
| Engine | `simulation@9.0.0` |
| Canonical platform (bit-exact numbers) | Windows x64 · Node 24.11.1 — `VERSIONING_AND_AUTHORITY.md` §8 |

## 2. Existing material economy

The v7.5.1 production graph is preserved and, since v7.7, extended by a second raw-material chain:

```text
Ore → Metal → Electronics          Regolith → Construction Materials
          ↘       ↙                                  │
          Capital Goods ─────────────┬───────────────┘
               ↓                     ↓
   Transport expansion     Refinery / Electronics / Power expansion
```

Capital expansion remains physically backed. The declared external-capital expansion audit remains at zero violations.

### 2a. Construction Materials (v7.7)

Each colony extracts regolith into a regional inventory and processes it into construction materials at a fixed capacity (no energy in v7.7). Colonial expansion needs both physical inputs:

```text
X <Sector> Expansion = X <Sector> Desired Expansion × Min(X Capital Goods Fulfillment, X Construction Materials Fulfillment)
```

and consumes construction materials by its own per-capacity norm (Refinery 20, Electronics 12, Power 1 — calibration parameters). Fulfillment and raw-material availability are scale-free (buffers in days of demand). Transport does not use construction materials yet (v7.7.1). Colony B builds only when stimulated: it starts with more Refinery / Electronics / Power capacity than it needs, so in calm scenarios (Modes 17, 21, 27) it winds capacity down, while demand surges and shocks make it expand (Modes 18–20, 23–26 — e.g. Mode 24 through the reused transport surge). None of Modes 27–29 stimulates B, so its construction-materials sector is idle there and B's construction-materials path is exercised only at zero; a stimulated Mode is planned with v7.7.1. Switch `Construction Materials Enabled`: Modes 0–26 = 0 (exact regression), Modes 27–29 = 1. Spec, test plan, delivery and acceptance: `docs/tasks/008-construction-materials/`.

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

In v7.6, Modes **0–24** were the exact-regression scope against v7.5.1 and Modes **25–26** were new. In v7.6.1, Modes **0–24** and **26** reproduced v7.6 r2 exactly (every series except the recalibrated constant's own series). In v7.7, Modes **0–26** set `Construction Materials Enabled = 0` and reproduce v7.6.1 r1 bit for bit on the canonical platform; Modes **27–29** are new.

## 5. New scenarios

### Mode 25 — Energy Resource Supply Shock

A-only primary resource extraction is temporarily reduced to **50 %** (`Power Resource Shock Factor = 0.5`, since v7.6.1; 0.1 before) during the standard shock window. Generation capital is not directly damaged. The scenario demonstrates resource-limited generation, physical stock drawdown, higher scarcity cost and recovery: A energy stays at ~45 % of the no-shock control over the window (validated: never below 400 against a pre-shock 1373), and the lasting damage to A generation capital matches the Mode 26 control. At 0.1 the scenario was a cut-off (~7 % of control energy) and exercised a restart rather than a recovery — see `V7_6_1_CALIBRATION_REPORT.md`.

### Mode 26 — Energy Capacity-Only Control Shock

A-only active generation capacity is temporarily reduced (factor 0.6) while resource extraction remains normal. This control scenario separates **capacity scarcity** from **operating-resource scarcity**; since v7.6.1 the two shocks are impact-matched, so the pair differs in mechanism rather than in severity.

Both shock wirings use symmetric A/B applicability flags; A=1 and B=0. This preserves the structural symmetry audit while deliberately applying the experiment to A. B is not shocked, but it is not unaffected: through trade its electronics output moves by up to ~40 % (Mode 25) and ~70 % (Mode 26) against the no-shock control.

### Mode 27 — Construction Materials Baseline

The full model with every switch on. A extracts regolith and produces construction materials; A construction-materials fulfillment stays at ≈ 0.97, on a par with capital goods — construction materials do not choke expansion in calm conditions.

### Mode 28 — Construction Materials Supply Shock

A processing capacity × 0.1 during the standard window. A construction-materials fulfillment falls to ≈ 0.36 and A Refinery expansion to ≈ 36 % of desired, while capital goods stay available (≈ 0.97) — the brake is construction materials; full recovery after the window.

### Mode 29 — Regolith Supply Shock

A regolith extraction × 0.1 during the same window. The regolith stock is drained (≈ 0.9 of an initial 40), processing is raw-material-limited below its unshocked capacity, fulfillment falls to ≈ 0.48; recovery after the window. The 28/29 pair separates processing scarcity from raw-material scarcity, like 26/25 for energy.

## 6. Static QA

| Metric | v7.7 r1 |
|---|---:|
| FLOW | 151 |
| Boundary flows | 120 |
| Unclassified boundary flows | 0 |
| Declared transformation pairs | 15 |
| Unpaired transformation flows | 0 |
| Declared external-capital violations | **0** |
| A/B symmetry mismatches | **0** |
| A/B parameter differences | 102 |
| Capital lifecycle instances | 7 |
| Capital lifecycle non-conforming | **0** |

Executable validation Modes 0–29 (`validation/validation-v7.7.json`) was run on the canonical platform on 2026-09-26: **30/30 PASS**; Modes 0–26 reproduce v7.6.1 r1 exactly (27 × `common=1004, changed=0, maxAbs=0`, 66 added series). v7.6.1 had reproduced v7.6 r2 in Modes 0–24 and 26 apart from the recalibrated constant's own series. v7.6 r2 in its turn reproduced v7.5.1 r1 exactly in Modes 0–24 (25 × `common=963, changed=0, maxAbs=0`, 41 added series). See `ACCEPTANCE_STATUS.md`.

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
