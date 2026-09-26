# Capital Lifecycle Kernel — формальная спецификация

Статус: **CURRENT / current lifecycle contract carried into v7.7.1 r1** (обновлено 2026-09-25). Kernel-v1 remains the common lifecycle foundation; all seven accepted instances now use kernel-v2 physical Capital Goods backing.
Модель: `Orbital Economy v7.7.1 r1 — Transport on Construction Materials`, SHA-256 `d53d014d727a439694e103aafb49f87d4dbbb362e581414cbf4dc71a19646f93`. Capital Lifecycle structure is inherited from accepted v7.5.1.
Машинная форма контракта: plugin `capital_lifecycle_kernel` в `validation/validation-v7.7.1.json`; проверяющий код `lab/src/lifecycle_conformance.js` (static) и `lab/src/checks.js` (runtime). При расхождении машинная форма и accepted code имеют приоритет.

## 1. Зачем

Ранний lifecycle-аудит установил, что четыре сектора модели — Electronics, Power, Refinery/Metal и Transport — реализуют общий физический паттерн жизненного цикла капитала и различаются отраслевой policy. Этот документ фиксирует этот паттерн как **формальный контракт**, который стенд проверяет автоматически. Current v7.6 candidate carries this accepted v7.5.1 lifecycle structure unchanged.

Контракт делит каждый сектор на две части:

| Часть | Что это | Кто решает | Проверяется |
|---|---|---|---|
| **Physical kernel** | стоки, потоки, их топология, derived-величины, учётные тождества | одинаково для всех секторов | стендом, обязательно |
| **Sector policy** | как вычисляются `Required Active`, `Desired Installed`, `Strategic Reserve Target`, ограничивает ли строительство финансирование, все времена и коэффициенты | каждый сектор сам | не проверяется kernel-контрактом (это предмет validation сценариев и regression policy) |

Правило разграничения: **kernel отвечает на вопрос «какая мощность физически существует и в каком состоянии», policy — «сколько мощности должно быть»**.

## 2. Топология kernel (как она реально устроена в модели)

Важно: `Installed` и `Active` — **параллельные стоки**, а не вложенные. `Inactive` — производная VARIABLE, не сток. Activation — приток в `Active` извне модели, а не перенос из стока `Inactive`. Учебниковая схема «Inactive → Active» здесь не применяется; инвариант `Active ≤ Installed` обеспечивается согласованностью policy-формул (`Target Active = min(Required, Installed)`) и проверяется **численно**, а не топологически.

```text
                 expansion                installed_depreciation
        ∅ ───────────────────► [Installed] ─────────────────────► [Retired]
                                    │                                 ▲
                                    │ decommissioning_initiation      │ dismantling_completion
                                    ▼                                 │
                             [Decommissioning] ───────────────────────┘

                 activation                mothballing / active_depreciation
        ∅ ───────────────────► [Active] ──────────────────────────────► ∅

        Inactive := max(Installed − Active, 0)          (VARIABLE, derived)
        Lifetime := Installed + Decommissioning + Retired (VARIABLE, derived)
```

Семь потоков и их фиксированные endpoints (`∅` = граница модели):

| Роль потока | from | to | обязан ссылаться на |
|---|---|---|---|
| `expansion` | ∅ | `installed` | `gap_limited_construction` |
| `decommissioning_initiation` | `installed` | `decommissioning` | `surplus` |
| `installed_depreciation` | `installed` | `retired` | `installed` |
| `dismantling_completion` | `decommissioning` | `retired` | `decommissioning` |
| `activation` | ∅ | `active` | `activation_gap` |
| `mothballing` | `active` | ∅ | `mothball_gap` |
| `active_depreciation` | `active` | ∅ | `active` |

## 3. Роли kernel

### 3.1 Стоки (STOCK) — 4

`installed`, `active`, `decommissioning`, `retired`.

### 3.2 Policy-входы (VARIABLE, обязаны существовать; формула — отраслевая) — 3

| Роль | Смысл |
|---|---|
| `required_active` | сколько активной мощности сейчас нужно |
| `desired_installed` | сколько установленной мощности сектор хочет иметь |
| `strategic_reserve_target` | сколько неактивной мощности сектор намерен удерживать |

Опционально: `finance_limited_construction` — финансовое ограничение строительства. Его отсутствие (Power) — задокументированная вариация, не нарушение.

