# Structure audits — границы, A/B-симметрия, алгебраические петли и Planet v1 closure (Lab v0.9.6)

Четыре статические проверки структуры ModelJSON, выполняемые до симуляции. `open_boundaries`, `colony_symmetry` и `planet_closure` объявляются как плагины validation JSON. `algebraic_loops` выполняется **всегда**, независимо от validation. `planet_closure` с v0.9.6 связывает физические source-процессы с декларативным контрактом Planet v1 по мощности, энергии, исчерпаемым запасам, труду и внешнему спросу.

```text
STRUCTURE_AUDIT.cmd  → output\audit-<timestamp>\structure-audit.md/.json
```

Также выполняются внутри `RUN_LAB` (раздел «Structure audits (static)» в `report.md`) и в static validation `COMPARE_MODELS` / `CHECK_CANDIDATE` (FAIL → `NOT_COMPARED`, policy видит hard blocker).

---

## 1. `open_boundaries` — счётчик до «самостоятельной планеты»

### Зачем

Стратегия проекта: расти вширь, пока модель не станет самостоятельной планетой. Проверяемый критерий:

> нет физических потоков из ∅ и в ∅, кроме первичной добычи, конечного потребления/отходов и учётных (нефизических) потоков.

Каждый FLOW с `from: null` или `to: null` пересекает границу модели. Плагин классифицирует такие потоки по упорядоченному списку категорий; у категории есть флаг `closed_world`. Потоки в категориях с `closed_world: false` — то, что должно исчезнуть к «планете». Их число — **прогресс-метрика**.

### Формат

```json
{
  "type": "open_boundaries",
  "enforce": "classify",
  "categories": [
    { "id": "primary_extraction", "closed_world": true,  "direction": "source", "name": ["* Mining", "* Feedstock Extraction"], "reason": "…" },
    { "id": "external_capital",   "closed_world": false, "direction": "source", "name": ["* Expansion"], "reason": "capital is created without physical goods" }
  ]
}
```

| Поле | Значение |
|---|---|
| `enforce` | `report` — никогда не FAIL; `classify` (по умолчанию) — неклассифицированный поток = FAIL, closed-world нарушения = NOTE; `closed_world` — любое нарушение = FAIL (включается, когда планета объявлена самостоятельной) |
| `categories[].id` | уникальный идентификатор |
| `categories[].closed_world` | обязательное булево: допустима ли категория в самостоятельной планете |
| `categories[].direction` | опционально `source` / `sink`; ограничивает совпадение направлением |
| `categories[].name` | glob или список glob (`*`, `?`, без учёта регистра); первая совпавшая категория владеет потоком |
| `categories[].reason` | текст для отчёта |

### Baseline v7.3 r2

```text
open boundaries: 104 of 135 flows; unclassified=0; closed-world violations=0
      primary_extraction         4     (Mining, Feedstock Extraction)
      final_consumption          4     (Local Consumption)
      unit_transformation        8     (Ore→Metal, Feedstock→Electronics как пара sink/source)
      information_signal        30     (сглаживающие сигналы, Freight Price)
      financial_accounting      16     (Book / Recognize Contract Value)
      capital_state_accounting  21     (Activation / Mothballing / Active Depreciation)
    ! external_capital           7     (все семь потоков Expansion)  ← не допускается в самостоятельной планете
```

Исторически семь `Expansion`-потоков (Refinery A/B, Electronics A/B, Power A/B, Transport) создавали капитал из ничего — счётчик показывал 7. Закрывалось kernel-v2: `expansion` физически потребляет capital goods. Путь: 7 (v7.4) → 1 (v7.5, оставался транспорт) → **0** (v7.5.1). Ноль означает выполнение объявленного контракта границы расширения капитала, а не завершённость Planet v1; дорожная карта — `../../docs/ROADMAP.md`.

Ограничения: аудит видит только стоки и потоки. Энергия в модели — не сток, поэтому «генерация не потребляет топливо» здесь не фиксируется; это отдельный будущий инвариант. Пары `unit_transformation` не проверяются на массовый баланс.

### Пары преобразования (v0.9.0)

SD-поток не конвертирует единицы, поэтому «руда → металл», «feedstock → электроника», «оборудование → мощность» — пары **источник** (∅ → сток) + **сток(и)** (сток → ∅). Категория с `requires_pair: true` требует, чтобы каждый её поток входил в объявленную пару:

```json
"transformation_pairs": [
  { "source": "A Metal Production", "sinks": ["A Ore Consumption"], "identity": "A ore->metal pair identity" }
]
```

