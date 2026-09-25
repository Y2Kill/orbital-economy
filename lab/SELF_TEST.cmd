@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ============================================================
echo Orbital Economy Lab v0.9.1 - self test
echo Runs the workspace model (input\model), Modes 0 and 12. No web CSV required.
echo ============================================================
if not exist "node_modules\simulation" (
  echo [ERROR] Dependencies are not installed. Run INSTALL.cmd first.
  pause
  exit /b 2
)
node --expose-gc src\cli.js lab --input="%~dp0input" --modes=0,12
set RC=%ERRORLEVEL%
echo.
if "%RC%"=="0" (echo [OK] SELF TEST PASSED) else (echo [FAIL] SELF TEST FAILED)
pause
exit /b %RC%
