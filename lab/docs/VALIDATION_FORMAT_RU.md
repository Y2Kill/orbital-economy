# Validation format v0.6.0

`validation.json` — изменяемый контракт проверки конкретной версии модели. Ядро runner должно меняться реже, чем этот файл.

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

- Metal allocated <= requested;
- Electronics allocated <= requested;
- Energy Supply <= Active Generation Capacity;
- Supply = Metal allocation + Electronics allocation;
- Unserved = Total requested - Supply.

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
