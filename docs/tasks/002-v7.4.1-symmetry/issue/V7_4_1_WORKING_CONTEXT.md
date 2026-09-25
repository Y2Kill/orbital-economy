# Задача 002 — рабочий контекст: дословные формулы и LINK затрагиваемых элементов (accepted v7.4 r2)

Сгенерировано из модели. Ссылка [X] без LINK — ошибка; у новых зеркальных цепочек добавляйте LINK от каждого тестового переключателя и множителя, которого не было на этой стороне (см. skeleton/).

- **A Effective Local Base Demand** (VARIABLE)
  `value = "[A Local Base Demand]"`
  LINKs in: `A Local Base Demand`
- **B Effective Local Base Demand** (VARIABLE)
  `value = "IfThenElse([Intermediate Inputs Enabled] = 1, IfThenElse([Test 20 Coupled Metal Demand Growth Active] = 1, [B Local Base Demand] * [v7.4 Coupled Metal Demand Growth Multiplier], IfThenElse([Test 16 Sustained Metal Energy Growth Active] = 1, [B Local Base Demand] * [v7.3 Sustained Metal Demand Growth Multiplier], IfThenElse([Test 9 Two Industry Energy Stress Active] = 1, [B Local Base Demand] * [Two Industry Energy Stress Demand Multiplier], IfThenElse([Test 8 Metal Priority Scarcity Active] = 1, [B Local Base Demand] * [Priority Stress Demand Multiplier], IfThenElse([Test 7 Two Good Transport Surge Active] = 1, [B Local Base Demand] * [Two Good Demand Surge Multiplier], IfThenElse([Test 2 Transport Surge Active] = 1, [B Local Base Demand] * [Transport Demand Surge Multiplier], IfThenElse([Test 3 Low Demand Active] = 1, [B Local Base Demand] * [Low Demand Multiplier], [B Local Base Demand]))))))), IfThenElse([Test 16 Sustained Metal Energy Growth Active] = 1, [B Local Base Demand] * [v7.3 Sustained Metal Demand Growth Multiplier], IfThenElse([Test 9 Two Industry Energy Stress Active] = 1, [B Local Base Demand] * [Two Industry Energy Stress Demand Multiplier], IfThenElse([Test 8 Metal Priority Scarcity Active] = 1, [B Local Base Demand] * [Priority Stress Demand Multiplier], IfThenElse([Test 7 Two Good Transport Surge Active] = 1, [B Local Base Demand] * [Two Good Demand Surge Multiplier], IfThenElse([Test 2 Transport Surge Active] = 1, [B Local Base Demand] * [Transport Demand Surge Multiplier], IfThenElse([Test 3 Low Demand Active] = 1, [B Local Base Demand] * [Low Demand Multiplier], [B Local Base Demand])))))))"`
  LINKs in: `Test 2 Transport Surge Active`, `B Local Base Demand`, `Transport Demand Surge Multiplier`, `Test 3 Low Demand Active`, `Low Demand Multiplier`, `Test 7 Two Good Transport Surge Active`, `Two Good Demand Surge Multiplier`, `Test 8 Metal Priority Scarcity Active`, `Priority Stress Demand Multiplier`, `Test 9 Two Industry Energy Stress Active`, `Two Industry Energy Stress Demand Multiplier`, `Test 16 Sustained Metal Energy Growth Active`, `v7.3 Sustained Metal Demand Growth Multiplier`, `Intermediate Inputs Enabled`, `Test 20 Coupled Metal Demand Growth Active`, `v7.4 Coupled Metal Demand Growth Multiplier`
