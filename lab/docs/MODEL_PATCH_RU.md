# Model patch — формат поставки изменений модели (Lab v0.9.12)

## Зачем

Исполнитель, который не может запускать стенд (например, чат-модель), не должен возвращать целый ModelJSON на 584 КБ: слишком легко потерять элемент, сломать форматирование или незаметно тронуть чужую формулу. Вместо этого он отдаёт **патч** — небольшой JSON, перечисляющий только изменения. Стенд применяет его к замороженной accepted-модели детерминированно и получает candidate.

Патч — самостоятельный артефакт поставки: он ревьюируется глазами, он маленький, и он один-в-один соответствует событиям change-policy (`element_added`, `definition_changed`, `link_added`, `mode_added`, `scenario_input_changed`).

## Команда

```cmd
APPLY_PATCH.cmd "delivery\model-patch.json" "input\model\candidate.json"
```

База — всегда `reference\accepted\model\` (единственный JSON там). Если в патче указан `base_sha256`, он обязан совпасть с SHA базы — иначе отказ. Далее обычный цикл: `LIFECYCLE_CONFORMANCE` → `STRUCTURE_AUDIT` → `RUN_LAB` → `CHECK_CANDIDATE`.

## Формат `orbital-economy-model-patch-v1`

```json
{
  "format": "orbital-economy-model-patch-v1",
  "base_sha256": "57a2a102f2b632c69c37cc00c4cd11182ca2601d2af9395560228b5fdde0f44d",
  "name": "Orbital Economy <next-version> candidate r1",
  "description": "optional",

  "nodes": [
    { "type": "capital_lifecycle", "version": 1, "sector": "…", "...": "см. NODES_RU.md" }
  ],

  "add_elements": [
    { "type": "VARIABLE", "name": "Intermediate Inputs Enabled", "behavior": { "value": 1 }, "description": "…" },
    { "type": "STOCK",    "name": "X Some Stock", "behavior": { "initial_value": 0, "non_negative": true } },
    { "type": "FLOW",     "name": "A Electronics Metal Input Delivery", "from": "A Metal Inventory", "to": "A Electronics Feedstock Inventory",
                          "behavior": { "value": "IfThenElse([Intermediate Inputs Enabled] = 1, [A Metal Available for Intermediate Use], 0)" } }
  ],
  "replace_formulas": [
    { "name": "A Electronics Feedstock Price", "value": "IfThenElse([Intermediate Inputs Enabled] = 1, [A Market Price], <старая формула без изменений>)" },
    { "name": "Some Stock", "initial_value": 10 }
  ],
  "retarget_flows": [
    { "name": "A Mining", "from": "A Ore Proven Reserves", "to": null }
  ],
  "add_links": [
    { "from": "Intermediate Inputs Enabled", "to": "A Electronics Feedstock Price" },
    { "from": "A Market Price", "to": "A Electronics Feedstock Price" }
  ],
  "modify_scenarios": [
    { "mode": 0, "set": { "Intermediate Inputs Enabled": 0 } }
  ],
  "add_scenarios": [
    { "name": "v7.4 Intermediate Inputs Baseline", "description": "…", "values": { "Timed Test Mode": 17, "Capital Lifecycle Enabled": 1, "Intermediate Inputs Enabled": 1 } }
  ]
}
```

| Секция | Правила |
|---|---|
| `nodes` | необязательный массив строгих деклараций узлов. Перед обычными секциями они детерминированно раскрываются относительно той же base-модели; каждый следующий узел видит результат предыдущего. Неизвестный тип/поле, отсутствующее обязательное поле или ссылка на отсутствующий элемент — отказ с путём поля. Если узел и явная секция одновременно добавляют/заменяют один элемент — отказ. Подробно: `NODES_RU.md`. |
| `add_elements` | имя не должно существовать; `VARIABLE`/`FLOW` требуют `behavior.value`, `STOCK` — `behavior.initial_value`; у `FLOW` поля `from`/`to` обязательны явно (`null` = граница модели) и должны указывать на существующие **STOCK**; `display` не передавать; `FLOW` получает `non_negative: true`, если не указано иное |
| `replace_formulas` | цель должна существовать; для не-STOCK — `value`, для STOCK — `initial_value`; **вся** новая формула целиком (не диф) |
| `retarget_flows` | изменение только endpoints существующего FLOW: `name`, обязательные `from`/`to`, где `null` = граница; ненулевой endpoint обязан существовать и быть STOCK. Один FLOW нельзя retarget дважды, generated node-retarget нельзя дублировать explicit-записью. |
| `add_links` | оба конца существуют (в том числе только что добавленные); дубликаты — отказ. Ссылка `[X]` в формуле без LINK `X → элемент` — это ошибка модели, которую поймает `LIFECYCLE_CONFORMANCE` / `STRUCTURE_AUDIT` (model-wide references) |
| `modify_scenarios` | Mode должен существовать; ключи — существующие элементы; `Timed Test Mode` менять нельзя |
| `add_scenarios` | `values` обязан содержать числовой `Timed Test Mode`, которого ещё нет; все ключи — существующие элементы |

Не поддерживается намеренно: удаление, переименование, изменение типа и изменение `simulation`. Изменение `from`/`to` существующего FLOW допускается только через строгую секцию `retarget_flows`. Всё это — структурные регрессии, которые policy отклонит; если такое действительно нужно, это предмет отдельного решения, а не патча.

Порядок применения: раскрытие `nodes` → объединение с явными секциями → `add_elements` → `retarget_flows` → `replace_formulas` → `add_links` → `modify_scenarios` → `add_scenarios`. Старые патчи без `nodes` и `retarget_flows` проходят прежним путём без изменения семантики. `retarget_flows` может ссылаться на STOCK, добавленный тем же патчем; формулы в `add_elements` также могут ссылаться на элементы того же патча, а `add_links` — связывать новые элементы.

## Декларативные узлы (Lab v0.9.8)

`APPLY_PATCH` принимает `nodes` напрямую; ручного предварительного раскрытия не требуется. Для ревью или генерации обычного v1 patch используется:

```cmd
node src\cli.js expand-nodes <node-or-patch.json> <base-model.json> --out=output\expanded
node src\cli.js expand-nodes <node-or-patch.json> <base-model.json> --out=output\expanded --validation=input\validation\validation-v7.7.10.json
```

Команда пишет `patch.expanded.json` и `validation.fragments.json`; с `--validation` также `validation.merged.json`. Уже присутствующий generated validation-фрагмент не дублируется: он обязан совпасть (для kernel instance допускается только дополнительный `policy_notes` у принятой записи). Если merge ничего не меняет, validation копируется побайтно.

Сейчас поддерживаются `capital_lifecycle`, `simple_capital` и `deposit` v1. Две декларации лежат в `../model/nodes/`; семь более ранних kernel-экземпляров остаются рукописными и этой задачей не переписываются. Схема, границы ответственности и QA: `NODES_RU.md`.

## Синтаксис формул (то, что нужно знать автору патча)

- Ссылка на элемент — имя в квадратных скобках: `[A Metal Inventory]`. Регистр не важен, пробелы значимы.
- Условие: `IfThenElse(cond, a, b)`; сравнение `=`, `>`, `<`, `>=`, `<=`; логика `and`, `or`.
- `max(a, 0)` и `min(a, b)` в модели по историческим причинам записаны через `(x + (x^2)^0.5)/2`; допустимо использовать и функции `Max()` / `Min()` движка, но в **существующих** формулах ничего не переписывать.
- Каждый `[Ref]` в формуле требует LINK `Ref → элемент` (у FLOW тоже). Для STOCK, к которому привязан FLOW, LINK не нужен.
- Для правок существующих формул обязательна форма `IfThenElse([Switch] = 1, new, old)` — см. спецификацию версии, §0.

## Что делает стенд после применения

Кандидат записывается как обычный ModelJSON (`elements`, `scenarios`, `name`), SHA печатается. Дальше он ничем не отличается от вручную собранной модели: те же гейты, та же policy. Patch в поставке — дополнительный, а не заменяющий артефакт: приёмка всё равно идёт по candidate ModelJSON, который собрал стенд.


## Проверка патча в CI

Для задачи в ветке `task/NNN-имя` поставка кандидата лежит рядом с заданием:

```text
docs/tasks/NNN-имя/candidate/
  model-patch.json      обязательно
  validation.json       необязательно
  change-policy.json    необязательно
