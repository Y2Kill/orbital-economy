# Задача 003 (v7.5) — рабочий контекст: дословные формулы и LINK (accepted v7.4.1 r1)

Сгенерировано из модели. Формулы expansion — это будущие `X <Sector> Desired Expansion` (дословно). Цепочки спроса и тестовая обвязка уже симметризованы (v7.4.1): образец флагов применимости — `X Test 19 Electronics Demand Applies`, `X Effective Mining Capacity`.

- **A Refinery Expansion** (FLOW ∅ → A Refinery Installed Capacity)
  `value = "(([A Refinery Gap Limited Construction]) + ([A Refinery Finance Limited Construction]) - (((([A Refinery Gap Limited Construction]) - ([A Refinery Finance Limited Construction])) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Refinery Reinvestment Fraction`, `A Refinery Profit`, `A Refinery Capital Cost per Capacity`, `A Refinery Utilization`, `A Expansion Utilization Power`, `A Positive Refinery Profit`, `A Refinery Active Share of Installed`, `A Refinery Gap Limited Construction`, `A Refinery Finance Limited Construction`
- **A Refinery Gap Limited Construction** (VARIABLE)
  `value = "[A Refinery Installed Capacity Shortage] / [Refinery Construction Time]"`
  LINKs in: `A Refinery Installed Capacity Shortage`, `Refinery Construction Time`
- **A Refinery Finance Limited Construction** (VARIABLE)
  `value = "[A Refinery Reinvestment Fraction] * [A Positive Refinery Profit] / [A Refinery Capital Cost per Capacity]"`
  LINKs in: `A Refinery Reinvestment Fraction`, `A Positive Refinery Profit`, `A Refinery Capital Cost per Capacity`
- **A Refinery Installed Capacity Shortage** (VARIABLE)
  `value = "(([A Refinery Desired Installed Capacity] - [A Refinery Installed Capacity]) + ((([A Refinery Desired Installed Capacity] - [A Refinery Installed Capacity]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `A Refinery Desired Installed Capacity`, `A Refinery Installed Capacity`
- **A Refinery Installed Capacity** (STOCK)
  `initial_value = 35`
  LINKs in: —
- **A Electronics Factory Expansion** (FLOW ∅ → A Electronics Installed Factory Capacity)
  `value = "[Capital Lifecycle Enabled] * (([A Electronics Gap Limited Construction]) + ([A Electronics Finance Limited Construction]) - (((([A Electronics Gap Limited Construction]) - ([A Electronics Finance Limited Construction])) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `Capital Lifecycle Enabled`, `A Electronics Gap Limited Construction`, `A Electronics Finance Limited Construction`
- **A Electronics Gap Limited Construction** (VARIABLE)
  `value = "[A Electronics Installed Factory Shortage] / [Electronics Construction Time]"`
  LINKs in: `A Electronics Installed Factory Shortage`, `Electronics Construction Time`
- **A Electronics Finance Limited Construction** (VARIABLE)
  `value = "[Electronics Reinvestment Fraction] * [A Positive Electronics Operating Profit Proxy] / [Electronics Capital Cost per Capacity]"`
  LINKs in: `Electronics Reinvestment Fraction`, `A Positive Electronics Operating Profit Proxy`, `Electronics Capital Cost per Capacity`
- **A Electronics Installed Factory Capacity** (STOCK)
  `initial_value = 45`
  LINKs in: —
- **A Power Generation Expansion** (FLOW ∅ → A Power Installed Generation Capital)
  `value = "[Capital Lifecycle Enabled] * [A Power Gap Limited Construction]"`
  LINKs in: `Capital Lifecycle Enabled`, `A Power Gap Limited Construction`
- **A Power Gap Limited Construction** (VARIABLE)
  `value = "[A Power Installed Generation Shortage] / [Power Construction Time]"`
  LINKs in: `A Power Installed Generation Shortage`, `Power Construction Time`
- **A Power Installed Generation Capital** (STOCK)
  `initial_value = 1350`
  LINKs in: —
- **A Metal Inventory** (STOCK)
  `initial_value = 500`
  LINKs in: —
- **A Metal Buffer** (VARIABLE)
  `value = 10`
  LINKs in: —
