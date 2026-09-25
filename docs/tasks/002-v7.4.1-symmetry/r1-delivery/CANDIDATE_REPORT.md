# Orbital Economy v7.4.1 symmetry candidate r1 — отчёт исполнителя

Дата: 2026-09-21  
База: accepted v7.4 r2  
Base SHA-256: `5de080f30bcfd2229c600121cf32cb48c28f6eec1d98215fdd36f907fe2d6ee3`  
Тип изменения: **behavior-preserving structural symmetry cleanup**.

## 1. Что сделано

Выполнена симметризация тестовой обвязки A/B по `V7_4_1_SYMMETRY_SPEC.md`:

- односторонние demand / mining / power test shocks выражены через явные A/B applicability flags;
- добавлены нейтральные A-side override-константы `Reverse A Wage`, `Reverse A Mining Capacity`, `Priority Stress A Ore Base Cost`;
- добавлен derived `A Effective Wage`;
- 12 указанных в spec формул приведены к зеркальному виду; фактически semantic diff ожидается у 11, потому что новая формула `B Mining Rate` уже дословно совпадает с accepted;
- сценарии Modes 0–20 не изменены;
- удалений нет;
- validation взят из выданного draft без ослаблений;
- policy взят из draft; изменено только `validation_sha256`.

Validation SHA-256: `bfef4fee71668d28758c91777588dcd5e40ab5fb2b3fe2a7c628ba41eecd449b`.

## 2. Важное замечание по счётчику новых элементов

В тексте задания присутствует арифметическая несогласованность: указано «34 флага / 38 новых VARIABLE», но исчерпывающий список требует:

- 14 Metal Demand flags (7 tests × A/B);
- 16 Electronics Demand flags (8 tests × A/B);
- 2 Mining Shock flags (A/B);
- 6 Power flags (3 tests × A/B).

Это **38 applicability flags**. Вместе с тремя нейтральными константами и `A Effective Wage` получается **42 новых VARIABLE**.

В r1 реализован именно исчерпывающий per-colony список из §3, а не ошибочная сумма. Иначе невозможно одновременно получить зеркальные A/B formulas и `colony_symmetry.exceptions = []`.

`PARAMETER_ANNOTATIONS_fragment.json` содержит аннотации для всех **41 новых внешних числовых параметров** (38 flags + 3 neutral constants). `A Effective Wage` — derived formula, поэтому в parameter registry не добавляется как внешний параметр и описан здесь.

## 3. Матрица флагов «тест × колония»

| Mode/Test | Канал | A | B |
|---:|---|---:|---:|
| 2 | Metal Demand | 0 | 1 |
| 3 | Metal Demand | 0 | 1 |
| 4 | Headroom | 0 | 1 |
| 5 | Electronics Demand | 1 | 0 |
| 6 | Headroom | 1 | 0 |
| 7 | Electronics Demand | 1 | 0 |
| 7 | Metal Demand | 0 | 1 |
| 8 | Electronics Demand | 1 | 0 |
| 8 | Metal Demand | 0 | 1 |
| 9 | Electronics Demand | 1 | 0 |
| 9 | Metal Demand | 0 | 1 |
| 11 | Generation Shock | 1 | 0 |
| 13 | Electronics Demand | 1 | 0 |
| 14 | Electronics Demand | 1 | 0 |
| 15 | Electronics Demand | 0 | 1 |
| 16 | Metal Demand | 0 | 1 |
| 18 | Mining Shock | 1 | 0 |
| 19 | Electronics Demand | 1 | 0 |
| 20 | Metal Demand | 0 | 1 |

Значение `1` означает: существующий test multiplier применяется. Значение `0`: используется точный нейтральный множитель `1`.

## 4. Нейтральные константы

| Новый элемент | Значение | Базовое значение | Почему численно нейтрален |
|---|---:|---:|---|
| `Reverse A Wage` | 100 | `A Wage = 100` | Mode 4 получает ту же ставку A, что и раньше |
| `Reverse A Mining Capacity` | 70 | `A Mining Capacity = 70` | reverse-ветка A возвращает прежнюю mining capacity |
| `Priority Stress A Ore Base Cost` | 4 | `A Ore Base Cost = 4` | Mode 8 на A возвращает прежний ore base cost |

