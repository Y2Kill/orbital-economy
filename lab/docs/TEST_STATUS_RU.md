# Статус проверок Orbital Economy Lab v0.9.13 — baseline v7.7.8 r1

## Принятая основа

- Модель: **Orbital Economy v7.7.8 r1 — Deposits** — ACCEPTED 2026-10-02.
- SHA-256: `17794e6c6acec9a965473bc170f1c71e31a82fe7a095ec1391c86eb681c1b50e`.
- Validation: `validation/validation-v7.7.8.json`.
- Policy: `policy/change-policy-v7.7.8-strict.json` (default deny, rules: []).
- Engine: `simulation@9.0.0` pinned; каноническая платформа Windows x64 · Node 24.11.1 (`../../docs/VERSIONING_AND_AUTHORITY.md` §8), эталон `reference/accepted/series-digest.windows.json`.
- Scenarios: Modes 0–45.
- Предшественник: v7.7.7 r1 (`befccae91083e44c32ddeb25783a3f45a8ef32fa60965e61a210ebfc4c7b8f94`), лежит в `reference/v7.7.7/`.

## Проверки promotion v7.7.8 (прогон 2026-10-02, каноническая платформа)

| Проверка | Результат |
|---|---|
| Validation Modes 0–45 | **PASS** — 46/46, 13600 проверок |
| Capital Lifecycle conformance | **PASS** — 11 instances ядра, 0 NON_CONFORMING; `simple_capital` 6 и `deposit` 6 instances CONFORMING |
| Structure audit | **PASS** — 263 FLOW, 208 boundary, unclassified 0, closed-world 0, пары 25 |
| A/B symmetry | **PASS** — mismatches 0, exceptions 0 |
| Algebraic loop audit | **PASS** — 14 switches, 16384 combinations, loops 0 |
| Planet closure (`report`) | **PASS** — P2 11/6/0/0, P3 6/2/9/0, P4 6/0, P5 4/13, P6 4, reversibility 0 |
| Parameter registry | 471 параметр; 297 аннотировано; 61 несимметричная пара; 0 без аннотации |
| Regression Modes 0–43 vs v7.7.7 r1 | **IDENTICAL** — 44 × `common=1348, changed=0, added=100, maxAbs=0` |
| Policy задачи 023 | **PASS** — 4773 события, неожиданных 0 |

Прежние приёмки — `../../docs/ACCEPTANCE_STATUS.md`, раздел «Previous acceptances».

## Self-tests стенда

Полный прогон Lab v0.9.3 на чистом checkout при приёмке задачи 004 (2026-09-25, офлайн-установка из `vendor/`): результаты те же, что на v0.9.2, плюс новый случай QA. Там же: `RUN_LAB` Modes 0–26 `OVERALL: PASS`, `CHECK_CANDIDATE` `BYTE_IDENTICAL` + `POLICY RESULT: PASS` — см. `docs/tasks/004-vendor-dependencies/ACCEPTANCE_RU.md`.

| Скрипт | Результат |
|---|---|
| `SELF_TEST.cmd` (Modes 0, 12) | **PASS** |
| `QA_SELF_TEST.cmd` | **PASS** 43/43 (Linux CI task 024; promotion v7.7.8 Windows baseline до расширения: 42/42) |
| `POLICY_SELF_TEST.cmd` | **PASS** 10/10 |
| `CONFORMANCE_SELF_TEST.cmd` | **PASS** 18/18 |
| `STRUCTURE_SELF_TEST.cmd` | **PASS** 21/21 |
| `LOOP_SELF_TEST.cmd` | **PASS** 15/15 (Windows, promotion v7.7.8); accepted 14 switches / 16384; v7.6 r1 = 16/32; ожидания для accepted выводятся из модели (с v7.7.2) |
| `PLANET_SELF_TEST.cmd` | **PASS** 18/18 (Linux CI task 024; cases 17–18 — energy signal/fulfillment) |
| `NODE_SELF_TEST.cmd` | **PASS** 33/33 (Linux CI task 024); cases 28–33 — `energy_consumer`, fingerprint `fe5f022b5d81ec3b`, integration и strip/rebuild |
| `COMPARE_SELF_TEST.cmd` | **PASS** |