Поток такой категории без пары → FAIL (classify); пара на несуществующий поток → FAIL. Численное тождество пары (`sink = source × коэффициент`) — обычная `identity`-проверка в validation (поле `identity` — её имя, для отчёта). Baseline v7.4 (validation-v7.4.2): 4 пары объявлены и проверяются на всех Modes; v7.5 добавляет пары для капитала, и категория `external_capital` пустеет по-настоящему, а не переименованием.

### Правило для новых секторов

Каждый новый граничный поток обязан быть классифицирован, иначе `classify` даёт FAIL. Это сознательное трение: автор нового сектора должен ответить, почему поток пересекает границу модели, и допустим ли он в планете.

---

## 2. `colony_symmetry` — зеркальность A/B

### Зачем

Модель строится из зеркальных блоков колоний. При росте вширь каждый сектор добавляется в обе колонии; ручное дублирование рано или поздно рассинхронизирует их. Kernel-conformance защищает только lifecycle-часть. Этот аудит защищает всё остальное.

### Что проверяется

Для каждого элемента, чьё имя содержит токен колонии (`A` или `B` как отдельное слово — включая парные `Landed A Price in B`), вычисляется зеркальное имя (A↔B). Требуется:

- зеркальный элемент существует (`missing_mirror`);
- тот же тип (`type`);
- формула `value` / `initial_value` после зеркального переименования ссылок совпадает (`formula`) — **только если формула содержит ссылки**; чисто числовые константы могут отличаться и лишь перечисляются как «parameter differences»;
- у FLOW зеркальные `from`/`to` (`endpoints`);
- у каждого LINK с токеном колонии есть зеркальный LINK (`link`).

### Формат

```json
{
  "type": "colony_symmetry",
  "tokens": ["A", "B"],
  "enforce": true,
  "exceptions": [
    { "name": "B Effective Wage", "reason": "Mode 4 reverse-advantage wage override layer exists for B only" }
  ]
}
```

`exceptions[].reason` обязателен: недокументированная асимметрия не принимается спецификацией. Исключение по имени снимает элемент и все его LINK с проверки.

### Baseline v7.3 r2

```text
pairs=646, links=1252, mismatches=0, parameter differences=42, exceptions=17
```

Все 17 исключений — **тестовая обвязка сценариев**, не экономика: шоки спроса/стоимости подключены к одной колонии по дизайну Mode (`? Effective Local Base Demand`, `? Effective Electronics Local Base Demand`, `? Effective Ore Base Cost`, `? Power Active Generation Capacity`), а слой override'ов Mode 4/8 существует только у B (`B Effective Wage`, `B Effective Mining Capacity`, `Reverse B *`, `Priority Stress B Ore Base Cost`, и как следствие `? Metal Unit Cost`, `? Mining Rate`). 42 параметрических различия — начальные мощности, издержки, спрос, wage — легитимная гетерогенность колоний.

Это задокументированный долг: при первом же удобном случае override-слой стоит сделать симметричным (добавить `A Effective Wage`, `A Effective Mining Capacity` и т.д. с нейтральным поведением), после чего список исключений сократится до одного-двух сценарных. Изменение затронет набор элементов и потребует policy-правил `element_added`, но не изменит выходы.

---


## 3. `algebraic_loops` — скрытые алгебраические петли

### Что проверяется

Граф строится на одном шаге интегрирования:

- узлы — только `VARIABLE` и `FLOW`;
- `STOCK` разрывает граф: его текущее значение считается состоянием прошлого шага;
- ребро `X → Y` создаётся по ссылке `[X]` в формуле `Y`; имена ссылок и scenario values разрешаются как в стенде/движке по ключу `trim().toLowerCase()`, но в отчёте остаются канонические имена ModelJSON; визуальные `LINK` не являются источником истины;
- ссылка `[Name]`, которая не разрешается ни в один элемент, даёт **FAIL** с именем элемента и самой ссылкой, а не пропускается;
- self-reference считается петлёй.

Переключатель распознаётся **по данным**, а не по имени: VARIABLE имеет literal `0` или `1` в модели, задаётся хотя бы одним сценарием, и все сценарные значения этой переменной — только `0/1`. На accepted v7.7.1 r1 это даёт 7 переключателей и 128 комбинаций; `Timed Test Mode` не подходит, потому что принимает 0…31.

### Условные формулы

Для `IfThenElse(condition, yes, no)` ветка отсекается только когда condition можно вычислить исключительно из подставленных сценарных значений/переключателей, числовых литералов, скобок и сравнений `= < > <= >=`. Если условие зависит от состояния (`STOCK`), времени (`Days()`) или иной непонятной конструкции, сохраняются обе ветки.

