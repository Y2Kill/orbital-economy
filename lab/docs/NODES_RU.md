# Declarative Nodes — Orbital Economy Lab v0.9.9

## 1. Назначение

Node declaration — короткое строгое описание повторяемой конструкции модели. Она не является новым форматом ModelJSON и не меняет правила приёмки: стенд детерминированно раскрывает declaration в обычные секции model patch v1 и отдельный generated validation fragment.

Основная цель v0.9.8 — не дублировать вручную десятки STOCK/VARIABLE/FLOW/LINK и одинаковые kernel-v2 declarations для отраслей с одним Capital Lifecycle pattern.

Нормативные источники для текущего типа:
- `../../model/nodes/README.md` и сами декларации;
- `../../docs/CAPITAL_LIFECYCLE_KERNEL_SPEC.md` §§2–4;
- формулы принятой модели. Прототип задачи 015 служит эталоном формул реализации, но не является отдельной спецификацией.

## 2. Поддерживаемый тип

Registry содержит два типа: `capital_lifecycle`, `version: 1`, и `simple_capital`, `version: 1`.

Минимальная форма:

```json
{
  "type": "capital_lifecycle",
  "version": 1,
  "sector": "Example Plant",
  "colonies": ["A", "B"],
  "switch": "Example Capital Enabled",
  "initial_capacity": { "A": 1, "B": 1 },
  "parameters": {
    "Operating Reserve Factor": 1.1,
    "Installed Reserve Factor": 1.15,
    "Activation Time": 20,
    "Mothball Time": 10,
    "Surplus Disposal Decision Time": 240,
    "Construction Time": 120,
    "Decommissioning Time": 540,
    "Depreciation Rate": 0.0001,
    "Capital Goods per Capacity": 5
  },
  "sizing": {
    "signal": { "name": "{C} Example Demand Signal", "create": false }
  },
  "capacity_output": {
    "variable": "{C} Example Production Capacity",
    "replaces": "{C} Example Base Production Capacity"
  },
  "backing": [
    {
      "good": "Capital Goods",
      "fulfillment": "{C} Capital Goods Fulfillment",
      "inventory": "{C} Capital Goods Inventory",
      "demand": "{C} Capital Goods Demand"
    }
  ],
  "planet_process": "example"
}
```

`{C}` заменяется именем колонии. `parameters` — числовые sector parameters, из которых создаются переменные `<sector> <parameter>`.

### Sizing signal

При `create: false` указанный `signal.name` уже обязан существовать в base-модели для каждой колонии.

При `create: true` обязательны `demand`, `initial` и `adjustment_time {name,value}`; генератор создаёт signal STOCK и два сглаживающих FLOW. Все ссылки demand должны существовать в base.

### Backing

Каждый элемент `backing[]` задаёт ресурс, который физически обеспечивает Expansion:
- `fulfillment` ограничивает Expansion;
- `inventory` — STOCK-источник consumption FLOW;
- `demand` получает switch-gated добавку `Desired Expansion * <good> per Capacity`;
- `good` определяет имя consumption и параметр `<good> per Capacity`.

## 3. Строгая схема и ошибки

Schema закрытая: неизвестное поле — ошибка, как и неизвестный `type`, отсутствующее обязательное поле, неверный тип значения или дубликат колонии. Сообщение содержит путь, например `nodes[0].backings: unknown field`.

До выдачи patch генератор также проверяет:
- каждый внешний element reference существует;
- generated element name не конфликтует с base и не генерируется дважды;
- capacity replacement formula действительно содержит указанную ссылку `capacity_output.replaces`;
- все `[Ref]` в generated/replacement formulas разрешаются;
- один target не заменяется дважды.

Ошибки не маскируются fallback-логикой: декларация либо полностью раскрывается, либо операция завершается отказом.

## 4. Результат раскрытия

Для каждого узла возвращаются:

```text
patch.add_elements
patch.replace_formulas
patch.add_links

validation.kernel_instances
validation.capital_transformation_names
validation.transformation_pairs
validation.planet_closure
```

LINK строятся детерминированно из ссылок формул, без дубликатов относительно base.

Для `capital_lifecycle` generated validation объявляет kernel-v2 roles, пару Expansion → backing consumption flows и `planet_closure.capacity = {kind:"kernel", stock:"{C} <sector> Active Capacity"}`.

`description` generated elements служит человеку и не является частью oracle case 1; type/endpoints/behavior, replacement formulas и LINK должны совпадать.

## 5. Использование в model patch

Patch v1 может содержать:

