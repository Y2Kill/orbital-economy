# Отчёт кандидата — задача 013, v7.7.3 Construction Materials Capital

## Журнал

Работа начата с `main@a897247a0d044a1b1f0b746ad76929e6e989b5b2`. Ветка `task/013-construction-materials-capital` создана от этой же головы; предыдущей ветки и журнала не было.

Первый candidate r1 собран как структурная поставка КТ1. Числовые ожидания `[calib]` в Modes 34–35 пока представлены диагностическими зондами с заведомо невозможными порогами: их единственная цель — получить фактические значения первого `candidate.yml`, после чего выставить округлённые пороги с запасом согласно test plan.

### КТ1 — 2026-09-27 — patch/conformance/audit PASS

Доказательство — первый полный Candidate acceptance r1: https://github.com/Y2Kill/orbital-economy/actions/runs/36313670047, candidate-коммит `9490daeec38fa9ac5991ed7557e00d5704f12e87`.

Точные строки из лога этого запуска:
- `CONFORMANCE RESULT: PASS`.
- `Instances: 9; conforming=0; with-variation=9; non-conforming=0`.
- `A Construction Materials Plant CONFORMING_WITH_VARIATION (69/69 checks)`.
- `B Construction Materials Plant CONFORMING_WITH_VARIATION (69/69 checks)`.
- `STRUCTURE AUDIT RESULT: PASS`.
- `open boundaries: 138 of 175 flows cross the model boundary; unclassified=0; closed-world violations=0; transformation pairs=17 (unpaired=0)`.
- `Planet closure: mode=report; processes=17; legacy=2; P2=9/8/0; P3=6/2/9/0; P4=0/6; P5=4/13; P6=4; reversibility=0`.
- `Algebraic loops: switches=9; combinations=512; with loops=0; Modes=none`.

Итого КТ1 закрыта: патч применился, 9 экземпляров kernel-v2 прошли conformance, оба новых завода классифицированы как `CONFORMING_WITH_VARIATION`, structural audit подтвердил требуемые 138 границ, P2 = 9/8/0 и 0 петель из 512 комбинаций.

### КТ2 — 2026-09-27 — Modes 0–33 воспроизводятся точно; неожиданных policy-событий нет

Доказательство — тот же run 36313670047.

- Для каждого Mode 0–33 comparator дал `common=1099, changed=0, added=69, removed=0, maxAbs=0` и `Output comparison: IDENTICAL`.
- Итог: `COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED` — ожидаемо из-за явного `Construction Materials Capital Enabled = 0` в legacy-сценариях.
- Policy counters: `Observed changes: 2584`, `Unexpected: 0`, `Forbidden: 0`, `Threshold exceed: 0`, `Required missing: 0`.
- `Hard blockers: 2` относятся только к заранее намеренным [calib]-падениям новых Modes 34–35 и непривязанному `validation_sha256`; legacy-регрессии в них нет.

Итого КТ2 закрыта: общие 1099 series в Modes 0–33 совпадают с accepted v7.7.2 r1 побитово по численным выходам (`changed=0`, `maxAbs=0`), неожиданных/запрещённых событий нет.

## Калибровка validation r2

Первый Linux candidate run: https://github.com/Y2Kill/orbital-economy/actions/runs/36313670047. Все семь зондов совпали с ориентирами owner skeleton; модельные формулы и константы не меняются. В r2 невозможные probe-пороги заменены на округлённые смысловые границы с заметным запасом:

| Проверка | Наблюдение r1 | Порог r2 | Запас / смысл |
|---|---:|---:|---|
| Mode 34 A plant Installed change 0→1080 | −2.2639623310 | < −2.0 | ≈0.264; требует существенного сворачивания, но не подгоняется к точке |
| Mode 34 A CM Production Rate max | 2.2392768615 | > 2.0 | ≈0.239; фиксирует реально работающий выпуск |
| Mode 34 B plant Expansion max | 0 | ≤ 1e−6 | численный/material-zero коридор; согласован с порогом event_absent |
| Mode 35 B plant Expansion max [360,720] | 0.00893006891 | > 0.007 | ≈0.00193 (≈22% от наблюдения); подтверждает реальную перестройку завода |
| Mode 35 B plant Installed change 360→720 | +0.9848665634 | > 0.8 | ≈0.185; требует материального роста мощности |
| Mode 35 B CM Production Rate max [360,720] | 1.0270755249 | > 0.9 | ≈0.127; подтверждает активный выпуск при перестройке |
| Mode 35 B CM Fulfillment min [360,720] | 0.1224758265 | < 0.20 | ≈0.0775; фиксирует минимум 80% дефицита/инерцию P2 |

Следующий технический шаг: прогнать validation r2; после PASS взять её SHA-256 именно из `candidate.yml` и только затем привязать `change-policy.json.validation_sha256`.

### КТ3 — 2026-09-27 — validation r2 PASS 36/36; B строит завод заново в Mode 35

