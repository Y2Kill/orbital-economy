# Orbital Economy v7.5 Capital Goods candidate r1 — CANDIDATE REPORT

Дата: 2026-09-21  
Baseline: accepted **v7.4.1 r1**  
Base SHA-256: `07ce33e004597ef485e47e3a95026b584197824468382e28daa80950a45fb08e`  
Validation SHA-256: `4a90912d918f8cd891fb63ec6677e4f7a56f996b0c322891fc1a08d6e8cf9cdc`

## 1. Что реализовано

Реализована спецификация `V7_5_ARCHITECTURE_SPEC.md` для **Capital Goods / kernel-v2**.

В каждой колонии A/B добавлен локальный сектор Capital Goods:

- запас оборудования;
- спрос оборудования от желаемого расширения Refinery / Electronics / Power;
- целевой запас и first-order планирование выпуска;
- soft capacity cap;
- физическое потребление Metal и Electronics;
- общий `Capital Goods Fulfillment`;
- физическое потребление оборудования каждым из трёх расширяющихся секторов.

Transport не изменён и остаётся единственным внешним источником капитала до v7.5.1.

## 2. Защита regression Modes 0–20

Во все существующие Modes 0–20 добавлено только:

`Capital Goods Enabled = 0`

Шесть существующих expansion-flow обёрнуты строго по схеме:

`IfThenElse([Capital Goods Enabled] = 1, Desired Expansion * Capital Goods Fulfillment, <accepted formula verbatim>)`

`X <Sector> Desired Expansion` содержит **дословную accepted v7.4.1 формулу** соответствующего expansion-flow.

Test 23 добавлен только в coupled-ветвь `A/B Effective Electronics Local Base Demand`; при Modes 0–20 `Test 23 Investment Boom Active = 0`.

Следовательно ожидаемый regression gate: **21 × changed=0, maxAbs=0** по всем прежним 852 рядам.

## 3. Новые внешние параметры

| Параметр | Значение r1 | Статус |
|---|---:|---|
| `Metal per Capital Goods Unit` | 1 | [calib] |
| `Electronics per Capital Goods Unit` | 0.5 | [calib] |
| `Capital Goods Target Days` | 30 d | [calib] |
| `Capital Goods Adjustment Time` | 20 d | [calib] |
| `Capital Goods Buffer` | **0.5** | фиксировано spec/skeleton |
| `A/B Capital Goods Inventory` initial | 30 / 30 | [calib] |
| `A/B Capital Goods Base Production Capacity` | 2 / 1 | [calib] |
| `A/B Refinery Capital Goods per Capacity` | 17 / 17 | [calib] |
| `A/B Electronics Capital Goods per Capacity` | 11.5 / 11.5 | [calib] |
| `A/B Power Capital Goods per Capacity` | 0.5 / 0.5 | [calib] |
| `v7.5 Capital Goods Shock Multiplier` | 0.3 | test-only |
| `v7.5 Investment Boom Multiplier` | 4 | test-only |

Полный набор аннотаций находится в `PARAMETER_ANNOTATIONS_fragment.json`. Для агрегатной единицы оборудования физически обоснованных коэффициентов пока нет; все коэффициенты материалоёмкости и капиталоёмкости явно помечены как калибровочные.

## 4. Kernel-v2

В validation шесть колониальных lifecycle-экземпляров переведены на `kernel_version: 2`:

- A/B Refinery;
- A/B Electronics;
- A/B Power.

Добавлены роли:

- `desired_expansion`;
- `capital_goods_consumption`.

Transport остаётся kernel-v1.

Для Electronics и Power поток `Capital Goods Consumption` дополнительно содержит множитель `[Capital Lifecycle Enabled]`. Это **математически избыточно**, потому что их `Desired Expansion` и сам Expansion уже gated тем же switch, но необходимо для существующего lifecycle-conformance contract: у `switch_gated=true` каждый kernel FLOW должен непосредственно ссылаться на legacy switch. Численно identity `Consumption = Expansion × coefficient` сохраняется.

## 5. Материальные transformation pairs

Validation содержит пары:

- `Refinery Expansion` ↔ `Refinery Capital Goods Consumption`;
- `Electronics Factory Expansion` ↔ `Electronics Capital Goods Consumption`;
- `Power Generation Expansion` ↔ `Power Capital Goods Consumption`;
- `Capital Goods Production` ↔ `Capital Goods Metal Consumption` + `Capital Goods Electronics Consumption`.

Коэффициенты HARD identity приведены к параметрам r1:

- Refinery: **17**;
- Electronics: **11.5**;
- Power: **0.5**;
- Metal input: **1**;
- Electronics input: **0.5**.

## 6. Test wiring

### Mode 21 — v7.5 Capital Goods Baseline

