@echo off
setlocal
where py.exe >nul 2>&1
if errorlevel 1 (
  echo Bitte zuerst PRUEFEN.cmd ausfuehren und Python einrichten.
  pause
  exit /b 1
)
py -3 "%~dp0collect_iphone.py" record
set "CRYPTOID_EXIT=%errorlevel%"
pause
exit /b %CRYPTOID_EXIT%
