# Задание 016 — второй тип узла: `simple_capital`

Ветка: `task/016-simple-capital` · Scope: `scope.json` рядом · Правила: контракт 1.9 §9, §9.2 п. 9 (контрольные точки и журнал), §9.4 · Порядок работы: `docs/tasks/README_RU.md`

## 1. Зачем

Внешнее ревью (`docs/ROADMAP.md`, «External review observations») и решение владельца от 2026-09-27: полный жизненный цикл капитала (активация, консервация, стратегический резерв, вывод из эксплуатации) нужен там, где он влияет на мир, а не везде. Оставшиеся исключения Planet v1 P2 — добыча руды, реголита и энергоресурса — лучше описывать **простым капиталом**: мощность — капитал, растёт физически обеспеченным расширением и медленно убывает, но без внутренней кухни ядра.

Задача — второй тип узла генератора (задача 015, Lab v0.9.8): **`simple_capital`**. Как и в 015, **модель, validation и policy не меняются**; первым применением станет следующая задача по модели (добыча реголита).

**Реализуемость проверена нами.** Прототип `reference/expand_simple_prototype.mjs` (не нормативен, но набор элементов, формулы и фрагменты validation должны совпасть) и фикстура `fixtures/regolith-mine-simple.json` применены к принятой модели v7.7.4 вместе с проводкой пробного Mode 38 (всё включено):

| Проверка | Результат |
|---|---|
| раскрытие | 34 элемента, 6 замен, 78 связей |
| `loops` | **0 из 2048** комбинаций |
| Mode 37 (переключатель 0) | мощность шахты A — прежняя константа 7 |
| Mode 38 (всё включено) | шахта A на раннем пике спроса растёт **7 → 8.83** (расширение max ≈ 0.069/день), затем выводит избыток до ≈ 2.3; B сворачивается 5 → ≈ 0.22 |

**Находка прототипа:** сектор с именем `Regolith Extraction` даёт роль `A Regolith Extraction Capacity` — это имя уже занято существующей переменной мощности. Генератор обязан ловить конфликт имён с базой (требование 015); здесь он показал, что это не теоретический случай. Фикстура названа `Regolith Mine`.

## 2. Узел `simple_capital`

Для каждой колонии X и сектора S (`X S …`):

| Роль | Элемент | Тип | Определение |
|---|---|---|---|
| `capacity` | `X S Capacity` | STOCK | начальное из декларации |
| `desired_capacity` | `X S Desired Capacity` | VARIABLE | `[сигнал спроса] × [S Capacity Reserve Factor]` |
| `shortage` / `excess` | `X S Capacity Shortage` / `… Excess` | VARIABLE | `max(Desired − Capacity, 0)` / `max(Capacity − Desired, 0)` (идиома `(x + (x²)^0.5)/2`) |
| `desired_expansion` | `X S Desired Expansion` | VARIABLE | `IfThenElse(switch, Shortage / [S Construction Time], 0)` |
| `expansion` | `X S Expansion` | FLOW ∅ → Capacity | `IfThenElse(switch, Desired Expansion × Min(fulfillment…), 0)` |
| `depreciation` | `X S Capacity Depreciation` | FLOW Capacity → ∅ | `IfThenElse(switch, Capacity × [S Depreciation Rate], 0)` |
| `retirement` | `X S Capacity Retirement` | FLOW Capacity → ∅ | `IfThenElse(switch, Excess / [S Retirement Time], 0)` |
| расход | `X S <Good> Consumption` | FLOW inventory → ∅ | `IfThenElse(switch, Expansion × [S <Good> per Capacity], 0)` |

Плюс, как у `capital_lifecycle`: переключатель, параметры `S <Param>`, сигнал спроса (готовый сток или создаваемый — `sizing.signal.create`), замена формулы мощности выпуска (подменяемая ссылка → `[X S Capacity]`, старая ветка дословно), добавки к спросу на каждое обеспечивающее благо. Декларация — по образцу `model/nodes/*.json`; поля — как в фикстуре, строгая проверка (незнакомое поле — ошибка).

**Правило размера узла — структурное.** Желаемая мощность обязана читать **сток** (сглаженный сигнал спроса), а не мгновенный спрос: узел строится из благ, которые сам производит или потребляет, и мгновенный спрос замыкает алгебраическую петлю (три таких петли пойманы в задачах 012–013). Это правило проверяет стенд (§3.2), а не только спецификация.

## 3. Что сделать

### 3.1 Генератор

- `lab/src/nodes/simple_capital.js` + регистрация в `lab/src/nodes/index.js` со строгой проверкой декларации.
- `expand-nodes` и секция `nodes` в `APPLY_PATCH` работают для обоих типов; конфликт имени любого генерируемого элемента с базой → ошибка с именем.
- Фрагменты validation: экземпляр плагина `simple_capital` (§3.2), имена `? S Expansion` и расходов — в `capital_transformation`, имена `? S Capacity Depreciation` и `? S Capacity Retirement` — в категорию `capital_retirement` (§3.3), пары «расширение ↔ расходы», `capacity` процесса в `planet_closure` = `{kind: "simple", stock: "{C} S Capacity"}`. `--validation` создаёт плагин и категорию, если их ещё нет.

### 3.2 Плагин validation `simple_capital`