```json
{
  "format": "orbital-economy-model-patch-v1",
  "nodes": [
    { "type": "capital_lifecycle", "version": 1, "...": "..." }
  ],
  "add_elements": [],
  "replace_formulas": [],
  "add_links": []
}
```

`APPLY_PATCH` раскрывает nodes относительно той же base-модели. Несколько nodes обрабатываются по порядку: следующий видит generated элементы предыдущего.

Generated секции затем объединяются с явными. Если один element name одновременно попал в generated add/replace и explicit add/replace, это ошибка, а не правило приоритета.

Старые patch v1 без `nodes` остаются совместимыми и идут прежним путём.

## 6. CLI `expand-nodes`

```cmd
node src\cli.js expand-nodes <node-or-patch.json> <base-model.json> --out=output\expanded
```

Выход:
- `patch.expanded.json` — обычный patch v1 без `nodes`;
- `validation.fragments.json` — массив generated validation fragments.

С merge:

```cmd
node src\cli.js expand-nodes <node-or-patch.json> <base-model.json> --out=output\expanded --validation=input\validation\validation-v7.7.4.json
```

Дополнительно появляется `validation.merged.json`. Merge идемпотентен:
- существующий kernel instance сравнивается по generated полям; дополнительный `policy_notes` принятой записи разрешён;
- существующая transformation pair и planet capacity обязаны совпасть;
- уже существующее имя boundary category не добавляется повторно;
- если semantic merge ничего не меняет, исходная validation копируется побайтно, включая завершающий перевод строки.

## 7. QA и воспроизводимость

`NODE_SELF_TEST.cmd` / `npm run node-qa` содержит 9 случаев. Oracle case 1 строится из **текущей** accepted-модели: две declaration-конструкции снимаются в обратном порядке и собираются заново. Историческое имя/тег модели и фиксированное общее число elements тесту не нужны.

На baseline v7.7.4 r1 Linux CI задачи 015:
- Construction Materials Plant — 69 add / 6 replace / 126 LINK;
- Capital Goods Plant — 76 / 6 / 138;
- validation fragments равны принятым;
- schema/reference/conflict/determinism cases PASS;
- CLI merge accepted validation — 871633 bytes identical;
- итог: `NODE SELF-TEST: 9 passed, 0 failed`.

Это CI разработки, не канонический Windows acceptance.

## 8. Граница задачи 015

Задача 015 не переводит существующую модель на новый источник истины. Две declaration в `model/nodes/` уже существовали и этой задачей не меняются. Семь более ранних Capital Lifecycle kernel instances остаются рукописными.

Accepted ModelJSON, validation и policy также не меняются. Генератор — инфраструктура для будущих model tasks и способ доказать, что короткая declaration воспроизводит уже принятую конструкцию.

## 9. `simple_capital` (v0.9.9)

`simple_capital` — мощность как простой капитал без Active/Inactive/Retired lifecycle. Декларация использует ту же закрытую форму верхнего уровня, что `capital_lifecycle`: `sector`, `colonies`, `switch`, `initial_capacity`, числовые `parameters`, `sizing.signal`, `capacity_output`, `backing[]`, `planet_process`. Неизвестные поля отвергаются с точным путём.

На колонию создаются `Capacity` STOCK; `Desired Capacity`, `Capacity Shortage`, `Capacity Excess`, `Desired Expansion`; FLOW `Expansion` (∅ → Capacity), `Capacity Depreciation` и `Capacity Retirement` (Capacity → ∅), а также consumption FLOW на каждое backing-благо. При `sizing.signal.create=true` создаются signal STOCK и Increase/Decrease FLOW. Desired Capacity обязана непосредственно читать объявленный STOCK-сигнал; мгновенный VARIABLE спрос запрещён conformance-слоем.

Generated validation fragment содержит `simple_capital_instances`, имена Expansion/consumption для `capital_transformation`, Depreciation/Retirement для `capital_retirement`, transformation pairs и `planet_closure.capacity = {kind:"simple", stock:"{C} <sector> Capacity"}`. При `--validation` отсутствующие plugin `simple_capital` и category `capital_retirement` создаются; повторный merge идемпотентен, несовпадающая существующая запись — ошибка.

Фикстура `lab/fixtures/nodes/regolith-mine-simple.json` раскрывается в **34 add / 6 replace / 78 LINK** — тот же element set, формулы, replacements, links и validation fragment, что reference-прототип задачи 016. `NODE_SELF_TEST` v0.9.9 содержит 15 случаев: прежние 1–9 и cases 10–15 для simple capital, включая strip/rebuild, STOCK sizing rule, conflicts, strict schema, determinism и runtime Mode 38 probe.
