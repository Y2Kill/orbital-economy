# Статус проверок Orbital Economy Lab v0.9.6 — baseline v7.7.1 r1

## Принятая основа

- Модель: **Orbital Economy v7.7.1 r1 — Transport on Construction Materials** — ACCEPTED 2026-09-26.
- SHA-256: `d53d014d727a439694e103aafb49f87d4dbbb362e581414cbf4dc71a19646f93`.
- Validation: `validation/validation-v7.7.1.json`.
- Policy: `policy/change-policy-v7.7.1-strict.json` (default deny, rules: []).
- Engine: `simulation@9.0.0` pinned; каноническая платформа Windows x64 · Node 24.11.1 (`../../docs/VERSIONING_AND_AUTHORITY.md` §8), эталон `reference/accepted/series-digest.windows.json`.
- Scenarios: Modes 0–31.
- Предшественник: v7.7 r1 (`5bbc29b6e18caa64ec22267892b6cd0669649722c8fc029d8dba43a77a34d5a1`), лежит в `reference/v7.7/`.

## Проверки promotion v7.7.1 (прогон 2026-09-26, каноническая платформа)

| Проверка | Результат |
|---|---|
| Validation Modes 0–31 | **PASS** — 32/32, 5120 проверок |
| Capital Lifecycle conformance | **PASS** — 7 instances, 0 NON_CONFORMING |
| Structure audit | **PASS** — 153 FLOW, 122 boundary, unclassified 0, closed-world 0, пары 15 |
| A/B symmetry | **PASS** — mismatches 0, exceptions 0 |
| Algebraic loop audit | **PASS (Linux CI задачи 010)** — 7 switches, 128 combinations, loops 0; каноническая Windows-проверка — при приёмке |
| Parameter registry | 355 параметров; 189 аннотировано; 45 несимметричных пар; 0 без аннотации |
| Regression Modes 0–29 vs v7.7 r1 | **IDENTICAL** — 30 × `common=1070, changed=0, added=12, maxAbs=0` |
| Policy задачи 009 | **PASS** — 441 событие, неожиданных 0 |

Прежние приёмки — `../../docs/ACCEPTANCE_STATUS.md`, раздел «Previous acceptances».

## Self-tests стенда

Полный прогон Lab v0.9.3 на чистом checkout при приёмке задачи 004 (2026-09-25, офлайн-установка из `vendor/`): результаты те же, что на v0.9.2, плюс новый случай QA. Там же: `RUN_LAB` Modes 0–26 `OVERALL: PASS`, `CHECK_CANDIDATE` `BYTE_IDENTICAL` + `POLICY RESULT: PASS` — см. `docs/tasks/004-vendor-dependencies/ACCEPTANCE_RU.md`.

| Скрипт | Результат |
|---|---|
| `SELF_TEST.cmd` (Modes 0, 12) | **PASS** |
| `QA_SELF_TEST.cmd` | **PASS** 31/31 с Lab v0.9.4 (случаи v0.9.3: подменённая версия движка отвергается; v0.9.4: побитовое хеширование рядов) |
| `POLICY_SELF_TEST.cmd` | **PASS** 10/10 |
| `CONFORMANCE_SELF_TEST.cmd` | **PASS** 18/18 |
| `STRUCTURE_SELF_TEST.cmd` | **PASS** 21/21 |
| `LOOP_SELF_TEST.cmd` | **PASS (Linux CI задачи 010)** 13/13; v7.6 r1 = 16/32, mutation 001 = 64/128 |
| `PLANET_SELF_TEST.cmd` | **PASS (Linux CI задачи 011)** 16/16; baseline P2=7/10/0, P3=4/2/11/0, P4=0/6, P5=4/13, P6=4 |
| `COMPARE_SELF_TEST.cmd` | **PASS** |

## Рабочая область

`input/model`, `input/validation`, `input/policy` и `reference/accepted/model` содержат принятые артефакты v7.7.1 r1, поэтому `RUN_LAB.cmd` и `CHECK_CANDIDATE.cmd` запускаются без аргументов; `CHECK_CANDIDATE` на нетронутой области даёт `BYTE_IDENTICAL`. Отчёты предыдущих прогонов в `output/` не входят в поставку: актуальные копии лежат в `docs/CAPITAL_LIFECYCLE_CONFORMANCE_REPORT.md`, `docs/STRUCTURE_AUDIT_REPORT.md`, `docs/PARAMETER_REGISTRY.md` пакета.

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
