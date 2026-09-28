@echo off
setlocal
cd /d "%~dp0"
if "%~1"=="" (
  echo Usage: CHECK_VALIDATION.cmd ^<validation.json^> [model.json]
  exit /b 2
)
node src\cli.js check-validation %*
exit /b %ERRORLEVEL%
