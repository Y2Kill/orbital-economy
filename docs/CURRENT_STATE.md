# Current State

**Document status:** CURRENT  
**Describes code:** Orbital Economy v7.7.8 r1 — Deposits  
**Base:** accepted v7.7.7 r1 (Power Resource Capital)  
**Model SHA-256:** `17794e6c6acec9a965473bc170f1c71e31a82fe7a095ec1391c86eb681c1b50e`

## 1. Checkpoint

| Property | Value |
|---|---:|
| ModelJSON elements | 4337 |
| VARIABLE | 1064 |
| STOCK | 121 |
| FLOW | 263 |
| LINK | 2889 |
| Named primitives | 1448 |
| Scenarios | 46 |
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

Each colony extracts regolith into a regional inventory and processes it into construction materials at a fixed capacity (no energy in v7.7; since v7.7.2 processing draws energy — see 2b). Colonial expansion needs both physical inputs:

```text
X <Sector> Expansion = X <Sector> Desired Expansion × Min(X Capital Goods Fulfillment, X Construction Materials Fulfillment)
```

and consumes construction materials by its own per-capacity norm (Refinery 20, Electronics 12, Power 1 — calibration parameters). Fulfillment and raw-material availability are scale-free (buffers in days of demand). Since v7.7.1 shared Transport expansion draws construction materials from A and B as well (two legs by current stock shares; planning demand split 50/50), with `Min` of its two fulfillments. Colony B builds only when stimulated: it starts with more Refinery / Electronics / Power capacity than it needs, so in calm scenarios (Modes 17, 21, 27) it winds capacity down, while demand surges and shocks make it expand (Modes 18–20, 23–26, 31). Since v7.7.1 shared Transport also draws construction materials from A and B (two legs, as capital goods since v7.5.1), and Mode 31 — the transport surge with everything on — makes B build, extract regolith and produce construction materials. Switches: `Construction Materials Enabled` (Modes 0–26 = 0) and `Transport Construction Materials Enabled` (Modes 0–29 = 0); Modes 30–31 have both on. Spec, test plan, delivery and acceptance: `docs/tasks/008-construction-materials/`.

### 2b. Construction materials use energy (v7.7.2)

Regolith processing is the third consumer of each colony's proportional energy allocator, after smelting and electronics:

```text
X Construction Materials Requested Energy = X Pre Energy CM Production Rate × Construction Materials Energy per Unit (10)
X Construction Materials Production Rate  = X Pre Energy CM Production Rate × X CM Energy Fulfillment Ratio
```

The request joins `X Total Requested Energy`, the allocation joins `X Energy Supply`. The plan that feeds the allocator reads the smoothed stock `X Construction Materials Demand Signal` (adjustment 3 days), not same-step demand: same-step demand closes an algebraic loop through refinery profit (actual smelting → profit → desired expansion → construction-materials demand → energy request → allocator → smelting), found by the loop audit on the first skeleton. This is the v7.6 rule: whatever feeds an allocator or a price reads smoothed state. Colony A's energy is not fully covered even without construction materials (fulfillment ≈ 0.90–0.96 in the coupled Modes), so A's construction materials are energy-limited by ~5–7 % already in the baseline. Planet v1 counter P3: processes requesting energy 4 → 6.

### 2c. Construction materials on capital (v7.7.3)

Processing capacity is capital. Each colony has a **construction-materials plant** — a kernel-v2 instance of the capital lifecycle (installed / active / decommissioning / retired, activation, mothballing, depreciation, surplus disposal), cloned from Refinery without the finance limit (construction materials have no price; the same documented variation as Power). With the switch on, `X Construction Materials Production Capacity` is the plant's active capacity, and the plant expands from local capital goods and construction materials:

```text
X Construction Materials Plant Expansion = Gap Limited Construction × Min(X Capital Goods Fulfillment, X Construction Materials Fulfillment)
```

The plant is sized to the smoothed demand signal of 2b (`Required Active = Demand Signal × 1.1`, `Desired Installed = × 1.15`): sizing it from the production plan closes an algebraic loop (construction materials are needed to build the plant itself), found by the loop audit on the first skeleton. Starting capacity (A 3, B 2) exceeds calm demand, so the plant winds its surplus down like any oversized kernel sector. Planet v1 counter P2: processes on capital 7 → 9.

### 2d. Capital goods on capital (v7.7.4)

Capital-goods production capacity is capital as well: each colony has a **capital-goods plant**, a kernel-v2 lifecycle instance built exactly like the construction-materials plant of 2c (no finance limit, own switch `Capital Goods Capital Enabled`). With the switch on, `X Capital Goods Production Capacity` is the plant's active capacity; the plant expands from capital goods and construction materials. It is sized to a new smoothed stock `X Capital Goods Demand Signal` (adjustment 3 days, the same idiom as the energy and construction-materials demand signals): the plant is built from capital goods, so same-step demand would close an algebraic loop. The former hard ceiling on all construction (A 2, B 1 per day) is gone — in Mode 36 A's plant grows past its starting capacity. Planet v1 counter P2: processes on capital 9 → 11.

