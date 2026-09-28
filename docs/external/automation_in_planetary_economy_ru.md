# Высокая автоматизация в модульной модели планеты / колонии

## Цель

Высокий уровень автоматизации необходимо заложить в архитектуру **до** построения полноценного модуля Workforce / Demography.

Иначе легко случайно получить модель современной земной экономики, где объём производства почти линейно связан с количеством работников, а затем пытаться поверх неё добавлять роботов, дроидов и автоматизированные фабрики.

Для высокотехнологичной межпланетной цивилизации это будет неверно.

Основной принцип:

> **Automation — не отдельная сфера, а сквозной механизм на стыке Technology → Economy → Demography.**

---

# 1. Три разных понятия, которые не стоит смешивать

Полезно различать:

```text
Automation Capability
        │
        │ Technology определяет:
        │ насколько автоматизация вообще возможна
        ▼
Installed Automation
        │
        │ Economy определяет:
        │ насколько конкретный сектор реально автоматизирован
        ▼
Labour Requirement
```

То есть технологически развитый мир может уметь строить почти полностью автоматические рудники, но конкретный старый рудник всё ещё может оставаться полуавтоматическим.

---

# 2. Автоматизация должна быть характеристикой сектора / процесса, а не всей планеты

Не рекомендуется один глобальный параметр:

```text
Automation = 0.9
```

для всей экономики.

Лучше задавать automation по процессам или секторам:

```text
Mining             automation = 0.98
Bulk metallurgy    automation = 0.97
Fabrication        automation = 0.995
Shipyard           automation = 0.85
Healthcare         automation = 0.60
Research           automation = 0.30
Administration     automation = 0.80
```

Цифры здесь только иллюстративны.

Так одна и та же планета может:

- почти не нуждаться в рабочей силе в добыче;
- иметь высокоавтоматизированную промышленность;
- испытывать нехватку врачей;
- испытывать нехватку инженеров;
- зависеть от человеческого исследовательского труда.

---

# 3. Встраивание Automation в Process node

Условный производственный процесс:

```text
Ore
Energy
Labour
Capacity
   ↓
Mining
   ↓
Ore
```

может иметь примерно такие параметры:

```text
PROCESS: Mining

physical_capacity
energy_requirement
material_inputs

base_labour_requirement

automation_capability
installed_automation

maintenance_requirement
```

Фактическая потребность в рабочей силе:

```text
LabourRequired =
    Output
    × BaseLabourRequirement
    × AutomationFactor
```

При этом не стоит обязательно использовать простую функцию:

```text
AutomationFactor = 1 - Automation
```

Потому что даже почти полностью автоматизированная система обычно сохраняет некоторую минимальную потребность в людях:

- контроль;
- обслуживание;
- аварийные работы;
- управление;
- инженерные функции.

Более подходящая общая форма:

```text
AutomationFactor =
    LabourMinimum
    + (1 - LabourMinimum) × (1 - Automation)^k
```

где:

```text
Automation → 1
```

не приводит потребность в людях строго к нулю.

---

# 4. Automation должна заменять труд другими ограничениями

Автоматизация не должна быть бесплатным универсальным улучшением.

Иначе оптимальная стратегия любой экономики:

```text
automation = 100%
```

и механизм перестаёт быть экономически интересным.

Правильнее:

```text
LABOUR
   ↓ automation replaces ↓
CAPITAL
ELECTRONICS
ENERGY
MAINTENANCE
TECHNOLOGY
```

При росте автоматизации:

```text
LabourDemand ↓
```

но одновременно могут расти:

```text
CapitalCost ↑
EnergyDemand ↑
AdvancedComponentsDemand ↑
MaintenanceDemand ↑
TechnologyRequirement ↑
```

Это особенно хорошо подходит для sci-fi экономики.

---

# 5. Молодая колония и Core World могут использовать один и тот же сектор

Например.

Молодая колония:

```text
много людей
мало капитала
мало электроники
дорогая энергия
низкая автоматизация
```

Центральный высокоразвитый мир:

```text
дорогой труд
много капитала
дешёвая энергия
развитая электроника
высокая автоматизация
```

Обе экономики используют один и тот же `Mining Process`, но параметры различаются.

Результат:

- молодая колония добывает сырьё трудоёмко;
- Core World добывает те же объёмы с минимальным количеством людей.

---

# 6. Население больше не должно определять размер экономики

Для примитивной модели опасно получить зависимость:

```text
GDP ∝ Population
```

Для высокоавтоматизированной цивилизации она не должна быть обязательной.

Можно иметь:

```text
Planet A
Population: 10 billion
Automation: low

Planet B
Population: 80 million
Automation: extreme
```

и Planet B при этом может иметь большую промышленную мощность.

Производство должно ограничиваться несколькими независимыми bottleneck:

```text
ActualProduction =
    min(
        CapitalCapacity,
        MaterialAvailability,
        EnergyAvailability,
        LabourCapacity,
        OtherInputs
    )
```

При высокой автоматизации `LabourCapacity` перестаёт быть главным ограничителем.

---

# 7. Automation меняет саму роль Demography

