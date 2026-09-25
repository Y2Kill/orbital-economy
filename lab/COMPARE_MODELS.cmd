@echo off
chcp 65001 >nul
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================================
echo Orbital Economy Lab v0.9.3 - accepted vs candidate comparison
echo ============================================================

if not exist "node_modules\simulation" (
  echo [ERROR] Dependencies are not installed. Run INSTALL.cmd first.
  pause
  exit /b 2
)

set "ACCEPTED=%~1"
set "CANDIDATE=%~2"
set "VALIDATION=%~3"
set "MODES=%~4"
if "%MODES%"=="" set "MODES=all"

if "%ACCEPTED%"=="" (
  echo Accepted:  auto from reference\accepted\model\
) else (
  echo Accepted:  %ACCEPTED%
)
if "%CANDIDATE%"=="" (
  echo Candidate: auto from input\model\
) else (
  echo Candidate: %CANDIDATE%
)
echo Modes:      %MODES%
echo.

if "%ACCEPTED%"=="" (
  node --expose-gc src\cli.js compare --modes=%MODES%
) else if "%CANDIDATE%"=="" (
  echo [ERROR] If accepted path is provided, candidate path must also be provided.
  pause
  exit /b 2
) else if "%VALIDATION%"=="" (
  node --expose-gc src\cli.js compare "%ACCEPTED%" "%CANDIDATE%" --modes=%MODES%
) else (
  node --expose-gc src\cli.js compare "%ACCEPTED%" "%CANDIDATE%" "%VALIDATION%" --modes=%MODES%
)
set RC=%ERRORLEVEL%

echo.
if "%RC%"=="0" (
  echo [OK] Comparison completed. Read COMPARISON RESULT above and model-comparison.md.
) else (
  echo [FAIL] Comparison could not be completed cleanly. Exit code %RC%.
)
pause
exit /b %RC%
