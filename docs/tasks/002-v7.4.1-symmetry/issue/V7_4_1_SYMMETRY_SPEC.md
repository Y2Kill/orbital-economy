# v7.4.1 — Симметризация тестовой обвязки — спецификация

Статус: **r1** (2026-09-21). База: accepted **v7.4 r2** (SHA `5de080f3…`), стенд Orbital Economy Lab v0.8.0. Тип задачи: **behavior-preserving** — выходы всех 21 Mode должны совпасть с accepted **точно** (`changed = 0, maxAbs = 0`), меняется только структура.

## 0. Правило (не обсуждается)

Ни один существующий временной ряд ни в одном Mode 0–20 не меняется ни на бит. Проверяется `CHECK_CANDIDATE`: 21 × `changed = 0, maxAbs = 0`. Это достижимо, потому что все замены дают **численно тот же результат**: множитель ×1 и ×0 точны в IEEE, `IfThenElse` выбирает ветвь без арифметики, а «нейтральные» константы равны текущим базовым значениям.

## 1. Зачем

Аудит `colony_symmetry` держит 18 исключений. Исключение снимает элемент с проверки **целиком** — включая его экономическую структуру. Сегодня под исключениями находятся `? Metal Unit Cost` и `? Mining Rate`: будущая асимметричная правка себестоимости металла или добычи пройдёт незамеченной. Причина исключений — односторонняя тестовая обвязка: шоки сценариев подключены к одной колонии, override-слой Mode 4/8 существует только у B, множители шоков глобальные.

Цель: сделать формулы зеркальными, а «какой тест применяется к какой колонии» вынести в **явные флаги применимости** (константы 0/1) — они становятся частью реестра внешних параметров. После задачи `exceptions = 0`.

## 2. Приём: флаги применимости при общих множителях

Для каждого мультипликативного теста, который сегодня действует на одну колонию:

```text
было (только у B):   IfThenElse([Test 8 …] = 1, [B Local Base Demand] * [Priority Stress Demand Multiplier], …)
стало (у обеих):     IfThenElse([Test 8 …] = 1, [X Local Base Demand] * IfThenElse([X Test 8 Metal Demand Applies] = 1, [Priority Stress Demand Multiplier], 1), …)
                     A Test 8 Metal Demand Applies = 0,  B Test 8 Metal Demand Applies = 1
```

Общие множители (`Priority Stress Demand Multiplier`, `Generation Capacity Shock Factor`, …) **не дублируются и не удаляются** — на них ссылаются обе колонии. Для тестов Mode 4/8, где у B задано *значение* (`Reverse B Wage = 90`, `Reverse B Mining Capacity = 70`, `Priority Stress B Ore Base Cost = 50`), у A вводится нейтральная константа, равная базовой (`Reverse A Wage = 100`, `Reverse A Mining Capacity = 70`, `Priority Stress A Ore Base Cost = 4`).

## 3. Что делать — исчерпывающий список

### 3.1 Override-слой Mode 4 / 8 (значения)

| Новый элемент | Значение | Зачем |
|---|---|---|
| `Reverse A Wage` | 100 | = `A Wage`; A в Mode 4 не меняется |
| `Reverse A Mining Capacity` | 70 | = `A Mining Capacity` |
| `Priority Stress A Ore Base Cost` | 4 | = `A Ore Base Cost` |
| `A Effective Wage` | `IfThenElse([Test 4 Reverse Advantage Active] = 1, [Reverse A Wage], [A Wage])` | зеркало `B Effective Wage` |

Изменяемые: `A Metal Unit Cost` → `[A Effective Wage]` вместо `[A Wage]` (зеркало B); `A Effective Ore Base Cost` → та же цепочка, что у B: `IfThenElse(Test 8, [Priority Stress A Ore Base Cost], IfThenElse(Test 4, [Reverse A Ore Base Cost], [A Ore Base Cost]))`.

### 3.2 Добыча (Mode 4 у B, Mode 18 у A)

Флаг `X Test 18 Mining Shock Applies` (A 1, B 0). Обе колонии:

```text
X Effective Mining Capacity = IfThenElse([Intermediate Inputs Enabled] = 1,
    IfThenElse([Test 18 Metal Supply Shock Active] = 1,
        [X Mining Capacity] * IfThenElse([X Test 18 Mining Shock Applies] = 1, [v7.4 Metal Supply Shock Multiplier], 1),
        IfThenElse([Test 4 Reverse Advantage Active] = 1, [Reverse X Mining Capacity], [X Mining Capacity])),
    IfThenElse([Test 4 Reverse Advantage Active] = 1, [Reverse X Mining Capacity], [X Mining Capacity]))
X Mining Rate = [X Positive Desired Mining Rate] / (1 + ([X Positive Desired Mining Rate] / ([X Effective Mining Capacity] + 0.001)) ^ 8) ^ 0.125
```

