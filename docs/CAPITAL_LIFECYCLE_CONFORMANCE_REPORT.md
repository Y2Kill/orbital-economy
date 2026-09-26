# Orbital Economy Lab — Capital Lifecycle Kernel conformance

- generated: 2026-09-26T10:39:34.803Z
- model: Orbital Economy v7.7.1 r1 — Transport on Construction Materials
- model SHA-256: `d53d014d727a439694e103aafb49f87d4dbbb362e581414cbf4dc71a19646f93`
- validation: Orbital Economy v7.7.1 validation r1
- validation SHA-256: `23928c3abab5b4609cf963a5646e89fe551cadc046d5b49d3b69adbe6a02b70f`
- kernel format: orbital-economy-capital-lifecycle-kernel-v1
- status: **PASS**

## Summary

- instances: 7
- CONFORMING: 0
- CONFORMING_WITH_VARIATION: 7
- NON_CONFORMING: 0
- kernel roles per instance: 26 required + 4 optional; flows: 9; stocks: 4
- legacy lifecycle switch: `Capital Lifecycle Enabled`

## Model-wide reference integrity

- **PASS** duplicate primitive names
- **PASS** unresolved formula references
- **PASS** formula dependencies without LINK

## Instances

| Instance | Sector | Classification | Checks passed | Failures |
|---|---|---|---:|---:|
| A Electronics | Electronics | **CONFORMING_WITH_VARIATION** | 70/70 | 0 |
| B Electronics | Electronics | **CONFORMING_WITH_VARIATION** | 70/70 | 0 |
| A Power | Power | **CONFORMING_WITH_VARIATION** | 69/69 | 0 |
| B Power | Power | **CONFORMING_WITH_VARIATION** | 69/69 | 0 |
| A Refinery | Refinery | **CONFORMING_WITH_VARIATION** | 70/70 | 0 |
| B Refinery | Refinery | **CONFORMING_WITH_VARIATION** | 70/70 | 0 |
| Transport | Transport | **CONFORMING_WITH_VARIATION** | 73/73 | 0 |

### A Electronics — CONFORMING_WITH_VARIATION

Sector-specific variation (informative, not a failure):
- optional role "capital_goods_consumption_secondary" not present
- all kernel flows are gated by [Capital Lifecycle Enabled] (v7.3 regression switch)
- kernel-v2: expansion physically backed by capital goods

| Kernel role | Kind | Primitive |
|---|---|---|
| installed | STOCK | A Electronics Installed Factory Capacity |
| active | STOCK | A Electronics Active Factory Capacity |
| decommissioning | STOCK | A Electronics Decommissioning Factory Capacity |
| retired | STOCK | A Electronics Retired Factory Capacity |
| required_active | VARIABLE | A Electronics Required Active Factory Capacity |
| desired_installed | VARIABLE | A Electronics Desired Installed Factory Capacity |
| strategic_reserve_target | VARIABLE | A Electronics Strategic Reserve Target |
| inactive | VARIABLE | A Electronics Inactive Factory Capacity |
| target_active | VARIABLE | A Electronics Target Active Factory Capacity |
| activation_gap | VARIABLE | A Electronics Factory Activation Gap |
| mothball_gap | VARIABLE | A Electronics Factory Mothball Gap |
| installed_shortage | VARIABLE | A Electronics Installed Factory Shortage |
| installed_excess | VARIABLE | A Electronics Installed Factory Excess |
| gap_limited_construction | VARIABLE | A Electronics Gap Limited Construction |
| activation_queue | VARIABLE | A Electronics Activation Queue Capacity |
| inactive_after_activation_queue | VARIABLE | A Electronics Inactive After Activation Queue |
| strategic_reserve | VARIABLE | A Electronics Strategic Reserve Capacity |
| surplus | VARIABLE | A Electronics Surplus Factory Capacity |
| lifetime | VARIABLE | A Electronics Lifetime Capacity Account |
| activation | FLOW | A Electronics Factory Activation |
| mothballing | FLOW | A Electronics Factory Mothballing |
| active_depreciation | FLOW | A Electronics Active Factory Depreciation |
| expansion | FLOW | A Electronics Factory Expansion |
| decommissioning_initiation | FLOW | A Electronics Decommissioning Initiation |
| installed_depreciation | FLOW | A Electronics Factory Depreciation |
| dismantling_completion | FLOW | A Electronics Dismantling Completion |
| finance_limited_construction | VARIABLE | A Electronics Finance Limited Construction |
| desired_expansion | VARIABLE | A Electronics Desired Expansion |
| capital_goods_consumption | FLOW | A Electronics Capital Goods Consumption |

