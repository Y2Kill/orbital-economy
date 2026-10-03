# Validation format — Lab v0.9.13

`validation.json` — изменяемый контракт проверки конкретной версии модели. Ядро runner должно меняться реже, чем этот файл.

## Строгая схема validation (v0.9.13)

До любой симуляции Lab выполняет статическую проверку формы validation. Ошибка схемы — **HARD**: `test` / `lab` завершаются с FAIL до запуска Modes, а `compare` / `policy` возвращают `NOT_COMPARED`. Policy не может разрешить ошибку схемы.

Ошибки содержат JSON-путь и причину, например:

```text
$.scenarios["37"].checks[3].from_day: unknown field for metric (a window is "window": [from, to])
```

Для проверки черновика без запуска модели:

```cmd
node src\cli.js check-validation <validation.json> [model.json]
CHECK_VALIDATION.cmd <validation.json> [model.json]
```

Без `model.json` проверяется форма validation, но не существование Mode. С моделью каждый ключ `scenarios` обязан соответствовать Mode этой модели. Exit code: 0 — схема корректна, 1 — найдены ошибки схемы; ошибки чтения/аргументов остаются ошибками CLI.

### Комментарии

Поля `note` и `notes` разрешены на верхнем уровне, в сценарии, проверке, плагине и событии. Они не влияют на проверку. Любое другое незнакомое поле на проверяемом схемой уровне — ошибка.

### Верхний уровень

| Поле | Тип / форма |
|---|---|
| `name` | string |
| `mode_variable` | string |
| `expected_time_step` | number |
| `time_step_tolerance` | number |
| `finite_all` | boolean |
| `non_negative_regex` | object; поля `pattern` (string), `tolerance` (number) |
| `regression_modes` | array; **описательное поле**, стенд его сейчас не читает |
| `regression_tolerance` | number; **описательное поле**, стенд его сейчас не читает |
| `plugins` | array |
| `scenarios` | object |
| `global_checks` | array |
| `web_crosscheck_abs_tolerance` | number |
| `web_crosscheck_rel_tolerance` | number или `null` |
| `web_crosscheck_rel_floor` | number |
| `note`, `notes` | комментарии |

Точная regression-проверка выполняется factual comparator через `compare`; `regression_modes` и `regression_tolerance` оставлены только как описательная совместимость.

### Сценарии

Ключ `scenarios` — строковый номер Mode из цифр. Разрешённые поля сценария: `name`, `checks`, `note`, `notes`.

Если схема проверяется вместе с моделью, Mode обязан существовать в этой модели; иначе проверки сценария никогда не запустились бы. В `compare` / `policy` существование Mode сверяется **с кандидатом**: новый Mode кандидата допустим, даже если его нет в accepted.

### Generic checks

У всех проверок обязательны `type` и `name`.

| `type` | Обязательные поля | Необязательные поля |
|---|---|---|
| `metric` | `column`, `metric` = `max|min|mean|last|first`, `op`, `value` | `tolerance`, `window` |
| `change` | `column`, `from_day`, `to_day`, `op`, `value` | `tolerance` |
| `event_exists` | `event` | — |
| `event_absent` | `event` | — |
| `event_order` | `events` (array событий) | — |
| `relation` | `left`, `op` = `<=|>=`, `right` | `abs_tol`, `window` |
| `identity` | `terms` (не менее двух `{column, coef}`) | `abs_tol`, `window` |
| `bounded` | `column` | `min`, `max`, `tolerance`, `window` |

Для обычных `op` допустимы `> >= < <= == !=`. `window` имеет строго форму `[from_day, to_day]`: два конечных числа, `from_day <= to_day`.

Событие — объект с обязательным `column`; допустимы также `op`, `value`, `tolerance`, `window`, `name`, `note`, `notes`. Поля события у `event_*` находятся **внутри** `event: {...}`, а не рядом с ним.

### Plugins

Схема проверяет только верхний уровень плагина; внутренние спецификации продолжают проверять специализированные валидаторы.

| `type` | Разрешённые поля кроме `type`, `note`, `notes` |
|---|---|
| `energy_balance` | `colonies`, `abs_tol`, `consumers`, `priority` |
| `capital_lifecycle` | `abs_tol`, `items` |
| `capital_lifecycle_kernel` | `format`, `legacy_switch`, `abs_tol`, `instances` |
| `simple_capital` | `abs_tol`, `instances` |
| `deposit` | `abs_tol`, `instances` |
| `transport_allocator` | `abs_tol` |
| `open_boundaries` | `enforce`, `categories`, `transformation_pairs` |
| `colony_symmetry` | `tokens`, `enforce`, `exceptions` |
| `planet_closure` | `enforce`, `colonies`, `max_hops`, `process_categories`, `energy`, `processes`, `demand_drivers` |

