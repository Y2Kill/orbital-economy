# v7.4 — рабочий контекст: точные имена и формулы accepted v7.3 r2

Сгенерировано из `baseline/model/orbital_economy_v7_3_r2_modeljson.json` (SHA `57a2a102…`). Это извлечение, а не пересказ: формулы приведены дословно. Всё, что не перечислено здесь, для v7.4 менять запрещено (см. спецификацию §4). Полная модель доступна в `baseline/model/` и в `v7_4_working_context.json` (те же элементы машинно-читаемо).

Замечание о записи `max/min`: в модели `max(x, 0)` записано как `(x + (x^2)^0.5)/2`, а `min(a, b)` как `(a + b - ((a - b)^2)^0.5)/2`. В **новых** элементах допустимо использовать `Max()` / `Min()` движка; в существующих формулах ничего не переписывать.

## 1. Переключатели, окна и тестовые триггеры (образец для v7.4)

- **Timed Test Mode** (VARIABLE)
  `value = 0`
  _0=Baseline multi-good countertrade; 1=B metal reactivation freight shock; 2=metal demand surge / v7.2 metal-energy stress; 3=metal low-demand rationalization; 4=metal reverse advantage; 5=electronics demand surge / v7.2 electronics-energy stress; 6=reverse electronics advantage; 7=two-good transport surge; 8=metal-priority transport scarcity; 9=two-industry local energy stress; 10=cheap-energy comparative-advantage shift; 11=A generation-capacity shock/recovery._
  LINKs in: —
- **Capital Lifecycle Enabled** (VARIABLE)
  `value = 1`
  _Master switch for the v7.3 Electronics and Energy capital lifecycle. Normal/raw model default is enabled. Accepted v7.2 regression scenarios 0-11 explicitly override it to 0; v7.3 scenarios 12+ set it to 1._
  LINKs in: —
- **Temporary Test Window** (VARIABLE)
  `value = "IfThenElse(Days() >= [Test Shock Start Day], IfThenElse(Days() < [Test Shock End Day], 1, 0), 0)"`
  _1 only during the temporary shock window._
  LINKs in: `Test Shock Start Day`, `Test Shock End Day`
- **Reverse Advantage Window** (VARIABLE)
  `value = "IfThenElse(Days() >= [Test Shock Start Day], 1, 0)"`
  _1 from the reverse-advantage shock start until the end of the run._
  LINKs in: `Test Shock Start Day`
- **Test 13 Temporary Electronics Lifecycle Surge Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 13, [Temporary Test Window], 0)"`
  _v7.3 test harness only._
  LINKs in: `Timed Test Mode`, `Temporary Test Window`
- **Test 14 Sustained Electronics Growth Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 14, [Reverse Advantage Window], 0)"`
  _v7.3 test harness only._
  LINKs in: `Timed Test Mode`, `Reverse Advantage Window`
- **Test 15 Electronics Collapse Recovery Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 15, [Temporary Test Window], 0)"`
  _v7.3 test harness only._
  LINKs in: `Timed Test Mode`, `Temporary Test Window`
- **Test 16 Sustained Metal Energy Growth Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 16, [Reverse Advantage Window], 0)"`
  _v7.3 test harness only._
  LINKs in: `Timed Test Mode`, `Reverse Advantage Window`
- **v7.3 Temporary Electronics Demand Multiplier** (VARIABLE)
  `value = 2`
  _v7.3 test harness only._
  LINKs in: —
- **v7.3 Sustained Electronics Growth Multiplier** (VARIABLE)
  `value = 4`
  _v7.3 test harness only._
  LINKs in: —
- **v7.3 Electronics Demand Collapse Multiplier** (VARIABLE)
  `value = 0.35`
  _v7.3 test harness only._
  LINKs in: —
- **v7.3 Sustained Metal Demand Growth Multiplier** (VARIABLE)
  `value = 2`
  _v7.3 test harness only._
  LINKs in: —
- **A Effective Electronics Local Base Demand** (VARIABLE)
  `value = "IfThenElse([Test 14 Sustained Electronics Growth Active] = 1, [A Electronics Local Base Demand] * [v7.3 Sustained Electronics Growth Multiplier], IfThenElse([Test 13 Temporary Electronics Lifecycle Surge Active] = 1, [A Electronics Local Base Demand] * [v7.3 Temporary Electronics Demand Multiplier], IfThenElse([Test 9 Two Industry Energy Stress Active] = 1, [A Electronics Local Base Demand] * [Two Industry Energy Stress Demand Multiplier], IfThenElse([Test 8 Metal Priority Scarcity Active] = 1, [A Electronics Local Base Demand] * [Priority Stress Demand Multiplier], IfThenElse([Test 5 Electronics Demand Surge Active] = 1, [A Electronics Local Base Demand] * [Electronics Demand Surge Multiplier], IfThenElse([Test 7 Two Good Transport Surge Active] = 1, [A Electronics Local Base Demand] * [Two Good Demand Surge Multiplier], [A Electronics Local Base Demand]))))))"`
  LINKs in: `Test 5 Electronics Demand Surge Active`, `A Electronics Local Base Demand`, `Electronics Demand Surge Multiplier`, `Test 7 Two Good Transport Surge Active`, `Two Good Demand Surge Multiplier`, `Test 8 Metal Priority Scarcity Active`, `Priority Stress Demand Multiplier`, `Test 9 Two Industry Energy Stress Active`, `Two Industry Energy Stress Demand Multiplier`, `Test 14 Sustained Electronics Growth Active`, `v7.3 Sustained Electronics Growth Multiplier`, `Test 13 Temporary Electronics Lifecycle Surge Active`, `v7.3 Temporary Electronics Demand Multiplier`
- **B Effective Electronics Local Base Demand** (VARIABLE)
  `value = "IfThenElse([Test 15 Electronics Collapse Recovery Active] = 1, [B Electronics Local Base Demand] * [v7.3 Electronics Demand Collapse Multiplier], [B Electronics Local Base Demand])"`
  LINKs in: `B Electronics Local Base Demand`, `Test 15 Electronics Collapse Recovery Active`, `v7.3 Electronics Demand Collapse Multiplier`
- **A Effective Local Base Demand** (VARIABLE)
  `value = "[A Local Base Demand]"`
  LINKs in: `A Local Base Demand`
- **B Effective Local Base Demand** (VARIABLE)
  `value = "IfThenElse([Test 16 Sustained Metal Energy Growth Active] = 1, [B Local Base Demand] * [v7.3 Sustained Metal Demand Growth Multiplier], IfThenElse([Test 9 Two Industry Energy Stress Active] = 1, [B Local Base Demand] * [Two Industry Energy Stress Demand Multiplier], IfThenElse([Test 8 Metal Priority Scarcity Active] = 1, [B Local Base Demand] * [Priority Stress Demand Multiplier], IfThenElse([Test 7 Two Good Transport Surge Active] = 1, [B Local Base Demand] * [Two Good Demand Surge Multiplier], IfThenElse([Test 2 Transport Surge Active] = 1, [B Local Base Demand] * [Transport Demand Surge Multiplier], IfThenElse([Test 3 Low Demand Active] = 1, [B Local Base Demand] * [Low Demand Multiplier], [B Local Base Demand]))))))"`
  _B demand fundamental after timed demand-surge or demand-collapse overrides._
  LINKs in: `Test 2 Transport Surge Active`, `B Local Base Demand`, `Transport Demand Surge Multiplier`, `Test 3 Low Demand Active`, `Low Demand Multiplier`, `Test 7 Two Good Transport Surge Active`, `Two Good Demand Surge Multiplier`, `Test 8 Metal Priority Scarcity Active`, `Priority Stress Demand Multiplier`, `Test 9 Two Industry Energy Stress Active`, `Two Industry Energy Stress Demand Multiplier`, `Test 16 Sustained Metal Energy Growth Active`, `v7.3 Sustained Metal Demand Growth Multiplier`