- **A Effective Electronics Local Base Demand** (VARIABLE)
  `value = "IfThenElse([Intermediate Inputs Enabled] = 1, IfThenElse([Test 19 Coupled Electronics Growth Active] = 1, [A Electronics Local Base Demand] * [v7.4 Coupled Electronics Growth Multiplier], IfThenElse([Test 14 Sustained Electronics Growth Active] = 1, [A Electronics Local Base Demand] * [v7.3 Sustained Electronics Growth Multiplier], IfThenElse([Test 13 Temporary Electronics Lifecycle Surge Active] = 1, [A Electronics Local Base Demand] * [v7.3 Temporary Electronics Demand Multiplier], IfThenElse([Test 9 Two Industry Energy Stress Active] = 1, [A Electronics Local Base Demand] * [Two Industry Energy Stress Demand Multiplier], IfThenElse([Test 8 Metal Priority Scarcity Active] = 1, [A Electronics Local Base Demand] * [Priority Stress Demand Multiplier], IfThenElse([Test 5 Electronics Demand Surge Active] = 1, [A Electronics Local Base Demand] * [Electronics Demand Surge Multiplier], IfThenElse([Test 7 Two Good Transport Surge Active] = 1, [A Electronics Local Base Demand] * [Two Good Demand Surge Multiplier], [A Electronics Local Base Demand]))))))), IfThenElse([Test 14 Sustained Electronics Growth Active] = 1, [A Electronics Local Base Demand] * [v7.3 Sustained Electronics Growth Multiplier], IfThenElse([Test 13 Temporary Electronics Lifecycle Surge Active] = 1, [A Electronics Local Base Demand] * [v7.3 Temporary Electronics Demand Multiplier], IfThenElse([Test 9 Two Industry Energy Stress Active] = 1, [A Electronics Local Base Demand] * [Two Industry Energy Stress Demand Multiplier], IfThenElse([Test 8 Metal Priority Scarcity Active] = 1, [A Electronics Local Base Demand] * [Priority Stress Demand Multiplier], IfThenElse([Test 5 Electronics Demand Surge Active] = 1, [A Electronics Local Base Demand] * [Electronics Demand Surge Multiplier], IfThenElse([Test 7 Two Good Transport Surge Active] = 1, [A Electronics Local Base Demand] * [Two Good Demand Surge Multiplier], [A Electronics Local Base Demand])))))))"`
  LINKs in: `Test 5 Electronics Demand Surge Active`, `A Electronics Local Base Demand`, `Electronics Demand Surge Multiplier`, `Test 7 Two Good Transport Surge Active`, `Two Good Demand Surge Multiplier`, `Test 8 Metal Priority Scarcity Active`, `Priority Stress Demand Multiplier`, `Test 9 Two Industry Energy Stress Active`, `Two Industry Energy Stress Demand Multiplier`, `Test 14 Sustained Electronics Growth Active`, `v7.3 Sustained Electronics Growth Multiplier`, `Test 13 Temporary Electronics Lifecycle Surge Active`, `v7.3 Temporary Electronics Demand Multiplier`, `Intermediate Inputs Enabled`, `Test 19 Coupled Electronics Growth Active`, `v7.4 Coupled Electronics Growth Multiplier`
- **B Effective Electronics Local Base Demand** (VARIABLE)
  `value = "IfThenElse([Test 15 Electronics Collapse Recovery Active] = 1, [B Electronics Local Base Demand] * [v7.3 Electronics Demand Collapse Multiplier], [B Electronics Local Base Demand])"`
  LINKs in: `B Electronics Local Base Demand`, `Test 15 Electronics Collapse Recovery Active`, `v7.3 Electronics Demand Collapse Multiplier`
- **A Effective Ore Base Cost** (VARIABLE)
  `value = "IfThenElse([Test 4 Reverse Advantage Active] = 1, [Reverse A Ore Base Cost], [A Ore Base Cost])"`
  LINKs in: `Test 4 Reverse Advantage Active`, `Reverse A Ore Base Cost`, `A Ore Base Cost`
- **B Effective Ore Base Cost** (VARIABLE)
  `value = "IfThenElse([Test 8 Metal Priority Scarcity Active] = 1, [Priority Stress B Ore Base Cost], IfThenElse([Test 4 Reverse Advantage Active] = 1, [Reverse B Ore Base Cost], [B Ore Base Cost]))"`
  LINKs in: `Test 4 Reverse Advantage Active`, `Reverse B Ore Base Cost`, `B Ore Base Cost`, `Test 8 Metal Priority Scarcity Active`, `Priority Stress B Ore Base Cost`
- **B Effective Wage** (VARIABLE)
  `value = "IfThenElse([Test 4 Reverse Advantage Active] = 1, [Reverse B Wage], [B Wage])"`
  LINKs in: `Test 4 Reverse Advantage Active`, `Reverse B Wage`, `B Wage`
- **A Effective Mining Capacity** (VARIABLE)
  `value = "IfThenElse([Intermediate Inputs Enabled] = 1, IfThenElse([Test 18 Metal Supply Shock Active] = 1, [A Mining Capacity] * [v7.4 Metal Supply Shock Multiplier], [A Mining Capacity]), [A Mining Capacity])"`
  LINKs in: `A Mining Capacity`, `Intermediate Inputs Enabled`, `Test 18 Metal Supply Shock Active`, `v7.4 Metal Supply Shock Multiplier`
- **B Effective Mining Capacity** (VARIABLE)
  `value = "IfThenElse([Test 4 Reverse Advantage Active] = 1, [Reverse B Mining Capacity], [B Mining Capacity])"`
  LINKs in: `Test 4 Reverse Advantage Active`, `Reverse B Mining Capacity`, `B Mining Capacity`
