@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================================
echo Orbital Economy Lab v0.9.1 - dependency installation
echo ============================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found in PATH.
  echo Install Node.js 20 or newer, then run INSTALL.cmd again.
  pause
  exit /b 2
)
where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found in PATH.
  pause
  exit /b 2
)
node --version
call npm --version

echo.
echo Installing exact dependencies from package.json...
call npm install
if errorlevel 1 (
  echo.
  echo [ERROR] npm install failed.
  pause
  exit /b 2
)

echo.
echo [OK] Installation completed.
echo Recommended next step: SELF_TEST.cmd
pause
