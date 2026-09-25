# Capital Lifecycle Kernel — отображение ролей на примитивы v7.6 r2

Основано на current `validation/validation-v7.6.json` (plugin `capital_lifecycle_kernel`) и current ModelJSON v7.6 r2. Это человекочитаемая копия machine mapping; при расхождении источником истины является current validation JSON вместе с accepted code.

Экземпляров: 7. Legacy-switch: `Capital Lifecycle Enabled`.

## Сводка экземпляров

| Экземпляр | Сектор | kernel | switch_gated | finance_limited_construction |
|---|---|:---:|:---:|:---:|
| A Electronics | Electronics | v2 | да | да |
| B Electronics | Electronics | v2 | да | да |
| A Power | Power | v2 | да | нет |
| B Power | Power | v2 | да | нет |
| A Refinery | Refinery | v2 | нет | да |
| B Refinery | Refinery | v2 | нет | да |
| Transport | Transport | v2 | нет | да |

## Electronics

| Роль | Тип | A Electronics | B Electronics |
|---|---|---|---|
| installed | STOCK | `A Electronics Installed Factory Capacity` | `B Electronics Installed Factory Capacity` |
| active | STOCK | `A Electronics Active Factory Capacity` | `B Electronics Active Factory Capacity` |
| decommissioning | STOCK | `A Electronics Decommissioning Factory Capacity` | `B Electronics Decommissioning Factory Capacity` |
| retired | STOCK | `A Electronics Retired Factory Capacity` | `B Electronics Retired Factory Capacity` |
| required_active (policy) | VARIABLE | `A Electronics Required Active Factory Capacity` | `B Electronics Required Active Factory Capacity` |
| desired_installed (policy) | VARIABLE | `A Electronics Desired Installed Factory Capacity` | `B Electronics Desired Installed Factory Capacity` |
| strategic_reserve_target (policy) | VARIABLE | `A Electronics Strategic Reserve Target` | `B Electronics Strategic Reserve Target` |
| inactive | VARIABLE | `A Electronics Inactive Factory Capacity` | `B Electronics Inactive Factory Capacity` |
| target_active | VARIABLE | `A Electronics Target Active Factory Capacity` | `B Electronics Target Active Factory Capacity` |
| activation_gap | VARIABLE | `A Electronics Factory Activation Gap` | `B Electronics Factory Activation Gap` |
| mothball_gap | VARIABLE | `A Electronics Factory Mothball Gap` | `B Electronics Factory Mothball Gap` |
| installed_shortage | VARIABLE | `A Electronics Installed Factory Shortage` | `B Electronics Installed Factory Shortage` |
| installed_excess | VARIABLE | `A Electronics Installed Factory Excess` | `B Electronics Installed Factory Excess` |
| gap_limited_construction | VARIABLE | `A Electronics Gap Limited Construction` | `B Electronics Gap Limited Construction` |
| activation_queue | VARIABLE | `A Electronics Activation Queue Capacity` | `B Electronics Activation Queue Capacity` |
| inactive_after_activation_queue | VARIABLE | `A Electronics Inactive After Activation Queue` | `B Electronics Inactive After Activation Queue` |
| strategic_reserve | VARIABLE | `A Electronics Strategic Reserve Capacity` | `B Electronics Strategic Reserve Capacity` |
| surplus | VARIABLE | `A Electronics Surplus Factory Capacity` | `B Electronics Surplus Factory Capacity` |
| lifetime | VARIABLE | `A Electronics Lifetime Capacity Account` | `B Electronics Lifetime Capacity Account` |
| finance_limited_construction (policy) | VARIABLE | `A Electronics Finance Limited Construction` | `B Electronics Finance Limited Construction` |
| activation | FLOW | `A Electronics Factory Activation` | `B Electronics Factory Activation` |
| mothballing | FLOW | `A Electronics Factory Mothballing` | `B Electronics Factory Mothballing` |
| active_depreciation | FLOW | `A Electronics Active Factory Depreciation` | `B Electronics Active Factory Depreciation` |
| expansion | FLOW | `A Electronics Factory Expansion` | `B Electronics Factory Expansion` |
| decommissioning_initiation | FLOW | `A Electronics Decommissioning Initiation` | `B Electronics Decommissioning Initiation` |
| installed_depreciation | FLOW | `A Electronics Factory Depreciation` | `B Electronics Factory Depreciation` |
| dismantling_completion | FLOW | `A Electronics Dismantling Completion` | `B Electronics Dismantling Completion` |
| desired_expansion (kernel-v2) | VARIABLE | `A Electronics Desired Expansion` | `B Electronics Desired Expansion` |
| capital_goods_consumption (kernel-v2) | FLOW | `A Electronics Capital Goods Consumption` | `B Electronics Capital Goods Consumption` |
## Power

