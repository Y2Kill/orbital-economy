# Задание 017 — v7.7.5: добыча реголита на простом капитале

Ветка: `task/017-regolith-capital` · Scope: `scope.json` рядом · Правила: контракт 1.9 — §3–§5, §7, §8, §9 и §9.4 (п. 5 — поставка через `candidate/`), §9.2 п. 9 (контрольные точки и журнал) · Порядок работы: `docs/tasks/README_RU.md`

Шаг модели под счётчиком Planet v1 (P2) и **первая задача по модели на узлах**: мощность добычи реголита становится простым капиталом (`simple_capital`, задача 016). Сектор задан декларацией; стенд раскрывает её сам.

## 1. Что прочитать

1. `V7_7_5_ARCHITECTURE_SPEC.md` — что меняется, декларация (§2), проводка сценариев (§3), наблюдения (§5).
2. `lab/docs/NODES_RU.md` (раздел `simple_capital`) и `lab/docs/MODEL_PATCH_RU.md` (секция `nodes`).
3. `V7_7_5_TEST_PLAN.md` — все проверки выражены типами языка validation и исполнены нами на skeleton.
4. `draft/regolith-mine.json` — декларация узла; `draft/validation-v7.7.5-draft.json` (структурная часть уже получена `expand-nodes --validation`) и `draft/change-policy-v7.7.5-draft.json` — **проверены нами на полном skeleton**. Финализация: `validation_sha256` в policy = SHA твоей validation (из лога `candidate.yml`); изменения правил и декларации — только с обоснованием.
5. Для образца — поставка задачи 014 (`REPORT_RU.md`, калибровка «зонды → пороги»).

## 2. Что поставить

В `docs/tasks/017-regolith-capital/candidate/`:
- `model-patch.json`: к v7.7.4 r1, `base_sha256` = `8a71fe6678c4fc6c532bb8e35b6006280ddb9639a69aed045a6ca25f516f1991`, `name` = `Orbital Economy v7.7.5 Regolith Capital candidate rN`; **узел — секцией `nodes`** (декларация из `draft/regolith-mine.json`), а не раскрытыми элементами; в `replace_formulas` — только проводка `Test 2 Transport Surge Active`; сценарии — по спецификации §3;
- `validation.json`, `change-policy.json`, `PARAMETER_ANNOTATIONS_fragment.json` (константы узла; A/B начальные мощности 7/5 — несимметричная пара, аннотация обязательна).

И `REPORT_RU.md` в папке задачи: журнал по КТ и отчёт кандидата.

## 3. Контрольные точки

После каждой КТ сразу же сделать запись в «Журнал» `REPORT_RU.md` и push; запуск CI не ждать одним ожиданием — записать, какой ждёшь, и проверить отдельным шагом.

| КТ | Результат | Доказательство |
|---|---|---|
| КТ1 | патч с `nodes` применяется; `conformance` PASS — `simple_capital` 2 CONFORMING; `audit` PASS — граничных 168, **петель 0 из 2048**, Planet closure **P2 = 11/2/4/0** | ссылка на `candidate.yml`, строки |
| КТ2 | регрессия: `policy` без неожиданных событий в Modes 0–37 | ссылка, счётчики |
| КТ3 | validation Modes 38–39 по test plan; пороги по первому прогону, с обоснованием; validation PASS 40/40; **B строит шахту заново в Mode 39** | ссылка, таблица «проверка → значение → порог → запас» |
| КТ4 | поставка полная; `candidate.yml` 5/5 PASS, `ci.yml` зелёный; **КТ4 записана в журнал** | ссылки |

## 4. Чего не делать

- Ничего сверх спецификации: узел — только декларацией, проводка — только `Test 2`.
- Не раскрывать узел руками в `add_elements` (секция `nodes` для этого и существует).
- Окно у `metric` — только `window` (у `metric` нет `from_day`/`to_day`); у `event_absent` — вложенный `event: {…}`.
- Менять можно только `candidate/` и `REPORT_RU.md` в папке задачи.
- Не вставлять в отчёт персональные данные; на коммиты — по хешу. SHA256SUMS не трогать (`sums_by: reviewer`); `[skip ci]` не использовать.

## 5. Приёмка (наша, на канонической платформе)

Как в 014: строгий guard; полный цикл на Windows (validation 40/40; `CHECK_CANDIDATE` с твоей policy — `POLICY PASS`; Modes 0–37 `changed = 0, maxAbs = 0`); ревью патча против нашего skeleton; продвижение в v7.7.5 r1, декларация — в `model/nodes/`; после продвижения — все самотесты заново.
