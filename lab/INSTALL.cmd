@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================================
echo Orbital Economy Lab v0.9.3 - vendored offline dependency installation
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

set "OE_NPM_CACHE=%TEMP%\orbital-economy-npm-cache-%RANDOM%-%RANDOM%"
if exist "%OE_NPM_CACHE%" rmdir /s /q "%OE_NPM_CACHE%"
mkdir "%OE_NPM_CACHE%" >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Cannot create temporary npm cache: %OE_NPM_CACHE%
  pause
  exit /b 2
)

echo.
echo Seeding a temporary npm cache from lab\vendor\...
call npm cache add ".\vendor\simulation-9.0.0.tgz" ".\vendor\csv-parse-5.6.0.tgz" --cache "%OE_NPM_CACHE%"
if errorlevel 1 (
  echo.
  echo [ERROR] Cannot seed the temporary cache from vendored tarballs.
  rmdir /s /q "%OE_NPM_CACHE%" >nul 2>nul
  pause
  exit /b 2
)

echo.
echo Installing exact dependencies from package-lock.json, offline...
call npm ci --offline --cache "%OE_NPM_CACHE%"
if errorlevel 1 (
  echo.
  echo [ERROR] npm ci --offline failed.
  rmdir /s /q "%OE_NPM_CACHE%" >nul 2>nul
  pause
  exit /b 2
)

rmdir /s /q "%OE_NPM_CACHE%" >nul 2>nul

echo.
echo [OK] Offline installation completed from lab\vendor\.
echo Recommended next step: SELF_TEST.cmd
pause