- **B Effective Mining Capacity** (VARIABLE)
  `value = "IfThenElse([Test 4 Reverse Advantage Active] = 1, [Reverse B Mining Capacity], [B Mining Capacity])"`
  LINKs in: `Test 4 Reverse Advantage Active`, `Reverse B Mining Capacity`, `B Mining Capacity`
- **B Mining Capacity** (VARIABLE)
  `value = 28`
  LINKs in: —
- **Reverse B Mining Capacity** (VARIABLE)
  `value = 70`
  LINKs in: —

## 2. Сектор Electronics колонии A — все элементы (B зеркален; имена с префиксом B)

- **A Desired Electronics Feedstock Extraction Rate** (VARIABLE)
  `value = "[A Electronics Feedstock Consumption Rate] + ([A Electronics Feedstock Target Inventory] - [A Electronics Feedstock Inventory]) / [A Electronics Feedstock Adjustment Time]"`
  LINKs in: `A Electronics Feedstock Consumption Rate`, `A Electronics Feedstock Target Inventory`, `A Electronics Feedstock Inventory`, `A Electronics Feedstock Adjustment Time`
- **A Desired Electronics Production Rate** (VARIABLE)
  `value = "[A Electronics Local Sales] + [Electronics Shipment Rate A to B] - [Electronics Shipment Rate B to A] + ([A Electronics Target Inventory] - [A Electronics Inventory]) / [A Electronics Inventory Adjustment Time]"`
  LINKs in: `A Electronics Local Sales`, `Electronics Shipment Rate A to B`, `Electronics Shipment Rate B to A`, `A Electronics Target Inventory`, `A Electronics Inventory`, `A Electronics Inventory Adjustment Time`
- **A Effective Electronics Feedstock Base Cost** (VARIABLE)
  `value = "IfThenElse([Test 6 Electronics Reverse Advantage Active] = 1, [Reverse A Electronics Feedstock Base Cost], [A Electronics Feedstock Base Cost])"`
  LINKs in: `Test 6 Electronics Reverse Advantage Active`, `Reverse A Electronics Feedstock Base Cost`, `A Electronics Feedstock Base Cost`
- **A Effective Electronics Local Base Demand** (VARIABLE)
  `value = "IfThenElse([Test 14 Sustained Electronics Growth Active] = 1, [A Electronics Local Base Demand] * [v7.3 Sustained Electronics Growth Multiplier], IfThenElse([Test 13 Temporary Electronics Lifecycle Surge Active] = 1, [A Electronics Local Base Demand] * [v7.3 Temporary Electronics Demand Multiplier], IfThenElse([Test 9 Two Industry Energy Stress Active] = 1, [A Electronics Local Base Demand] * [Two Industry Energy Stress Demand Multiplier], IfThenElse([Test 8 Metal Priority Scarcity Active] = 1, [A Electronics Local Base Demand] * [Priority Stress Demand Multiplier], IfThenElse([Test 5 Electronics Demand Surge Active] = 1, [A Electronics Local Base Demand] * [Electronics Demand Surge Multiplier], IfThenElse([Test 7 Two Good Transport Surge Active] = 1, [A Electronics Local Base Demand] * [Two Good Demand Surge Multiplier], [A Electronics Local Base Demand]))))))"`
  LINKs in: `Test 5 Electronics Demand Surge Active`, `A Electronics Local Base Demand`, `Electronics Demand Surge Multiplier`, `Test 7 Two Good Transport Surge Active`, `Two Good Demand Surge Multiplier`, `Test 8 Metal Priority Scarcity Active`, `Priority Stress Demand Multiplier`, `Test 9 Two Industry Energy Stress Active`, `Two Industry Energy Stress Demand Multiplier`, `Test 14 Sustained Electronics Growth Active`, `v7.3 Sustained Electronics Growth Multiplier`, `Test 13 Temporary Electronics Lifecycle Surge Active`, `v7.3 Temporary Electronics Demand Multiplier`
- **A Electronics Activation Queue Capacity** (VARIABLE)
  `value = "(([A Electronics Inactive Factory Capacity]) + ([A Electronics Factory Activation Gap]) - (((([A Electronics Inactive Factory Capacity]) - ([A Electronics Factory Activation Gap])) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Electronics Inactive Factory Capacity`, `A Electronics Factory Activation Gap`
- **A Electronics Active Factory Capacity** (STOCK)
  `initial_value = 45`
  _Electronics factory capacity in A currently staffed/operational and available to the production soft-cap._
  LINKs in: —
- **A Electronics Active Factory Depreciation** (FLOW | from: A Electronics Active Factory Capacity → to: ∅)
  `value = "[Capital Lifecycle Enabled] * [A Electronics Active Factory Capacity] * [Electronics Depreciation Rate]"`
  LINKs in: `Capital Lifecycle Enabled`, `A Electronics Active Factory Capacity`, `Electronics Depreciation Rate`
- **A Electronics Active Share of Installed** (VARIABLE)
  `value = "[A Electronics Active Factory Capacity] / ([A Electronics Installed Factory Capacity] + 0.001)"`
  LINKs in: `A Electronics Active Factory Capacity`, `A Electronics Installed Factory Capacity`
- **A Electronics Allocated Energy** (VARIABLE)
  `value = "[A Electronics Requested Energy] * [A Energy Fulfillment Ratio]"`
  LINKs in: `A Energy Fulfillment Ratio`, `A Electronics Requested Energy`
- **A Electronics Available Physical Capital** (VARIABLE)
  `value = "[A Electronics Installed Factory Capacity] + [A Electronics Decommissioning Factory Capacity]"`
  LINKs in: `A Electronics Installed Factory Capacity`, `A Electronics Decommissioning Factory Capacity`
- **A Electronics Base Markup** (VARIABLE)
  `value = 0.18`
  LINKs in: —
- **A Electronics Buffer** (VARIABLE)
  `value = 10`
  LINKs in: —
- **A Electronics Capacity Planning Down Gap** (VARIABLE)
  `value = "(([A Electronics Capacity Planning Signal] - [A Positive Desired Electronics Production Rate]) + ((([A Electronics Capacity Planning Signal] - [A Positive Desired Electronics Production Rate]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Electronics Capacity Planning Signal`, `A Positive Desired Electronics Production Rate`
- **A Electronics Capacity Planning Signal** (STOCK)
  `initial_value = 1.25793`
  _Smoothed desired electronics production used only for A factory-capital decisions._
  LINKs in: —