Это намеренно консервативно: возможна лишняя находка, но условная петля не должна быть пропущена. Несбалансированные скобки и незакрытый `IfThenElse` — не «неизвестная формула», а **FAIL parser** с именем элемента.

### Два отчётных слоя

1. Все `2^N` комбинаций переключателей — поиск скрытых петель, которых пока нет ни в одном Mode.
2. Реальные Modes — подстановка всех scenario values (для пропущенных значений берётся числовой default модели). Это прогноз, в каких сценариях движок откажется считать.

Петли ищутся как SCC. Одинаковый состав SCC из разных комбинаций объединяется; в отчёте сохраняются размер, число комбинаций, первая комбинация и **кратчайший цикл внутри компоненты**. Исправлять следует именно этот путь, а не пытаться читать весь SCC.

Пример дефекта задачи 001 r1:

```text
A Desired Smelting Rate
→ A Positive Desired Smelting Rate
→ A Pre Energy Smelting Rate
→ A Metal Requested Energy
→ A Total Requested Energy
→ A Energy Fulfillment Ratio
→ A Electronics Allocated Energy
→ A Electronics Energy Fulfillment Ratio
→ A Electronics Production Rate
→ A Electronics Feedstock Consumption Rate
→ A Electronics Metal Input Target Inventory
→ A Electronics Metal Input Demand
→ A Metal Available for Intermediate Use
→ A Electronics Metal Input Delivery
→ A Desired Smelting Rate
```

### Команды и fail-fast

```cmd
node src\cli.js loops <model.json> --out=output\loops
LOOP_SELF_TEST.cmd
```

`loops` не требует validation. Exit code: 0 — петель нет, 1 — петля/parser FAIL, 2 — ошибка запуска/аргументов.

Аудит также входит в `runStructureAudits`, поэтому loop FAIL попадает в `structureAuditErrors`: `COMPARE_MODELS` / `CHECK_CANDIDATE` возвращают `NOT_COMPARED` **до simulation**.

Совместимость со старым API: если validation не содержит `open_boundaries` и `colony_symmetry`, общий `runStructureAudits.status` остаётся `SKIPPED` только при **PASS** безусловного loop audit. Любая петля или parser failure всё равно даёт `FAIL`.

### Ограничения

- Аудит знает синтаксис ссылок `[Name]` и `IfThenElse`, но не пытается быть полным интерпретатором языка формул.
- Нерешаемое условие не отбрасывает ветви, поэтому false positive допустим по дизайну.
- Это аудит алгебраических зависимостей одного шага, не анализ динамической устойчивости и не поиск циклов через STOCK во времени.

---

## 4. `planet_closure` — per-process аудит Planet v1

Плагин отвечает на вопрос, **какие физические процессы модели уже имеют явно объявленные ограничения P2–P6**, а какие ещё остаются долгом Planet v1. Он не заменяет `open_boundaries`: список ожидаемых производственных source-FLOW берётся именно из категорий `open_boundaries`, перечисленных в `process_categories`.

### Разрешение имён и доказательства зависимостей

Все имена элементов из декларации разрешаются по ключу `trim().toLowerCase()`; в JSON/Markdown выводятся канонические `element.name` из ModelJSON.

Утверждение «A читает B» считается доказанным только если существует reference path длиной не более `max_hops` (в декларации v7.7.1 — 4). Промежуточными узлами пути могут быть только VARIABLE/FLOW; конечной целью может быть STOCK. Если реальный shortest path существует, но длиннее лимита, FAIL сохраняет полный путь и число hops — это защищает от ложного признания далёкой экономической обратной связи локальным физическим ограничением.

### Роли P2–P6

- **P2 capacity**: `kernel` требует чтение указанного capacity STOCK; `constant` и `unbounded` — явные исключения с обязательным `reason`. Для constant дополнительно проверяется reversibility: параметр не должен использоваться вне dependency closure собственного output.
- **P3 energy**: `requests` требует energy request, включённый в total request, чтение fulfillment выпуском и общий planned-rate элемент; `producer` допустим для energy service; `none` — исключение с обязательным reason.
- **P4 deposits**: extraction может ссылаться на реальный deposit STOCK; отсутствие deposit пока считается отдельным долгом.
- **P5 labor**: `declared` intensity должна существовать и реально читаться формулой; `undeclared` считается отдельным долгом.
- **P6 demand drivers**: объявленные внешние параметры должны быть без STOCK-зависимости и реально вести к заявленным consumption flows.

