# Задание 011 — плагин `planet_closure`: счётчики Planet v1 по процессам

Ветка: `task/011-planet-closure` · Scope: `scope.json` рядом · Правила: контракт §9, §9.2 п. 9 (контрольные точки и журнал), §9.4 · Порядок работы: `docs/tasks/README_RU.md`

## 1. Зачем

Planet v1 теперь определён контрактом из частей: `docs/PLANET_V1_CONTRACT_RU.md`. Прочитай его целиком, особенно §2–§4. Старый счётчик (`open_boundaries`, closed-world нарушений 0) считал **потоки** через границу модели и дошёл до нуля. Новые части считаются по **процессам**:
- откуда у процесса мощность (P2);
- объявлено ли потребление энергии (P3);
- есть ли у добычи недра (P4);
- объявлен ли труд (P5);
- объявлен ли внешний драйвер спроса (P6).

Задача — статический аудит, который сверяет **декларацию процессов** с моделью и выдаёт эти счётчики. Модель, validation и policy не меняются.

Декларация для v7.7.1 уже написана и проверена нами: `planet_closure-v7.7.1.json` рядом с этим файлом. Прототип проверки, который дал эталонные числа, лежит в `reference/planet_closure_prototype.mjs`. Он **не нормативен**: модуль стенда можно написать по-другому, но вердикты из §4 он обязан воспроизвести.

## 2. Декларация (формат — по файлу `planet_closure-v7.7.1.json`)

- `colonies`: токены колоний. `{C}` в любом имени раскрывается для каждой колонии. Процесс, в `output` которого нет `{C}`, — общий и считается один раз.
- `max_hops`: предел длины пути по ссылкам для всех проверок «читает» (§3). Для v7.7.1 он равен 4.
- `process_categories`: id категорий `open_boundaries`. Каждый поток-источник (`from = null`) из этих категорий обязан быть `output` ровно одного процесса.
- `energy.total_request` / `energy.fulfillment`: общий запрос энергии колонии и её коэффициент выполнения.
- `processes[]`: `id`, `kind` (`extraction` | `transformation` | `service`), `output` и четыре объявления:
  - `capacity`: `kernel` (`stock`) | `constant` (`parameter`, `reason`) | `unbounded` (`reason`);
  - `energy`: `requests` (`request`) | `none` (`reason`) | `producer` (только для `service`);
  - `deposit` (только для `extraction`): `stock` (`stock`) | `none`;
  - `labor`: `declared` (`intensity`) | `undeclared`.

  Процесс с `legacy` (`switch`, `active_when`, `reason`) в счётчиках не участвует, но показывается в отчёте.
- `demand_drivers`: `parameters`, `consumption`, `reason`.

## 3. Что проверяется

**Разрешение имён — как в стенде и движке:** ключ `trim().toLowerCase()` (урок 12 контракта, задача 010). Имя, которое не разрешается, — FAIL декларации.

**«A читает B» означает:** существует путь по ссылкам `[…]` в формулах от `A` к `B` длиной не больше `max_hops`. Путь проходит только через VARIABLE и FLOW, а цель может быть STOCK. В отчёт выводится **кратчайший путь**.

Полное замыкание зависимостей не годится, и мы это проверили: цепочки спроса связывают любой процесс с любой мощностью. Например, добыча руды через спрос на руду «читает» мощность Refinery (7 шагов). С `max_hops = 4` все ложные декларации из §4 ловятся, а все правдивые проходят.

| Объявление | Проверка |
|---|---|
| `output` у `extraction`/`transformation` | FLOW с `from = null`; у добычи с `deposit: stock` — `from` равен этому стоку (такая добыча больше не граничный поток, и это правильно) |
| полнота | каждый поток-источник из `process_categories` объявлен ровно одним процессом; повтор — FAIL |
| `capacity: kernel` | `stock` — STOCK; `output` читает `stock` |
| `capacity: constant` | `parameter` — VARIABLE; в его полном замыкании нет STOCK (экзогенен); `output` читает `parameter`; `reason` обязательна |
| `capacity: unbounded` | `reason` обязательна |
| `energy: requests` | `total_request` читает `request`; `output` читает `fulfillment`; у `request` и `output` есть общий «плановый» элемент — VARIABLE или FLOW с формулой, достижимый от обоих не дальше `max_hops` (для плавки это `Pre Energy Smelting Rate`) |
| `energy: none` | `reason` обязательна |
| `energy: producer` | только у `service` |
| `deposit: stock` | `stock` — STOCK и он же `from` потока `output` |
| `labor: declared` | `intensity` — VARIABLE, и её читает хотя бы одна формула |
| `demand_drivers` | каждый параметр — VARIABLE, экзогенен, и его читает (полное замыкание) один из потоков `consumption` той же колонии |
| правило обратимости (контракт §4) | параметр `capacity: constant` не читается формулами вне полного замыкания своего `output` — нарушения идут в отдельный список |

