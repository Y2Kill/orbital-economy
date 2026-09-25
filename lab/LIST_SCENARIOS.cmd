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
node src\cli.js list "%MODEL%"
pause
