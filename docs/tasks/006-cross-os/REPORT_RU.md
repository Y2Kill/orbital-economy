# Отчёт исполнителя — задача 006

## 1. Что сделано

Диагностика выполнена в ветке `task/006-cross-os`, исходная точка — `main@7f130590d409321531f91525ee1ce0e48ba5c6ad`. Модель, validation, policy, `simulation@9.0.0`, `lab/vendor/`, `tools/`, `.github/workflows/ci.yml`, `.github/workflows/bench-full.yml` и SHA256SUMS не менялись.

Lab поднят до **v0.9.4** только диагностически:

- добавлена команда `node src/cli.js series`;
- для каждого Mode хешируются временная ось и каждый ряд как точные little-endian Float64 bytes;
- формируется deterministic per-Mode digest;
- `--dump=MODE` сохраняет полные IEEE-754 hex значения;
- `--plan=...` позволяет повторно выгрузить только ряды с различными digest;
- QA содержит фиксированный эталон SHA-256 для `[0, -0, 1, Math.PI]`, поэтому изменение endian/encoding превращает тест в FAIL.

Главный полный cross-OS запуск:  
https://github.com/Y2Kill/orbital-economy/actions/runs/36163542292

Он выполнил все 27 Modes на Ubuntu и Windows, по 1004 ряда × 4321 точки в каждом Mode. После digest-сравнения workflow повторно выгрузил только различающиеся ряды и нашёл первый различающийся шаг.

Дополнительные диагностические запуски:

- ранний Mode 0 probe: https://github.com/Y2Kill/orbital-economy/actions/runs/36165182295
- трассировка native `Math.pow`: https://github.com/Y2Kill/orbital-economy/actions/runs/36168123111
- привязка первого divergent `pow` к primitive: https://github.com/Y2Kill/orbital-economy/actions/runs/36168514057
- привязка первого **распространяющегося** divergent `pow`: https://github.com/Y2Kill/orbital-economy/actions/runs/36168839562
- минимальный standalone repro: https://github.com/Y2Kill/orbital-economy/actions/runs/36169126235
- CI на голове standalone-repro: https://github.com/Y2Kill/orbital-economy/actions/runs/36169126297 — **success**

Финальная версия `.github/workflows/cross-os.yml` оставлена только с `workflow_dispatch`, входами `ref` и `modes`, pinned official actions, `contents: read`, timeout у каждого job и без node_modules cache.

CI после финального cleanup workflow/report: https://github.com/Y2Kill/orbital-economy/actions/runs/36169783631 — **success** (guard, tools-selftest, bench-selftests).

## 2. Карта расхождений

Результат полного побитового сравнения оказался сильнее исходной таблицы из задания: **полностью bit-identical Modes нет — хотя бы один из 1004 рядов отличается во всех Modes 0–26**.

Это не противоречит находке задачи 005: там сравнивались только значения, которые печатали validation-проверки. Для Modes 0–16 эти выбранные значения совпадали, но остальные ряды никто побитово не сравнивал.

| Modes | Первый различающийся ряд | step | time hex | Ubuntu | Windows |
|---|---|---:|---|---|---|
| 0–11 | `A Desired Generation` | 90 | `4036800000000000` | `409123b289e75c8a` | `409123b289e75cb6` |
| 12–16 | `B Electronics Local Demand` | 89 | `4036400000000000` | `4031e57432d41ad8` | `4031e57432d41af4` |
| 17–20 | `A Electronics Domestic Supply Down Gap` | 263 | `4050700000000000` | `3fd05edf0d2d8707` | `3fd05edf0d2d86bf` |
| 21–23 | `A Desired Capital Goods Production` | 224 | `404c000000000000` | `4001f9f7f1de656e` | `4001f9f7f1de6584` |
| 24 | `A Domestic Supply Signal Increase` | 209 | `404a200000000000` | `3fa78295fbc89a69` | `3fa78295fbc89b32` |
| 25–26 | `A Capital Goods Demand` | 141 | `4041a00000000000` | `4000a4bfe5e303d7` | `4000a4bfe5e303ee` |

Самое раннее наблюдаемое расхождение: **Mode 0, step 90, `A Desired Generation`**.

Важно: этот ряд — первый наблюдаемый расходящийся endpoint, но не первичная операция. Его формула — простой выбор/min между requested energy и generation capacity. Диагностика показала, что platform-dependent rounding появляется раньше, внутри промежуточных RK4 evaluations.

## 3. Первопричина и минимальное воспроизведение

### 3.1 Что делает simulation 9.0.0