При низкой автоматизации связь сильна:

```text
Population
    ↓
Workforce
    ↓
Production
```

При высокой автоматизации она становится значительно слабее.

Но другая связь остаётся сильной:

```text
Population
    ↓
Consumption
```

Получается асимметрия:

```text
                 ┌────► Consumption
Population ──────┤
                 │
                 └────► Workforce ──► Production
                                    ↑
                                    │
                              Automation
                           ослабляет связь
```

Добавление миллиона жителей почти неизбежно увеличивает:

- потребление;
- спрос на жильё;
- спрос на услуги;
- спрос на энергию;
- спрос на продовольствие.

Но оно совершенно не обязательно увеличивает производство на сопоставимую величину.

---

# 8. Это меняет модель миграции

Для высокоавтоматизированного мира неправильной будет простая схема:

```text
jobs → immigration
```

Работа остаётся лишь одним фактором привлекательности.

Полезнее:

```text
MigrationAttractiveness =
    real_income
  + welfare
  + housing
  + services
  + security
  + rights / policy
  + opportunities
  - cost_of_living
  - shortages
```

Так может существовать:

> Очень богатый высокоавтоматизированный мир, куда люди хотят переехать, хотя дополнительная рабочая сила экономике почти не нужна.

Это важный sci-fi сценарий.

---

# 9. Возникает вопрос распределения доходов

Если:

```text
automation ↑
labour_requirement ↓
```

а единственный источник дохода населения:

```text
wages
```

то модель естественно приходит к цепочке:

```text
employment ↓
    ↓
household income ↓
    ↓
demand ↓
    ↓
production ↓
```

Для высокоавтоматизированной цивилизации такой результат не обязательно правдоподобен.

Поэтому минимально стоит разделить доход населения на:

```text
HouseholdIncome =
    LabourIncome
  + CapitalIncome
  + Transfers
```

Не нужно моделировать фондовый рынок и миллионы владельцев активов.

Достаточно агрегатов:

```text
wage_income
capital_or_social_dividend
government_transfers
```

---

# 10. Разные общества могут отличаться распределением автоматизированного излишка

Например.

## Корпоративный мир

```text
labour income             moderate
capital distribution      low
inequality                 high
```

## Социальное государство

```text
labour income             lower importance
social dividend           high
basic services            high
```

## Почти post-scarcity Core World

```text
basic consumption         mostly guaranteed
work                      weakly linked to survival
```

## Молодая frontier colony

```text
labour income             dominates
automation                low
basic goods               expensive
```

Одна архитектура способна описывать все эти режимы.

---

# 11. Связь с Governance

Полезно предусмотреть агрегированные параметры типа:

```text
household_labour_share
household_capital_share
state_transfer_share
```

или более общий:

```text
AutomationSurplusDistribution
```

Идея:

> Какая часть благосостояния, создаваемого автоматизированной экономикой, превращается в покупательную способность населения?

Это естественный мост между:

```text
Economy
Governance
Social State
Demography
```

---

# 12. Роботы и дроиды

По умолчанию роботов лучше считать **Capital Goods**, а не населением.

Экономически робот:

- производится;
- требует ресурсов;
- требует электроники;
- требует энергии;
- изнашивается;
- требует обслуживания;
- увеличивает производительность;
- уменьшает потребность в человеческом труде.

Схема:

```text
Electronics
Advanced Components
Energy
       ↓
Robotics Production
       ↓
Automation Capital
       ↓
Industrial Sector
       ↓
Labour Requirement ↓
```

Если в конкретном сеттинге разумные дроиды являются полноценными гражданами и самостоятельными экономическими субъектами, это уже отдельное расширение.

Тогда они могут одновременно выступать как:

```text
capital
+
population / social agents
```

Но это не стоит зашивать в базовую модель.

---

# 13. Полезно различать Automation и Autonomy

Это два разных свойства.

## Production Automation

Уменьшает количество работников на единицу продукции.

Применяется к:

```text
Mining
Manufacturing
Agriculture
Construction
```

## Autonomy

Уменьшает необходимость постоянного человеческого присутствия и управления.

Например:

```text
automated factory
```

может всё ещё требовать инженеров на месте.

А:

```text
autonomous factory
```

может работать долгое время вообще без постоянного населения.

---

# 14. Это позволяет существовать безлюдным экономическим юнитам

Например:

```text
Uninhabited Mining System
        ↓
Autonomous Mines
        ↓
Raw Material Exports
```

То есть экономическая единица вообще не обязана быть населённой колонией.

Это важный архитектурный аргумент:

> `Economy` должна уметь существовать при `Population = 0`, если её процессы достаточно автономны.

---

# 15. Automation не должна меняться мгновенно

Автоматизация по сути является разновидностью капитала.

Переход:

```text
Desired Automation
        ↓
Automation Investment
        ↓
Capital Goods
Electronics
Technology
Time
        ↓
Installed Automation
```

Технологическое открытие:

```text
AutomationCapability = 0.95
```

не означает, что на следующий день все предприятия автоматически становятся автоматизированными на 95%.

Старые предприятия должны модернизироваться постепенно.

