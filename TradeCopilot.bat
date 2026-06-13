@echo off
REM ============================================================
REM  TradeCopilot launcher — double-click to start the app.
REM  - If already running, just opens the browser.
REM  - Otherwise starts the server and opens the browser.
REM  Close this window (or press Ctrl+C) to stop the server.
REM ============================================================
cd /d "%~dp0"

REM If something already answers on port 8000, just open the browser.
powershell -NoProfile -Command "try { $c=New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1',8000); $c.Close(); exit 0 } catch { exit 1 }"
if %errorlevel%==0 (
  echo TradeCopilot is already running. Opening browser...
  start "" http://127.0.0.1:8000
  timeout /t 2 >nul
  exit /b
)

echo Starting TradeCopilot...
echo A browser tab will open automatically in a few seconds.
echo Keep this window open while you use the app; close it to stop.
echo.

REM Open the browser shortly after, in the background, without blocking.
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 5; Start-Process 'http://127.0.0.1:8000'"

REM Run the server in the foreground (logs show here).
".venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000

echo.
echo Server stopped. Press any key to close this window.
pause >nul
