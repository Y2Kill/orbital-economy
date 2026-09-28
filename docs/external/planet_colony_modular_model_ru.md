# Модульная модель планеты / колонии: какие сферы моделировать

## Цель

Если конечная сущность — **планета, поселение или колония как относительно самостоятельный симулируемый юнит**, одной экономики недостаточно.

При этом число самостоятельных моделей лучше ограничивать. Отдельным модулем имеет смысл делать только то, что имеет собственные:

- состояния;
- запасы;
- задержки;
- инерцию;
- обратные связи;

и способно заметно изменить наблюдаемое состояние мира и рынка.

Полезный критерий:

> **Если явление только изменяет коэффициент другого процесса — это параметр. Если оно имеет память и само эволюционирует — это кандидат в отдельный модуль.**

Практический целевой масштаб — примерно **6–7 основных модулей на планету/колонию**, а всё остальное пока сворачивать в параметры.

## 1. Рекомендуемый базовый состав

| Модуль | Статус | Зачем нужен |
|---|---|---|
| **Economy** | обязательно | товары, производство, склады, цены, капитал, торговый спрос |
| **Demography** | обязательно | население, рабочая сила, рождаемость, смертность, миграция |
| **Governance / Politics** | обязательно | политика торговли, мобилизация, налоги, квоты, приоритеты, запреты |
| **Resources & Habitat** | обязательно | конечные ресурсы, вода/еда/жизнеобеспечение, загрязнение, пределы вместимости |
| **Infrastructure / Services** | почти всегда желательно | жильё, коммунальные мощности, медицина, локальный транспорт, порты |
| **Technology / Capability** | обязательно, но простой | что вообще можно производить, эффективность, automation, blueprints |
| **Social State** | тонкий слой | благосостояние, напряжение, безработица, дефициты, стабильность |
| **Security / External Relations** | нужен на уровне системы миров | война, блокада, пиратство, доступность маршрутов, санкции |

Полноценные социологию, партийную политику, банковскую систему, культурную модель и т. п. на первом этапе лучше не делать отдельными моделями.

## 2. Economy

Экономика остаётся центральным модулем, но она не должна пытаться решать всё.

Минимальный внешний интерфейс:

```text
INPUT
    population / workforce
    policy
    resource availability
    infrastructure services
    technology
    external trade

OUTPUT
    prices
    availability
    employment / labour demand
    income / welfare proxy
    shortages
    investment
    tax base / economic output
```

Экономика не должна сама решать:

- можно ли торговать с системой X;
- сколько работников существует;
- разрешена ли мобилизация;
- какой существует предел жизнеобеспечения;
- доступна ли нужная технология.

Это должны определять другие модули.

## 3. Demography

Это один из самых необходимых самостоятельных модулей.

Минимальная версия:

```text
Population
Births
Deaths
Immigration
Emigration
```

Но лучше сразу различать хотя бы:

```text
children
working_age
elderly
```

или более грубо:

```text
total_population
workforce
dependents
```

Потому что миллион жителей не равен миллиону доступных работников.

### Основные связи с экономикой

```text
Population ─────► basic demand
Workforce ──────► labour supply
Income ─────────► discretionary demand

Food shortage ──► mortality / migration
Housing shortage ► migration / fertility
Unemployment ───► emigration
High wages ──────► immigration
```

Пример естественной обратной связи:

```text
industrial boom
    ↓
labour shortage
    ↓
wage ↑
    ↓
immigration ↑
    ↓
housing demand ↑
    ↓
construction ↑
    ↓
food / energy demand ↑
```

Экономика начинает менять население, а население — экономику.

## 4. Governance / Politics

Политику на первом уровне лучше моделировать не как симулятор политиков и институтов, а как **механизм изменения правил системы**.

Пример выходов:

```text
tax_rate
tariffs
trade_permissions
embargoes
rationing
military_priority
civilian_priority
migration_policy
state_investment
price_controls
reserve_requirements
```

### Пример военной мобилизации

Вместо отдельной «военной экономики» можно задать:

```text
MilitaryPriority = 0.8
```

и изменить правила:

```text
metals:
    military allocation = 70%

energy:
    strategic industries priority

capital_goods:
    civilian construction priority ↓

trade:
    EnemyFaction = forbidden

budget:
    military demand ↑
```

После этого сама обычная экономика должна породить последствия:

```text
civilian shortages
price growth
capital diversion
trade restructuring
industrial restructuring
```

Это значительно лучше, чем вручную прописывать «результат войны».

## 5. Resources / Habitat

Для планеты или колонии этот модуль особенно важен.

Он отвечает не за цену ресурса, а за физический вопрос:

> **Сколько ресурса существует и сколько система способна предоставить?**

Минимальные состояния:

```text
extractable_resources
renewable_resources
water
food / biomass potential
habitable_capacity
waste / pollution
environment_quality
```