### B Electronics — CONFORMING_WITH_VARIATION

Sector-specific variation (informative, not a failure):
- optional role "capital_goods_consumption_secondary" not present
- all kernel flows are gated by [Capital Lifecycle Enabled] (v7.3 regression switch)
- kernel-v2: expansion physically backed by capital goods

| Kernel role | Kind | Primitive |
|---|---|---|
| installed | STOCK | B Electronics Installed Factory Capacity |
| active | STOCK | B Electronics Active Factory Capacity |
| decommissioning | STOCK | B Electronics Decommissioning Factory Capacity |
| retired | STOCK | B Electronics Retired Factory Capacity |
| required_active | VARIABLE | B Electronics Required Active Factory Capacity |
| desired_installed | VARIABLE | B Electronics Desired Installed Factory Capacity |
| strategic_reserve_target | VARIABLE | B Electronics Strategic Reserve Target |
| inactive | VARIABLE | B Electronics Inactive Factory Capacity |
| target_active | VARIABLE | B Electronics Target Active Factory Capacity |
| activation_gap | VARIABLE | B Electronics Factory Activation Gap |
| mothball_gap | VARIABLE | B Electronics Factory Mothball Gap |
| installed_shortage | VARIABLE | B Electronics Installed Factory Shortage |
| installed_excess | VARIABLE | B Electronics Installed Factory Excess |
| gap_limited_construction | VARIABLE | B Electronics Gap Limited Construction |
| activation_queue | VARIABLE | B Electronics Activation Queue Capacity |
| inactive_after_activation_queue | VARIABLE | B Electronics Inactive After Activation Queue |
| strategic_reserve | VARIABLE | B Electronics Strategic Reserve Capacity |
| surplus | VARIABLE | B Electronics Surplus Factory Capacity |
| lifetime | VARIABLE | B Electronics Lifetime Capacity Account |
| activation | FLOW | B Electronics Factory Activation |
| mothballing | FLOW | B Electronics Factory Mothballing |
| active_depreciation | FLOW | B Electronics Active Factory Depreciation |
| expansion | FLOW | B Electronics Factory Expansion |
| decommissioning_initiation | FLOW | B Electronics Decommissioning Initiation |
| installed_depreciation | FLOW | B Electronics Factory Depreciation |
| dismantling_completion | FLOW | B Electronics Dismantling Completion |
| finance_limited_construction | VARIABLE | B Electronics Finance Limited Construction |
| desired_expansion | VARIABLE | B Electronics Desired Expansion |
| capital_goods_consumption | FLOW | B Electronics Capital Goods Consumption |

### A Power — CONFORMING_WITH_VARIATION

Sector-specific variation (informative, not a failure):
- optional role "finance_limited_construction" not present
- optional role "capital_goods_consumption_secondary" not present
- all kernel flows are gated by [Capital Lifecycle Enabled] (v7.3 regression switch)
- kernel-v2: expansion physically backed by capital goods

