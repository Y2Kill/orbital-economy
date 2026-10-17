# v7.7.17 — план проверок

Все проверки выражены типами языка validation и исполнены нами на skeleton (`draft/skeleton-patch.json`). Значения — skeleton на Windows. **[calib]** — порог отличает новое поведение от прежнего, это подтверждает контроль ниже.

## 1. Структура и регрессия

- `regression_modes` 0–57: Modes 0–57 побайтно равны v7.7.16 r1 (`Money Enabled = 0`);
- структурная часть validation получена `expand-nodes --validation`:
  - плагин `money`, 2 экземпляра: тождество дохода, неотрицательные дивиденды и доля бюджета, **замкнутость торговли, сохранение денег**;
  - 12 денежных потоков — в `financial_accounting`;
- граничных 302, симметрия 0, петель 0 из 1048576, `planet_v1` PASS.

## 2. Новые Modes

Mode 58 наследует от Mode 56 тождества, отношения и проверку «собственное потребление энергетики обслужено». Mode 59 наследует то же от Mode 57. Сверх этого:

| Mode | Проверка | Skeleton | Порог |
|---|---|---|---|
| 58 | `B Local Demand` last (Mode 56: 5.85) | 3.40 | < 4.0 **[calib]** |
| 58 | `B Balance of Payments` last (Mode 56: −238) | −37 | > −120 **[calib]** |
| 58 | `B Household Money` min — без долга | 37 537 | > 30 000 |
| 58 | `A Household Money` min — у цели | 162 778 | > 140 000 |
| 58 | `A Real Wage` mean (Mode 56: 118.4) | 118.4 | > 115 |
| 58 | `A Metal Production` mean | 29.7 | > 28 |
| 58 | `A Food Fulfillment` min, `B Food Fulfillment` min | 1.00 | ≥ 0.99 |
| 59 | `A Market Price` max (Mode 57: 78.1) | 60.4 | < 70 **[calib]** |
| 59 | `A Labor Availability` min (Mode 57: 0.957) | 0.9986 | > 0.99 **[calib]** |
| 59 | `B Balance of Payments` last (Mode 57: −255) | −33 | > −120 **[calib]** |
| 59 | `A Food Fulfillment` min | 1.00 | ≥ 0.99 |

**Контроль (сделан нами).** Modes 58–59 с `Money Enabled = 0` — см. спецификацию §7: калиброванные проверки должны падать.

## 3. Что не проверяется

- долгий эффект — горизонт validation 3 года; см. спецификацию §6;
- кредит, проценты, межрегиональная собственность.
