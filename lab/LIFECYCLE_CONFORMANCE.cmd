@echo off
chcp 65001 >nul
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================================
echo Orbital Economy Lab v0.9.1 - Capital Lifecycle Kernel conformance
echo static topology / wiring check, no simulation
echo ============================================================

if not exist "node_modules\simulation" (
  echo [ERROR] Dependencies are not installed. Run INSTALL.cmd first.
  pause
  exit /b 2
)

set "MODEL=%~1"
set "VALIDATION=%~2"

if "%MODEL%"=="" (
  echo Model:      auto from input\model\
  echo Validation: auto from input\validation\
  node src\cli.js conformance
) else if "%VALIDATION%"=="" (
  echo Model:      %MODEL%
  echo Validation: auto from input\validation\
  node src\cli.js conformance "%MODEL%"
) else (
  echo Model:      %MODEL%
  echo Validation: %VALIDATION%
  node src\cli.js conformance "%MODEL%" "%VALIDATION%"
)
set RC=%ERRORLEVEL%

echo.
if "%RC%"=="0" (
  echo [OK] All kernel instances conform.
) else (
  echo [FAIL] Kernel conformance failed or could not complete. Exit code %RC%.
)
pause
exit /b %RC%