Незнакомый `type` проверки или плагина — ошибка схемы, а не runtime `WARN`.

## Верхний уровень

- `mode_variable` — колонка/VARIABLE для идентификации Mode. По умолчанию `Timed Test Mode`.
- `expected_time_step` — ожидаемый шаг времени.
- `time_step_tolerance` — tolerance проверки шага.
- `finite_all` — проверять NaN/Infinity во всех доступных числовых рядах.
- `non_negative_regex` — regex для рядов, которые обязаны быть неотрицательными.
- `plugins` — повторно используемые физические/учётные проверки.
- `global_checks` — generic checks для каждого сценария.
- `scenarios` — проверки конкретного Mode.
- `web_crosscheck_abs_tolerance` — абсолютный tolerance web-vs-local.
- `web_crosscheck_rel_tolerance` — относительный tolerance или `null`.
- `web_crosscheck_rel_floor` — минимальный знаменатель для вычисления relative difference.

Для первого golden cross-check v7.3:

```json
{
  "web_crosscheck_abs_tolerance": 0,
  "web_crosscheck_rel_tolerance": null,
  "web_crosscheck_rel_floor": 1e-12
}
```

То есть цель — точное совпадение. Если оно не достигается, tolerance не следует увеличивать без анализа причины.

Поля `regression_modes` и `regression_tolerance` сохранены в v7.3 validation-файле как часть прежнего контракта/задел под accepted-checkpoint regression, но optional web cross-check v0.2 сравнивает все Modes, присутствующие в подготовленной партии.

## Plugins

### `energy_balance`

Проверяет для указанных колоний:

- для каждого потребителя `K` из `consumers`: `X K Allocated Energy <= X K Requested Energy`;
- Energy Supply <= Active Generation Capacity;
- Supply = сумма `X K Allocated Energy` по всем `consumers`;
- Unserved = Total requested - Supply.

`consumers` (с v0.9.7) — потребители общего аллокатора колонии; по умолчанию `["Metal", "Electronics"]` (как до v0.9.7: те же проверки, те же имена). Новый потребитель энергии (например, `"Construction Materials"` в v7.7.2) добавляется в validation, а не в код стенда.

`priority` (с v0.9.13) — опциональный массив имён consumer. Для каждого `K` дополнительно проверяется `X K Energy Fulfillment Ratio >= X Energy Fulfillment Ratio` с тем же `abs_tol`. Если поля нет, набор прежних runtime-проверок не меняется.

### `capital_lifecycle_kernel` (v0.5.0, основной)

Машинная форма контракта Capital Lifecycle Kernel. Один плагин выполняет **две** работы:

- **статически**, до симуляции: для каждого экземпляра проверяет наличие и тип 26 обязательных ролей, топологию 7 потоков, обязательные зависимости (ссылка в формуле + LINK), целостность ссылок и семантику legacy-switch; для модели в целом — дубликаты имён, нерезолвящиеся ссылки, зависимости без LINK;
- **на каждом Mode**: `Active <= Installed`; `Installed − Active − Inactive = 0`; `Lifetime − Installed − Decommissioning − Retired = 0`; `Target Active <= Installed`; `Target Active <= Required Active`; 4 стока >= 0; 7 потоков >= 0.

```json
{
  "type": "capital_lifecycle_kernel",
  "legacy_switch": "Capital Lifecycle Enabled",
  "abs_tol": 1e-8,
  "instances": [
    { "name": "A Refinery", "sector": "Refinery", "switch_gated": false, "roles": { "installed": "A Refinery Installed Capacity", "...": "..." } }
  ]
}
```

`NON_CONFORMING` экземпляр — HARD-блокер. Подробно: `LIFECYCLE_CONFORMANCE_RU.md`, спецификация — `../../docs/CAPITAL_LIFECYCLE_KERNEL_SPEC.md`.

### `open_boundaries` (v0.6.0, статический)

Классифицирует каждый FLOW с `from: null` / `to: null` по упорядоченным категориям (glob по имени, опционально направление). У категории обязателен флаг `closed_world`. Режимы `enforce`: `report`, `classify` (по умолчанию; неклассифицированный = FAIL, closed-world нарушения = NOTE), `closed_world` (нарушения = FAIL). Подробно: `STRUCTURE_AUDIT_RU.md`.

### `colony_symmetry` (v0.6.0, статический)

Зеркальность элементов с токенами колоний (`tokens: ["A","B"]`): существование, тип, формула по модулю переименования ссылок, endpoints, LINK. Числовые константы могут отличаться. `exceptions[]` — glob + обязательный `reason`. `enforce: false` понижает FAIL до WARN. Подробно: `STRUCTURE_AUDIT_RU.md`.