- **A Electronics Inventory** (STOCK)
  `initial_value = 500`
  LINKs in: —
- **A Electronics Buffer** (VARIABLE)
  `value = 10`
  LINKs in: —
- **A Refinery Capital Cost per Capacity** (VARIABLE)
  `value = 900`
  LINKs in: —
- **A Effective Electronics Local Base Demand** (VARIABLE)
  `value = "IfThenElse([Intermediate Inputs Enabled] = 1, IfThenElse([Test 19 Coupled Electronics Growth Active] = 1, [A Electronics Local Base Demand] * IfThenElse([A Test 19 Electronics Demand Applies] = 1, [v7.4 Coupled Electronics Growth Multiplier], 1), IfThenElse([Test 14 Sustained Electronics Growth Active] = 1, [A Electronics Local Base Demand] * IfThenElse([A Test 14 Electronics Demand Applies] = 1, [v7.3 Sustained Electronics Growth Multiplier], 1), IfThenElse([Test 13 Temporary Electronics Lifecycle Surge Active] = 1, [A Electronics Local Base Demand] * IfThenElse([A Test 13 Electronics Demand Applies] = 1, [v7.3 Temporary Electronics Demand Multiplier], 1), IfThenElse([Test 9 Two Industry Energy Stress Active] = 1, [A Electronics Local Base Demand] * IfThenElse([A Test 9 Electronics Demand Applies] = 1, [Two Industry Energy Stress Demand Multiplier], 1), IfThenElse([Test 8 Metal Priority Scarcity Active] = 1, [A Electronics Local Base Demand] * IfThenElse([A Test 8 Electronics Demand Applies] = 1, [Priority Stress Demand Multiplier], 1), IfThenElse([Test 5 Electronics Demand Surge Active] = 1, [A Electronics Local Base Demand] * IfThenElse([A Test 5 Electronics Demand Applies] = 1, [Electronics Demand Surge Multiplier], 1), IfThenElse([Test 7 Two Good Transport Surge Active] = 1, [A Electronics Local Base Demand] * IfThenElse([A Test 7 Electronics Demand Applies] = 1, [Two Good Demand Surge Multiplier], 1), IfThenElse([Test 15 Electronics Collapse Recovery Active] = 1, [A Electronics Local Base Demand] * IfThenElse([A Test 15 Electronics Demand Applies] = 1, [v7.3 Electronics Demand Collapse Multiplier], 1), [A Electronics Local Base Demand])))))))), IfThenElse([Test 14 Sustained Electronics Growth Active] = 1, [A Electronics Local Base Demand] * IfThenElse([A Test 14 Electronics Demand Applies] = 1, [v7.3 Sustained Electronics Growth Multiplier], 1), IfThenElse([Test 13 Temporary Electronics Lifecycle Surge Active] = 1, [A Electronics Local Base Demand] * IfThenElse([A Test 13 Electronics Demand Applies] = 1, [v7.3 Temporary Electronics Demand Multiplier], 1), IfThenElse([Test 9 Two Industry Energy Stress Active] = 1, [A Electronics Local Base Demand] * IfThenElse([A Test 9 Electronics Demand Applies] = 1, [Two Industry Energy Stress Demand Multiplier], 1), IfThenElse([Test 8 Metal Priority Scarcity Active] = 1, [A Electronics Local Base Demand] * IfThenElse([A Test 8 Electronics Demand Applies] = 1, [Priority Stress Demand Multiplier], 1), IfThenElse([Test 5 Electronics Demand Surge Active] = 1, [A Electronics Local Base Demand] * IfThenElse([A Test 5 Electronics Demand Applies] = 1, [Electronics Demand Surge Multiplier], 1), IfThenElse([Test 7 Two Good Transport Surge Active] = 1, [A Electronics Local Base Demand] * IfThenElse([A Test 7 Electronics Demand Applies] = 1, [Two Good Demand Surge Multiplier], 1), IfThenElse([Test 15 Electronics Collapse Recovery Active] = 1, [A Electronics Local Base Demand] * IfThenElse([A Test 15 Electronics Demand Applies] = 1, [v7.3 Electronics Demand Collapse Multiplier], 1), [A Electronics Local Base Demand]))))))))"`
  LINKs in: `Test 5 Electronics Demand Surge Active`, `A Electronics Local Base Demand`, `Electronics Demand Surge Multiplier`, `Test 7 Two Good Transport Surge Active`, `Two Good Demand Surge Multiplier`, `Test 8 Metal Priority Scarcity Active`, `Priority Stress Demand Multiplier`, `Test 9 Two Industry Energy Stress Active`, `Two Industry Energy Stress Demand Multiplier`, `Test 14 Sustained Electronics Growth Active`, `v7.3 Sustained Electronics Growth Multiplier`, `Test 13 Temporary Electronics Lifecycle Surge Active`, `v7.3 Temporary Electronics Demand Multiplier`, `Intermediate Inputs Enabled`, `Test 19 Coupled Electronics Growth Active`, `v7.4 Coupled Electronics Growth Multiplier`, `A Test 19 Electronics Demand Applies`, `A Test 14 Electronics Demand Applies`, `A Test 13 Electronics Demand Applies`, `A Test 9 Electronics Demand Applies`, `A Test 8 Electronics Demand Applies`, `A Test 5 Electronics Demand Applies`, `A Test 7 Electronics Demand Applies`, `Test 15 Electronics Collapse Recovery Active`, `A Test 15 Electronics Demand Applies`, `v7.3 Electronics Demand Collapse Multiplier`