- **A Electronics Capacity Planning Signal Decrease** (FLOW | from: A Electronics Capacity Planning Signal → to: ∅)
  `value = "[A Electronics Capacity Planning Down Gap] / [Electronics Capacity Planning Adjustment Time]"`
  LINKs in: `A Electronics Capacity Planning Down Gap`, `Electronics Capacity Planning Adjustment Time`
- **A Electronics Capacity Planning Signal Increase** (FLOW | from: ∅ → to: A Electronics Capacity Planning Signal)
  `value = "[A Electronics Capacity Planning Up Gap] / [Electronics Capacity Planning Adjustment Time]"`
  LINKs in: `A Electronics Capacity Planning Up Gap`, `Electronics Capacity Planning Adjustment Time`
- **A Electronics Capacity Planning Up Gap** (VARIABLE)
  `value = "(([A Positive Desired Electronics Production Rate] - [A Electronics Capacity Planning Signal]) + ((([A Positive Desired Electronics Production Rate] - [A Electronics Capacity Planning Signal]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Positive Desired Electronics Production Rate`, `A Electronics Capacity Planning Signal`
- **A Electronics Decommissioning Factory Capacity** (STOCK)
  `initial_value = 0`
  _A electronics capital committed to permanent retirement but not yet fully dismantled._
  LINKs in: —
- **A Electronics Decommissioning Initiation** (FLOW | from: A Electronics Installed Factory Capacity → to: A Electronics Decommissioning Factory Capacity)
  `value = "[Capital Lifecycle Enabled] * [A Electronics Surplus Factory Capacity] / [Electronics Surplus Disposal Decision Time]"`
  LINKs in: `Capital Lifecycle Enabled`, `A Electronics Surplus Factory Capacity`, `Electronics Surplus Disposal Decision Time`
- **A Electronics Demand Elasticity** (VARIABLE)
  `value = 0.6`
  LINKs in: —
- **A Electronics Desired Import Share from B** (VARIABLE)
  `value = "[Electronics Import Share Sensitivity] * [A Electronics Relative Advantage from B] / (1 + [Electronics Import Share Sensitivity] * [A Electronics Relative Advantage from B])"`
  LINKs in: `Electronics Import Share Sensitivity`, `A Electronics Relative Advantage from B`
- **A Electronics Desired Installed Factory Capacity** (VARIABLE)
  `value = "[A Electronics Required Active Factory Capacity]"`
  _Installed-capacity target follows required active capacity; additional resilience is represented by slow disposal and strategic mothballed reserve rather than mandatory overbuilding._
  LINKs in: `A Electronics Required Active Factory Capacity`
- **A Electronics Dismantling Completion** (FLOW | from: A Electronics Decommissioning Factory Capacity → to: A Electronics Retired Factory Capacity)
  `value = "[Capital Lifecycle Enabled] * [A Electronics Decommissioning Factory Capacity] / [Electronics Decommissioning Time]"`
  LINKs in: `Capital Lifecycle Enabled`, `A Electronics Decommissioning Factory Capacity`, `Electronics Decommissioning Time`
- **A Electronics Domestic Offer Price** (VARIABLE)
  `value = "[A Electronics Unit Cost] * (1 + [A Electronics Base Markup] + [A Electronics Scarcity Strength] * [A Electronics Shortage] / [A Electronics Target Inventory])"`
  LINKs in: `A Electronics Unit Cost`, `A Electronics Base Markup`, `A Electronics Scarcity Strength`, `A Electronics Shortage`, `A Electronics Target Inventory`
- **A Electronics Domestic Supply Down Gap** (VARIABLE)
  `value = "(([A Electronics Domestic Supply Signal] - [A Electronics Production Rate]) + ((([A Electronics Domestic Supply Signal] - [A Electronics Production Rate]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Electronics Domestic Supply Signal`, `A Electronics Production Rate`
- **A Electronics Domestic Supply Signal** (STOCK)
  `initial_value = 20`
  LINKs in: —
- **A Electronics Domestic Supply Signal Decrease** (FLOW | from: A Electronics Domestic Supply Signal → to: ∅)
  `value = "[A Electronics Domestic Supply Down Gap] / [Electronics Supply Mix Adjustment Time]"`
  LINKs in: `A Electronics Domestic Supply Down Gap`, `Electronics Supply Mix Adjustment Time`
- **A Electronics Domestic Supply Signal Increase** (FLOW | from: ∅ → to: A Electronics Domestic Supply Signal)
  `value = "[A Electronics Domestic Supply Up Gap] / [Electronics Supply Mix Adjustment Time]"`
  LINKs in: `A Electronics Domestic Supply Up Gap`, `Electronics Supply Mix Adjustment Time`
- **A Electronics Domestic Supply Up Gap** (VARIABLE)
  `value = "(([A Electronics Production Rate] - [A Electronics Domestic Supply Signal]) + ((([A Electronics Production Rate] - [A Electronics Domestic Supply Signal]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Electronics Production Rate`, `A Electronics Domestic Supply Signal`
- **A Electronics Energy Fulfillment Ratio** (VARIABLE)
  `value = "IfThenElse([A Electronics Requested Energy] > 0.001, [A Electronics Allocated Energy] / [A Electronics Requested Energy], 1)"`
  LINKs in: `A Electronics Requested Energy`, `A Electronics Allocated Energy`
- **A Electronics Energy per Unit** (VARIABLE)
  `value = 12`
  LINKs in: —
- **A Electronics Factory Activation** (FLOW | from: ∅ → to: A Electronics Active Factory Capacity)
  `value = "[Capital Lifecycle Enabled] * [A Electronics Factory Activation Gap] / [Electronics Activation Time]"`
  LINKs in: `Capital Lifecycle Enabled`, `A Electronics Factory Activation Gap`, `Electronics Activation Time`
- **A Electronics Factory Activation Gap** (VARIABLE)
  `value = "(([A Electronics Target Active Factory Capacity] - [A Electronics Active Factory Capacity]) + ((([A Electronics Target Active Factory Capacity] - [A Electronics Active Factory Capacity]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Electronics Target Active Factory Capacity`, `A Electronics Active Factory Capacity`
- **A Electronics Factory Capacity** (VARIABLE)
  `value = "IfThenElse([Capital Lifecycle Enabled] = 1, [A Electronics Active Factory Capacity], [A Legacy Electronics Factory Capacity])"`
  _Compatibility/effective A electronics production capacity. v7.3 lifecycle modes use active factory capital; accepted v7.2 regression modes use the frozen legacy value 45._
  LINKs in: `Capital Lifecycle Enabled`, `A Electronics Active Factory Capacity`, `A Legacy Electronics Factory Capacity`
- **A Electronics Factory Depreciation** (FLOW | from: A Electronics Installed Factory Capacity → to: A Electronics Retired Factory Capacity)
  `value = "[Capital Lifecycle Enabled] * [A Electronics Installed Factory Capacity] * [Electronics Depreciation Rate]"`
  LINKs in: `Capital Lifecycle Enabled`, `A Electronics Installed Factory Capacity`, `Electronics Depreciation Rate`
- **A Electronics Factory Expansion** (FLOW | from: ∅ → to: A Electronics Installed Factory Capacity)
  `value = "[Capital Lifecycle Enabled] * (([A Electronics Gap Limited Construction]) + ([A Electronics Finance Limited Construction]) - (((([A Electronics Gap Limited Construction]) - ([A Electronics Finance Limited Construction])) ^ 2) ^ 0.5)) / 2"`
  _New installed electronics factory capacity. Structural shortage and the electronics-sector finance proxy must both permit construction._
  LINKs in: `Capital Lifecycle Enabled`, `A Electronics Gap Limited Construction`, `A Electronics Finance Limited Construction`
