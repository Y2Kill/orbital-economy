# Задание 018 — строгая схема validation: незнакомое поле — ошибка

Ветка: `task/018-validation-schema` · Scope: `scope.json` рядом · Правила: контракт 1.9 §9, §9.2 п. 9 (контрольные точки и журнал), §9.4 · Порядок работы: `docs/tasks/README_RU.md`

## 1. Зачем

В задаче 014 (ревизия r2) пять проверок Mode 37 были записаны с `from_day` / `to_day` вместо `window`. Стенд у `metric` читает только `window`, а незнакомые поля **молча игнорирует**: проверки «в окне всплеска» считались по всему прогону, проходили и проверяли не то, что написано в их именах. Нашли это случайно, при разборе другой, громкой ошибки (`event_absent` с плоскими полями вместо `event: {…}`). Итог приёмки 014: «надёжно такое закрывает только строгая схема проверок в стенде».

Тихих мест в разборе validation больше одного:

| Сейчас | Что происходит |
|---|---|
| незнакомое поле проверки (`from_day` у `metric`) | игнорируется |
| проверка незнакомого типа | `WARN`, validation в целом — PASS |
| `window` не той формы | окно считается как получится |
| проверки для Mode, которого нет в модели | никогда не запускаются, об этом никто не узнаёт |
| незнакомое поле верхнего уровня, сценария или плагина | игнорируется |

Задача — **статическая строгая проверка формы validation** до любой симуляции. **Модель, validation и policy не меняются.**

**Реализуемость проверена нами.** Прототип `reference/schema_prototype.mjs` (не нормативен: правила ниже важнее его кода) прогнан по **всем** validation-файлам из истории git (40 разных):

| Набор | Результат прототипа |
|---|---|
| все validation с v7.5.1 по v7.7.5 — принятые, эталонные, черновики, поставки исполнителей (27 файлов) | **0 ошибок** |
| поставка 014 r2 (обе версии в истории) | ровно её дефект: 10 × `from_day`/`to_day` у `metric` + плоский `event_absent` |
| ранние черновики v7.4–v7.5 (до git) | только служебные поля черновиков (`draft_notes`, `calib_todo`) — в работе не участвуют |
| принятая v7.7.5 против модели v7.7.4 | `scenarios["38"]`, `["39"]` — Modes, которых нет в модели |

Фикстура `fixtures/validation-014-r2-excerpt.json` — выдержка из настоящей поставки 014 r2 (коммит `9e05f69`): три правильные проверки Mode 37 и шесть с дефектом. Прототип находит в ней 15 ошибок.

## 2. Правила схемы

Проверка возвращает список ошибок, каждая — с **JSON-путём** и понятной причиной, например `$.scenarios["37"].checks[3].from_day: unknown field for metric (a window is "window": [from, to])`. Любая ошибка — HARD.

### 2.1 Везде

- Поля `note` и `notes` разрешены на любом уровне (верхний, сценарий, проверка, плагин, событие) — это комментарии.
- Любое другое поле, не перечисленное ниже, — ошибка «unknown field».

### 2.2 Верхний уровень

`name`, `mode_variable`, `expected_time_step`, `time_step_tolerance`, `finite_all`, `non_negative_regex` (`pattern`, `tolerance`), `regression_modes`, `regression_tolerance`, `plugins`, `scenarios`, `global_checks`, `web_crosscheck_abs_tolerance`, `web_crosscheck_rel_tolerance` (число или `null`), `web_crosscheck_rel_floor`. Типы проверяются.

`regression_modes` и `regression_tolerance` стенд сейчас не читает (точная регрессия идёт через `compare`). Поля разрешены как описательные; в `VALIDATION_FORMAT_RU.md` это надо сказать прямо.

### 2.3 Сценарии

- Ключ — номер Mode (строка из цифр); поля сценария: `name`, `checks`.
- **Mode должен существовать в проверяемой модели**, иначе ошибка «its checks would never run». Применяется к той модели, которую проверяет validation: в `test`/`lab` — к ней, в `compare`/`policy` — к кандидату (у принятой модели новых Modes кандидата нет по определению, и это не ошибка).

