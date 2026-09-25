# Сравнение accepted ↔ candidate моделей

Версия инструмента: **Orbital Economy Lab v0.5.0**.

## Назначение

`COMPARE_MODELS.cmd` сравнивает принятую модель с текущим кандидатом без участия web CSV.

По умолчанию используются:

- accepted: единственный JSON в `reference\accepted\model\`;
- candidate: единственный JSON в `input\model\`;
- validation: единственный JSON в `input\validation\`;
- Modes: все режимы, присутствующие в моделях.

В поставке v0.4.0 accepted reference — принятая **Orbital Economy v7.3 r2**, SHA-256:

`57a2a102f2b632c69c37cc00c4cd11182ca2601d2af9395560228b5fdde0f44d`

Accepted reference считается замороженным. Его нельзя заменять автоматически только потому, что появился новый кандидат.

## Самый простой рабочий процесс

1. Оставить accepted reference как есть.
2. Положить кандидат в `input\model\`. В этой папке должен быть **ровно один** JSON.
3. Положить актуальный validation contract в `input\validation\`. Там тоже должен быть ровно один JSON.
4. Запустить:

```cmd
COMPARE_MODELS.cmd
```

Результат появится в новой папке:

```text
output\compare-<timestamp>\
    model-comparison.md
    model-comparison.json
