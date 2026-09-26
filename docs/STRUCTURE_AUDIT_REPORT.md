# Orbital Economy Lab — structure audit

- generated: 2026-09-26T14:15:38.057Z
- model: Orbital Economy v7.7.1 r1 — Transport on Construction Materials
- model SHA-256: `d53d014d727a439694e103aafb49f87d4dbbb362e581414cbf4dc71a19646f93`
- validation: Orbital Economy v7.7.1 validation r2
- validation SHA-256: `2b5ef810dc9aaff5beaaa9b25c0410a6e859e6195753f133755136487913c9a6`
- status: **PASS**

## Open boundaries (declared physical-boundary meter)

- flows total: 153; crossing the model boundary: 122; classified: 122; unclassified: 0
- closed-world violations: **0** (mode: `classify`) — zero means the currently declared closed-world boundary contract is satisfied; it is not a Planet v1 completeness claim
- declared transformation pairs: 15; transformation flows without a pair: 0

| Category | closed-world | Flows | Reason |
|---|:---:|---:|---|
| primary_extraction | yes | 4 | primary resources enter from the planet itself |
| power_resource_extraction | yes | 2 | v7.6 primary planetary energy resource enters regional physical inventory through explicit extraction. |
| regolith_extraction | yes | 2 | v7.7 primary bulk resource (regolith) enters regional physical inventory through explicit extraction. |
| final_consumption | yes | 4 | final goods leave the economy as consumption |
| power_resource_consumption | yes | 2 | v7.6 physical operating resource is consumed in exact proportion to actual delivered generation. |
| unit_transformation | yes | 8 | input stock -> output stock conversion modelled as a sink/source pair (different units); every flow here must belong to a declared transformation pair whose numeric identity is checked at runtime |
| information_signal | yes | 30 | smoothing / information stocks, not matter |
| financial_accounting | yes | 16 | money bookkeeping, not matter |
| capital_state_accounting | yes | 21 | Active is an operational-state sub-account of Installed; these flows change state, not physical capital |
| capital_transformation | yes | 23 | v7.5/v7.5.1: installed capital expansion is a unit transformation of Capital Goods; regional sectors use one local sink, shared Transport uses two A/B regional sinks whose total identity is checked at runtime. v7.7: colonial sector expansion is additionally backed by a local Construction Materials sink. v7.7.1: shared Transport expansion is additionally backed by construction materials from both A and B inventories (two legs). |
| capital_goods_transformation | yes | 6 | metal + electronics -> capital goods (declared pair; identity checked at runtime) |
| construction_materials_transformation | yes | 4 | v7.7: regolith -> construction materials (declared pair; identity checked at runtime) |
| external_capital | **no** | 0 | capital created without physical goods; expected count is zero from v7.5.1 onward for the currently declared expansion-boundary audit |


Declared unit-transformation pairs (source flow physically backed by sink flows; numeric identity is a runtime check):

| Source (∅ → stock) | Sinks (stock → ∅) | Identity check | Status |
|---|---|---|---|
| A Metal Production | A Ore Consumption | A ore->metal pair identity | ok |
| A Electronics Production | A Electronics Feedstock Consumption | A feedstock->electronics pair identity (per mode) | ok |
| B Metal Production | B Ore Consumption | B ore->metal pair identity | ok |
| B Electronics Production | B Electronics Feedstock Consumption | B feedstock->electronics pair identity (per mode) | ok |
| A Refinery Expansion | A Refinery Capital Goods Consumption, A Refinery Construction Materials Consumption | A Refinery capital goods pair identity | ok |
| A Electronics Factory Expansion | A Electronics Capital Goods Consumption, A Electronics Construction Materials Consumption | A Electronics capital goods pair identity | ok |
| A Power Generation Expansion | A Power Capital Goods Consumption, A Power Construction Materials Consumption | A Power capital goods pair identity | ok |
| A Capital Goods Production | A Capital Goods Metal Consumption, A Capital Goods Electronics Consumption | A capital goods production pair identities | ok |
| B Refinery Expansion | B Refinery Capital Goods Consumption, B Refinery Construction Materials Consumption | B Refinery capital goods pair identity | ok |
| B Electronics Factory Expansion | B Electronics Capital Goods Consumption, B Electronics Construction Materials Consumption | B Electronics capital goods pair identity | ok |
| B Power Generation Expansion | B Power Capital Goods Consumption, B Power Construction Materials Consumption | B Power capital goods pair identity | ok |
| B Capital Goods Production | B Capital Goods Metal Consumption, B Capital Goods Electronics Consumption | B capital goods production pair identities | ok |
| Transport Capacity Expansion | A Transport Capital Goods Consumption, B Transport Capital Goods Consumption, A Transport Construction Materials Consumption, B Transport Construction Materials Consumption | Transport capital goods pair identity | ok |
| A Construction Materials Production | A Construction Materials Regolith Consumption | A construction materials production pair identity | ok |
| B Construction Materials Production | B Construction Materials Regolith Consumption | B construction materials production pair identity | ok |

