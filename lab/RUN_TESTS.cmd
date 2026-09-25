@echo off
chcp 65001 >nul
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================================
echo Orbital Economy Lab v0.9.3 - advanced explicit-path runner
echo ============================================================

set "MODEL=%~1"
if "%MODEL%"=="" (
  echo Enter full path to ModelJSON file:
  set /p "MODEL=> "
)
if not exist "%MODEL%" (
  echo [ERROR] Model file not found: %MODEL%
  pause
  exit /b 2
)

set "VALIDATION=%~2"
if "%VALIDATION%"=="" for %%F in ("%~dp0input\validation\*.json") do set "VALIDATION=%%~fF"
if not exist "%VALIDATION%" (
  echo [ERROR] Validation file not found: %VALIDATION%
  pause
  exit /b 2
)

set "MODES=%~3"
if "%MODES%"=="" set "MODES=all"

set "WEBREF=%~4"

echo.
echo Running explicit-path validation...
echo.
if "%WEBREF%"=="" (
  node --expose-gc src\cli.js test "%MODEL%" "%VALIDATION%" --modes=%MODES%
) else (
  node --expose-gc src\cli.js test "%MODEL%" "%VALIDATION%" --modes=%MODES% --web-reference="%WEBREF%"
)
set RC=%ERRORLEVEL%

echo.
echo ============================================================
if "%RC%"=="0" (echo TEST RUN COMPLETED WITHOUT FAIL STATUS) else (echo TEST RUN RETURNED FAIL)
echo ============================================================
pause
exit /b %RC%
