# v7.7 — Construction Materials — test plan

Статус: **r1** (2026-09-25). К `V7_7_ARCHITECTURE_SPEC.md`. Порогы с пометкой **[calib]** исполнитель задаёт по первому прогону (`candidate.yml`) и обосновывает в отчёте — числом из лога и запасом до порога; порог, подогнанный впритык к полученному значению, — не проверка (контракт §5, §8 п. 2).

## 1. HARD (все Modes)

- прежние HARD-проверки v7.6.1 сохраняются без ослабления: `finite_all`, `non_negative_regex`, плагины `energy_balance`, `capital_lifecycle_kernel`, `open_boundaries`, `colony_symmetry`, `transport_allocator`;
- новые STOCK (`X Regolith Inventory`, `X Construction Materials Inventory`) — неотрицательны (атрибут `non_negative` + проверка);
- `open_boundaries`: 0 неклассифицированных, 0 closed-world нарушений, 0 непарных потоков преобразования; `colony_symmetry`: 0 расхождений, 0 исключений.

## 2. REGRESSION

`regression_modes` = 0–26: воспроизводят v7.6.1 r1 точно (`changed = 0`, `maxAbs = 0`; новые ряды — `added`).

## 3. Состояние «механика выключена» — Modes 0–26

Вместо парных тождеств (которые при выключенном переключателе ложны по построению — урок v7.5 и v7.6), для каждой колонии:

| Проверка | Утверждение |
|---|---|
| `X construction materials production is zero (switch off)` | max ≤ 0 |
| `X regolith extraction is zero (switch off)` | max ≤ 0 |
| `X construction materials fulfillment is 1 (switch off)` | min ≥ 1 |
| `X construction materials consumption by sectors is zero (switch off)` | max ≤ 0 для всех трёх потоков |
| `X construction materials and regolith inventories are dead stocks (switch off)` | не меняются от начального значения |

## 4. Парные тождества — Modes 27–29

Для каждой колонии и каждого Mode 27–29:

- `X Construction Materials Regolith Consumption = X Construction Materials Production × Regolith per Construction Materials Unit`;
- `X <Sector> Construction Materials Consumption = X <Sector> Expansion × X <Sector> Construction Materials per Capacity` (для Electronics/Power — с учётом `[Capital Lifecycle Enabled]` = 1 в этих Modes) — ×3 сектора;
- прежние парные тождества оборудования (`X <Sector> Capital Goods Consumption`) продолжают выполняться.

Коэффициенты в тождествах берутся из реестра параметров, как в существующих `identity`-проверках (`coef` + `note`).

## 5. Сценарные ожидания

### Mode 27 — Construction Materials Baseline

- A производит стройматериалы: `A Construction Materials Production` > 0 где-то в `[0, 360]` (event_exists);
- A добывает реголит: `A Regolith Extraction` > 0 где-то в `[0, 360]`;
- стройматериалы не душат стройку в спокойном режиме: `A Construction Materials Fulfillment` min на `[200, 1080]` ≥ **[calib]** (skeleton ≈ 0.94–0.97);
- **B в покое** (§6 спецификации): `B Construction Materials Production` max ≤ **[calib, ≈ 0]**, `B Construction Materials Fulfillment` min ≥ 1 − ε. Это не цель, а зафиксированный факт accepted-динамики; если исполнитель видит, что B всё же строит, — это находка для отчёта.

### Mode 28 — Construction Materials Supply Shock (переработка A)

- шок кусается: `A Construction Materials Fulfillment` < **[calib]** где-то в `[360, 720]` (skeleton ≈ 0.36);
- стройка тормозится именно стройматериалами: отношение фактического расширения A Refinery к желаемому в окне заметно ниже 1 — исполнитель вводит вспомогательный ряд `X Refinery Construction Materials Expansion Ratio` (как `X Refinery Capital Goods Expansion Ratio` v7.5) и проверяет его min в окне < **[calib]**;
- оборудование при этом не дефицитно: `A Capital Goods Fulfillment` min в `[360, 720]` ≥ **[calib]** — тормоз от стройматериалов, а не от CG;
- восстановление: `A Construction Materials Fulfillment` на дне 900 ≥ **[calib]** (skeleton ≈ 0.967);
- B не затронут: `B Construction Materials Fulfillment` min ≥ 1 − ε.

### Mode 29 — Regolith Supply Shock (добыча A)

- сырьё кончается: `A Regolith Inventory` min в `[360, 720]` < **[calib]** (skeleton ≈ 0.9 при начальных 40);
- переработка падает из-за сырья, а не из-за мощности: `A Construction Materials Production Rate` в окне ниже базовой мощности (`A Construction Materials Production Capacity` не шокирована в Mode 29);
- `A Construction Materials Fulfillment` < **[calib]** где-то в `[360, 720]` (skeleton ≈ 0.48);
- восстановление после окна, как в Mode 28;
- B не затронут.

### Порядок событий

- В Modes 28 и 29: падение fulfillment стройматериалов **после** начала окна (360) и восстановление **после** его конца (720) — `event_order` или пара `event_exists` по окнам.

## 6. Что не проверяется в v7.7

- поведение B как производителя (он не строит — §6 спецификации);
- сравнение между Modes (например, «в Mode 28 установлено меньше, чем в Mode 27») — формат validation сравнивает внутри одного Mode; такие сравнения исполнитель приводит в отчёте числами из прогонов.
