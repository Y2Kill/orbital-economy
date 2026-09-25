# Capital Lifecycle Kernel conformance — руководство по инструменту (Lab v0.5.0)

Формальный контракт kernel описан в `../../docs/CAPITAL_LIFECYCLE_KERNEL_SPEC.md`. Этот документ — про то, как стенд его проверяет.

## 1. Два слоя одной проверки

```text
ModelJSON + validation.json (plugin capital_lifecycle_kernel)
                    │
        ┌───────────┴────────────┐
        ▼                        ▼
 СТАТИЧЕСКИЙ слой          RUNTIME слой
 lifecycle_conformance.js  checks.js → capital_lifecycle_kernel
 до симуляции, < 1 с       на каждом Mode, все 4321 шага
 типы, топология потоков,  Active ≤ Installed, тождества
 ссылки + LINK, switch     Inactive/Lifetime, Target ≤ ...,
                           стоки ≥ 0, потоки ≥ 0
        │                        │
        └───────────┬────────────┘
                    ▼
     NON_CONFORMING / FAIL = HARD-блокер
     (policy разрешить не может)
```

Каждый слой ловит класс ошибок, который другой пропускает: статический — структурные поломки с точной локализацией («у B Refinery нет потока Decommissioning → Retired») без 17 × 8-секундных прогонов; runtime — то, что топологией не гарантируется (например `Active > Installed` при рассинхроне policy-формул).

## 2. Команды

### `LIFECYCLE_CONFORMANCE.cmd [model.json] [validation.json]`

Только статический слой. Без аргументов берёт `input\model\` и `input\validation\`. Отчёт:

```text
output\conformance-<timestamp>\lifecycle-conformance.md
output\conformance-<timestamp>\lifecycle-conformance.json
```

Exit code `0` = все экземпляры конформны, `2` = есть `NON_CONFORMING` / ошибка спецификации.

### Где ещё срабатывает

- `RUN_LAB.cmd` / `SELF_TEST.cmd` / `RUN_TESTS.cmd` — статический слой выполняется сразу после `model.check()`, результат попадает в `report.md` (раздел «Capital Lifecycle Kernel conformance (static)»); `NON_CONFORMING` → `OVERALL: FAIL`. Runtime-слой выполняется на каждом Mode как обычный плагин.
- `COMPARE_MODELS.cmd` / `CHECK_CANDIDATE.cmd` — статический слой входит в static validation и accepted, и candidate. Неконформный candidate → `static.candidate.status = FAIL` → `COMPARISON RESULT: NOT_COMPARED`, симуляция не запускается, policy видит hard blocker.

### `CONFORMANCE_SELF_TEST.cmd`

QA самого checker'а (см. §5).

## 3. Формат плагина

```json
{
  "type": "capital_lifecycle_kernel",
  "format": "orbital-economy-capital-lifecycle-kernel-v1",
  "legacy_switch": "Capital Lifecycle Enabled",
  "abs_tol": 1e-8,
  "instances": [
    {
      "name": "A Refinery",
      "sector": "Refinery",
      "switch_gated": false,
      "roles": {
        "installed": "A Refinery Installed Capacity",
        "active": "A Refinery Active Capacity",
        "...": "..."
      }
    }
  ]
}
```

| Поле | Значение |
|---|---|
| `legacy_switch` | имя переключателя v7.3; по умолчанию `Capital Lifecycle Enabled` |
| `abs_tol` | tolerance runtime-тождеств; по умолчанию `1e-8` |
| `instances[].name` | уникальное имя экземпляра; префикс колонии не обязателен (Transport — глобальный) |
| `instances[].sector` | информативно |
| `instances[].switch_gated` | `true` — все 7 потоков обязаны ссылаться на switch; `false`/отсутствует — ни один kernel-элемент не должен |
| `instances[].roles` | `роль → имя примитива`; 26 обязательных ролей + опциональная `finance_limited_construction` |
| `instances[].policy_notes` | опциональный список строк, попадающий в «вариации» отчёта |

Полный список ролей и их зависимостей — `src/lifecycle_conformance.js`, константа `KERNEL_ROLES`; человекочитаемо — в конце каждого `lifecycle-conformance.md`.

Старый плагин `capital_lifecycle` (v0.3/v0.4, только три тождества, поле `items`) по-прежнему поддерживается, но в поставляемом `validation-v7.3.2.json` заменён на `capital_lifecycle_kernel`.

## 3a. Kernel-v2 (v0.9.0, для v7.5)

Роли `desired_expansion` (VARIABLE, policy) и `capital_goods_consumption` (FLOW `<любой STOCK> → ∅`, обязана ссылаться на `expansion`) — опциональны для v1-экземпляра и **обязательны** при `instances[].kernel_version: 2`. Runtime добавляет `Expansion ≤ Desired Expansion` и включает поток потребления в проверку `≥ 0`. Топология `expansion: ∅ → Installed` не меняется (преобразование единиц — пара, см. `STRUCTURE_AUDIT_RU.md`).

## 3b. Общая инфраструктура: вторая нога потребления (v0.9.1)

Необязательная роль `capital_goods_consumption_secondary` (FLOW `<любой STOCK> → ∅`, тоже обязана ссылаться на `expansion`) описывает капитал, который строится из запасов **нескольких** регионов: у транспорта v7.5.1 один поток `expansion`, но две ноги физического потребления оборудования — из запаса A и из запаса B. Экземпляр с ней получает вариацию, а не NON_CONFORMING; runtime включает второй поток в проверку `≥ 0`. Численное соответствие «сумма ног = expansion × коэффициент» задаётся как обычная пара преобразования с двумя `sinks` в `open_boundaries` и `identity`-проверкой в validation.

## 4. Чтение результата

```text
Lifecycle kernel conformance: PASS
    [PASS] duplicate primitive names
    [PASS] unresolved formula references
    [PASS] formula dependencies without LINK
    A Electronics    CONFORMING_WITH_VARIATION  (66/66 checks)
        ~ all kernel flows are gated by [Capital Lifecycle Enabled] (v7.3 regression switch)
    A Power          CONFORMING_WITH_VARIATION  (65/65 checks)
        ~ optional role "finance_limited_construction" not present
        ~ all kernel flows are gated by [Capital Lifecycle Enabled] (v7.3 regression switch)
    A Refinery       CONFORMING  (66/66 checks)
    Transport        CONFORMING  (66/66 checks)
