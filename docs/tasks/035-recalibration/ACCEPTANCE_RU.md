# Приёмка задания 035 — v7.7.14: перекалибровка запаса генерации и доли трудоспособных

**Решение:** ПРИНЯТО 2026-10-11 с первого раунда; продвинуто в **v7.7.14 r1**. Исполнитель — GPT-5.6 Sol (agent), API-коннектор + `candidate.yml` / `ci.yml`.

## Ход

Коммит поставки — `21af541`: `candidate/` и `REPORT_RU.md`. `candidate.yml` (`38141935248`) — 5/5 PASS; `ci.yml` (`38141935306`) — success.

Сессия исполнителя оборвалась после отправки кандидата, во время прогонов CI. Журнал КТ1–КТ4 остался в виде «ожидается». Второй раунд ради журнала не назначали: фактические результаты КТ записаны ниже, по прогонам CI и нашей приёмке.

Поставка совпадает с черновиками:
- патч — наш skeleton: ровно 4 `replace_formulas`, изменено только `name`. Модель кандидата равна skeleton, кроме названия;
- `validation.json` — побайтно равна `draft/validation-v7.7.14-draft.json`;
- `change-policy.json` — черновик, изменены только `name` и `description`, правила и `validation_sha256` прежние;
- аннотации — три параметра по заданию, `Target Labor Tightness` помечен как ключевой.

## КТ по фактическим прогонам

| КТ | Результат |
|---|---|
| КТ1 | патч применяется; `conformance` PASS; `audit` PASS — граничных 262, симметрия 0, петель 0 из 131072, `planet_v1` PASS |
| КТ2 | `policy` PASS: в CI 39 841 изменение, у нас на Windows 39839; неожиданных 0, структурных событий 0, все 4 определения изменены |
| КТ3 | validation 54/54 PASS (22490 проверок); 16 пересмотренных проверок — в таблице ниже |
| КТ4 | поставка полная; `candidate.yml` 5/5 PASS, `ci.yml` success |

**Пересмотренные проверки** — 16 строк спецификации §4, 18 проверок: в Mode 21 у запаса оборудования B добавлена верхняя граница, Modes 27–29 — три проверки. Значения — финальная модель на Windows, все PASS:

| Mode | Проверка | Значение | Порог |
|---|---|---|---|
| 18 | recovery — B electronics output >= 85% of pre-shock (16.27) by day 1080 | 13.96 | `last >= 13.8` |
| 19 | input demand rise precedes generation build-up | 386.5-й день (6.098) → 487.25-й день (0.8201) | `A Electronics Metal Input Demand > 6.09 / A Power Generation Expansion > 0.82` |
| 21 | B has no expansion demand after the first year (B contracts) | 0 | `max <= 0` |
| 21 | B capital goods inventory stays flat after the first year (contracting B builds nothing) | 25.69 | `min >= 25.6` |
| 21 | A refinery capital @1080 not above Mode 17 (64.27) | 63.61 | `last <= 64.3` |
| 21 | A power capital @1080 not above Mode 17 (1815.5) | 1786 | `last <= 1815` |
| 21 | B capital goods inventory stays flat after the first year (upper) | 25.69 | `max <= 25.8` |
| 22 | A power capital @720 lags Mode 21 (1647.2) by >= 3% | 1519 | `last <= 1597` |
| 23 | demand rise -> fulfillment dip -> production rise | 368.75-й день (1.002) → 380.75-й день (0.9499) → 568.75-й день (0.9073) | `A Capital Goods Demand > 0.98 / A Capital Goods Fulfillment < 0.95 / A Capital Goods Production Rate > 0.907` |
| 27 | B construction materials fulfillment stays above 99 % | 0.9962 | `min >= 0.99` |
| 28 | B construction materials fulfillment stays above 99 % | 0.9962 | `min >= 0.99` |
| 29 | B construction materials fulfillment stays above 99 % | 0.9962 | `min >= 0.99` |
| 29 | A construction materials production rate stays raw-material limited (< 1.06) | 1.032 | `max < 1.06` |
| 32 | terminal A demand-signal tracking error <= 0.004 | 0.0027 | `0.004` |
| 34 | A CM plant installed capacity contracts over run by more than 1.8 | -1.995 | `< -1.8` |
| 44 | B ore proven reserves grow above their initial 36000 (max > 36300) | 36487 | `max > 36300` |
| 46 | A energy shortage deepens (Mode 44 mean 0.973) | 0.9434 | `mean < 0.96` |
| 52 | A labor market is near balance in the third year | 0.9686 | `min > 0.95` |