- **A Test 19 Electronics Demand Applies** (VARIABLE)
  `value = 1`
  LINKs in: —
- **A Effective Mining Capacity** (VARIABLE)
  `value = "IfThenElse([Intermediate Inputs Enabled] = 1, IfThenElse([Test 18 Metal Supply Shock Active] = 1, [A Mining Capacity] * IfThenElse([A Test 18 Mining Shock Applies] = 1, [v7.4 Metal Supply Shock Multiplier], 1), IfThenElse([Test 4 Reverse Advantage Active] = 1, [Reverse A Mining Capacity], [A Mining Capacity])), IfThenElse([Test 4 Reverse Advantage Active] = 1, [Reverse A Mining Capacity], [A Mining Capacity]))"`
  LINKs in: `A Mining Capacity`, `Intermediate Inputs Enabled`, `Test 18 Metal Supply Shock Active`, `v7.4 Metal Supply Shock Multiplier`, `A Test 18 Mining Shock Applies`, `Test 4 Reverse Advantage Active`, `Reverse A Mining Capacity`
- **B Refinery Expansion** (FLOW ∅ → B Refinery Installed Capacity)
  `value = "(([B Refinery Gap Limited Construction]) + ([B Refinery Finance Limited Construction]) - (((([B Refinery Gap Limited Construction]) - ([B Refinery Finance Limited Construction])) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `B Refinery Reinvestment Fraction`, `B Refinery Profit`, `B Refinery Capital Cost per Capacity`, `B Refinery Utilization`, `B Expansion Utilization Power`, `B Positive Refinery Profit`, `B Refinery Active Share of Installed`, `B Refinery Gap Limited Construction`, `B Refinery Finance Limited Construction`
- **B Refinery Gap Limited Construction** (VARIABLE)
  `value = "[B Refinery Installed Capacity Shortage] / [Refinery Construction Time]"`
  LINKs in: `B Refinery Installed Capacity Shortage`, `Refinery Construction Time`
- **B Refinery Finance Limited Construction** (VARIABLE)
  `value = "[B Refinery Reinvestment Fraction] * [B Positive Refinery Profit] / [B Refinery Capital Cost per Capacity]"`
  LINKs in: `B Refinery Reinvestment Fraction`, `B Positive Refinery Profit`, `B Refinery Capital Cost per Capacity`
- **B Refinery Installed Capacity Shortage** (VARIABLE)
  `value = "(([B Refinery Desired Installed Capacity] - [B Refinery Installed Capacity]) + ((([B Refinery Desired Installed Capacity] - [B Refinery Installed Capacity]) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `B Refinery Desired Installed Capacity`, `B Refinery Installed Capacity`
- **B Refinery Installed Capacity** (STOCK)
  `initial_value = 28`
  LINKs in: —