| Роль | Тип | A Power | B Power |
|---|---|---|---|
| installed | STOCK | `A Power Installed Generation Capital` | `B Power Installed Generation Capital` |
| active | STOCK | `A Power Active Generation Capital` | `B Power Active Generation Capital` |
| decommissioning | STOCK | `A Power Decommissioning Generation Capital` | `B Power Decommissioning Generation Capital` |
| retired | STOCK | `A Power Retired Generation Capital` | `B Power Retired Generation Capital` |
| required_active (policy) | VARIABLE | `A Power Required Active Generation Capital` | `B Power Required Active Generation Capital` |
| desired_installed (policy) | VARIABLE | `A Power Desired Installed Generation Capital` | `B Power Desired Installed Generation Capital` |
| strategic_reserve_target (policy) | VARIABLE | `A Power Strategic Reserve Target` | `B Power Strategic Reserve Target` |
| inactive | VARIABLE | `A Power Inactive Generation Capital` | `B Power Inactive Generation Capital` |
| target_active | VARIABLE | `A Power Target Active Generation Capital` | `B Power Target Active Generation Capital` |
| activation_gap | VARIABLE | `A Power Activation Gap` | `B Power Activation Gap` |
| mothball_gap | VARIABLE | `A Power Mothball Gap` | `B Power Mothball Gap` |
| installed_shortage | VARIABLE | `A Power Installed Generation Shortage` | `B Power Installed Generation Shortage` |
| installed_excess | VARIABLE | `A Power Installed Generation Excess` | `B Power Installed Generation Excess` |
| gap_limited_construction | VARIABLE | `A Power Gap Limited Construction` | `B Power Gap Limited Construction` |
| activation_queue | VARIABLE | `A Power Activation Queue Capital` | `B Power Activation Queue Capital` |
| inactive_after_activation_queue | VARIABLE | `A Power Inactive After Activation Queue` | `B Power Inactive After Activation Queue` |
| strategic_reserve | VARIABLE | `A Power Strategic Reserve Capital` | `B Power Strategic Reserve Capital` |
| surplus | VARIABLE | `A Power Surplus Generation Capital` | `B Power Surplus Generation Capital` |
| lifetime | VARIABLE | `A Power Lifetime Capacity Account` | `B Power Lifetime Capacity Account` |
| finance_limited_construction (policy) | VARIABLE | — (опц.) | — (опц.) |
| activation | FLOW | `A Power Generation Activation` | `B Power Generation Activation` |
| mothballing | FLOW | `A Power Generation Mothballing` | `B Power Generation Mothballing` |
| active_depreciation | FLOW | `A Power Active Generation Depreciation` | `B Power Active Generation Depreciation` |
| expansion | FLOW | `A Power Generation Expansion` | `B Power Generation Expansion` |
| decommissioning_initiation | FLOW | `A Power Decommissioning Initiation` | `B Power Decommissioning Initiation` |
| installed_depreciation | FLOW | `A Power Generation Depreciation` | `B Power Generation Depreciation` |
| dismantling_completion | FLOW | `A Power Dismantling Completion` | `B Power Dismantling Completion` |
| desired_expansion (kernel-v2) | VARIABLE | `A Power Desired Expansion` | `B Power Desired Expansion` |
| capital_goods_consumption (kernel-v2) | FLOW | `A Power Capital Goods Consumption` | `B Power Capital Goods Consumption` |
## Refinery

