# Orbital Economy Lab — structure audit

- generated: 2026-10-04T07:17:06.519Z
- model: Orbital Economy v7.7.10 r1 — Labor
- model SHA-256: `3cb40c883703936af3550a82a731d4af17f3818afe80b69c0c8f92e0878ab903`
- validation: Orbital Economy v7.7.10 validation r1
- validation SHA-256: `1cd6480d478f7e4a2c9b3fb5cfe4a55b2d2be2312b7be85c984c246be6095cec`
- status: **PASS**

## Open boundaries (declared physical-boundary meter)

- flows total: 279; crossing the model boundary: 224; classified: 224; unclassified: 0
- closed-world violations: **0** (mode: `classify`) — zero means the currently declared closed-world boundary contract is satisfied; it is not a Planet v1 completeness claim
- declared transformation pairs: 25; transformation flows without a pair: 0

| Category | closed-world | Flows | Reason |
|---|:---:|---:|---|
| primary_extraction | yes | 2 | primary resources enter from the planet itself |
| power_resource_extraction | yes | 0 | v7.6 primary planetary energy resource enters regional physical inventory through explicit extraction. |
| regolith_extraction | yes | 0 | v7.7 primary bulk resource (regolith) enters regional physical inventory through explicit extraction. |
| final_consumption | yes | 4 | final goods leave the economy as consumption |
| power_resource_consumption | yes | 2 | v7.6 physical operating resource is consumed in exact proportion to actual delivered generation. |
| unit_transformation | yes | 8 | input stock -> output stock conversion modelled as a sink/source pair (different units); every flow here must belong to a declared transformation pair whose numeric identity is checked at runtime |
| information_signal | yes | 78 | smoothing / information stocks, not matter |
| financial_accounting | yes | 16 | money bookkeeping, not matter |
| capital_state_accounting | yes | 33 | Active is an operational-state sub-account of Installed; these flows change state, not physical capital |
| capital_transformation | yes | 53 | v7.5/v7.5.1: installed capital expansion is a unit transformation of Capital Goods; regional sectors use one local sink, shared Transport uses two A/B regional sinks whose total identity is checked at runtime. v7.7: colonial sector expansion is additionally backed by a local Construction Materials sink. v7.7.1: shared Transport expansion is additionally backed by construction materials from both A and B inventories (two legs). v7.7.3: construction-materials plant expansion is backed by local capital goods and construction materials. v7.7.4: capital-goods plant expansion is backed by local capital goods and construction materials. |
| capital_goods_transformation | yes | 6 | metal + electronics -> capital goods (declared pair; identity checked at runtime) |
| construction_materials_transformation | yes | 4 | v7.7: regolith -> construction materials (declared pair; identity checked at runtime) |
| external_capital | **no** | 0 | capital created without physical goods; expected count is zero from v7.5.1 onward for the currently declared expansion-boundary audit |
| capital_retirement | yes | 12 | износ и вывод простого капитала: капитал покидает экономику |
| exploration_expenditure | yes | 6 | capital goods spent on resource exploration leave the economy |


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
| A Construction Materials Plant Expansion | A Construction Materials Plant Capital Goods Consumption, A Construction Materials Plant Construction Materials Consumption | A Construction Materials Plant capital goods pair identity | ok |
| B Construction Materials Plant Expansion | B Construction Materials Plant Capital Goods Consumption, B Construction Materials Plant Construction Materials Consumption | B Construction Materials Plant capital goods pair identity | ok |
| A Capital Goods Plant Expansion | A Capital Goods Plant Capital Goods Consumption, A Capital Goods Plant Construction Materials Consumption | A Capital Goods Plant capital goods pair identity | ok |
| B Capital Goods Plant Expansion | B Capital Goods Plant Capital Goods Consumption, B Capital Goods Plant Construction Materials Consumption | B Capital Goods Plant capital goods pair identity | ok |
| A Regolith Mine Expansion | A Regolith Mine Capital Goods Consumption, A Regolith Mine Construction Materials Consumption | A Regolith Mine capital goods pair identity | ok |
| B Regolith Mine Expansion | B Regolith Mine Capital Goods Consumption, B Regolith Mine Construction Materials Consumption | B Regolith Mine capital goods pair identity | ok |
| A Ore Mine Expansion | A Ore Mine Capital Goods Consumption, A Ore Mine Construction Materials Consumption | A Ore Mine capital goods pair identity | ok |
| B Ore Mine Expansion | B Ore Mine Capital Goods Consumption, B Ore Mine Construction Materials Consumption | B Ore Mine capital goods pair identity | ok |
| A Power Resource Mine Expansion | A Power Resource Mine Capital Goods Consumption, A Power Resource Mine Construction Materials Consumption | A Power Resource Mine capital goods pair identity | ok |
| B Power Resource Mine Expansion | B Power Resource Mine Capital Goods Consumption, B Power Resource Mine Construction Materials Consumption | B Power Resource Mine capital goods pair identity | ok |

