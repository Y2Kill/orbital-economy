# Задание 039 — v7.7.16 Cost Pricing candidate r1

## Журнал

### Старт — 2026-10-17
- Изучены guard (`tools/check_branch.mjs`), `TASK_RU.md`, scope, архитектурная спецификация (§1–§8), test plan, документация стенда и draft/.
- Ветка `task/039-cost-pricing` создана от текущего `main@3bcee74`. Локальный guard не выполнен: сетевой Git checkout в доступной среде невозможен (не разрешается DNS GitHub); CI branch guard проверяет ветку.
- Scope: только четыре файла `candidate/` и данный журнал.

### КТ1 — поставка подготовлена, CI ожидается
- `model-patch.json` создан из проверенного skeleton с именем `Orbital Economy v7.7.16 Cost Pricing candidate r1`. Ровно один `nodes: cost_pricing`, одна явная замена `Test 2 Transport Surge Active`, новые Modes 56–57; `modify_scenarios: []`. Коммит `ab94077`.
- Эталон skeleton владельца: 5942 элемента, 58 сценариев, fingerprint `f1c2544d52c72781`; conformance 2 CONFORMING, audit: 290 boundaries, 0 unclassified, 0 symmetry, 0/524288 loops, planet_v1 PASS. Эти результаты **предоставлены владельцем**, не измерены на ветке до CI.

### КТ2 — поставка подготовлена, CI ожидается
- `validation.json` скопирована из многострочного owner draft с конечным LF без переформатирования (`4ac38c1`).
- `change-policy.json` скопирована по правилам draft, имя финализировано (`f06ebd6`); привязка к неизменённой validation SHA-256 `b05285abdef696def671b951e05047a7c273c7f2b712dbf8a05c076ff3872890`.
- Эталон владельца: policy PASS, 4998 ожидаемых событий, 0 неожиданных, Modes 0–55 `changed=0`.

### КТ3 — поставка подготовлена, CI ожидается
- Полный draft validation проверен владельцем на skeleton: PASS 58/58 (27882 проверок). Калибровка Modes 56–57 и таблица ниже приведены по `V7_7_16_TEST_PLAN.md`.
- Ни одной новой проверки или сценария сверх спецификации не добавлено.

| Проверка | Значение skeleton | Порог | Запас |
|---|---:|---:|---:|
| Mode 56 A Energy Price min | 0.572 | > 0.5 | 0.072 |
| Mode 56 B Power Resource Price min | 0.399 | > 0.3 | 0.099 |
| Mode 56 A Market Price mean | 59.2 | > 50 | 9.2 |
| Mode 56 A Refinery Profit mean | 333 | > 200 | 133 |
| Mode 56 A Price Index mean | 0.844 | 0.82–0.87 | 0.024 / 0.026 |
| Mode 56 A Real Wage mean | 118.4 | > 115 | 3.4 |
| Mode 56 A/B Food Fulfillment min | 1.00 | ≥ 0.99 | 0.01 |
| Mode 56 A Labor Availability min | 1.00 | > 0.99 | 0.01 |
| Mode 57 A Market Price max | 78.1 | > 70 | 8.1 |
| Mode 57 A Labor Availability min | 0.957 | < 0.98 и > 0.95 | 0.023 / 0.007 |
| Mode 57 A Energy Price max | 0.711 | > 0.65 | 0.061 |
| Mode 57 A Food Fulfillment min | 1.00 | ≥ 0.99 | 0.01 |

### КТ4 — поставка подготовлена, CI ожидается
- Добавлены аннотации `PARAMETER_ANNOTATIONS_fragment.json` (`464eba2`): 3 общих параметра, 10 несимметричных пар, 2 симметричные пары (запись на A с `applies_to_mirror: true`), 3 обновлённые ренты. При объединении с зеркалами новые записи покрывают 27 региональных/глобальных параметров. Устаревшие аннотации опорных цен не включены.
- Всего четыре файла candidate и журнал; остальной репозиторий не менялся. Проверка реестра и CI — ожидаются.

## Устройство и ограничения
`cost_pricing` поставляется только декларацией и раскрывается Lab v0.9.20, переключатель выключен в Modes 0–55. В Modes 56–57 включён только `Cost Pricing Enabled`; прежний `Wage Pricing Enabled` не включается. Сглаженные сигналы имеют время реакции 10 дней. Денежные запасы и доходы от ренты и прибыли за пределами задачи.

## Отличия
- От проверенного owner skeleton: только имя кандидата и явное пустое `modify_scenarios`; `nodes`, единственная замена и Modes 56–57 сохраняют исходные значения.
- Validation: без изменений исходного draft. Change policy: финализировано имя, правила и SHA validation сохранены.
- Аннотации: новый фрагмент по §5; устаревшие аннотации `A Reference Metal Price` и `A Electronics Reference Price` намеренно исключены.
- Самовольных изменений декларации, ценовых коэффициентов, правил policy или модели нет.

## Приёмочный статус
До окончания workflow `candidate.yml` и `ci.yml` доказательства на финальной голове не заявляются. `SHA256SUMS` не изменялись, `[skip ci]` не использовался.