### 3.3 Derived-величины (VARIABLE) — 12, с обязательными зависимостями

| Роль | Смысл | Обязана ссылаться на |
|---|---|---|
| `inactive` | `max(Installed − Active, 0)` | `installed`, `active` |
| `target_active` | `min(Required Active, Installed)` | `required_active`, `installed` |
| `activation_gap` | `max(Target − Active, 0)` | `target_active`, `active` |
| `mothball_gap` | `max(Active − Target, 0)` | `active`, `target_active` |
| `installed_shortage` | `max(Desired − Installed, 0)` | `desired_installed`, `installed` |
| `installed_excess` | `max(Installed − Desired, 0)` | `installed`, `desired_installed` |
| `gap_limited_construction` | `Shortage / Construction Time` | `installed_shortage` |
| `activation_queue` | `min(Inactive, Activation Gap)` | `inactive`, `activation_gap` |
| `inactive_after_activation_queue` | `max(Inactive − Queue, 0)` | `inactive`, `activation_queue` |
| `strategic_reserve` | `min(Inactive after queue, Reserve Target)` | `inactive_after_activation_queue`, `strategic_reserve_target` |
| `surplus` | `max(Inactive after queue − Reserve, 0)` | `inactive_after_activation_queue`, `strategic_reserve` |
| `lifetime` | `Installed + Decommissioning + Retired` | `installed`, `decommissioning`, `retired` |

Столбец «Смысл» — описание, а **не** то, что проверяет статический checker. Модель кодирует `max/min` как `(x + (x²)^0.5)/2`; статический разбор таких формул хрупок и слабее численной проверки. Поэтому статически проверяются только ссылки и LINK, а значения тождеств — на прогоне.

Итого: 4 + 3 + 12 + 7 = **26 обязательных ролей** + 1 опциональная.

### 3.4 Kernel-v2 roles (v7.5 / v7.5.1)

Для экземпляров с `kernel_version: 2` обязательны две основные роли и допускается одна дополнительная для shared infrastructure:

| Роль | Тип | Смысл |
|---|---|---|
| `desired_expansion` | VARIABLE | unconstrained/finance-limited demand for new capacity before physical Capital Goods fulfillment |
| `capital_goods_consumption` | FLOW | primary physical withdrawal from a Capital Goods Inventory paired with actual expansion |
| `capital_goods_consumption_secondary` | FLOW, optional | second physical withdrawal leg for a shared sector supplied by more than one regional inventory |

В v7.5 kernel-v2 был введён для A/B Electronics, A/B Power и A/B Refinery. В v7.5.1 Transport также переведён на kernel-v2. Его задокументированная вариация — два физических consumption leg: `A Transport Capital Goods Consumption` и `B Transport Capital Goods Consumption`.

## 4. Что проверяется

### 4.1 Статический слой (до симуляции) — `lifecycle_conformance.js`

Для каждого экземпляра:

1. **Наличие и тип** — каждая обязательная роль отображена на существующий примитив нужного типа (STOCK / VARIABLE / FLOW).
2. **Топология потоков** — `from`/`to` каждого из 7 потоков в точности как в таблице §2.
3. **Обязательные зависимости** — для каждой роли с `deps`: формула ссылается на `[имя]` зависимости **и** существует `LINK dep → role`.
4. **Целостность ссылок** — все `[ссылки]` в формулах kernel-элементов резолвятся и имеют LINK.
5. **Семантика legacy-switch** — см. §5.

Для модели в целом: нет дубликатов имён, нет нерезолвящихся ссылок, нет зависимостей без LINK.

### 4.2 Runtime-слой (на каждом Mode) — плагин `capital_lifecycle_kernel` в `checks.js`

На всех 4321 шагах каждого сценария, tolerance `1e-8`:

1. `Active ≤ Installed`
2. `Installed − Active − Inactive = 0`
3. `Lifetime − Installed − Decommissioning − Retired = 0`
4. `Target Active ≤ Installed`
5. `Target Active ≤ Required Active`
6. все 4 стока ≥ 0
7. все 7 потоков ≥ 0

Семь проверок × семь экземпляров = 49 runtime-проверок на Mode.

### 4.3 Что НЕ проверяется — намеренно

