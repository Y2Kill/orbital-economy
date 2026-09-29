# Отчёт по задаче 020 — simple_capital cap

## Журнал

### КТ1 — 2026-09-29 — схема, генератор и первичные самотесты
Сделано: реализованы `capacity_output.cap: "smooth"` и `sizing.signal.initial` как число либо точный объект по колониям; добавлена LF-копия фикстуры; добавлены случаи NODE 16, 20 и 21. Случай 16 проверяет 36/6/94, дословность `Uncapped Output` и старой ветки, а также байтовую детерминированность.
Доказательство: код совпадает по формулам раскрытия с выданным `reference/prototype.diff`; CI КТ1: https://github.com/Y2Kill/orbital-economy/actions/runs/36627489593 (run 36627489593). Запуск был вытеснен последующими push после успешных `guard`/`tools-selftest`; окончательное подтверждение всех self-tests получено на финальной кодовой голове КТ3.
Не запускалось: локальный `check_branch`, стенд, NODE QA и прочие самотесты — исполнитель работает только через API-коннектор, §9.4. SHA256SUMS не пересобирались (`sums_by: reviewer`).
Не подтвердилось: тестовых failures не было; промежуточный запуск не завершён из-за последующих push.
Дальше: выполнено в КТ2/КТ3.

### КТ2 — 2026-09-29 — интеграция, runtime и обратная сборка
Сделано: добавлены NODE 17–19. Случай 17 применяет фикстуру к слою без неё, вливает validation-фрагменты и проверяет все simple_capital, loops=0, unclassified=0 и относительный сдвиг P2 (+2 simple / −2 exceptions). Случай 18 клонирует последний Mode, включает Power Resource Capital и на реальной симуляции проверяет для каждой точки rate ≤ Uncapped Output + 1e-9 и rate ≤ Capacity + 0.001 + 1e-9, а также runtime-проверки. Случай 19 снимает и собирает узел заново без отличий определений, замен и связей.
Доказательство: CI КТ2: https://github.com/Y2Kill/orbital-economy/actions/runs/36627720402 (run 36627720402). Он был отменён новым push: `guard` и `tools-selftest` успели пройти, `bench-selftests` был остановлен во время loop self-test, NODE ещё не запускался. Полный результат этих же изменений подтверждён финальным run КТ3.
Не запускалось локально: `check_branch`, стенд и самотесты, согласно §9.4; результаты NODE/bench-selftests считаю подтверждёнными только после Actions.
Не подтвердилось: тестовых failures не зарегистрировано; run КТ2 отменён только более новым push.
Дальше: выполнено в КТ3.

### КТ3 — 2026-09-29 — версия и документация
Сделано: версия стенда поднята до 0.9.11 в package/package-lock/CLI; обновлены NODES_RU, HARNESS_QA_RU, TEST_STATUS_RU, README_RU и CHANGELOG с описанием smooth cap, per-colony initial и NODE 16–21.
Доказательство: кодовая голова КТ3 `b045ad736a463fb0eed4f96e0da761cfa0e0c37f` — CI https://github.com/Y2Kill/orbital-economy/actions/runs/36628103397, `success`. `guard`, `tools-selftest` и весь `bench-selftests` зелёные; NODE: **21 passed, 0 failed**. Cases 16–21: 36/6/94 и byte-determinism; simple=6 CONFORMING, loops=0, P2 4→6 / exceptions 2→0, unclassified=0; 8642 runtime points удовлетворяют обеим границам smooth cap; strip/rebuild 36/6/94 без отличий; schema negatives PASS; initial A=1350, B=182.656. Общий Bench Modes 0/12: PASS. Исторические baseline-числа не переписывались.
Не запускалось локально: `check_branch`, Windows стенд, RUN_LAB/CHECK_CANDIDATE; SHA256SUMS не пересобирались (`sums_by: reviewer`).
Не подтвердилось: тестовых failures нет. Неудачная попытка собрать весь документационный commit одним API-скриптом завершилась до стадии записи из-за лимита tool calls; репозиторий не был изменён, после чего КТ3 разбита на два линейных коммита.
Дальше: этот commit меняет только `REPORT_RU.md`; после push ожидается отдельный `ci.yml` для отчётной головы, его результат проверяется отдельным шагом.

## Устройство изменений

### `capacity_output.cap`
Для `simple_capital` `capacity_output` содержит `variable` и ровно один из `replaces` / `cap`. Значение `cap` — только `"smooth"`. Исходная формула скорости копируется дословно в `X S Uncapped Output`; целевая переменная при включённом переключателе получает мягкое насыщение по `X S Capacity`, при выключенном — дословную прежнюю формулу.

### `sizing.signal.initial`
Число сохраняет прежнюю семантику для всех колоний. Объект обязан иметь ровно ключи `colonies`, конечное число на каждую колонию; соответствующий STOCK создаётся со своим значением.

## Отличия
От прототипа функциональных отличий генератора нет; комментарий в `simple_capital.js` сокращён без изменения формулы. Самотесты дополнительно сделаны version-independent для будущего accepted, где Power Resource Mine уже может присутствовать: validation-фрагмент временно снимается вместе со слоем узла для относительной проверки P2.

## Ограничения и замечания
Локальные прогоны недоступны в среде API-коннектора; непроверенное не выдаётся за проверенное. Замечаний к формулировке задания на КТ1 нет.

### Закрытие — 2026-09-29

- `main` при финальной сверке остался на `8bbec1f5276471da9e99c4c6aac1106e0747871b`; ветка задачи перед отчётным commit была 4 commits ahead / 0 behind.
- Diff ограничен разрешённым task scope и обязательным `REPORT_RU.md`; accepted ModelJSON, validation, policy, `model/nodes/*`, tools, vendor, workflow и engine не менялись.
- Локально не запускались `check_branch`, стенд, Windows RUN_LAB/CHECK_CANDIDATE и канонический reviewer-run. SHA256SUMS не пересобирались (`sums_by: reviewer`).
- GitHub Actions на кодовой голове `b045ad7…`: SUCCESS, включая NODE 21/21 и общий Bench PASS.
- После push настоящего report-only commit ожидается `ci.yml` для новой головы; проверка выполняется отдельным запросом, без длинного ожидания.
