@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ============================================================
echo Orbital Economy Lab v0.9.1 - model comparison integration QA
echo Runs two Mode 0 comparisons in a temporary directory.
echo ============================================================
if not exist node_modules\simulation\package.json (
  echo [ERROR] Dependencies are not installed. Run INSTALL.cmd first.
  pause
  exit /b 2
)
node --expose-gc src\compare_qa.js
set RC=%ERRORLEVEL%
echo.
if "%RC%"=="0" (
  echo [OK] MODEL COMPARISON QA PASSED
) else (
  echo [FAIL] MODEL COMPARISON QA FAILED. Exit code %RC%
)
pause
exit /b %RC%
