# Orbital Economy v7.4 Intermediate Inputs — candidate r2 report

Дата: 2026-09-21  
База: accepted v7.3 r2  
Base SHA-256: `57a2a102f2b632c69c37cc00c4cd11182ca2601d2af9395560228b5fdde0f44d`  
Спецификация: `V7_4_ARCHITECTURE_SPEC.md` r1.1 + `V7_4_TEST_PLAN.md` r1.1.  
Источник чисел для r2: пакет `task_001_v7.4_feedback_1`, включая acceptance experiment варианта r1 с поправками r1.1.

## 1. Integrity / границы изменения

Candidate r2 остаётся `orbital-economy-model-patch-v1`; полная модель не поставляется.

Патч r2 содержит:

- 25 новых элементов;
- 19 замен формул/initial_value существующих элементов;
- 88 новых LINK;
- `Intermediate Inputs Enabled = 0` во всех Modes 0–16;
- 4 новых сценария Modes 17–20.

По сравнению с r1 добавлены обязательные r1.1 элементы:

- `A Effective Mining Capacity`;
- `Planet Electronics Production Rate`;
- `Planet Smelting Rate`;
- переоценка initial value `A/B Electronics Feedstock Inventory`;
- coupled-ветка `A Mining Rate`;
- зеркальные диагностические helpers `A/B Metal Input Final Fulfillment` для исполняемой проверки 20.1.

Из r1 удалена правка `B Effective Mining Capacity`: baseline-формула B остаётся неизменной.

Удалений, переименований, изменений типов, изменений `from`/`to` существующих FLOW и simulation settings нет.

Статическая самопроверка без запуска simulation engine:

- patch refs resolve: PASS;
- каждая формульная ссылка `[X]` имеет LINK `X → target`: PASS;
- duplicate LINK: 0;
- FLOW endpoints: PASS, существующие STOCK;
- scenario Modes: ровно 0–20;
- неизвестных scenario keys: 0;
- итоговая статическая сборка: 2440 elements;
- runtime-гейты r2 не заявляются как выполненные — их запускает принимающая сторона.

## 2. Что исправлено после r1

### 2.1 Устранена алгебраическая петля

Приёмочный прогон r1 показал `Circular equation loop` во всех Modes 17–20. Причина была в том, что `Metal Input Demand` зависел от фактического `Electronics Feedstock Consumption Rate`, а фактический выпуск в тот же шаг зависел от энергетического allocator, плавки и `Desired Smelting Rate`.

В r2 Target/Demand строятся от планируемого pre-energy выпуска:

```text
X Electronics Metal Input Target Inventory
    = X Pre Energy Electronics Production Rate
      * Metal per Electronics
      * Metal Input Target Days

X Electronics Metal Input Demand
    = Max(0,
          X Pre Energy Electronics Production Rate * Metal per Electronics
          + (Target Inventory - X Electronics Feedstock Inventory)
            / Metal Input Adjustment Time)
```

`X Electronics Feedstock Consumption Rate` остаётся фактическим:

```text
X Electronics Production Rate * Metal per Electronics
```

Таким образом планирование входа больше не замыкает same-step цепь `smelting → energy → actual production → input demand → smelting`.

### 2.2 Coupled initial Feedstock Inventory переоценён в Metal units

Watch item r1 подтвердился: inherited `1200` держал Metal Input Demand на нуле примерно до day 228 у A / 188 у B.

r2 меняет только `initial_value` и только через switch wrapper:

```text
IfThenElse(
  [Intermediate Inputs Enabled] = 1,
  [Metal per Electronics] * 1200,
  1200
)
```

При `Metal per Electronics = 0.25` coupled initial stock = 300 Metal units. Legacy branch Modes 0–16 остаётся ровно `1200`.

Acceptance experiment r1.1 после этой поправки показал первую поставку A на day 0, B примерно на day 25.5.

### 2.3 Mode 18 перенесён с B на A

r1-шок B Mining Capacity не был binding: B добывала/плавила существенно ниже доступной мощности и получала металл импортом.

В r2:

