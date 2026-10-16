# v7.7.15 — план проверок

Все проверки выражены типами языка validation и исполнены нами на skeleton (`draft/skeleton-patch.json`). Значения — skeleton на Windows; **[calib]** — порог отличает новое поведение от прежнего, это подтверждает контроль ниже.

## 1. Структура и регрессия

- `regression_modes` 0–53: Modes 0–53 побайтно равны v7.7.14 r1 (`Wage Pricing Enabled = 0`);
- структурная часть validation получена `expand-nodes --validation`: плагин `wage_pricing`, 2 экземпляра;
- граничных 262, симметрия 0, петель 0 из 262144, `planet_v1` PASS.

## 2. Новые Modes

Mode 54 наследует от Mode 52 тождества, отношения и проверку «собственное потребление энергетики обслужено». Mode 55 наследует то же от Mode 53. Сверх этого:

| Mode | Проверка | Skeleton | Порог |
|---|---|---|---|
| 54 | `B Ore Price` min (Mode 52: 14.00) | 13.77 | < 13.9 **[calib]** |
| 54 | `B Food Price` max, окно [720, 1080] (Mode 52: 10.01) | 9.82 | < 9.95 **[calib]** |
| 54 | `B Energy Price` min (Mode 52: 0.0700) | 0.0677 | < 0.0695 **[calib]** |
| 54 | `A Ore Price` max | 4.041 | < 4.2 |
| 54 | `A Labor Availability` min | 1.00 | > 0.99 |
| 54 | `A Food Fulfillment` min, `B Food Fulfillment` min | 1.00 | ≥ 0.99 |
| 54 | `B Wage` min | 135.3 | < 138 |
| 55 | `A Labor Availability` min | 0.964 | < 0.98 |
| 55 | `A Labor Availability` min (Mode 53: 0.946) | 0.964 | > 0.955 **[calib]** |
| 55 | `A Market Price` max (Mode 53: 36.5) | 33.4 | < 35 **[calib]** |
| 55 | `A Ore Price` max | 4.124 | > 4.05 |
| 55 | `A Food Fulfillment` min | 1.00 | ≥ 0.99 |

**Контроль (сделан нами).** Modes 54–55 с `Wage Pricing Enabled = 0`:
- в Mode 54 падают 3 проверки: руда, еда и энергия B;
- в Mode 55 падают 2 проверки: предохранитель мягче, пик цены ниже.

## 3. Что не проверяется

- долгий эффект (80 лет: металл B 1.7 → 7.8, население B растёт) — горизонт validation 3 года; см. спецификацию §6;
- спрос от дохода — не вводится;
- деньги и сбережения — следующий шаг.