| Kernel role | Kind | Primitive |
|---|---|---|
| installed | STOCK | A Power Installed Generation Capital |
| active | STOCK | A Power Active Generation Capital |
| decommissioning | STOCK | A Power Decommissioning Generation Capital |
| retired | STOCK | A Power Retired Generation Capital |
| required_active | VARIABLE | A Power Required Active Generation Capital |
| desired_installed | VARIABLE | A Power Desired Installed Generation Capital |
| strategic_reserve_target | VARIABLE | A Power Strategic Reserve Target |
| inactive | VARIABLE | A Power Inactive Generation Capital |
| target_active | VARIABLE | A Power Target Active Generation Capital |
| activation_gap | VARIABLE | A Power Activation Gap |
| mothball_gap | VARIABLE | A Power Mothball Gap |
| installed_shortage | VARIABLE | A Power Installed Generation Shortage |
| installed_excess | VARIABLE | A Power Installed Generation Excess |
| gap_limited_construction | VARIABLE | A Power Gap Limited Construction |
| activation_queue | VARIABLE | A Power Activation Queue Capital |
| inactive_after_activation_queue | VARIABLE | A Power Inactive After Activation Queue |
| strategic_reserve | VARIABLE | A Power Strategic Reserve Capital |
| surplus | VARIABLE | A Power Surplus Generation Capital |
| lifetime | VARIABLE | A Power Lifetime Capacity Account |
| activation | FLOW | A Power Generation Activation |
| mothballing | FLOW | A Power Generation Mothballing |
| active_depreciation | FLOW | A Power Active Generation Depreciation |
| expansion | FLOW | A Power Generation Expansion |
| decommissioning_initiation | FLOW | A Power Decommissioning Initiation |
| installed_depreciation | FLOW | A Power Generation Depreciation |
| dismantling_completion | FLOW | A Power Dismantling Completion |
| desired_expansion | VARIABLE | A Power Desired Expansion |
| capital_goods_consumption | FLOW | A Power Capital Goods Consumption |

### B Power — CONFORMING_WITH_VARIATION

Sector-specific variation (informative, not a failure):
- optional role "finance_limited_construction" not present
- optional role "capital_goods_consumption_secondary" not present
- all kernel flows are gated by [Capital Lifecycle Enabled] (v7.3 regression switch)
- kernel-v2: expansion physically backed by capital goods

| Kernel role | Kind | Primitive |
|---|---|---|
| installed | STOCK | B Power Installed Generation Capital |
| active | STOCK | B Power Active Generation Capital |
| decommissioning | STOCK | B Power Decommissioning Generation Capital |
| retired | STOCK | B Power Retired Generation Capital |
| required_active | VARIABLE | B Power Required Active Generation Capital |
| desired_installed | VARIABLE | B Power Desired Installed Generation Capital |
| strategic_reserve_target | VARIABLE | B Power Strategic Reserve Target |
| inactive | VARIABLE | B Power Inactive Generation Capital |
| target_active | VARIABLE | B Power Target Active Generation Capital |
| activation_gap | VARIABLE | B Power Activation Gap |
| mothball_gap | VARIABLE | B Power Mothball Gap |
| installed_shortage | VARIABLE | B Power Installed Generation Shortage |
| installed_excess | VARIABLE | B Power Installed Generation Excess |
| gap_limited_construction | VARIABLE | B Power Gap Limited Construction |
| activation_queue | VARIABLE | B Power Activation Queue Capital |
| inactive_after_activation_queue | VARIABLE | B Power Inactive After Activation Queue |
| strategic_reserve | VARIABLE | B Power Strategic Reserve Capital |
| surplus | VARIABLE | B Power Surplus Generation Capital |
| lifetime | VARIABLE | B Power Lifetime Capacity Account |
| activation | FLOW | B Power Generation Activation |
| mothballing | FLOW | B Power Generation Mothballing |
| active_depreciation | FLOW | B Power Active Generation Depreciation |
| expansion | FLOW | B Power Generation Expansion |
| decommissioning_initiation | FLOW | B Power Decommissioning Initiation |
| installed_depreciation | FLOW | B Power Generation Depreciation |
| dismantling_completion | FLOW | B Power Dismantling Completion |
| desired_expansion | VARIABLE | B Power Desired Expansion |
| capital_goods_consumption | FLOW | B Power Capital Goods Consumption |

### A Refinery — CONFORMING_WITH_VARIATION

Sector-specific variation (informative, not a failure):
- optional role "capital_goods_consumption_secondary" not present
- kernel-v2: expansion physically backed by capital goods