### `planet_closure` (v0.9.6, статический)

Декларативная карта производственных/service-процессов для критериев Planet v1 P2–P6. Выполняется только статически до simulation; runtime `checkPlugin` его пропускает.

Основные поля:

- `enforce`: `report | classify | planet_v1 | planet_strict`;
- `colonies`: токены подстановки `{C}`;
- `max_hops`: максимальная длина reference path для утверждения «output читает constraint»;
- `process_categories`: категории `open_boundaries`, определяющие ожидаемые source outputs;
- `processes[]`: `id`, `kind`, `output` и роли `capacity`, `energy`, `deposit`, `labor`;
- `energy.total_request` / `energy.fulfillment`: общая энергетическая обвязка;
- для `processes[].energy.kind="requests"`: обязательный `request`, опциональный `signal` и опциональный per-process `fulfillment`, переопределяющий глобальный `energy.fulfillment`;
- `demand_drivers.parameters/consumption/reason`: явные внешние драйверы спроса.

Имена ссылок декларации разрешаются как ModelJSON-ссылки стенда: `trim().toLowerCase()`, отчёты используют канонические имена элементов.

Пример process:

```json
{
  "id": "smelting",
  "kind": "transformation",
  "output": "{C} Metal Production",
  "capacity": { "kind": "kernel", "stock": "{C} Refinery Active Capacity" },
  "energy": { "kind": "requests", "request": "{C} Metal Requested Energy", "signal": "{C} Metal Energy Signal" },
  "labor": { "kind": "declared", "intensity": "{C} Refinery Labor per Capacity" }
}
```

`capacity.kind=constant|unbounded` и `energy.kind=none` требуют `reason`. В `planet_v1` задокументированные P2/P3 exceptions допускаются; `planet_strict` запрещает их. Подробная семантика paths, reversibility, deposits и режимов — `STRUCTURE_AUDIT_RU.md`, раздел `planet_closure`.

Специальная семантика `energy.signal` (v0.9.13):
- имя обязано разрешаться в STOCK;
- `request` обязан непосредственно читать этот STOCK ровно один раз;
- подключённые к signal STOCK FLOW допустимы только как `∅ → signal` или `signal → ∅` и обязаны классифицироваться как `information_signal`;
- только для такого объявленного signal audit разрешает один переход через STOCK при поиске общего planned-rate; общий traversal через STOCK остаётся запрещён;
- per-process `energy.fulfillment`, если задан, используется вместо глобального target и обязан разрешаться по output dependency path.

### `simple_capital` (v0.9.9)

Статический + runtime контракт простого капитала. Экземпляр: `name`, `sector`, `sizing_signal`, `roles` с восемью ролями (`capacity`, `desired_capacity`, `shortage`, `excess`, `desired_expansion`, `expansion`, `depreciation`, `retirement`) и `consumption[]`.

Статически проверяются типы, топология FLOW, обязательные formula+LINK зависимости, `sizing_signal: STOCK` и прямая ссылка Desired Capacity на этот STOCK. Дефект даёт `NON_CONFORMING` и общий HARD conformance FAIL: RUN_LAB падает, comparator/CHECK_CANDIDATE не переходят к numerical comparison. На simulation проверяются `capacity >= 0` и неотрицательность Expansion/Depreciation/Retirement/consumption FLOW.

Generated `open_boundaries` category `capital_retirement`: `direction: "sink"`, `closed_world: true`, причина «износ и вывод простого капитала: капитал покидает экономику». Она классифицирует `? <sector> Capacity Depreciation` и `? <sector> Capacity Retirement`.

В `planet_closure.capacity` добавлен `kind: "simple"` с обязательным `stock`. Как `kernel`, он доказывается reference path от output до STOCK не длиннее `max_hops`; в `planet_v1` это капитал, не exception. P2 отчёт: `kernel / simple / exceptions / undeclared`.

### `deposit` (v0.9.12)

Статический + runtime контракт конечных залежей. Экземпляр имеет поля `name`, `resource`, `undiscovered`, `proven`, `exploration`, `extraction`, `signal`, `consumption[]`.

Статически HARD проверяются:
- undiscovered/proven/signal — STOCK;
- exploration — FLOW undiscovered → proven;
- extraction — FLOW с source = proven;
- `X R Target Proven Reserves` — VARIABLE, непосредственно читает signal и имеет LINK;
- каждый consumption — FLOW из STOCK в ∅, непосредственно читает exploration и имеет LINK.