- **B Electronics Factory Expansion** (FLOW ∅ → B Electronics Installed Factory Capacity)
  `value = "[Capital Lifecycle Enabled] * (([B Electronics Gap Limited Construction]) + ([B Electronics Finance Limited Construction]) - (((([B Electronics Gap Limited Construction]) - ([B Electronics Finance Limited Construction])) ^ 2) ^ 0.5)) / 2"`
  LINKs in: `Capital Lifecycle Enabled`, `B Electronics Gap Limited Construction`, `B Electronics Finance Limited Construction`
- **B Electronics Gap Limited Construction** (VARIABLE)
  `value = "[B Electronics Installed Factory Shortage] / [Electronics Construction Time]"`
  LINKs in: `B Electronics Installed Factory Shortage`, `Electronics Construction Time`
- **B Electronics Finance Limited Construction** (VARIABLE)
  `value = "[Electronics Reinvestment Fraction] * [B Positive Electronics Operating Profit Proxy] / [Electronics Capital Cost per Capacity]"`
  LINKs in: `Electronics Reinvestment Fraction`, `B Positive Electronics Operating Profit Proxy`, `Electronics Capital Cost per Capacity`
- **B Electronics Installed Factory Capacity** (STOCK)
  `initial_value = 45`
  LINKs in: —
- **B Power Generation Expansion** (FLOW ∅ → B Power Installed Generation Capital)
  `value = "[Capital Lifecycle Enabled] * [B Power Gap Limited Construction]"`
  LINKs in: `Capital Lifecycle Enabled`, `B Power Gap Limited Construction`
- **B Power Gap Limited Construction** (VARIABLE)
  `value = "[B Power Installed Generation Shortage] / [Power Construction Time]"`
  LINKs in: `B Power Installed Generation Shortage`, `Power Construction Time`
- **B Power Installed Generation Capital** (STOCK)
  `initial_value = 550`
  LINKs in: —
- **B Metal Inventory** (STOCK)
  `initial_value = 500`
  LINKs in: —
- **B Metal Buffer** (VARIABLE)
  `value = 10`
  LINKs in: —
- **B Electronics Inventory** (STOCK)
  `initial_value = 500`
  LINKs in: —
- **B Electronics Buffer** (VARIABLE)
  `value = 10`
  LINKs in: —
- **B Refinery Capital Cost per Capacity** (VARIABLE)
  `value = 900`
  LINKs in: —
