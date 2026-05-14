@echo off
echo ===================================
echo   知识卡牌对战 - 本地启动
echo ===================================
echo.
echo 请确保已安装 Node.js (https://nodejs.org)
echo.

REM Default port
set PORT=3000
if not "%1"=="" set PORT=%1

echo 启动服务器: http://localhost:%PORT%
echo 按 Ctrl+C 停止
echo.

node serve.mjs %PORT%
pause
