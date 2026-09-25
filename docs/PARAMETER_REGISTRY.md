# Orbital Economy — реестр внешних параметров

- generated: 2026-09-25T15:15:20.766Z
- model: Orbital Economy v7.6.1 r1 — Energy Kernel v2, Mode 25 calibrated to a 50% resource-supply shock — SHA-256 `16e8ca6c5719e67422e16a6ec1ea2724b6121a062200eaf91e81389a2a180cd1`
- annotations: docs/PARAMETER_ANNOTATIONS.json (SHA-256 `f6c01659c09ca9d7c824646e988b0fdf32c52bdd238d4f930d9bbd1144989663`)

Всё, что модель не выводит сама: числовые константы, начальные запасы, переключатели, тестовые множители. Инвентарь сгенерирован из ModelJSON; аннотации («роль / что меняет / доказательство») ведутся вручную и версионируются вместе с baseline.

## Сводка

- внешних величин: **325** (константы 221, начальные запасы 65, переключатели 6, тестовая обвязка 33)
- по колониям: A 93, B 93, глобальные 139
- аннотировано: **159 / 325** (49 %)
- несимметричных пар A/B: **41**, из них без аннотации: **0**

## Несимметричные пары A/B — что задаёт различия колоний

Это единственные внешние величины, в которых A и B отличаются; всё остальное различие поведения колоний — их следствие.

| Параметр (без префикса) | Сектор | A | B | Аннотация |
|---|---|---:|---:|---|
| Electronics Capacity Planning Signal | Electronics | 1.25793 | 48.83148 | Соответствует v7.3-специализации (A почти не производит, B ~45). В v7.4 Mode 17 A перепланируется с 1.3 к ~22 — часть переходной динамики первых сотен дней. |
| Electronics Domestic Supply Signal | Electronics | 20 | 16 | Инициализация realized import share без стартового скачка. |
| Electronics Feedstock Base Cost | Electronics | 18 | 3 | В v7.3 — единственный источник преимущества B в электронике (B→A 21.7/день). В v7.4 при switch=1 не используется: вход = металл по Market Price. Исчезновение этого «подарка» и есть причина переворота специализации. |
| Electronics Local Base Demand | Electronics | 20 | 16 | Масштаб рынка электроники; в v7.4 обе колонии производят примерно под свой спрос (A 22, B 15 @1080). |
| Test 13 Electronics Demand Applies | Electronics | 1 | 0 | При 1 разрешает существующий множитель v7.3 Temporary Electronics Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |
| Test 14 Electronics Demand Applies | Electronics | 1 | 0 | При 1 разрешает существующий множитель v7.3 Sustained Electronics Growth Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |
| Test 15 Electronics Demand Applies | Electronics | 0 | 1 | При 1 разрешает существующий множитель v7.3 Electronics Demand Collapse Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |
| Test 19 Electronics Demand Applies | Electronics | 1 | 0 | При 1 разрешает существующий множитель v7.4 Coupled Electronics Growth Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |
| Test 23 Electronics Demand Applies | Electronics | 1 | 0 | 1 applies the shared ×4 demand multiplier; 0 substitutes exact neutral multiplier 1. |
| Test 5 Electronics Demand Applies | Electronics | 1 | 0 | При 1 разрешает существующий множитель Electronics Demand Surge Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |
| Test 7 Electronics Demand Applies | Electronics | 1 | 0 | При 1 разрешает существующий множитель Two Good Demand Surge Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |
| Test 8 Electronics Demand Applies | Electronics | 1 | 0 | При 1 разрешает существующий множитель Priority Stress Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |
| Test 9 Electronics Demand Applies | Electronics | 1 | 0 | При 1 разрешает существующий множитель Two Industry Energy Stress Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |
| Wage | Labor | 100 | 140 | Входит в Metal Unit Cost (0.1×) и Electronics Unit Cost (0.05×): B дороже на 4/ед. металла и 2/ед. электроники. В v7.4 после исчезновения дешёвого feedstock B — второй фактор, из-за которого B теряет преимущество в электронике. |
| Mining Capacity | Metal | 70 | 28 | Мягкий потолок Mining Rate. У A в baseline не связывает (добыча ~55); у B в связанном мире добыча ~11 ≪ 28. Именно поэтому шок Mode 18 сделан у A: ×0.5 у A режет плавку 39→25, ×0.5 у B ничего не меняет. |
| Ore Base Cost | Metal | 4 | 14 | Определяет Ore Price → Metal Unit Cost → Domestic Offer → Market Price. Разрыв ×3.5 делает металл A дешевле (Mode 17 @1080: 30.5 vs 37.4) и задаёт направление торговли металлом A→B на всех сценариях. В v7.4 через Feedstock Price = Market Price это же преимущество переносится на электронику. |
| Refinery Active Capacity | Metal | 35 | 28 | Старт без mothballed-резерва. |
| Refinery Installed Capacity | Metal | 35 | 28 | Стартовый капитал плавки; далее эндогенно: A растёт до 57–61 к 1080, B сжимается до 2–8 (импорт вместо плавки). |
| Test 16 Metal Demand Applies | Metal | 0 | 1 | При 1 разрешает существующий множитель v7.3 Sustained Metal Demand Growth Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |
| Test 18 Mining Shock Applies | Metal | 1 | 0 | Сохраняет исходную семантику v7.4: supply shock действует только на A, при этом обе Effective Mining Capacity используют одну зеркальную формулу. |
| Test 2 Metal Demand Applies | Metal | 0 | 1 | При 1 разрешает существующий множитель Transport Demand Surge Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |
| Test 20 Metal Demand Applies | Metal | 0 | 1 | При 1 разрешает существующий множитель v7.4 Coupled Metal Demand Growth Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |
| Test 3 Metal Demand Applies | Metal | 0 | 1 | При 1 разрешает существующий множитель Low Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |
| Test 7 Metal Demand Applies | Metal | 0 | 1 | При 1 разрешает существующий множитель Two Good Demand Surge Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |
| Test 8 Metal Demand Applies | Metal | 0 | 1 | При 1 разрешает существующий множитель Priority Stress Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |
| Test 9 Metal Demand Applies | Metal | 0 | 1 | При 1 разрешает существующий множитель Two Industry Energy Stress Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |
| Capital Goods Base Production Capacity | Other | 2 | 1 | Enters the soft production-capacity cap and is the quantity reduced by Mode 22 test wiring. |
| Domestic Supply Signal | Other | 16 | 22 | То же для металла. |
| Local Base Demand | Other | 16 | 22 | Масштаб конечного рынка металла; B — больший потребитель при меньшей добыче → структурный импорт металла B из A (~21–23/день). |
| Test 22 Capital Goods Shock Applies | Other | 1 | 0 | 1 applies the shared 0.3 production-capacity multiplier; 0 substitutes exact neutral multiplier 1. |
| Test 4 Headroom Applies | Other | 0 | 1 | Оборачивает существующий общий power multiplier через IfThenElse(flag=1, multiplier, 1), сохраняя старую одностороннюю тестовую обвязку при зеркальной формуле. |
| Test 6 Headroom Applies | Other | 1 | 0 | Оборачивает существующий общий power multiplier через IfThenElse(flag=1, multiplier, 1), сохраняя старую одностороннюю тестовую обвязку при зеркальной формуле. |
| Energy Demand Signal | Power | 1100 | 480 | Инициализация ценового сигнала дефицита энергии. |
| Legacy Power Installed Generation Capacity | Power | 1350 | 550 | В Modes 0–11 мощность генерации постоянна; при lifecycle=1 заменяется стоком Power Installed Generation Capital с тем же стартом. |
| Power Active Generation Capital | Power | 1350 | 550 | Старт без mothballed-резерва в энергетике. |
| Power Capacity Planning Signal | Power | 1316.4467 | 537.2232 | Инициализация в согласии с baseline-нагрузкой, чтобы Mode 12 не начинался с искусственного планового скачка. |
| Power Generation Cost | Power | 0.08 | 0.03 | Базовая цена энергии до дефицитной надбавки; B энергетически дешевле, но энергия не торгуется, поэтому это влияет только на локальные unit cost (Energy per Metal 30 → 2.4 vs 0.9 на единицу металла). |
| Power Installed Generation Capital | Power | 1350 | 550 | Стартовая точка lifecycle-энергетики; A с большим промышленным сектором стартует с большим парком. В связанном baseline A растёт до 1610 к 1080 при требуемых 1701 — источник остаточного энергодефицита A. |
| Test 11 Generation Shock Applies | Power | 1 | 0 | Оборачивает существующий общий power multiplier через IfThenElse(flag=1, multiplier, 1), сохраняя старую одностороннюю тестовую обвязку при зеркальной формуле. |
| Test 25 Power Resource Shock Applies | Power | 1 | 0 | 1 applies the shared Power Resource Shock Factor (0.1) to A extraction inside the standard shock window; 0 substitutes the exact neutral multiplier 1. A=1, B=0 keeps the experiment one-sided while both formulas stay mirrored. |
| Test 26 Energy Kernel Capacity Shock Applies | Power | 1 | 0 | 1 applies the shared Energy Kernel Capacity Shock Factor to A active generation capacity; 0 substitutes the exact neutral multiplier 1. A=1, B=0. |

## Литералы, встроенные в формулы (не видны инвентарю)

| Элемент | Литерал | Роль | Что меняет |
|---|---:|---|---|
| A Electronics Feedstock Buffer | 40 (legacy) / [Metal per Electronics] × 40 (coupled) | Мягкость ограничения выпуска электроники по входу | Фактор Feedstock Inventory/(Inventory+Buffer) в Pre Energy Production; в v7.4 переоценён в металлические единицы (0.25 × 40 = 10). До v7.4 был константой 40, с v7.4 — литерал внутри IfThenElse. |
| B Electronics Feedstock Buffer | 40 / [Metal per Electronics] × 40 | зеркало A | см. A |
| A Electronics Feedstock Target Inventory | 1200 (legacy) | Legacy целевой запас feedstock | При switch=0 — константа 1200 (v7.3); при switch=1 заменена на Metal Input Target Inventory. |
| B Electronics Feedstock Target Inventory | 1200 (legacy) | зеркало A | см. A |
| A Electronics Feedstock Inventory | 1200 (legacy initial) / [Metal per Electronics] × 1200 (coupled initial) | Начальный запас входа Electronics | Унаследованный feedstock 1200 переоценивается в 300 единиц металла при switch=1; без этого спрос на вход равен нулю ~200 дней (найдено в r1). |
| B Electronics Feedstock Inventory | 1200 / [Metal per Electronics] × 1200 | зеркало A | см. A |
| A Electronics Required Active Factory Capacity | 0.92 → Electronics Capacity Planning Factor; Minimum 5 | Отраслевая policy Electronics | См. CAPITAL_LIFECYCLE_AUDIT §5 (planning factor и minimum active вынесены в константы Electronics Capacity Planning Factor / Minimum Active Factory Capacity). |

## Аннотированные параметры