В `simulation@9.0.0` оператор формулы `^` проходит через `power()` → `fn.expt(x, y)` → native JavaScript `Math.pow(x, y)`.

Модель использует 198 выражений с `^`. Решатель — RK4, поэтому формулы вычисляются не только в сохранённых endpoint-точках, но и на промежуточных стадиях RK4.

### 3.2 Первый divergent native вызов

Трассировка каждого `Math.pow(base, exponent)` в Mode 0 нашла первый вызов, где **аргументы побитово одинаковы**, а результат различается:

```text
call = 1014
base     = 0x3fd14a3f0de070ad
exponent = 0x4020000000000000  (= 8)

Ubuntu  = 0x3efdc0aad03ca92c
Windows = 0x3efdc0aad03ca92b
```

Он выполняется в primitive **`B Mining Rate`**:

```text
[B Positive Desired Mining Rate]
/
(1 + ([B Positive Desired Mining Rate] /
([B Effective Mining Capacity] + 0.001)) ^ 8) ^ 0.125
```

Разница — 1 ULP. Однако следующий `pow` в этой конкретной цепочке снова округляется в одинаковый результат, поэтому это первый platform-dependent вызов, но ещё не начало устойчивого divergence.

### 3.3 Первый найденный divergent вызов, который входит в распространяющуюся цепочку

Позже в том же Mode 0 трасса на call **35029** снова получает одинаковые exact-bit аргументы:

```text
base     = 0x401368263c9d9065
exponent = 0x3fc0000000000000  (= 0.125)

Ubuntu  = 0x3ff37df4ef6ab79e
Windows = 0x3ff37df4ef6ab79d
```

Этот вызов находится в primitive **`A Pre Energy Smelting Rate`**, вызываемом из `A Smelting Rate`:

```text
[A Positive Desired Smelting Rate]
/
(1 + ([A Positive Desired Smelting Rate] /
([A Refinery Active Capacity] + 0.001)) ^ 8) ^ 0.125
*
[A Ore Inventory] / ([A Ore Inventory] + [A Ore Buffer])
```

После него в той же RK4-ветви появляются уже разные **аргументы** последующих `Math.pow` (например, к call 35038). То есть 1-ULP расхождение уже вошло в вычисляемое состояние и далее распространяется нелинейной обратной связью.

Цепочка причины:

```text
same ModelJSON + simulation@9.0.0 + Node 24.11.1
        ↓
A Pre Energy Smelting Rate, intermediate RK4 evaluation
        ↓
Math.pow(0x401368263c9d9065, 0.125)
        ↓
Ubuntu ...b79e / Windows ...b79d   (1 ULP)
        ↓
A Smelting Rate / dependent feedback
        ↓
different later RK4 arguments
        ↓
first saved Mode-0 endpoint difference:
A Desired Generation, step 90
```

### 3.4 Standalone repro

`docs/tasks/006-cross-os/repro/repro.mjs` не загружает модель, Lab или simulation. Он делает только один `Math.pow` на двух Float64, восстановленных из exact hex.

Run: https://github.com/Y2Kill/orbital-economy/actions/runs/36169126235

Одинаковые входы:

```text
base     0x401368263c9d9065
exponent 0x3fc0000000000000
Node     v24.11.1
CPU      AMD EPYC 7763 64-Core Processor
```

Ubuntu:

```text
result = 0x3ff37df4ef6ab79e
```

Windows Server 2025:

```text
result = 0x3ff37df4ef6ab79d
```

Таким образом C5 сведен до одной native математической операции с конкретными аргументами.

## 4. Что с утверждением «Modes 0–16 не задеты»

При полном побитовом сравнении это утверждение **не подтверждается**.

Оно было корректным только для более узкой формулировки находки 005: выбранные validation-значения Modes 0–16 совпали на Linux и Windows. Полные ряды тогда не сравнивались.

В Mode 0 уже выполняются saturation-формулы вида:

```text
x / (1 + (x / capacity)^8)^0.125
```

и именно в них найден platform-dependent `Math.pow`. Поэтому нет условия, которое «включается с Mode 17». Операция активна уже в Mode 0.

Почему исходная таблица визуально показывала границу 17+:

- validation наблюдает только небольшое подмножество 1004 рядов;
- ранние 1-ULP ошибки часто гасятся последующим округлением или остаются в ненаблюдаемой части графа;
- новые механики Modes 17+ дают другие feedback-paths и чувствительность, поэтому ошибка чаще доходит до проверяемых значений;
- Mode 19 усиливает её сильнее остальных, поэтому к позднему времени отклонение уже макроскопическое.

