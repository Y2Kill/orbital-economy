# Orbital Economy v7.4 Intermediate Inputs — candidate r1 report

Дата: 2026-09-21  
База: accepted v7.3 r2  
Base SHA-256: `57a2a102f2b632c69c37cc00c4cd11182ca2601d2af9395560228b5fdde0f44d`  
Поставка: `model-patch.json` + `validation-v7.4.json` + `change-policy-v7.4-intermediate-inputs-r1.json`.

## 1. Integrity / границы изменения

Candidate r1 сделан как `orbital-economy-model-patch-v1`; полная модель не поставляется.

Патч содержит:

- 20 новых элементов;
- 17 замен формул существующих элементов — только из разрешённого списка specification §4;
- 69 новых LINK;
- добавление `Intermediate Inputs Enabled = 0` во все Modes 0–16;
- 4 новых сценария Modes 17–20.

Удалений, переименований, изменений типов, изменений `from`/`to` существующих FLOW и изменений simulation settings нет.

Перед поставкой выполнена локальная статическая самопроверка без запуска simulation engine:

- patch-schema: PASS;
- детерминированное применение patch к accepted JSON: PASS;
- все ссылки `[X]` разрешаются в существующий/добавленный primitive: PASS;
- для каждой формульной ссылки присутствует LINK: PASS;
- duplicate LINK: 0;
- endpoints новых FLOW указывают на STOCK: PASS;
- Modes после применения: ровно 0–20, без дублей;
- Modes 0–16 получают `Intermediate Inputs Enabled = 0`;
- Modes 17–20 получают `Capital Lifecycle Enabled = 1`, `Intermediate Inputs Enabled = 1`;
- набор изменённых существующих элементов совпадает с разрешённым specification §4.

Runtime-результаты намеренно отсутствуют: по `TASK_V7_4_RU.md` стенд запускает принимающая сторона.

## 2. Реализованная архитектура

### 2.1 Переключатель

Добавлен `Intermediate Inputs Enabled`, raw/default = 1.

Каждая изменённая существующая формула обёрнута внешним:

```text
IfThenElse([Intermediate Inputs Enabled] = 1, <v7.4 branch>, <дословная v7.3 branch>)
```

Поэтому Modes 0–16 должны проходить в дословную старую ветку. Новые FLOW `X Electronics Metal Input Delivery` при switch=0 равны 0. `X Electronics Metal Input Fulfillment` при switch=0 принудительно равен 1.

### 2.2 Metal → Electronics

Для A и B зеркально добавлены пять обязательных observable quantities:

```text
Electronics Feedstock Consumption Rate
        ↓
Electronics Metal Input Target Inventory
        ↓
Electronics Metal Input Demand
        ↓
Metal Available for Intermediate Use
        ↓
Electronics Metal Input Delivery
        ↓
Electronics Feedstock Inventory
        ↓
существующий production soft-limit
```

`X Metal Available for Intermediate Use` использует тот же availability factor, что `X Local Sales`:

```text
X Metal Inventory / (X Metal Inventory + X Metal Buffer)
```

Поэтому при положительном intermediate demand его fulfillment имеет ту же долю физической доступности металла, что и final local demand.

`X Electronics Metal Input Delivery` — внутренний FLOW:

```text
X Metal Inventory → X Electronics Feedstock Inventory
```

Экзогенный `Electronics Feedstock Extraction Rate` при включённой v7.4 связи равен 0.

### 2.3 Производственный и стоимостной каналы

В coupled branch:

- `Electronics Feedstock Consumption Rate = Electronics Production Rate × Metal per Electronics`;
- `Electronics Feedstock Price = X Market Price`;
- входная часть `Electronics Unit Cost = Metal per Electronics × Feedstock Price`;
- `Electronics Feedstock Target Inventory` становится равным новому Metal input target;
- существующий production factor `Feedstock Inventory / (Feedstock Inventory + Buffer)` не переписан.

Опциональный `X Electronics Feedstock Buffer` из specification §4 **масштабирован в Metal units**:

```text
coupled: [Metal per Electronics] * 40
legacy:  40
```

При `Metal per Electronics = 0.25` coupled buffer равен 10 Metal units. Это сохраняет смысл soft-buffer при смене единиц физического входа; оставить legacy `40` означало бы в coupled branch фактически увеличить этот буфер в четыре раза относительно количества входа на единицу Electronics.

### 2.4 Обратная связь на Metal

В coupled branch:

```text
X Desired Smelting Rate = legacy expression + X Electronics Metal Input Delivery
```

То есть фактически переданный в Electronics металл становится частью текущего спроса, на который реагирует существующая цепочка smelting → refinery capacity → energy.

Ни Refinery kernel, ни Transport, ни Power kernel/policy не изменены.

## 3. Калибровка `Metal per Electronics`

Для r1 выбрано значение:

```text
Metal per Electronics = 0.25
```

Это стартовое значение из утверждённой specification, а не попытка воспроизвести Mode 12.

Экономический смысл: при buyer-facing цене Metal около 40 входная металлическая часть себестоимости Electronics составляет около 10 на единицу. Это существенно отличается от legacy feedstock cost:

- A: legacy contribution около 18;
- B: legacy contribution около 3.

Следовательно, r1 должен действительно изменить сравнительные преимущества: историческое преимущество B по дешёвому Electronics feedstock ослабляется, а A получает более дешёвый вход относительно своего legacy feedstock. Направление и величина изменения Electronics trade должны быть подтверждены внешним прогоном; численно подгонять коэффициент к Mode 12 не предполагалось.

Остальные стартовые параметры оставлены ровно предложенными specification:

```text
Metal Input Target Days     = 20
Metal Input Adjustment Time = 20 days
```

## 4. Regression gate — Modes 0–16