Legacy-процессы учитываются отдельно и не входят в 17 активных P2–P6 process instances.

### Режимы enforce

- `report` — фактическая карта состояния; undeclared/исключения являются метриками, структурно ложная декларация всё равно FAIL.
- `classify` — дополнительно требует полноту process declaration для ожидаемых source outputs.
- `planet_v1` — требует полноту процессов, P2/P3 roles, deposit closure, labor declaration, demand drivers и нулевые reversibility violations; задокументированные P2/P3 exceptions пока разрешены.
- `planet_strict` — всё из `planet_v1` плюс **ноль P2/P3 exceptions**.

Accepted v7.7.1 r1 в режиме `report`:

```text
processes=17; legacy=2; expected source outputs=16
P2 capacity: kernel=7; exceptions=10; undeclared=0
P3 energy: requests=4; producer=2; exceptions=11; undeclared=0
P4 deposits: with=0; without=6
P5 labor: declared=4; undeclared=13
P6 demand drivers=4
reversibility=0
```

Это **не** означает завершённую Planet v1: текущие явные долги — шесть extraction без deposit STOCK и 13 process instances без labor declaration; strict дополнительно видит 10 capacity и 11 energy exceptions.

### Команда и отчёт

```cmd
node src\cli.js audit model.json validation.json --planet-closure=planet_closure.json --out=output\audit
PLANET_SELF_TEST.cmd
```

`--planet-closure` позволяет проверить декларацию отдельно до её включения в accepted validation: файл заменяет существующий `planet_closure` plugin либо временно добавляется в validation только в памяти. `structure-audit.md/.json` и RUN_LAB report показывают counters, reasons, undeclared, reversibility и dependency paths.

## 5. QA — `STRUCTURE_SELF_TEST.cmd` + `LOOP_SELF_TEST.cmd` + `PLANET_SELF_TEST.cmd`

20 случаев на мутированных копиях реальной модели; ожидаемый итог **21 passed, 0 failed**:

`open_boundaries`: baseline 90/0/7; неклассифицированный поток → FAIL (classify) / WARN (report); `closed_world` режим сегодня даёт FAIL; закрытие одного Expansion снижает метрику 7→6; ограничение по направлению; spec без `closed_world` отклоняется.

`colony_symmetry`: baseline 0 mismatches; без исключений тестовая обвязка **видна**, а не спрятана; структурное изменение формулы на одной стороне → mismatch; числовой параметр → не mismatch; удалённый элемент / retarget потока / удалённый LINK / смена типа → mismatch; исключение без reason → spec error; `enforce: false` → WARN.

Интеграция старых plugin-аудитов: `runStructureAudits` объединяет их; статические плагины не порождают runtime-записей (регресс-тест на «Неизвестный plugin» WARN); `compareModels` с асимметричным candidate → `NOT_COMPARED` без симуляции.

`LOOP_SELF_TEST.cmd`: 15 случаев. Accepted v7.7.1 r1 → 7 switches / 128 combinations / 0 loops; v7.6 r1 → 16/32 loop combinations и Modes 25–26; мутация задачи 001 r1 → 64/128 и Modes 17–31; lower-case construction-materials mutation → 64/128 и Modes 27–31; unresolved reference → FAIL; дополнительно engine agreement, STOCK/FLOW/self-loop, parser FAIL, static compare gate и deterministic JSON.

`PLANET_SELF_TEST.cmd`: **16 случаев**. Эталонные P2–P6 counters, L1–L5 false declarations с shortest paths, completeness/enforce modes, reversibility, deposits, demand/labor negatives, case-insensitive names, structure/CLI/static-only integration и deterministic JSON.

---

## 6. Что делать при FAIL

- **Неклассифицированный граничный поток**: добавить категорию или расширить существующую — с `reason` и честным `closed_world`. Не ставить `closed_world: true` только чтобы метрика не росла.
- **Асимметрия**: либо это ошибка (исправить модель), либо намеренная тестовая обвязка (добавить исключение с reason), либо новая экономическая асимметрия — тогда её надо описать в спецификации версии, а не в исключениях.
- Любое изменение validation JSON → новая ревизия change-policy (`validation_sha256`).

- **Алгебраическая петля**: читать `shortestCycle` и разрывать same-step зависимость архитектурно (обычно через state/signal или изменение направления зависимости). Не добавлять allow-list «разрешённых» петель: loop audit — HARD.

- **Planet closure**: не «лечить» FAIL увеличением `max_hops` или формальным reason. Ложную декларацию исправить; реальный Planet v1 debt должен оставаться видимым в соответствующем P2–P6 счётчике.
