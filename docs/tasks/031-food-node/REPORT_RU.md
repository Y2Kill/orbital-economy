# Задание 031 — отчёт исполнителя

Ветка: `task/031-food-node` от `main@733c8bc787fecb530b83207660ac7df7d5a2493d`.

## Журнал

### Старт — 2026-10-05
Прочитаны `TASK_RU.md`, `fixtures/food.json` и `reference/food_node_prototype.mjs`. Локальный checkout недоступен из-за отсутствия DNS в рабочем контейнере; ветка создана строго от `733c8bc`, строгий guard будет подтверждаться `ci.yml` на содержательных коммитах. Модель, validation и policy не изменяются.

### КТ1 — 2026-10-05 — генератор и схема подтверждены
Сделано: добавлен тип узла `food`, строгая схема декларации, fixture и самотесты 46/50/51. Эталон раскрытия подтверждён на каноническом Linux CI: 96 элементов / 25 замен / 241 связь, fingerprint `d7657194d897c8c8`; strip/rebuild даёт 0 отличий; пять обязательных schema/base negatives отклоняются.
Доказательство: [ci.yml run 37330021694](https://github.com/Y2Kill/orbital-economy/actions/runs/37330021694), job `111830826952`: строка 523 — case 46 PASS, `96 elements / 25 replacements / 241 links; fingerprint=d7657194d897c8c8`; строка 524 — case 50 PASS, `0 definition/replacement/link differences`; строка 525 — case 51 PASS; строка 527 — `NODE SELF-TEST: 48 passed, 0 failed`. В этом же run `guard`, `tools-selftest` и `bench-selftests` завершены success.
Не подтвердилось: расхождений с reference-прототипом или ошибок схемы/strip-rebuild нет.
Дальше: КТ2 — generated validation, plugin `food`, cases 47–49 и QA 46.


### КТ2 — 2026-10-05 — validation и plugin food
Сделано: generated validation для `food`, semantic merge, static conformance, runtime plugin; cases 47–49 и QA 46. Case 47 подтвердил 2 CONFORMING food instances, границы 232→254 при unclassified=0, P2.simple 6→8, P3.requests 14→16, P5 declared 17→19, loops=0. Case 48 подтвердил runtime food PASS, fulfillment обоих регионов >0.9 и фактическую торговлю; case 49 — 6 dispatch + 6 arrival для трёх регионов.
Доказательство первого раунда: [ci.yml run 37331831149](https://github.com/Y2Kill/orbital-economy/actions/runs/37331831149), bench job `111836761578`: QA 46/46; строки 525–527 — cases 47–49 PASS; строка 532 — NODE 52/52; строка 1590 — `OVERALL: PASS`.
Не подтвердилось: статических, Planet, loop или runtime ошибок самого plugin `food` не обнаружено.

### КТ3 — 2026-10-05 — слоистость switched food над population/labor
Сделано: `switchlessLayers` начинает построение с модели, из которой предварительно сняты переключаемые узлы, читающие или оборачивающие элементы switchless-узлов. Case 52 на модели «accepted + food» снимает `food` первым и затем успешно восстанавливает цепочку `population/labor`.
Доказательство первого раунда: [ci.yml run 37331831149](https://github.com/Y2Kill/orbital-economy/actions/runs/37331831149), строка 530 — case 52 PASS; полный `bench-selftests` success.

### КТ4 — 2026-10-05 — документация и финальная голова первого раунда
Сделано: Lab v0.9.17, NODES/VALIDATION/HARNESS_QA/TEST_STATUS/README/CHANGELOG обновлены; accepted model, validation, policy и `model/nodes/*` не менялись.
Доказательство: [ci.yml run 37333285715](https://github.com/Y2Kill/orbital-economy/actions/runs/37333285715), `guard`, `tools-selftest`, `bench-selftests` — success; QA 46/46, NODE 52/52, `OVERALL: PASS`. Этот run относится к голове `fb707a9`.


### Раунд 2 — 2026-10-09 — совместимость прежних runtime-плагинов
Причина: выяснилось, что первый раунд проверял в case 48 только plugin `food`, поэтому не ловил две прежние runtime-регрессии при `Food Enabled = 1`: `energy_balance` не знал Farming, а подмена `Transport Labor Requirement` нарушала labor product identity.

Исправлено:
- из `transport.load_readers` удалён `Transport Labor Requirement`; труд на перевозку еды на этом шаге **не учитывается**;
- `{C} Farming Energy Fulfillment` переименован в `{C} Farming Energy Fulfillment Ratio`;
- generated validation добавляет `energy_balance_consumers: ["Farming"]` и `energy_balance_priority: ["Farming"]`;
- case 48 теперь запускает runtime **всех** плагинов merged validation, а не только `food`.

Новый oracle: **96 add / 24 replace / 239 LINK**, fingerprint `c18a59dd39488c12`. Structural expectations не изменились: boundary 254, P2 simple 8, P3 requests 16, P5 declared 19, loops 0.
Доказательство: [ci.yml run 37895426656](https://github.com/Y2Kill/orbital-economy/actions/runs/37895426656), bench job `113705580064`: строка 525 — case 46 PASS, `96 elements / 24 replacements / 239 links; fingerprint=c18a59dd39488c12`; строка 526 — case 47 PASS, boundaries 232→254, P2.simple 6→8, P3.requests 14→16, P5 17→19, loops=0; строка 527 — case 48 PASS, `all merged runtime plugins PASS; A/B fulfillment >0.9; dispatch observed`; строки 529/531 — cases 50/52 PASS; строка 533 — NODE 52/52; строка 1591 — `OVERALL: PASS`. Guard и tools-selftest также success.

## Устройство

`food` — переключаемый генератор Planet v2 step 2. После round 2 все **24** замены формул обёрнуты `IfThenElse([Food Enabled] = 1, новое, старое)`; при выключенном переключателе прежние ряды должны совпадать с accepted. Генератор создаёт региональные запасы/потребление/фермы, приоритетный энергозапрос, труд и торговлю едой по каждой упорядоченной паре регионов. Farming зарегистрирован как обычный и priority consumer `energy_balance`; series fulfillment называется `{C} Farming Energy Fulfillment Ratio`.

## Отличия

Первый раунд совпадал с исходным reference-прототипом задачи: 96/25/241, fingerprint `d7657194d897c8c8`. В round 2 эталон был исправлен владельцем для совместимости с уже существующими runtime-контрактами, и реализация приведена к исправленному эталону:

- `Transport Labor Requirement` больше не заменяется food-узлом; это уменьшило раскрытие на 1 replacement и 2 LINK. **Ограничение:** труд на перевозку еды сейчас не учитывается.
- `Farming Energy Fulfillment` → `Farming Energy Fulfillment Ratio` для соглашения `energy_balance`.
- Farming добавляется в `energy_balance.consumers` и `energy_balance.priority`.
- case 48 усилен: проверяет все merged runtime plugins при `Food Enabled = 1`.

Итоговый oracle round 2: **96/24/239**, fingerprint `c18a59dd39488c12`. Остальная механика, стартовые значения, boundary/Planet topology и layering не изменялись. Генератор дополнительно выполняет строгую проверку схемы и существования ссылок базы.

## Ограничения и замечания

Модель, validation, policy, `model/nodes/*`, `tools/*`, `lab/vendor/*`, `.github/*` и `lab/src/engine.js` не меняются. SHA256SUMS не пересобираются (`sums_by=reviewer`).