| Параметр | Вид | Значение | Роль | Что меняет в поведении | Доказательство |
|---|---|---:|---|---|---|
| A Electronics Capacity Planning Signal | initial_stock | 1.25793 / 48.83148 | Начальный 60-дневный сигнал планирования электронных мощностей (A 1.26 / B 48.8). | Соответствует v7.3-специализации (A почти не производит, B ~45). В v7.4 Mode 17 A перепланируется с 1.3 к ~22 — часть переходной динамики первых сотен дней. | Mode 17 series. |
| A Electronics Capital Goods per Capacity | constant | 11.5 | Capital-goods units required for one unit of new electronics installed capacity in colony A. | Scales both total equipment demand and physical equipment consumption generated by sector expansion. | Start value 11.5 from V7_5_ARCHITECTURE_SPEC §2. It is a calibration coefficient; the refinery/electronics starts are heuristically tied to legacy financial capital-cost scale, not a physical measurement. |
| A Electronics Domestic Supply Signal | initial_stock | 20 / 16 | Начальный сигнал локального предложения электроники (= базовому спросу 20 / 16). | Инициализация realized import share без стартового скачка. |  |
| A Electronics Energy per Unit | constant | 12 | Энергоёмкость электроники (12; симметрично). | Electronics — второй потребитель энергии (A 22 × 12 ≈ 264). Одинакова у A и B: у B нет технологического преимущества в электронике. |  |
| A Electronics Feedstock Base Cost | constant | 18 / 3 | Legacy-цена экзогенного feedstock (A 18 / B 3). Действует только при Intermediate Inputs Enabled = 0 (Modes 0–16). | В v7.3 — единственный источник преимущества B в электронике (B→A 21.7/день). В v7.4 при switch=1 не используется: вход = металл по Market Price. Исчезновение этого «подарка» и есть причина переворота специализации. | Mode 12 vs 17: Electronics B→A 21.7 → 0. |
| A Electronics Labor per Unit | constant | 0.05 | Трудоёмкость электроники (0.05; симметрично). | Wage × 0.05 в Electronics Unit Cost. |  |
| A Electronics Local Base Demand | constant | 20 / 16 | Базовый конечный спрос на электронику (A 20 / B 16 /день). | Масштаб рынка электроники; в v7.4 обе колонии производят примерно под свой спрос (A 22, B 15 @1080). | Mode 17 @1080. |
| A Electronics Reference Price | constant | 28 | Референсная цена электроники (28; симметрично). | То же для электроники. В v7.4 unit cost A 13.75 / B 16.7 с наценкой 18 % — оба ниже 28, спрос выше базового. |  |
| A Electronics Target Inventory | constant | 500 | Целевой запас электроники (500; симметрично). | То же для электроники (Electronics Shortage → Domestic Offer Price; Desired Production). |  |
| A Feedstock per Electronics | constant | 1 | Legacy-расход feedstock на единицу электроники (1; только при switch=0). | В v7.4 заменён на Metal per Electronics. |  |
| A Test 13 Electronics Demand Applies | constant | 1 / 0 | Флаг применимости electronics-demand шока Mode 13 к колонии A; значение 1. | При 1 разрешает существующий множитель v7.3 Temporary Electronics Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |  |
| A Test 14 Electronics Demand Applies | constant | 1 / 0 | Флаг применимости electronics-demand шока Mode 14 к колонии A; значение 1. | При 1 разрешает существующий множитель v7.3 Sustained Electronics Growth Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |  |
| A Test 15 Electronics Demand Applies | constant | 0 / 1 | Флаг применимости electronics-demand шока Mode 15 к колонии A; значение 0. | При 1 разрешает существующий множитель v7.3 Electronics Demand Collapse Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |  |
| A Test 19 Electronics Demand Applies | constant | 1 / 0 | Флаг применимости electronics-demand шока Mode 19 к колонии A; значение 1. | При 1 разрешает существующий множитель v7.4 Coupled Electronics Growth Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |  |
| A Test 23 Electronics Demand Applies | constant | 1 / 0 | Applicability flag for Mode 23 electronics-demand shock in colony A. | 1 applies the shared ×4 demand multiplier; 0 substitutes exact neutral multiplier 1. | Scenario wiring from V7_5_ARCHITECTURE_SPEC §4: A=1, B=0; test-only parameter. |
| A Test 5 Electronics Demand Applies | constant | 1 / 0 | Флаг применимости electronics-demand шока Mode 5 к колонии A; значение 1. | При 1 разрешает существующий множитель Electronics Demand Surge Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |  |
| A Test 7 Electronics Demand Applies | constant | 1 / 0 | Флаг применимости electronics-demand шока Mode 7 к колонии A; значение 1. | При 1 разрешает существующий множитель Two Good Demand Surge Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |  |
| A Test 8 Electronics Demand Applies | constant | 1 / 0 | Флаг применимости electronics-demand шока Mode 8 к колонии A; значение 1. | При 1 разрешает существующий множитель Priority Stress Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |  |
| A Test 9 Electronics Demand Applies | constant | 1 / 0 | Флаг применимости electronics-demand шока Mode 9 к колонии A; значение 1. | При 1 разрешает существующий множитель Two Industry Energy Stress Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |  |
| B Electronics Capacity Planning Signal | initial_stock | 48.83148 / 1.25793 | Начальный 60-дневный сигнал планирования электронных мощностей (A 1.26 / B 48.8). | Соответствует v7.3-специализации (A почти не производит, B ~45). В v7.4 Mode 17 A перепланируется с 1.3 к ~22 — часть переходной динамики первых сотен дней. | Mode 17 series. |
| B Electronics Capital Goods per Capacity | constant | 11.5 | Capital-goods units required for one unit of new electronics installed capacity in colony B. | Scales both total equipment demand and physical equipment consumption generated by sector expansion. | Start value 11.5 from V7_5_ARCHITECTURE_SPEC §2. It is a calibration coefficient; the refinery/electronics starts are heuristically tied to legacy financial capital-cost scale, not a physical measurement. |
| B Electronics Domestic Supply Signal | initial_stock | 16 / 20 | Начальный сигнал локального предложения электроники (= базовому спросу 20 / 16). | Инициализация realized import share без стартового скачка. |  |
| B Electronics Energy per Unit | constant | 12 | Энергоёмкость электроники (12; симметрично). | Electronics — второй потребитель энергии (A 22 × 12 ≈ 264). Одинакова у A и B: у B нет технологического преимущества в электронике. |  |
| B Electronics Feedstock Base Cost | constant | 3 / 18 | Legacy-цена экзогенного feedstock (A 18 / B 3). Действует только при Intermediate Inputs Enabled = 0 (Modes 0–16). | В v7.3 — единственный источник преимущества B в электронике (B→A 21.7/день). В v7.4 при switch=1 не используется: вход = металл по Market Price. Исчезновение этого «подарка» и есть причина переворота специализации. | Mode 12 vs 17: Electronics B→A 21.7 → 0. |
| B Electronics Labor per Unit | constant | 0.05 | Трудоёмкость электроники (0.05; симметрично). | Wage × 0.05 в Electronics Unit Cost. |  |
| B Electronics Local Base Demand | constant | 16 / 20 | Базовый конечный спрос на электронику (A 20 / B 16 /день). | Масштаб рынка электроники; в v7.4 обе колонии производят примерно под свой спрос (A 22, B 15 @1080). | Mode 17 @1080. |
| B Electronics Reference Price | constant | 28 | Референсная цена электроники (28; симметрично). | То же для электроники. В v7.4 unit cost A 13.75 / B 16.7 с наценкой 18 % — оба ниже 28, спрос выше базового. |  |
| B Electronics Target Inventory | constant | 500 | Целевой запас электроники (500; симметрично). | То же для электроники (Electronics Shortage → Domestic Offer Price; Desired Production). |  |
| B Feedstock per Electronics | constant | 1 | Legacy-расход feedstock на единицу электроники (1; только при switch=0). | В v7.4 заменён на Metal per Electronics. |  |
| B Test 13 Electronics Demand Applies | constant | 0 / 1 | Флаг применимости electronics-demand шока Mode 13 к колонии B; значение 0. | При 1 разрешает существующий множитель v7.3 Temporary Electronics Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |  |
| B Test 14 Electronics Demand Applies | constant | 0 / 1 | Флаг применимости electronics-demand шока Mode 14 к колонии B; значение 0. | При 1 разрешает существующий множитель v7.3 Sustained Electronics Growth Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |  |
| B Test 15 Electronics Demand Applies | constant | 1 / 0 | Флаг применимости electronics-demand шока Mode 15 к колонии B; значение 1. | При 1 разрешает существующий множитель v7.3 Electronics Demand Collapse Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |  |
| B Test 19 Electronics Demand Applies | constant | 0 / 1 | Флаг применимости electronics-demand шока Mode 19 к колонии B; значение 0. | При 1 разрешает существующий множитель v7.4 Coupled Electronics Growth Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |  |
| B Test 23 Electronics Demand Applies | constant | 0 / 1 | Applicability flag for Mode 23 electronics-demand shock in colony B. | 1 applies the shared ×4 demand multiplier; 0 substitutes exact neutral multiplier 1. | Scenario wiring from V7_5_ARCHITECTURE_SPEC §4: A=1, B=0; test-only parameter. |
| B Test 5 Electronics Demand Applies | constant | 0 / 1 | Флаг применимости electronics-demand шока Mode 5 к колонии B; значение 0. | При 1 разрешает существующий множитель Electronics Demand Surge Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |  |
| B Test 7 Electronics Demand Applies | constant | 0 / 1 | Флаг применимости electronics-demand шока Mode 7 к колонии B; значение 0. | При 1 разрешает существующий множитель Two Good Demand Surge Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |  |
| B Test 8 Electronics Demand Applies | constant | 0 / 1 | Флаг применимости electronics-demand шока Mode 8 к колонии B; значение 0. | При 1 разрешает существующий множитель Priority Stress Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |  |
| B Test 9 Electronics Demand Applies | constant | 0 / 1 | Флаг применимости electronics-demand шока Mode 9 к колонии B; значение 0. | При 1 разрешает существующий множитель Two Industry Energy Stress Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю A/B-направленность теста в общей зеркальной цепочке. |  |
| Electronics Activation Time | constant | 30 | Отраслевая policy kernel капитала (30 д). | Не часть kernel-контракта — отраслевая параметризация (KERNEL_SPEC §4.3). Сравнение секторов: CAPITAL_LIFECYCLE_SECTOR_MAPPING, последняя таблица. |  |
| Electronics Construction Time | constant | 240 | Отраслевая policy kernel капитала (240 д). | Не часть kernel-контракта — отраслевая параметризация (KERNEL_SPEC §4.3). Сравнение секторов: CAPITAL_LIFECYCLE_SECTOR_MAPPING, последняя таблица. |  |
| Electronics Import Share Sensitivity | constant | 100 | То же для электроники (100). | См. Import Share Sensitivity. |  |
| Electronics Mothball Time | constant | 30 | Отраслевая policy kernel капитала (30 д). | Не часть kernel-контракта — отраслевая параметризация (KERNEL_SPEC §4.3). Сравнение секторов: CAPITAL_LIFECYCLE_SECTOR_MAPPING, последняя таблица. |  |
| Electronics per Capital Goods Unit | constant | 0.5 | Electronics input coefficient of one abstract capital-goods unit. | Scales electronics withdrawn from local Electronics Inventory by the capital-goods production rate. | Start value 0.5 is specified by V7_5_ARCHITECTURE_SPEC §2; calibration parameter, no physical justification at this aggregation level. |
| Electronics Strategic Reserve Fraction | constant | 0.25 | Отраслевая policy kernel капитала (0.25). | Не часть kernel-контракта — отраслевая параметризация (KERNEL_SPEC §4.3). Сравнение секторов: CAPITAL_LIFECYCLE_SECTOR_MAPPING, последняя таблица. |  |
| Metal per Electronics | constant | 0.25 | Материалоёмкость электроники по металлу (0.25 металла на единицу), глобальная. | Сила связи Metal→Electronics: спрос Electronics на металл = выпуск × 0.25 (A ~5.5, B ~3.7/день в Mode 17); вход в себестоимость = 0.25 × Market Price (≈7.6 у A, 9.4 у B) вместо legacy 18/3. При 1.0 связь удвоила бы спрос на металл. Не подгонялся к Mode 12; переворот специализации — следствие того, что у B нет собственного преимущества в электронике. | V7_4_ARCHITECTURE_SPEC §6; ACCEPTANCE_R2 §4. |
| A Wage | constant | 100 / 140 | Ставка труда (A 100 / B 140). | Входит в Metal Unit Cost (0.1×) и Electronics Unit Cost (0.05×): B дороже на 4/ед. металла и 2/ед. электроники. В v7.4 после исчезновения дешёвого feedstock B — второй фактор, из-за которого B теряет преимущество в электронике. | Electronics Unit Cost Mode 17 @1080: A 13.75, B 16.71. |
| B Wage | constant | 140 / 100 | Ставка труда (A 100 / B 140). | Входит в Metal Unit Cost (0.1×) и Electronics Unit Cost (0.05×): B дороже на 4/ед. металла и 2/ед. электроники. В v7.4 после исчезновения дешёвого feedstock B — второй фактор, из-за которого B теряет преимущество в электронике. | Electronics Unit Cost Mode 17 @1080: A 13.75, B 16.71. |
| A Labor per Metal | constant | 0.1 | Трудоёмкость металла (0.1; симметрично). | Wage × 0.1 в Metal Unit Cost. |  |
| A Metal Buffer | constant | 10 | Мягкость нормирования металла (10 единиц; симметрично). | Фактор доступности Inventory/(Inventory+10) для Local Sales и (v7.4) для поставок Electronics. При запасе ~300–500 даёт 0.97–0.98: физическое нормирование почти не проявляется, пока запас не опустошён; дефицит идёт через цену. Уменьшить буфер нельзя без переоценки всех сценариев — это меняет форму реакции всех рынков металла. | ACCEPTANCE_R2 §6; Mode 18: fulfillment A min 0.927 при запасе 127. |
| A Metal Target Inventory | constant | 500 | Целевой запас металла (500; симметрично). | Через Metal Shortage задаёт дефицитную надбавку к Domestic Offer Price и слагаемое в Desired Smelting Rate. |  |
| A Mining Capacity | constant | 70 / 28 | Потолок добычи руды (A 70 / B 28 ore/день). | Мягкий потолок Mining Rate. У A в baseline не связывает (добыча ~55); у B в связанном мире добыча ~11 ≪ 28. Именно поэтому шок Mode 18 сделан у A: ×0.5 у A режет плавку 39→25, ×0.5 у B ничего не меняет. | FEEDBACK_R1 §5; Mode 18 series. |
| A Ore Base Cost | constant | 4 / 14 | Стоимость руды колонии (A 4 / B 14) — главный источник сравнительного преимущества A в металле. | Определяет Ore Price → Metal Unit Cost → Domestic Offer → Market Price. Разрыв ×3.5 делает металл A дешевле (Mode 17 @1080: 30.5 vs 37.4) и задаёт направление торговли металлом A→B на всех сценариях. В v7.4 через Feedstock Price = Market Price это же преимущество переносится на электронику. | Mode 12/17 таблицы (ACCEPTANCE_R2); Mode 4 (Reverse Advantage) меняет именно этот параметр и разворачивает торговлю. |
| A Ore per Metal | constant | 1.4 | Расход руды на металл (1.4; симметрично). | Материалоёмкость плавки; вместе с Ore Base Cost задаёт сырьевую часть Metal Unit Cost (A 5.6, B 19.6). |  |
| A Reference Metal Price | constant | 40 | Референсная цена металла для эластичности спроса (40; симметрично). | Local Demand = Base × (40 / Market Price)^elasticity: при цене ниже 40 спрос выше базового и наоборот. В Mode 18 цена B 57 → спрос B падает. | Mode 18 series. |
| A Refinery Active Capacity | initial_stock | 35 / 28 | Начальная активная мощность refinery (= installed). | Старт без mothballed-резерва. |  |
| A Refinery Capital Goods per Capacity | constant | 17 | Capital-goods units required for one unit of new refinery installed capacity in colony A. | Scales both total equipment demand and physical equipment consumption generated by sector expansion. | Start value 17 from V7_5_ARCHITECTURE_SPEC §2. It is a calibration coefficient; the refinery/electronics starts are heuristically tied to legacy financial capital-cost scale, not a physical measurement. |
| A Refinery Installed Capacity | initial_stock | 35 / 28 | Начальная установленная мощность refinery (A 35 / B 28). | Стартовый капитал плавки; далее эндогенно: A растёт до 57–61 к 1080, B сжимается до 2–8 (импорт вместо плавки). | Mode 12: A 57.7, B 2.1; Mode 17: A 61.3, B 8.2. |
| A Test 16 Metal Demand Applies | constant | 0 / 1 | Флаг применимости metal-demand шока Mode 16 к колонии A; значение 0. | При 1 разрешает существующий множитель v7.3 Sustained Metal Demand Growth Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |  |
| A Test 18 Mining Shock Applies | constant | 1 / 0 | Флаг применимости Mode 18 mining shock к колонии A; значение 1. | Сохраняет исходную семантику v7.4: supply shock действует только на A, при этом обе Effective Mining Capacity используют одну зеркальную формулу. |  |
| A Test 2 Metal Demand Applies | constant | 0 / 1 | Флаг применимости metal-demand шока Mode 2 к колонии A; значение 0. | При 1 разрешает существующий множитель Transport Demand Surge Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |  |
| A Test 20 Metal Demand Applies | constant | 0 / 1 | Флаг применимости metal-demand шока Mode 20 к колонии A; значение 0. | При 1 разрешает существующий множитель v7.4 Coupled Metal Demand Growth Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |  |
| A Test 3 Metal Demand Applies | constant | 0 / 1 | Флаг применимости metal-demand шока Mode 3 к колонии A; значение 0. | При 1 разрешает существующий множитель Low Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |  |
| A Test 7 Metal Demand Applies | constant | 0 / 1 | Флаг применимости metal-demand шока Mode 7 к колонии A; значение 0. | При 1 разрешает существующий множитель Two Good Demand Surge Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |  |
| A Test 8 Metal Demand Applies | constant | 0 / 1 | Флаг применимости metal-demand шока Mode 8 к колонии A; значение 0. | При 1 разрешает существующий множитель Priority Stress Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |  |
| A Test 9 Metal Demand Applies | constant | 0 / 1 | Флаг применимости metal-demand шока Mode 9 к колонии A; значение 0. | При 1 разрешает существующий множитель Two Industry Energy Stress Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |  |
| B Labor per Metal | constant | 0.1 | Трудоёмкость металла (0.1; симметрично). | Wage × 0.1 в Metal Unit Cost. |  |
| B Metal Buffer | constant | 10 | Мягкость нормирования металла (10 единиц; симметрично). | Фактор доступности Inventory/(Inventory+10) для Local Sales и (v7.4) для поставок Electronics. При запасе ~300–500 даёт 0.97–0.98: физическое нормирование почти не проявляется, пока запас не опустошён; дефицит идёт через цену. Уменьшить буфер нельзя без переоценки всех сценариев — это меняет форму реакции всех рынков металла. | ACCEPTANCE_R2 §6; Mode 18: fulfillment A min 0.927 при запасе 127. |
| B Metal Target Inventory | constant | 500 | Целевой запас металла (500; симметрично). | Через Metal Shortage задаёт дефицитную надбавку к Domestic Offer Price и слагаемое в Desired Smelting Rate. |  |
| B Mining Capacity | constant | 28 / 70 | Потолок добычи руды (A 70 / B 28 ore/день). | Мягкий потолок Mining Rate. У A в baseline не связывает (добыча ~55); у B в связанном мире добыча ~11 ≪ 28. Именно поэтому шок Mode 18 сделан у A: ×0.5 у A режет плавку 39→25, ×0.5 у B ничего не меняет. | FEEDBACK_R1 §5; Mode 18 series. |
| B Ore Base Cost | constant | 14 / 4 | Стоимость руды колонии (A 4 / B 14) — главный источник сравнительного преимущества A в металле. | Определяет Ore Price → Metal Unit Cost → Domestic Offer → Market Price. Разрыв ×3.5 делает металл A дешевле (Mode 17 @1080: 30.5 vs 37.4) и задаёт направление торговли металлом A→B на всех сценариях. В v7.4 через Feedstock Price = Market Price это же преимущество переносится на электронику. | Mode 12/17 таблицы (ACCEPTANCE_R2); Mode 4 (Reverse Advantage) меняет именно этот параметр и разворачивает торговлю. |
| B Ore per Metal | constant | 1.4 | Расход руды на металл (1.4; симметрично). | Материалоёмкость плавки; вместе с Ore Base Cost задаёт сырьевую часть Metal Unit Cost (A 5.6, B 19.6). |  |
| B Reference Metal Price | constant | 40 | Референсная цена металла для эластичности спроса (40; симметрично). | Local Demand = Base × (40 / Market Price)^elasticity: при цене ниже 40 спрос выше базового и наоборот. В Mode 18 цена B 57 → спрос B падает. | Mode 18 series. |
| B Refinery Active Capacity | initial_stock | 28 / 35 | Начальная активная мощность refinery (= installed). | Старт без mothballed-резерва. |  |
| B Refinery Capital Goods per Capacity | constant | 17 | Capital-goods units required for one unit of new refinery installed capacity in colony B. | Scales both total equipment demand and physical equipment consumption generated by sector expansion. | Start value 17 from V7_5_ARCHITECTURE_SPEC §2. It is a calibration coefficient; the refinery/electronics starts are heuristically tied to legacy financial capital-cost scale, not a physical measurement. |
| B Refinery Installed Capacity | initial_stock | 28 / 35 | Начальная установленная мощность refinery (A 35 / B 28). | Стартовый капитал плавки; далее эндогенно: A растёт до 57–61 к 1080, B сжимается до 2–8 (импорт вместо плавки). | Mode 12: A 57.7, B 2.1; Mode 17: A 61.3, B 8.2. |
| B Test 16 Metal Demand Applies | constant | 1 / 0 | Флаг применимости metal-demand шока Mode 16 к колонии B; значение 1. | При 1 разрешает существующий множитель v7.3 Sustained Metal Demand Growth Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |  |
| B Test 18 Mining Shock Applies | constant | 0 / 1 | Флаг применимости Mode 18 mining shock к колонии B; значение 0. | Сохраняет исходную семантику v7.4: supply shock действует только на A, при этом обе Effective Mining Capacity используют одну зеркальную формулу. |  |
| B Test 2 Metal Demand Applies | constant | 1 / 0 | Флаг применимости metal-demand шока Mode 2 к колонии B; значение 1. | При 1 разрешает существующий множитель Transport Demand Surge Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |  |
| B Test 20 Metal Demand Applies | constant | 1 / 0 | Флаг применимости metal-demand шока Mode 20 к колонии B; значение 1. | При 1 разрешает существующий множитель v7.4 Coupled Metal Demand Growth Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |  |
| B Test 3 Metal Demand Applies | constant | 1 / 0 | Флаг применимости metal-demand шока Mode 3 к колонии B; значение 1. | При 1 разрешает существующий множитель Low Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |  |
| B Test 7 Metal Demand Applies | constant | 1 / 0 | Флаг применимости metal-demand шока Mode 7 к колонии B; значение 1. | При 1 разрешает существующий множитель Two Good Demand Surge Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |  |
| B Test 8 Metal Demand Applies | constant | 1 / 0 | Флаг применимости metal-demand шока Mode 8 к колонии B; значение 1. | При 1 разрешает существующий множитель Priority Stress Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |  |
| B Test 9 Metal Demand Applies | constant | 1 / 0 | Флаг применимости metal-demand шока Mode 9 к колонии B; значение 1. | При 1 разрешает существующий множитель Two Industry Energy Stress Demand Multiplier; при 0 заменяет его точным нейтральным ×1. Сохраняет прежнюю одностороннюю семантику при зеркальной формуле A/B. |  |
| Metal Input Adjustment Time | constant | 20 | Время подстройки буфера металла у Electronics (20 д). | Скорость, с которой отклонение буфера от цели превращается в дополнительный спрос на поставки. |  |
| Metal Input Target Days | constant | 20 | Целевой буфер металла у Electronics в днях планируемого потребления (20). | Определяет Metal Input Target Inventory = pre-energy выпуск × 0.25 × 20 (A ~110, B ~75 единиц). Больше — больше запас и мягче реакция на перебои. | Mode 17 series: A Feedstock Inventory ~115 @1080. |
| Metal per Capital Goods Unit | constant | 1 | Metal input coefficient of one abstract capital-goods unit. | Scales metal withdrawn from local Metal Inventory by the capital-goods production rate. | Start value 1 is specified by V7_5_ARCHITECTURE_SPEC §2; calibration parameter, no physical justification at this aggregation level. |
| Refinery Construction Time | constant | 180 | Отраслевая policy kernel капитала (180 д). | Не часть kernel-контракта — отраслевая параметризация (KERNEL_SPEC §4.3). Сравнение секторов: CAPITAL_LIFECYCLE_SECTOR_MAPPING, последняя таблица. |  |
| Refinery Installed Reserve Factor | constant | 1.15 | Отраслевая policy kernel капитала (1.15). | Не часть kernel-контракта — отраслевая параметризация (KERNEL_SPEC §4.3). Сравнение секторов: CAPITAL_LIFECYCLE_SECTOR_MAPPING, последняя таблица. |  |
| Refinery Operating Reserve Factor | constant | 1.1 | Отраслевая policy kernel капитала (1.10). | Не часть kernel-контракта — отраслевая параметризация (KERNEL_SPEC §4.3). Сравнение секторов: CAPITAL_LIFECYCLE_SECTOR_MAPPING, последняя таблица. |  |
| A Capital Goods Base Production Capacity | constant | 2 / 1 | Baseline maximum production scale of the A capital-goods sector. | Enters the soft production-capacity cap and is the quantity reduced by Mode 22 test wiring. | Start value 2 from V7_5_ARCHITECTURE_SPEC §2; calibration parameter without physical justification at this stage. |
| A Capital Goods Inventory | initial_stock | 30 | Initial local stock of abstract capital goods in colony A. | Provides initial working inventory before endogenous production and construction consumption settle. | Initial value 30 from the verified skeleton; calibration initial condition without physical justification at this stage. |
| A Domestic Supply Signal | initial_stock | 16 / 22 | Начальный сигнал локального предложения металла (16 / 22). | То же для металла. |  |
| A Local Base Demand | constant | 16 / 22 | Базовый конечный спрос на металл (A 16 / B 22 /день). | Масштаб конечного рынка металла; B — больший потребитель при меньшей добыче → структурный импорт металла B из A (~21–23/день). | Shipment Rate A→B: 23.1 (Mode 12), 20.8 (Mode 17). |
| A Test 22 Capital Goods Shock Applies | constant | 1 / 0 | Applicability flag for Mode 22 capital-goods supply shock in colony A. | 1 applies the shared 0.3 production-capacity multiplier; 0 substitutes exact neutral multiplier 1. | Scenario wiring from V7_5_ARCHITECTURE_SPEC §4: A=1, B=0; test-only parameter. |
| A Test 4 Headroom Applies | constant | 0 / 1 | Флаг применимости legacy power headroom Mode 4 к колонии A; значение 0. | Оборачивает существующий общий power multiplier через IfThenElse(flag=1, multiplier, 1), сохраняя старую одностороннюю тестовую обвязку при зеркальной формуле. |  |
| A Test 6 Headroom Applies | constant | 1 / 0 | Флаг применимости legacy power headroom Mode 6 к колонии A; значение 1. | Оборачивает существующий общий power multiplier через IfThenElse(flag=1, multiplier, 1), сохраняя старую одностороннюю тестовую обвязку при зеркальной формуле. |  |
| B Capital Goods Base Production Capacity | constant | 1 / 2 | Baseline maximum production scale of the B capital-goods sector. | Enters the soft production-capacity cap and is the quantity reduced by Mode 22 test wiring. | Start value 1 from V7_5_ARCHITECTURE_SPEC §2; calibration parameter without physical justification at this stage. |
| B Capital Goods Inventory | initial_stock | 30 | Initial local stock of abstract capital goods in colony B. | Provides initial working inventory before endogenous production and construction consumption settle. | Initial value 30 from the verified skeleton; calibration initial condition without physical justification at this stage. |
| B Domestic Supply Signal | initial_stock | 22 / 16 | Начальный сигнал локального предложения металла (16 / 22). | То же для металла. |  |
| B Local Base Demand | constant | 22 / 16 | Базовый конечный спрос на металл (A 16 / B 22 /день). | Масштаб конечного рынка металла; B — больший потребитель при меньшей добыче → структурный импорт металла B из A (~21–23/день). | Shipment Rate A→B: 23.1 (Mode 12), 20.8 (Mode 17). |
| B Test 22 Capital Goods Shock Applies | constant | 0 / 1 | Applicability flag for Mode 22 capital-goods supply shock in colony B. | 1 applies the shared 0.3 production-capacity multiplier; 0 substitutes exact neutral multiplier 1. | Scenario wiring from V7_5_ARCHITECTURE_SPEC §4: A=1, B=0; test-only parameter. |
| B Test 4 Headroom Applies | constant | 1 / 0 | Флаг применимости legacy power headroom Mode 4 к колонии B; значение 1. | Оборачивает существующий общий power multiplier через IfThenElse(flag=1, multiplier, 1), сохраняя старую одностороннюю тестовую обвязку при зеркальной формуле. |  |
| B Test 6 Headroom Applies | constant | 0 / 1 | Флаг применимости legacy power headroom Mode 6 к колонии B; значение 0. | Оборачивает существующий общий power multiplier через IfThenElse(flag=1, multiplier, 1), сохраняя старую одностороннюю тестовую обвязку при зеркальной формуле. |  |
| Capital Goods Adjustment Time | constant | 20 | First-order inventory correction time for desired capital-goods production. | Controls how quickly production responds to the gap between target and actual capital-goods inventory. | Start value 20 days from V7_5_ARCHITECTURE_SPEC §2; calibration parameter. |
| Capital Goods Buffer Days | constant | 1 | Soft-normalization buffer in Capital Goods Fulfillment = Inventory/(Inventory+Buffer). | Larger values reduce fulfillment for a given inventory and therefore slow all three local construction sectors proportionally. | Value 0.5 is explicitly fixed by V7_5_ARCHITECTURE_SPEC §2 after the skeleton showed Buffer=2 capped normal fulfillment near 0.86. |
| Capital Goods Target Days | constant | 30 | Target inventory coverage for the capital-goods sector. | Raises or lowers desired equipment inventory relative to current desired construction demand. | Start value 30 days from V7_5_ARCHITECTURE_SPEC §2; calibration parameter, no physical justification at this stage. |
| A Energy Demand Signal | initial_stock | 1100 / 480 | Начальный 3-дневный сигнал спроса на энергию (A 1100 / B 480). | Инициализация ценового сигнала дефицита энергии. |  |
| A Energy per Metal | constant | 30 | Энергоёмкость металла (30; симметрично). | Металл — главный потребитель энергии: плавка A ~45/день × 30 = 1350 из ~1680 запрошенной энергии A. Поэтому рост плавки под связью (Mode 17/19) тянет энергодефицит A. | Mode 17: A Total Requested Energy 1676 @1080. |
| A Legacy Power Installed Generation Capacity | constant | 1350 / 550 | Фиксированная генерация legacy-режима (A 1350 / B 550) при Capital Lifecycle Enabled = 0. | В Modes 0–11 мощность генерации постоянна; при lifecycle=1 заменяется стоком Power Installed Generation Capital с тем же стартом. |  |
| A Power Active Generation Capital | initial_stock | 1350 / 550 | Начальная активная генерация (= installed: 1350 / 550). | Старт без mothballed-резерва в энергетике. |  |
| A Power Capacity Planning Signal | initial_stock | 1316.4467 / 537.2232 | Начальное значение сглаженного (60 д) сигнала планирования генерации (A 1316 / B 537). | Инициализация в согласии с baseline-нагрузкой, чтобы Mode 12 не начинался с искусственного планового скачка. |  |
| A Power Capital Goods per Capacity | constant | 0.5 | Capital-goods units required for one unit of new power installed capacity in colony A. | Scales both total equipment demand and physical equipment consumption generated by sector expansion. | Start value 0.5 from V7_5_ARCHITECTURE_SPEC §2. It is a calibration coefficient; the refinery/electronics starts are heuristically tied to legacy financial capital-cost scale, not a physical measurement. |
| A Power Generation Cost | constant | 0.08 / 0.03 | Себестоимость генерации (A 0.08 / B 0.03 за единицу энергии). | Базовая цена энергии до дефицитной надбавки; B энергетически дешевле, но энергия не торгуется, поэтому это влияет только на локальные unit cost (Energy per Metal 30 → 2.4 vs 0.9 на единицу металла). | Mode 10 (Cheap Energy) тестирует именно этот канал. |
| A Power Installed Generation Capital | initial_stock | 1350 / 550 | Начальная установленная генерация (A 1350 / B 550). | Стартовая точка lifecycle-энергетики; A с большим промышленным сектором стартует с большим парком. В связанном baseline A растёт до 1610 к 1080 при требуемых 1701 — источник остаточного энергодефицита A. | Mode 17: A Power Installed 1402 → 1610. |
| A Test 11 Generation Shock Applies | constant | 1 / 0 | Флаг применимости generation shock Mode 11 к колонии A; значение 1. | Оборачивает существующий общий power multiplier через IfThenElse(flag=1, multiplier, 1), сохраняя старую одностороннюю тестовую обвязку при зеркальной формуле. |  |
| A Test 25 Power Resource Shock Applies | constant | 1 / 0 | Applicability flag for the Mode 25 power-resource supply shock in colony A. | 1 applies the shared Power Resource Shock Factor (0.1) to A extraction inside the standard shock window; 0 substitutes the exact neutral multiplier 1. A=1, B=0 keeps the experiment one-sided while both formulas stay mirrored. | Mode 25 run (r2 acceptance, 2026-09-25): A fulfillment 1.00 -> 0.107 inside [360,720], B stays at 1.00 throughout. |
| A Test 26 Energy Kernel Capacity Shock Applies | constant | 1 / 0 | Applicability flag for the Mode 26 capacity-only control shock in colony A. | 1 applies the shared Energy Kernel Capacity Shock Factor to A active generation capacity; 0 substitutes the exact neutral multiplier 1. A=1, B=0. | Mode 26 run (r2 acceptance, 2026-09-25): A capacity 1359 -> 660 inside the window with resource fulfillment held at 1.00; B unaffected. |
| B Energy Demand Signal | initial_stock | 480 / 1100 | Начальный 3-дневный сигнал спроса на энергию (A 1100 / B 480). | Инициализация ценового сигнала дефицита энергии. |  |
| B Energy per Metal | constant | 30 | Энергоёмкость металла (30; симметрично). | Металл — главный потребитель энергии: плавка A ~45/день × 30 = 1350 из ~1680 запрошенной энергии A. Поэтому рост плавки под связью (Mode 17/19) тянет энергодефицит A. | Mode 17: A Total Requested Energy 1676 @1080. |
| B Legacy Power Installed Generation Capacity | constant | 550 / 1350 | Фиксированная генерация legacy-режима (A 1350 / B 550) при Capital Lifecycle Enabled = 0. | В Modes 0–11 мощность генерации постоянна; при lifecycle=1 заменяется стоком Power Installed Generation Capital с тем же стартом. |  |
| B Power Active Generation Capital | initial_stock | 550 / 1350 | Начальная активная генерация (= installed: 1350 / 550). | Старт без mothballed-резерва в энергетике. |  |
| B Power Capacity Planning Signal | initial_stock | 537.2232 / 1316.4467 | Начальное значение сглаженного (60 д) сигнала планирования генерации (A 1316 / B 537). | Инициализация в согласии с baseline-нагрузкой, чтобы Mode 12 не начинался с искусственного планового скачка. |  |
| B Power Capital Goods per Capacity | constant | 0.5 | Capital-goods units required for one unit of new power installed capacity in colony B. | Scales both total equipment demand and physical equipment consumption generated by sector expansion. | Start value 0.5 from V7_5_ARCHITECTURE_SPEC §2. It is a calibration coefficient; the refinery/electronics starts are heuristically tied to legacy financial capital-cost scale, not a physical measurement. |
| B Power Generation Cost | constant | 0.03 / 0.08 | Себестоимость генерации (A 0.08 / B 0.03 за единицу энергии). | Базовая цена энергии до дефицитной надбавки; B энергетически дешевле, но энергия не торгуется, поэтому это влияет только на локальные unit cost (Energy per Metal 30 → 2.4 vs 0.9 на единицу металла). | Mode 10 (Cheap Energy) тестирует именно этот канал. |
| B Power Installed Generation Capital | initial_stock | 550 / 1350 | Начальная установленная генерация (A 1350 / B 550). | Стартовая точка lifecycle-энергетики; A с большим промышленным сектором стартует с большим парком. В связанном baseline A растёт до 1610 к 1080 при требуемых 1701 — источник остаточного энергодефицита A. | Mode 17: A Power Installed 1402 → 1610. |
| B Test 11 Generation Shock Applies | constant | 0 / 1 | Флаг применимости generation shock Mode 11 к колонии B; значение 0. | Оборачивает существующий общий power multiplier через IfThenElse(flag=1, multiplier, 1), сохраняя старую одностороннюю тестовую обвязку при зеркальной формуле. |  |
| B Test 25 Power Resource Shock Applies | constant | 0 / 1 | Applicability flag for the Mode 25 power-resource supply shock in colony B. | 1 applies the shared Power Resource Shock Factor (0.1) to B extraction inside the standard shock window; 0 substitutes the exact neutral multiplier 1. A=1, B=0 keeps the experiment one-sided while both formulas stay mirrored. | Mode 25 run (r2 acceptance, 2026-09-25): A fulfillment 1.00 -> 0.107 inside [360,720], B stays at 1.00 throughout. |
| B Test 26 Energy Kernel Capacity Shock Applies | constant | 0 / 1 | Applicability flag for the Mode 26 capacity-only control shock in colony B. | 1 applies the shared Energy Kernel Capacity Shock Factor to B active generation capacity; 0 substitutes the exact neutral multiplier 1. A=1, B=0. | Mode 26 run (r2 acceptance, 2026-09-25): A capacity 1359 -> 660 inside the window with resource fulfillment held at 1.00; B unaffected. |
| Base Power Resource Price | constant | 0.04 | Base physical operating-resource price. | Adds an explicit resource-cost component to generation when Energy Kernel v2 is enabled. | v7.6 Energy Kernel v2 specification and Modes 25/26 validation contract. |
| Energy Kernel Capacity Shock Factor | constant | 0.6 | Mode-26 capacity test multiplier. | Creates a temporary A-only active-generation-capacity shock; test wiring only. | v7.6 Energy Kernel v2 specification and Modes 25/26 validation contract. |
| Energy Scarcity Price Strength | constant | 4 | Сила дефицитной надбавки к цене энергии (4). | Energy Price = Generation Cost × (1 + 4 × perceived scarcity). |  |
| Power Capacity Planning Adjustment Time | constant | 60 | Память планирования генерации (60 д). | Причина транзитных энергодефицитов (v7.3 ограничение №2): при быстром росте нагрузки мощность отстаёт. В связанном baseline A это даёт остаточные 72/день @1080 (снижаются). | Mode 12: дефицит A 126–375 д; Mode 17: 142 → 72. |
| Power Construction Time | constant | 360 | Время строительства генерации (360 д). | Вторая причина медленной сходимости энергетики. |  |
| Power Operating Reserve Factor | constant | 1.02 | Отраслевая policy kernel капитала (1.02). | Не часть kernel-контракта — отраслевая параметризация (KERNEL_SPEC §4.3). Сравнение секторов: CAPITAL_LIFECYCLE_SECTOR_MAPPING, последняя таблица. |  |
| Power Resource Buffer Days | constant | 2 | Target inventory coverage for the operating resource. | Controls how much stock is considered sufficient for full resource fulfillment and extraction planning. | v7.6 Energy Kernel v2 specification and Modes 25/26 validation contract. |
| Power Resource Extraction Adjustment Time | constant | 30 | Extraction-planning response time. | Controls recovery/replenishment dynamics of the abstract primary energy resource. | v7.6 Energy Kernel v2 specification and Modes 25/26 validation contract. |
| Power Resource Extraction Headroom | constant | 1.1 | Normal extraction headroom. | Allows replenishment above instantaneous demand and rebuilding of inventory. | v7.6 Energy Kernel v2 specification and Modes 25/26 validation contract. |
| Power Resource per Energy | constant | 1 | Physical intensity of the Energy Kernel v2 operating resource. | Scales resource demand and actual physical consumption per delivered energy unit. | v7.6 Energy Kernel v2 specification and Modes 25/26 validation contract. |
| Power Resource Scarcity Price Strength | constant | 4 | Resource scarcity price sensitivity. | Raises physical resource price as fulfillment falls. | v7.6 Energy Kernel v2 specification and Modes 25/26 validation contract. |
| Power Resource Shock Factor | constant | 0.5 | Mode-25 test multiplier. | Creates a temporary A-only resource-supply shock; test wiring only. 0.5 (since v7.6.1; 0.1 before) keeps A energy at ~45 % of the no-shock control over the window and leaves the same capital scar as the Mode 26 capacity control; 0.1 was a cut-off (~7 %). | v7.6 Energy Kernel v2 specification and Modes 25/26 validation contract; calibration sweep in docs/V7_6_1_CALIBRATION_REPORT.md; Mode 25 check "A energy is rationed, not cut off". |
| Power Strategic Reserve Fraction | constant | 0.05 | Отраслевая policy kernel капитала (0.05). | Не часть kernel-контракта — отраслевая параметризация (KERNEL_SPEC §4.3). Сравнение секторов: CAPITAL_LIFECYCLE_SECTOR_MAPPING, последняя таблица. |  |
| Capital Goods Enabled | switch | 1 | Master switch for v7.5 physical backing of Refinery / Electronics / Power expansion. | 0 preserves accepted v7.4.1 behavior exactly; 1 enables local capital-goods production, inventory fulfillment and physical consumption. | Architecture control parameter from V7_5_ARCHITECTURE_SPEC §0/§2; Modes 0–20 explicitly set 0, Modes 21–23 set 1. |
| Capital Lifecycle Enabled | switch | 1 | Переключатель v7.3 (1 в сыром файле; 0 в Modes 0–11; 1 в 12–20). | При 0 — Electronics/Power используют фиксированные legacy-мощности (v7.2 r4 бит-в-бит); при 1 — полный kernel капитала для Electronics и Power. К Refinery/Transport не применяется и применяться не должен (KERNEL_SPEC §5). | V7_3_R2_VALIDATION_REPORT §2. |
| Intermediate Inputs Enabled | switch | 1 | Переключатель v7.4 (1 в сыром файле; 0 в Modes 0–16; 1 в 17–20). | При 0 — точное воспроизведение v7.3 r2 (Feedstock из ∅ по legacy-цене). При 1 — металл как физический вход, Feedstock Extraction = 0, Feedstock Price = Market Price, Desired Smelting Rate += поставки. Только форма IfThenElse(switch, new, old). | CHECK_CANDIDATE r2: Modes 0–16 changed=0, maxAbs=0. |
| Priority Stress A Ore Base Cost | test_wiring | 4 | Нейтральная A-сторона override-константа ore base cost для Mode 8. | Равна A Ore Base Cost = 4; позволяет A Effective Ore Base Cost иметь ту же test chain, что B, сохраняя прежний результат. |  |
| Reverse A Mining Capacity | test_wiring | 70 | Нейтральная A-сторона override-константа mining capacity для Mode 4. | Равна A Mining Capacity = 70; симметризует ветку Reverse Advantage без изменения численного результата A. |  |
| Reverse A Wage | test_wiring | 100 | Нейтральная A-сторона override-константа Mode 4; зеркало Reverse B Wage. | Равна A Wage = 100, поэтому введение A Effective Wage не меняет A в Mode 4; позволяет сделать cost wiring A/B структурно зеркальным. |  |
| Test Shock End Day | test_wiring | 720 | Конец временного шока (720 д). | Окно Temporary Test Window = [360, 720). |  |
| Test Shock Start Day | test_wiring | 360 | Начало тестового шока (360 д). | Общий старт всех временных и постоянных шоков Modes 1–20. |  |
| v7.4 Coupled Electronics Growth Multiplier | test_wiring | 4 | Множитель спроса A на электронику в Mode 19 (4). | Постоянный ×4 с дня 360 — аналог Mode 14 со связью. |  |
| v7.4 Coupled Metal Demand Growth Multiplier | test_wiring | 2 | Множитель конечного спроса B на металл в Mode 20 (2). | Постоянный ×2 с дня 360 — аналог Mode 16 со связью. |  |
| v7.4 Metal Supply Shock Multiplier | test_wiring | 0.5 | Множитель шока добычи A в Mode 18 (0.5). | A Mining Capacity 70 → 35 в окне 360–720: связывает добычу (A mining ~55), иссушает руду к дню 480. | Mode 18 series. |
| v7.5 Capital Goods Shock Multiplier | test_wiring | 0.1 | Mode 22 test-only multiplier for capital-goods production capacity. | During day 360–720 it reduces the selected colony's effective capital-goods production capacity. | Test parameter fixed to 0.3 by V7_5_ARCHITECTURE_SPEC §4; not a physical world parameter. |
| v7.5 Investment Boom Multiplier | test_wiring | 4 | Mode 23 test-only multiplier for electronics local demand. | Creates sustained A electronics demand growth and therefore simultaneous demand for equipment from expanding sectors. | Test parameter fixed to 4 by V7_5_ARCHITECTURE_SPEC §4, matching the intended sustained-growth stress scale. |
| Export Reserve | constant | 100 | Запас металла, ниже которого экспортёр не продаёт (100). | Ограничивает экспорт при низком запасе — в Mode 18 A сокращает экспорт 17 → 5 при запасе 127. | Mode 18 series. |
| Import Share Sensitivity | constant | 100 | Чувствительность доли импорта к ценовому преимуществу (100). | Скорость, с которой покупатели переключаются на импорт при более дешёвом landed price; вместе с Import Inventory Adjustment Time (20 д) определяет, почему переворот электронной торговли в Mode 17 к дню 1080 ещё не завершён (A→B только 1.25). | Mode 17: Electronics A→B 0 → 0.12 → 1.25. |
| Transport Construction Time | constant | 120 | Отраслевая policy kernel капитала (120 д). | Не часть kernel-контракта — отраслевая параметризация (KERNEL_SPEC §4.3). Сравнение секторов: CAPITAL_LIFECYCLE_SECTOR_MAPPING, последняя таблица. |  |
| Transport Installed Throughput Capacity | initial_stock | 20 | Начальная пропускная способность транспорта (20 т/день). | Стартовый общий ресурс перевозок обоих товаров; далее эндогенно через Transport kernel. |  |
| Travel Time | constant | 10 | Время в пути A↔B (10 дней; глобально). | Задержка физических поставок (Cargo в пути) и фрахтовая часть landed price (Transit Cost 0.2/т·день). Не орбитальная физика — абстракция, одинаково годится для планетарных регионов. |  |

