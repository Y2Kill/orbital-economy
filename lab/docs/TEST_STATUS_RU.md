# Статус проверок Orbital Economy Lab v0.9.18 — baseline v7.7.13 r1

## Принятая основа

- Модель: **Orbital Economy v7.7.13 r1 — Labor Market** — ACCEPTED 2026-10-10.
- SHA-256: `cede8ecf699995bc818646a2e922f87f3d798c002231fa70e14d3e357196d4f1`.
- Validation: `validation/validation-v7.7.13.json`.
- Policy: `policy/change-policy-v7.7.13-strict.json` (default deny, rules: []).
- Engine: `simulation@9.0.0` pinned; каноническая платформа Windows x64 · Node 24.11.1 (`../../docs/VERSIONING_AND_AUTHORITY.md` §8), эталон `reference/accepted/series-digest.windows.json`.
- Scenarios: Modes 0–53.
- Предшественник: v7.7.12 r1 (`e8829fa550172dfab9629a0d66b0c628c1d802c5c1a3826ab7a9a86365c9f234`), лежит в `reference/v7.7.12/`.

## Проверки promotion v7.7.13 (прогон 2026-10-10, каноническая платформа)

| Проверка | Результат |
|---|---|
| Validation Modes 0–53 | **PASS** — 54/54, 22489 проверок |
| Capital Lifecycle conformance | **PASS** — 11 instances ядра, 0 NON_CONFORMING; `simple_capital` 6, `deposit` 6, `labor` 17, `population` 2, `food` 2 и `labor_market` 2 instances CONFORMING |
| Structure audit | **PASS** — 323 FLOW, 262 boundary, unclassified 0, closed-world 0, пары 27 |
| A/B symmetry | **PASS** — mismatches 0, exceptions 0 |
| Algebraic loop audit | **PASS** — 17 switches, 131072 combinations, loops 0 |
| Planet closure (`planet_v1`) | **PASS** — P2 11/8/0/0, P3 16/2/1/0, P4 6/0, P5 19/0, P6 4 (нормы спроса на душу), reversibility 0 |
| Energy balance | **PASS** — 8 потребителей; `priority` = Power Resource Extraction и Farming, приоритетная доля не ниже общей |
| Parameter registry | 582 параметр(ов); 403 аннотировано; 71 несимметричных пар; 0 без аннотации |
| Regression Modes 0–51 vs v7.7.12 r1 | **IDENTICAL** — 52 × `common=1733, changed=0, added=31, maxAbs=0` (`Labor Market Enabled` = 0) |
| Policy задачи 034 | **PASS** — 1778 событий, неожиданных 0 |

Прежние приёмки — `../../docs/ACCEPTANCE_STATUS.md`, раздел «Previous acceptances».

## Self-tests стенда

Полный прогон Lab v0.9.3 на чистом checkout при приёмке задачи 004 (2026-09-25, офлайн-установка из `vendor/`): результаты те же, что на v0.9.2, плюс новый случай QA. Там же: `RUN_LAB` Modes 0–26 `OVERALL: PASS`, `CHECK_CANDIDATE` `BYTE_IDENTICAL` + `POLICY RESULT: PASS` — см. `docs/tasks/004-vendor-dependencies/ACCEPTANCE_RU.md`.

| Скрипт | Результат |
|---|---|
| `SELF_TEST.cmd` (Modes 0, 12) | **PASS** |
| `QA_SELF_TEST.cmd` | **PASS** 47/47 (Windows, promotion v7.7.13) |
| `POLICY_SELF_TEST.cmd` | **PASS** 10/10 (Windows, promotion v7.7.13) |
| `CONFORMANCE_SELF_TEST.cmd` | **PASS** 18/18 (Windows, promotion v7.7.13) |
| `STRUCTURE_SELF_TEST.cmd` | **PASS** 21/21 (Windows, promotion v7.7.13) |
| `LOOP_SELF_TEST.cmd` | **PASS** 19/19 (Windows, promotion v7.7.13); accepted 16 switches / 65536; fast path byte-identical to `--exhaustive` (case 16 pinned to <= 10 switches) |
| `PLANET_SELF_TEST.cmd` | **PASS** 20/20 (Windows, promotion v7.7.13); accepted in planet_v1 mode: P2=11/6/0/0, P3=14/2/1/0, P4=6/0, P5=17/0 |
| `NODE_SELF_TEST.cmd` | **PASS** 59/59 (Windows, promotion v7.7.13); слои снимаются по модели; узел с переключателем `labor_market` лежит поверх всех и снимается первым, `food` — под ним; случаи прежних узлов работают на слоях без верхних узлов (validation без их фрагментов, P6 — прежние драйверы); cases 53–59 на принятой модели снимают и собирают заново слой `labor_market` с восстановлением прежних чисел |
| `COMPARE_SELF_TEST.cmd` | **PASS** (Windows, promotion v7.7.13) |

