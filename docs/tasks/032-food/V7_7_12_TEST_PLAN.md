# v7.7.12 — Food — test plan

Статус: **r1** (2026-10-09). К `V7_7_12_ARCHITECTURE_SPEC.md`. Пороги **[calib]** — по первому прогону `candidate.yml`, с запасом и обоснованием в отчёте.

**Исполнимость проверена исполнением.** Черновик `draft/validation-v7.7.12-draft.json`:
- содержит все проверки ниже с порогами от skeleton;
- прогнан стендом на skeleton во всех 52 Modes;
- прошёл `check-validation` с 0 ошибок.

Validation — многострочный JSON.

## 1. HARD и REGRESSION

- все проверки v7.7.11 сохраняются без ослабления;
- `regression_modes` = 0–48 (`changed = 0`, `maxAbs = 0`): переключатель `Food Enabled` по умолчанию 0;
- плагин `food` (2 экземпляра) и прочие плагины — статика и прогон во **всех** Modes. При включённой еде проходят тождества `energy_balance` (ферма в приоритетной группе) и `labor`;
- Modes 49 и 51 наследуют тождества, соотношения и проверки приоритета энергетики Mode 46, Mode 50 — Mode 47.

## 2. Сценарные ожидания (горизонт 3 года)

| Mode | Проверка | skeleton | Порог |
|---|---|---|---|
| 49 | `A Food Fulfillment` min | 1.00 | ≥ 0.99 |
| 49 | `B Food Fulfillment` min | 1.00 | ≥ 0.99 |
| 49 | `Food Dispatch B to A` min | 5.22 | > 3 **[calib]** |
| 49 | `Food Dispatch A to B` max | 0 | < 0.01 |
| 49 | `B Farm Capacity` max (старт 17.14) | 18.63 | > 18 **[calib]** |
| 49 | `Planet Food Production` min | 35.27 | > 34 **[calib]** |
| 49 | `Food Transport Load` mean | 3.69 | > 2.5 **[calib]** |
| 49 | `Transport Active Throughput Capacity` max (Mode 46: 24.9) | 26.9 | > 25.5 **[calib]** |
| 49 | `A Food Price` max | 10.49 | < 11 **[calib]** |
| 49 | `B Employment Rate` min, окно [720, 1080] (Mode 46: 0.66) | 1.00 | > 0.95 **[calib]** |
| 49 | `B Population` max (Mode 46: 9.53) | 9.86 | > 9.7 **[calib]** |
| 50 | `A Food Fulfillment` min | 1.00 | ≥ 0.99 |
| 50 | `A/B Farming Energy Fulfillment Ratio` min | 1.00 | ≥ 0.999 |
| 50 | `Food Dispatch B to A` min | 5.22 | > 3 **[calib]** |
| 50 | `B Capital Goods Fulfillment` min | 0.064 | < 0.3 **[calib]** |
| 51 | `A Food Fulfillment` min | 1.00 | ≥ 0.99 |
| 51 | `A Farm Capacity` max (старт 22) | 30.2 | > 28 **[calib]** |
| 51 | `Food Dispatch B to A` max | 5.22 | > 3 |
| 51 | `Food Dispatch B to A` max, окно [720, 1080] | 0 | < 0.1 |

**Контроль (сделан нами).**
- Mode 49 без торговли — 8 проверок падают (A сыта на 0.72).
- Mode 51 на плодородной земле — падают проверки «A строит фермы» и «торговля угасает».
- Mode 50 без приоритета энергии для ферм — падают все три проверки Mode 50.

## 3. Что не проверяется

- долгосрочная роль B как аграрного региона — горизонт validation 3 года; см. спецификацию §5 и отчёт об экспериментах;
- нехватка рук в A — только учёт, устраняется в шаге 3;
- труд на перевозку еды — не учитывается (ограничение узла).