<details><summary>All boundary flows by category</summary>

**primary_extraction** (2)

- A Electronics Feedstock Extraction
- B Electronics Feedstock Extraction

**power_resource_extraction** (0)


**regolith_extraction** (0)


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

**information_signal** (78)

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
- A Construction Materials Demand Signal Increase
- A Construction Materials Demand Signal Decrease
- B Construction Materials Demand Signal Increase
- B Construction Materials Demand Signal Decrease
- A Capital Goods Demand Signal Increase
- A Capital Goods Demand Signal Decrease
- B Capital Goods Demand Signal Increase
- B Capital Goods Demand Signal Decrease
- A Regolith Demand Signal Increase
- A Regolith Demand Signal Decrease
- B Regolith Demand Signal Increase
- B Regolith Demand Signal Decrease
- A Ore Demand Signal Increase
- A Ore Demand Signal Decrease
- B Ore Demand Signal Increase
- B Ore Demand Signal Decrease
- A Power Resource Demand Signal Increase
- A Power Resource Demand Signal Decrease
- B Power Resource Demand Signal Increase
- B Power Resource Demand Signal Decrease
- A Ore Extraction Signal Increase
- A Ore Extraction Signal Decrease
- B Ore Extraction Signal Increase
- B Ore Extraction Signal Decrease
- A Regolith Extraction Signal Increase
- A Regolith Extraction Signal Decrease
- B Regolith Extraction Signal Increase
- B Regolith Extraction Signal Decrease
- A Power Resource Extraction Signal Increase
- A Power Resource Extraction Signal Decrease
- B Power Resource Extraction Signal Increase
- B Power Resource Extraction Signal Decrease
- A Mining Energy Signal Increase
- A Mining Energy Signal Decrease
- A Regolith Extraction Energy Signal Increase
- A Regolith Extraction Energy Signal Decrease
- A Power Resource Extraction Energy Signal Increase
- A Power Resource Extraction Energy Signal Decrease
- A Capital Goods Energy Signal Increase
- A Capital Goods Energy Signal Decrease
- B Mining Energy Signal Increase
- B Mining Energy Signal Decrease
- B Regolith Extraction Energy Signal Increase
- B Regolith Extraction Energy Signal Decrease
- B Power Resource Extraction Energy Signal Increase
- B Power Resource Extraction Energy Signal Decrease
- B Capital Goods Energy Signal Increase
- B Capital Goods Energy Signal Decrease

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

**capital_state_accounting** (33)

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
- A Construction Materials Plant Activation
- A Construction Materials Plant Mothballing
- A Construction Materials Plant Active Depreciation
- B Construction Materials Plant Activation
- B Construction Materials Plant Mothballing
- B Construction Materials Plant Active Depreciation
- A Capital Goods Plant Activation
- A Capital Goods Plant Mothballing
- A Capital Goods Plant Active Depreciation
- B Capital Goods Plant Activation
- B Capital Goods Plant Mothballing
- B Capital Goods Plant Active Depreciation

