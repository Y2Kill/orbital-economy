# Задание 028 — отчёт исполнителя

Ветка: `task/028-labor` от `main@765ff7d4463937ccd94255aeb3ebe4d3a8afafbc`.

## Среда и ограничения

Исполнение через GitHub API-коннектор, без локального checkout с сетью. Локальный `check_branch` и стенд не запускаются по контракту §9.4; их заменяют `ci.yml` и `candidate.yml`. `SHA256SUMS.txt` и `lab/SHA256SUMS.txt` не меняются, потому что `scope.json` задаёт `"sums_by": "reviewer"`.

## Поставка

Кандидат r1:
- `candidate/model-patch.json` — один декларативный узел `labor`; `add_elements`, `replace_formulas`, `add_links`, `modify_scenarios` пусты; добавлен только Mode 48;
- `candidate/validation.json` — байт-в-байт owner draft из `draft/validation-v7.7.10-draft.json`;
- `candidate/change-policy.json` — owner draft, финализированы имя/описание; `validation_sha256` оставлен владельческий до подтверждения `candidate.yml`;
- `candidate/PARAMETER_ANNOTATIONS_fragment.json` — новые параметры labor-узла, включая симметричные пары A/B.

## Журнал

### Старт — 2026-10-03 — кандидат r1 отправлен
Сделано: ветка создана строго от `765ff7d4463937ccd94255aeb3ebe4d3a8afafbc`; собран кандидат без ручного раскрытия `labor` и без изменений Modes 0–47.
Доказательство: кандидат `c20af9d774dec9a002695900f4a7df5d911daeb3`; ожидаются Candidate acceptance run `37140726454` и CI run `37140726706`.
Не запускалось локально: `check_branch`, APPLY_PATCH, conformance, audit, validation, CHECK_CANDIDATE, стенд.
Дальше: отдельно проверить запуски Actions; после подтверждения каждого результата сразу дописывать КТ1–КТ4.