- **A Electronics Factory Mothball Gap** (VARIABLE)
  `value = "(([A Electronics Active Factory Capacity] - [A Electronics Target Active Factory Capacity]) + ((([A Electronics Active Factory Capacity] - [A Electronics Target Active Factory Capacity]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Electronics Active Factory Capacity`, `A Electronics Target Active Factory Capacity`
- **A Electronics Factory Mothballing** (FLOW | from: A Electronics Active Factory Capacity → to: ∅)
  `value = "[Capital Lifecycle Enabled] * [A Electronics Factory Mothball Gap] / [Electronics Mothball Time]"`
  LINKs in: `Capital Lifecycle Enabled`, `A Electronics Factory Mothball Gap`, `Electronics Mothball Time`
- **A Electronics Factory Utilization** (VARIABLE)
  `value = "[A Electronics Production Rate] / ([A Electronics Factory Capacity] + 0.001)"`
  LINKs in: `A Electronics Production Rate`, `A Electronics Factory Capacity`
- **A Electronics Feedstock Adjustment Time** (VARIABLE)
  `value = 40`
  LINKs in: —
- **A Electronics Feedstock Base Cost** (VARIABLE)
  `value = 18`
  LINKs in: —
- **A Electronics Feedstock Buffer** (VARIABLE)
  `value = 40`
  LINKs in: —
- **A Electronics Feedstock Consumption** (FLOW | from: A Electronics Feedstock Inventory → to: ∅)
  `value = "[A Electronics Feedstock Consumption Rate]"`
  LINKs in: `A Electronics Feedstock Consumption Rate`
- **A Electronics Feedstock Consumption Rate** (VARIABLE)
  `value = "[A Electronics Production Rate] * [A Feedstock per Electronics]"`
  LINKs in: `A Electronics Production Rate`, `A Feedstock per Electronics`
- **A Electronics Feedstock Extraction** (FLOW | from: ∅ → to: A Electronics Feedstock Inventory)
  `value = "[A Electronics Feedstock Extraction Rate]"`
  LINKs in: `A Electronics Feedstock Extraction Rate`
- **A Electronics Feedstock Extraction Capacity** (VARIABLE)
  `value = 60`
  LINKs in: —
- **A Electronics Feedstock Extraction Rate** (VARIABLE)
  `value = "[A Positive Desired Electronics Feedstock Extraction Rate] / (1 + ([A Positive Desired Electronics Feedstock Extraction Rate] / ([A Electronics Feedstock Extraction Capacity] + 0.001)) ^ 8) ^ 0.125"`
  LINKs in: `A Positive Desired Electronics Feedstock Extraction Rate`, `A Electronics Feedstock Extraction Capacity`
- **A Electronics Feedstock Inventory** (STOCK)
  `initial_value = 1200`
  LINKs in: —
- **A Electronics Feedstock Price** (VARIABLE)
  `value = "[A Effective Electronics Feedstock Base Cost] * (1 + [A Electronics Feedstock Scarcity Strength] * [A Electronics Feedstock Shortage] / [A Electronics Feedstock Target Inventory])"`
  LINKs in: `A Effective Electronics Feedstock Base Cost`, `A Electronics Feedstock Scarcity Strength`, `A Electronics Feedstock Shortage`, `A Electronics Feedstock Target Inventory`
- **A Electronics Feedstock Scarcity Strength** (VARIABLE)
  `value = 0.4`
  LINKs in: —
- **A Electronics Feedstock Shortage** (VARIABLE)
  `value = "(([A Electronics Feedstock Target Inventory] - [A Electronics Feedstock Inventory]) + ((([A Electronics Feedstock Target Inventory] - [A Electronics Feedstock Inventory]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Electronics Feedstock Target Inventory`, `A Electronics Feedstock Inventory`
- **A Electronics Feedstock Target Inventory** (VARIABLE)
  `value = 1200`
  LINKs in: —
- **A Electronics Finance Limited Construction** (VARIABLE)
  `value = "[Electronics Reinvestment Fraction] * [A Positive Electronics Operating Profit Proxy] / [Electronics Capital Cost per Capacity]"`
  LINKs in: `Electronics Reinvestment Fraction`, `A Positive Electronics Operating Profit Proxy`, `Electronics Capital Cost per Capacity`
- **A Electronics Gap Limited Construction** (VARIABLE)
  `value = "[A Electronics Installed Factory Shortage] / [Electronics Construction Time]"`
  LINKs in: `A Electronics Installed Factory Shortage`, `Electronics Construction Time`
- **A Electronics Import Inventory Need** (VARIABLE)
  `value = "[A Electronics Shortage] / [Electronics Import Inventory Adjustment Time]"`
  LINKs in: `A Electronics Shortage`, `Electronics Import Inventory Adjustment Time`
- **A Electronics Import Supply Down Gap** (VARIABLE)
  `value = "(([A Electronics Import Supply Signal] - [Electronics Delivery Rate B to A]) + ((([A Electronics Import Supply Signal] - [Electronics Delivery Rate B to A]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Electronics Import Supply Signal`, `Electronics Delivery Rate B to A`
- **A Electronics Import Supply Signal** (STOCK)
  `initial_value = 0`
  LINKs in: —
- **A Electronics Import Supply Signal Decrease** (FLOW | from: A Electronics Import Supply Signal → to: ∅)
  `value = "[A Electronics Import Supply Down Gap] / [Electronics Supply Mix Adjustment Time]"`
  LINKs in: `A Electronics Import Supply Down Gap`, `Electronics Supply Mix Adjustment Time`
- **A Electronics Import Supply Signal Increase** (FLOW | from: ∅ → to: A Electronics Import Supply Signal)
  `value = "[A Electronics Import Supply Up Gap] / [Electronics Supply Mix Adjustment Time]"`
  LINKs in: `A Electronics Import Supply Up Gap`, `Electronics Supply Mix Adjustment Time`
- **A Electronics Import Supply Up Gap** (VARIABLE)
  `value = "(([Electronics Delivery Rate B to A] - [A Electronics Import Supply Signal]) + ((([Electronics Delivery Rate B to A] - [A Electronics Import Supply Signal]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `Electronics Delivery Rate B to A`, `A Electronics Import Supply Signal`
- **A Electronics Inactive After Activation Queue** (VARIABLE)
  `value = "(([A Electronics Inactive Factory Capacity] - [A Electronics Activation Queue Capacity]) + ((([A Electronics Inactive Factory Capacity] - [A Electronics Activation Queue Capacity]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Electronics Inactive Factory Capacity`, `A Electronics Activation Queue Capacity`
- **A Electronics Inactive Factory Capacity** (VARIABLE)
  `value = "(([A Electronics Installed Factory Capacity] - [A Electronics Active Factory Capacity]) + ((([A Electronics Installed Factory Capacity] - [A Electronics Active Factory Capacity]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Electronics Installed Factory Capacity`, `A Electronics Active Factory Capacity`