```text
A Effective Mining Capacity
    = coupled ? (Test18 ? A Mining Capacity * 0.5 : A Mining Capacity)
              : A Mining Capacity
```

и coupled branch `A Mining Rate` использует `A Effective Mining Capacity`.

`B Effective Mining Capacity` полностью возвращён к accepted v7.3 behavior.

### 2.4 Диагностика going concern и proportional rationing

Добавлены:

```text
Planet Electronics Production Rate
    = A Electronics Production Rate + B Electronics Production Rate

Planet Smelting Rate
    = A Smelting Rate + B Smelting Rate
```

Для test 20.1 добавлена зеркальная диагностическая пара:

```text
X Metal Input Final Fulfillment
    = IfThenElse(X Local Demand > 0.001,
                 X Local Sales / X Local Demand,
                 1)
```

Она не участвует в динамике и существует только для декларативной identity:

```text
B Electronics Metal Input Fulfillment
- B Metal Input Final Fulfillment
= 0
```

на [360,1080], tolerance `1e-6`.

## 3. Regression gate — Modes 0–16

Результат r1 уже подтвердил фундаментальную форму:

```text
17 Modes
changed existing series = 0
maxAbs = 0
```

r2 не переписывает ни одну legacy-ветку r1. Новые r2 replacements также сохраняют accepted branch дословно:

- `A/B Electronics Feedstock Inventory`: legacy initial value = `1200`;
- `A Mining Rate`: legacy branch = accepted v7.3 formula.

Поэтому ожидаемый r2 regression gate остаётся:

```text
Modes 0–16:
all accepted/common series changed = 0
maxAbs = 0
```

Новые diagnostic series являются только `series_added` и покрыты policy namespace.

## 4. HARD checks

`validation-v7.4.json` основан на supplied `validation-v7.4-draft-r1.1.json`.

Не ослаблены:

- все v7.3.2 checks;
- energy balance;
- capital lifecycle kernel;
- transport allocator;
- Metal-input fulfillment ∈ [0,1];
- Delivery ≤ Demand;
- Delivery ≤ Available;
- неотрицательность Delivery/Demand и соответствующих inventories;
- static audits / colony symmetry r1.1.

Единственная предусмотренная новая asymmetry — `A Effective Mining Capacity`, уже описанная supplied validation r1.1. Helpers `A/B Metal Input Final Fulfillment` добавлены зеркально и нового symmetry exception не требуют.

## 5. Калибровка `Metal per Electronics`

Значение оставлено:

```text
Metal per Electronics = 0.25
Metal Input Target Days = 20
Metal Input Adjustment Time = 20
```

`0.25` не подгонялось к legacy Mode 12. При связи меняется сама структура сравнительных преимуществ: B теряет экзогенный feedstock cost = 3, а A вместо legacy feedstock contribution ≈18 получает Metal input, который при текущих ценах оказывается сравнительно дешевле.

Acceptance experiment подтверждает, что это не малая perturbation, а структурно видимая связь.

### Mode 12 vs Mode 17 @1080

| Величина | Mode 12 accepted | Mode 17 coupled r1.1 experiment |
|---|---:|---:|
| A Electronics Production Rate | 1.288 | 22.065 |
| B Electronics Production Rate | 40.774 | 14.976 |
| Planet Electronics Production Rate | 42.062 | 37.041 |
| A Smelting Rate | 43.395 | 44.663 |
| B Smelting Rate | 1.381 | 5.423 |
| Planet Smelting Rate | 44.776 | 50.086 |
| A Market Price | 25.899 | 30.474 |
| B Market Price | 32.325 | 37.407 |
| A Electronics Unit Cost | 23.960 | 13.751 |
| B Electronics Unit Cost | 10.370 | 16.712 |
| Metal shipment A→B | 23.125 | 20.778 |
| Electronics shipment B→A | 21.684 | 0.000 |
| Electronics shipment A→B | 0.000 | 1.255 |
| A Energy Unserved Demand | 0.000 | 72.358 |
| B Energy Unserved Demand | 0.000 | 0.000 |
| A Power Installed Generation Capital | 1328.4 | 1610.1 |

