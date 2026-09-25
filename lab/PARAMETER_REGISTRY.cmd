@echo off
chcp 65001 >nul
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================================
echo Orbital Economy Lab v0.9.2 - exogenous parameter registry
echo inventory generated from the model + hand-written annotations
echo ============================================================

if not exist "node_modules\simulation" (
  echo [ERROR] Dependencies are not installed. Run INSTALL.cmd first.
  pause
  exit /b 2
)

set "ANN=%~1"
if "%ANN%"=="" if exist "..\docs\PARAMETER_ANNOTATIONS.json" set "ANN=..\docs\PARAMETER_ANNOTATIONS.json"
if "%ANN%"=="" (
  echo Annotations: none ^(pass a path to PARAMETER_ANNOTATIONS.json as the first argument^)
  node src\cli.js parameters
) else (
  echo Annotations: %ANN%
  node src\cli.js parameters --annotations="%ANN%"
)
set RC=%ERRORLEVEL%
echo.
if "%RC%"=="0" (echo [OK] Registry written to output\parameters-...) else (echo [FAIL] Exit code %RC%.)
pause
exit /b %RC%
