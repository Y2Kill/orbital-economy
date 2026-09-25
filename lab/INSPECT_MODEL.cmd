@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set "MODEL=%~1"
if "%MODEL%"=="" (
  echo Enter full path to ModelJSON file:
  set /p "MODEL=> "
)
if not exist "%MODEL%" (
  echo [ERROR] File not found: %MODEL%
  pause
  exit /b 2
)
node --expose-gc src\cli.js inspect "%MODEL%"
set RC=%ERRORLEVEL%
echo.
if "%RC%"=="0" (echo [OK] Static validation passed.) else (echo [FAIL] Static validation failed.)
pause
exit /b %RC%