<details><summary>All boundary flows by category</summary>

**primary_extraction** (4)

- A Mining
- B Mining
- A Electronics Feedstock Extraction
- B Electronics Feedstock Extraction

**power_resource_extraction** (2)

- A Power Resource Extraction
- B Power Resource Extraction

**regolith_extraction** (2)

- A Regolith Extraction
- B Regolith Extraction

**final_consumption** (4)

- A Local Consumption
- B Local Consumption
- A Electronics Local Consumption
- B Electronics Local Consumption

**power_resource_consumption** (2)

- A Power Resource Consumption
- B Power Resource Consumption

**unit_transformation** (8)

- A Ore Consumption
- A Metal Production
- B Ore Consumption
- B Metal Production
- A Electronics Feedstock Consumption
- A Electronics Production
- B Electronics Feedstock Consumption
- B Electronics Production

**information_signal** (30)

- A Electronics Capacity Planning Signal Increase
- A Electronics Capacity Planning Signal Decrease
- B Electronics Capacity Planning Signal Increase
- B Electronics Capacity Planning Signal Decrease
- A Power Capacity Planning Signal Increase
- A Power Capacity Planning Signal Decrease
- B Power Capacity Planning Signal Increase
- B Power Capacity Planning Signal Decrease
- Freight Price Increase
- Freight Price Decrease
- A Domestic Supply Signal Increase
- A Domestic Supply Signal Decrease
- A Import Supply Signal Increase
- A Import Supply Signal Decrease
- B Domestic Supply Signal Increase
- B Domestic Supply Signal Decrease
- B Import Supply Signal Increase
- B Import Supply Signal Decrease
- A Electronics Domestic Supply Signal Increase
- A Electronics Domestic Supply Signal Decrease
- A Electronics Import Supply Signal Increase
- A Electronics Import Supply Signal Decrease
- B Electronics Domestic Supply Signal Increase
- B Electronics Domestic Supply Signal Decrease
- B Electronics Import Supply Signal Increase
- B Electronics Import Supply Signal Decrease
- A Energy Demand Signal Increase
- A Energy Demand Signal Decrease
- B Energy Demand Signal Increase
- B Energy Demand Signal Decrease

**financial_accounting** (16)

- Book Metal Goods Contract Value A to B
- Recognize Delivered Metal Goods Value A to B
- Book Metal Freight Contract Value A to B
- Recognize Delivered Metal Freight Value A to B
- Book Metal Goods Contract Value B to A
- Recognize Delivered Metal Goods Value B to A
- Book Metal Freight Contract Value B to A
- Recognize Delivered Metal Freight Value B to A
- Book Electronics Goods Contract Value A to B
- Recognize Delivered Electronics Goods Value A to B
- Book Electronics Freight Contract Value A to B
- Recognize Delivered Electronics Freight Value A to B
- Book Electronics Goods Contract Value B to A
- Recognize Delivered Electronics Goods Value B to A
- Book Electronics Freight Contract Value B to A
- Recognize Delivered Electronics Freight Value B to A

**capital_state_accounting** (21)