### 2e. Regolith mine on simple capital (v7.7.5)

Regolith extraction capacity is no longer a constant (A 7, B 5): each colony has a **regolith mine**, the first instance of **simple capital** — one capacity stock `X Regolith Mine Capacity`, no activation or mothballing. With the switch `Regolith Capital Enabled` on, `X Regolith Extraction Capacity` reads the mine's capacity (the Mode 29 shock stays a multiplier). Desired capacity is a new smoothed stock `X Regolith Demand Signal` (following `X Regolith Requirement`) × 1.25; expansion closes the gap over 90 days, limited by capital-goods and construction-materials fulfillment, and consumes 2 units of each per unit of capacity; depreciation 0.0001/day; excess over desired capacity is retired over 360 days. The sector is generated from the node declaration `model/nodes/regolith-mine.json` (34 elements, 6 formula replacements, 78 links). Planet v1 counter P2: kernel 11 / simple 2 / exceptions 4 (was 11 / 0 / 6).

### 2f. Ore mine on simple capital (v7.7.6)

Ore mining capacity is no longer a constant (A 70, B 28): each colony has an **ore mine**, a `simple_capital` node like the regolith mine of 2e (`model/nodes/ore-mine.json`). With the switch `Ore Capital Enabled` on, `X Effective Mining Capacity` reads `X Ore Mine Capacity` wherever it read `X Mining Capacity` (the Test 18 shock still multiplies it). Desired capacity is a new smoothed stock `X Ore Demand Signal` (following `X Positive Desired Mining Rate`) × 1.25; expansion closes the gap over 90 days, limited by capital-goods and construction-materials fulfillment, and consumes 0.5 units of each per unit of capacity; depreciation and retirement as for the regolith mine. The ore mine wraps the regolith mine's rewrite of the capital-goods and construction-materials demand formulas (nested switches). Planet v1 counter P2: kernel 11 / simple 4 / exceptions 2 — the energy resource is the last process without capital-backed capacity.

### 2g. Power-resource mine on simple capital, smooth cap (v7.7.7)

Energy-resource extraction had no capacity at all: `X Power Resource Extraction Rate` followed demand plus an inventory correction, × 1.1 headroom (× the Mode 25 shock multiplier). Now each colony has a **power-resource mine**, a `simple_capital` node attached in the smooth-cap mode of Lab v0.9.11 (`model/nodes/power-resource-mine.json`): the old rate is kept verbatim as `X Power Resource Mine Uncapped Output`, and with the switch `Power Resource Capital Enabled` on the rate is `U / (1 + (U / (C + 0.001)) ^ 8) ^ 0.125` — the saturation form of ore mining — with `C` the mine capacity (start A 1750, B 650). Desired capacity is a smoothed stock `X Power Resource Demand Signal` (following `X Power Resource Demand`, started per colony at A 1350, B 182.656) × 1.25; expansion from capital goods and construction materials at 0.02 each per unit. The two-day inventory buffer absorbs most of the cap: power-resource fulfillment stays 1.0 in the new Modes. Planet v1 counter P2: **kernel 11 / simple 6 / exceptions 0** — every production capacity in the model is capital.

### 2h. Deposits: proven reserves and exploration (v7.7.8)

Every extraction — ore, regolith, the energy resource — now draws from **proven reserves** (`X R Proven Reserves`, about 10 years of extraction at start), not from ∅. **Exploration** (`X R Exploration`) moves a planetary-scale **undiscovered resource** (`X R Undiscovered Resource`, about 1000 years; both initial values are named parameters, in v8 they come from planet formation) into proven reserves, aiming at 15 years of the smoothed extraction (`X R Extraction Signal`), slowing as the undiscovered stock runs low, and paid in capital goods per unit discovered. Extraction is capped smoothly by proven reserves (not binding on the horizon). One `deposit` node (`model/nodes/deposits.json`), one switch `Deposits Enabled`. The extraction flows are re-sourced to proven reserves (`retarget_flows`) and cannot be switched off: in Modes 0–43 they draw proven reserves down with unchanged values. Planet v1 counter P4: **6 / 0** — every extraction draws from a declared deposit (owner decision 5, 2026-09-30).

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