### КТ1 — 2026-10-04 — patch / conformance / audit PASS
Сделано: подтверждён первый модельный гейт кандидата r1. Патч с единственной декларацией `labor` применяется; conformance — PASS, все 17 экземпляров labor — `CONFORMING` (11/11 каждый). STRUCTURE_AUDIT — PASS: открытых границ 224, неклассифицированных 0; algebraic loops — 0 из 32768 комбинаций при 15 переключателях; `planet_closure` в режиме `planet_v1` — PASS, P5 = 17/0.
Доказательство: [Candidate acceptance #30](https://github.com/Y2Kill/orbital-economy/actions/runs/37140800482), job `111255558601`: `Labor conformance: PASS`; `open boundaries: 224 ... unclassified=0`; `planet closure (planet_v1): status=PASS`; сводка `P5=17/0`; `algebraic loops: ... combinations=32768; with loops=0`.
Не подтвердилось: отклонений от skeleton по структуре, замыканию Planet v1 и петлям не обнаружено.
Дальше: зафиксировать регрессию Modes 0–47 и итог policy как КТ2.


### КТ2 — 2026-10-04 — регрессия Modes 0–47 и policy PASS
Сделано: подтверждена нулевая регрессия принятых сценариев и контракт изменений. Во всех Modes 0–47 сравнение с v7.7.9 r1 даёт `common=1519, changed=0, added=69, removed=0, maxAbs=0`; исходные ряды не изменены, добавлены только 69 рядов labor-слоя. Policy — PASS: наблюдаемых событий 3509, ожидаемых/разрешённых 3509, неожиданных 0, запрещённых 0, превышений порога 0, отсутствующих обязательных событий 0.
Доказательство: [Candidate acceptance #30](https://github.com/Y2Kill/orbital-economy/actions/runs/37140800482), job `111255558601`: Modes 0–47 — `Output comparison: IDENTICAL` и `changed=0 ... maxAbs=0`; итог `POLICY RESULT: PASS`, `Observed changes: 3509`, `Expected/allowed: 3509`, `Unexpected: 0`.
Не подтвердилось: ни одного `series_changed` в Modes 0–47 и ни одного неожиданного policy-события.
Дальше: зафиксировать validation 49/49 и поведение Automation Probe Mode 48 как КТ3.


### КТ3 — 2026-10-04 — validation 49/49 и Automation Probe
Сделано: validation прошла во всех 49 Modes (49 заголовков Mode и 49 × `Candidate validation: PASS`; итог `OVERALL: PASS`). Mode 48 подтверждает заданный рычаг автоматизации: A-side automation = 0.5 снижает потребность в труде и обе трудовые составляющие себестоимости, снижает цену металла и немного повышает выпуск металла; B остаётся без автоматизации.

| Проверка | Значение Mode 48 | Порог | Запас |
|---|---:|---:|---:|
| `A Smelting Automation Factor` | 0.525 | 0.5249 ≤ x ≤ 0.5251 | 0.0001 до каждой границы |
| mean `A Total Labor Requirement` | 7.69 | < 10.00 | 2.31 |
| mean `A Metal Unit Cost` | 16.85 | < 18.70 | 1.85 |
| mean `A Electronics Unit Cost` | 13.63 | < 14.90 | 1.27 |
| mean `A Market Price` | 34.96 | < 36.00 | 1.04 |
| mean `A Metal Production` | 37.61 | > 37.10 | 0.51 |

Пороговые значения оставлены из owner draft/skeleton без ослабления. Значения в таблице — эталонные наблюдения, на которых эти пороги были откалиброваны (§5 архитектурной спецификации / §3 test plan); исполняемый кандидат подтвердил все шесть проверок Mode 48.
Доказательство: [Candidate acceptance #30](https://github.com/Y2Kill/orbital-economy/actions/runs/37140800482), job `111255558601`: выбранные Modes 0–48; 49 × `Candidate validation: PASS`; `OVERALL: PASS`; Mode 48 — PASS для factor 0.525, A labor, metal/electronics unit cost, market price и metal production. Validation SHA-256: `43736f0e201fa1437f16d580c89bd3d3a13d6c7cc85206714e720d1ed7cf8f1c`.
Не подтвердилось: ни одного FAIL в validation; контрольные проверки Automation Probe не потребовали изменения порогов.
Дальше: окончательно оформить раздел «Отличия», затем дождаться зелёного CI на голове отчёта и записать КТ4.


### КТ4 — 2026-10-04 — поставка готова
Сделано: поставка полная. `candidate.yml` прошёл все пять гейтов: apply-patch PASS, conformance PASS, audit PASS, validation PASS, policy PASS. На голове отчёта `98db65547352761ca177426a20dfd9b2e92f5734` общий CI зелёный: guard PASS, tools-selftest PASS, bench-selftests PASS (QA, structure, loop, planet, conformance, policy, compare, node и bench Modes 0/12).
Доказательство: [Candidate acceptance #30](https://github.com/Y2Kill/orbital-economy/actions/runs/37140800482) — 5/5 PASS; [CI #316](https://github.com/Y2Kill/orbital-economy/actions/runs/37182888694) — success на `98db65547352761ca177426a20dfd9b2e92f5734`.
Не подтвердилось: незакрытых гейтов, ошибок guard или self-tests нет.
Дальше: приёмка владельцем на канонической платформе; `SHA256SUMS` пересобирает reviewer согласно `sums_by: reviewer`.


## Отличия

От спецификации модели, test plan и owner drafts по существу отличий нет:
- декларация `labor`, стартовая автоматизация, формулы, Mode 48 и сценарии 0–47 оставлены без изменений;
- `candidate/validation.json` поставлена байт-в-байт из owner draft; SHA-256 `43736f0e201fa1437f16d580c89bd3d3a13d6c7cc85206714e720d1ed7cf8f1c`;
- пороги Mode 48 не менялись и не ослаблялись;
- `change-policy.json` отличается от owner draft только финализированными именем/описанием кандидата; модельные правила policy не менялись.

Техническое отличие поставки: после первого push обнаружена ошибка формата в `PARAMETER_ANNOTATIONS_fragment.json` — у `Minimum Human Labor Share` и `Automation Labor Exponent` поле `tags` было записано строкой вместо массива. Исправлено отдельным коммитом `fe35a7028812738a4a133adb1eeb30984a947013`. Исправление затрагивает только аннотации, не меняет `model-patch.json`, validation, policy, candidate SHA или поведение модели.