- **A Electronics Installed Factory Capacity** (STOCK)
  `initial_value = 45`
  _Physical installed electronics production capital in A. New construction enters here; mothballing does not destroy it._
  LINKs in: —
- **A Electronics Installed Factory Excess** (VARIABLE)
  `value = "(([A Electronics Installed Factory Capacity] - [A Electronics Desired Installed Factory Capacity]) + ((([A Electronics Installed Factory Capacity] - [A Electronics Desired Installed Factory Capacity]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Electronics Installed Factory Capacity`, `A Electronics Desired Installed Factory Capacity`
- **A Electronics Installed Factory Shortage** (VARIABLE)
  `value = "(([A Electronics Desired Installed Factory Capacity] - [A Electronics Installed Factory Capacity]) + ((([A Electronics Desired Installed Factory Capacity] - [A Electronics Installed Factory Capacity]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Electronics Desired Installed Factory Capacity`, `A Electronics Installed Factory Capacity`
- **A Electronics Inventory** (STOCK)
  `initial_value = 500`
  LINKs in: —
- **A Electronics Inventory Adjustment Time** (VARIABLE)
  `value = 30`
  LINKs in: —
- **A Electronics Labor per Unit** (VARIABLE)
  `value = 0.05`
  LINKs in: —
- **A Electronics Lifetime Capacity Account** (VARIABLE)
  `value = "[A Electronics Installed Factory Capacity] + [A Electronics Decommissioning Factory Capacity] + [A Electronics Retired Factory Capacity]"`
  LINKs in: `A Electronics Installed Factory Capacity`, `A Electronics Decommissioning Factory Capacity`, `A Electronics Retired Factory Capacity`
- **A Electronics Local Base Demand** (VARIABLE)
  `value = 20`
  LINKs in: —
- **A Electronics Local Consumption** (FLOW | from: A Electronics Inventory → to: ∅)
  `value = "[A Electronics Local Sales]"`
  LINKs in: `A Electronics Local Sales`
- **A Electronics Local Demand** (VARIABLE)
  `value = "[A Effective Electronics Local Base Demand] * ([A Electronics Reference Price] / [A Electronics Market Price]) ^ [A Electronics Demand Elasticity]"`
  LINKs in: `A Effective Electronics Local Base Demand`, `A Electronics Reference Price`, `A Electronics Market Price`, `A Electronics Demand Elasticity`
- **A Electronics Local Sales** (VARIABLE)
  `value = "[A Electronics Local Demand] * [A Electronics Inventory] / ([A Electronics Inventory] + [A Electronics Buffer])"`
  LINKs in: `A Electronics Local Demand`, `A Electronics Inventory`, `A Electronics Buffer`
- **A Electronics Market Price** (VARIABLE)
  `value = "(1 - [A Electronics Realized Import Share from B]) * [A Electronics Domestic Offer Price] + [A Electronics Realized Import Share from B] * [Delivered Electronics Contract Unit Price B to A]"`
  _Buyer-facing A electronics price using contracted landed value of electronics actually arriving from B._
  LINKs in: `A Electronics Realized Import Share from B`, `A Electronics Domestic Offer Price`, `Electronics Landed B Price in A`, `Delivered Electronics Contract Unit Price B to A`
- **A Electronics Max Export Release Rate** (VARIABLE)
  `value = "[Exportable Electronics A] / [Electronics Export Inventory Release Time]"`
  LINKs in: `Exportable Electronics A`, `Electronics Export Inventory Release Time`
- **A Electronics Operating Profit Proxy** (VARIABLE)
  `value = "[A Electronics Production Rate] * ([A Electronics Domestic Offer Price] - [A Electronics Unit Cost]) - [A Electronics Active Factory Capacity] * [Electronics Active Fixed Cost per Capacity] - [A Electronics Inactive Factory Capacity] * [Electronics Inactive Holding Cost per Capacity]"`
  _Planning proxy only, not yet a firm accounting statement. It provides a sector-specific financing ceiling until firms/finance are introduced later._
  LINKs in: `A Electronics Production Rate`, `A Electronics Domestic Offer Price`, `A Electronics Unit Cost`, `A Electronics Active Factory Capacity`, `Electronics Active Fixed Cost per Capacity`, `A Electronics Inactive Factory Capacity`, `Electronics Inactive Holding Cost per Capacity`
- **A Electronics Production** (FLOW | from: ∅ → to: A Electronics Inventory)
  `value = "[A Electronics Production Rate]"`
  LINKs in: `A Electronics Production Rate`
- **A Electronics Production Rate** (VARIABLE)
  `value = "[A Pre Energy Electronics Production Rate] * [A Electronics Energy Fulfillment Ratio]"`
  _Actual A electronics production after factory/feedstock limits and shared-energy allocation._
  LINKs in: `A Positive Desired Electronics Production Rate`, `A Electronics Factory Capacity`, `A Electronics Feedstock Inventory`, `A Electronics Feedstock Buffer`, `A Electronics Energy Fulfillment Ratio`, `A Pre Energy Electronics Production Rate`
- **A Electronics Realized Import Share from B** (VARIABLE)
  `value = "[A Electronics Import Supply Signal] / ([A Electronics Import Supply Signal] + [A Electronics Domestic Supply Signal] + 0.001)"`
  LINKs in: `A Electronics Import Supply Signal`, `A Electronics Domestic Supply Signal`
- **A Electronics Reference Price** (VARIABLE)
  `value = 28`
  LINKs in: —
- **A Electronics Relative Advantage from B** (VARIABLE)
  `value = "[Electronics Positive Trade Gap B to A] / ([A Electronics Domestic Offer Price] + 0.001)"`
  LINKs in: `Electronics Positive Trade Gap B to A`, `A Electronics Domestic Offer Price`
- **A Electronics Requested Energy** (VARIABLE)
  `value = "[A Pre Energy Electronics Production Rate] * [A Electronics Energy per Unit]"`
  LINKs in: `A Pre Energy Electronics Production Rate`, `A Electronics Energy per Unit`
- **A Electronics Required Active Factory Capacity** (VARIABLE)
  `value = "(([A Electronics Capacity Planning Signal] * [Electronics Capacity Planning Factor]) + ([Electronics Minimum Active Factory Capacity]) + (((([A Electronics Capacity Planning Signal] * [Electronics Capacity Planning Factor]) - ([Electronics Minimum Active Factory Capacity])) ^ 2) ^ 0.5)) / 2"`
  _A sector-specific capacity policy: smoothed desired production mapped to the soft-cap semantics, with a minimum active line._
  LINKs in: `A Electronics Capacity Planning Signal`, `Electronics Capacity Planning Factor`, `Electronics Minimum Active Factory Capacity`
- **A Electronics Retired Factory Capacity** (STOCK)
  `initial_value = 0`
  _Cumulative permanently retired electronics capacity in A._
  LINKs in: —
- **A Electronics Scarcity Strength** (VARIABLE)
  `value = 1.5`
  LINKs in: —
- **A Electronics Shortage** (VARIABLE)
  `value = "(([A Electronics Target Inventory] - [A Electronics Inventory]) + ((([A Electronics Target Inventory] - [A Electronics Inventory]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Electronics Target Inventory`, `A Electronics Inventory`