**capital_transformation** (53)

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
- A Construction Materials Plant Expansion
- A Construction Materials Plant Capital Goods Consumption
- A Construction Materials Plant Construction Materials Consumption
- B Construction Materials Plant Expansion
- B Construction Materials Plant Capital Goods Consumption
- B Construction Materials Plant Construction Materials Consumption
- A Capital Goods Plant Expansion
- A Capital Goods Plant Capital Goods Consumption
- A Capital Goods Plant Construction Materials Consumption
- B Capital Goods Plant Expansion
- B Capital Goods Plant Capital Goods Consumption
- B Capital Goods Plant Construction Materials Consumption
- A Regolith Mine Expansion
- A Regolith Mine Capital Goods Consumption
- A Regolith Mine Construction Materials Consumption
- B Regolith Mine Expansion
- B Regolith Mine Capital Goods Consumption
- B Regolith Mine Construction Materials Consumption
- A Ore Mine Expansion
- A Ore Mine Capital Goods Consumption
- A Ore Mine Construction Materials Consumption
- B Ore Mine Expansion
- B Ore Mine Capital Goods Consumption
- B Ore Mine Construction Materials Consumption
- A Power Resource Mine Expansion
- A Power Resource Mine Capital Goods Consumption
- A Power Resource Mine Construction Materials Consumption
- B Power Resource Mine Expansion
- B Power Resource Mine Capital Goods Consumption
- B Power Resource Mine Construction Materials Consumption

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


**capital_retirement** (12)

- A Regolith Mine Capacity Depreciation
- A Regolith Mine Capacity Retirement
- B Regolith Mine Capacity Depreciation
- B Regolith Mine Capacity Retirement
- A Ore Mine Capacity Depreciation
- A Ore Mine Capacity Retirement
- B Ore Mine Capacity Depreciation
- B Ore Mine Capacity Retirement
- A Power Resource Mine Capacity Depreciation
- A Power Resource Mine Capacity Retirement
- B Power Resource Mine Capacity Depreciation
- B Power Resource Mine Capacity Retirement

**exploration_expenditure** (6)

- A Ore Exploration Capital Goods Consumption
- B Ore Exploration Capital Goods Consumption
- A Regolith Exploration Capital Goods Consumption
- B Regolith Exploration Capital Goods Consumption
- A Power Resource Exploration Capital Goods Consumption
- B Power Resource Exploration Capital Goods Consumption

</details>

## Colony symmetry

- tokens: A ↔ B
- mirrored pairs checked: 1284; mirrored links checked: 3046
- structural mismatches: **0**; numeric parameter differences (allowed): 138; elements under exceptions: 0

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
| initial_value | A Construction Materials Plant Installed Capacity | 3 | B Construction Materials Plant Installed Capacity | 2 |
| initial_value | A Construction Materials Plant Active Capacity | 3 | B Construction Materials Plant Active Capacity | 2 |
| initial_value | A Capital Goods Plant Installed Capacity | 2 | B Capital Goods Plant Installed Capacity | 1 |
| initial_value | A Capital Goods Plant Active Capacity | 2 | B Capital Goods Plant Active Capacity | 1 |
| initial_value | A Regolith Mine Capacity | 7 | B Regolith Mine Capacity | 5 |
| initial_value | A Ore Mine Capacity | 70 | B Ore Mine Capacity | 28 |
| initial_value | A Power Resource Demand Signal | 1350 | B Power Resource Demand Signal | 182.656 |
| initial_value | A Power Resource Mine Capacity | 1750 | B Power Resource Mine Capacity | 650 |
| value | A Ore Undiscovered Resource Initial | 20000000 | B Ore Undiscovered Resource Initial | 3600000 |
| value | A Ore Proven Reserves Initial | 200000 | B Ore Proven Reserves Initial | 36000 |
| initial_value | A Ore Extraction Signal | 42.227 | B Ore Extraction Signal | 8.373 |
| value | A Regolith Undiscovered Resource Initial | 540000 | B Regolith Undiscovered Resource Initial | 360000 |
| value | A Regolith Proven Reserves Initial | 5400 | B Regolith Proven Reserves Initial | 3600 |
| value | A Power Resource Undiscovered Resource Initial | 500000000 | B Power Resource Undiscovered Resource Initial | 150000000 |
| value | A Power Resource Proven Reserves Initial | 5000000 | B Power Resource Proven Reserves Initial | 1500000 |
| initial_value | A Power Resource Extraction Signal | 1373.679 | B Power Resource Extraction Signal | 30.983 |
| initial_value | A Mining Energy Signal | 42.227 | B Mining Energy Signal | 8.373 |
| initial_value | A Power Resource Extraction Energy Signal | 1373.679 | B Power Resource Extraction Energy Signal | 30.983 |