## Полный инвентарь по секторам

### Electronics

| Параметр | Вид | Колония | Значение | Зеркало | Описание в модели | Аннотация |
|---|---|---|---:|---:|---|:---:|
| A Electronics Active Factory Capacity | initial_stock | A | 45 | = | Electronics factory capacity in A currently staffed/operational and available to the production soft-cap. |  |
| A Electronics Base Markup | constant | A | 0.18 | = |  |  |
| A Electronics Buffer | constant | A | 10 | = |  |  |
| A Electronics Capacity Planning Signal | initial_stock | A | 1.25793 | **48.83148** | Smoothed desired electronics production used only for A factory-capital decisions. | ✓ |
| A Electronics Capital Goods per Capacity | constant | A | 11.5 | = | Capital-goods units consumed per unit of new A electronics factory installed capacity. | ✓ |
| A Electronics Decommissioning Factory Capacity | initial_stock | A | 0 | = | A electronics capital committed to permanent retirement but not yet fully dismantled. |  |
| A Electronics Demand Elasticity | constant | A | 0.6 | = |  |  |
| A Electronics Domestic Supply Signal | initial_stock | A | 20 | **16** |  | ✓ |
| A Electronics Energy per Unit | constant | A | 12 | = |  | ✓ |
| A Electronics Feedstock Adjustment Time | constant | A | 40 | = |  |  |
| A Electronics Feedstock Base Cost | constant | A | 18 | **3** |  | ✓ |
| A Electronics Feedstock Extraction Capacity | constant | A | 60 | = |  |  |
| A Electronics Feedstock Scarcity Strength | constant | A | 0.4 | = |  |  |
| A Electronics Import Supply Signal | initial_stock | A | 0 | = |  |  |
| A Electronics Installed Factory Capacity | initial_stock | A | 45 | = | Physical installed electronics production capital in A. New construction enters here; mothballing does not destroy it. |  |
| A Electronics Inventory | initial_stock | A | 500 | = |  |  |
| A Electronics Inventory Adjustment Time | constant | A | 30 | = |  |  |
| A Electronics Labor per Unit | constant | A | 0.05 | = |  | ✓ |
| A Electronics Local Base Demand | constant | A | 20 | **16** |  | ✓ |
| A Electronics Reference Price | constant | A | 28 | = |  | ✓ |
| A Electronics Retired Factory Capacity | initial_stock | A | 0 | = | Cumulative permanently retired electronics capacity in A. |  |
| A Electronics Scarcity Strength | constant | A | 1.5 | = |  |  |
| A Electronics Target Inventory | constant | A | 500 | = |  | ✓ |
| A Feedstock per Electronics | constant | A | 1 | = |  | ✓ |
| A Legacy Electronics Factory Capacity | constant | A | 45 | = | Accepted v7.2 fixed A electronics factory capacity used only when Capital Lifecycle Enabled = 0. |  |
| A Test 13 Electronics Demand Applies | constant | A | 1 | **0** | Applicability flag for Mode 13 electronics-demand test wiring in colony A. | ✓ |
| A Test 14 Electronics Demand Applies | constant | A | 1 | **0** | Applicability flag for Mode 14 electronics-demand test wiring in colony A. | ✓ |
| A Test 15 Electronics Demand Applies | constant | A | 0 | **1** | Applicability flag for Mode 15 electronics-demand test wiring in colony A. | ✓ |
| A Test 19 Electronics Demand Applies | constant | A | 1 | **0** | Applicability flag for Mode 19 electronics-demand test wiring in colony A. | ✓ |
| A Test 23 Electronics Demand Applies | constant | A | 1 | **0** | Applicability flag for Mode 23 electronics demand shock in colony A. | ✓ |
| A Test 5 Electronics Demand Applies | constant | A | 1 | **0** | Applicability flag for Mode 5 electronics-demand test wiring in colony A. | ✓ |
| A Test 7 Electronics Demand Applies | constant | A | 1 | **0** | Applicability flag for Mode 7 electronics-demand test wiring in colony A. | ✓ |
| A Test 8 Electronics Demand Applies | constant | A | 1 | **0** | Applicability flag for Mode 8 electronics-demand test wiring in colony A. | ✓ |
| A Test 9 Electronics Demand Applies | constant | A | 1 | **0** | Applicability flag for Mode 9 electronics-demand test wiring in colony A. | ✓ |
| B Electronics Active Factory Capacity | initial_stock | B | 45 | = | Electronics factory capacity in B currently staffed/operational and available to the production soft-cap. |  |
| B Electronics Base Markup | constant | B | 0.18 | = |  |  |
| B Electronics Buffer | constant | B | 10 | = |  |  |
| B Electronics Capacity Planning Signal | initial_stock | B | 48.83148 | **1.25793** | Smoothed desired electronics production used only for B factory-capital decisions. | ✓ |
| B Electronics Capital Goods per Capacity | constant | B | 11.5 | = | Capital-goods units consumed per unit of new B electronics factory installed capacity. | ✓ |
| B Electronics Decommissioning Factory Capacity | initial_stock | B | 0 | = | B electronics capital committed to permanent retirement but not yet fully dismantled. |  |
| B Electronics Demand Elasticity | constant | B | 0.6 | = |  |  |
| B Electronics Domestic Supply Signal | initial_stock | B | 16 | **20** |  | ✓ |
| B Electronics Energy per Unit | constant | B | 12 | = |  | ✓ |
| B Electronics Feedstock Adjustment Time | constant | B | 40 | = |  |  |
| B Electronics Feedstock Base Cost | constant | B | 3 | **18** |  | ✓ |
| B Electronics Feedstock Extraction Capacity | constant | B | 60 | = |  |  |
| B Electronics Feedstock Scarcity Strength | constant | B | 0.4 | = |  |  |
| B Electronics Import Supply Signal | initial_stock | B | 0 | = |  |  |
| B Electronics Installed Factory Capacity | initial_stock | B | 45 | = | Physical installed electronics production capital in B. New construction enters here; mothballing does not destroy it. |  |
| B Electronics Inventory | initial_stock | B | 500 | = |  |  |
| B Electronics Inventory Adjustment Time | constant | B | 30 | = |  |  |
| B Electronics Labor per Unit | constant | B | 0.05 | = |  | ✓ |
| B Electronics Local Base Demand | constant | B | 16 | **20** |  | ✓ |
| B Electronics Reference Price | constant | B | 28 | = |  | ✓ |
| B Electronics Retired Factory Capacity | initial_stock | B | 0 | = | Cumulative permanently retired electronics capacity in B. |  |
| B Electronics Scarcity Strength | constant | B | 1.5 | = |  |  |
| B Electronics Target Inventory | constant | B | 500 | = |  | ✓ |
| B Feedstock per Electronics | constant | B | 1 | = |  | ✓ |
| B Legacy Electronics Factory Capacity | constant | B | 45 | = | Accepted v7.2 fixed B electronics factory capacity used only when Capital Lifecycle Enabled = 0. |  |
| B Test 13 Electronics Demand Applies | constant | B | 0 | **1** | Applicability flag for Mode 13 electronics-demand test wiring in colony B. | ✓ |
| B Test 14 Electronics Demand Applies | constant | B | 0 | **1** | Applicability flag for Mode 14 electronics-demand test wiring in colony B. | ✓ |
| B Test 15 Electronics Demand Applies | constant | B | 1 | **0** | Applicability flag for Mode 15 electronics-demand test wiring in colony B. | ✓ |
| B Test 19 Electronics Demand Applies | constant | B | 0 | **1** | Applicability flag for Mode 19 electronics-demand test wiring in colony B. | ✓ |
| B Test 23 Electronics Demand Applies | constant | B | 0 | **1** | Applicability flag for Mode 23 electronics demand shock in colony B. | ✓ |
| B Test 5 Electronics Demand Applies | constant | B | 0 | **1** | Applicability flag for Mode 5 electronics-demand test wiring in colony B. | ✓ |
| B Test 7 Electronics Demand Applies | constant | B | 0 | **1** | Applicability flag for Mode 7 electronics-demand test wiring in colony B. | ✓ |
| B Test 8 Electronics Demand Applies | constant | B | 0 | **1** | Applicability flag for Mode 8 electronics-demand test wiring in colony B. | ✓ |
| B Test 9 Electronics Demand Applies | constant | B | 0 | **1** | Applicability flag for Mode 9 electronics-demand test wiring in colony B. | ✓ |
| Electronics Activation Time | constant | global | 30 |  | Time scale for reactivating mothballed electronics factory capacity. | ✓ |
| Electronics Active Fixed Cost per Capacity | constant | global | 0.15 |  | Planning-level active fixed cost proxy per unit of electronics factory capacity. |  |
| Electronics Capacity Planning Adjustment Time | constant | global | 60 |  | Longer planning memory for factory capital decisions; inventory/market control remains faster. |  |
| Electronics Capacity Planning Factor | constant | global | 0.92 |  | Maps smoothed desired production into required active soft-capacity. Calibrated to the existing soft saturation semantics: baseline B desired production can exceed nominal capacity while realized utilization is about 0.92. |  |
| Electronics Capital Cost per Capacity | constant | global | 600 |  | Planning-level capital cost proxy per unit of new electronics factory capacity. |  |
| Electronics Cargo A to B | initial_stock | global | 0 |  |  |  |
| Electronics Cargo B to A | initial_stock | global | 0 |  |  |  |
| Electronics Cargo Freight Contract Value A to B | initial_stock | global | 0 |  | Locked freight-contract value attached to electronics currently in transit. |  |
| Electronics Cargo Freight Contract Value B to A | initial_stock | global | 0 |  | Locked freight-contract value attached to electronics currently in transit. |  |
| Electronics Cargo Goods Contract Value A to B | initial_stock | global | 0 |  | Supplier-side contract value attached to electronics currently in transit. |  |
| Electronics Cargo Goods Contract Value B to A | initial_stock | global | 0 |  | Supplier-side contract value attached to electronics currently in transit. |  |
| Electronics Construction Time | constant | global | 240 |  | Structural time scale for adding installed electronics factory capacity. | ✓ |
| Electronics Decommissioning Time | constant | global | 720 |  | Time from decommissioning commitment to completed retirement for electronics capital. |  |
| Electronics Depreciation Rate | constant | global | 0.00005 |  | Physical end-of-life attrition rate of electronics factory capacity per day. |  |
| Electronics Export Inventory Release Time | constant | global | 5 |  |  |  |
| Electronics Export Reserve | constant | global | 100 |  |  |  |
| Electronics Freight Weight per Unit | constant | global | 0.25 |  | Transport-equivalent tonnes consumed by one unit of Electronics. |  |
| Electronics Import Inventory Adjustment Time | constant | global | 20 |  |  |  |
| Electronics Import Share Sensitivity | constant | global | 100 |  |  | ✓ |
| Electronics Inactive Holding Cost per Capacity | constant | global | 0.03 |  | Planning-level holding cost proxy for mothballed electronics capacity. |  |
| Electronics Minimum Active Factory Capacity | constant | global | 5 |  | Minimum operational electronics line kept active in each colony while lifecycle is enabled. |  |
| Electronics Mothball Time | constant | global | 30 |  | Time scale for taking unneeded electronics factory capacity out of active service. | ✓ |
| Electronics per Capital Goods Unit | constant | global | 0.5 |  | Physical electronics input per abstract capital-goods unit. | ✓ |
| Electronics Reinvestment Fraction | constant | global | 0.35 |  | Fraction of positive electronics operating-surplus proxy available to finance capacity expansion. |  |
| Electronics Strategic Reserve Fraction | constant | global | 0.25 |  | Fraction of installed inactive electronics capacity that may be retained as strategic mothballed reserve before decommissioning. | ✓ |
| Electronics Supply Mix Adjustment Time | constant | global | 5 |  |  |  |
| Electronics Surplus Disposal Decision Time | constant | global | 1440 |  | Slow decision time before genuinely surplus electronics capital is committed to permanent retirement. |  |
| Metal per Electronics | constant | global | 0.25 |  | Physical Metal units consumed per unit of Electronics in the v7.4 coupled branch. Initial calibration candidate r1. | ✓ |