```

## Что сравнивается

### 1. Статическая валидность

Для accepted и candidate отдельно выполняются:

- `loadModelJSON()`;
- `model.check()`;
- проверка уникальности Mode;
- проверка дублирующихся scenario values.

Если одна из моделей не проходит статическую проверку, численное сравнение не запускается.

### 2. Структура и поведенческие определения

Инструмент показывает:

- добавленные named elements;
- удалённые named elements;
- элементы, у которых изменились `type`, `from`, `to` или `behavior`;
- изменения типа элемента;
- добавленные/удалённые LINK pairs;
- изменение simulation settings;
- добавленные/удалённые Modes;
- изменение scenario input values;
- переименование scenario.

`display`, координаты и описания намеренно не считаются изменением экономического поведения.

### 3. Численный результат

Для каждого общего Mode обе модели запускаются отдельно через `simulation@9.0.0`.

Сравниваются все доступные именованные временные ряды:

- временная сетка;
- число строк;
- общие series;
- series только в candidate;
- series только в accepted;
- число изменённых series;
- число изменённых точек;
- максимальная абсолютная разница;
- максимальная относительная разница;
- series и время, где найден максимум;
- крупнейшие изменённые series.

Начиная с v0.4.0 `model-comparison.json` сохраняет **полный** список changed series, а Markdown показывает только удобный diagnostic preview. Это необходимо, чтобы change-policy слой не мог пропустить изменение, оказавшееся ниже top-N.

По умолчанию численное сравнение **строгое**:

```text
abs tolerance = 0
rel tolerance = disabled
```

То есть любое численное отличие считается отличием результата.

### 4. Проверки candidate

Во время уже выполненного candidate simulation повторно используются текущие проверки из validation contract:

- time axis;
- finite values;
- non-negative rules;
- domain plugins;
- global checks;
- scenario-specific checks.

Это позволяет не выполнять candidate второй раз только ради обычной validation.

## Значения COMPARISON RESULT

### `BYTE_IDENTICAL`

Accepted и candidate имеют одинаковый SHA-256, а outputs совпадают.

### `OUTPUTS_IDENTICAL`

Файлы ModelJSON различаются, но все сравниваемые outputs во всех выбранных Modes совпали строго.

Такое возможно, например, после изменения неиспользуемого параметра или metadata.

### `OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED`

Outputs совпали, но состав Modes или scenario input values изменился. Это нельзя считать обычной regression-проверкой без анализа.

### `DIFFERENT_OUTPUTS`

Есть хотя бы одно отличие временных рядов, временной оси либо набора выходных series.

Это **факт различия**, а не автоматическое решение о том, что candidate плохой. Для новой функциональности изменения могут быть намеренными.

### `COMMON_OUTPUTS_IDENTICAL_WITH_NEW_MODES`

Все Modes, существующие и в accepted, и в candidate, дали одинаковый output, а candidate добавил новые Modes. Новые candidate-only Modes всё равно запускаются и проходят текущую validation, но у них нет accepted baseline для численного сравнения.

### `NOT_FULLY_COMPARABLE`

Один из выбранных Modes отсутствует в одной из моделей.

### `ERROR`

Не удалось корректно выполнить сравнение.

## RUN STATUS

Отдельно от `COMPARISON RESULT` выводится состояние самого запуска:

- `COMPLETE` — сравнение выполнено полностью;
- `INCOMPLETE` — не все Modes сопоставимы;
- `FAILED` — статическая ошибка, ошибка simulation или FAIL обязательных candidate checks.

`COMPARE_MODELS.cmd` возвращает exit code 0 для `COMPLETE`, даже если результат `DIFFERENT_OUTPUTS` или candidate добавил новые Modes. Это намеренно: на этапе разработки отличие candidate от accepted само по себе не является ошибкой запуска. Решение о допустимости изменений принимается отдельно.

## Выбор части Modes

Чтобы ускорить диагностический прогон:

```cmd
COMPARE_MODELS.cmd "" "" "" "0,9,12,14,16"
```

Однако в `cmd.exe` пустые позиционные параметры использовать неудобно. Практичнее вызвать CLI напрямую:

```cmd
node --expose-gc src\cli.js compare --modes=0,9,12,14,16
```

Для финальной regression-проверки перед принятием версии рекомендуется `all`.

## Явные пути к двум моделям

Можно сравнивать любые два ModelJSON, не меняя рабочие папки:

```cmd
COMPARE_MODELS.cmd "D:\models\accepted.json" "D:\models\candidate.json"
```

Третий параметр — validation:

```cmd
COMPARE_MODELS.cmd "D:\models\accepted.json" "D:\models\candidate.json" "D:\models\validation.json"
```

Четвёртый — Modes:

```cmd
COMPARE_MODELS.cmd "D:\models\accepted.json" "D:\models\candidate.json" "D:\models\validation.json" "0,12-16"
```

## Связь с change-policy layer

`COMPARE_MODELS.cmd` и в v0.4.0 остаётся намеренно фактическим: он отвечает на вопрос:

> Что именно изменилось, в каком Mode, в каких series, насколько и когда?

Решение о допустимости вынесено в отдельный explicit contract. После factual comparison используйте `CHECK_CANDIDATE.cmd` либо `EVALUATE_POLICY.cmd`. Подробно: `docs\CHANGE_POLICY_RU.md`.

Это разделение сохраняет comparator независимым от проектных намерений и позволяет менять policy без повторного simulation run.

## Проверка самого comparator

После установки зависимостей один раз запустить:

```cmd
COMPARE_SELF_TEST.cmd
```

Тест выполняет два Mode 0 прогона во временной папке:

1. accepted против самого себя — должен получить `BYTE_IDENTICAL`;
2. accepted против временного candidate с контролируемым изменением `A Local Base Demand` — должен получить `DIFFERENT_OUTPUTS`.

Рабочие `input`, `reference` и `output` тест не изменяет.


## Дополнение v0.7.1 — добавленные ряды не считаются отличием выходов

С v0.7.1 per-scenario результат `DIFFERENT` ставится только при численном изменении общих рядов, удалённых рядах или несовпадении временной сетки. Новые ряды (`addedSeries`) перечисляются отдельно и по-прежнему порождают события `series_added` для policy, но общий результат при отсутствии численных изменений становится:

```text
COMMON_OUTPUTS_IDENTICAL_WITH_NEW_MODES   — есть новые Modes (типичный случай новой версии модели)
OUTPUTS_IDENTICAL_WITH_NEW_SERIES         — новых Modes нет, но появились новые ряды
```

Раньше такой candidate получал `DIFFERENT_OUTPUTS`, что противоречило `changed = 0, maxAbs = 0` в том же отчёте.
