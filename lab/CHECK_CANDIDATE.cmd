@echo off
chcp 65001 >nul
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================================
echo Orbital Economy Lab v0.9.2 - candidate policy check
echo accepted vs candidate + explicit change contract
echo ============================================================

if not exist "node_modules\simulation" (
  echo [ERROR] Dependencies are not installed. Run INSTALL.cmd first.
  pause
  exit /b 2
)

set "ACCEPTED=%~1"
set "CANDIDATE=%~2"
set "VALIDATION=%~3"
set "POLICY=%~4"
set "MODES=%~5"
if "%MODES%"=="" set "MODES=all"

if "%ACCEPTED%"=="" (
  echo Accepted:   auto from reference\accepted\model\
) else (
  echo Accepted:   %ACCEPTED%
)
if "%CANDIDATE%"=="" (
  echo Candidate:  auto from input\model\
) else (
  echo Candidate:  %CANDIDATE%
)
if "%VALIDATION%"=="" (
  echo Validation: auto from input\validation\
) else (
  echo Validation: %VALIDATION%
)
if "%POLICY%"=="" (
  echo Policy:     auto from input\policy\
) else (
  echo Policy:     %POLICY%
)
echo Modes:      %MODES%
echo.

if "%ACCEPTED%"=="" (
  node --expose-gc src\cli.js policy --modes=%MODES%
) else if "%CANDIDATE%"=="" (
  echo [ERROR] If accepted path is provided, candidate path must also be provided.
  pause
  exit /b 2
) else if "%VALIDATION%"=="" (
  node --expose-gc src\cli.js policy "%ACCEPTED%" "%CANDIDATE%" --modes=%MODES%
) else if "%POLICY%"=="" (
  node --expose-gc src\cli.js policy "%ACCEPTED%" "%CANDIDATE%" "%VALIDATION%" --modes=%MODES%
) else (
  node --expose-gc src\cli.js policy "%ACCEPTED%" "%CANDIDATE%" "%VALIDATION%" "%POLICY%" --modes=%MODES%
)
set RC=%ERRORLEVEL%

echo.
if "%RC%"=="0" (
  echo [OK] Candidate conforms to the active change policy.
) else (
  echo [FAIL] Candidate does not conform to the active change policy, or the check could not complete. Exit code %RC%.
)
pause
exit /b %RC%