- **A Metal Unit Cost** (VARIABLE)
  `value = "[A Ore per Metal] * [A Ore Price] + [A Energy per Metal] * [A Effective Energy Price] + [A Labor per Metal] * [A Wage]"`
  LINKs in: `A Ore per Metal`, `A Ore Price`, `A Energy per Metal`, `A Energy Price`, `A Labor per Metal`, `A Wage`, `A Effective Energy Price`
- **B Metal Unit Cost** (VARIABLE)
  `value = "[B Ore per Metal] * [B Ore Price] + [B Energy per Metal] * [B Effective Energy Price] + [B Labor per Metal] * [B Effective Wage]"`
  LINKs in: `B Ore per Metal`, `B Ore Price`, `B Energy per Metal`, `B Energy Price`, `B Labor per Metal`, `B Wage`, `B Effective Energy Price`, `B Effective Wage`
- **A Mining Rate** (VARIABLE)
  `value = "IfThenElse([Intermediate Inputs Enabled] = 1, [A Positive Desired Mining Rate] / (1 + ([A Positive Desired Mining Rate] / ([A Effective Mining Capacity] + 0.001)) ^ 8) ^ 0.125, [A Positive Desired Mining Rate] / (1 + ([A Positive Desired Mining Rate] / ([A Mining Capacity] + 0.001)) ^ 8) ^ 0.125)"`
  LINKs in: `A Positive Desired Mining Rate`, `A Mining Capacity`, `A Effective Mining Capacity`, `Intermediate Inputs Enabled`
- **B Mining Rate** (VARIABLE)
  `value = "[B Positive Desired Mining Rate] / (1 + ([B Positive Desired Mining Rate] / ([B Effective Mining Capacity] + 0.001)) ^ 8) ^ 0.125"`
  LINKs in: `B Positive Desired Mining Rate`, `B Mining Capacity`, `B Effective Mining Capacity`
- **A Power Active Generation Capacity** (VARIABLE)
  `value = "IfThenElse([Capital Lifecycle Enabled] = 1, [A Power Active Generation Capital], [A Power Installed Generation Capacity]) * IfThenElse([Test 11 Generation Capacity Shock Active] = 1, [Generation Capacity Shock Factor], IfThenElse([Test 6 Electronics Reverse Advantage Active] = 1, [Legacy Advantage Test Power Headroom Multiplier], 1))"`
  LINKs in: `Test 11 Generation Capacity Shock Active`, `Generation Capacity Shock Factor`, `A Power Installed Generation Capacity`, `Test 6 Electronics Reverse Advantage Active`, `Legacy Advantage Test Power Headroom Multiplier`, `Capital Lifecycle Enabled`, `A Power Active Generation Capital`
- **B Power Active Generation Capacity** (VARIABLE)
  `value = "IfThenElse([Capital Lifecycle Enabled] = 1, [B Power Active Generation Capital], [B Power Installed Generation Capacity]) * IfThenElse([Test 4 Reverse Advantage Active] = 1, [Legacy Advantage Test Power Headroom Multiplier], 1)"`
  LINKs in: `B Power Installed Generation Capacity`, `Test 4 Reverse Advantage Active`, `Legacy Advantage Test Power Headroom Multiplier`, `Capital Lifecycle Enabled`, `B Power Active Generation Capital`
- **A Wage** (VARIABLE)
  `value = 100`
  LINKs in: —
- **B Wage** (VARIABLE)
  `value = 140`
  LINKs in: —
- **Reverse B Wage** (VARIABLE)
  `value = 90`
  LINKs in: —
- **Reverse A Ore Base Cost** (VARIABLE)
  `value = 12`
  LINKs in: —
- **Reverse B Ore Base Cost** (VARIABLE)
  `value = 5`
  LINKs in: —
- **Reverse B Mining Capacity** (VARIABLE)
  `value = 70`
  LINKs in: —
- **Priority Stress B Ore Base Cost** (VARIABLE)
  `value = 50`
  LINKs in: —
- **A Mining Capacity** (VARIABLE)
  `value = 70`
  LINKs in: —
- **B Mining Capacity** (VARIABLE)
  `value = 28`
  LINKs in: —
- **A Ore Base Cost** (VARIABLE)
  `value = 4`
  LINKs in: —
- **B Ore Base Cost** (VARIABLE)
  `value = 14`
  LINKs in: —
- **Generation Capacity Shock Factor** (VARIABLE)
  `value = 0.6`
  LINKs in: —
- **Legacy Advantage Test Power Headroom Multiplier** (VARIABLE)
  `value = 4`
  LINKs in: —
- **v7.4 Metal Supply Shock Multiplier** (VARIABLE)
  `value = 0.5`
  LINKs in: —