### Labor

| Параметр | Вид | Колония | Значение | Зеркало | Описание в модели | Аннотация |
|---|---|---|---:|---:|---|:---:|
| A Wage | constant | A | 100 | **140** |  | ✓ |
| B Wage | constant | B | 140 | **100** |  | ✓ |

### Metal

| Параметр | Вид | Колония | Значение | Зеркало | Описание в модели | Аннотация |
|---|---|---|---:|---:|---|:---:|
| A Labor per Metal | constant | A | 0.1 | = |  | ✓ |
| A Metal Adjustment Time | constant | A | 30 | = |  |  |
| A Metal Buffer | constant | A | 10 | = |  | ✓ |
| A Metal Inventory | initial_stock | A | 500 | = |  |  |
| A Metal Scarcity Strength | constant | A | 1.5 | = |  |  |
| A Metal Target Inventory | constant | A | 500 | = |  | ✓ |
| A Mining Capacity | constant | A | 70 | **28** |  | ✓ |
| A Ore Adjustment Time | constant | A | 40 | = |  |  |
| A Ore Base Cost | constant | A | 4 | **14** |  | ✓ |
| A Ore Buffer | constant | A | 50 | = |  |  |
| A Ore Inventory | initial_stock | A | 2500 | = |  |  |
| A Ore per Metal | constant | A | 1.4 | = |  | ✓ |
| A Ore Scarcity Strength | constant | A | 0.4 | = |  |  |
| A Ore Target Inventory | constant | A | 2500 | = |  |  |
| A Reference Metal Price | constant | A | 40 | = |  | ✓ |
| A Refinery Active Capacity | initial_stock | A | 35 | **28** | Operational refinery capacity currently available for production in A. | ✓ |
| A Refinery Active Fixed Cost per Capacity | constant | A | 4 | = | Daily fixed operating cost per unit of active refinery capacity. |  |
| A Refinery Capital Cost per Capacity | constant | A | 900 | = |  |  |
| A Refinery Capital Goods per Capacity | constant | A | 17 | = | Capital-goods units consumed per unit of new A refinery installed capacity. | ✓ |
| A Refinery Decommissioning Capacity | initial_stock | A | 0 | = | Capacity committed to physical decommissioning. It is no longer operationally installed but has not yet completed dismantling/retirement. |  |
| A Refinery Depreciation Rate | constant | A | 0.0001 | = | Daily physical depreciation rate of installed refinery capacity (~3.6%/year before other closures). |  |
| A Refinery Installed Capacity | initial_stock | A | 35 | **28** | Physical installed metal-production capacity in A. Changes slowly through construction, permanent retirement and depreciation. | ✓ |
| A Refinery Loss Closure Fraction | constant | A | 0.5 | = |  |  |
| A Refinery Reinvestment Fraction | constant | A | 0.3 | = |  |  |
| A Refinery Retired Capacity | initial_stock | A | 0 | = | Cumulative refinery capacity physically retired from service. Future versions may split this into recoverable equipment, salvage material and waste. |  |
| A Test 16 Metal Demand Applies | constant | A | 0 | **1** | Applicability flag for Mode 16 metal-demand test wiring in colony A. | ✓ |
| A Test 18 Mining Shock Applies | constant | A | 1 | **0** | Applicability flag: the v7.4 Mode 18 mining shock applies to colony A. | ✓ |
| A Test 2 Metal Demand Applies | constant | A | 0 | **1** | Applicability flag for Mode 2 metal-demand test wiring in colony A. | ✓ |
| A Test 20 Metal Demand Applies | constant | A | 0 | **1** | Applicability flag for Mode 20 metal-demand test wiring in colony A. | ✓ |
| A Test 3 Metal Demand Applies | constant | A | 0 | **1** | Applicability flag for Mode 3 metal-demand test wiring in colony A. | ✓ |
| A Test 7 Metal Demand Applies | constant | A | 0 | **1** | Applicability flag for Mode 7 metal-demand test wiring in colony A. | ✓ |
| A Test 8 Metal Demand Applies | constant | A | 0 | **1** | Applicability flag for Mode 8 metal-demand test wiring in colony A. | ✓ |
| A Test 9 Metal Demand Applies | constant | A | 0 | **1** | Applicability flag for Mode 9 metal-demand test wiring in colony A. | ✓ |
| B Labor per Metal | constant | B | 0.1 | = |  | ✓ |
| B Metal Adjustment Time | constant | B | 30 | = |  |  |
| B Metal Buffer | constant | B | 10 | = |  | ✓ |
| B Metal Inventory | initial_stock | B | 500 | = |  |  |
| B Metal Scarcity Strength | constant | B | 1.5 | = |  |  |
| B Metal Target Inventory | constant | B | 500 | = |  | ✓ |
| B Mining Capacity | constant | B | 28 | **70** |  | ✓ |
| B Ore Adjustment Time | constant | B | 40 | = |  |  |
| B Ore Base Cost | constant | B | 14 | **4** |  | ✓ |
| B Ore Buffer | constant | B | 50 | = |  |  |
| B Ore Inventory | initial_stock | B | 2500 | = |  |  |
| B Ore per Metal | constant | B | 1.4 | = |  | ✓ |
| B Ore Scarcity Strength | constant | B | 0.4 | = |  |  |
| B Ore Target Inventory | constant | B | 2500 | = |  |  |
| B Reference Metal Price | constant | B | 40 | = |  | ✓ |
| B Refinery Active Capacity | initial_stock | B | 28 | **35** | Operational refinery capacity currently available for production in B. | ✓ |
| B Refinery Active Fixed Cost per Capacity | constant | B | 4 | = | Daily fixed operating cost per unit of active refinery capacity. |  |
| B Refinery Capital Cost per Capacity | constant | B | 900 | = |  |  |
| B Refinery Capital Goods per Capacity | constant | B | 17 | = | Capital-goods units consumed per unit of new B refinery installed capacity. | ✓ |
| B Refinery Decommissioning Capacity | initial_stock | B | 0 | = | Capacity committed to physical decommissioning. It is no longer operationally installed but has not yet completed dismantling/retirement. |  |
| B Refinery Depreciation Rate | constant | B | 0.0001 | = | Daily physical depreciation rate of installed refinery capacity (~3.6%/year before other closures). |  |
| B Refinery Installed Capacity | initial_stock | B | 28 | **35** | Physical installed metal-production capacity in B. Changes slowly through construction, permanent retirement and depreciation. | ✓ |
| B Refinery Loss Closure Fraction | constant | B | 0.5 | = |  |  |
| B Refinery Reinvestment Fraction | constant | B | 0.3 | = |  |  |
| B Refinery Retired Capacity | initial_stock | B | 0 | = | Cumulative refinery capacity physically retired from service. Future versions may split this into recoverable equipment, salvage material and waste. |  |
| B Test 16 Metal Demand Applies | constant | B | 1 | **0** | Applicability flag for Mode 16 metal-demand test wiring in colony B. | ✓ |
| B Test 18 Mining Shock Applies | constant | B | 0 | **1** | Applicability flag: the v7.4 Mode 18 mining shock does not apply to colony B. | ✓ |
| B Test 2 Metal Demand Applies | constant | B | 1 | **0** | Applicability flag for Mode 2 metal-demand test wiring in colony B. | ✓ |
| B Test 20 Metal Demand Applies | constant | B | 1 | **0** | Applicability flag for Mode 20 metal-demand test wiring in colony B. | ✓ |
| B Test 3 Metal Demand Applies | constant | B | 1 | **0** | Applicability flag for Mode 3 metal-demand test wiring in colony B. | ✓ |
| B Test 7 Metal Demand Applies | constant | B | 1 | **0** | Applicability flag for Mode 7 metal-demand test wiring in colony B. | ✓ |
| B Test 8 Metal Demand Applies | constant | B | 1 | **0** | Applicability flag for Mode 8 metal-demand test wiring in colony B. | ✓ |
| B Test 9 Metal Demand Applies | constant | B | 1 | **0** | Applicability flag for Mode 9 metal-demand test wiring in colony B. | ✓ |
| Metal Input Adjustment Time | constant | global | 20 |  | Adjustment time in days for the Electronics Metal input buffer demand. Initial candidate r1 value from the approved specification. | ✓ |
| Metal Input Target Days | constant | global | 20 |  | Target Electronics-owned Metal/feedstock buffer measured in days of coupled consumption. Initial candidate r1 value from the approved specification. | ✓ |
| Metal per Capital Goods Unit | constant | global | 1 |  | Physical metal input per abstract capital-goods unit. | ✓ |
| Refinery Activation Time | constant | global | 20 |  | Days required to bring mothballed refinery capacity back into active service. |  |
| Refinery Construction Time | constant | global | 180 |  | Physical timescale for closing an installed-capacity shortage through construction. | ✓ |
| Refinery Decommissioning Time | constant | global | 540 |  | Physical time from decommissioning commitment to fully retired refinery capacity. |  |
| Refinery Inactive Holding Cost per Capacity | constant | global | 0.5 |  | Daily preservation/security/maintenance cost per unit of installed but inactive refinery capacity. |  |
| Refinery Installed Reserve Factor | constant | global | 1.15 |  | Desired installed refinery capacity relative to unbounded required active capacity. | ✓ |
| Refinery Mothball Time | constant | global | 10 |  | Days required to deactivate unneeded refinery capacity. |  |
| Refinery Operating Reserve Factor | constant | global | 1.1 |  | Desired active capacity relative to planned production. | ✓ |
| Refinery Surplus Disposal Decision Time | constant | global | 240 |  | Characteristic time before genuinely surplus refinery capacity is committed to decommissioning. This is a policy/decision delay, not the physical dismantling duration. |  |