Ожидание r1:

```text
all existing 827 series: changed = 0
maxAbs = 0
```

Основание — все 17 изменённых существующих formulas имеют switch wrapper с дословной v7.3 веткой, а Modes 0–16 явно устанавливают switch=0.

Новые серии разрешены policy и не должны изменять старые ряды.

Если `CHECK_CANDIDATE` обнаружит ненулевой diff старой серии, это считается defect r1, а не допустимым численным отклонением.

## 5. HARD checks

`validation-v7.4.json` оставляет все проверки v7.3.2 и supplied v7.4 HARD checks без ослабления:

- fulfillment ∈ [0,1];
- delivery ≤ demand;
- delivery ≤ available;
- delivery/demand неотрицательны;
- Metal / Electronics Feedstock / Electronics inventories неотрицательны;
- существующие energy, lifecycle и transport plugins;
- switch-off checks для Modes 0–16.

Пороги `[calib]` первой итерации оставлены в `calib_todo` в соответствии с TASK §3. Они должны быть превращены в исполняемые checks после получения первого пакета RUN_LAB-отчётов.

## 6. Mode 17 — Intermediate Inputs Baseline

Ожидаемая причинная цепочка:

```text
Electronics production
→ Metal consumption
→ Metal input demand
→ Metal delivery
→ Electronics-owned input buffer
→ production physical limit
```

параллельно:

```text
Metal Market Price
→ Electronics Feedstock Price
→ Electronics Unit Cost
→ offer / market / trade response
```

Ожидается going concern и отсутствие late unserved energy согласно test plan.

### Watch item r1

Accepted v7.3 имеет `A/B Electronics Feedstock Inventory` initial = 1200, тогда как coupled target теперь задаётся как `consumption × 20 days`. Initial stocks по specification менять запрещено, поэтому r1 их не меняет.

Следствие, которое нужно отдельно посмотреть в первом RUN_LAB: если inherited 1200 заметно превышает coupled target, выражение

```text
Max(0, consumption + (target - inventory) / 20)
```

может временно дать нулевой Metal input demand, особенно в A. Тогда fixed test 17.2 (`Delivery > 0` начиная с day 30) может не пройти, хотя wiring физически корректен. Я не исправлял это скрытым изменением initial stock или неутверждённой формулой. Если это проявится, r2 следует калибровать на фактических числах/либо отдельно согласовать coupled initial-buffer policy.

## 7. Mode 18 — Temporary Metal Supply Shock

Добавлено:

```text
Test 18 Metal Supply Shock Active
v7.4 Metal Supply Shock Multiplier = 0.5
```

В coupled branch `B Effective Mining Capacity` получает внешнюю ветвь Mode 18; legacy formula внутри сохранена дословно.

Ожидаем:

```text
B mining ↓
→ B Metal Inventory / availability ↓
→ B Electronics Metal Input Fulfillment ↓
→ B Electronics physical output ↓

и одновременно

B Metal Market Price ↑
→ B Electronics Unit Cost ↑
```

После day 720 expected recovery проверяется test plan.

## 8. Mode 19 — Sustained Electronics Growth with Input Coupling

Добавлено sustained A demand ×4 с day 360 через отдельный Test 19 trigger.

Ожидаемая цепочка:

```text
A Electronics demand ↑
→ Electronics production / Metal input demand ↑
→ A Metal delivery and Desired Smelting Rate ↑
→ refinery pressure / expansion
→ industrial energy demand ↑
→ Power Generation Expansion
```

Числа Mode 14 vs Mode 19 заполняются после внешнего прогона.

## 9. Mode 20 — Coupled Metal Demand Growth

Добавлено sustained B final Metal demand ×2 с day 360.

Intermediate и final local demand используют один Metal availability factor. Поэтому при положительных demand ожидается:

```text
B Electronics Metal Input Fulfillment
≈ B Local Sales / B Local Demand
```

до tolerance test plan. В r1 отдельный helper-series для этого ratio не добавлялся: supplied validation draft оставляет автоматизацию 20.1 в `calib_todo`, чтобы не расширять модель необязательным элементом до первого run.

## 10. Policy

`change-policy-v7.4-intermediate-inputs-r1.json` получен из supplied draft без дополнительных allow rules.

Policy привязана к:

```text
accepted model SHA:
57a2a102f2b632c69c37cc00c4cd11182ca2601d2af9395560228b5fdde0f44d

validation SHA:
c0c4e5a2f19ad524161fc00051542d3e7814d7f617b3e993a3bc3811bb6b954c

simulation: 9.0.0
```

`default_action = deny`; explicit regression guard Modes 0–16 сохранён.

## 11. Что требуется от первого внешнего прогона

Для r2 нужны Markdown-отчёты, перечисленные TASK:

- APPLY_PATCH log;
- `lifecycle-conformance.md`;
- `structure-audit.md`;
- `report.md` Modes 0–20;
- `model-comparison.md`;
- `change-policy.md`.

Особенно нужны фактические числа для:

- Mode 12 vs 17 production / prices / trade / unserved energy;
- момента появления Metal Input Delivery в Mode 17;
- pre-shock day 359.75 для Mode 18;
- Mode 18 cost increase и recovery;
- Mode 19 pre-shock demand, fulfillment minimum/recovery, refinery/power event times;
- Mode 20 fulfillment @1080 и final/intermediate fulfillment identity.

## 12. Verdict r1

**READY FOR EXTERNAL TEST, not acceptance.**

Candidate r1 реализует утверждённую v7.4 wiring без изменений вне разрешённого scope. Главный ожидаемый calibration risk первой итерации — inherited Feedstock Inventory = 1200 против нового 20-day target. Его следует решать только после фактического отчёта стенда, а не скрытой корректировкой модели.
