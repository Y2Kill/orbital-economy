@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ============================================================
echo Orbital Economy Lab v0.9.5 - algebraic-loop QA
echo Switch-aware static audit, 13 cases including engine agreement.
echo Does NOT modify production input/output.
echo ============================================================
if not exist node_modules\simulation\package.json (
  echo [ERROR] Dependencies are not installed. Run INSTALL.cmd first.
  pause
  exit /b 2
)
node --expose-gc src\loop_qa.js
set RC=%ERRORLEVEL%
echo.
if "%RC%"=="0" (
  echo [OK] LOOP QA PASSED
) else (
  echo [FAIL] LOOP QA FAILED. Exit code %RC%
)
pause
exit /b %RC%