## Lab v0.9.13 — energy_consumer (задача 024)

Harness-only изменение: accepted model, accepted validation и policy не меняются. Добавлены declarative node `energy_consumer`, `planet_closure.energy.signal/fulfillment` и `energy_balance.priority`.

КТ2: GitHub Actions https://github.com/Y2Kill/orbital-economy/actions/runs/37006501565 — `completed/success`; QA 43/43, Planet 18/18, Structure 21/21, Loop 15/15, Conformance 18/18, Policy 10/10, Compare PASS, Bench Modes 0,12 `OVERALL: PASS`. Case 29 сравнивает число loop-combinations с baseline-аудитом; на v7.7.8 это 16384/0 loops, поскольку `Process Energy Enabled` ещё не является сценарной осью до задачи 025.

## Lab v0.9.8 — декларативный генератор узлов (задача 015)

Ветка задачи 015 добавляет harness-only слой: строгие декларации `capital_lifecycle` v1 раскрываются в обычный model patch и generated validation fragment. Accepted ModelJSON, accepted validation, policy, две декларации и существующие семь рукописных kernel-экземпляров не менялись.

GitHub Actions подтвердил:
- Construction Materials Plant: 69 элементов / 6 замен / 126 LINK, validation equal;
- Capital Goods Plant: 76 / 6 / 138, validation equal;
- schema/reference/conflict/determinism cases 2–8 — PASS;
- `expand-nodes --validation` на accepted validation — 871633 bytes identical;
- `NODE SELF-TEST: 9 passed, 0 failed`;
- `guard`, `tools-selftest`, `bench-selftests` — SUCCESS в CI run 36344547409.

Это Linux CI разработки. Канонический Windows-прогон и пересборка SHA256SUMS остаются за reviewer.

## Lab v0.9.10 — строгая схема validation (задача 018)

Harness добавляет статический HARD-gate формы validation до simulation: неизвестные поля/типы, неверные окна и сценарии для отсутствующего Mode больше не могут молча пройти. `compare` / `CHECK_CANDIDATE` при такой ошибке не переходят к численному сравнению и получают `NOT_COMPARED`.

`QA_SELF_TEST` расширен случаями S1–S10 (ожидаемый итог 42/42). Специальная команда `check-validation` позволяет проверить validation до push; с переданным ModelJSON дополнительно проверяется существование Modes.

Accepted model, validation и policy задачей 018 не изменяются. Финальный Linux CI разработки и его run фиксируются в `docs/tasks/018-validation-schema/REPORT_RU.md`; канонический Windows-прогон остаётся за reviewer.

## Рабочая область

`input/model`, `input/validation`, `input/policy` и `reference/accepted/model` содержат принятые артефакты v7.7.8 r1, поэтому `RUN_LAB.cmd` и `CHECK_CANDIDATE.cmd` запускаются без аргументов; `CHECK_CANDIDATE` на нетронутой области даёт `BYTE_IDENTICAL`. Отчёты предыдущих прогонов в `output/` не входят в поставку: актуальные копии лежат в `docs/CAPITAL_LIFECYCLE_CONFORMANCE_REPORT.md`, `docs/STRUCTURE_AUDIT_REPORT.md`, `docs/PARAMETER_REGISTRY.md` пакета.

Канонический разбор дефектов r1 и того, что именно изменено в r2, — `docs/V7_6_R1_TO_R2_FIX_REPORT.md`; порядок команд воспроизведения — `docs/ACCEPTANCE_STATUS.md`.

`closed-world = 0` относится к объявленному контракту границы расширения капитала и не означает, что Planet v1 закончена.

## Lab v0.9.5 — algebraic-loop audit (задача 010)

На ветке задачи 010 GitHub Actions подтверждает новый статический gate до simulation:

- accepted v7.7.1 r1: 7 switches / 128 combinations / 0 loops / Modes none;
- historical v7.6 r1: 16 из 32 комбинаций, Modes 25–26;
- defect mutation 001 r1: 64 из 128 комбинаций, Modes 17–31;
- все 13 loop QA случаев PASS;
- comparator на loop candidate возвращает `NOT_COMPARED` до scenario simulation;
- остальные bench self-tests остаются PASS.

Это **не** запись канонической приёмки Windows: её добавляет reviewer после собственного прогона по TASK 010 §5.


## Lab v0.9.6 — Planet v1 process closure (задача 011)

На ветке задачи 011 GitHub Actions подтверждает новый статический `planet_closure`:

- accepted v7.7.1 r1 в `report`: processes 17, legacy 2, expected source outputs 16;
- P2 capacity = 7 kernel / 10 exceptions / 0 undeclared;
- P3 energy = 4 requests / 2 producers / 11 exceptions / 0 undeclared;
- P4 deposits = 0 with / 6 without;
- P5 labor = 4 declared / 13 undeclared;
- P6 demand drivers = 4; reversibility violations = 0;
- L1–L5 ложные декларации отвергаются по реальным reference paths;
- `planet_v1` на текущей модели FAIL ровно по P4=6 и P5=13; `planet_strict` дополнительно по P2 exceptions=10 и P3 exceptions=11;
- все 16 Planet QA cases PASS; остальные bench self-tests остаются PASS.

Это запись Linux CI разработки, а не каноническая Windows-приёмка. Accepted validation v7.7.1 на ветке исполнителя не изменён; декларация проверяется через `--planet-closure` до решения reviewer о promotion.

## Lab v0.9.9 — `simple_capital` (задача 016)

Accepted ModelJSON/validation/policy не менялись, поэтому baseline имеет `P2.simple=0`. Harness добавляет второй declarative node type `simple_capital`, static/runtime conformance, generated `capital_retirement`, P2 kind `simple`, semantic validation merge и cases 10–15.

CI run 36397985918 (Linux, head `94a395531d1300dd6d685cb5d8ca21aee8f68b89`) завершён success: QA 32/32; Structure 21/21; Loop 15/15; Planet 16/16; Conformance 18/18; Policy 10/10; Compare PASS; NODE SELF-TEST 15/15; bench Modes 0/12 `OVERALL: PASS`. Финальная голова задачи дополнительно включает Mode 38 runtime probe и документацию; её run фиксируется в task report.


## Lab v0.9.11 — smooth capacity cap и per-colony initial (задача 020)

Harness-only изменение `simple_capital`: `capacity_output.cap: "smooth"` для скорости без capacity-параметра и object-form `sizing.signal.initial` по колониям. Существующий `replaces` должен раскрываться без байтовых изменений. Power-resource fixture: 36 add / 6 replace / 94 LINK; NODE QA: 21/21 после успешной CI-проверки.

Accepted ModelJSON, validation и policy задачей 020 не меняются. Linux CI и финальная голова фиксируются в `docs/tasks/020-simple-capital-cap/REPORT_RU.md`; канонический Windows-прогон остаётся за reviewer.

## Lab v0.9.12 — deposit node / retarget_flows (задача 022)

Ветка задачи добавляет harness-only node `deposit`, patch-секцию `retarget_flows`, статический/runtime plugin `deposit` и cases 22–27 NODE QA. Accepted model, validation, policy и `model/nodes/*` задачей 022 не меняются.

Ожидаемый контракт self-test: `NODE SELF-TEST: 27 passed, 0 failed`; deposit fixture = 100 add / 8 replace / 6 retarget / 212 LINK, fingerprint `7d8fe41cc6df5c1a`; merged validation = 6 deposit instances CONFORMING, loops=0, P4.with_deposit +6, unclassified=0; runtime trial должен показать хотя бы один Proven Reserves выше initial.

Статус этой ветки здесь не объявляется PASS до фактического GitHub Actions/reviewer-прогона. Локальные `check_branch` и bench исполнителем задачи 022 не запускаются по контракту §9.4.