- **Priority Stress Demand Multiplier** (VARIABLE)
  `value = 1.8`
  LINKs in: —
- **Two Industry Energy Stress Demand Multiplier** (VARIABLE)
  `value = 3`
  LINKs in: —
- **Two Good Demand Surge Multiplier** (VARIABLE)
  `value = 1.8`
  LINKs in: —
- **Transport Demand Surge Multiplier** (VARIABLE)
  `value = 2`
  LINKs in: —
- **Low Demand Multiplier** (VARIABLE)
  `value = 0.55`
  LINKs in: —
- **Electronics Demand Surge Multiplier** (VARIABLE)
  `value = 2`
  LINKs in: —
- **v7.3 Sustained Metal Demand Growth Multiplier** (VARIABLE)
  `value = 2`
  LINKs in: —
- **v7.3 Sustained Electronics Growth Multiplier** (VARIABLE)
  `value = 4`
  LINKs in: —
- **v7.3 Temporary Electronics Demand Multiplier** (VARIABLE)
  `value = 2`
  LINKs in: —
- **v7.3 Electronics Demand Collapse Multiplier** (VARIABLE)
  `value = 0.35`
  LINKs in: —
- **v7.4 Coupled Electronics Growth Multiplier** (VARIABLE)
  `value = 4`
  LINKs in: —
- **v7.4 Coupled Metal Demand Growth Multiplier** (VARIABLE)
  `value = 2`
  LINKs in: —
- **Test 13 Temporary Electronics Lifecycle Surge Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 13, [Temporary Test Window], 0)"`
  LINKs in: `Timed Test Mode`, `Temporary Test Window`
- **Test 14 Sustained Electronics Growth Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 14, [Reverse Advantage Window], 0)"`
  LINKs in: `Timed Test Mode`, `Reverse Advantage Window`
- **Test 15 Electronics Collapse Recovery Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 15, [Temporary Test Window], 0)"`
  LINKs in: `Timed Test Mode`, `Temporary Test Window`
- **Test 16 Sustained Metal Energy Growth Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 16, [Reverse Advantage Window], 0)"`
  LINKs in: `Timed Test Mode`, `Reverse Advantage Window`
- **Test 1 Reactivation Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 1, [Temporary Test Window], 0)"`
  LINKs in: `Timed Test Mode`, `Temporary Test Window`
- **Test 2 Transport Surge Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 2, [Temporary Test Window], 0)"`
  LINKs in: `Timed Test Mode`, `Temporary Test Window`
- **Test 3 Low Demand Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 3, [Temporary Test Window], 0)"`
  LINKs in: `Timed Test Mode`, `Temporary Test Window`
- **Test 4 Reverse Advantage Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 4, [Reverse Advantage Window], 0)"`
  LINKs in: `Timed Test Mode`, `Reverse Advantage Window`
- **Test 5 Electronics Demand Surge Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 5, [Temporary Test Window], 0)"`
  LINKs in: `Timed Test Mode`, `Temporary Test Window`
- **Test 6 Electronics Reverse Advantage Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 6, [Reverse Advantage Window], 0)"`
  LINKs in: `Timed Test Mode`, `Reverse Advantage Window`
- **Test 7 Two Good Transport Surge Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 7, [Temporary Test Window], 0)"`
  LINKs in: `Timed Test Mode`, `Temporary Test Window`
- **Test 8 Metal Priority Scarcity Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 8, [Temporary Test Window], 0)"`
  LINKs in: `Timed Test Mode`, `Temporary Test Window`
- **Test 9 Two Industry Energy Stress Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 9, [Temporary Test Window], 0)"`
  LINKs in: `Timed Test Mode`, `Temporary Test Window`
- **Test 10 Cheap Energy Advantage Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 10, [Reverse Advantage Window], 0)"`
  LINKs in: `Timed Test Mode`, `Reverse Advantage Window`
- **Test 11 Generation Capacity Shock Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 11, [Temporary Test Window], 0)"`
  LINKs in: `Timed Test Mode`, `Temporary Test Window`
- **Test 18 Metal Supply Shock Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 18, [Temporary Test Window], 0)"`
  LINKs in: `Temporary Test Window`, `Timed Test Mode`
- **Test 19 Coupled Electronics Growth Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 19, [Reverse Advantage Window], 0)"`
  LINKs in: `Reverse Advantage Window`, `Timed Test Mode`
- **Test 20 Coupled Metal Demand Growth Active** (VARIABLE)
  `value = "IfThenElse([Timed Test Mode] = 20, [Reverse Advantage Window], 0)"`
  LINKs in: `Reverse Advantage Window`, `Timed Test Mode`
