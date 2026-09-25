# Отчёт исполнителя — задача 005

## Среда

1. **Запись в `.github/workflows/`: да.** Коннектор даёт запись в репозиторий через Git data API / Contents API. Этот первый commit содержит минимальный `.github/workflows/ci.yml`; успешное продвижение `task/005-ci` на этот commit является практической проверкой права записывать workflow-файлы.
2. **Чтение GitHub Actions run/job/steps/logs: да, подтверждено end-to-end.** Probe run `36156914140` завершился `success`; через коннектор прочитаны job `probe` (`108143580581`), его шаги и полный decoded job log, включая строку `Task 005 Actions environment probe`.

Начальная точка ветки: `main@7c676b7c4e75edfca34ebd590e4a9cff97d35f5b`.

SHA256SUMS не изменяются (`sums_by: reviewer`).


## Реализация

- `ci.yml`: push на `main` и `task/**` + manual dispatch; concurrency отменяет предыдущий run той же ветки.
- `guard`: по имени `task/NNN-...` извлекается `NNN`, после явного fetch `origin/main` там должен существовать ровно один `docs/tasks/NNN-*/scope.json`; затем запускается штатный `check_branch.mjs`.
- `integrity`: только `main`, `build_sums.mjs --check`.
- `tools-selftest`: всегда, штатный `tools/selftest.sh`.
- `bench-selftests`: всегда; зависимости устанавливаются из двух vendored tarball'ов через отдельный временный npm cache + `npm ci --offline`, затем QA / STRUCTURE / CONFORMANCE / POLICY / COMPARE / Modes 0,12 прямыми node-командами из соответствующих .cmd.
- Node во всех jobs: ровно 24.11.1. Используются только официальные GitHub actions, закреплённые SHA: checkout v4.2.2, setup-node v4.4.0; для full-run также upload-artifact v4.6.2.
- permissions на уровне workflow: `contents: read`; secrets и node_modules cache не используются.

### Bootstrap полного прогона

Новый `workflow_dispatch` workflow до попадания на default branch нельзя надёжно запустить кнопкой/API из этой connector-среды. Поэтому только для первого собственного прогона промежуточная версия `bench-full.yml` дополнительно слушает push в `task/005-ci`. После подтверждённого run этот временный trigger будет удалён; финальный `bench-full.yml` останется только `workflow_dispatch`, как требует задание.

## Linux / переносимость

Ожидается по результатам Actions; если падение окажется дефектом стенда, здесь будет записан лог, причина и исправление. До такого сигнала `lab/src/` не меняется.

## Запуски

- Проверка среды: https://github.com/Y2Kill/orbital-economy/actions/runs/36156914140 — success.
- Финальный push CI: будет добавлен после прогона.
- Bench full: будет добавлен после прогона.

## Что не запускалось локально

Локального checkout/Node у агента по-прежнему нет; все исполняемые проверки этой задачи выполняются GitHub Actions. SUMS не пересобирались (`sums_by: reviewer`).


### Первый CI-прогон: найдено и исправлено

Run https://github.com/Y2Kill/orbital-economy/actions/runs/36157251993: `guard` прошёл, offline install и первые bench self-tests прошли, но `tools-selftest` упал. Лог показал первопричину: sandbox внутри `tools/selftest.sh` клонирует текущий checkout и ожидает локальную ветку `main`; checkout task-ветки имел `origin/main`, но не `refs/heads/main`, поэтому sandbox получал пустую/nonexistent main и каскад ENOENT. `tools/` не менялся. В job добавлена подготовка локальной `main` из `origin/main` перед запуском штатного selftest.