Для искусственной колонии особенно важны:

```text
life_support_capacity
recycling_efficiency
habitable_volume
```

Для землеподобной планеты эти ограничения могут быть слабыми.

Для закрытой колонии — критическими.

### Пример

```text
LifeSupportCapacity = 180 000 persons
Population = 175 000
```

При росте населения:

```text
Population → 300 000
```

но:

```text
Housing/LifeSupportCapacity → 190 000
```

возникают:

```text
housing price ↑
immigration attractiveness ↓
mortality risk ↑
construction demand ↑
```

Так появляется физический потолок роста.

## 6. Infrastructure / Public Services

Здесь полезно отделить рыночный производственный капитал от инфраструктурной сервисной мощности.

Рыночные заводы, фабрики и электростанции могут оставаться частью экономики.

Но инфраструктура может описываться через capacity:

```text
HousingCapacity
WaterCapacity
HealthcareCapacity
PortCapacity
LocalTransportCapacity
CommunicationsCapacity
```

Например:

```text
HousingCapacity = 100 000 persons
HealthcareCapacity = 2 000 treatments/day
PortCapacity = 50 000 t/day
```

Не нужно моделировать каждую больницу, жилой дом или насос.

Достаточно моделировать сервисную мощность и её загрузку.

## 7. Technology / Capability

Этот модуль лучше делать намного проще традиционных игровых tech trees.

Он отвечает за два типа вещей.

### Capabilities

```text
can_build_fusion_reactor
can_produce_hyperdrive
can_process_titanium
has_blueprint_X
```

### Efficiency modifiers

```text
mining_efficiency
fabrication_efficiency
energy_efficiency
recycling_efficiency
automation
```

Экономика задаёт модулю технологии очень простой вопрос:

```text
Can I execute Recipe X?
At what efficiency?
```

И получает ответ.

### Почему это самостоятельный модуль

Потому что технология:

- накапливается;
- распространяется;
- может импортироваться;
- требует времени;
- может быть утрачена;
- влияет сразу на множество отраслей.

Простейший Research можно описать примерно так:

```text
ResearchRate = ResearchInvestment × HumanCapital
```

Сложный процедурный tech tree на этом этапе не нужен.

## 8. Social State

Полноценную социологию пока лучше не вводить.

Но полностью игнорировать социальное состояние тоже нельзя.

Достаточно небольшого агрегированного слоя:

```text
welfare
inequality
unemployment
shortage_pressure
trust / stability
unrest
```

Простейшая причинная схема:

```text
shortages ─────┐
unemployment ──┤
inequality ────┤
war losses ────┤
               ▼
          social_stress
               │
      ┌────────┼────────┐
      ▼        ▼        ▼
 productivity migration unrest
```

Это уже позволяет получить эффект:

> Экономика формально богата, но население недовольно.

И наоборот.

Полная модель социальных групп потребуется только тогда, когда различия между группами станут частью gameplay.

## 9. Security / External Relations

Внутри мирной одиночной планеты этот слой можно держать очень тонким.

Но при взаимодействии нескольких миров он становится важным.

Связь:

```text
Planet A ↔ Planet B
```

не должна существовать только в терминах:

```text
price + transport cost
```

Нужны также:

```text
relation
trade_allowed
route_security
war_state
blockade
piracy_risk
sanctions
military_control
```

Тогда транспортное ребро имеет:

```text
capacity
travel_time
cost
risk
access
```

а политика и безопасность способны менять последние параметры.

Так война и санкции меняют торговлю через обычные механизмы экономики, а не через специальные скрипты.

## 10. Что пока не стоит выделять в самостоятельные модели

### Finance / Banking

Пока достаточно:

- инвестиционных ограничений;
- стоимости капитала;
- бюджетных ограничений;
- доступного финансирования как агрегированного параметра.

Банки, кредиты, дефолты и процентные ставки резко увеличат сложность.

Отдельный финансовый модуль имеет смысл вводить только если финансовые кризисы должны быть самостоятельным явлением.

### Healthcare

Пока:

```text
HealthcareCapacity → mortality / productivity
```

### Education

Пока:

```text
EducationCapacity → humanCapital / skill
```

### Crime

Можно свернуть в:

```text
security / stability
```

### Culture / Religion / Ideology

Пока только модификаторы:

```text
fertility
migration
consumption preferences
political stability
```

### Legal system

Можно выразить через:

```text
enforcement
property security
transaction cost
```

### Media / information

Пока не требуется.

### Individual firms

Секторная экономика уже способна агрегировать их поведение.

### Individual people

Не нужны.

### Detailed land use

Только если внутренняя география планеты станет частью gameplay.

## 11. Рекомендуемая архитектура

