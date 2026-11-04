@echo off
setlocal
where py.exe >nul 2>&1
if errorlevel 1 (
  echo Python fehlt. Bitte Python 3.9 oder neuer von https://www.python.org/downloads/windows/ installieren.
  echo Danach PRUEFEN.cmd erneut oeffnen.
  pause
  exit /b 1
)
py -3 "%~dp0collect_iphone.py" check
set "CRYPTOID_EXIT=%errorlevel%"
pause
exit /b %CRYPTOID_EXIT%