Доказательство — Candidate acceptance r2: https://github.com/Y2Kill/orbital-economy/actions/runs/36316284968, commit `30eb4c880511a2e364e4b24a1480328ff65be7e8`.
- Gate 4 `validation` — PASS.
- Validation SHA-256: `3d91e9b0ceeed3e48a189b39fbe13306ee18f88935c49e484cf827c330f84e86`.
- Все 36 Mode покрыты validation: legacy 0–33 плюс новые 34–35.
- Mode 34: A installed capacity contracts (`−2.2639623310 < −2.0`), A CM production active (`2.2392768615 > 2.0`), B plant expansion остаётся в material-zero коридоре (`0 <= 1e−6`).
- Mode 35: B plant expansion `0.00893006891 > 0.007`; B installed capacity change 360→720 `+0.9848665634 > 0.8`; B CM production max `1.0270755249 > 0.9`; B CM fulfillment min `0.1224758265 < 0.20`.
- Оба физических расхода завода и запрет расширения до surge-window сохранились отдельными обязательными проверками и Gate 4 прошли.

Пороги взяты только из заранее объявленных калибровочных зондов первого run 36313670047 и округлены в сторону смыслового запаса; модельные формулы/константы после КТ1 не менялись. Главный сценарный критерий P2 подтверждён: B во всплеске действительно строит завод заново.

Policy теперь привязывается к этой validation SHA без изменения owner-rules. Следующий push должен дать финальные `validation PASS` и `policy PASS`.

### КТ4 — 2026-09-27 — поставка полная, candidate 5/5 PASS и CI зелёный

Финальная candidate-голова перед отчётным коммитом: `6f21d905e59bae934fcade67e94e7a4872116b91`.

Доказательство:
- Candidate acceptance: https://github.com/Y2Kill/orbital-economy/actions/runs/36316619503 — **success**.
- Все пять гейтов: `apply-patch PASS`, `conformance PASS`, `audit PASS`, `validation PASS`, `policy PASS`.
- Итоговая строка лога: `All five candidate gates PASS.`
- Validation: `OVERALL: PASS`; Modes 34–35 проходят все сценарные и парные проверки, включая перестройку завода B в Mode 35.
- Candidate SHA-256: `766b87a6078caef83b987ec2d87ae31dbf25d3b6d48054a98e21a6631a2c1764`.
- Validation SHA-256: `3d91e9b0ceeed3e48a189b39fbe13306ee18f88935c49e484cf827c330f84e86`; policy привязана к нему.
- Comparator Modes 0–33: для каждого `common=1099, changed=0, added=69, removed=0, maxAbs=0`; итог `OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED` только из-за явного нового switch-off в legacy scenarios.
- Policy: `Observed changes=2584`, `Expected/allowed=2584`, `Unexpected=0`, `Forbidden=0`, `Threshold exceed=0`, `Required missing=0`, `Hard blockers=0`.
- CI той же candidate-головы: https://github.com/Y2Kill/orbital-economy/actions/runs/36316619535 — **success**.

Модель после КТ1 не менялась; после КТ3 validation не менялась. Финальная правка ниже — только запись КТ4 в `REPORT_RU.md`; `candidate.yml` имеет path-filter на `docs/tasks/*/candidate/**`, поэтому отчётный коммит его не перезапускает. CI на task-ветках запускается на любой push и проверяется отдельно.

Итого КТ1–КТ4 закрыты со стороны исполнителя. `SHA256SUMS` не изменялись (`sums_by: reviewer`), `[skip ci]` не использовался.

## Реализация кандидата

Патч следует исчерпывающему списку V7_7_3_ARCHITECTURE_SPEC.md: 69 новых элементов, 7 замен формул, 126 новых LINK, 34 legacy-сценария с `Construction Materials Capital Enabled = 0` и два новых Mode 34–35.

Ключевая причинностная развязка соблюдена: `X Construction Materials Plant Required Active Capacity` читает `X Construction Materials Demand Signal`, а не мгновенный спрос и не план выпуска. Завод — kernel-v2, `switch_gated: false`, без `finance_limited_construction`; собственный switch гейтит только новое расширение/его физические расходы и fallback изменяемых accepted-формул.

## Замечания и неясности

На старте противоречий между TASK_RU.md, архитектурной спецификацией, test plan и kernel-контрактом не обнаружено. Особое требование §1 о причинности трактуется буквально: demand-signal stock является единственным входом в Required Active, чтобы исключить петлю CM Demand → plan → required plant → desired expansion → CM Demand во всех комбинациях переключателей, а не только в имеющихся Modes.

## Что не запускалось локально

У агента нет локального checkout/Node-стенда. Локально не запускались `check_branch`, bench/selftests, `APPLY_PATCH`, `LIFECYCLE_CONFORMANCE`, `STRUCTURE_AUDIT`, `RUN_LAB`, `CHECK_CANDIDATE`, `candidate.yml` и канонический Windows-прогон. Это заменяется чтением accepted-модели и кода/контрактов, статической проверкой структуры патча и GitHub Actions по §9.4. `SHA256SUMS` не пересобираются, поскольку `sums_by: reviewer`.
