@echo off
echo Iniciando Sistema de Gestao de Tarefas...
echo.

echo 1. Verificando dependencias...
call npm install

echo.
echo 2. Iniciando servidor...
node server.js

pause