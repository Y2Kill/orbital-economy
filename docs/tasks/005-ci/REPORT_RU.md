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

Linux-прогон не выявил дефектов стенда. На Ubuntu 24.04 / Node 24.11.1 без изменений `lab/src/` прошли offline install, QA 30/30, STRUCTURE 21/21, CONFORMANCE 18/18, POLICY 10/10, COMPARE, Modes 0/12 и полный прогон всех 27 Modes. Поэтому Lab остаётся v0.9.3; оснований для v0.9.4 нет.

Единственная найденная Linux/Actions-специфика была не в Lab, а в окружении `tools/selftest.sh`: task checkout имел `origin/main`, но не локальную ветку `main`. Это исправлено только в workflow материализацией локальной `main` перед selftest; `tools/` не изменялся.

## Запуски

- Проверка среды: https://github.com/Y2Kill/orbital-economy/actions/runs/36156914140 — **success**; подтверждены run → job → steps → decoded logs.
- Push CI после исправления окружения: https://github.com/Y2Kill/orbital-economy/actions/runs/36157360138 — **success**, примерно 2 мин 15 с. Guard PASS; tools self-test 23/23; QA 30/30; STRUCTURE 21/21; CONFORMANCE 18/18; POLICY 10/10; COMPARE PASS; Modes 0/12 `OVERALL: PASS`.
- Bench full: https://github.com/Y2Kill/orbital-economy/actions/runs/36157360135 — **success**, примерно 8 мин 50 с. `OVERALL: PASS` (27/27), `COMPARISON RESULT: BYTE_IDENTICAL`, `POLICY RESULT: PASS`.
- Artifact полного прогона: https://github.com/Y2Kill/orbital-economy/actions/runs/36157360135/artifacts/10875155033 — `bench-full-36157360135`, 68 057 байт, digest `sha256:22c70512c1ac9dbc44a18d0772ca2625f1e582023ca4ee0cd1556cd391efca67`.

После подтверждения полного прогона временный bootstrap-trigger `push: task/005-ci` из `bench-full.yml` удалён. Финальная версия этого workflow запускается только вручную через `workflow_dispatch` с параметром `ref`.

## Что не запускалось локально

Локального checkout/Node у агента по-прежнему нет; все исполняемые проверки этой задачи выполняются GitHub Actions. SUMS не пересобирались (`sums_by: reviewer`).


### Первый CI-прогон: найдено и исправлено

Run https://github.com/Y2Kill/orbital-economy/actions/runs/36157251993: `guard` прошёл, offline install и первые bench self-tests прошли, но `tools-selftest` упал. Лог показал первопричину: sandbox внутри `tools/selftest.sh` клонирует текущий checkout и ожидает локальную ветку `main`; checkout task-ветки имел `origin/main`, но не `refs/heads/main`, поэтому sandbox получал пустую/nonexistent main и каскад ENOENT. `tools/` не менялся. В job добавлена подготовка локальной `main` из `origin/main` перед запуском штатного selftest.