Следовательно, «Mode 17 включает проблемную операцию» — неверная гипотеза. Mode 17 меняет **усиление/маршрут распространения**, а не наличие самой операции.

## 5. ОС или процессор

Standalone run дал редкий хороший контроль: оба GitHub runner сообщили **одну и ту же модель CPU**:

```text
AMD EPYC 7763 64-Core Processor
Node v24.11.1
```

При этом:

- Ubuntu runner: Linux, kernel `6.17.0-1022-azure`;
- Windows runner: Windows Server 2025 Datacenter, `10.0.26100`;
- exact input Float64 одинаковы;
- `Math.pow` возвращает соседние Float64.

Поэтому объяснение «это просто разные модели процессора» для данного repro исключается. Наблюдаемое различие находится в **OS-specific Node/V8/native math execution stack** (разные платформенные сборки/runtime path), при одинаковом Node version и CPU model.

Что этим ещё не доказано: мы не контролируем host/microcode/hypervisor и не можем разделить внутри platform stack конкретно V8 platform implementation от системной math/runtime части только двумя hosted runner.

### Третья точка — ваш Windows-ПК

На Node 24.11.1 из корня checkout выполнить:

```cmd
node docs\tasks\006-cross-os\repro\repro.mjs
node -e "const os=require('os'); console.log(JSON.stringify({platform:os.platform(),release:os.release(),version:os.version(),arch:os.arch(),cpu:os.cpus()[0]?.model,node:process.version},null,2))"
```

Если обычный Windows-ПК также даст `0x3ff37df4ef6ab79d`, это будет сильным подтверждением, что эффект относится к Windows build/path Node/V8 в целом, а не к GitHub-hosted image.

Для C3 полного стенда дополнительно:

```cmd
cd lab
node --expose-gc src/cli.js series --modes=all --out=output\cross-os-owner
```

и сравнить `series-digest.json` с артефактами run `36163542292`.

## 6. Рекомендации — ничего не внедрялось

**A. Зафиксировать canonical platform для bit-exact golden.**  
Например, Windows + Node 24.11.1 или Linux + Node 24.11.1.

Плюсы: минимальное изменение процесса, настоящий byte-exact regression на одной платформе.  
Минусы: результаты другой ОС нельзя считать обязанными быть бит-в-бит равными.

**B. Отдельной задачей заменить platform-dependent math в критическом пути на детерминированную реализацию.**  
Это может быть изменение движка либо математическая переформулировка модели, но только после отдельного исследования и нового golden validation.

Плюсы: потенциально единый cross-platform bitstream.  
Минусы: это уже изменение численного поведения и должно пройти полноценную переприёмку всех 27 Modes; нельзя делать скрыто внутри стенда.

**C. Для cross-platform scientific validation использовать явно заданные численные допуски, оставляя bit-exact gate только на canonical platform.**

Плюсы: соответствует природе floating-point/libm различий.  
Минусы: tolerance не даёт byte reproducibility и должен быть обоснован отдельно для каждого класса проверки.

Не рекомендую «чинить» это округлением рядов в Lab или comparator: это только скроет источник расхождения и ослабит regression gate.

## 7. Что не удалось / замечания к заданию

1. Исходная гипотеза задачи о том, что Modes 0–16 «не задеты», оказалась следствием неполного наблюдения в задаче 005. Побитовое сравнение всех рядов показывает divergence уже в Mode 0.
2. Первый найденный divergent `Math.pow` (call 1014, `B Mining Rate`) оказался локальным: следующий `pow` снова совпал. Поэтому для причинной цепочки понадобилось найти следующий same-input divergent call 35029, после которого различие уже попало в последующие аргументы RK4.
3. Один диагностический push с маркером `[pow-probe]` по ошибке также запустил уже существующий full-series job: временный bootstrap condition ещё не исключал новый marker. Полезные pow-trace jobs завершились; лишний общий run затем был отменён concurrency следующим push. Финальный workflow полностью очищен от push/bootstrap логики и является только `workflow_dispatch`.
4. Третья точка C3 на вашем Windows-ПК исполнителем не выполнялась; выше приведены точные команды.
5. Отдельный полный Windows self-test/RUN_LAB в этой задаче повторно не запускался ради экономии Windows-минут. Модель/validation/engine не менялись; обычный Linux CI на каждом доставленном состоянии оставался зелёным, а cross-OS full-series прогон успешно просимулировал все 27 Modes. Финальную Windows-проверку C6 оставляю owner-side, как указано в таблице приёмки.