**Статусы и режимы (`enforce`):**
- **Ложная или неполная по форме декларация** — FAIL в любом режиме: неразрешённое имя, проверка из таблицы не проходит, повтор `output`, нет `reason`. Декларация не имеет права врать.
- `report`: необъявленные процессы и все счётчики только показываются.
- `classify`: необъявленный процесс — FAIL.
- `planet_v1`: FAIL, если:
  - есть необъявленное в P2/P3;
  - есть добыча без `deposit: stock` (P4);
  - есть `labor: undeclared` (P5);
  - драйверы спроса не объявлены (P6);
  - есть нарушения правила обратимости.
- `planet_strict`: всё, что в `planet_v1`, плюс любые исключения P2/P3 (`constant`, `unbounded`, `none`) — FAIL.

**Счётчики в отчёте:**

```text
processes, legacy
P2 capacity: kernel / exceptions / undeclared
P3 energy:   requests / producer / exceptions / undeclared
P4 deposits: with_deposit / without_deposit
P5 labor:    declared / undeclared
P6 demand:   drivers
reversibility violations
```

Исключения показываются отдельной строкой со своими `reason`. Число исключений не должно растворяться в «0 необъявленных» (контракт §4).

## 4. Эталонные вердикты

На принятой модели v7.7.1 r1 с декларацией `planet_closure-v7.7.1.json` в режиме `report`:
- `PASS`, ошибок 0;
- процессов 17, legacy 2, ожидаемых потоков-источников 16;
- P2: 7 / 10 / 0;
- P3: 4 / 2 / 11 / 0;
- P4: 0 / 6;
- P5: 4 / 13;
- P6: 4;
- нарушений обратимости 0.

Ложные декларации (правка одного поля в копии декларации) — каждая даёт FAIL:

| # | Правка | Почему FAIL |
|---|---|---|
| L1 | `mining.capacity` = `kernel`, `{C} Refinery Active Capacity` | путь 7 > 4 |
| L2 | `construction_materials.energy` = `requests`, `{C} Metal Requested Energy` | выпуск не читает `fulfillment` |
| L3 | `transport.capacity` = `kernel`, `A Power Active Generation Capital` | путь 13 > 4 |
| L4 | `smelting.energy` = `requests`, `{C} Electronics Requested Energy` | нет общего планового элемента |
| L5 | `electronics.capacity` = `kernel`, `{C} Refinery Active Capacity` | путь > 4 |

## 5. Что сделать

### 5.1 Модуль `lab/src/planet_closure.js`

- `auditPlanetClosure(raw, plugin, openBoundariesPlugin)` возвращает `{ type: 'planet_closure', status, mode, counters, processes[], exceptions[], undeclared[], reversibility[], errors[] }`. У каждого процесса и экземпляра колонии — объявления, вердикт и кратчайшие пути.
- Полнота использует классификацию `open_boundaries` из той же validation: переиспользуй `auditOpenBoundaries`.
- Вывод детерминирован: порядок задают декларация и порядок элементов модели.

### 5.2 Встраивание

- `runStructureAudits`: если в validation есть плагин `planet_closure`, запускать его, как `open_boundaries`/`colony_symmetry`. `structureAuditErrors` получает только FAIL-пункты. `printStructureAudits`, `structure-audit.md`/`.json` и отчёт `RUN_LAB` (`report.js`) показывают счётчики, исключения с причинами и пути.
- `lab/src/checks.js`: добавить `planet_closure` в `STATIC_ONLY_PLUGINS`. Иначе прогон на каждом Mode даст `Неизвестный plugin`.
- Команда `audit`: опция `--planet-closure=<file>`. Она подставляет декларацию из файла вместо плагина validation или в дополнение к нему. Нужна до нашего продвижения (§7), а позже — для проверки skeleton с обновлённой декларацией до выдачи задания по модели.

### 5.3 Самотест `lab/src/planet_qa.js`

Декларацию брать из accepted validation, если там есть `planet_closure`, иначе из `../docs/tasks/011-planet-closure/planet_closure-v7.7.1.json`. В выводе указать, откуда взята. Ветка провала обязана бросать исключение или возвращать `false` (урок 11).