</details>

## Planet closure (per-process Planet v1 contract)

- status: **PASS**; mode: `planet_v1`
- processes: 17; legacy: 2; expected source outputs: 10; undeclared outputs: 0
- P2 capacity: kernel **11** / simple **6** / exceptions **0** / undeclared **0**
- P3 energy: requests **14** / producer **2** / exceptions **1** / undeclared **0**
- P4 deposits: with **6** / without **0**
- P5 labor: declared **17** / undeclared **0**
- P6 demand drivers: **4**
- reversibility violations: **0**

| Dimension | Process | Kind | Value | Reason |
|---|---|---|---|---|
| P3 | transport | none | — | shared transport uses no fuel or energy yet (P3) |

<details><summary>Process paths</summary>

**mining[A]**
- capacity: A Mining → A Mining Rate → A Effective Mining Capacity → A Ore Mine Capacity
- energy_total_to_request: A Total Requested Energy → A Mining Requested Energy
- energy_output_to_fulfillment: A Mining → A Mining Rate → A Mining Energy Fulfillment Ratio → A Mining Allocated Energy → A Energy Fulfillment Ratio
- energy_shared_planned: shared A Positive Desired Mining Rate
  - request: A Mining Requested Energy → A Mining Energy Signal → A Mining Energy Signal Increase → A Mining Pre Energy Rate → A Positive Desired Mining Rate
  - output: A Mining → A Mining Rate → A Positive Desired Mining Rate
- labor_requirement: A Mining → A Mining Labor per Unit → A Mining Labor Requirement

**mining[B]**
- capacity: B Mining → B Mining Rate → B Effective Mining Capacity → B Ore Mine Capacity
- energy_total_to_request: B Total Requested Energy → B Mining Requested Energy
- energy_output_to_fulfillment: B Mining → B Mining Rate → B Mining Energy Fulfillment Ratio → B Mining Allocated Energy → B Energy Fulfillment Ratio
- energy_shared_planned: shared B Positive Desired Mining Rate
  - request: B Mining Requested Energy → B Mining Energy Signal → B Mining Energy Signal Increase → B Mining Pre Energy Rate → B Positive Desired Mining Rate
  - output: B Mining → B Mining Rate → B Positive Desired Mining Rate
- labor_requirement: B Mining → B Mining Labor per Unit → B Mining Labor Requirement

**smelting[A]**
- capacity: A Metal Production → A Smelting Rate → A Pre Energy Smelting Rate → A Refinery Active Capacity
- energy_total_to_request: A Total Requested Energy → A Metal Requested Energy
- energy_output_to_fulfillment: A Metal Production → A Smelting Rate → A Metal Energy Fulfillment Ratio → A Metal Allocated Energy → A Energy Fulfillment Ratio
- energy_shared_planned: shared A Desired Smelting Rate
  - request: A Metal Requested Energy → A Pre Energy Smelting Rate → A Positive Desired Smelting Rate → A Desired Smelting Rate
  - output: A Metal Production → A Smelting Rate → A Pre Energy Smelting Rate → A Positive Desired Smelting Rate → A Desired Smelting Rate
- labor_requirement: A Metal Production → A Labor per Metal → A Smelting Labor Requirement