| Роль | Тип | A Refinery | B Refinery |
|---|---|---|---|
| installed | STOCK | `A Refinery Installed Capacity` | `B Refinery Installed Capacity` |
| active | STOCK | `A Refinery Active Capacity` | `B Refinery Active Capacity` |
| decommissioning | STOCK | `A Refinery Decommissioning Capacity` | `B Refinery Decommissioning Capacity` |
| retired | STOCK | `A Refinery Retired Capacity` | `B Refinery Retired Capacity` |
| required_active (policy) | VARIABLE | `A Refinery Required Active Capacity` | `B Refinery Required Active Capacity` |
| desired_installed (policy) | VARIABLE | `A Refinery Desired Installed Capacity` | `B Refinery Desired Installed Capacity` |
| strategic_reserve_target (policy) | VARIABLE | `A Refinery Strategic Reserve Target` | `B Refinery Strategic Reserve Target` |
| inactive | VARIABLE | `A Refinery Inactive Capacity` | `B Refinery Inactive Capacity` |
| target_active | VARIABLE | `A Refinery Target Active Capacity` | `B Refinery Target Active Capacity` |
| activation_gap | VARIABLE | `A Refinery Activation Gap` | `B Refinery Activation Gap` |
| mothball_gap | VARIABLE | `A Refinery Mothball Gap` | `B Refinery Mothball Gap` |
| installed_shortage | VARIABLE | `A Refinery Installed Capacity Shortage` | `B Refinery Installed Capacity Shortage` |
| installed_excess | VARIABLE | `A Refinery Installed Capacity Excess` | `B Refinery Installed Capacity Excess` |
| gap_limited_construction | VARIABLE | `A Refinery Gap Limited Construction` | `B Refinery Gap Limited Construction` |
| activation_queue | VARIABLE | `A Refinery Activation Queue Capacity` | `B Refinery Activation Queue Capacity` |
| inactive_after_activation_queue | VARIABLE | `A Refinery Inactive After Activation Queue` | `B Refinery Inactive After Activation Queue` |
| strategic_reserve | VARIABLE | `A Refinery Strategic Reserve Capacity` | `B Refinery Strategic Reserve Capacity` |
| surplus | VARIABLE | `A Refinery Surplus Capacity` | `B Refinery Surplus Capacity` |
| lifetime | VARIABLE | `A Refinery Lifetime Capacity Account` | `B Refinery Lifetime Capacity Account` |
| finance_limited_construction (policy) | VARIABLE | `A Refinery Finance Limited Construction` | `B Refinery Finance Limited Construction` |
| activation | FLOW | `A Refinery Activation` | `B Refinery Activation` |
| mothballing | FLOW | `A Refinery Mothballing` | `B Refinery Mothballing` |
| active_depreciation | FLOW | `A Refinery Active Depreciation` | `B Refinery Active Depreciation` |
| expansion | FLOW | `A Refinery Expansion` | `B Refinery Expansion` |
| decommissioning_initiation | FLOW | `A Refinery Decommissioning Initiation` | `B Refinery Decommissioning Initiation` |
| installed_depreciation | FLOW | `A Refinery Depreciation` | `B Refinery Depreciation` |
| dismantling_completion | FLOW | `A Refinery Dismantling Completion` | `B Refinery Dismantling Completion` |
| desired_expansion (kernel-v2) | VARIABLE | `A Refinery Desired Expansion` | `B Refinery Desired Expansion` |
| capital_goods_consumption (kernel-v2) | FLOW | `A Refinery Capital Goods Consumption` | `B Refinery Capital Goods Consumption` |
## Transport

