@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ============================================================
echo Orbital Economy Lab v0.9.1 - lifecycle conformance QA
echo Static negative tests on mutated copies of the accepted model
echo + runtime kernel identities on a real Mode 0 run.
echo Does NOT modify production input/output.
echo ============================================================
if not exist node_modules\simulation\package.json (
  echo [ERROR] Dependencies are not installed. Run INSTALL.cmd first.
  pause
  exit /b 2
)
node --expose-gc src\conformance_qa.js
set RC=%ERRORLEVEL%
echo.
if "%RC%"=="0" (
  echo [OK] CONFORMANCE QA PASSED
) else (
  echo [FAIL] CONFORMANCE QA FAILED. Exit code %RC%
)
pause
exit /b %RC%
