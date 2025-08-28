@echo off
REM === Порты: API 3000, CODEX 4000, UI 5173 ===
cd /d E:\CRM\CRM

REM Codex (если у тебя свой — замени команду запуска)
start "CODEX" cmd /k "cd /d E:\CRM\CRM\codex && npm start"

REM API
start "API" cmd /k "cd /d E:\CRM\CRM\api && npm start"

REM Небольшая пауза
timeout /t 2 >nul

REM UI
start "UI" cmd /k "cd /d E:\CRM\CRM\app-ui && npm run dev -- --port 5173"

start "" http://localhost:5173
