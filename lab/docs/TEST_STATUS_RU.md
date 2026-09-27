# Статус проверок Orbital Economy Lab v0.9.8 — baseline v7.7.4 r1

## Принятая основа

- Модель: **Orbital Economy v7.7.4 r1 — Capital Goods Capital** — ACCEPTED 2026-09-27.
- SHA-256: `8a71fe6678c4fc6c532bb8e35b6006280ddb9639a69aed045a6ca25f516f1991`.
- Validation: `validation/validation-v7.7.4.json`.
- Policy: `policy/change-policy-v7.7.4-strict.json` (default deny, rules: []).
- Engine: `simulation@9.0.0` pinned; каноническая платформа Windows x64 · Node 24.11.1 (`../../docs/VERSIONING_AND_AUTHORITY.md` §8), эталон `reference/accepted/series-digest.windows.json`.
- Scenarios: Modes 0–37.
- Предшественник: v7.7.3 r1 (`a620cc65b93f6faedf2303e16f10dd595a882c319403c0b1bd98b69c1f7ef173`), лежит в `reference/v7.7.3/`.

## Проверки promotion v7.7.4 (прогон 2026-09-27, каноническая платформа)

| Проверка | Результат |
|---|---|
| Validation Modes 0–37 | **PASS** — 38/38, 8219 проверок |
| Capital Lifecycle conformance | **PASS** — 11 instances, 0 NON_CONFORMING |
| Structure audit | **PASS** — 197 FLOW, 154 boundary, unclassified 0, closed-world 0, пары 19 |
| A/B symmetry | **PASS** — mismatches 0, exceptions 0 |
| Algebraic loop audit | **PASS** — 10 switches, 1024 combinations, loops 0 |
| Planet closure (`report`) | **PASS** — P2 11/6/0, P3 6/2/9/0, P4 0/6, P5 4/13, P6 4, reversibility 0 |
| Parameter registry | 401 параметр; 227 аннотировано; 49 несимметричных пар; 0 без аннотации |
| Regression Modes 0–35 vs v7.7.3 r1 | **IDENTICAL** — 36 × `common=1168, changed=0, added=76, maxAbs=0` |
| Policy задачи 014 | **PASS** — 2995 событий, неожиданных 0 |

Прежние приёмки — `../../docs/ACCEPTANCE_STATUS.md`, раздел «Previous acceptances».

## Self-tests стенда

Полный прогон Lab v0.9.3 на чистом checkout при приёмке задачи 004 (2026-09-25, офлайн-установка из `vendor/`): результаты те же, что на v0.9.2, плюс новый случай QA. Там же: `RUN_LAB` Modes 0–26 `OVERALL: PASS`, `CHECK_CANDIDATE` `BYTE_IDENTICAL` + `POLICY RESULT: PASS` — см. `docs/tasks/004-vendor-dependencies/ACCEPTANCE_RU.md`.

| Скрипт | Результат |
|---|---|
| `SELF_TEST.cmd` (Modes 0, 12) | **PASS** |
| `QA_SELF_TEST.cmd` | **PASS** 32/32 с Lab v0.9.7 (v0.9.7: `energy_balance` со списком `consumers`) (случаи v0.9.3: подменённая версия движка отвергается; v0.9.4: побитовое хеширование рядов) |
| `POLICY_SELF_TEST.cmd` | **PASS** 10/10 |
| `CONFORMANCE_SELF_TEST.cmd` | **PASS** 18/18 |
| `STRUCTURE_SELF_TEST.cmd` | **PASS** 21/21 |
| `LOOP_SELF_TEST.cmd` | **PASS** 15/15 (Windows, promotion v7.7.2); accepted 10 switches / 1024; v7.6 r1 = 16/32; ожидания для accepted выводятся из модели (с v7.7.2) |
| `PLANET_SELF_TEST.cmd` | **PASS** 16/16 (Windows, promotion v7.7.2); accepted P2=11/6/0, P3=6/2/9/0, P4=0/6, P5=4/13, P6=4; ожидаемые счётчики выводятся из декларации (с v7.7.2) |
| `NODE_SELF_TEST.cmd` | **PASS** 9/9 (Linux CI задачи 015); case 1 = 69/6/126 и 76/6/138, case 9 = 871633 bytes identical |
| `COMPARE_SELF_TEST.cmd` | **PASS** |

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

## Рабочая область

`input/model`, `input/validation`, `input/policy` и `reference/accepted/model` содержат принятые артефакты v7.7.4 r1, поэтому `RUN_LAB.cmd` и `CHECK_CANDIDATE.cmd` запускаются без аргументов; `CHECK_CANDIDATE` на нетронутой области даёт `BYTE_IDENTICAL`. Отчёты предыдущих прогонов в `output/` не входят в поставку: актуальные копии лежат в `docs/CAPITAL_LIFECYCLE_CONFORMANCE_REPORT.md`, `docs/STRUCTURE_AUDIT_REPORT.md`, `docs/PARAMETER_REGISTRY.md` пакета.

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