In v7.6, Modes **0–24** were the exact-regression scope against v7.5.1 and Modes **25–26** were new. In v7.6.1, Modes **0–24** and **26** reproduced v7.6 r2 exactly (every series except the recalibrated constant's own series). In v7.7, Modes **0–26** set `Construction Materials Enabled = 0` and reproduce v7.6.1 r1 bit for bit on the canonical platform; Modes **27–29** are new. In v7.7.1, Modes **0–29** reproduce v7.7 r1 (switch `Transport Construction Materials Enabled`); in v7.7.2, Modes **0–31** set `Construction Materials Energy Enabled = 0` and reproduce v7.7.1 r1 bit for bit; Modes **32–33** are new. In v7.7.3, Modes **0–33** set `Construction Materials Capital Enabled = 0` and reproduce v7.7.2 r1 bit for bit; Modes **34–35** are new. In v7.7.4, Modes **0–35** set `Capital Goods Capital Enabled = 0` and reproduce v7.7.3 r1 bit for bit; Modes **36–37** are new. In v7.7.5, Modes **0–37** set `Regolith Capital Enabled = 0` and reproduce v7.7.4 r1 bit for bit; Modes **38–39** are new. In v7.7.6, Modes **0–39** set `Ore Capital Enabled = 0` and reproduce v7.7.5 r1 bit for bit; Modes **40–41** are new. In v7.7.7, Modes **0–41** set `Power Resource Capital Enabled = 0` and reproduce v7.7.6 r1 bit for bit; Modes **42–43** are new. In v7.7.8, Modes **0–43** set `Deposits Enabled = 0` and reproduce v7.7.7 r1 bit for bit; Modes **44–45** are new.

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

### Mode 30 — Transport Construction Materials Baseline

Everything on, no stimulus. Transport draws construction materials from both A and B (source shares sum to 1); its construction-materials fulfillment stays ≈ 0.99. B does not produce construction materials here: its starting stock covers the transport draw (30 → 13 by day 1080).

### Mode 31 — Transport Surge on Construction Materials

The transport-demand surge of Modes 2 and 24 with everything on. B builds (Power, Refinery), extracts regolith up to its capacity and produces construction materials (≈ 1.85 per day at the peak); its construction-materials fulfillment dips to ≈ 0.93 — the first Mode in which B's construction-materials path runs at non-zero values.

### Mode 32 — Construction Materials Energy Baseline

Everything on, no stimulus. A's construction materials request energy (≈ 0.5 % of A's load) and receive A's fulfillment ratio: minimum ≈ 0.926, output ≈ 5–7 % below the pre-energy plan. The demand signal follows demand to within ≈ 0.001 by day 1080.

### Mode 33 — Generation Capacity Shock with Construction Materials Energy

The capacity-only shock of Mode 26 (A generation × 0.6 in the standard window) with everything on. A's construction stops in the window, so A's construction-materials demand drops to zero; production shifts to B, which builds Power and Refinery, extracts regolith and produces construction materials — under an energy shortfall: B's construction-materials energy fulfillment falls to ≈ 0.715, output ≈ 1.05 per day against a pre-energy plan of ≈ 1.38.

### Mode 34 — Construction Materials Capital Baseline

Everything on, no stimulus. The plants follow the smoothed demand and dispose of surplus: A's installed capacity falls from 3 to ≈ 0.74 by day 1080, B's from 2 to near zero; A briefly mothballs under the small day-0 signal and reactivates for the early demand peak (production peak ≈ 2.24 against ≈ 2.73 in v7.7.2 — a start-up transient).

### Mode 35 — Transport Surge on Construction Materials Capital

The transport-demand surge of Modes 2, 24 and 31 with everything on. By day 360 B's plant is mothballed down to ≈ 0.47; in the surge B **rebuilds it** to ≈ 1.45 from capital goods and construction materials. Until it is rebuilt, B's construction materials are short: fulfillment falls to ≈ 0.12 (≈ 0.93 in v7.7.1 Mode 31 with a constant capacity). Construction-materials output now has inertia.

### Mode 36 — Capital Goods Capital Baseline

Everything on, no stimulus. At the early demand peak A's capital-goods plant grows past its starting capacity (2 → ≈ 2.09) — the first time a producer of capital goods expands at all — and then disposes of surplus (≈ 0.51 by day 1080); B's plant winds down to near zero.

### Mode 37 — Transport Surge on Capital Goods Capital

The transport-demand surge with everything on. By day 360 B's capital-goods plant is mothballed down to ≈ 0.24; in the surge B rebuilds it to ≈ 1.15. Until it is rebuilt, B is short of capital goods (fulfillment ≈ 0.19, against ≈ 0.92 in v7.7.3 Mode 35) and of construction materials (≈ 0.13): both plants of B recover from the same inventories.

### Mode 38 — Regolith Capital Baseline

Everything on, no stimulus. At the early demand peak A's regolith mine grows 7 → ≈ 8.83, then retires its excess down to ≈ 2.29; B's mine, without demand, winds down 5 → ≈ 0.22.

### Mode 39 — Transport Surge on Regolith Capital