- **A Electronics Strategic Reserve Capacity** (VARIABLE)
  `value = "(([A Electronics Inactive After Activation Queue]) + ([A Electronics Strategic Reserve Target]) - (((([A Electronics Inactive After Activation Queue]) - ([A Electronics Strategic Reserve Target])) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Electronics Inactive After Activation Queue`, `A Electronics Strategic Reserve Target`
- **A Electronics Strategic Reserve Target** (VARIABLE)
  `value = "[A Electronics Installed Factory Capacity] * [Electronics Strategic Reserve Fraction]"`
  LINKs in: `A Electronics Installed Factory Capacity`, `Electronics Strategic Reserve Fraction`
- **A Electronics Surplus Factory Capacity** (VARIABLE)
  `value = "(([A Electronics Inactive After Activation Queue] - [A Electronics Strategic Reserve Capacity]) + ((([A Electronics Inactive After Activation Queue] - [A Electronics Strategic Reserve Capacity]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Electronics Inactive After Activation Queue`, `A Electronics Strategic Reserve Capacity`
- **A Electronics Target Active Factory Capacity** (VARIABLE)
  `value = "(([A Electronics Required Active Factory Capacity]) + ([A Electronics Installed Factory Capacity]) - (((([A Electronics Required Active Factory Capacity]) - ([A Electronics Installed Factory Capacity])) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Electronics Required Active Factory Capacity`, `A Electronics Installed Factory Capacity`
- **A Electronics Target Inventory** (VARIABLE)
  `value = 500`
  LINKs in: —
- **A Electronics Unit Cost** (VARIABLE)
  `value = "[A Feedstock per Electronics] * [A Electronics Feedstock Price] + [A Electronics Energy per Unit] * [A Energy Price] + [A Electronics Labor per Unit] * [A Wage]"`
  LINKs in: `A Feedstock per Electronics`, `A Electronics Feedstock Price`, `A Electronics Energy per Unit`, `A Energy Price`, `A Electronics Labor per Unit`, `A Wage`
- **A Feedstock per Electronics** (VARIABLE)
  `value = 1`
  LINKs in: —
- **A Positive Desired Electronics Feedstock Extraction Rate** (VARIABLE)
  `value = "(([A Desired Electronics Feedstock Extraction Rate]) + ((([A Desired Electronics Feedstock Extraction Rate]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Desired Electronics Feedstock Extraction Rate`
- **A Positive Desired Electronics Production Rate** (VARIABLE)
  `value = "(([A Desired Electronics Production Rate]) + ((([A Desired Electronics Production Rate]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Desired Electronics Production Rate`
- **A Pre Energy Electronics Production Rate** (VARIABLE)
  `value = "[A Positive Desired Electronics Production Rate] / (1 + ([A Positive Desired Electronics Production Rate] / ([A Electronics Factory Capacity] + 0.001)) ^ 8) ^ 0.125 * [A Electronics Feedstock Inventory] / ([A Electronics Feedstock Inventory] + [A Electronics Feedstock Buffer])"`
  _Electronics production requested after factory/feedstock constraints but before shared-energy rationing._
  LINKs in: `A Positive Desired Electronics Production Rate`, `A Electronics Factory Capacity`, `A Electronics Feedstock Inventory`, `A Electronics Feedstock Buffer`

## 3. Сектор Metal колонии A — цепочка добыча → плавка → запас → продажи (B зеркален)

- **A Mining Capacity** (VARIABLE)
  `value = 70`
  LINKs in: —
- **A Mining Rate** (VARIABLE)
  `value = "[A Positive Desired Mining Rate] / (1 + ([A Positive Desired Mining Rate] / ([A Mining Capacity] + 0.001)) ^ 8) ^ 0.125"`
  LINKs in: `A Positive Desired Mining Rate`, `A Mining Capacity`
- **A Positive Desired Mining Rate** (VARIABLE)
  `value = "([A Desired Mining Rate] + (([A Desired Mining Rate] ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Desired Mining Rate`
- **A Desired Mining Rate** (VARIABLE)
  `value = "[A Ore Consumption Rate] + ([A Ore Target Inventory] - [A Ore Inventory]) / [A Ore Adjustment Time]"`
  LINKs in: `A Ore Consumption Rate`, `A Ore Target Inventory`, `A Ore Inventory`, `A Ore Adjustment Time`
- **A Mining** (FLOW | from: ∅ → to: A Ore Inventory)
  `value = "[A Mining Rate]"`
  LINKs in: `A Mining Rate`
- **A Ore Inventory** (STOCK)
  `initial_value = 2500`
  LINKs in: —
- **A Ore Consumption** (FLOW | from: A Ore Inventory → to: ∅)
  `value = "[A Ore Consumption Rate]"`
  LINKs in: `A Ore Consumption Rate`
- **A Ore Price** (VARIABLE)
  `value = "[A Effective Ore Base Cost] * (1 + [A Ore Scarcity Strength] * [A Ore Shortage] / [A Ore Target Inventory])"`
  LINKs in: `A Ore Base Cost`, `A Ore Scarcity Strength`, `A Ore Shortage`, `A Ore Target Inventory`, `A Effective Ore Base Cost`
- **A Ore Base Cost** (VARIABLE)
  `value = 4`
  LINKs in: —
- **A Effective Ore Base Cost** (VARIABLE)
  `value = "IfThenElse([Test 4 Reverse Advantage Active] = 1, [Reverse A Ore Base Cost], [A Ore Base Cost])"`
  LINKs in: `Test 4 Reverse Advantage Active`, `Reverse A Ore Base Cost`, `A Ore Base Cost`
- **A Ore per Metal** (VARIABLE)
  `value = 1.4`
  LINKs in: —
- **A Smelting Rate** (VARIABLE)
  `value = "[A Pre Energy Smelting Rate] * [A Metal Energy Fulfillment Ratio]"`
  _Actual A metal production after refinery/ore limits and shared-energy allocation._
  LINKs in: `A Positive Desired Smelting Rate`, `A Refinery Installed Capacity`, `A Ore Inventory`, `A Ore Buffer`, `A Refinery Active Capacity`, `A Metal Energy Fulfillment Ratio`, `A Pre Energy Smelting Rate`
- **A Desired Smelting Rate** (VARIABLE)
  `value = "[A Local Sales] + [Shipment Rate A to B] - [Shipment Rate B to A] + ([A Metal Target Inventory] - [A Metal Inventory]) / [A Metal Adjustment Time]"`
  _Local sales + export orders - known import orders + inventory correction._
  LINKs in: `A Local Sales`, `A Metal Target Inventory`, `A Metal Inventory`, `A Metal Adjustment Time`, `Shipment Rate A to B`, `Shipment Rate B to A`
- **A Positive Desired Smelting Rate** (VARIABLE)
  `value = "([A Desired Smelting Rate] + (([A Desired Smelting Rate] ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Desired Smelting Rate`
- **A Metal Production** (FLOW | from: ∅ → to: A Metal Inventory)
  `value = "[A Smelting Rate]"`
  LINKs in: `A Smelting Rate`
- **A Metal Inventory** (STOCK)
  `initial_value = 500`
  LINKs in: —
- **A Metal Target Inventory** (VARIABLE)
  `value = 500`
  LINKs in: —
- **A Metal Adjustment Time** (VARIABLE)
  `value = 30`
  LINKs in: —
