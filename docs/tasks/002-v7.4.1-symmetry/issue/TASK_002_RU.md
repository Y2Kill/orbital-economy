# Задание 002 — v7.4.1: симметризация тестовой обвязки A/B

Дата выдачи: 2026-09-21. База: accepted **v7.4 r2** (SHA `5de080f3…`), стенд Orbital Economy Lab v0.9.0 — всё в `baseline/`. Тип: **behavior-preserving** (ни один ряд не меняется).

## 1. Цель

Убрать все 18 исключений аудита `colony_symmetry`, сделав формулы A и B зеркальными, а односторонние тестовые шоки — явными флагами применимости (`X Test N … Applies`, константы 0/1). После задачи: `exceptions = []`, `mismatches = 0`, все 21 Mode `changed = 0, maxAbs = 0`. Подробно: `V7_4_1_SYMMETRY_SPEC.md` (§3 — исчерпывающий список).

Зачем: исключение снимает элемент с проверки целиком; сегодня под исключениями `? Metal Unit Cost` и `? Mining Rate` — экономическое ядро, и будущая асимметричная правка там прошла бы незамеченной.

## 2. Как устроена работа

Как в задаче 001: вы отдаёте **патч** (`baseline\lab\docs\MODEL_PATCH_RU.md`), мы прогоняем и возвращаем отчёты. Ожидаемое число итераций — 1–2: задача механическая, риск только в опечатках имён и пропущенных LINK.

Порядок чтения: `V7_4_1_SYMMETRY_SPEC.md` → `V7_4_1_WORKING_CONTEXT.md` (дословные формулы всех затрагиваемых элементов и их входящие LINK) → `skeleton/skeleton-patch-partial.json` (проверенный на стенде образец для `A Effective Wage`, `A Metal Unit Cost`, `X Power Active Generation Capacity`) → `change-policy-v7.4.1-symmetry-draft.json` → `validation-v7.4.1-symmetry-draft.json`.

## 3. Что вернуть (`delivery_rN/`)

| # | Артефакт | Требование |
|---|---|---|
| 1 | `model-patch.json` | `base_sha256 = 5de080f3…`; `name = "Orbital Economy v7.4.1 symmetry candidate rN"`; только `add_elements` / `replace_formulas` / `add_links`; сценарии не трогать |
| 2 | `validation-v7.4.1.json` | = draft (исключения пусты); ничего не ослаблять |
| 3 | `change-policy-v7.4.1-symmetry-rN.json` | = draft + `validation_sha256` (сообщим) |
| 4 | `CANDIDATE_REPORT.md` | таблица флагов «тест × колония» (это будущий раздел реестра параметров), список нейтральных констант с обоснованием равенства базовым, перечень изменённых формул с указанием, что старая ветвь численно эквивалентна |
| 5 | `PARAMETER_ANNOTATIONS_fragment.json` | аннотации для 38 новых элементов в формате `orbital-economy-parameter-annotations-v1` (`role`, `effect`, тег `test-applicability`); мы вольём в `docs/PARAMETER_ANNOTATIONS.json` |

## 4. Критерий приёмки

```text
APPLY_PATCH                 OK
LIFECYCLE_CONFORMANCE.cmd   PASS, 7 instances
STRUCTURE_AUDIT.cmd         PASS; colony symmetry mismatches = 0, exceptions = 0; open boundaries 90 / closed-world 7 (без изменений)
RUN_LAB.cmd                 OVERALL: PASS (Modes 0–20)
CHECK_CANDIDATE.cmd         COMPARISON RESULT: OUTPUTS_IDENTICAL_WITH_NEW_SERIES
                            21 × changed = 0, maxAbs = 0
                            POLICY RESULT: PASS  (Unexpected 0, Forbidden 0, Required missing 0)
```

Любое ненулевое отличие ряда — отклонение (policy: `FORBIDDEN`). Множитель ×1 и выбор ветви IfThenElse точны; если отличие появилось — значит нейтральная константа не равна базовой или порядок тестов в цепочке отличается от исходного.

## 5. Чек-лист самопроверки

- [ ] флаги: 14 metal demand (Tests 20,16,9,8,7,2,3 × A/B), 16 electronics demand (Tests 19,14,13,9,8,5,7,15 × A/B), 2 mining (Test 18), 6 power (Tests 11, 6, 4) — итого 34; значения: A/B по §3 спецификации;
- [ ] `Reverse A Wage = 100`, `Reverse A Mining Capacity = 70`, `Priority Stress A Ore Base Cost = 4` — равны базовым A;
- [ ] у каждой зеркальной цепочки **одинаковый порядок тестов** и одинаковая switch-обёртка на обеих сторонах; множители общие, под флагом `IfThenElse([X … Applies] = 1, [множитель], 1)`;
- [ ] `A Mining Rate` — без switch-обёртки, как у B; `A Metal Unit Cost` читает `[A Effective Wage]`;
- [ ] каждый `[X]` в новой/изменённой формуле имеет LINK; для стороны, у которой тестового переключателя или множителя раньше не было, LINK добавляется (см. skeleton: `Test 11 … -> B Power Active Generation Capacity`);
- [ ] ничего не удалено; глобальные множители остались; сценарии не менялись;
- [ ] имена флагов строго по шаблону `X Test N <Metal Demand|Electronics Demand|Mining Shock|Generation Shock|Headroom> Applies` — policy разрешает `? Test * Applies`.

## 6. Что запрещено

Менять значения множителей/окон; удалять элементы; «упрощать» цепочки (порядок тестов — часть поведения: при одновременно активных тестах побеждает первый); добавлять переключатели куда-либо сверх §3; новые исключения симметрии.
