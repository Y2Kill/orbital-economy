# Задание 041 — v7.7.17 Money candidate r1

Ветка: `task/041-money`, база `main@40cce2a`. Поставка ограничена четырьмя файлами `candidate/` и настоящим отчётом.

## Журнал

### Подготовка (2026-10-17)
- Прочитаны `TASK_RU.md`, `scope.json`, guard `tools/check_branch.mjs`, `V7_7_17_ARCHITECTURE_SPEC.md` §1–§8, `V7_7_17_TEST_PLAN.md`, `draft/`, документация узла, validation и patch, пример задания 039 и прототип денежных потоков.
- Создана `task/041-money` от актуального `main@40cce2a`.
- Guard изучен до начала правок; непосредственный локальный запуск недоступен без Git checkout. Точный строгий guard и CI проверяются на GitHub Actions отдельно.

### КТ1 — патч поставлен, CI ожидается
- `candidate/model-patch.json` взят из проверенного владельцем skeleton. Изменены только имя `Orbital Economy v7.7.17 Money candidate r1` и явно указано пустое `modify_scenarios: []`.
- `nodes`: ровно одна декларация `money`, идентичная `draft/money.json` и `lab/fixtures/nodes/money.json`. Ручного раскрытия в `add_elements` нет.
- `replace_formulas`: только `Test 2 Transport Surge Active` с веткой для Mode 59; `add_scenarios`: только Modes 58–59, оба с `Cost Pricing Enabled = 1` и `Money Enabled = 1`; Modes 0–57 не модифицированы.
- Заявленные владельцем результаты skeleton: 6203 элемента, 60 Modes, fingerprint `d2567e8bf199a505`, money 2 CONFORMING, boundaries 302, unclassified 0, symmetry 0, loops 0/1048576, `planet_v1` PASS. На кандидате до CI эти результаты не подтверждены.

### КТ2 — validation и policy поставлены, CI ожидается
- `candidate/validation.json` скопирована **байт в байт** через GitHub blob из проверенного owner draft. JSON структурно корректен, строго равен `JSON.stringify(v, null, 2) + "\\n"`, 60 сценариев, завершающий LF; код и пороги не менялись. Коммит `8a63579`.
- `candidate/change-policy.json` скопирована из `draft/change-policy-v7.7.17-draft.json`; изменено только поле `name` на финальное `Orbital Economy v7.7.17 Money candidate r1 - change contract`. Все восемь правил, сравнение с базой и `validation_sha256 = 705ef4d1ea4965375782d763e9d96bd4a9b0a18758955367ffd387b7018e3b02` сохранены. Коммит `07f408d`.
- По проверке владельца на skeleton policy PASS, всего 4212 ожидаемых событий, неожиданных 0; регрессия Modes 0–57: `changed = 0, maxAbs = 0`. Подтверждение именно candidate.yml ещё ожидается.

### КТ3 — структура и таблица validation поставлены, CI ожидается
- В `candidate/validation.json` полный набор проверок Modes 0–59. По test plan Modes 58–59: снижение дефицита B, положительные деньги домохозяйств, сохранение денег, уменьшение пика цены A и рост доступности труда в Mode 59; таблица контрольных значений ниже.
- Предоставленные владельцем результаты skeleton: validation 60/60 (29220 проверок), policy PASS (4212 событий, неожиданных 0). **Для текущего candidate это ориентиры, а не факт завершённой CI-проверки.**
- Отдельный коммит `746ed13` добавил аннотации по §5, нужные для полного acceptance.

### КТ4 — комплект четырёх файлов подготовлен, CI ожидается
- `candidate/PARAMETER_ANNOTATIONS_fragment.json`: 11 непосредственных записей — `Money Enabled`, шесть сроков, `Transport Money`, три несимметричные пары A/B с `applies_to_mirror: true`. После раскрытия зеркал — 14 параметров.
- Для стартовых чисел даны ссылки на калибровку (неподвижная точка, средние 5-го года Mode 58, три итерации). `Household Money Target Days` явно имеет тег `key-parameter` и описание влияния на уровень активности. Аннотации устаревшего `Local Demand` не добавлялись.
- Все четыре файла candidate присутствуют; они и журнал — единственные изменённые пути. Строгий guard, реестр параметров, `candidate.yml` 5/5 и `ci.yml` должны подтвердить результат отдельно.

## Таблица контрольных значений (skeleton владельца, до независимого CI)

| Mode | Метрика | Skeleton | Условие | Запас |
|---|---|---:|---|---:|
| 58 | B Local Demand last | 3.40 | < 4 | 0.60 |
| 58 | B Balance of Payments last | −37 | > −120 | 83 |
| 58 | B Household Money min | 37 537 | > 30 000 | 7 537 |
| 58 | A Household Money min | 162 778 | > 140 000 | 22 778 |
| 58 | A Real Wage mean | 118.4 | > 115 | 3.4 |
| 58 | A Metal Production mean | 29.7 | > 28 | 1.7 |
| 58 | A/B Food Fulfillment min | 1.00 | ≥ 0.99 | 0.01 |
| 59 | A Market Price max | 60.4 | < 70 | 9.6 |
| 59 | A Labor Availability min | 0.9986 | > 0.99 | 0.0086 |
| 59 | B Balance of Payments last | −33 | > −120 | 87 |
| 59 | A Food Fulfillment min | 1.00 | ≥ 0.99 | 0.01 |

## Отличия
- От проверенного skeleton: только имя кандидата и явный пустой массив `modify_scenarios`; декларация, замена формулы, сценарии и их числовые константы не менялись.
- Validation поставлена побайтно как черновик владельца; в policy изменено только имя кандидата, правила, пороги и SHA validation не менялись.
- Аннотации созданы строго по §5: 11 записей / 14 параметров с зеркалами, без устаревших аннотаций, с отметкой ключевого 60-дневного целевого запаса домохозяйств.
- Других механизмов (кредит, проценты, межрегиональная собственность) не добавлено.

## Ограничения
Итоги skeleton выше принадлежат предварительной проверке владельца и не подменяют результат CI на кандидате. `SHA256SUMS.txt` и `lab/SHA256SUMS.txt` не изменялись; `[skip ci]` не используется.
