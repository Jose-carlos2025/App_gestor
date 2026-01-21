Write-Host "Iniciando Sistema de Gestao de Tarefas..." -ForegroundColor Green
Write-Host ""

Write-Host "1. Verificando dependencias..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "2. Iniciando servidor..." -ForegroundColor Yellow
node server.js