## Lab v0.9.14 — exact loop-audit speed-up (задача 025)

Harness-only оптимизация `loop_audit.js`: candidate SCC filtering, condition cache, static formula/component cache и relevant-switch projection. Формат algebraic-loop отчёта не меняется; `{ exhaustive: true }` и CLI `--exhaustive` сохраняют прежний полный 2^n путь как встроенный эталон.

LOOP QA расширен до 19 cases. Главный критерий — побайтное равенство fast/exhaustive audit JSON и `algebraicLoopCombinationDetails`; точные CI run/timings КТ1 и КТ2 находятся в отчёте задачи 025.

Round 2 ограничивает exhaustive-oracle case 16 максимум десятью scenario switches через `pinSwitches`: accepted и mutation 001 сравниваются fast/exhaustive на ≤1024 комбинациях, при этом `Intermediate Inputs Enabled` обязательно сохраняется и mutation остаётся loop-positive. Case 1 по-прежнему проверяет fast path на полной принятой модели.

Accepted model, validation и policy не меняются.

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

`input/model`, `input/validation`, `input/policy` и `reference/accepted/model` содержат принятые артефакты v7.7.13 r1, поэтому `RUN_LAB.cmd` и `CHECK_CANDIDATE.cmd` запускаются без аргументов; `CHECK_CANDIDATE` на нетронутой области даёт `BYTE_IDENTICAL`. Отчёты предыдущих прогонов в `output/` не входят в поставку: актуальные копии лежат в `docs/CAPITAL_LIFECYCLE_CONFORMANCE_REPORT.md`, `docs/STRUCTURE_AUDIT_REPORT.md`, `docs/PARAMETER_REGISTRY.md` пакета.

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

## Task 027 / Lab v0.9.15

Новый declarative node `labor` проверяется на четырёх уровнях: generator oracle, semantic validation merge, static conformance/Planet P5 и runtime identity. Эталон фикстуры: 69 добавлений, 4 замены, 123 LINK, 17 labor instances, fingerprint `8da2d7d17c679eda`.

Целевые self-test totals: QA **44/44**, Planet **20/20**, Node **39/39**. Канонические model/validation/policy этой задачей не изменяются; их продвижение выполняется отдельной задачей.


## Task 029 / Lab v0.9.16

Harness-only изменение: declarative node `population` и validation plugin `population`. Accepted ModelJSON, accepted validation, policy и `model/nodes/*` задачей 029 не меняются.

Контракт фикстуры: **49 add / 0 replace / 90 LINK**, два migration FLOW, fingerprint `35d24655fc422942`. После generated validation ожидаются 2 population instances CONFORMING, open boundaries **232**, unclassified 0, loops 0/32768 и `planet_v1 PASS`. Runtime дополнительно проверяет сохранение людей при миграции.

Целевые self-test totals: NODE **45/45**, QA **45/45**; остальные self-tests должны остаться PASS. Точный Linux CI и финальная голова фиксируются в `docs/tasks/029-population-node/REPORT_RU.md`; Windows acceptance остаётся за reviewer.


## Task 031 / Lab v0.9.17

Harness-only изменение: declarative node `food`, validation plugin `food` и исправление node layering. Accepted ModelJSON, accepted validation, policy и `model/nodes/*` не меняются.

Контракт fixture: **96 add / 24 replace / 239 LINK**, 24 switch-wrapped replacements, fingerprint `c18a59dd39488c12`. Generated validation ожидает 2 food instances CONFORMING, open boundaries 254 / unclassified 0, `planet_v1 PASS` с P2 simple +2, P3 requests +2, P5 declared +2, loops 0.

Целевые self-test totals: NODE **52/52**, QA **46/46**; финальный Linux CI фиксируется в `docs/tasks/031-food-node/REPORT_RU.md`.


## Task 033 / Lab v0.9.18

Harness-only изменение: declarative node `labor_market`, validation plugin и обобщённая слоистость node QA. Accepted **Orbital Economy v7.7.12 r1 — Food**, accepted validation/policy и `model/nodes/*` не меняются.

Эталон fixture: **31 add / 24 replace / 108 LINK**, fingerprint `8ac752ca9a1175e4`. Static integration: labor_market 2 CONFORMING, open boundaries **262**, unclassified 0, symmetry mismatches 0, Planet P6 **4**, algebraic loops 0. Runtime case 55 включает switch и прогоняет **все** merged plugins.

Linux CI на кодовой голове `f7757fd`: [run 38040788876](https://github.com/Y2Kill/orbital-economy/actions/runs/38040788876) — guard/tools/bench success; **QA 47/47**, **NODE 59/59**, `OVERALL: PASS`. Финальная документированная голова фиксируется в отчёте задачи после отдельного CI.
