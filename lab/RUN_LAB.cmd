@echo off
chcp 65001 >nul
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================================
echo Orbital Economy Lab v0.9.1 - workspace test runner
echo ============================================================

if not exist "node_modules\simulation" (
  echo [ERROR] Dependencies are not installed. Run INSTALL.cmd first.
  pause
  exit /b 2
)

node --expose-gc src\cli.js lab --input="%~dp0input"
set RC=%ERRORLEVEL%

echo.
echo ============================================================
if "%RC%"=="0" (
  echo TEST RUN COMPLETED WITHOUT FAIL STATUS
) else (
  echo TEST RUN RETURNED FAIL
)
echo ============================================================
pause
exit /b %RC%