### 2.4 Проверки (`global_checks` и `scenarios[*].checks`)

| type | обязательные | необязательные |
|---|---|---|
| `metric` | `column`, `metric` (`max`/`min`/`mean`/`last`/`first`), `op`, `value` | `tolerance`, `window` |
| `change` | `column`, `from_day`, `to_day`, `op`, `value` | `tolerance` |
| `event_exists`, `event_absent` | `event` | — |
| `event_order` | `events` (массив событий) | — |
| `relation` | `left`, `op` (`<=`/`>=`), `right` | `abs_tol`, `window` |
| `identity` | `terms` (≥ 2 × `{column, coef}`) | `abs_tol`, `window` |
| `bounded` | `column` | `min`, `max`, `tolerance`, `window` |

Плюс у всех: `type`, `name`. Событие: `column` (обязательно), `op`, `value`, `tolerance`, `window`, `name`. `window` — массив из двух чисел `[от, до]`, `от ≤ до`. `op` — одно из `> >= < <= == !=`.

- **Незнакомый `type` — ошибка схемы**, а не `WARN` на прогоне.
- Подсказки в тексте ошибки хотя бы для двух частых промахов: `from_day`/`to_day` не у `change` → «окно — `window: [from, to]`»; `column`/`op`/`value` на верхнем уровне `event_*` → «поля события — внутри `event: {…}`».

### 2.5 Плагины

Незнакомый `type` плагина — ошибка. Разрешённые поля верхнего уровня плагина:

| type | поля |
|---|---|
| `energy_balance` | `colonies`, `abs_tol`, `consumers` |
| `capital_lifecycle` | `abs_tol`, `items` |
| `capital_lifecycle_kernel` | `format`, `legacy_switch`, `abs_tol`, `instances` |
| `simple_capital` | `abs_tol`, `instances` |
| `transport_allocator` | `abs_tol` |
| `open_boundaries` | `enforce`, `categories`, `transformation_pairs` |
| `colony_symmetry` | `tokens`, `enforce`, `exceptions` |
| `planet_closure` | `enforce`, `colonies`, `max_hops`, `process_categories`, `energy`, `processes`, `demand_drivers` |

Глубже верхнего уровня плагина схема не идёт: у плагинов свои проверки спецификаций (`validateKernelSpec`, `validateOpenBoundariesSpec`, `planet_closure` и т. д.), их не трогать.

## 3. Что сделать

### 3.1 Модуль схемы

`lab/src/validation_schema.js`: `checkValidationSchema(validation, { modes })` → `{ status, errors: [{ path, message }] }`. Чистая функция, без симуляции; `modes` — множество Modes проверяемой модели (если не передано, правило 2.3 про существование Mode пропускается).

### 3.2 Встраивание (HARD, до симуляции)

- `test` / `lab` (`RUN_TESTS`, `RUN_LAB`): ошибки схемы входят в статическую проверку; при ошибке — FAIL до запуска Modes, как у static validation сейчас.
- `compare` / `policy` (`COMPARE_MODELS`, `CHECK_CANDIDATE`): ошибки схемы → `NOT_COMPARED`, числовое сравнение не запускается; policy не может это разрешить.
- Отчёты (Markdown/JSON) показывают список ошибок с путями.
- Новая команда: `node src/cli.js check-validation <validation.json> [model.json]` — печатает ошибки, exit 1 при ошибках, 0 без них. Нужна нам для черновиков до выдачи задания и исполнителю — до push.
- В `runGenericCheck` ветка незнакомого `type` может остаться как защита, но до неё дело больше не доходит.

### 3.3 Самотест — случаи в `lab/src/qa.js`

Новый файл самотеста не заводить: CI (`.github/workflows/ci.yml`) вызывает самотесты стенда явным списком, а `.github` вне scope. Фикстуру скопировать в `lab/fixtures/validation/validation-014-r2-excerpt.json` (самотест не читает `docs/tasks/`).