- **B Effective Electronics Local Base Demand** (VARIABLE)
  `value = "IfThenElse([Intermediate Inputs Enabled] = 1, IfThenElse([Test 19 Coupled Electronics Growth Active] = 1, [B Electronics Local Base Demand] * IfThenElse([B Test 19 Electronics Demand Applies] = 1, [v7.4 Coupled Electronics Growth Multiplier], 1), IfThenElse([Test 14 Sustained Electronics Growth Active] = 1, [B Electronics Local Base Demand] * IfThenElse([B Test 14 Electronics Demand Applies] = 1, [v7.3 Sustained Electronics Growth Multiplier], 1), IfThenElse([Test 13 Temporary Electronics Lifecycle Surge Active] = 1, [B Electronics Local Base Demand] * IfThenElse([B Test 13 Electronics Demand Applies] = 1, [v7.3 Temporary Electronics Demand Multiplier], 1), IfThenElse([Test 9 Two Industry Energy Stress Active] = 1, [B Electronics Local Base Demand] * IfThenElse([B Test 9 Electronics Demand Applies] = 1, [Two Industry Energy Stress Demand Multiplier], 1), IfThenElse([Test 8 Metal Priority Scarcity Active] = 1, [B Electronics Local Base Demand] * IfThenElse([B Test 8 Electronics Demand Applies] = 1, [Priority Stress Demand Multiplier], 1), IfThenElse([Test 5 Electronics Demand Surge Active] = 1, [B Electronics Local Base Demand] * IfThenElse([B Test 5 Electronics Demand Applies] = 1, [Electronics Demand Surge Multiplier], 1), IfThenElse([Test 7 Two Good Transport Surge Active] = 1, [B Electronics Local Base Demand] * IfThenElse([B Test 7 Electronics Demand Applies] = 1, [Two Good Demand Surge Multiplier], 1), IfThenElse([Test 15 Electronics Collapse Recovery Active] = 1, [B Electronics Local Base Demand] * IfThenElse([B Test 15 Electronics Demand Applies] = 1, [v7.3 Electronics Demand Collapse Multiplier], 1), [B Electronics Local Base Demand])))))))), IfThenElse([Test 14 Sustained Electronics Growth Active] = 1, [B Electronics Local Base Demand] * IfThenElse([B Test 14 Electronics Demand Applies] = 1, [v7.3 Sustained Electronics Growth Multiplier], 1), IfThenElse([Test 13 Temporary Electronics Lifecycle Surge Active] = 1, [B Electronics Local Base Demand] * IfThenElse([B Test 13 Electronics Demand Applies] = 1, [v7.3 Temporary Electronics Demand Multiplier], 1), IfThenElse([Test 9 Two Industry Energy Stress Active] = 1, [B Electronics Local Base Demand] * IfThenElse([B Test 9 Electronics Demand Applies] = 1, [Two Industry Energy Stress Demand Multiplier], 1), IfThenElse([Test 8 Metal Priority Scarcity Active] = 1, [B Electronics Local Base Demand] * IfThenElse([B Test 8 Electronics Demand Applies] = 1, [Priority Stress Demand Multiplier], 1), IfThenElse([Test 5 Electronics Demand Surge Active] = 1, [B Electronics Local Base Demand] * IfThenElse([B Test 5 Electronics Demand Applies] = 1, [Electronics Demand Surge Multiplier], 1), IfThenElse([Test 7 Two Good Transport Surge Active] = 1, [B Electronics Local Base Demand] * IfThenElse([B Test 7 Electronics Demand Applies] = 1, [Two Good Demand Surge Multiplier], 1), IfThenElse([Test 15 Electronics Collapse Recovery Active] = 1, [B Electronics Local Base Demand] * IfThenElse([B Test 15 Electronics Demand Applies] = 1, [v7.3 Electronics Demand Collapse Multiplier], 1), [B Electronics Local Base Demand]))))))))"`
  LINKs in: `B Electronics Local Base Demand`, `Test 15 Electronics Collapse Recovery Active`, `v7.3 Electronics Demand Collapse Multiplier`, `Intermediate Inputs Enabled`, `Test 19 Coupled Electronics Growth Active`, `B Test 19 Electronics Demand Applies`, `v7.4 Coupled Electronics Growth Multiplier`, `Test 14 Sustained Electronics Growth Active`, `B Test 14 Electronics Demand Applies`, `v7.3 Sustained Electronics Growth Multiplier`, `Test 13 Temporary Electronics Lifecycle Surge Active`, `B Test 13 Electronics Demand Applies`, `v7.3 Temporary Electronics Demand Multiplier`, `Test 9 Two Industry Energy Stress Active`, `B Test 9 Electronics Demand Applies`, `Two Industry Energy Stress Demand Multiplier`, `Test 8 Metal Priority Scarcity Active`, `B Test 8 Electronics Demand Applies`, `Priority Stress Demand Multiplier`, `Test 5 Electronics Demand Surge Active`, `B Test 5 Electronics Demand Applies`, `Electronics Demand Surge Multiplier`, `Test 7 Two Good Transport Surge Active`, `B Test 7 Electronics Demand Applies`, `Two Good Demand Surge Multiplier`, `B Test 15 Electronics Demand Applies`
- **B Test 19 Electronics Demand Applies** (VARIABLE)
  `value = 0`
  LINKs in: —
- **B Effective Mining Capacity** (VARIABLE)
  `value = "IfThenElse([Intermediate Inputs Enabled] = 1, IfThenElse([Test 18 Metal Supply Shock Active] = 1, [B Mining Capacity] * IfThenElse([B Test 18 Mining Shock Applies] = 1, [v7.4 Metal Supply Shock Multiplier], 1), IfThenElse([Test 4 Reverse Advantage Active] = 1, [Reverse B Mining Capacity], [B Mining Capacity])), IfThenElse([Test 4 Reverse Advantage Active] = 1, [Reverse B Mining Capacity], [B Mining Capacity]))"`
  LINKs in: `Test 4 Reverse Advantage Active`, `Reverse B Mining Capacity`, `B Mining Capacity`, `Intermediate Inputs Enabled`, `Test 18 Metal Supply Shock Active`, `B Test 18 Mining Shock Applies`, `v7.4 Metal Supply Shock Multiplier`