Все три switches = 1. Ожидается going concern относительно Mode 17:

- Capital Goods Production > 0 после warm-up;
- fulfillment ≥ 0.9, целевой уровень около/выше 0.95;
- Planet Electronics Production и Planet Smelting @1080 в пределах ±15 % Mode 17;
- A Refinery / Power Installed @1080 не ниже примерно 90 % Mode 17.

### Mode 22 — v7.5 Capital Goods Supply Shock

`Test 22 Capital Goods Supply Shock Active` использует `Temporary Test Window` 360–720.

Applicability:

| Colony | Test 22 Applies |
|---|---:|
| A | 1 |
| B | 0 |

A production capacity получает ×0.3, B — точный нейтральный ×1.

Ожидание: A fulfillment <0.7 в окне, строительство A замедляется, после 720 восстанавливается; B существенно не затрагивается.

Добавлены зеркальные диагностические ряды `A/B Refinery Capital Goods Expansion Ratio = Expansion / Max(Desired Expansion, 1e-9)`. Они предназначены для калибровки проверки 22.2 во второй итерации и не участвуют в экономической динамике.

### Mode 23 — v7.5 Investment Boom

`Test 23 Investment Boom Active` использует sustained `Reverse Advantage Window` с дня 360.

Applicability:

| Colony | Test 23 Electronics Demand Applies |
|---|---:|
| A | 1 |
| B | 0 |

В coupled-ветвь обеих `X Effective Electronics Local Base Demand` первым тестом перед Mode 19 добавлена одна и та же зеркальная ветвь. В A она даёт ×4, в B — ×1.

Ожидание: рост спроса A повышает `Capital Goods Demand`, общий запас оборудования становится конкурентным ограничителем Refinery / Electronics / Power, а общий fulfillment пропорционально нормирует их expansion.

## 7. Статическая самопроверка r1

Без запуска simulation-стенда выполнено:

```text
patch schema / deterministic apply                 PASS
candidate scenarios                                Modes 0–23
formula references unresolved                      0
formula references without LINK                    0
duplicate LINK                                     0

LIFECYCLE_CONFORMANCE (static):
  PASS
  instances                                        7
  kernel-v2                                        6
  NON_CONFORMING                                   0

STRUCTURE_AUDIT:
  PASS
  open boundary flows                              102
  unclassified                                     0
  transformation pairs                             12
  unpaired                                         0
  closed-world violations                          1
  remaining violation                              Transport Capacity Expansion

COLONY_SYMMETRY:
  mismatches                                       0
  exceptions                                       0
```

Полный `RUN_LAB` и `CHECK_CANDIDATE` **не запускались** — по контракту task 003 это делает владелец проекта и возвращает отчёты для следующей итерации.

## 8. Validation / policy

`validation-v7.5.json` — предоставленный draft без ослабления HARD-проверок, с заменой только шести placeholder-коэффициентов capital-transformation identities на 17 / 11.5 / 0.5.

`calib_todo` Modes 21–23 намеренно сохранены в r1 согласно заданию: количественные EXPECTATION-пороги уточняются после первого реального прогона.

`change-policy-v7.5-capital-goods-r1.json` — предоставленный draft; изменён только `validation_sha256`.

## 9. Известные ограничения

- Transport пока создаёт капитал извне — целевой residual closed-world violation = 1; закрытие в v7.5.1.
- Capital Goods не торгуются между A/B.
- Производство Capital Goods пока не потребляет энергию.
- Production Capacity сектора Capital Goods пока внешняя константа, без собственного capital lifecycle.
- Финансовая `Capital Cost per Capacity` и физическое потребление оборудования пока не сведены в единую денежно-физическую цену.
- Потребление металла/электроники оборудованием **не** добавлено напрямую в `Desired Smelting Rate` / `Desired Electronics Production Rate`, чтобы не замкнуть алгебраическую петлю; отрасли реагируют на отбор через inventory correction с существующим лагом.
- Стартовые capital-intensity / production-capacity / initial-inventory параметры являются калибровочными и должны оцениваться после Modes 21–23.

## 10. Что требуется от первого приёмочного прогона

Ожидаемый технический gate:

```text
APPLY_PATCH                 OK
LIFECYCLE_CONFORMANCE       PASS; 6 kernel-v2 + Transport v1
STRUCTURE_AUDIT             PASS
                            unclassified=0
                            unpaired=0
                            closed-world violations=1
                            colony symmetry mismatches=0
RUN_LAB                     OVERALL PASS, Modes 0–23
CHECK_CANDIDATE             Modes 0–20: changed=0, maxAbs=0
                            POLICY PASS
```

После первого прогона нужны отчёты Modes 21–23 для заполнения `calib_todo` и решения, требуется ли r2 только для EXPECTATION thresholds либо также изменение калибровки.