- **A Metal Buffer** (VARIABLE)
  `value = 10`
  LINKs in: —
- **A Metal Shortage** (VARIABLE)
  `value = "([A Metal Target Inventory] - [A Metal Inventory] + ((([A Metal Target Inventory] - [A Metal Inventory]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Metal Target Inventory`, `A Metal Inventory`
- **A Metal Unit Cost** (VARIABLE)
  `value = "[A Ore per Metal] * [A Ore Price] + [A Energy per Metal] * [A Effective Energy Price] + [A Labor per Metal] * [A Wage]"`
  LINKs in: `A Ore per Metal`, `A Ore Price`, `A Energy per Metal`, `A Energy Price`, `A Labor per Metal`, `A Wage`, `A Effective Energy Price`
- **A Domestic Offer Price** (VARIABLE)
  `value = "[A Metal Unit Cost] * (1 + [A Base Markup] + [A Metal Scarcity Strength] * [A Metal Shortage] / [A Metal Target Inventory])"`
  _Local producer offer price in A. This is not necessarily the buyer-facing price when imports exist._
  LINKs in: `A Metal Unit Cost`, `A Base Markup`, `A Metal Scarcity Strength`, `A Metal Shortage`, `A Metal Target Inventory`
- **A Market Price** (VARIABLE)
  `value = "(1 - [A Realized Import Share from B]) * [A Domestic Offer Price] + [A Realized Import Share from B] * [Delivered Metal Contract Unit Price B to A]"`
  _Buyer-facing A metal price. Domestic share uses current domestic offer; realized imported share uses the locked weighted-average contract price of cargo actually arriving from B._
  LINKs in: `A Desired Import Share from B`, `A Domestic Offer Price`, `Landed B Price in A`, `A Realized Import Share from B`, `Delivered Metal Contract Unit Price B to A`
- **A Reference Metal Price** (VARIABLE)
  `value = 40`
  LINKs in: —
- **A Local Base Demand** (VARIABLE)
  `value = 16`
  _Local industrial metal demand at the reference price._
  LINKs in: —
- **A Local Demand** (VARIABLE)
  `value = "[A Effective Local Base Demand] * ([A Reference Metal Price] / [A Market Price]) ^ [A Demand Elasticity]"`
  _Total buyer demand in A at A Market Price._
  LINKs in: `A Local Base Demand`, `A Reference Metal Price`, `A Domestic Offer Price`, `A Demand Elasticity`, `A Market Price`, `A Effective Local Base Demand`
- **A Demand Elasticity** (VARIABLE)
  `value = 0.6`
  LINKs in: —
- **A Local Sales** (VARIABLE)
  `value = "[A Local Demand] * [A Metal Inventory] / ([A Metal Inventory] + [A Metal Buffer])"`
  LINKs in: `A Local Demand`, `A Metal Inventory`, `A Metal Buffer`
- **A Local Consumption** (FLOW | from: A Metal Inventory → to: ∅)
  `value = "[A Local Sales]"`
  LINKs in: `A Local Sales`
- **A Realized Import Share from B** (VARIABLE)
  `value = "[A Import Supply Signal] / ([A Import Supply Signal] + [A Domestic Supply Signal] + 0.001)"`
  _Physically realized import share in A, based on recent delivered imports relative to recent domestic production._
  LINKs in: `A Import Supply Signal`, `A Domestic Supply Signal`
- **Exportable Metal A** (VARIABLE)
  `value = "([A Metal Inventory] - [Export Reserve] + ((([A Metal Inventory] - [Export Reserve]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Metal Inventory`, `Export Reserve`
- **Export Reserve** (VARIABLE)
  `value = 100`
  _Inventory exporters try not to sell below._
  LINKs in: —
- **Shipment Rate A to B** (VARIABLE)
  `value = "IfThenElse([Transport Scarcity Active] = 1, [Priority Allocated Load Metal A to B], [Requested Shipment A to B] / ([Total Requested Transport Load] + 0.001) * [Capacity Limited Total Transport Load])"`
  LINKs in: `Desired Shipment A to B`, `Requested Shipment A to B`, `Total Requested Transport Load`, `Capacity Limited Total Transport Load`, `Transport Scarcity Active`, `Priority Allocated Load Metal A to B`
- **Shipment Rate B to A** (VARIABLE)
  `value = "IfThenElse([Transport Scarcity Active] = 1, [Priority Allocated Load Metal B to A], [Requested Shipment B to A] / ([Total Requested Transport Load] + 0.001) * [Capacity Limited Total Transport Load])"`
  LINKs in: `Desired Shipment B to A`, `Requested Shipment B to A`, `Total Requested Transport Load`, `Capacity Limited Total Transport Load`, `Transport Scarcity Active`, `Priority Allocated Load Metal B to A`
- **A Energy per Metal** (VARIABLE)
  `value = 30`
  LINKs in: —
- **A Labor per Metal** (VARIABLE)
  `value = 0.1`
  LINKs in: —
- **A Wage** (VARIABLE)
  `value = 100`
  LINKs in: —
- **A Effective Energy Price** (VARIABLE)
  `value = "IfThenElse([Test 4 Reverse Advantage Active] = 1, [Reverse A Energy Price], [A Energy Price])"`
  LINKs in: `Test 4 Reverse Advantage Active`, `Reverse A Energy Price`, `A Energy Price`
- **A Energy Price** (VARIABLE)
  `value = "[A Effective Power Generation Cost] * (1 + [Energy Scarcity Price Strength] * [A Perceived Energy Scarcity Ratio])"`
  _Endogenous buyer/industrial energy price in A: generation cost plus scarcity premium from the short demand signal._
  LINKs in: `Energy Scarcity Price Strength`, `A Effective Power Generation Cost`, `A Perceived Energy Scarcity Ratio`

## 4. Энергетический интерфейс (только для чтения; v7.4 не меняет)

- **A Electronics Requested Energy** (VARIABLE)
  `value = "[A Pre Energy Electronics Production Rate] * [A Electronics Energy per Unit]"`
- **A Electronics Allocated Energy** (VARIABLE)
  `value = "[A Electronics Requested Energy] * [A Energy Fulfillment Ratio]"`
- **A Electronics Energy Fulfillment Ratio** (VARIABLE)
  `value = "IfThenElse([A Electronics Requested Energy] > 0.001, [A Electronics Allocated Energy] / [A Electronics Requested Energy], 1)"`
- **A Energy Fulfillment Ratio** (VARIABLE)
  `value = "IfThenElse([A Total Requested Energy] > [A Power Active Generation Capacity], [A Power Active Generation Capacity] / ([A Total Requested Energy] + 0.001), 1)"`
  _Common proportional physical fulfillment factor under energy scarcity._
- **A Energy Unserved Demand** (VARIABLE)
  `value = "[A Total Requested Energy] - [A Energy Supply]"`
- **A Total Requested Energy** (VARIABLE)
  `value = "[A Metal Requested Energy] + [A Electronics Requested Energy]"`
  _Total instantaneous industrial energy requested by Metal and Electronics in A._

## 5. Refinery A — элементы kernel, на которые ссылается test plan (только для чтения)