| Роль | Тип | Transport |
|---|---|---|
| installed | STOCK | `Transport Installed Throughput Capacity` |
| active | STOCK | `Transport Active Throughput Capacity` |
| decommissioning | STOCK | `Transport Decommissioning Capacity` |
| retired | STOCK | `Transport Retired Capacity` |
| required_active (policy) | VARIABLE | `Transport Required Active Throughput Capacity` |
| desired_installed (policy) | VARIABLE | `Transport Desired Installed Throughput Capacity` |
| strategic_reserve_target (policy) | VARIABLE | `Transport Strategic Reserve Target` |
| inactive | VARIABLE | `Transport Inactive Throughput Capacity` |
| target_active | VARIABLE | `Transport Target Active Throughput Capacity` |
| activation_gap | VARIABLE | `Transport Activation Gap` |
| mothball_gap | VARIABLE | `Transport Mothball Gap` |
| installed_shortage | VARIABLE | `Transport Installed Capacity Shortage` |
| installed_excess | VARIABLE | `Transport Installed Capacity Excess` |
| gap_limited_construction | VARIABLE | `Transport Gap Limited Construction` |
| activation_queue | VARIABLE | `Transport Activation Queue Capacity` |
| inactive_after_activation_queue | VARIABLE | `Transport Inactive After Activation Queue` |
| strategic_reserve | VARIABLE | `Transport Strategic Reserve Capacity` |
| surplus | VARIABLE | `Transport Surplus Capacity` |
| lifetime | VARIABLE | `Transport Lifetime Capacity Account` |
| finance_limited_construction (policy) | VARIABLE | `Transport Finance Limited Construction` |
| activation | FLOW | `Transport Capacity Activation` |
| mothballing | FLOW | `Transport Capacity Mothballing` |
| active_depreciation | FLOW | `Transport Active Capacity Depreciation` |
| expansion | FLOW | `Transport Capacity Expansion` |
| decommissioning_initiation | FLOW | `Transport Decommissioning Initiation` |
| installed_depreciation | FLOW | `Transport Capacity Depreciation` |
| dismantling_completion | FLOW | `Transport Dismantling Completion` |
| desired_expansion (kernel-v2) | VARIABLE | `Transport Desired Expansion` |
| capital_goods_consumption (kernel-v2) | FLOW | `A Transport Capital Goods Consumption` |
| capital_goods_consumption_secondary (kernel-v2, shared variation) | FLOW | `B Transport Capital Goods Consumption` |

## Отраслевая policy (не часть kernel; для справки)

Значения ниже — параметризация v7.6 r1, inherited from accepted v7.5.1 and taken from the current model. Они **не** проверяются kernel-контрактом и могут отличаться между секторами.

| Сектор | Параметр | Значение в модели |
|---|---|---|
| Electronics | `Electronics Activation Time` | `30` |
| Electronics | `Electronics Mothball Time` | `30` |
| Electronics | `Electronics Construction Time` | `240` |
| Electronics | `Electronics Surplus Disposal Decision Time` | `1440` |
| Electronics | `Electronics Decommissioning Time` | `720` |
| Electronics | `Electronics Strategic Reserve Fraction` | `0.25` |
| Electronics | `Electronics Depreciation Rate` | `0.00005` |
| Power | `Power Activation Time` | `21` |
| Power | `Power Mothball Time` | `45` |
| Power | `Power Construction Time` | `360` |
| Power | `Power Surplus Disposal Decision Time` | `1440` |
| Power | `Power Decommissioning Time` | `1080` |
| Power | `Power Strategic Reserve Fraction` | `0.05` |
| Power | `Power Depreciation Rate` | `0.00003` |
| Refinery | `Refinery Activation Time` | `20` |
| Refinery | `Refinery Mothball Time` | `10` |
| Refinery | `Refinery Construction Time` | `180` |
| Refinery | `Refinery Surplus Disposal Decision Time` | `240` |
| Refinery | `Refinery Decommissioning Time` | `540` |
| Refinery | `Refinery Operating Reserve Factor` | `1.1` |
| Refinery | `Refinery Installed Reserve Factor` | `1.15` |
| Refinery | `A Refinery Depreciation Rate` | `0.0001` |
| Transport | `Transport Activation Time` | `7` |
| Transport | `Transport Mothball Time` | `7` |
| Transport | `Transport Construction Time` | `120` |
| Transport | `Transport Surplus Disposal Decision Time` | `240` |
| Transport | `Transport Decommissioning Time` | `360` |
| Transport | `Transport Operating Reserve Factor` | `1.15` |
| Transport | `Transport Installed Reserve Factor` | `1.25` |
| Transport | `Transport Depreciation Rate` | `0.0001` |