- A Electronics Factory Activation
- A Electronics Factory Mothballing
- A Electronics Active Factory Depreciation
- B Electronics Factory Activation
- B Electronics Factory Mothballing
- B Electronics Active Factory Depreciation
- A Power Generation Activation
- A Power Generation Mothballing
- A Power Active Generation Depreciation
- B Power Generation Activation
- B Power Generation Mothballing
- B Power Active Generation Depreciation
- A Refinery Activation
- A Refinery Mothballing
- A Refinery Active Depreciation
- B Refinery Activation
- B Refinery Mothballing
- B Refinery Active Depreciation
- Transport Capacity Activation
- Transport Capacity Mothballing
- Transport Active Capacity Depreciation

**capital_transformation** (23)

- A Refinery Expansion
- A Electronics Factory Expansion
- B Electronics Factory Expansion
- A Power Generation Expansion
- B Power Generation Expansion
- B Refinery Expansion
- Transport Capacity Expansion
- A Refinery Capital Goods Consumption
- A Electronics Capital Goods Consumption
- A Power Capital Goods Consumption
- B Refinery Capital Goods Consumption
- B Electronics Capital Goods Consumption
- B Power Capital Goods Consumption
- A Transport Capital Goods Consumption
- B Transport Capital Goods Consumption
- A Refinery Construction Materials Consumption
- A Electronics Construction Materials Consumption
- A Power Construction Materials Consumption
- B Refinery Construction Materials Consumption
- B Electronics Construction Materials Consumption
- B Power Construction Materials Consumption
- A Transport Construction Materials Consumption
- B Transport Construction Materials Consumption

**capital_goods_transformation** (6)

- A Capital Goods Production
- A Capital Goods Metal Consumption
- A Capital Goods Electronics Consumption
- B Capital Goods Production
- B Capital Goods Metal Consumption
- B Capital Goods Electronics Consumption

**construction_materials_transformation** (4)

- A Construction Materials Production
- A Construction Materials Regolith Consumption
- B Construction Materials Production
- B Construction Materials Regolith Consumption

**external_capital** (0)


</details>

## Colony symmetry

- tokens: A ↔ B
- mirrored pairs checked: 860; mirrored links checked: 1914
- structural mismatches: **0**; numeric parameter differences (allowed): 102; elements under exceptions: 0

<details><summary>Numeric parameter differences between colonies (allowed)</summary>

