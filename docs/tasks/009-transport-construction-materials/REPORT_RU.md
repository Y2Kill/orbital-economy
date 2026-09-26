# Отчёт кандидата — задача 009, v7.7.1 Transport on Construction Materials

## Журнал

Работа начата с `main@ae7005158f8b9f6a9991064f74513e0da9b7e576`. Контрольные точки пока не закрыты.

## Реализация кандидата

Candidate r1 следует исчерпывающей спецификации: shared Transport получает второй физический ресурс — Construction Materials — по дословной схеме принятого Transport Capital Goods: половинное планирование спроса по A/B, фактическое списание пропорционально текущим региональным запасам.

Структурная самопроверка перед первым push: **12 новых элементов, 4 replace-formulas, 33 новых LINK, 30 scenario switch-off изменений и 2 новых Modes**. `old`-ветки трёх изменяемых экономических формул извлечены дословно из accepted v7.7 r1; `Test 2 Transport Surge Active` расширен только веткой Mode 31.

Первая validation сохраняет draft/accepted v7.7 без ослабления, добавляет switch-off проверки Modes 0–29, тождества Modes 30–31 и три намеренно невозможных `[calib probe]`: Mode 30 Transport CM fulfillment; Mode 31 B Construction Materials Production; Mode 31 B Construction Materials Fulfillment. Пороговые значения будут выбраны только после первого полного `candidate.yml` по контракту §8.

## Отклонения от спецификации

На старте отклонений нет. В Mode 31 для требования «B строит Refinery или Power» executable-проверка использует `B Power Generation Expansion > 0`; skeleton спецификации подтверждает этот путь (≈0.45/день), поэтому это более конкретная, не более слабая проверка исходного дизъюнкта.

## Калибровка

Ожидается первый полный Linux-run. Константа `Transport Construction Materials per Capacity = 3` оставлена ровно на skeleton-значении владельца; до измерения не корректируется.

## Известные ограничения

- Mode 30 не требует производства Construction Materials в B: по спецификации ей хватает стартового запаса.
- Energy, торговля Construction Materials и lifecycle новых секторов остаются вне v7.7.1.
- Канонические числовые значения снимаются reviewer на Windows; Linux CI используется для гейтов и калибровочных ориентиров, не для бит-в-бит эталона.

## Что не запускалось локально

У агента нет локального checkout/Node-стенда. Локально не запускались `check_branch`, bench/selftests, `candidate.yml` и канонический Windows-прогон; это заменяется GitHub Actions по §9.4. SHA256SUMS не пересобираются, поскольку `sums_by: reviewer`.
