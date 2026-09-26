# Change Policy / Regression Policy — Orbital Economy Lab v0.5.0

## 1. Зачем нужен этот слой

`COMPARE_MODELS.cmd` отвечает на фактический вопрос:

> Что изменилось между accepted и candidate?

Он намеренно не решает, допустимо ли изменение.

Change Policy добавляет второй, независимый слой:

> Соответствуют ли обнаруженные изменения заранее записанному контракту?

Это особенно важно перед v7.4 и следующими версиями: часть изменений будет намеренной, но старые физические, бухгалтерские и regression-гарантии должны оставаться защищёнными.

Рекомендуемая схема:

```text
accepted model ─┐
                ├─ COMPARE_MODELS ─→ factual diff
candidate model ┘                         │
                                          ▼
                                  explicit policy JSON
                                          │
                                          ▼
                                    POLICY PASS/FAIL
```

Политика не оценивает качество экономического дизайна и не «угадывает намерение». Она только проверяет соответствие явному versioned contract.

---

## 2. Главная команда

Обычный путь:

```cmd
CHECK_CANDIDATE.cmd
```

По умолчанию используются:

```text
accepted   = reference\accepted\model\<единственный JSON>
candidate  = input\model\<единственный JSON>
validation = input\validation\<единственный JSON>
policy     = input\policy\<единственный JSON>
Modes      = all
```

Команда сначала выполняет полный accepted ↔ candidate comparison, затем применяет policy к полученному diff.

Результаты одного запуска лежат вместе:

```text
output\policy-<timestamp>\
    model-comparison.json
    model-comparison.md
    change-policy.json
    change-policy.md
```

Итог в консоли:

```text
POLICY RESULT: PASS
```

или:

```text
POLICY RESULT: FAIL
```

Exit code `0` означает PASS, `2` — FAIL/ошибка.

---

## 3. Быстрая переоценка уже готового comparison

При настройке policy нет смысла каждый раз заново считать 17 Modes.

Если уже существует:

```text
output\compare-...\model-comparison.json
```

можно выполнить:

```cmd
EVALUATE_POLICY.cmd "output\compare-...\model-comparison.json"
```

Это **не запускает simulation**. Policy применяется к уже сохранённому factual diff почти мгновенно.

Для policy, которая фиксирует comparator tolerance, используйте `model-comparison.json`, созданный **v0.4.0 или новее**: такой report явно хранит фактические `abs/rel tolerance`. Старый report без этих полей будет отклонён preflight вместо небезопасного предположения о режиме сравнения.

Вторым аргументом можно передать другой policy JSON:

```cmd
EVALUATE_POLICY.cmd "output\compare-...\model-comparison.json" "D:\policy\v7_4_policy.json"
```

---

## 4. Безопасный default

Рекомендованный и поставляемый режим:

```json
"default_action": "deny"
```

Это означает:

> Любое изменение, которое не разрешено явным правилом, является policy FAIL.

Для текущего accepted v7.7.1 r1 в комплекте лежит строгий baseline:

```text
input\policy\change-policy-v7.5.1-strict.json
```

У него нет allow-rules. Поэтому accepted == candidate проходит, а любое структурное или численное отличие блокируется.

Ревизии **r2** (Lab v0.5.0, validation-v7.3.1: плагин `capital_lifecycle_kernel`) и **r3** (Lab v0.6.0, validation-v7.3.2: + `open_boundaries`, `colony_symmetry`) отличаются от r1 только полем `validation_sha256`. Accepted-модель и её SHA не изменились. Это показательный пример правила: **изменение validation-контракта = новая ревизия policy**, а не правка старой.

---

## 5. Привязка policy к правильной контрольной точке

Policy обязательно содержит SHA-256 accepted-модели:

```json
"accepted_model_sha256": "299216122552a6819e5ef6432f8dc51197cde7c0862de7a43edd8eef359aeeda"
```

Также рекомендуется фиксировать validation SHA:

```json
"validation_sha256": "c8a6...(см. файл)"
```

Если policy применяется к другому accepted baseline или другому validation contract, preflight завершается FAIL.

Policy также может фиксировать engine:

```json
"engine": {
  "package": "simulation",
  "version": "9.0.0"
}
```