Runtime на каждом Mode: undiscovered/proven >= 0; exploration и все consumption FLOW >= 0; для каждого backing-блага `Consumption = Exploration × <R Deposit good per Discovery>` с `abs_tol`.

Generated merge также объявляет `planet_closure.processes[].deposit = {kind:"stock", stock:"{C} R Proven Reserves"}`, category `exploration_expenditure` и signal boundary patterns в существующей `information_signal`. Это закрывает P4 для соответствующих extraction-процессов и не оставляет новые boundary FLOW неклассифицированными.

### `capital_lifecycle` (v0.3/v0.4, совместимость)

Компактная форма с полем `items`; только три runtime-тождества, без статического слоя:

- Active <= Installed;
- Installed = Active + Inactive;
- если заданы `lifetime`, `decommissioning`, `retired`:
  `Lifetime = Installed + Decommissioning + Retired`.

В поставляемом `validation-v7.3.2.json` заменён на `capital_lifecycle_kernel`.

### `transport_allocator`

Проверяет:

- Priority Allocated Total Load = сумма commodity/direction allocations;
- allocated total <= capacity-limited total transport load.

## Generic checks

### `metric`

Метрика ряда в окне: `max`, `min`, `mean`, `first`, `last`.

```json
{
  "type": "metric",
  "column": "A Energy Unserved Demand",
  "metric": "max",
  "window": [900, 1080],
  "op": "<=",
  "value": 1e-8
}
```

### `change`

Разность `value(to_day) - value(from_day)`.

### `event_exists`

Событие должно появиться в заданном окне.

### `event_absent`

Событие не должно появиться в заданном окне.

### `event_order`

Перечисленные события должны существовать и появиться в указанном порядке.

### `relation` (v0.6.1)

Поточечное неравенство двух рядов — декларативный HARD-инвариант без кода лаборатории.

```json
{ "type": "relation", "name": "delivered <= demand", "left": "A Electronics Metal Input Delivery", "op": "<=", "right": "A Electronics Metal Input Demand", "abs_tol": 1e-8, "window": [0, 1080] }
```

`op` — только `<=` или `>=`.

### `identity` (v0.6.1)

Линейное тождество `Σ coef · column = 0` на каждом шаге.

```json
{ "type": "identity", "name": "feedstock balance", "abs_tol": 1e-8, "terms": [ { "column": "X", "coef": 1 }, { "column": "Y", "coef": -1 }, { "column": "Z", "coef": -1 } ] }
```

### `bounded` (v0.6.1)

Каждая точка ряда в `[min, max]` (любая граница опциональна).

```json
{ "type": "bounded", "name": "fulfillment in [0,1]", "column": "A Electronics Metal Input Fulfillment", "min": 0, "max": 1, "tolerance": 1e-9 }
```

`relation` / `identity` / `bounded` можно использовать и в `global_checks` (для всех Modes), и в `scenarios.<mode>.checks`.

Поддерживаемые операторы: `>`, `>=`, `<`, `<=`, `==`, `!=`.

## Статусы

- `PASS` — проверка пройдена.
- `NOTE` — информационная запись (например, счётчик closed-world нарушений); на `OVERALL` не влияет.
- `FAIL` — нарушено сформулированное требование.
- `WARN` — нефатальная диагностическая проблема.
- `SKIPPED` — проверка неприменима/не запрошена; например web CSV отсутствуют.

В v0.2 отсутствие web CSV не влияет на `OVERALL`.

## Plugin `labor` (v0.9.15)

```json
{
  "type": "labor",
  "abs_tol": 1e-9,
  "min_human_share": "Minimum Human Labor Share",
  "instances": [
    {
      "name": "A Smelting labor",
      "output": "A Metal Production",
      "intensity": "A Labor per Metal",
      "automation_level": "A Smelting Automation Level",
      "automation_factor": "A Smelting Automation Factor",
      "requirement": "A Smelting Labor Requirement"
    }
  ]
}
```

Статический conformance требует корректные типы ролей и прямые зависимости: `requirement` читает `output`, `intensity`, `automation_factor`; `automation_factor` читает `automation_level` и `min_human_share`. Runtime проверяет уровень автоматизации в [0,1], коэффициент в [`min_human_share`,1], неотрицательность `requirement` и тождество `requirement = output × intensity × automation_factor` с относительным допуском `abs_tol`.

В `planet_closure.processes[].labor` для `kind: "declared"` поддерживается поле `requirement`. Оно должно разрешаться в VARIABLE, которая непосредственно читает выход процесса и параметр `intensity`. В режиме `report` прежняя декларация без `requirement` остаётся допустимой; `planet_v1` и `planet_strict` дают mode failure `P5: labor declared without a requirement variable`.