- равенство коэффициентов и времён между секторами (`Activation Time = 7` у Transport и `30` у Electronics — норма);
- формулы `required_active`, `desired_installed`, `strategic_reserve_target`;
- наличие или отсутствие финансового ограничения;
- «правильность» экономического поведения — это предмет сценарных проверок validation и regression policy.

## 5. Legacy-switch `Capital Lifecycle Enabled`

В v7.3 введён переключатель, обнуляющий все 7 kernel-потоков Electronics и Power в Modes 0–11, чтобы эти режимы бит-в-бит воспроизводили v7.2 r4. У Refinery и Transport lifecycle был частью accepted-поведения v7.2 и переключателя не имеет.

Контракт фиксирует это как **свойство экземпляра** `switch_gated`:

- `switch_gated: true` (Electronics, Power) — все 7 потоков обязаны ссылаться на switch; хотя бы один негейтированный поток = NON_CONFORMING;
- `switch_gated: false` (Refinery, Transport) — ни один kernel-элемент не должен ссылаться на switch; появление ссылки = NON_CONFORMING.

**Запрещено** механически добавлять этот switch к Refinery/Transport: в Modes 0–11 он равен 0 и такое изменение отключило бы исторически существующую динамику, создав массовую регрессию. Если когда-либо потребуется отдельный migration/debug-переключатель, он должен иметь другое имя, другую семантику и другой default.

## 6. Классификация экземпляра

| Класс | Условие |
|---|---|
| `CONFORMING` | все обязательные проверки PASS, вариаций не отмечено |
| `CONFORMING_WITH_VARIATION` | все обязательные проверки PASS; есть задокументированные вариации (опциональная роль отсутствует, экземпляр гейтирован legacy-switch) |
| `NON_CONFORMING` | хотя бы одна обязательная проверка FAIL; причина и элемент указаны в отчёте |

`NON_CONFORMING` — **HARD-блокер**: `RUN_LAB` даёт `OVERALL: FAIL`, `COMPARE_MODELS`/`CHECK_CANDIDATE` останавливаются на статическом этапе (`NOT_COMPARED`), change-policy не может это разрешить.

## 7. Результат для current v7.6 r1 candidate

| Экземпляр | Класс | Вариации |
|---|---|---|
| A Electronics | CONFORMING_WITH_VARIATION | switch-gated |
| B Electronics | CONFORMING_WITH_VARIATION | switch-gated |
| A Power | CONFORMING_WITH_VARIATION | switch-gated; нет `finance_limited_construction` |
| B Power | CONFORMING_WITH_VARIATION | switch-gated; нет `finance_limited_construction` |
| A Refinery | CONFORMING_WITH_VARIATION | kernel-v2, одна physical consumption leg |
| B Refinery | CONFORMING_WITH_VARIATION | kernel-v2, одна physical consumption leg |
| Transport | CONFORMING_WITH_VARIATION | kernel-v2 shared infrastructure; две physical consumption leg |

Подробности: `docs/CAPITAL_LIFECYCLE_CONFORMANCE_REPORT.md`, mapping: `docs/CAPITAL_LIFECYCLE_SECTOR_MAPPING.md`.

## 8. Как подключить новый сектор

1. Реализовать в ModelJSON 4 стока, 7 потоков с топологией §2, 12 derived-величин с зависимостями §3.3, 3 policy-входа.
2. Добавить экземпляр в плагин `capital_lifecycle_kernel` validation-файла: `name`, `sector`, `switch_gated: false` (новый сектор не должен использовать legacy-switch), `roles: {роль: "имя примитива"}`.
3. `LIFECYCLE_CONFORMANCE.cmd` → все экземпляры не `NON_CONFORMING`.
4. `RUN_LAB.cmd` → runtime-тождества на всех Modes.
5. Поскольку validation-файл изменился, выпустить новую ревизию change-policy с обновлённым `validation_sha256` (см. `lab/docs/CHANGE_POLICY_RU.md`).

## 9. Что этот контракт не является

- Не единый исполняемый модуль: в ModelJSON по-прежнему четыре (семь с учётом A/B) развёрнутых копии паттерна. Генератор экземпляров из декларативной конфигурации — отдельное архитектурное решение, здесь не принимаемое.
- Не спецификация экономики: он не говорит, сколько мощности нужно строить.
- Не замена regression policy: контракт защищает структуру, policy защищает поведение относительно accepted baseline.