The transport-demand surge with everything on. By day 360 B's mine is down to ≈ 1.78; in the surge B **rebuilds** it to ≈ 8.19 and B's regolith extraction reaches ≈ 3.54/day. B is short of construction materials meanwhile (fulfillment down to ≈ 0.10): the inertia of the chain now starts at the raw material.

### Mode 40 — Ore Capital Baseline

Everything on, no stimulus. A's ore mine first sheds a little surplus (70 → ≈ 67 by day 100), then grows to ≈ 75: A's mining is no longer capped at 70 and reaches ≈ 60/day by the end. B's mine, with little demand, winds down 28 → ≈ 12.

### Mode 41 — Transport Surge on Ore Capital

The transport-demand surge with everything on. By day 360 B's ore mine is down to ≈ 19; in the surge B **rebuilds** it to ≈ 27 and mines up to ≈ 23/day. While the mine is being rebuilt, B's ore inventory is drawn down to ≈ 2394 (≈ 2481 in v7.7.5 Mode 39): the chain's inertia now starts at the ore as well.

### Mode 42 — Power Resource Capital Baseline

Everything on, no stimulus. A's mine first sheds a little surplus (1750 → ≈ 1673), then grows to ≈ 1890; the cap trims ≈ 2 % of A's extraction and A's inventory grows more slowly than in v7.7.6. B's mine first builds up while B's energy demand rises from 183 to ≈ 490 in the first ~100 days (expansion up to ≈ 0.18/day until day ~208), then winds down 650 → ≈ 471.

### Mode 43 — Transport Surge on Power Resource Capital

The transport-demand surge with everything on. By day 360 B's mine is ≈ 597; in the surge B **rebuilds** it to ≈ 673 (expansion up to ≈ 0.52/day); the cap trims up to ≈ 6 % of B's extraction and B's power-resource inventory is drawn down to ≈ 1606 (≈ 2153 in v7.7.6 Mode 41). B's energy shortfall (up to ≈ 173) is the same as in v7.7.6: generation capacity sets it, not the mine.

### Mode 44 — Deposits Baseline

Everything on, no stimulus. Exploration keeps proven reserves near their target — it roughly keeps pace with extraction; B's proven ore reserves **grow** above their initial 36 000 (to ≈ 37 050). B's regolith is not explored: B has no regolith demand.

### Mode 45 — Transport Surge on Deposits

The transport-demand surge with everything on. During the surge B starts exploring regolith (up to ≈ 2.4/day) and steps up exploration of the energy resource (up to ≈ 885/day); B's proven ore reaches ≈ 38 140. **Exploration competes with construction for capital goods**: B's capital-goods fulfillment falls to ≈ 0.12 in the surge window (≈ 0.17 in v7.7.7 Mode 43).

## 6. Static QA

| Metric | v7.7.8 r1 |
|---|---:|
| FLOW | 263 |
| Boundary flows | 208 |
| Unclassified boundary flows | 0 |
| Declared transformation pairs | 25 |
| Unpaired transformation flows | 0 |
| Declared external-capital violations | **0** |
| A/B symmetry mismatches | **0** |
| A/B parameter differences | 134 |
| Capital lifecycle instances | 11 |
| Capital lifecycle non-conforming | **0** |
| Simple capital instances | 6 (non-conforming **0**) |
| Deposit instances | 6 (non-conforming **0**) |

Executable validation Modes 0–45 (`validation/validation-v7.7.8.json`) was run on the canonical platform on 2026-10-02: **46/46 PASS** (13600 checks); Modes 0–43 reproduce v7.7.7 r1 exactly (44 × `common=1348, changed=0, maxAbs=0`, 100 added series). v7.7.7 had reproduced v7.7.6 r1 exactly in Modes 0–41. v7.7.6 had reproduced v7.7.5 r1 exactly in Modes 0–39. v7.7.5 had reproduced v7.7.4 r1 exactly in Modes 0–37. v7.7.4 had reproduced v7.7.3 r1 exactly in Modes 0–35. v7.7.3 had reproduced v7.7.2 r1 exactly in Modes 0–33. v7.7.2 had reproduced v7.7.1 r1 exactly in Modes 0–31. v7.7.1 had reproduced v7.7 r1 exactly in Modes 0–29. Static: algebraic loops 0 of 16384 switch combinations; Planet v1 closure P2 11/6/0/0, P4 6/0, P3 6/2/9/0, P4 0/6, P5 4/13, P6 4. v7.7 had reproduced v7.6.1 r1 exactly in Modes 0–26. v7.6.1 had reproduced v7.6 r2 in Modes 0–24 and 26 apart from the recalibrated constant's own series. v7.6 r2 in its turn reproduced v7.5.1 r1 exactly in Modes 0–24 (25 × `common=963, changed=0, maxAbs=0`, 41 added series). See `ACCEPTANCE_STATUS.md`.

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