(`A Mining Rate` теряет switch-обёртку — она больше не нужна: при switch = 0 `A Effective Mining Capacity` численно равен `A Mining Capacity`.)

### 3.3 Генерация (Modes 4 / 6 / 11)

Флаги `X Test 11 Generation Shock Applies` (A 1, B 0), `X Test 6 Headroom Applies` (A 1, B 0), `X Test 4 Headroom Applies` (A 0, B 1). Обе колонии:

```text
X Power Active Generation Capacity = <base> * IfThenElse([Test 11 …] = 1, IfThenElse([X Test 11 Generation Shock Applies] = 1, [Generation Capacity Shock Factor], 1),
    IfThenElse([Test 6 …] = 1, IfThenElse([X Test 6 Headroom Applies] = 1, [Legacy Advantage Test Power Headroom Multiplier], 1),
    IfThenElse([Test 4 …] = 1, IfThenElse([X Test 4 Headroom Applies] = 1, [Legacy Advantage Test Power Headroom Multiplier], 1), 1)))
```

где `<base>` — существующее `IfThenElse([Capital Lifecycle Enabled] = 1, [X Power Active Generation Capital], [X Power Installed Generation Capacity])`. **Проверено skeleton-патчем на стенде** (см. `skeleton/`).

### 3.4 Спрос на металл (Tests 20, 16, 9, 8, 7, 2, 3 — сегодня только у B)

Флаги `X Test N Metal Demand Applies` для N ∈ {20, 16, 9, 8, 7, 2, 3}: B = 1 для всех семи, A = 0 для всех семи. Обе колонии получают формулу B (с её switch-обёрткой и порядком тестов), в которой каждый множитель обёрнут `IfThenElse([X Test N Metal Demand Applies] = 1, <множитель>, 1)`.

### 3.5 Спрос на электронику (Tests 19, 14, 13, 9, 8, 5, 7 — у A; Test 15 — у B)

Флаги `X Test N Electronics Demand Applies` для N ∈ {19, 14, 13, 9, 8, 5, 7, 15}: A = 1 для первых семи, 0 для 15; B — наоборот. Обе колонии получают единую цепочку: switch-обёртка с Test 19 в coupled-ветке (как у A сейчас), затем 14, 13, 9, 8, 5, 7, **15** (добавляется в конец обеих ветвей), каждый множитель под флагом.

### 3.6 Итог по новым элементам

3 нейтральные константы + `A Effective Wage` + 34 флага (1 mining + 3 power + 14 metal demand + 16 electronics demand) = **38 новых VARIABLE**, все константы кроме `A Effective Wage`. Изменяемые существующие: `A Metal Unit Cost`, `A Effective Ore Base Cost`, `A/B Effective Mining Capacity`, `A/B Mining Rate`, `A/B Power Active Generation Capacity`, `A/B Effective Local Base Demand`, `A/B Effective Electronics Local Base Demand` — 12 элементов. Удалений нет. Новых Modes нет. Сценарии не меняются.

## 4. Инварианты приёмки

1. `CHECK_CANDIDATE`: 21 × `changed = 0, maxAbs = 0`; `COMPARISON RESULT: OUTPUTS_IDENTICAL_WITH_NEW_SERIES`; policy PASS.
2. `STRUCTURE_AUDIT` с validation r1 этой задачи (`colony_symmetry.exceptions = []`): **mismatches = 0**.
3. `LIFECYCLE_CONFORMANCE` 7/7; `open_boundaries` без изменений (90 / 7).
4. Реестр параметров: все 34 флага и 3 константы аннотированы в `PARAMETER_ANNOTATIONS.json` (исполнитель поставляет фрагмент аннотаций; тег `test-applicability`).

## 5. Что запрещено

- менять значения общих множителей или тестовых окон;
- удалять глобальные множители (патч этого и не умеет);
- «улучшать» экономику по пути; любое ненулевое отличие ряда = отклонение;
- добавлять `Intermediate Inputs Enabled` / `Capital Lifecycle Enabled` куда-либо, кроме указанных в §3 формул (в 3.2 и 3.4/3.5 switch-обёртки уже есть и просто дублируются на вторую колонию).