**smelting[B]**
- capacity: B Metal Production → B Smelting Rate → B Pre Energy Smelting Rate → B Refinery Active Capacity
- energy_total_to_request: B Total Requested Energy → B Metal Requested Energy
- energy_output_to_fulfillment: B Metal Production → B Smelting Rate → B Metal Energy Fulfillment Ratio → B Metal Allocated Energy → B Energy Fulfillment Ratio
- energy_shared_planned: shared B Desired Smelting Rate
  - request: B Metal Requested Energy → B Pre Energy Smelting Rate → B Positive Desired Smelting Rate → B Desired Smelting Rate
  - output: B Metal Production → B Smelting Rate → B Pre Energy Smelting Rate → B Positive Desired Smelting Rate → B Desired Smelting Rate
- labor_requirement: B Metal Production → B Labor per Metal → B Smelting Labor Requirement

**electronics[A]**
- capacity: A Electronics Production → A Electronics Production Rate → A Pre Energy Electronics Production Rate → A Electronics Factory Capacity → A Electronics Active Factory Capacity
- energy_total_to_request: A Total Requested Energy → A Electronics Requested Energy
- energy_output_to_fulfillment: A Electronics Production → A Electronics Production Rate → A Electronics Energy Fulfillment Ratio → A Electronics Allocated Energy → A Energy Fulfillment Ratio
- energy_shared_planned: shared A Electronics Feedstock Buffer
  - request: A Electronics Requested Energy → A Pre Energy Electronics Production Rate → A Electronics Feedstock Buffer
  - output: A Electronics Production → A Electronics Production Rate → A Pre Energy Electronics Production Rate → A Electronics Feedstock Buffer
- labor_requirement: A Electronics Production → A Electronics Labor per Unit → A Electronics Labor Requirement

**electronics[B]**
- capacity: B Electronics Production → B Electronics Production Rate → B Pre Energy Electronics Production Rate → B Electronics Factory Capacity → B Electronics Active Factory Capacity
- energy_total_to_request: B Total Requested Energy → B Electronics Requested Energy
- energy_output_to_fulfillment: B Electronics Production → B Electronics Production Rate → B Electronics Energy Fulfillment Ratio → B Electronics Allocated Energy → B Energy Fulfillment Ratio
- energy_shared_planned: shared B Electronics Feedstock Buffer
  - request: B Electronics Requested Energy → B Pre Energy Electronics Production Rate → B Electronics Feedstock Buffer
  - output: B Electronics Production → B Electronics Production Rate → B Pre Energy Electronics Production Rate → B Electronics Feedstock Buffer
- labor_requirement: B Electronics Production → B Electronics Labor per Unit → B Electronics Labor Requirement

**capital_goods[A]**
- capacity: A Capital Goods Production → A Capital Goods Production Rate → A Capital Goods Production Capacity → A Capital Goods Plant Active Capacity
- energy_total_to_request: A Total Requested Energy → A Capital Goods Requested Energy
- energy_output_to_fulfillment: A Capital Goods Production → A Capital Goods Production Rate → A Capital Goods Energy Fulfillment Ratio → A Capital Goods Allocated Energy → A Energy Fulfillment Ratio
- energy_shared_planned: shared A Capital Goods Production Capacity
  - request: A Capital Goods Requested Energy → A Capital Goods Energy Signal → A Capital Goods Energy Signal Increase → A Capital Goods Pre Energy Rate → A Capital Goods Production Capacity
  - output: A Capital Goods Production → A Capital Goods Production Rate → A Capital Goods Production Capacity
- labor_requirement: A Capital Goods Production → A Capital Goods Labor per Unit → A Capital Goods Labor Requirement