### Other

| Параметр | Вид | Колония | Значение | Зеркало | Описание в модели | Аннотация |
|---|---|---|---:|---:|---|:---:|
| A Base Markup | constant | A | 0.15 | = |  |  |
| A Capital Goods Base Production Capacity | constant | A | 2 | **1** | Baseline production capacity of the A capital-goods sector. | ✓ |
| A Capital Goods Inventory | initial_stock | A | 30 | = | Local inventory of abstract capital goods in colony A; initial calibration value. | ✓ |
| A Demand Elasticity | constant | A | 0.6 | = |  |  |
| A Domestic Supply Signal | initial_stock | A | 16 | **22** | Smoothed recent domestic metal production available to A's buyers. | ✓ |
| A Local Base Demand | constant | A | 16 | **22** | Local industrial metal demand at the reference price. | ✓ |
| A Test 22 Capital Goods Shock Applies | constant | A | 1 | **0** | Applicability flag for Mode 22 capital-goods supply shock in colony A. | ✓ |
| A Test 4 Headroom Applies | constant | A | 0 | **1** | Applicability flag for symmetric power test wiring. | ✓ |
| A Test 6 Headroom Applies | constant | A | 1 | **0** | Applicability flag for symmetric power test wiring. | ✓ |
| B Base Markup | constant | B | 0.15 | = |  |  |
| B Capital Goods Base Production Capacity | constant | B | 1 | **2** | Baseline production capacity of the B capital-goods sector. | ✓ |
| B Capital Goods Inventory | initial_stock | B | 30 | = | Local inventory of abstract capital goods in colony B; initial calibration value. | ✓ |
| B Demand Elasticity | constant | B | 0.6 | = |  |  |
| B Domestic Supply Signal | initial_stock | B | 22 | **16** | Smoothed recent domestic metal production available to B's buyers. | ✓ |
| B Local Base Demand | constant | B | 22 | **16** | Local industrial metal demand at the reference price. | ✓ |
| B Test 22 Capital Goods Shock Applies | constant | B | 0 | **1** | Applicability flag for Mode 22 capital-goods supply shock in colony B. | ✓ |
| B Test 4 Headroom Applies | constant | B | 1 | **0** | Applicability flag for symmetric power test wiring. | ✓ |
| B Test 6 Headroom Applies | constant | B | 0 | **1** | Applicability flag for symmetric power test wiring. | ✓ |
| Base Handling Cost | constant | global | 1 |  | Loading/unloading and other per-tonne cost independent of travel duration. |  |
| Capital Goods Adjustment Time | constant | global | 20 |  | First-order inventory correction time for desired capital-goods production. | ✓ |
| Capital Goods Buffer Days | constant | global | 1 |  | v7.5 scale-free fulfillment half-saturation buffer, expressed in days of current capital-goods demand. | ✓ |
| Capital Goods Target Days | constant | global | 30 |  | Target inventory coverage for the capital-goods sector, in days of desired demand. | ✓ |
| Supply Mix Adjustment Time | constant | global | 5 |  | Days over which buyers' physically available source mix adjusts to actual domestic production and delivered imports. |  |
| Transit Cost per Tonne Day | constant | global | 0.2 |  | Crew, fuel, maintenance and other variable cost per tonne for each day in transit. |  |

