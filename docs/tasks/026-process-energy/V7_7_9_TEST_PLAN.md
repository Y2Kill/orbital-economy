# v7.7.9 — Process Energy — test plan

Статус: **r1** (2026-10-03). К `V7_7_9_ARCHITECTURE_SPEC.md`. Пороги **[calib]** — по первому прогону `candidate.yml`, с запасом и обоснованием в отчёте.

**Исполнимость проверена исполнением.** Черновик `draft/validation-v7.7.9-draft.json` содержит все проверки ниже с порогами от skeleton. Он прогнан стендом на skeleton во всех 48 Modes (итог — в спецификации §6) и прошёл `check-validation` с 0 ошибок. Validation — многострочный JSON.

## 1. HARD и REGRESSION

- все проверки v7.7.8 сохраняются без ослабления;
- `regression_modes` = 0–45 (`changed = 0`, `maxAbs = 0`);
- `energy_balance` — 7 потребителей и `priority` (уже в черновике), во **всех** Modes;
- `planet_closure` — 4 процесса с `energy.signal`, у `power_resource` ещё `energy.fulfillment` (уже в черновике).

## 2. Слой выключен — Modes 0–45

Для каждого потребителя K и колонии X; имена проверок помечены `(switch off)`:
- `X K Requested Energy` — max ≤ 0 (`metric`, `tolerance: 0`);
- скорость процесса − `X K Pre Energy Rate` = 0 (`identity`, `abs_tol: 0`) — во всех Modes 0–45, включая шоки;
- `X Priority Requested Energy` — max ≤ 0.

## 3. Тождества и границы — Modes 46–47

- скорость процесса ≤ `X K Pre Energy Rate` (`relation`, `abs_tol: 1e-9`): энергия только срезает темп;
- `X Priority Energy Fulfillment Ratio` min ≥ 0.999 — собственные нужды энергетики обслуживаются полностью;
- все тождества Modes 44–45, **кроме помеченных `(switch off)`**, переносятся и в Modes 46–47. В черновике они перенесены с этим фильтром — урок задач 017 и 021.

## 4. Сценарные ожидания

### Mode 46 — baseline

| Проверка | skeleton | Порог черновика | Mode 44 (для сравнения) |
|---|---|---|---|
| `A Total Requested Energy` mean | 1619.4 | > 1560 **[calib]** | 1500.7 |
| `B Total Requested Energy` mean | 502.7 | > 460 **[calib]** | 417.2 |
| `A Energy Fulfillment Ratio` mean (дефицит A углубляется) | 0.919 | < 0.935 **[calib]** | 0.947 |
| `A Power Resource Extraction Requested Energy` min | 67.7 | > 50 | 0 |
| `A Mining Requested Energy` mean | 55.6 | > 40 | 0 |
| `A Capital Goods Requested Energy` max | 82.4 | > 40 | 0 |
| `A Regolith Extraction Requested Energy` max | 77.6 | > 40 | 0 |
| `B Energy Fulfillment Ratio` min в окне [360, 1080] — без топливного коллапса | 1.000 | ≥ 0.95 | 1.000 |
| `B Power Resource Inventory` min | 1843 | > 1000 | 1553 |

### Mode 47 — transport surge

| Проверка | skeleton | Порог черновика | Mode 45 |
|---|---|---|---|
| `B Energy Fulfillment Ratio` min в окне [360, 720] — дефицит есть | 0.691 | < 0.9 | 0.765 |
| то же — без коллапса | 0.691 | > 0.5 | 0.765 |
| `A Energy Fulfillment Ratio` min в окне [360, 720] — без коллапса | 0.808 | > 0.7 | 0.845 |
| `B Capital Goods Requested Energy` max в окне | 54.0 | > 20 | 0 |
| `B Regolith Extraction Requested Energy` max в окне | 37.3 | > 15 | 0 |
| `B Power Resource Inventory` min | 1587 | > 1000 | 1329 |

**Контроль (сделан нами).**
1. Та же модель, но в Modes 46–47 переключатель выключен. Девять проверок этого раздела падают: рост спроса, дефицит A, расход энергии каждым процессом. Ограждающие проверки (B без коллапса, запас топлива) при выключенном слое верны — так и должно быть.
2. Узел без приоритета. B в обоих Modes падает в долю выполнения 0 и в нулевой запас топлива. Ограждающие проверки это ловят (4 шт.).

## 5. Что не проверяется

- сравнения между Modes и с v7.7.8 — в отчёте числами;
- поведение без приоритета — не входит в модель; это контроль 2 выше.