Это не заменяет `ENGINE_PIN.md`, но не позволяет policy молча оценивать diff, полученный другим зарегистрированным engine version.

Таким образом policy нельзя случайно использовать против «не той» контрольной точки.

---

## 6. Привязка к точности comparator

Policy может зафиксировать режим сравнения:

```json
"comparison": {
  "abs_tolerance": 0,
  "rel_tolerance": null,
  "rel_floor": 1e-12
}
```

Для нашей текущей regression-схемы используется точное сравнение:

```text
abs tolerance = 0
rel tolerance = disabled
```

Если comparison был выполнен с другой tolerance, policy preflight завершится FAIL.

Это защищает от ситуации, когда regression случайно «исчезла» из-за слишком широкой tolerance.

---

## 7. Формат policy

Минимальная политика:

```json
{
  "format": "orbital-economy-change-policy-v1",
  "name": "Example policy",
  "accepted_model_sha256": "...64 hex...",
  "validation_sha256": "...64 hex...",
  "comparison": {
    "abs_tolerance": 0,
    "rel_tolerance": null,
    "rel_floor": 1e-12
  },
  "engine": {
    "package": "simulation",
    "version": "9.0.0"
  },
  "require_full_mode_coverage": true,
  "default_action": "deny",
  "rules": []
}
```

`rules` проверяются сверху вниз. **Первое правило**, совпавшее по `event`, `modes` и `name`, владеет событием.

Для финального gate рекомендуется также:

```json
"require_full_mode_coverage": true
```

Тогда policy FAIL, если factual comparison был запущен только на части Modes. Это защищает от случайного принятия candidate после диагностического прогона `--modes=14`. Для локальной диагностики частичный `COMPARE_MODELS` допустим; финальный `CHECK_CANDIDATE` должен использовать все Modes.

Это позволяет поставить узкий запрет раньше широкого разрешения.

---

## 8. Типы событий

Policy получает нормализованные события из factual diff.

### Структура ModelJSON

```text
element_added
element_removed
definition_changed
type_changed
link_added
link_removed
simulation_changed
```

### Scenario contract

```text
mode_added
mode_removed
scenario_input_changed
scenario_renamed
```

### Simulation outputs

```text
time_axis_changed
series_added
series_removed
series_changed
```

Candidate-only Mode не превращается в сотни искусственных `series_added`: для него создаётся `mode_added`, а сам Mode отдельно запускается и проходит validation.

---

## 9. Простое разрешение одного изменения

Например, если мы намеренно меняем definition:

```json
{
  "id": "v74-change-electronics-input-demand",
  "action": "allow",
  "event": "definition_changed",
  "name": "A Electronics Input Demand"
}
```

`name` поддерживает glob:

```text
*   любое количество символов
?   один символ
```

Например:

```json
"name": "* Intermediate Input *"
```

---

## 10. Ограничение по Modes

Пример для Mode 14:

```json
{
  "id": "mode14-electronics-output",
  "action": "allow",
  "event": "series_changed",
  "modes": 14,
  "name": "A Electronics Production"
}
```

Поддерживаются:

```json
"modes": 14
"modes": [14, 16]
"modes": "12-16"
"modes": "0,12-16"
"modes": "*"
```

---

## 11. Разрешение группы series

Например:

```json
{
  "id": "v74-new-input-series",
  "action": "allow",
  "event": ["series_added", "series_changed"],
  "modes": "12-18",
  "name": "* Input *"
}
```

Такое широкое правило следует использовать только когда область изменения действительно определена архитектурой.

В проекте лучше несколько узких правил, чем одно `name: "*"` для всех Modes.

---

## 12. Required expected change

Иногда недостаточно разрешить изменение — нужно убедиться, что оно **действительно произошло**.

```json
{
  "id": "v74-must-add-input-fulfillment",
  "action": "allow",
  "event": "series_added",
  "name": "A Intermediate Input Fulfillment",
  "required": true
}
```

Если candidate не добавил такой series:

```text
REQUIRED_CHANGE_MISSING
POLICY RESULT: FAIL
```

Это полезно как acceptance criterion: policy проверяет не только отсутствие regressions, но и наличие ключевой части запланированного изменения.

---

## 13. Ограничение масштаба численного изменения