| Field | Element | Value | Mirror | Value |
|---|---|---|---|---|
| initial_value | A Refinery Installed Capacity | 35 | B Refinery Installed Capacity | 28 |
| value | A Mining Capacity | 70 | B Mining Capacity | 28 |
| value | A Ore Base Cost | 4 | B Ore Base Cost | 14 |
| value | A Wage | 100 | B Wage | 140 |
| value | A Local Base Demand | 16 | B Local Base Demand | 22 |
| value | A Legacy Power Installed Generation Capacity | 1350 | B Legacy Power Installed Generation Capacity | 550 |
| initial_value | A Electronics Capacity Planning Signal | 1.25793 | B Electronics Capacity Planning Signal | 48.83148 |
| initial_value | A Power Capacity Planning Signal | 1316.4467 | B Power Capacity Planning Signal | 537.2232 |
| initial_value | A Power Installed Generation Capital | 1350 | B Power Installed Generation Capital | 550 |
| initial_value | A Power Active Generation Capital | 1350 | B Power Active Generation Capital | 550 |
| initial_value | A Domestic Supply Signal | 16 | B Domestic Supply Signal | 22 |
| initial_value | A Refinery Active Capacity | 35 | B Refinery Active Capacity | 28 |
| value | Reverse A Ore Base Cost | 12 | Reverse B Ore Base Cost | 5 |
| value | Reverse A Energy Price | 0.2 | Reverse B Energy Price | 0.02 |
| value | Reverse B Wage | 90 | Reverse A Wage | 100 |
| value | Reverse A Electronics Feedstock Base Cost | 3 | Reverse B Electronics Feedstock Base Cost | 18 |
| value | A Electronics Feedstock Base Cost | 18 | B Electronics Feedstock Base Cost | 3 |
| value | A Electronics Local Base Demand | 20 | B Electronics Local Base Demand | 16 |
| initial_value | A Electronics Domestic Supply Signal | 20 | B Electronics Domestic Supply Signal | 16 |
| value | Priority Stress B Ore Base Cost | 50 | Priority Stress A Ore Base Cost | 4 |
| value | Cheap Energy A Generation Cost | 0.015 | Cheap Energy B Generation Cost | 1.5 |
| value | A Power Generation Cost | 0.08 | B Power Generation Cost | 0.03 |
| initial_value | A Energy Demand Signal | 1100 | B Energy Demand Signal | 480 |
| value | A Test 20 Metal Demand Applies | 0 | B Test 20 Metal Demand Applies | 1 |
| value | A Test 16 Metal Demand Applies | 0 | B Test 16 Metal Demand Applies | 1 |
| value | A Test 9 Metal Demand Applies | 0 | B Test 9 Metal Demand Applies | 1 |
| value | A Test 8 Metal Demand Applies | 0 | B Test 8 Metal Demand Applies | 1 |
| value | A Test 7 Metal Demand Applies | 0 | B Test 7 Metal Demand Applies | 1 |
| value | A Test 2 Metal Demand Applies | 0 | B Test 2 Metal Demand Applies | 1 |
| value | A Test 3 Metal Demand Applies | 0 | B Test 3 Metal Demand Applies | 1 |
| value | A Test 19 Electronics Demand Applies | 1 | B Test 19 Electronics Demand Applies | 0 |
| value | A Test 14 Electronics Demand Applies | 1 | B Test 14 Electronics Demand Applies | 0 |
| value | A Test 13 Electronics Demand Applies | 1 | B Test 13 Electronics Demand Applies | 0 |
| value | A Test 9 Electronics Demand Applies | 1 | B Test 9 Electronics Demand Applies | 0 |
| value | A Test 8 Electronics Demand Applies | 1 | B Test 8 Electronics Demand Applies | 0 |
| value | A Test 5 Electronics Demand Applies | 1 | B Test 5 Electronics Demand Applies | 0 |
| value | A Test 7 Electronics Demand Applies | 1 | B Test 7 Electronics Demand Applies | 0 |
| value | A Test 15 Electronics Demand Applies | 0 | B Test 15 Electronics Demand Applies | 1 |
| value | A Test 18 Mining Shock Applies | 1 | B Test 18 Mining Shock Applies | 0 |
| value | A Test 11 Generation Shock Applies | 1 | B Test 11 Generation Shock Applies | 0 |
| value | A Test 6 Headroom Applies | 1 | B Test 6 Headroom Applies | 0 |
| value | A Test 4 Headroom Applies | 0 | B Test 4 Headroom Applies | 1 |
| value | A Capital Goods Base Production Capacity | 2 | B Capital Goods Base Production Capacity | 1 |
| value | A Test 22 Capital Goods Shock Applies | 1 | B Test 22 Capital Goods Shock Applies | 0 |
| value | A Test 23 Electronics Demand Applies | 1 | B Test 23 Electronics Demand Applies | 0 |
| value | A Test 25 Power Resource Shock Applies | 1 | B Test 25 Power Resource Shock Applies | 0 |
| value | A Test 26 Energy Kernel Capacity Shock Applies | 1 | B Test 26 Energy Kernel Capacity Shock Applies | 0 |
| value | A Test 28 Construction Materials Shock Applies | 1 | B Test 28 Construction Materials Shock Applies | 0 |
| value | A Test 29 Regolith Shock Applies | 1 | B Test 29 Regolith Shock Applies | 0 |
| value | A Regolith Base Extraction Capacity | 7 | B Regolith Base Extraction Capacity | 5 |
| value | A Construction Materials Base Production Capacity | 3 | B Construction Materials Base Production Capacity | 2 |

</details>

## Planet closure (per-process Planet v1 contract)

- status: **PASS**; mode: `report`
- processes: 17; legacy: 2; expected source outputs: 16; undeclared outputs: 0
- P2 capacity: kernel **7** / exceptions **10** / undeclared **0**
- P3 energy: requests **4** / producer **2** / exceptions **11** / undeclared **0**
- P4 deposits: with **0** / without **6**
- P5 labor: declared **4** / undeclared **13**
- P6 demand drivers: **4**
- reversibility violations: **0**

