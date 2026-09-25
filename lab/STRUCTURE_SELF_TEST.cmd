@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ============================================================
echo Orbital Economy Lab v0.9.1 - structure audit QA
echo open_boundaries + colony_symmetry negative tests on mutated copies
echo of the accepted model. No simulation.
echo Does NOT modify production input/output.
echo ============================================================
if not exist node_modules\simulation\package.json (
  echo [ERROR] Dependencies are not installed. Run INSTALL.cmd first.
  pause
  exit /b 2
)
node --expose-gc src\structure_qa.js
set RC=%ERRORLEVEL%
echo.
if "%RC%"=="0" (
  echo [OK] STRUCTURE QA PASSED
) else (
  echo [FAIL] STRUCTURE QA FAILED. Exit code %RC%
)
pause
exit /b %RC%
