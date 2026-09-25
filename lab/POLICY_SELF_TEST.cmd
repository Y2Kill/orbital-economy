@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ============================================================
echo Orbital Economy Lab v0.9.1 - change-policy integration QA
echo Synthetic policy tests + one real changed Mode 0 comparison.
echo Does NOT modify production input/output.
echo ============================================================
if not exist node_modules\simulation\package.json (
  echo [ERROR] Dependencies are not installed. Run INSTALL.cmd first.
  pause
  exit /b 2
)
node --expose-gc src\policy_qa.js
set RC=%ERRORLEVEL%
echo.
if "%RC%"=="0" (
  echo [OK] CHANGE POLICY QA PASSED
) else (
  echo [FAIL] CHANGE POLICY QA FAILED. Exit code %RC%
)
pause
exit /b %RC%