Это создаёт полезную инерцию.

---

# 16. Общая архитектура

```text
                     TECHNOLOGY
                         │
               automation capability
                         │
                         ▼
CAPITAL GOODS ───► INSTALLED AUTOMATION
                         │
                         ▼
                    PRODUCTION
                    /    │     \
                   /     │      \
                  ▼      ▼       ▼
              labour   energy  maintenance
              demand   demand    demand
                  │
                  ▼
              DEMOGRAPHY
                  │
               workforce
                  │
                  └────────────► PRODUCTION
```

Сверху:

```text
GOVERNANCE
    │
    ├── labour rules
    ├── automation policy
    ├── taxation
    └── redistribution
             │
             ▼
        HOUSEHOLD INCOME
             │
             ▼
           DEMAND
             │
             ▼
          ECONOMY
```

---

# 17. Первый Demography ↔ Economy прототип уже должен учитывать Automation

Не следует делать:

```text
Output <= Workforce
```

Лучше:

```text
LabourDemand_s =
    Output_s
    × LabourIntensity_s
    × AutomationFactor_s
```

Суммарно:

```text
TotalLabourDemand =
    Σ LabourDemand_s
```

После этого:

```text
TotalLabourDemand
vs
AvailableWorkforce
```

---

# 18. Labour Fulfillment Ratio

Если работников недостаточно:

```text
Labour Available = 90
Labour Requested = 100
```

получаем:

```text
Labour Fulfillment = 0.90
```

На первом этапе этот коэффициент можно использовать аналогично другим fulfillment-механизмам экономики.

Позже рабочую силу лучше распределять между секторами не одинаково, а через:

- зарплаты;
- государственные приоритеты;
- квалификационные ограничения;
- социальную привлекательность работы.

---

# 19. Automation как механизм адаптации

Очень полезная обратная связь:

```text
Labour shortage
     ↓
Wages ↑
     ↓
Automation becomes profitable
     ↓
Automation investment ↑
     ↓
Installed automation ↑
     ↓
Labour requirement ↓
```

Это значит, что нехватка работников имеет несколько возможных решений.

Экономика может:

```text
1. привлечь мигрантов;
2. повысить автоматизацию;
3. сократить производство;
4. импортировать готовый товар;
5. перенести производство в другой мир.
```

Это уже создаёт действительно живое взаимодействие экономик.

---

# 20. Взаимодействие двух миров

Допустим, Planet A испытывает нехватку рабочей силы.

Вместо единственного решения:

```text
Population B → migration → Planet A
```

система может выбрать другой путь:

```text
Planet A imports goods from B
```

или:

```text
Planet A invests in automation
```

или:

```text
Production relocates to B
```

Таким образом, торговля, миграция и автоматизация становятся конкурирующими способами устранения одного и того же дисбаланса.

Это очень важный системный эффект.

---

# 21. Рекомендуемый минимальный набор параметров Automation

Для сектора / process node:

```text
base_labour_requirement
automation_capability
installed_automation
minimum_human_fraction

automation_capital_cost
automation_energy_modifier
automation_maintenance_modifier
automation_electronics_requirement
automation_upgrade_time

autonomy_level
```

Не обязательно реализовывать все сразу.

Минимум для первой версии:

```text
base_labour_requirement
automation_capability
installed_automation
minimum_human_fraction
```

---

# 22. Что НЕ нужно делать в первой версии

Не требуется моделировать:

- каждого робота;
- профессии всех работников;
- обучение каждой специальности;
- каждую автоматизированную машину;
- конкретные модели дроидов;
- отдельные AI;
- полную структуру собственности капитала;
- фондовый рынок;
- детальную налоговую систему.

Нужен только агрегированный эффект Automation на:

```text
labour
capital
energy
maintenance
electronics
income distribution
```

---

# 23. Архитектурное правило

Полезно зафиксировать:

> **Automation не производит товар сама по себе. Она изменяет коэффициенты и ограничения Process node.**

То есть:

```text
Automation
```

не является ещё одним обычным input commodity.

Она является состоянием производственного капитала.

При этом её увеличение требует реальных ресурсов:

```text
Capital Goods
Electronics
Energy
Time
Technology
```

---

# 24. Итог

Для высокоразвитой межпланетной экономики Automation должна быть встроена прямо в интерфейс между Economy и Demography.

Она делает связь:

```text
Population → Production
```

непрямой и потенциально очень слабой.

При этом связь:

```text
Population → Consumption
```

остаётся сильной.

Это позволяет одной и той же архитектуре описывать:

- трудоёмкую frontier colony;
- индустриальную планету;
- богатый автоматизированный Core World;
- почти безлюдный mining system;
- общество с высоким социальным дивидендом;
- корпоративную автоматизированную экономику с высокой концентрацией доходов.

Главный принцип:

> **Высокая автоматизация должна не просто уменьшать коэффициент труда, а переносить дефицит с человеческой рабочей силы на капитал, энергию, электронику, обслуживание, технологию и систему распределения доходов.**

Именно тогда Automation становится не декоративным параметром, а полноценным источником экономического поведения.
