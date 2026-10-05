# Задание 030 — отчёт исполнителя

Ветка: `task/030-population` от `main@1763ce677839dd96fecac39312a05b2f5cc4290c`.

## Среда и ограничения

Исполнение через GitHub API-коннектор, без локального checkout с сетью. Поэтому локальная команда `node tools/check_branch.mjs --scope=docs/tasks/030-population/scope.json` и стенд не запускаются; для такого режима `docs/tasks/README_RU.md` предписывает пропустить локальную самопроверку и опираться на `ci.yml` / `candidate.yml`. Перед началом проверены опубликованный `scope.json`, код guard и точная база ветки `1763ce677839dd96fecac39312a05b2f5cc4290c`. `SHA256SUMS.txt` и `lab/SHA256SUMS.txt` не меняются: `sums_by = reviewer`.

## Поставка

Кандидат r1:
- `candidate/model-patch.json` — только декларативный узел `population` из owner draft; `add_elements`, `replace_formulas`, `add_links`, `modify_scenarios`, `add_scenarios` пусты;
- `candidate/validation.json` — тот же Git blob, что `draft/validation-v7.7.11-draft.json`, то есть байт-в-байт owner draft;
- `candidate/change-policy.json` — owner draft с финализированными именем/описанием; правила и ожидаемый `validation_sha256` не менялись;
- `candidate/PARAMETER_ANNOTATIONS_fragment.json` — аннотации всех 11 параметров декларации population, с единицами и происхождением значений.

## Журнал

### Старт — 2026-10-05 — кандидат r1 отправляется
Сделано: ветка создана строго от `1763ce677839dd96fecac39312a05b2f5cc4290c`; собран candidate r1 без ручного раскрытия узла, без переключателя, новых Modes и изменений сценариев. Validation копируется байт-в-байт из owner draft.
Доказательство: база `1763ce677839dd96fecac39312a05b2f5cc4290c`; owner validation SHA-256 по опубликованному пакету — `49f806b2ccd0b776c5c1e65e8687fad09f9ccad375e2edb2a36da9d22a814841`.
Не запускалось локально: `check_branch`, APPLY_PATCH, conformance, audit, validation, CHECK_CANDIDATE и self-tests стенда — среда API-коннектора, согласно §9.4/README.
Дальше: отдельно проверить `candidate.yml` и `ci.yml`; после подтверждения каждого контрольного результата немедленно дописывать КТ1–КТ4.