```

При push изменения внутри этой папки workflow `.github/workflows/candidate.yml` определяет папку задачи по номеру `NNN` из имени ветки и запускает на Ubuntu / Node 24.11.1 тот же приёмочный цикл, что используется владельцем проекта:

```text
apply-patch → conformance → audit → validation → policy
```

Если `validation.json` или `change-policy.json` в папке кандидата отсутствуют, берутся принятые `validation/` и строгая `policy/`. Зависимости стенда устанавливаются офлайн только из `lab/vendor/`.

Каждый гейт имеет отдельный статус; последующие гейты выполняются и после провала предыдущего там, где входные файлы уже существуют. В конце workflow печатает сводную таблицу PASS/FAIL, SHA-256 кандидата и validation, `COMPARISON RESULT`, `POLICY RESULT`, счётчики policy и первые неожиданные события. Та же сводка попадает в job summary, а полный `lab/output/` загружается артефактом.

По умолчанию выполняются все Modes. Запуск с ограниченным `modes` через `workflow_dispatch` считается **диагностическим**: строгая policy требует полного покрытия и вправе отклонить такой запуск.

SHA validation, который нужен для привязки собственного `change-policy.json`, напечатан в шаге `apply-patch` и в финальной сводке как `Validation SHA-256`. Его следует копировать без изменений в поле policy `validation_sha256`.
