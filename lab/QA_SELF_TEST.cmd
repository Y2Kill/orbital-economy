@echo off
setlocal
cd /d "%~dp0"
echo ============================================================
echo Orbital Economy Lab v0.9.2 - automated harness QA
echo Tests error handling in disposable temporary folders.
echo Does NOT modify input or output working data.
echo ============================================================
if not exist node_modules\simulation\package.json (
  echo [ERROR] Dependencies are not installed. Run INSTALL.cmd first.
  pause
  exit /b 2
)
node --expose-gc src\qa.js
set RC=%ERRORLEVEL%
echo.
if "%RC%"=="0" (
  echo [OK] HARNESS QA PASSED
) else (
  echo [FAIL] HARNESS QA FAILED. Exit code %RC%
)
pause
exit /b %RC%
