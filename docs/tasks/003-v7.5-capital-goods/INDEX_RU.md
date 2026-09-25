# Задание 003 — v7.5 Capital Goods

Сектор оборудования в каждой колонии: расширение мощностей Refinery/Electronics/Power физически обеспечено Capital Goods из металла и электроники (kernel-v2); Modes 21–23; closed-world 7 → 1. Исполнитель — чат-модель без стенда, поставка патчем (контракт §7). **Итог: принято в r2, 2026-09-24** — accepted `Orbital Economy v7.5 r1`, SHA `987490e8…`.

| Папка | Что это | Итог |
|---|---|---|
| `issue/` | выдача: задание, архитектурная спецификация, test plan, working context, черновики policy и validation, `skeleton/` — skeleton-патч (только колония A) и его прогон | — |
| `r1-delivery/` | поставка r1: отчёт исполнителя, `model-patch.json`, policy, validation, фрагмент аннотаций | — |
| `r1-review/` | `ACCEPTANCE_R1_RU.md` — **r1 не принят, нужна r2**: механика работает, но B не производит оборудование (ожидание было заведомо ложным — наш skeleton покрывал только A), потоки потребления не выключались переключателем, fulfillment зависел от масштаба колонии; `r2_drafts/` — наши черновики policy, validation и формул для r2; `apply-patch.log` | — |
| `r2-acceptance/` | `PROMOTION_RECORD.md` — запись о продвижении; принятые `model-patch.json` r2, `change-policy-v7.5-capital-goods-r2.json`, `validation-v7.5-r2.json`, фрагмент аннотаций | **принят**: Modes 0–20 = v7.4.1 бит-в-бит, policy PASS (1396 ожидаемых событий, неожиданных 0), conformance и structure audit PASS, closed-world 1 (Transport) |

**r2 относительно r1** — ровно замечания из `r1-review/`: шесть потоков потребления Capital Goods гейтированы переключателем; fulfillment безмасштабный (`Capital Goods Buffer Days = 1`); шок Mode 22 — множитель 0.1; исправленные validation и policy. Принятая validation r2 байт в байт совпадает с нашим черновиком `r1-review/r2_drafts/validation-v7.5-r2-draft.json`. Принятая модель — «metadata-clean» продвижение проверенного кандидата r2: изменены только имя и описание модели.

**Происхождение `r2-acceptance/`.** Файлы извлечены 2026-09-25 из пакета `orbital-economy-baseline-v7.5.zip` (папка `provenance/task_003_v7.5/`), найденного в корзине после переноса предыстории; сам пакет сохранён в `ARCHIVE/NEW/processed/`. Отчёта исполнителя по r2 и нашего разбора прогона r2 в сохранившихся материалах нет — только запись о продвижении.

Уроки задачи — контракт §8 п. 6–8: skeleton покрывает обе колонии; мягкое нормирование безмасштабно; парное тождество проверяется только там, где поток включён.