Интерпретация: specialization действительно переворачивается. A остаётся крупным Metal producer и становится конкурентоспособной в Electronics; B теряет legacy-экзогенное преимущество feedstock. Планетарный выпуск Electronics остаётся going concern (`37.04` против `42.06`), а planet smelting растёт (`50.09` против `44.78`).

A energy scarcity в Mode 17 к 1080 не равен нулю, но supplied experiment показывает снижение `107.42 @720 → 72.36 @1080`; это согласуется с документированным v7.3 planning lag.

## 6. Mode 17 — Intermediate Inputs Baseline

Supplied experiment r1.1:

- A delivery начинается day 0;
- B delivery — примерно day 25.5;
- A fulfillment @1080 = `0.97112`;
- B fulfillment @1080 = `0.97992`;
- Planet Electronics @1080 = `37.041`;
- Planet Smelting @1080 = `50.086`;
- A Electronics @1080 = `22.065`;
- B Electronics @1080 = `14.976`;
- B late unserved energy = `0`;
- A unserved energy снижается к концу горизонта.

Это удовлетворяет revised going-concern logic на уровне планеты и подтверждает, что переоценка initial feedstock inventory устраняет ложный ~200-day dead period входных поставок.

## 7. Mode 18 — Temporary A Metal Supply Shock

Acceptance experiment r1.1 показывает ожидаемую причинную цепь:

```text
A mining capacity 70 → 35
→ A Ore Inventory 2460 → ~117
→ A Smelting ~39 → ~25
→ A→B Metal shipment ~17 → ~5
→ B Metal price ~40 → ~57
→ B Electronics Unit Cost ~17.47 → ~21.77
→ B Electronics Production ~16.59 → ~7.91
```

К day 1080:

- A Market Price = `33.731`;
- B Electronics Production Rate = `15.134`;
- A Metal Input Fulfillment = `0.96660`.

Это подтверждает и shock propagation, и recovery.

### Calibration 18.9

До шока supplied Mode 17 series показывает peak `A Refinery Expansion` около `0.11129/day`. Требование `≤ 1.5 × pre-shock max` даёт:

```text
1.5 * 0.11129 = 0.166935
```

В validation r2 используется executable ceiling:

```text
max A Refinery Expansion [360,720] <= 0.167
```

Это не тавтология: он запрещает крупное строительство refinery в ответ на supply-side mining shock.

## 8. Mode 19 — Sustained Electronics Growth with Input Coupling

### Mode 14 vs Mode 19

| Day | Series | Mode 14 accepted | Mode 19 coupled r1.1 experiment |
|---:|---|---:|---:|
| 720 | A Electronics Production Rate | 31.517 | 32.695 |
| 720 | A Energy Unserved Demand | 169.84 | 256.38 |
| 720 | A Refinery Installed Capacity | 52.358 | 59.679 |
| 1080 | A Electronics Production Rate | 35.470 | 37.137 |
| 1080 | A Energy Unserved Demand | 120.24 | 163.79 |
| 1080 | A Refinery Installed Capacity | 52.999 | 64.017 |

Связь Metal→Electronics добавляет реальный upstream demand. Поэтому при сходном/немного более высоком выпуске Electronics refinery build-out больше, а переходный energy deficit выше: Energy обслуживает не только Electronics, но и выросшую Metal chain.

### Calibration 19.x

Supplied experiment:

```text
A Metal Input Demand @359.75 = 4.8692
A Metal Input Demand @1080   = 9.4992
A Fulfillment @1080          = 0.96237
A Refinery Installed @359.75 = 54.008
A Refinery Installed @1080   = 64.017
```

Validation r2:

- 19.1 lower bound = `7.303` (`≈ 1.5 × 4.8692`);
- 19.2 first event threshold = `5.843` (`≈ 1.2 × 4.8692`);
- 19.4 installed ceiling = `162.1` (`≈ 3 × 54.008`).

Для 19.3 текущий validation DSL не умеет непосредственно выразить `last >= runtime_min + 0.05`. Поэтому r2 переводит supplied calibrated expectation в две абсолютные проверки на том же окне:

```text
min fulfillment <= 0.912
last fulfillment >= 0.962
```

Вместе они кодируют требуемый recovery span не менее `0.05`; существующая проверка `min < 1` также сохранена. Если acceptance run покажет, что supplied experiment имел иной точный minimum, менять механику под этот порог не следует — нужно скорректировать только representation проверки по фактическому числу, сохраняя семантику `last >= min + 0.05`.

## 9. Mode 20 — Coupled Metal Demand Growth

### Mode 16 vs Mode 20 @1080

| Величина | Mode 16 accepted | Mode 20 coupled r1.1 experiment |
|---|---:|---:|
| B Refinery Installed Capacity | 15.295 | 24.836 |
| B Energy Unserved Demand | 0.000 | 0.000 |
| B Electronics Production Rate | 39.810 | 13.681 |
| B Electronics Metal Input Fulfillment | n/a | 0.97877 |

Удвоение final Metal demand в B увеличивает требуемую Metal chain и refinery capacity. Electronics конкурирует за тот же physical inventory не через приоритет, а через тот же availability factor, поэтому её output снижается в переходе вместе с повышением Metal price/cost.

Validation r2:

- 20.1 — exact identity `B Electronics Metal Input Fulfillment - B Metal Input Final Fulfillment = 0`, tol `1e-6`, [360,1080];
- 20.2 — intermediate fulfillment должен быть rationed (`min < 1`);
- 20.3 — B refinery expansion существует;
- 20.4 — fulfillment @1080 `>= 0.95` (experiment `0.97877`).

## 10. Policy r2

Policy r2 основан на supplied `change-policy-v7.4-intermediate-inputs-draft-r1.1.json`.

Нового allow-rule для diagnostic final fulfillment не требуется: имена

```text
A Metal Input Final Fulfillment
B Metal Input Final Fulfillment
```

уже попадают в разрешённый helper namespace `* Metal Input *`; LINK/series events также покрыты существующими wildcard rules.

Policy связан с SHA поставляемого `validation-v7.4.json`.

## 11. Expected external result

По supplied feedback экспериментальный вариант с обязательными r1.1 model fixes уже считал Modes 17–20 без circular loop и прошёл supplied fixed checks.

Для поставляемого r2 ожидается:

```text
APPLY_PATCH                 OK
LIFECYCLE_CONFORMANCE       PASS
STRUCTURE_AUDIT             PASS
RUN_LAB Modes 0–20          PASS
Modes 0–16 existing output  changed=0, maxAbs=0
CHECK_CANDIDATE policy      PASS
Unexpected                  0
Forbidden                   0
Required missing            0
Hard blockers               0
```

Дополнительные r2 diagnostics (`Planet *`, `X Metal Input Final Fulfillment`) не имеют обратных связей в экономику и не должны менять dynamics.

## 12. Known limitations / watch items

1. Mode 17 A energy scarcity остаётся ненулевым к day 1080 из-за уже принятого v7.3 power-planning lag; критерий требует снижения, не нуля.
2. Physical fulfillment channel по построению мягкий (`Inventory/(Inventory+Buffer)`), поэтому основная передача дефицита часто идёт через Metal price → Electronics cost.
3. Test 19.3 приходится представлять двумя абсолютными metric checks, потому что текущий declarative validation DSL не имеет операции `last - min(window)`. Семантика исходного требования сохранена через calibrated 0.05 separation.
4. `Metal per Electronics = 0.25` сознательно меняет specialization; это цель связи, а не регрессия.
5. r2 runtime всё ещё должен быть подтверждён принимающей стороной; данный отчёт не выдаёт supplied experiment за прогон именно поставляемого r2.

## 13. Verdict r2

**READY FOR ACCEPTANCE RUN.**

r2 исправляет оба выявленных model defects r1 (same-step loop и inherited feedstock units), переносит Mode 18 на экономически binding source A, добавляет revised going-concern diagnostics и завершает исполняемые calibration checks 18.9 / 19.x / 20.x.