### Power

| Параметр | Вид | Колония | Значение | Зеркало | Описание в модели | Аннотация |
|---|---|---|---:|---:|---|:---:|
| A Energy Demand Signal | initial_stock | A | 1100 | **480** | Short-memory perceived requested load used for price formation. The stock breaks the instantaneous price-demand algebraic loop. | ✓ |
| A Energy per Metal | constant | A | 30 | = |  | ✓ |
| A Expansion Utilization Power | constant | A | 4 | = |  |  |
| A Legacy Power Installed Generation Capacity | constant | A | 1350 | **550** | Accepted v7.2 fixed A generation capacity used only when Capital Lifecycle Enabled = 0. | ✓ |
| A Power Active Generation Capital | initial_stock | A | 1350 | **550** | Installed A generation capital currently active/dispatchable before temporary availability shocks. | ✓ |
| A Power Capacity Planning Signal | initial_stock | A | 1316.4467 | **537.2232** | Long-memory industrial load signal used for A generation-capital planning; distinct from the short scarcity-price signal. | ✓ |
| A Power Capital Goods per Capacity | constant | A | 0.5 | = | Capital-goods units consumed per unit of new A power generation installed capital. | ✓ |
| A Power Decommissioning Generation Capital | initial_stock | A | 0 | = | A generation capital committed to permanent retirement but not yet fully dismantled. |  |
| A Power Generation Cost | constant | A | 0.08 | **0.03** | Baseline variable generation cost per energy unit. This replaces the old exogenous A Energy Price as the fundamental cost input. | ✓ |
| A Power Installed Generation Capital | initial_stock | A | 1350 | **550** | Physical installed firm generation capital in A. v7.3 construction, depreciation and permanent retirement act on this stock. | ✓ |
| A Power Resource Inventory | initial_stock | A | 5000 | = | Physical operating-resource inventory used by power generation in colony A. |  |
| A Power Retired Generation Capital | initial_stock | A | 0 | = | Cumulative permanently retired generation capacity in A. |  |
| A Test 11 Generation Shock Applies | constant | A | 1 | **0** | Applicability flag for symmetric power test wiring. | ✓ |
| A Test 25 Power Resource Shock Applies | constant | A | 1 | **0** | Applicability flag for symmetric Energy Kernel v2 resource-shock wiring. | ✓ |
| A Test 26 Energy Kernel Capacity Shock Applies | constant | A | 1 | **0** | Applicability flag for symmetric Energy Kernel v2 capacity-shock wiring. | ✓ |
| B Energy Demand Signal | initial_stock | B | 480 | **1100** | Short-memory perceived requested load used for price formation. The stock breaks the instantaneous price-demand algebraic loop. | ✓ |
| B Energy per Metal | constant | B | 30 | = |  | ✓ |
| B Expansion Utilization Power | constant | B | 4 | = |  |  |
| B Legacy Power Installed Generation Capacity | constant | B | 550 | **1350** | Accepted v7.2 fixed B generation capacity used only when Capital Lifecycle Enabled = 0. | ✓ |
| B Power Active Generation Capital | initial_stock | B | 550 | **1350** | Installed B generation capital currently active/dispatchable before temporary availability shocks. | ✓ |
| B Power Capacity Planning Signal | initial_stock | B | 537.2232 | **1316.4467** | Long-memory industrial load signal used for B generation-capital planning; distinct from the short scarcity-price signal. | ✓ |
| B Power Capital Goods per Capacity | constant | B | 0.5 | = | Capital-goods units consumed per unit of new B power generation installed capital. | ✓ |
| B Power Decommissioning Generation Capital | initial_stock | B | 0 | = | B generation capital committed to permanent retirement but not yet fully dismantled. |  |
| B Power Generation Cost | constant | B | 0.03 | **0.08** | Baseline variable generation cost per energy unit. This replaces the old exogenous B Energy Price as the fundamental cost input. | ✓ |
| B Power Installed Generation Capital | initial_stock | B | 550 | **1350** | Physical installed firm generation capital in B. v7.3 construction, depreciation and permanent retirement act on this stock. | ✓ |
| B Power Resource Inventory | initial_stock | B | 5000 | = | Physical operating-resource inventory used by power generation in colony B. |  |
| B Power Retired Generation Capital | initial_stock | B | 0 | = | Cumulative permanently retired generation capacity in B. |  |
| B Test 11 Generation Shock Applies | constant | B | 0 | **1** | Applicability flag for symmetric power test wiring. | ✓ |
| B Test 25 Power Resource Shock Applies | constant | B | 0 | **1** | Applicability flag for symmetric Energy Kernel v2 resource-shock wiring. | ✓ |
| B Test 26 Energy Kernel Capacity Shock Applies | constant | B | 0 | **1** | Applicability flag for symmetric Energy Kernel v2 capacity-shock wiring. | ✓ |
| Base Power Resource Price | constant | global | 0.04 |  | Base price per physical power-resource unit before scarcity premium. | ✓ |
| Energy Demand Signal Adjustment Time | constant | global | 3 |  | Time constant for the perceived/contracting energy-load signal used by endogenous price formation. |  |
| Energy Kernel Capacity Shock Factor | constant | global | 0.6 |  | Mode 26 temporary multiplier on A active generation capacity. | ✓ |
| Energy Scarcity Price Strength | constant | global | 4 |  | Linear scarcity premium strength. Price remains equal to generation cost while perceived demand is at or below active capacity. | ✓ |
| Power Activation Time | constant | global | 21 |  | Time scale for returning mothballed generation capacity to active service. |  |
| Power Capacity Planning Adjustment Time | constant | global | 60 |  | Long planning memory for generation-capacity decisions, distinct from the short 3-day price signal. | ✓ |
| Power Construction Time | constant | global | 360 |  | Structural time scale for building additional firm generation capacity. | ✓ |
| Power Decommissioning Time | constant | global | 1080 |  | Time from permanent generation-retirement decision to completed dismantling/retirement. |  |
| Power Depreciation Rate | constant | global | 0.00003 |  | Physical end-of-life attrition rate of installed generation capacity per day. |  |
| Power Mothball Time | constant | global | 45 |  | Time scale for idling generation capacity after a persistent load decline. |  |
| Power Operating Reserve Factor | constant | global | 1.02 |  | Required firm active generation relative to smoothed industrial load. Capacity in this simplified model is already treated as firm/available, so only a small explicit reserve margin is added. | ✓ |
| Power Resource Buffer Days | constant | global | 2 |  | Target operating-resource inventory coverage used by extraction planning and fulfillment. | ✓ |
| Power Resource Extraction Adjustment Time | constant | global | 30 |  | Days over which primary-resource extraction adjusts toward demand plus target-inventory correction. | ✓ |
| Power Resource Extraction Headroom | constant | global | 1.1 |  | Normal extraction headroom multiplier applied after inventory correction. | ✓ |
| Power Resource per Energy | constant | global | 1 |  | Physical operating-resource units consumed per delivered energy unit in Energy Kernel v2. | ✓ |
| Power Resource Scarcity Price Strength | constant | global | 4 |  | Scarcity premium strength applied to the power-resource price. | ✓ |
| Power Resource Shock Factor | constant | global | 0.5 |  | Mode 25 temporary multiplier on A power-resource extraction. 0.5 since v7.6.1 (was 0.1): impact-matched to the Mode 26 capacity control; see docs/V7_6_1_CALIBRATION_REPORT.md. | ✓ |
| Power Strategic Reserve Fraction | constant | global | 0.05 |  | Share of installed inactive generation that may be retained as long-lived strategic reserve. | ✓ |
| Power Surplus Disposal Decision Time | constant | global | 1440 |  | Slow decision time before structurally surplus generation is committed to retirement. |  |
| Transport Expansion Utilization Power | constant | global | 2 |  | Prevents profitable but mostly idle capacity from expanding aggressively. |  |