- **A Refinery Expansion** (FLOW | from: ∅ → to: A Refinery Installed Capacity)
  `value = "(([A Refinery Gap Limited Construction]) + ([A Refinery Finance Limited Construction]) - (((([A Refinery Gap Limited Construction]) - ([A Refinery Finance Limited Construction])) ^ 2) ^ 0.5)) / 2"`
  _New installed refinery construction. Requires an explicit installed-capacity shortage; positive profit only determines how quickly the shortage can be financed._
- **A Refinery Installed Capacity** (STOCK)
  `initial_value = 35`
  _Physical installed metal-production capacity in A. Changes slowly through construction, permanent retirement and depreciation._
- **A Refinery Active Capacity** (STOCK)
  `initial_value = 35`
  _Operational refinery capacity currently available for production in A._
- **A Refinery Required Active Capacity** (VARIABLE)
  `value = "[A Positive Desired Smelting Rate] * [Refinery Operating Reserve Factor]"`
  _Unbounded active refinery capacity required in A to serve planned production with the operating reserve. Unlike Target Active Capacity, this can exceed current installed capacity._
- **A Refinery Desired Installed Capacity** (VARIABLE)
  `value = "[A Refinery Required Active Capacity] * [Refinery Installed Reserve Factor]"`
  _Long-run installed refinery capacity desired in A. Includes a strategic installed reserve above the active operating requirement._
- **A Power Generation Expansion** (FLOW | from: ∅ → to: A Power Installed Generation Capital)
  `value = "[Capital Lifecycle Enabled] * [A Power Gap Limited Construction]"`
- **A Power Installed Generation Capital** (STOCK)
  `initial_value = 1350`
  _Physical installed firm generation capital in A. v7.3 construction, depreciation and permanent retirement act on this stock._

## 6. Сценарии (Modes) — полный список

| Mode | Имя | values |
|---:|---|---|
| 0 | Baseline Control | `{"Timed Test Mode":0,"Capital Lifecycle Enabled":0}` |
| 1 | Timed B Reactivation | `{"Timed Test Mode":1,"Capital Lifecycle Enabled":0}` |
| 2 | Timed Transport Demand Surge | `{"Timed Test Mode":2,"Capital Lifecycle Enabled":0}` |
| 3 | Timed Low Demand Rationalization | `{"Timed Test Mode":3,"Capital Lifecycle Enabled":0}` |
| 4 | Timed Reverse Advantage | `{"Timed Test Mode":4,"Capital Lifecycle Enabled":0}` |
| 5 | Timed Electronics Demand Surge | `{"Timed Test Mode":5,"Capital Lifecycle Enabled":0}` |
| 6 | Timed Reverse Electronics Advantage | `{"Timed Test Mode":6,"Capital Lifecycle Enabled":0}` |
| 7 | Timed Two-Good Transport Surge | `{"Timed Test Mode":7,"Capital Lifecycle Enabled":0}` |
| 8 | Timed Metal Priority Scarcity | `{"Timed Test Mode":8,"Capital Lifecycle Enabled":0}` |
| 9 | v7.2 Simultaneous Two-Industry Energy Shortage | `{"Timed Test Mode":9,"Capital Lifecycle Enabled":0}` |
| 10 | v7.2 Cheap-Energy Comparative Advantage | `{"Timed Test Mode":10,"Capital Lifecycle Enabled":0}` |
| 11 | v7.2 Generation Capacity Shock Recovery | `{"Timed Test Mode":11,"Capital Lifecycle Enabled":0}` |
| 12 | v7.3 Lifecycle Baseline | `{"Timed Test Mode":12,"Capital Lifecycle Enabled":1}` |
| 13 | v7.3 Temporary Electronics Reactivation | `{"Timed Test Mode":13,"Capital Lifecycle Enabled":1}` |
| 14 | v7.3 Sustained Electronics Growth | `{"Timed Test Mode":14,"Capital Lifecycle Enabled":1}` |
| 15 | v7.3 Electronics Collapse and Recovery | `{"Timed Test Mode":15,"Capital Lifecycle Enabled":1}` |
| 16 | v7.3 Sustained Metal Driven Power Growth | `{"Timed Test Mode":16,"Capital Lifecycle Enabled":1}` |

Описания сценариев 12–16 (образец стиля для 17–20):

- **Mode 12 — v7.3 Lifecycle Baseline**: No exogenous shock. Electronics and Energy capital lifecycle enabled. This is the new normal-operation baseline: one-time rationalization from inherited fixed-capacity initial conditions is allowed, but the system must settle without self-excited construction/mothball cycles; commodity/trade directions must remain economically coherent.
- **Mode 13 — v7.3 Temporary Electronics Reactivation**: Lifecycle enabled. A electronics local base demand doubles from day 360 to 720. A should use mothballed installed factory capital first; construction may occur only if the retained installed reserve is insufficient. After day 720 demand returns and excess active factory/power capacity should mothball rather than disappear instantly.
- **Mode 14 — v7.3 Sustained Electronics Growth**: Lifecycle enabled. A electronics local base demand rises 4x permanently from day 360. Existing inactive factory capacity should reactivate first; persistent structural shortage should then construct new Electronics installed capacity. Higher electronics output should also induce endogenous A generation-capital expansion after the longer power planning/construction delay.
- **Mode 15 — v7.3 Electronics Collapse and Recovery**: Lifecycle enabled. B electronics local demand falls to 35% from day 360 to 720, then recovers. B factory active capacity and generation active capital should mothball during the collapse and reactivate on recovery; permanent retirement should be much slower than operational mothballing.
- **Mode 16 — v7.3 Sustained Metal Driven Power Growth**: Lifecycle enabled. B metal demand doubles permanently from day 360. Existing refinery/transport mechanisms respond as before; the resulting sustained industrial load should propagate into A power planning and new installed generation construction, demonstrating that Energy capital responds to demand from another sector rather than only Electronics.

## 7. Схема ModelJSON (то, что нужно для патча)

- Верхний уровень: `engine`, `name`, `description`, `simulation` (RK1, 0…1080, dt 0.25), `elements[]`, `visualizations`, `scenarios[]`.
- Элемент: `{ "type": "VARIABLE"|"STOCK"|"FLOW"|"LINK", "name", "behavior": {...}, "display": {...}, "description"? }`.
  - VARIABLE / FLOW: `behavior.value` — число или строка-формула; FLOW дополнительно `from`, `to` (имена STOCK или `null`) и обычно `non_negative: true`.
  - STOCK: `behavior.initial_value` (число или формула), `non_negative`.
  - LINK: `{ "type": "LINK", "from": "<имя>", "to": "<имя>" }` — обязателен для каждой ссылки `[X]` в формуле элемента (кроме FLOW↔его STOCK).
- Адресация только по имени; `id` нет. Имена уникальны, регистр при ссылках не важен.
- Сценарий: `{ "name", "description", "values": { "<имя элемента>": число } }`; `Timed Test Mode` — обязательный идентификатор Mode. Для VARIABLE значение подменяет `behavior.value`, для STOCK — `initial_value`.
- Статистика v7.3 r2: 827 примитивов (645 VARIABLE, 63 STOCK, 119 FLOW), 1500 LINK, 17 сценариев.
- Формат патча, который принимает стенд: `baseline/lab/docs/MODEL_PATCH_RU.md`. Справочник языка формул движка: `reference/simulation-equations.md`.