```

- `~` — вариация: информация, не ошибка.
- `-` — failure: конкретная роль/поток/зависимость и причина.

Число проверок на экземпляр: 27 ролей + 7 топологий + 26 зависимостей + N ссылок + 1 switch; у Power на одну меньше из-за отсутствия опциональной роли.

## 5. QA checker'а — `CONFORMANCE_SELF_TEST.cmd`

Все негативные случаи — мутации **копии реальной accepted-модели**, не синтетика. Ожидаемый итог: **18 passed, 0 failed**.

Статика:

1. accepted v7.3 r2 — все 7 экземпляров конформны, Refinery/Transport = `CONFORMING`, Electronics/Power = `CONFORMING_WITH_VARIATION`;
2. удалён поток `B Refinery Dismantling Completion` → B Refinery `NON_CONFORMING`, A Refinery не затронут;
3. `A Power Generation Depreciation` перенаправлен в ∅ вместо Retired → `NON_CONFORMING` (топология);
4. удалён LINK Installed → Inactive у A Electronics → `NON_CONFORMING` + model-wide FAIL;
5. `A Refinery Inactive Capacity` сделан STOCK → `NON_CONFORMING` (тип);
6. `Transport Activation Time` 7 → 30 → **остаётся `CONFORMING`** (параметризация — не нарушение);
7. коэффициент в `A Refinery Required Active Capacity` 1.10 → 1.25 → **остаётся `CONFORMING`** (policy-формула — не kernel);
8. `[Capital Lifecycle Enabled]` добавлен в поток Transport → `NON_CONFORMING` (switch у негейтированного сектора);
9. switch убран из одного потока B Electronics → `NON_CONFORMING` (частично гейтированный экземпляр);
10. висячая ссылка в `A Refinery Lifetime Capacity Account` → `NON_CONFORMING` + model-wide FAIL;
11. mapping на несуществующий примитив → `NON_CONFORMING` с `primitive not found`, без crash;
12. kernel-spec без обязательной роли → `specErrors`, проверка не запускается;
13. validation без плагина → `SKIPPED`;
14. `compareModels` с неконформным candidate (движок его загружает, kernel — нет) → `NOT_COMPARED`, 0 сценариев.

Runtime (реальный Mode 0):

15. accepted — 49/49 runtime-проверок PASS;
16. `A Refinery Inactive Capacity` сдвинут на +1 → ровно одна проверка FAIL (`A Refinery: Inactive identity`, ошибка ≈ 1.0);
17. mapping на отсутствующие колонки → FAIL-записи, а не crash.

Пункты 6–7 — ключевые: они доказывают, что checker различает kernel и sector policy и не даёт ложных FAIL на легитимные отраслевые различия.

## 6. Что делать при NON_CONFORMING

Не «чинить» модель автоматически и не расширять контракт ради зелёного отчёта. Порядок:

1. прочитать `failures` экземпляра — там точный примитив и причина;
2. решить, что это: ошибка модели (исправить модель), намеренное архитектурное отклонение (задокументировать; если оно должно стать нормой — изменить `KERNEL_ROLES` отдельным решением с новой ревизией спецификации) или ошибка mapping (исправить validation JSON);
3. любое изменение validation JSON → новая ревизия change-policy с обновлённым `validation_sha256`.