### КТ1 — 2026-10-05 — patch / population conformance / audit PASS
Сделано: подтверждён первый модельный гейт кандидата r1. Патч применился; population conformance — PASS, оба экземпляра `A population` и `B population` — `CONFORMING (15/15 checks)`. STRUCTURE_AUDIT — PASS: граничных 232, неклассифицированных 0; algebraic loops — 0 из 32768 комбинаций; `planet_closure` в режиме `planet_v1` — PASS, P5 = 17/0.
Доказательство: [candidate.yml run 37274133909](https://github.com/Y2Kill/orbital-economy/actions/runs/37274133909), job `111647297783`: строки 495–497 — `Population conformance: PASS`, `A population CONFORMING (15/15 checks)`, `B population CONFORMING (15/15 checks)`; строки 531, 550, 631 и 634–638 — `open boundaries: 232 ... unclassified=0`, `planet closure (planet_v1): status=PASS`, `algebraic loops: ... combinations=32768; with loops=0`, итог `STRUCTURE AUDIT RESULT: PASS`, `P5=17/0`. В итоговой сводке строка 20934 — `apply-patch | PASS`.
Не подтвердилось: отклонений по conformance, границе, Planet v1 и петлям не обнаружено. Отпечаток определений `35d24655fc422942` в job log и приложенном артефакте этого run не печатается, поэтому отдельной runtime-строкой здесь не подтверждается.
Дальше: зафиксировать нулевую регрессию Modes 0–48 и policy.

### КТ2 — 2026-10-05 — Modes 0–48 идентичны, policy PASS
Сделано: подтверждена нулевая регрессия всех прежних сценариев. Во всех 49 Modes (0–48) общие ряды идентичны accepted v7.7.10 r1: `changed=0`, `maxAbs=0`; добавлены только 49 новых рядов population-слоя. Policy — PASS: наблюдаемых событий 2540, ожидаемых/разрешённых 2540, неожиданных 0, запрещённых 0, превышений порога 0, отсутствующих обязательных событий 0.
Доказательство: [candidate.yml run 37274133909](https://github.com/Y2Kill/orbital-economy/actions/runs/37274133909), job `111647297783`: для каждого Mode выводится `Output comparison: IDENTICAL` и `common=1588, changed=0, added=49, removed=0, maxAbs=0`; для Modes 46–48 это строки 20764–20779. Строка 20783 — `COMPARISON RESULT: OUTPUTS_IDENTICAL_WITH_NEW_SERIES`; строки 20789–20796 — `POLICY RESULT: PASS`, `Observed changes: 2540`, `Expected/allowed: 2540`, `Unexpected: 0`, `Forbidden: 0`, `Threshold exceed: 0`, `Required missing: 0`, `Hard blockers: 0`.
Не подтвердилось: ни одного изменённого прежнего ряда, неожиданного или запрещённого policy-события.
Дальше: зафиксировать validation Modes 46–47 и запасы до порогов.

### КТ3 — 2026-10-05 — validation 49/49 PASS, Population-поведение подтверждено
Сделано: validation прошла во всех 49 Modes; итог `OVERALL: PASS`. В Modes 46–47 подтверждены все семь сценарных проверок test plan: B в первые три года принимает людей, население планеты остаётся почти постоянным, а трудовые показатели соответствуют ожидаемому переходному процессу. Пороги owner draft не менялись и не ослаблялись.

| Проверка | Значение | Порог | Запас |
|---|---:|---:|---:|
| Mode 46 — `B Population` max | 9.528878706 | > 9.0 | +0.528878706 |
| Mode 46 — `A Population` min | 27.112032946 | > 26.5 | +0.612032946 |
| Mode 46 — `Planet Population` min / max | 36.500000000 / 36.640911652 | > 36.4 / < 36.9 | +0.100000000 / 0.259088348 до верхней границы |
| Mode 46 — `B Employment Rate` min, окно [720, 1080] | 0.657837649 | < 0.8 | 0.142162351 до верхней границы |
| Mode 47 — `B Population` max | 9.079916195 | > 8.8 | +0.279916195 |
| Mode 47 — `B Employment Rate` min, окно [720, 1080] | 0.575207320 | < 0.75 | 0.174792680 до верхней границы |
| Mode 47 — `A Labor Shortage` max, окно [720, 1080] | 1.128306420 | > 0.3 | +0.828306420 |

Доказательство: [candidate.yml run 37274133909](https://github.com/Y2Kill/orbital-economy/actions/runs/37274133909), job `111647297783`: строки 19767–19771 — PASS пяти проверок Mode 46 с skeleton-значениями 9.53, 27.11, 36.50–36.64 и 0.66; строки 20111–20113 — PASS трёх assertions Mode 47 с 9.08, 0.58 и 1.13; строка 20457 — `OVERALL: PASS`. Точные значения таблицы взяты из приложенного к тому же run `validation/report.json`; `scenarios` содержит 49 записей, все со статусом PASS. Validation SHA-256 в строках 253 и 20941: `49f806b2ccd0b776c5c1e65e8687fad09f9ccad375e2edb2a36da9d22a814841`.
Не подтвердилось: ни одного validation FAIL; корректировка порогов не потребовалась.
Дальше: зафиксировать полноту поставки и оба зелёных workflow.

### КТ4 — 2026-10-05 — поставка полная
Сделано: поставка r1 полная. `candidate.yml` прошёл все пять гейтов: apply-patch PASS, conformance PASS, audit PASS, validation PASS, policy PASS. `ci.yml` на candidate-коммите `ef4d8d259c301063e28daa13a8ba52d997eb82ca` зелёный: guard, tools-selftest и bench-selftests — success.
Доказательство: [candidate.yml run 37274133909](https://github.com/Y2Kill/orbital-economy/actions/runs/37274133909) — строки 20930–20952: пять гейтов PASS, candidate SHA-256 `994d140e8df2819e8eb26a8e6646d0b68f5bcb79e3e5c46ba8ab793787a455e3`, validation SHA-256 `49f806b2ccd0b776c5c1e65e8687fad09f9ccad375e2edb2a36da9d22a814841`, policy PASS; [ci.yml run 37274134042](https://github.com/Y2Kill/orbital-economy/actions/runs/37274134042) — `guard`, `tools-selftest`, `bench-selftests` завершены `success`.
Не подтвердилось: незакрытых candidate-гейтов, ошибок guard или self-tests нет.
Дальше: после этого отчётного коммита проверить автоматически запущенный CI на его SHA; второй коммит не создавать, чтобы сохранить требование «один коммит».

## Отличия

От модели, test plan и owner drafts по существу отличий нет. Декларация `population` и validation не изменены; пороги не ослаблялись; policy-правила не изменены. В policy финализированы только имя и описание кандидата. Аннотации добавлены как требуемая поставка задачи и не влияют на модель.
