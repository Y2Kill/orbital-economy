@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ============================================================
echo Orbital Economy Lab v0.9.6 - Planet v1 closure QA
echo Per-process P2-P6 declaration audit, 16 cases.
echo Does NOT modify production input/output.
echo ============================================================
if not exist node_modules\simulation\package.json (
  echo [ERROR] Dependencies are not installed. Run INSTALL.cmd first.
  pause
  exit /b 2
)
node --expose-gc src\planet_qa.js
set RC=%ERRORLEVEL%
echo.
if "%RC%"=="0" (
  echo [OK] PLANET QA PASSED
) else (
  echo [FAIL] PLANET QA FAILED. Exit code %RC%
)
pause
exit /b %RC%
