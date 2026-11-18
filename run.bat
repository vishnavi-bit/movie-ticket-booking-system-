@echo off
rem ============================================================
rem  Movie Ticket Booking - double-click to run
rem  1. Goes to this project folder
rem  2. Starts a local web server on http://localhost:8000
rem  3. Opens the website in Google Chrome (or your default browser)
rem  4. Keeps this window open while the server runs
rem ============================================================
title Movie Ticket Booking - Server
setlocal
cd /d "%~dp0"
set "PORT=8000"
set "URL=http://localhost:%PORT%/index.html"

echo ================================================
echo    Movie Ticket Booking - Local Server
echo ================================================
echo Project folder : %CD%
echo Website address: %URL%
echo.

where python >nul 2>nul
if not errorlevel 1 goto use_python

where node >nul 2>nul
if not errorlevel 1 goto use_node

echo [ERROR] Neither Python nor Node.js was found on this computer.
echo Install Python from https://www.python.org  (or Node.js from https://nodejs.org)
echo Then double-click run.bat again.
echo.
pause
exit /b 1

:use_python
set "SERVER_CMD=python -m http.server %PORT% --bind 127.0.0.1"
goto start_server

:use_node
set "SERVER_CMD=npx --yes http-server -p %PORT% -a 127.0.0.1 -c-1"
goto start_server

:start_server
echo [STATUS] Starting server:  %SERVER_CMD%
echo [STATUS] Server is starting... the browser will open in about 2 seconds.
echo.
echo ------------------------------------------------
echo  SERVER RUNNING. Keep this window open.
echo  To STOP the server, press  Ctrl + C  here,
echo  then type  Y  and press Enter.
echo ------------------------------------------------
echo.

rem Open Chrome if installed, otherwise the default browser (runs in the background)
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; $c = @(Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe', Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe') | Where-Object { Test-Path $_ } | Select-Object -First 1; if ($c) { Start-Process $c -ArgumentList '%URL%' } else { Start-Process '%URL%' }"

rem Run the server in this window (requests are logged here)
%SERVER_CMD%

echo.
echo [STATUS] Server stopped.
echo If it stopped with an error such as "address already in use", port %PORT% is busy:
echo close the other program using it and run this file again.
echo.
pause
endlocal