| Kernel role | Kind | Primitive |
|---|---|---|
| installed | STOCK | A Refinery Installed Capacity |
| active | STOCK | A Refinery Active Capacity |
| decommissioning | STOCK | A Refinery Decommissioning Capacity |
| retired | STOCK | A Refinery Retired Capacity |
| required_active | VARIABLE | A Refinery Required Active Capacity |
| desired_installed | VARIABLE | A Refinery Desired Installed Capacity |
| strategic_reserve_target | VARIABLE | A Refinery Strategic Reserve Target |
| inactive | VARIABLE | A Refinery Inactive Capacity |
| target_active | VARIABLE | A Refinery Target Active Capacity |
| activation_gap | VARIABLE | A Refinery Activation Gap |
| mothball_gap | VARIABLE | A Refinery Mothball Gap |
| installed_shortage | VARIABLE | A Refinery Installed Capacity Shortage |
| installed_excess | VARIABLE | A Refinery Installed Capacity Excess |
| gap_limited_construction | VARIABLE | A Refinery Gap Limited Construction |
| activation_queue | VARIABLE | A Refinery Activation Queue Capacity |
| inactive_after_activation_queue | VARIABLE | A Refinery Inactive After Activation Queue |
| strategic_reserve | VARIABLE | A Refinery Strategic Reserve Capacity |
| surplus | VARIABLE | A Refinery Surplus Capacity |
| lifetime | VARIABLE | A Refinery Lifetime Capacity Account |
| activation | FLOW | A Refinery Activation |
| mothballing | FLOW | A Refinery Mothballing |
| active_depreciation | FLOW | A Refinery Active Depreciation |
| expansion | FLOW | A Refinery Expansion |
| decommissioning_initiation | FLOW | A Refinery Decommissioning Initiation |
| installed_depreciation | FLOW | A Refinery Depreciation |
| dismantling_completion | FLOW | A Refinery Dismantling Completion |
| finance_limited_construction | VARIABLE | A Refinery Finance Limited Construction |
| desired_expansion | VARIABLE | A Refinery Desired Expansion |
| capital_goods_consumption | FLOW | A Refinery Capital Goods Consumption |

### B Refinery — CONFORMING_WITH_VARIATION

Sector-specific variation (informative, not a failure):
- optional role "capital_goods_consumption_secondary" not present
- kernel-v2: expansion physically backed by capital goods

| Kernel role | Kind | Primitive |
|---|---|---|
| installed | STOCK | B Refinery Installed Capacity |
| active | STOCK | B Refinery Active Capacity |
| decommissioning | STOCK | B Refinery Decommissioning Capacity |
| retired | STOCK | B Refinery Retired Capacity |
| required_active | VARIABLE | B Refinery Required Active Capacity |
| desired_installed | VARIABLE | B Refinery Desired Installed Capacity |
| strategic_reserve_target | VARIABLE | B Refinery Strategic Reserve Target |
| inactive | VARIABLE | B Refinery Inactive Capacity |
| target_active | VARIABLE | B Refinery Target Active Capacity |
| activation_gap | VARIABLE | B Refinery Activation Gap |
| mothball_gap | VARIABLE | B Refinery Mothball Gap |
| installed_shortage | VARIABLE | B Refinery Installed Capacity Shortage |
| installed_excess | VARIABLE | B Refinery Installed Capacity Excess |
| gap_limited_construction | VARIABLE | B Refinery Gap Limited Construction |
| activation_queue | VARIABLE | B Refinery Activation Queue Capacity |
| inactive_after_activation_queue | VARIABLE | B Refinery Inactive After Activation Queue |
| strategic_reserve | VARIABLE | B Refinery Strategic Reserve Capacity |
| surplus | VARIABLE | B Refinery Surplus Capacity |
| lifetime | VARIABLE | B Refinery Lifetime Capacity Account |
| activation | FLOW | B Refinery Activation |
| mothballing | FLOW | B Refinery Mothballing |
| active_depreciation | FLOW | B Refinery Active Depreciation |
| expansion | FLOW | B Refinery Expansion |
| decommissioning_initiation | FLOW | B Refinery Decommissioning Initiation |
| installed_depreciation | FLOW | B Refinery Depreciation |
| dismantling_completion | FLOW | B Refinery Dismantling Completion |
| finance_limited_construction | VARIABLE | B Refinery Finance Limited Construction |
| desired_expansion | VARIABLE | B Refinery Desired Expansion |
| capital_goods_consumption | FLOW | B Refinery Capital Goods Consumption |