Экземпляр: `name`, `sector`, `sizing_signal`, `roles` (8 ролей из §2), `consumption` (список). Проверки:
- **статические** (в том же этапе, что `LIFECYCLE_CONFORMANCE`): типы ролей; топология потоков из §2; зависимости (shortage и excess читают desired_capacity и capacity; desired_expansion — shortage; expansion — desired_expansion; retirement — excess; depreciation — capacity; каждый расход — expansion); **`sizing_signal` — STOCK, и `desired_capacity` ссылается на него напрямую**. Нарушение → `NON_CONFORMING`, HARD-блокер, как у ядра: `RUN_LAB` FAIL, `compare`/`CHECK_CANDIDATE` → `NOT_COMPARED`;
- **на прогоне**: capacity ≥ 0, все потоки узла ≥ 0.

### 3.3 Граница и Planet v1

- `open_boundaries`: новая категория **`capital_retirement`** (`direction: sink`, `closed_world: true`, причина — «износ и вывод простого капитала: капитал покидает экономику»); создаётся фрагментом генератора при первом узле.
- `planet_closure`: новый вид мощности **`simple`** (`stock`; проверка — выход читает сток не дальше `max_hops`, как у `kernel`); счётчик P2 становится `kernel / simple / exceptions / undeclared`; в режиме `planet_v1` `simple` — капитал, не исключение. Ожидаемые счётчики самотеста planet (они выводятся из декларации) — учесть новый вид.

### 3.4 Самотест `lab/src/node_qa.js` (дополнить; ожидания не зависят от версии модели)

Фикстуру скопировать в `lab/fixtures/nodes/regolith-mine-simple.json` (самотест не должен читать `docs/tasks/`).

| # | Случай | Ожидается |
|---|---|---|
| 10 | фикстура против принятой модели (если сектора ещё нет в модели): раскрыть, применить, влить фрагменты в копию validation | плагин `simple_capital` — 2 экземпляра CONFORMING; `loops` — 0 петель; `planet_closure` P2 `simple` = 2; `open_boundaries` — 0 неклассифицированных |
| 11 | «вырезать и собрать заново» для каждого `simple_capital` из `model/nodes/` (сейчас их нет) и для модели из случая 10 | 0 отличий |
| 12 | `desired_capacity` читает мгновенный спрос (VARIABLE) вместо стока | `NON_CONFORMING` с объяснением |
| 13 | сектор `Regolith Extraction` (конфликт `A Regolith Extraction Capacity`) | ошибка с именем элемента |
| 14 | незнакомое поле декларации `simple_capital` | ошибка с путём |
| 15 | детерминированность раскрытия `simple_capital` | побайтно одинаковый JSON |

Случаи 1–9 задачи 015 — без изменений. Если сектор фикстуры уже есть в принятой модели (после будущей задачи по модели), случай 10 переходит в режим «вырезать и собрать заново» и не падает.

### 3.5 Обвязка и документация

- Версия стенда **0.9.9** (`package.json` — CRLF без завершающего перевода строки, `package-lock.json`).
- `lab/docs/NODES_RU.md` (раздел `simple_capital`), `lab/docs/VALIDATION_FORMAT_RU.md` (плагин `simple_capital`, вид `simple` в `planet_closure`, категория `capital_retirement`), `lab/docs/LIFECYCLE_CONFORMANCE_RU.md` (место проверок простого капитала), `lab/docs/STRUCTURE_AUDIT_RU.md` (P2 с `simple`), `lab/docs/HARNESS_QA_RU.md`, `lab/docs/TEST_STATUS_RU.md`, `lab/README_RU.md`, `lab/CHANGELOG.md`.

### 3.6 Чего не делать

- Не менять модель, validation, policy, `model/nodes/*`, `tools/`, `lab/vendor/`, `lab/src/engine.js`, логику ядра `capital_lifecycle_kernel` и типа узла `capital_lifecycle`.
- SHA256SUMS не пересобирать (`sums_by: reviewer`); `[skip ci]` не использовать.

## 4. Контрольные точки

После каждой КТ сразу же сделать запись в «Журнал» `REPORT_RU.md` и push; запуск CI не ждать одним ожиданием — записать, какой ждёшь, и проверить отдельным шагом.

| КТ | Результат | Доказательство |
|---|---|---|
| КТ1 | `simple_capital.js` + строгая декларация; раскрытие фикстуры против принятой модели = прототипу (34 / 6 / 78, те же определения); случаи 13–15 | ссылка на CI, числа |
| КТ2 | плагин `simple_capital` (статика + прогон) в этапе conformance; случаи 10, 12 | ссылка |
| КТ3 | `capital_retirement`, вид `simple` в `planet_closure`, фрагменты и `--validation`; случай 11; `bench-selftests` зелёный целиком | ссылка |
| КТ4 | документация; финальная голова зелёная | ссылки |

## 5. Приёмка

| # | Критерий | Кто | Как проверяется |
|---|---|---|---|
| J1 | Guard и CI | мы | строгий `check_branch` PASS; `ci.yml` зелёный |
| J2 | Самотесты на Windows | мы | NODE SELF-TEST 15/15, остальные PASS |
| J3 | Совпадение с прототипом | мы | раскрытие фикстуры генератором стенда и прототипом — одинаковые определения, замены, связи, фрагменты |
| J4 | Проба | мы | фикстура + пробный Mode на принятой модели: `RUN_LAB` этого Mode проходит, поведение как в §1 |
| J5 | Ничего не сломано | мы | `RUN_LAB` `OVERALL: PASS`; `CHECK_CANDIDATE` принятой модели против себя — `BYTE_IDENTICAL`; «вырезать и собрать заново» для `capital_lifecycle` по-прежнему 0 отличий |

## 6. Отчёт (`REPORT_RU.md`)

1. «Журнал» по КТ.
2. Устройство типа `simple_capital`, плагина и изменений `planet_closure`; отличия от прототипа и почему.
3. Ограничения; замечания к заданию. **Разделы 2–3 обязательны** (в отчёте 015 их не было).
