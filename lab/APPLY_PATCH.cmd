@echo off
chcp 65001 >nul
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================================
echo Orbital Economy Lab v0.9.2 - apply model patch
echo accepted ModelJSON + declarative patch = candidate ModelJSON
echo ============================================================

if not exist "node_modules\simulation" (
  echo [ERROR] Dependencies are not installed. Run INSTALL.cmd first.
  pause
  exit /b 2
)

set "PATCH=%~1"
set "OUT=%~2"
if "%PATCH%"=="" (
  echo Usage: APPLY_PATCH.cmd "path\to\model-patch.json" ["path\to\candidate.json"]
  echo Base is always reference\accepted\model\ ^(the frozen accepted model^).
  pause
  exit /b 2
)
if "%OUT%"=="" (
  node src\cli.js apply-patch "%PATCH%"
) else (
  node src\cli.js apply-patch "%PATCH%" --out="%OUT%"
)
set RC=%ERRORLEVEL%

echo.
if "%RC%"=="0" (
  echo [OK] Candidate written. Put it as the single JSON in input\model\ and run RUN_LAB.cmd / CHECK_CANDIDATE.cmd.
) else (
  echo [FAIL] Patch could not be applied. Exit code %RC%.
)
pause
exit /b %RC%
