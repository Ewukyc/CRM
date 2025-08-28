@echo off
chcp 65001 >nul
title CRM Project Starter

echo ==========================
echo    Запуск CRM проекта
echo ==========================

echo [1/2] Запуск API (порт 3000)...
start cmd /k "cd /d E:\CRM\CRM\api && npm start"

echo [2/2] Запуск UI (порт 5173)...
start cmd /k "cd /d E:\CRM\CRM\app-ui && npm run dev -- --open"

echo --------------------------
echo Оба процесса запущены!
echo API: http://localhost:3000/api/health
echo UI:  http://localhost:5173
echo --------------------------
pause
