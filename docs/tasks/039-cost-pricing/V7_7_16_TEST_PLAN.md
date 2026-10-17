# v7.7.16 — план проверок

Все проверки выражены типами языка validation и исполнены нами на skeleton (`draft/skeleton-patch.json`). Значения — skeleton на Windows. **[calib]** — порог отличает новое поведение от прежнего, это подтверждает контроль ниже.

## 1. Структура и регрессия

- `regression_modes` 0–55: Modes 0–55 побайтно равны v7.7.15 r1 (`Cost Pricing Enabled = 0`);
- структурная часть validation получена `expand-nodes --validation`:
  - плагин `cost_pricing`, 2 экземпляра;
  - 28 потоков сигналов — в информационных сигналах `open_boundaries`;
- граничных 290, симметрия 0, петель 0 из 524288, `planet_v1` PASS.

## 2. Новые Modes

Mode 56 наследует от Mode 52 тождества, отношения и проверку «собственное потребление энергетики обслужено». Mode 57 наследует то же от Mode 53. Сверх этого:

| Mode | Проверка | Skeleton | Порог |
|---|---|---|---|
| 56 | `A Energy Price` min (Mode 52: 0.120) | 0.572 | > 0.5 **[calib]** |
| 56 | `B Power Resource Price` min (Mode 52: 0.040) | 0.399 | > 0.3 **[calib]** |
| 56 | `A Market Price` mean (Mode 52: 26.3) | 59.2 | > 50 **[calib]** |
| 56 | `A Refinery Profit` mean (Mode 52: 70.5) | 333 | > 200 **[calib]** |
| 56 | `A Price Index` mean (Mode 52: 0.839) | 0.844 | > 0.82 и < 0.87 — калибровка держит уровень |
| 56 | `A Real Wage` mean (Mode 52: 119.4) | 118.4 | > 115 |
| 56 | `A Food Fulfillment` min, `B Food Fulfillment` min | 1.00 | ≥ 0.99 |
| 56 | `A Labor Availability` min | 1.00 | > 0.99 |
| 57 | `A Market Price` max (Mode 53: 36.5) | 78.1 | > 70 **[calib]** |
| 57 | `A Labor Availability` min | 0.957 | < 0.98 |
| 57 | `A Labor Availability` min (Mode 53: 0.946) | 0.957 | > 0.95 **[calib]** |
| 57 | `A Energy Price` max | 0.711 | > 0.65 **[calib]** |
| 57 | `A Food Fulfillment` min | 1.00 | ≥ 0.99 |

**Контроль (сделан нами).** Modes 56–57 с `Cost Pricing Enabled = 0`:
- в Mode 56 падают 4 проверки: энергия, энергоресурс, металл, прибыль;
- в Mode 57 падают 3: пик металла, предохранитель, энергия.

## 3. Что не проверяется

- долгий эффект — горизонт validation 3 года; см. спецификацию §6;
- денежные запасы и доходы — следующий шаг.