### Switch

| Параметр | Вид | Колония | Значение | Зеркало | Описание в модели | Аннотация |
|---|---|---|---:|---:|---|:---:|
| Capital Goods Enabled | switch | global | 1 (сценарии: {"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0…) |  | v7.5 master switch: capital expansion is fulfilled from locally produced capital goods. | ✓ |
| Capital Lifecycle Enabled | switch | global | 1 (сценарии: {"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0…) |  | Master switch for the v7.3 Electronics and Energy capital lifecycle. Normal/raw model default is enabled. Accepted v7.2 regression scenarios 0-11 explicitly override it to 0; v7.3 scenarios 12+ set it to 1. | ✓ |
| Intermediate Inputs Enabled | switch | global | 1 (сценарии: {"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0…) |  | Master switch for v7.4 Metal-to-Electronics intermediate-input coupling. Modes 0-16 override to 0; Modes 17+ enable it. | ✓ |
| Power Resource Enabled | switch | global | 0 (сценарии: {"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0…) |  | v7.6 master switch. When 0, the accepted v7.5.1 energy path is reproduced; when 1, generation requires a physical operating resource. |  |
| Transport Capital Goods Enabled | switch | global | 1 (сценарии: {"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0…) |  | v7.5.1 regression switch: when enabled, Transport Capacity Expansion is physically backed by Capital Goods drawn from A/B regional inventories. |  |

### Test

| Параметр | Вид | Колония | Значение | Зеркало | Описание в модели | Аннотация |
|---|---|---|---:|---:|---|:---:|
| Cheap Energy A Generation Cost | test_wiring | global | 0.015 |  | Mode 10 post-day-360 generation cost in A. |  |
| Cheap Energy B Generation Cost | test_wiring | global | 1.5 |  | Mode 10 post-day-360 generation cost in B; deliberately high enough to make energy materially affect comparative advantage. |  |
| Electronics Demand Surge Multiplier | test_wiring | global | 2 |  | Multiplier for A electronics base demand in timed test mode 5. |  |
| Generation Capacity Shock Factor | test_wiring | global | 0.6 |  | Mode 11 temporary multiplier on A active power-generation capacity. |  |
| Legacy Advantage Test Power Headroom Multiplier | test_wiring | global | 4 |  | Test-harness-only multiplier. During legacy reverse-comparative-advantage regression modes 4 and 6 it provides ample generation in the colony whose production mix is intentionally reversed, so those tests continue to isolate comparative advantage rather than becoming power-shortage tests. Normal modes and all dedicated v7.2 energy tests do not use this multiplier. |  |
| Low Demand Multiplier | test_wiring | global | 0.55 |  | Mode 3 multiplier applied to B base demand during the temporary demand collapse. |  |
| Priority Stress A Ore Base Cost | test_wiring | global | 4 |  | Mode 8 ore-base-cost override for A; neutral value equal to A Ore Base Cost. | ✓ |
| Priority Stress B Ore Base Cost | test_wiring | global | 50 |  | Temporary B ore base cost in Mode 8. It raises B domestic metal cost and therefore the economic surplus of importing metal from A, creating a deliberate metal-priority test. |  |
| Priority Stress Demand Multiplier | test_wiring | global | 1.8 |  | Demand multiplier applied to B metal demand and A electronics demand in Mode 8. |  |
| Reverse A Electronics Feedstock Base Cost | test_wiring | global | 3 |  |  |  |
| Reverse A Energy Price | test_wiring | global | 0.2 |  |  |  |
| Reverse A Mining Capacity | test_wiring | global | 70 |  | Mode 4 override mining capacity for A; neutral value equal to A Mining Capacity. | ✓ |
| Reverse A Ore Base Cost | test_wiring | global | 12 |  |  |  |
| Reverse A Wage | test_wiring | global | 100 |  | Mode 4 override wage for A; neutral value equal to A Wage. | ✓ |
| Reverse B Electronics Feedstock Base Cost | test_wiring | global | 18 |  |  |  |
| Reverse B Energy Price | test_wiring | global | 0.02 |  |  |  |
| Reverse B Mining Capacity | test_wiring | global | 70 |  |  |  |
| Reverse B Ore Base Cost | test_wiring | global | 5 |  |  |  |
| Reverse B Wage | test_wiring | global | 90 |  |  |  |
| Test Shock End Day | test_wiring | global | 720 |  | Day on which temporary tests 1-3 end. Test 4 remains active after the start. | ✓ |
| Test Shock Start Day | test_wiring | global | 360 |  | Day on which timed stress begins. | ✓ |
| Timed Test Mode | switch | global | 0 (сценарии: {"0":0,"1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9…) |  | 0=Baseline multi-good countertrade; 1=B metal reactivation freight shock; 2=metal demand surge / v7.2 metal-energy stress; 3=metal low-demand rationalization; 4=metal reverse advantage; 5=electronics demand surge / v7.2 electronics-energy stress; 6=reverse electronics advantage; 7=two-good transport surge; 8=metal-priority transport scarcity; 9=two-industry local energy stress; 10=cheap-energy comparative-advantage shift; 11=A generation-capacity shock/recovery.; 25=Energy Kernel v2 resource-supply shock; 26=Energy Kernel v2 capacity-only control shock. |  |
| Transport Demand Surge Multiplier | test_wiring | global | 2 |  | Mode 2 multiplier applied to B base demand during the temporary surge. |  |
| Two Good Demand Surge Multiplier | test_wiring | global | 1.8 |  | Multiplier applied simultaneously to B metal demand and A electronics demand in timed test mode 7. |  |
| Two Industry Energy Stress Demand Multiplier | test_wiring | global | 3 |  | Mode 9 multiplier applied simultaneously to B metal demand and A electronics demand. |  |
| v7.3 Electronics Demand Collapse Multiplier | test_wiring | global | 0.35 |  | v7.3 test harness only. |  |
| v7.3 Sustained Electronics Growth Multiplier | test_wiring | global | 4 |  | v7.3 test harness only. |  |
| v7.3 Sustained Metal Demand Growth Multiplier | test_wiring | global | 2 |  | v7.3 test harness only. |  |
| v7.3 Temporary Electronics Demand Multiplier | test_wiring | global | 2 |  | v7.3 test harness only. |  |
| v7.4 Coupled Electronics Growth Multiplier | test_wiring | global | 4 |  | Sustained A Electronics local-demand multiplier used only by Mode 19. | ✓ |
| v7.4 Coupled Metal Demand Growth Multiplier | test_wiring | global | 2 |  | Sustained B final Metal local-demand multiplier used only by Mode 20. | ✓ |
| v7.4 Metal Supply Shock Multiplier | test_wiring | global | 0.5 |  | Temporary A mining-capacity multiplier used only by Mode 18. | ✓ |
| v7.5 Capital Goods Shock Multiplier | test_wiring | global | 0.1 |  | Mode 22 test-only multiplier applied to the selected colony capital-goods production capacity; calibrated to create a binding temporary supply shock. | ✓ |
| v7.5 Investment Boom Multiplier | test_wiring | global | 4 |  | Mode 23 multiplier applied to selected colony electronics local base demand. | ✓ |

### Trade

| Параметр | Вид | Колония | Значение | Зеркало | Описание в модели | Аннотация |
|---|---|---|---:|---:|---|:---:|
| A Import Supply Signal | initial_stock | A | 0 | = | Smoothed recent delivered imports from B available to A's buyers. |  |
| B Import Supply Signal | initial_stock | B | 0 | = | Smoothed recent delivered imports from A available to B's buyers. |  |
| Export Inventory Release Time | constant | global | 5 |  | Days required to make inventory above the export reserve available to foreign buyers. This replaces the old permanent fractional export-availability haircut. |  |
| Export Reserve | constant | global | 100 |  | Inventory exporters try not to sell below. | ✓ |
| Import Inventory Adjustment Time | constant | global | 20 |  | Days over which importers try to replenish an inventory shortage. |  |
| Import Share Sensitivity | constant | global | 100 |  | How strongly buyers switch toward imports when landed foreign metal is cheaper than the local metal price. Higher values make small price advantages capture a larger market share. | ✓ |

### Transport

| Параметр | Вид | Колония | Значение | Зеркало | Описание в модели | Аннотация |
|---|---|---|---:|---:|---|:---:|
| Base Freight Markup | constant | global | 0.15 |  |  |  |
| Cargo A to B | initial_stock | global | 0 |  | Metal currently in transit from A to B. |  |
| Cargo B to A | initial_stock | global | 0 |  | Metal currently in transit from B to A. |  |
| Freight Price | initial_stock | global | 5 |  | Quoted freight price in credits per tonne. Adjusts gradually toward the transport-sector target price. |  |
| Freight Price Adjustment Time | constant | global | 10 |  | Days over which quoted freight rates adjust to current operating conditions. |  |
| Metal Cargo Freight Contract Value A to B | initial_stock | global | 0 |  | Total locked freight value associated with metal cargo currently in transit. It is accumulated using the freight price prevailing when each cohort was dispatched. |  |
| Metal Cargo Freight Contract Value B to A | initial_stock | global | 0 |  | Total locked freight value associated with metal cargo currently in transit. It is accumulated using the freight price prevailing when each cohort was dispatched. |  |
| Metal Cargo Goods Contract Value A to B | initial_stock | global | 0 |  | Total supplier-side contract value physically associated with metal cargo currently in transit. It is accumulated using the supplier price prevailing when each cohort was dispatched. |  |
| Metal Cargo Goods Contract Value B to A | initial_stock | global | 0 |  | Total supplier-side contract value physically associated with metal cargo currently in transit. It is accumulated using the supplier price prevailing when each cohort was dispatched. |  |
| Reactivation Freight Cost Multiplier | constant | global | 9 |  | Mode 1 multiplier applied to transport operating cost during the temporary shock. |  |
| Transport Activation Time | constant | global | 7 |  | Days to reactivate idle ships/route capacity. |  |
| Transport Active Fixed Cost per Capacity | constant | global | 0.25 |  | Daily fixed operating cost per unit of active transport throughput capacity. |  |
| Transport Active Throughput Capacity | initial_stock | global | 20 |  | Route throughput capacity currently in active service. |  |
| Transport Allocation Bid Floor | constant | global | 0.01 |  | Small positive numerical floor for the allocation score. Requested trade already requires a positive trade advantage, so this floor is primarily for numerical robustness. |  |
| Transport Capital Cost per Capacity | constant | global | 150 |  | Capital required to add one tonne/day of throughput capacity. |  |
| Transport Capital Goods per Capacity | constant | global | 2.8333333333333335 |  | Capital Goods required per unit of new Transport installed throughput capacity. Initial calibration preserves the v7.5 Refinery ratio of Capital Goods to financial capital cost: 17/900 × 150. |  |
| Transport Construction Time | constant | global | 120 |  | Physical timescale for closing an installed transport-capacity shortage. | ✓ |
| Transport Decommissioning Capacity | initial_stock | global | 0 |  | Transport capacity committed to disposal/decommissioning and no longer available on the route. This is an explicit extension point for future reassignment or secondary-market logic. |  |
| Transport Decommissioning Time | constant | global | 360 |  | Physical time from decommissioning commitment to retired transport capacity. For mobile assets, future versions may instead route much of Surplus into reassignment/resale. |  |
| Transport Depreciation Rate | constant | global | 0.0001 |  | Daily physical depreciation rate of installed transport capacity (~3.6%/year before closure). |  |
| Transport Inactive Holding Cost per Capacity | constant | global | 0.04 |  | Daily cost of keeping installed but inactive transport capacity preserved. |  |
| Transport Installed Reserve Factor | constant | global | 1.25 |  | Desired installed transport capacity relative to unbounded required active throughput. |  |
| Transport Installed Throughput Capacity | initial_stock | global | 20 |  | Physical installed route throughput capacity. Changes slowly through fleet/infrastructure investment, permanent retirement and depreciation. | ✓ |
| Transport Loss Closure Fraction | constant | global | 0.5 |  |  |  |
| Transport Mothball Time | constant | global | 7 |  | Days to remove excess transport capacity from active service. |  |
| Transport Operating Reserve Factor | constant | global | 1.15 |  | Desired active route capacity relative to requested shipment volume. |  |
| Transport Reinvestment Fraction | constant | global | 0.4 |  |  |  |
| Transport Retired Capacity | initial_stock | global | 0 |  | Cumulative transport capacity physically retired. Future versions may split this into reusable hulls/modules, salvage material and waste. |  |
| Transport Scarcity Strength | constant | global | 1 |  |  |  |
| Transport Surplus Disposal Decision Time | constant | global | 240 |  | Characteristic time before genuinely surplus route capacity is released into decommissioning/disposal. Future versions may redirect this surplus into reassignment or a secondary-market pool instead. |  |
| Travel Time | constant | global | 10 |  | Average transit time in days. | ✓ |
