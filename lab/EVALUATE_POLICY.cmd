@echo off
chcp 65001 >nul
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================================
echo Orbital Economy Lab v0.9.1 - evaluate existing comparison
echo No simulations are run; evaluates model-comparison.json only.
echo ============================================================

if "%~1"=="" (
  echo Usage:
  echo   EVALUATE_POLICY.cmd "output\compare-...\model-comparison.json"
  echo Optional second argument: explicit change-policy JSON.
  pause
  exit /b 2
)

set "COMPARISON=%~1"
set "POLICY=%~2"
if "%POLICY%"=="" (
  node src\cli.js evaluate-policy "%COMPARISON%"
) else (
  node src\cli.js evaluate-policy "%COMPARISON%" "%POLICY%"
)
set RC=%ERRORLEVEL%

echo.
if "%RC%"=="0" (
  echo [OK] Policy evaluation PASSED.
) else (
  echo [FAIL] Policy evaluation FAILED. Exit code %RC%.
)
pause
exit /b %RC%