- **Electronics Capital Cost per Capacity** (VARIABLE)
  `value = 600`
  LINKs in: —
- **Transport Capital Cost per Capacity** (VARIABLE)
  `value = 150`
  LINKs in: —
- **Capital Lifecycle Enabled** (VARIABLE)
  `value = 1`
  LINKs in: —
- **Intermediate Inputs Enabled** (VARIABLE)
  `value = 1`
  LINKs in: —
- **Temporary Test Window** (VARIABLE)
  `value = "IfThenElse(Days() >= [Test Shock Start Day], IfThenElse(Days() < [Test Shock End Day], 1, 0), 0)"`
  LINKs in: `Test Shock Start Day`, `Test Shock End Day`
- **Reverse Advantage Window** (VARIABLE)
  `value = "IfThenElse(Days() >= [Test Shock Start Day], 1, 0)"`
  LINKs in: `Test Shock Start Day`
- **Test 19 Coupled Electronics Growth Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 19, [Reverse Advantage Window], 0)"`
  LINKs in: `Reverse Advantage Window`, `Timed Test Mode`
- **Test 18 Metal Supply Shock Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 18, [Temporary Test Window], 0)"`
  LINKs in: `Temporary Test Window`, `Timed Test Mode`
- **v7.4 Coupled Electronics Growth Multiplier** (VARIABLE)
  `value = 4`
  LINKs in: —
- **v7.4 Metal Supply Shock Multiplier** (VARIABLE)
  `value = 0.5`
  LINKs in: —
- **Timed Test Mode** (VARIABLE)
  `value = 0`
  LINKs in: —

## Сценарии

- Mode 0: Baseline Control — `{"Timed Test Mode":0,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}`
- Mode 1: Timed B Reactivation — `{"Timed Test Mode":1,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}`
- Mode 2: Timed Transport Demand Surge — `{"Timed Test Mode":2,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}`
- Mode 3: Timed Low Demand Rationalization — `{"Timed Test Mode":3,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}`
- Mode 4: Timed Reverse Advantage — `{"Timed Test Mode":4,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}`
- Mode 5: Timed Electronics Demand Surge — `{"Timed Test Mode":5,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}`
- Mode 6: Timed Reverse Electronics Advantage — `{"Timed Test Mode":6,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}`
- Mode 7: Timed Two-Good Transport Surge — `{"Timed Test Mode":7,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}`
- Mode 8: Timed Metal Priority Scarcity — `{"Timed Test Mode":8,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}`
- Mode 9: v7.2 Simultaneous Two-Industry Energy Shortage — `{"Timed Test Mode":9,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}`
- Mode 10: v7.2 Cheap-Energy Comparative Advantage — `{"Timed Test Mode":10,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}`
- Mode 11: v7.2 Generation Capacity Shock Recovery — `{"Timed Test Mode":11,"Capital Lifecycle Enabled":0,"Intermediate Inputs Enabled":0}`
- Mode 12: v7.3 Lifecycle Baseline — `{"Timed Test Mode":12,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":0}`
- Mode 13: v7.3 Temporary Electronics Reactivation — `{"Timed Test Mode":13,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":0}`
- Mode 14: v7.3 Sustained Electronics Growth — `{"Timed Test Mode":14,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":0}`
- Mode 15: v7.3 Electronics Collapse and Recovery — `{"Timed Test Mode":15,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":0}`
- Mode 16: v7.3 Sustained Metal Driven Power Growth — `{"Timed Test Mode":16,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":0}`
- Mode 17: v7.4 Intermediate Inputs Baseline — `{"Timed Test Mode":17,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":1}`
- Mode 18: v7.4 Temporary Metal Supply Shock — `{"Timed Test Mode":18,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":1}`
- Mode 19: v7.4 Sustained Electronics Growth with Input Coupling — `{"Timed Test Mode":19,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":1}`
- Mode 20: v7.4 Coupled Metal Demand Growth — `{"Timed Test Mode":20,"Capital Lifecycle Enabled":1,"Intermediate Inputs Enabled":1}`