**capital_goods[B]**
- capacity: B Capital Goods Production → B Capital Goods Production Rate → B Capital Goods Production Capacity → B Capital Goods Plant Active Capacity
- energy_total_to_request: B Total Requested Energy → B Capital Goods Requested Energy
- energy_output_to_fulfillment: B Capital Goods Production → B Capital Goods Production Rate → B Capital Goods Energy Fulfillment Ratio → B Capital Goods Allocated Energy → B Energy Fulfillment Ratio
- energy_shared_planned: shared B Capital Goods Production Capacity
  - request: B Capital Goods Requested Energy → B Capital Goods Energy Signal → B Capital Goods Energy Signal Increase → B Capital Goods Pre Energy Rate → B Capital Goods Production Capacity
  - output: B Capital Goods Production → B Capital Goods Production Rate → B Capital Goods Production Capacity
- labor_requirement: B Capital Goods Production → B Capital Goods Labor per Unit → B Capital Goods Labor Requirement

**regolith[A]**
- capacity: A Regolith Extraction → A Regolith Extraction Rate → A Regolith Extraction Capacity → A Regolith Mine Capacity
- energy_total_to_request: A Total Requested Energy → A Regolith Extraction Requested Energy
- energy_output_to_fulfillment: A Regolith Extraction → A Regolith Extraction Rate → A Regolith Extraction Energy Fulfillment Ratio → A Regolith Extraction Allocated Energy → A Energy Fulfillment Ratio
- energy_shared_planned: shared A Regolith Extraction Capacity
  - request: A Regolith Extraction Requested Energy → A Regolith Extraction Energy Signal → A Regolith Extraction Energy Signal Increase → A Regolith Extraction Pre Energy Rate → A Regolith Extraction Capacity
  - output: A Regolith Extraction → A Regolith Extraction Rate → A Regolith Extraction Capacity
- labor_requirement: A Regolith Extraction → A Regolith Extraction Labor per Unit → A Regolith Extraction Labor Requirement

**regolith[B]**
- capacity: B Regolith Extraction → B Regolith Extraction Rate → B Regolith Extraction Capacity → B Regolith Mine Capacity
- energy_total_to_request: B Total Requested Energy → B Regolith Extraction Requested Energy
- energy_output_to_fulfillment: B Regolith Extraction → B Regolith Extraction Rate → B Regolith Extraction Energy Fulfillment Ratio → B Regolith Extraction Allocated Energy → B Energy Fulfillment Ratio
- energy_shared_planned: shared B Regolith Extraction Capacity
  - request: B Regolith Extraction Requested Energy → B Regolith Extraction Energy Signal → B Regolith Extraction Energy Signal Increase → B Regolith Extraction Pre Energy Rate → B Regolith Extraction Capacity
  - output: B Regolith Extraction → B Regolith Extraction Rate → B Regolith Extraction Capacity
- labor_requirement: B Regolith Extraction → B Regolith Extraction Labor per Unit → B Regolith Extraction Labor Requirement

**construction_materials[A]**
- capacity: A Construction Materials Production → A Construction Materials Production Rate → A Construction Materials Production Capacity → A Construction Materials Plant Active Capacity
- energy_total_to_request: A Total Requested Energy → A Construction Materials Requested Energy
- energy_output_to_fulfillment: A Construction Materials Production → A Construction Materials Production Rate → A Construction Materials Energy Fulfillment Ratio → A Construction Materials Allocated Energy → A Energy Fulfillment Ratio
- energy_shared_planned: shared Temporary Test Window
  - request: A Construction Materials Requested Energy → A Pre Energy Construction Materials Production Rate → A Construction Materials Production Capacity → Test 28 Construction Materials Shock Active → Temporary Test Window
  - output: A Construction Materials Production → A Construction Materials Production Rate → A Construction Materials Production Capacity → Test 28 Construction Materials Shock Active → Temporary Test Window
- labor_requirement: A Construction Materials Production → A Construction Materials Labor per Unit → A Construction Materials Labor Requirement