| Dimension | Process | Kind | Value | Reason |
|---|---|---|---|---|
| P2 | mining[A] | constant | A Mining Capacity | v7.4 fixed ore mining capacity; no mining capital yet (P2) |
| P3 | mining[A] | none | — | ore mining uses no energy yet (P3) |
| P2 | mining[B] | constant | B Mining Capacity | v7.4 fixed ore mining capacity; no mining capital yet (P2) |
| P3 | mining[B] | none | — | ore mining uses no energy yet (P3) |
| P2 | capital_goods[A] | constant | A Capital Goods Base Production Capacity | v7.5 fixed capital-goods capacity; no capital-goods-industry capital yet (P2) |
| P3 | capital_goods[A] | none | — | capital-goods assembly uses no energy yet (P3) |
| P2 | capital_goods[B] | constant | B Capital Goods Base Production Capacity | v7.5 fixed capital-goods capacity; no capital-goods-industry capital yet (P2) |
| P3 | capital_goods[B] | none | — | capital-goods assembly uses no energy yet (P3) |
| P2 | regolith[A] | constant | A Regolith Base Extraction Capacity | v7.7 fixed regolith extraction capacity (P2) |
| P3 | regolith[A] | none | — | v7.7 regolith extraction uses no energy by design (P3) |
| P2 | regolith[B] | constant | B Regolith Base Extraction Capacity | v7.7 fixed regolith extraction capacity (P2) |
| P3 | regolith[B] | none | — | v7.7 regolith extraction uses no energy by design (P3) |
| P2 | construction_materials[A] | constant | A Construction Materials Base Production Capacity | v7.7 fixed construction-materials capacity (P2) |
| P3 | construction_materials[A] | none | — | v7.7 construction-materials processing uses no energy by design; first P3 step on the roadmap |
| P2 | construction_materials[B] | constant | B Construction Materials Base Production Capacity | v7.7 fixed construction-materials capacity (P2) |
| P3 | construction_materials[B] | none | — | v7.7 construction-materials processing uses no energy by design; first P3 step on the roadmap |
| P2 | power_resource[A] | unbounded | — | v7.6 extraction follows demand x headroom; only the Mode 25 shock multiplier limits it (P2) |
| P3 | power_resource[A] | none | — | extraction energy is not modelled; treated as part of generation efficiency (P3) |
| P2 | power_resource[B] | unbounded | — | v7.6 extraction follows demand x headroom; only the Mode 25 shock multiplier limits it (P2) |
| P3 | power_resource[B] | none | — | extraction energy is not modelled; treated as part of generation efficiency (P3) |
| P3 | transport | none | — | shared transport uses no fuel or energy yet (P3) |

<details><summary>Process paths</summary>

**mining[A]**
- capacity: A Mining → A Mining Rate → A Effective Mining Capacity → A Mining Capacity

**mining[B]**
- capacity: B Mining → B Mining Rate → B Effective Mining Capacity → B Mining Capacity

**smelting[A]**
- capacity: A Metal Production → A Smelting Rate → A Pre Energy Smelting Rate → A Refinery Active Capacity
- energy_total_to_request: A Total Requested Energy → A Metal Requested Energy
- energy_output_to_fulfillment: A Metal Production → A Smelting Rate → A Metal Energy Fulfillment Ratio → A Metal Allocated Energy → A Energy Fulfillment Ratio
- energy_shared_planned: shared A Desired Smelting Rate
  - request: A Metal Requested Energy → A Pre Energy Smelting Rate → A Positive Desired Smelting Rate → A Desired Smelting Rate
  - output: A Metal Production → A Smelting Rate → A Pre Energy Smelting Rate → A Positive Desired Smelting Rate → A Desired Smelting Rate
- labor_readers: A Metal Unit Cost