## Наша проверка (каноническая платформа)

| Проверка | Результат |
|---|---|
| строгий guard | PASS (предупреждение только по SHA256SUMS — `sums_by: reviewer`) |
| `APPLY_PATCH` | кандидат `8a32184b…`, 5445 элементов, 54 сценария; равен skeleton `31fc2ac0…`, кроме названия |
| `LIFECYCLE_CONFORMANCE` | PASS |
| `STRUCTURE_AUDIT` | PASS: граничных 262, неклассифицированных 0; симметрия A/B — 0 расхождений; петель 0 из 131072; `planet_v1` PASS |
| реестр параметров | 582 / 403 аннотировано / 71 несимметричная пара, неаннотированных 0 |
| `CHECK_CANDIDATE` с policy исполнителя | COMPARISON `DIFFERENT_OUTPUTS`; validation 54/54 PASS; `POLICY PASS` — 39839 событий, неожиданных 0 |
| после продвижения | QA 47/47, node 59/59, planet 20/20, loop 19/19, structure 21/21, conformance 18/18, compare PASS, policy 10/10; `RUN_LAB` Modes 0-53, 54/54 `OVERALL: PASS`; `CHECK_CANDIDATE` принятой модели против себя — `BYTE_IDENTICAL` |

**Расхождение счётчика.** CI насчитал 39 841 изменение, Windows — 39839. Разница — четыре ряда учёта срока службы (`… Plant Lifetime Capacity Account`): три в Modes 26, 44, 51 изменились только на Linux, один в Mode 30 — только на Windows; отклонения около 1e-14, последние биты `Math.pow` на разных ОС (`VERSIONING_AND_AUTHORITY.md` §8). На Windows счётчик совпал с нашим прогоном skeleton до выдачи.

## Отличия и замечания

Исполнитель отличий от черновиков не внёс. Раздел «Отличия» в отчёте есть.

**Наши правки при продвижении:**
- в `model/nodes/population.json` доля трудоспособных 0.5 → 0.52 (по спецификации §1 это делаем мы);
- **наш пробел:** аннотация `A Labor Demand Signal` (действует и для B) говорила «A=14, B=4.25 (= население × 0.5)»; исправлена на 14.56 / 4.42 и 0.52. Её обновление надо было включить в задание — как и в 034, при смене значения стоит перечислять все аннотации, где оно упомянуто;
- в аннотацию `Power Operating Reserve Factor` возвращены тег `capital-policy` и ссылка на KERNEL_SPEC §4.3, которые фрагмент опустил; поле `since` у трёх параметров оставлено прежним — параметры существуют с тех версий, а о перекалибровке говорит текст.

**Наблюдение.** В Mode 53 предохранитель по труду кусает сильнее, чем в v7.7.13: доступность труда A падает до 0.946 (было 0.961), напряжённость доходит до 1.057 (было 1.040). С запасом 1.10 строится больше генерации, и спрос на руки во всплеске выше. Проверки Mode 53 это покрывают.

## Что дальше

- глобальная чувствительность (Morris) по 27 долгосрочно значимым параметрам;
- полностековые версии главных шоков;
- финансовый слой со спросом от дохода; он же даст зарплате обратную связь со спросом на труд.