**construction_materials[B]**
- capacity: B Construction Materials Production → B Construction Materials Production Rate → B Construction Materials Production Capacity → B Construction Materials Plant Active Capacity
- energy_total_to_request: B Total Requested Energy → B Construction Materials Requested Energy
- energy_output_to_fulfillment: B Construction Materials Production → B Construction Materials Production Rate → B Construction Materials Energy Fulfillment Ratio → B Construction Materials Allocated Energy → B Energy Fulfillment Ratio
- energy_shared_planned: shared Temporary Test Window
  - request: B Construction Materials Requested Energy → B Pre Energy Construction Materials Production Rate → B Construction Materials Production Capacity → Test 28 Construction Materials Shock Active → Temporary Test Window
  - output: B Construction Materials Production → B Construction Materials Production Rate → B Construction Materials Production Capacity → Test 28 Construction Materials Shock Active → Temporary Test Window
- labor_requirement: B Construction Materials Production → B Construction Materials Labor per Unit → B Construction Materials Labor Requirement

**power_resource[A]**
- capacity: A Power Resource Extraction → A Power Resource Extraction Rate → A Power Resource Mine Capacity
- energy_total_to_request: A Total Requested Energy → A Power Resource Extraction Requested Energy
- energy_output_to_fulfillment: A Power Resource Extraction → A Power Resource Extraction Rate → A Power Resource Extraction Energy Fulfillment Ratio → A Power Resource Extraction Allocated Energy → A Priority Energy Fulfillment Ratio
- energy_shared_planned: shared A Power Resource Demand
  - request: A Power Resource Extraction Requested Energy → A Power Resource Extraction Energy Signal → A Power Resource Extraction Energy Signal Increase → A Power Resource Extraction Pre Energy Rate → A Power Resource Demand
  - output: A Power Resource Extraction → A Power Resource Extraction Rate → A Power Resource Demand
- labor_requirement: A Power Resource Extraction → A Power Resource Extraction Labor per Unit → A Power Resource Extraction Labor Requirement

**power_resource[B]**
- capacity: B Power Resource Extraction → B Power Resource Extraction Rate → B Power Resource Mine Capacity
- energy_total_to_request: B Total Requested Energy → B Power Resource Extraction Requested Energy
- energy_output_to_fulfillment: B Power Resource Extraction → B Power Resource Extraction Rate → B Power Resource Extraction Energy Fulfillment Ratio → B Power Resource Extraction Allocated Energy → B Priority Energy Fulfillment Ratio
- energy_shared_planned: shared B Power Resource Demand
  - request: B Power Resource Extraction Requested Energy → B Power Resource Extraction Energy Signal → B Power Resource Extraction Energy Signal Increase → B Power Resource Extraction Pre Energy Rate → B Power Resource Demand
  - output: B Power Resource Extraction → B Power Resource Extraction Rate → B Power Resource Demand
- labor_requirement: B Power Resource Extraction → B Power Resource Extraction Labor per Unit → B Power Resource Extraction Labor Requirement

**generation[A]**
- capacity: A Available Generation → A Power Active Generation Capacity → A Power Active Generation Capital
- labor_requirement: A Available Generation → A Generation Labor per Unit → A Generation Labor Requirement

**generation[B]**
- capacity: B Available Generation → B Power Active Generation Capacity → B Power Active Generation Capital
- labor_requirement: B Available Generation → B Generation Labor per Unit → B Generation Labor Requirement

**transport**
- capacity: Capacity Limited Total Transport Load → Transport Active Throughput Capacity
- labor_requirement: Capacity Limited Total Transport Load → Transport Labor per Unit → Transport Labor Requirement

</details>

## Algebraic loops (switch-aware, unconditional static audit)

- status: **PASS**
- switches: 15 — Capital Lifecycle Enabled, Intermediate Inputs Enabled, Capital Goods Enabled, Transport Capital Goods Enabled, Power Resource Enabled, Construction Materials Enabled, Transport Construction Materials Enabled, Construction Materials Energy Enabled, Construction Materials Capital Enabled, Capital Goods Capital Enabled, Regolith Capital Enabled, Ore Capital Enabled, Power Resource Capital Enabled, Deposits Enabled, Process Energy Enabled
- combinations: 32768; with loops: **0**
- Modes with loops: none