| # | Случай | Ожидается |
|---|---|---|
| S1 | принятая validation (`input/validation`) против принятой модели | 0 ошибок |
| S2 | фикстура 014 r2 | ошибки ровно у шести дефектных проверок (пути `checks[3..8]`), три правильные проверки — без ошибок; для `from_day` и плоского `event_absent` — подсказки из 2.4 |
| S3 | незнакомый `type` проверки | ошибка схемы (не WARN) |
| S4 | `window` не той формы (`[720]`, `[720, 360]`, `{from, to}`) | ошибка на каждую |
| S5 | незнакомое поле: верхний уровень, сценарий, событие, `terms[i]`, плагин | ошибка с путём на каждое |
| S6 | `note`/`notes` на всех уровнях | 0 ошибок |
| S7 | сценарий для Mode, которого нет в модели | ошибка; без `modes` — нет ошибки |
| S8 | интеграция: `RUN_TESTS` на копии принятой validation с одной мутацией S2 | FAIL до симуляции (время — секунды) |
| S9 | интеграция: `compare` с такой validation | `NOT_COMPARED` без симуляции |
| S10 | `check-validation` CLI: exit 1 с ошибками, 0 на принятой | как указано |

Ожидания не должны зависеть от версии модели: S1 и S7 берут Modes из принятой модели, а не числа из головы.

### 3.4 Обвязка и документация

- Версия стенда **0.9.10** (`package.json` — CRLF без завершающего перевода строки, `package-lock.json`).
- `lab/docs/VALIDATION_FORMAT_RU.md` — раздел «Схема»: таблицы 2.2–2.5, правило про комментарии, про существование Mode, про `regression_modes`/`regression_tolerance`, команда `check-validation`.
- `lab/docs/HARNESS_QA_RU.md`, `lab/docs/TEST_STATUS_RU.md`, `lab/README_RU.md`, `lab/CHANGELOG.md`.

### 3.5 Чего не делать

- Не менять модель, validation, policy, `model/nodes/*`, `tools/`, `lab/vendor/`, `.github/`, `lab/src/engine.js`, семантику существующих проверок и плагинов.
- Не ослаблять схему ради прохождения чего-либо: если принятая validation где-то не проходит — остановиться и описать в отчёте (прототип говорит, что проходит).
- SHA256SUMS не пересобирать (`sums_by: reviewer`); `[skip ci]` не использовать.

## 4. Контрольные точки

После каждой КТ сразу же сделать запись в «Журнал» `REPORT_RU.md` и push; запуск CI не ждать одним ожиданием — записать, какой ждёшь, и проверить отдельным шагом.

| КТ | Результат | Доказательство |
|---|---|---|
| КТ1 | `validation_schema.js`; случаи S1–S7 | ссылка на CI, числа ошибок по фикстуре |
| КТ2 | встраивание в `test`/`lab`/`compare`/`policy` и CLI; случаи S8–S10; `bench-selftests` зелёный целиком | ссылка |
| КТ3 | документация; финальная голова зелёная | ссылки |

## 5. Приёмка

| # | Критерий | Кто | Как проверяется |
|---|---|---|---|
| K1 | Guard и CI | мы | строгий `check_branch` PASS; `ci.yml` зелёный |
| K2 | Самотесты на Windows | мы | QA (с новыми случаями) и все остальные PASS |
| K3 | Совпадение с прототипом по истории | мы | `check-validation` по всем 40 validation из истории git: 0 ошибок у 27 файлов v7.5.1+, дефект у 014 r2 — те же пути, что у прототипа |
| K4 | Ничего не сломано | мы | `RUN_LAB` `OVERALL: PASS`; `CHECK_CANDIDATE` принятой модели против себя — `BYTE_IDENTICAL`; время `RUN_LAB` не выросло заметно |
| K5 | Мутация на полном цикле | мы | принятая validation с одним `from_day` у `metric` → `RUN_LAB` FAIL до симуляции с путём в отчёте |

## 6. Отчёт (`REPORT_RU.md`)

1. «Журнал» по КТ.
2. Устройство модуля схемы и места встраивания; отличия от прототипа и почему.
3. Ограничения (что схема не ловит) и замечания к заданию. **Разделы 2–3 обязательны.**