### Transport — CONFORMING_WITH_VARIATION

Sector-specific variation (informative, not a failure):
- v7.5.1 shared-infrastructure variation: Transport draws Capital Goods from both regional inventories; the primary and secondary consumption roles are both physically paired to one global expansion flow.
- kernel-v2: expansion physically backed by capital goods

| Kernel role | Kind | Primitive |
|---|---|---|
| installed | STOCK | Transport Installed Throughput Capacity |
| active | STOCK | Transport Active Throughput Capacity |
| decommissioning | STOCK | Transport Decommissioning Capacity |
| retired | STOCK | Transport Retired Capacity |
| required_active | VARIABLE | Transport Required Active Throughput Capacity |
| desired_installed | VARIABLE | Transport Desired Installed Throughput Capacity |
| strategic_reserve_target | VARIABLE | Transport Strategic Reserve Target |
| inactive | VARIABLE | Transport Inactive Throughput Capacity |
| target_active | VARIABLE | Transport Target Active Throughput Capacity |
| activation_gap | VARIABLE | Transport Activation Gap |
| mothball_gap | VARIABLE | Transport Mothball Gap |
| installed_shortage | VARIABLE | Transport Installed Capacity Shortage |
| installed_excess | VARIABLE | Transport Installed Capacity Excess |
| gap_limited_construction | VARIABLE | Transport Gap Limited Construction |
| activation_queue | VARIABLE | Transport Activation Queue Capacity |
| inactive_after_activation_queue | VARIABLE | Transport Inactive After Activation Queue |
| strategic_reserve | VARIABLE | Transport Strategic Reserve Capacity |
| surplus | VARIABLE | Transport Surplus Capacity |
| lifetime | VARIABLE | Transport Lifetime Capacity Account |
| activation | FLOW | Transport Capacity Activation |
| mothballing | FLOW | Transport Capacity Mothballing |
| active_depreciation | FLOW | Transport Active Capacity Depreciation |
| expansion | FLOW | Transport Capacity Expansion |
| decommissioning_initiation | FLOW | Transport Decommissioning Initiation |
| installed_depreciation | FLOW | Transport Capacity Depreciation |
| dismantling_completion | FLOW | Transport Dismantling Completion |
| finance_limited_construction | VARIABLE | Transport Finance Limited Construction |
| desired_expansion | VARIABLE | Transport Desired Expansion |
| capital_goods_consumption | FLOW | A Transport Capital Goods Consumption |
| capital_goods_consumption_secondary | FLOW | B Transport Capital Goods Consumption |

## Kernel contract (reference)

Flows and their fixed topology (∅ = outside the model boundary):

- `activation`: ∅ → active; must reference activation_gap
- `mothballing`: active → ∅; must reference mothball_gap
- `active_depreciation`: active → ∅; must reference active
- `expansion`: ∅ → installed; must reference gap_limited_construction
- `decommissioning_initiation`: installed → decommissioning; must reference surplus
- `installed_depreciation`: installed → retired; must reference installed
- `dismantling_completion`: decommissioning → retired; must reference decommissioning
- `capital_goods_consumption`: * → ∅; must reference expansion
- `capital_goods_consumption_secondary`: * → ∅; must reference expansion

Derived variables and required dependencies:

- `inactive` ← installed, active
- `target_active` ← required_active, installed
- `activation_gap` ← target_active, active
- `mothball_gap` ← active, target_active
- `installed_shortage` ← desired_installed, installed
- `installed_excess` ← installed, desired_installed
- `gap_limited_construction` ← installed_shortage
- `activation_queue` ← inactive, activation_gap
- `inactive_after_activation_queue` ← inactive, activation_queue
- `strategic_reserve` ← inactive_after_activation_queue, strategic_reserve_target
- `surplus` ← inactive_after_activation_queue, strategic_reserve
- `lifetime` ← installed, decommissioning, retired

Sector policy inputs (must exist; their formulas are sector policy, not kernel): `required_active`, `desired_installed`, `strategic_reserve_target`; optional `finance_limited_construction`.