**smelting[B]**
- capacity: B Metal Production → B Smelting Rate → B Pre Energy Smelting Rate → B Refinery Active Capacity
- energy_total_to_request: B Total Requested Energy → B Metal Requested Energy
- energy_output_to_fulfillment: B Metal Production → B Smelting Rate → B Metal Energy Fulfillment Ratio → B Metal Allocated Energy → B Energy Fulfillment Ratio
- energy_shared_planned: shared B Desired Smelting Rate
  - request: B Metal Requested Energy → B Pre Energy Smelting Rate → B Positive Desired Smelting Rate → B Desired Smelting Rate
  - output: B Metal Production → B Smelting Rate → B Pre Energy Smelting Rate → B Positive Desired Smelting Rate → B Desired Smelting Rate
- labor_readers: B Metal Unit Cost

**electronics[A]**
- capacity: A Electronics Production → A Electronics Production Rate → A Pre Energy Electronics Production Rate → A Electronics Factory Capacity → A Electronics Active Factory Capacity
- energy_total_to_request: A Total Requested Energy → A Electronics Requested Energy
- energy_output_to_fulfillment: A Electronics Production → A Electronics Production Rate → A Electronics Energy Fulfillment Ratio → A Electronics Allocated Energy → A Energy Fulfillment Ratio
- energy_shared_planned: shared A Electronics Feedstock Buffer
  - request: A Electronics Requested Energy → A Pre Energy Electronics Production Rate → A Electronics Feedstock Buffer
  - output: A Electronics Production → A Electronics Production Rate → A Pre Energy Electronics Production Rate → A Electronics Feedstock Buffer
- labor_readers: A Electronics Unit Cost → A Electronics Unit Cost

**electronics[B]**
- capacity: B Electronics Production → B Electronics Production Rate → B Pre Energy Electronics Production Rate → B Electronics Factory Capacity → B Electronics Active Factory Capacity
- energy_total_to_request: B Total Requested Energy → B Electronics Requested Energy
- energy_output_to_fulfillment: B Electronics Production → B Electronics Production Rate → B Electronics Energy Fulfillment Ratio → B Electronics Allocated Energy → B Energy Fulfillment Ratio
- energy_shared_planned: shared B Electronics Feedstock Buffer
  - request: B Electronics Requested Energy → B Pre Energy Electronics Production Rate → B Electronics Feedstock Buffer
  - output: B Electronics Production → B Electronics Production Rate → B Pre Energy Electronics Production Rate → B Electronics Feedstock Buffer
- labor_readers: B Electronics Unit Cost → B Electronics Unit Cost

**capital_goods[A]**
- capacity: A Capital Goods Production → A Capital Goods Production Rate → A Capital Goods Production Capacity → A Capital Goods Base Production Capacity

**capital_goods[B]**
- capacity: B Capital Goods Production → B Capital Goods Production Rate → B Capital Goods Production Capacity → B Capital Goods Base Production Capacity

**regolith[A]**
- capacity: A Regolith Extraction → A Regolith Extraction Rate → A Regolith Extraction Capacity → A Regolith Base Extraction Capacity

**regolith[B]**
- capacity: B Regolith Extraction → B Regolith Extraction Rate → B Regolith Extraction Capacity → B Regolith Base Extraction Capacity

**construction_materials[A]**
- capacity: A Construction Materials Production → A Construction Materials Production Rate → A Construction Materials Production Capacity → A Construction Materials Base Production Capacity

**construction_materials[B]**
- capacity: B Construction Materials Production → B Construction Materials Production Rate → B Construction Materials Production Capacity → B Construction Materials Base Production Capacity

**generation[A]**
- capacity: A Available Generation → A Power Active Generation Capacity → A Power Active Generation Capital

**generation[B]**
- capacity: B Available Generation → B Power Active Generation Capacity → B Power Active Generation Capital

**transport**
- capacity: Capacity Limited Total Transport Load → Transport Active Throughput Capacity

</details>

## Algebraic loops (switch-aware, unconditional static audit)

- status: **PASS**
- switches: 7 — Capital Lifecycle Enabled, Intermediate Inputs Enabled, Capital Goods Enabled, Transport Capital Goods Enabled, Power Resource Enabled, Construction Materials Enabled, Transport Construction Materials Enabled
- combinations: 128; with loops: **0**
- Modes with loops: none