`A Effective Wage = IfThenElse(Test 4, Reverse A Wage, A Wage)`, поэтому обе ветви A сейчас равны 100; это structural mirror `B Effective Wage`, а не изменение экономики.

## 5. Изменённые формулы и численная эквивалентность старой ветви

| Элемент | Что изменено | Почему accepted output должен остаться тем же |
|---|---|---|
| `A Metal Unit Cost` | `A Wage` → `A Effective Wage` | `A Effective Wage` всегда возвращает прежнее `A Wage=100` при текущей test wiring |
| `A Effective Ore Base Cost` | добавлена Mode 8 ветвь | `Priority Stress A Ore Base Cost=4 = A Ore Base Cost`; Mode 4 остаётся прежней следующей ветвью |
| `A/B Effective Mining Capacity` | единая switch/Test18/Test4 chain + flags | A: Mode18 flag=1, B=0; Mode4 сохраняется на B, а нейтральный A override равен base |
| `A/B Mining Rate` | обе стороны читают `X Effective Mining Capacity` | effective capacity возвращает тот же capacity, что использовала каждая старая ветвь; B formula уже была такой |
| `A/B Power Active Generation Capacity` | единая chain Modes 11→6→4 + flags | ровно skeleton-паттерн: старый владелец multiplier имеет flag=1, другая сторона ×1 |
| `A/B Effective Local Base Demand` | единая цепочка 20→16→9→8→7→2→3 (20 только coupled branch) | все seven B flags=1, все A flags=0; B повторяет прежнюю chain, A остаётся base demand |
| `A/B Effective Electronics Local Base Demand` | единая цепочка 19→14→13→9→8→5→7→15 (19 только coupled branch) | A flags=1 для 19/14/13/9/8/5/7 и 0 для15; B наоборот; тем самым обе старые односторонние цепочки воспроизводятся |

Порядок тестов сохранён буквально; при взаимном наложении приоритет остаётся прежним.

## 6. LINK

Для каждого `[X]` в новой или изменённой формуле обеспечен `LINK X -> target`.

Дополнительно добавлен:

`Intermediate Inputs Enabled -> B Mining Rate`

Причина: accepted `A Mining Rate` имел этот LINK из-за старой switch-обёртки. Patch format не поддерживает удаление LINK. После снятия switch из формулы A старый LINK остаётся, поэтому его зеркальный B-link нужен для `colony_symmetry` topology; на вычисление он не влияет.

## 7. Самопроверка без simulation-стенда

Выполнены статические проверки на детерминированно собранном candidate:

- base SHA совпадает с заданием;
- unresolved formula references: 0;
- formula references without LINK: 0;
- duplicate LINK: 0;
- `colony_symmetry` с `exceptions=[]`: **mismatches = 0**;
- open boundaries: **90**, unclassified **0**, closed-world violations **7** — без изменения baseline;
- lifecycle kernel: **PASS, 7 instances**;
- сценарии не изменены.

Полный `RUN_LAB` / `CHECK_CANDIDATE` должен выполнить владелец проекта по no-bench workflow.

## 8. Ожидаемый runtime gate

Ожидается:

```text
APPLY_PATCH                 OK
LIFECYCLE_CONFORMANCE       PASS, 7 instances
STRUCTURE_AUDIT             PASS; symmetry mismatches=0; exceptions=0
RUN_LAB                     OVERALL PASS, Modes 0-20
CHECK_CANDIDATE             OUTPUTS_IDENTICAL_WITH_NEW_SERIES
                            changed=0, maxAbs=0 in all 21 Modes
                            POLICY PASS
```

Если любой существующий ряд отличается, это дефект r1: policy намеренно запрещает любое numerical drift.

## 9. Файлы поставки

- `model-patch.json`
- `validation-v7.4.1.json`
- `change-policy-v7.4.1-symmetry-r1.json`
- `CANDIDATE_REPORT.md`
- `PARAMETER_ANNOTATIONS_fragment.json`
- `SHA256SUMS.txt`
