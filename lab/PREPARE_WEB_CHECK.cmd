@echo off
chcp 65001 >nul
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================================
echo Orbital Economy Lab v0.9.2 - prepare web cross-check batch
echo ============================================================

if not exist "node_modules\simulation" (
  echo [ERROR] Dependencies are not installed. Run INSTALL.cmd first.
  pause
  exit /b 2
)

node src\cli.js prepare-web --input="%~dp0input"
set RC=%ERRORLEVEL%
echo.
if "%RC%"=="0" (
  echo [OK] Batch prepared. Export fresh browser CSV files into input\web_reference\pending\
) else (
  echo [FAIL] Batch was not prepared.
)
pause
exit /b %RC%