Для `series_changed` allow-rule может ограничивать размер изменения:

```json
{
  "id": "bounded-price-change",
  "action": "allow",
  "event": "series_changed",
  "modes": 17,
  "name": "A Market Price",
  "max_abs": 5,
  "max_rel": 0.25,
  "max_changed_points": 2000
}
```

Если имя/Mode совпали, но threshold превышен, событие классифицируется как:

```text
THRESHOLD_EXCEEDED
```

и policy завершается FAIL.

Важно: threshold не должен использоваться для сокрытия плохо понятого поведения. Сначала надо понимать ожидаемый эффект и только потом задавать bound.

---

## 14. Явный deny-rule

Даже если позже есть широкое allow-rule, можно поставить запрет выше:

```json
{
  "id": "never-remove-transport-accounting",
  "action": "deny",
  "event": ["element_removed", "series_removed"],
  "name": "*Transport*"
}
```

Поскольку правила идут сверху вниз, этот deny сработает до последующего широкого allow.

---

## 15. HARD validation не отключается policy

Policy не может разрешить:

- static ModelJSON failure;
- `model.check()` failure;
- simulation error;
- candidate validation/HARD physics/accounting failure.

Даже правило вида:

```json
{
  "action": "allow",
  "event": "*",
  "name": "*"
}
```

не превращает HARD failure в PASS.

Это сознательное разделение:

```text
physics / accounting correctness  = validation layer
intentional version changes       = change-policy layer
```

---

## 16. Классификации в отчёте

### EXPECTED_CHANGE

Событие совпало с `action: allow`.

### DEFAULT_ALLOWED

Событие прошло через `default_action: allow`. Для основного проекта этот режим не рекомендуется.

### UNEXPECTED_CHANGE

Событие не совпало ни с одним rule, а default = deny.

### FORBIDDEN_CHANGE

Событие явно совпало с `action: deny`.

### THRESHOLD_EXCEEDED

Allow-rule нашёл нужное событие, но численный bound превышен.

### Required change missing

Rule с `required: true` не разрешил ни одного события.

Любой из последних четырёх случаев делает policy FAIL.

---

## 17. Предлагаемый процесс для v7.4

Сначала НЕ менять policy «по факту того, что получилось».

Правильная последовательность:

```text
1. Сформулировать V7_4_ARCHITECTURE_SPEC.md
2. Сформулировать V7_4_TEST_PLAN.md
3. На их основе написать v7.4 change-policy
4. Только потом менять ModelJSON
5. RUN_LAB.cmd
6. CHECK_CANDIDATE.cmd
7. Разбирать каждое unapproved изменение
```

Таким образом policy является частью спецификации версии, а не способом постфактум «позеленить» отчёт.

---

## 18. Что обычно должно оставаться default-deny

До отдельного решения не разрешать автоматически:

- `element_removed`;
- `type_changed`;
- `link_removed`;
- `mode_removed`;
- `simulation_changed`;
- `scenario_input_changed` для старых regression Modes;
- `series_removed`;
- изменения старых Modes вне явно затронутого механизма.

Это не означает, что они никогда не допустимы. Это означает, что для них требуется отдельное осознанное rule + обоснование.

---

## 19. QA policy layer

Запуск:

```cmd
POLICY_SELF_TEST.cmd
```

Проверяются:

- strict no-change policy PASS на пустом diff;
- default-deny ловит незаявленное изменение;
- explicit allow пропускает заявленное изменение;
- `required: true` ловит отсутствующее ожидаемое изменение;
- numerical threshold реально ограничивает изменение;
- SHA binding не позволяет применить policy к другой accepted-модели;
- реальный Mode 0 с контролируемым изменением отклоняется strict policy;
- тот же реальный diff проходит, когда все его изменения явно покрыты правилами.

Рабочие `input/`, `reference/`, `output/` QA не изменяет.

---

## 20. Практическое правило проекта

Change policy должна отвечать не на вопрос:

> Что мы готовы проигнорировать?

а на вопрос:

> Какие именно отличия мы заранее считаем частью этой версии и какие старые гарантии обязаны сохраниться?

При сомнении лучше оставить изменение незаявленным и получить FAIL, чем добавить слишком широкое allow-rule.