```text
                       ┌───────────────┐
                       │  TECHNOLOGY   │
                       └───────┬───────┘
                               │ capability
                               ▼
 ┌──────────────┐       ┌───────────────┐       ┌───────────────┐
 │ RESOURCES /  │──────►│    ECONOMY    │◄─────►│  DEMOGRAPHY   │
 │   HABITAT    │       │               │       │               │
 └──────┬───────┘       └───────┬───────┘       └───────┬───────┘
        │                       │                       │
        │                       ▼                       │
        │               ┌───────────────┐               │
        └──────────────►│INFRASTRUCTURE │◄──────────────┘
                        └───────┬───────┘
                                │
                                ▼
                        ┌───────────────┐
                        │ SOCIAL STATE  │
                        └───────┬───────┘
                                │
                                ▼
                        ┌───────────────┐
                        │  GOVERNANCE   │
                        └───────┬───────┘
                                │ rules
                                ▼
                            ECONOMY
```

Сверху работает внешняя система:

```text
              EXTERNAL / SECURITY
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
     trade        migration      war
     routes        routes       blockade
```

## 12. Ключевая обратная связь Politics ↔ Population

Политику не стоит делать полностью внешним управляющим переключателем.

Со временем нужна цепочка:

```text
Governance policy
       ↓
Economy
       ↓
prices / shortages / employment
       ↓
Population welfare
       ↓
Social stability
       ↓
Governance pressure
```

Например:

```text
export_food = true
```

даёт дополнительный экспортный доход.

Но затем:

```text
local food shortage
    ↓
welfare ↓
    ↓
unrest ↑
```

И governance получает давление изменить правила.

Так появляется поведение общества без моделирования отдельных политиков.

## 13. Главное правило границы модулей

Полезно формализовать:

> **Если явление только изменяет коэффициент другого процесса — это параметр. Если оно имеет память, собственное состояние и само эволюционирует — это кандидат в модуль.**

Примеры.

```text
culture reduces fertility by 10%
```

Пока это параметр Demography.

Но если нужна цепочка:

```text
education → values → fertility → age structure
                     ↑
               policy / culture
```

и `values` сами меняются десятилетиями — появляется смысл отдельного Social module.

Аналогично:

```text
government tariff = 15%
```

— параметр.

Но:

```text
economic crisis
    ↓
unrest
    ↓
policy change
    ↓
tariff
    ↓
economy
```

— уже полноценный Governance-контур.

## 14. Минимальный Planet / Colony v1

Рекомендуемый состав:

```text
1. Economy
2. Demography
3. Governance
4. Resources / Habitat
5. Infrastructure
6. Technology
7. Social State
```

При этом `Social State` должен оставаться очень тонким.

А:

```text
Security / External Relations
```

лучше держать на уровне системы миров, потому что война, блокада, дипломатия и торговая доступность по смыслу возникают **между** такими юнитами.

## 15. Какие сценарии уже сможет воспроизводить такой набор

Без моделирования партий, банков, отдельных компаний и отдельных людей можно получить:

```text
resource exhaustion
population boom
labour shortage
industrial decline
immigration wave
blockade
mobilization
trade embargo
energy shortage
housing crisis
technological leap
pollution / resource degradation
social instability
recovery
```

Главное достоинство такой архитектуры — новые эффекты возникают из связей модулей, а не прописываются вручную.

## 16. Что логично делать следующим

После Economy наиболее естественный следующий самостоятельный модуль — **Demography**.

У неё самый чистый интерфейс с уже существующей экономикой и она сразу создаёт полезные обратные связи:

```text
Population
    ↓
basic demand

Workforce
    ↓
labour availability

Wages / shortages / housing
    ↓
migration

Food / healthcare / habitat
    ↓
mortality and growth
```

После Demography логично добавлять:

```text
Resources / Habitat
```

затем:

```text
Governance
```

и только после этого — более тонкий Social State.

## Итог

Для планетарно-колониального уровня наиболее полезна не одна гигантская модель, а **набор слабосвязанных специализированных моделей**.

Экономика должна описывать рынок и физическое производство.

Демография — людей и рабочую силу.

Resources/Habitat — физические пределы среды.

Infrastructure — сервисную мощность.

Technology — доступные capabilities и эффективность.

Governance — правила.

Social State — общественную обратную реакцию.

Security / External Relations — взаимодействие миров.

Основной принцип упрощения:

> **Не моделировать сферу отдельно только потому, что она существует в реальности. Делать её отдельным модулем только тогда, когда собственная динамика этой сферы заметно меняет наблюдаемое состояние колонии и её рынок.**

## Источники и ориентиры

- World3 / системная динамика: население, капитал, ресурсы, сельское хозяйство и загрязнение как взаимосвязанные подсистемы.
- Integrated Assessment Models: двустороннее связывание экономики с физическими и природными системами.
- Food–Energy–Water Nexus models: совместное моделирование физических ресурсных ограничений и экономических решений.
- Demo-economic models: двусторонние связи между демографией и экономикой.