| # | Случай | Ожидается |
|---|---|---|
| 1 | принятая модель + декларация | вердикт §4 целиком, числа точно |
| 2–6 | L1–L5 | FAIL с именем процесса и колонии |
| 7 | удалить процесс `regolith` | `report`: PASS, необъявленных 2 (`A`/`B Regolith Extraction`); `classify`: FAIL |
| 8 | `capacity: constant` без `reason` | FAIL |
| 9 | режимы на принятой модели | `planet_v1`: FAIL только по P4 (6) и P5 (13); `planet_strict`: плюс исключения P2 (10) и P3 (11) |
| 10 | мутация: `A Mining Rate` += `0 * [A Capital Goods Base Production Capacity]` + LINK | нарушение обратимости 1 (в `report` показано, в `planet_v1` — FAIL) |
| 11 | мутация: новые STOCK `A Regolith Deposit` и `B Regolith Deposit` становятся `from` потоков `A`/`B Regolith Extraction`; `regolith.deposit` = `stock`, `{C} Regolith Deposit` | PASS, P4 2 / 4; та же декларация, когда сток добавлен только в A, — FAIL для `regolith[B]` |
| 12 | драйвер спроса, зависящий от стока (например `{C} Market Price`) | FAIL |
| 13 | `labor: declared` с параметром, который никто не читает | FAIL |
| 14 | имена в декларации в другом регистре и с пробелами по краям | тот же вердикт, что в случае 1 |
| 15 | встраивание | `runStructureAudits` с плагином даёт счётчики; `checkPlugin` для `planet_closure` возвращает пустой список; `audit --planet-closure=<file>` печатает счётчики |
| 16 | детерминированность | два прогона дают побайтно одинаковый JSON |

### 5.4 Обвязка и документация

- `lab/PLANET_SELF_TEST.cmd` по образцу `LOOP_SELF_TEST.cmd`; скрипт `planet-qa` в `lab/package.json`; версия стенда 0.9.6 в `package.json` и `package-lock.json`.
- `.github/workflows/ci.yml`, job `bench-selftests`: шаг `Planet self-test` после `Loop self-test`.
- `lab/docs/STRUCTURE_AUDIT_RU.md`: раздел `planet_closure` (формат, проверки, «читает = путь ≤ max_hops» и почему, режимы, как читать отчёт). Также `lab/docs/VALIDATION_FORMAT_RU.md` (плагин), `lab/docs/HARNESS_QA_RU.md`, `lab/docs/TEST_STATUS_RU.md`, `lab/README_RU.md`, `lab/CHANGELOG.md` (v0.9.6).
- Декларацию `planet_closure-v7.7.1.json` менять можно, но только если найдена ошибка в ней, и каждую правку нужно обосновать в отчёте. Эталонные числа §4 должны остаться верными, либо отчёт должен доказать, почему они неверны.

### 5.5 Чего не делать

- Не менять модель, validation, policy, `tools/`, `lab/vendor/`, `lab/src/engine.js`, логику существующих аудитов (`open_boundaries`, `colony_symmetry`, `loop_audit`).
- Сохранять окончания строк: `lab/package.json` — CRLF без завершающего перевода строки, остальные — LF. Новые файлы — LF.
- SHA256SUMS не пересобирать (`sums_by: reviewer`); `[skip ci]` не использовать.

## 6. Контрольные точки

После каждой КТ сразу же сделать запись в «Журнал» `REPORT_RU.md` и push. Если работа начинается заново, сначала прочитать журнал.

| КТ | Результат | Доказательство в журнале |
|---|---|---|
| КТ1 | `planet_closure.js` + случай 1 в CI: вердикт §4 точно | ссылка на запуск, счётчики из лога |
| КТ2 | случаи 2–14 | ссылка, выдержки для L1–L5 с путями |
| КТ3 | встраивание (15, 16), `STATIC_ONLY_PLUGINS`, `--planet-closure`; `bench-selftests` зелёный целиком | ссылка, выдержка из `structure-audit.md` |
| КТ4 | документация; финальная голова зелёная | ссылки на финальные запуски |

## 7. Приёмка и продвижение

| # | Критерий | Кто | Как проверяется |
|---|---|---|---|
| G1 | Guard и CI | мы | строгий `check_branch` PASS; `ci.yml` зелёный |
| G2 | Самотест на Windows | мы | `PLANET_SELF_TEST` все случаи PASS, числа совпадают с §4 |
| G3 | Ничего не сломано | мы | остальные самотесты PASS; `RUN_LAB` `OVERALL: PASS` без `Неизвестный plugin` |
| G4 | Наша проба | мы | своя ложная декларация и своя мутация модели, которых нет в самотесте, — верный вердикт |
| G5 | Ревью кода | мы | проверки таблицы §3, режимы, детерминированность, разрешение имён |

**Продвижение делаем мы.** Декларация вставляется в `validation/validation-v7.7.1.json` как плагин (validation r2, в режиме `report`, поведение модели не меняется). Затем обновляем:
- привязку `validation_sha256` в strict policy;
- копии в `lab/input/`;
- манифесты;
- `docs/STRUCTURE_AUDIT_REPORT.md`.

## 8. Отчёт (`REPORT_RU.md`)

1. «Журнал» по КТ1–КТ4.
2. Устройство модуля и отличия от прототипа, с объяснением причин.
3. Правки декларации, если они были, с обоснованием.
4. Ограничения, как ты их видишь (в частности, насколько надёжно правило `max_hops` при росте модели); что не проверялось; замечания к заданию.
