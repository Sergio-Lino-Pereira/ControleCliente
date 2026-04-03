@echo off
echo =======================================================
echo Iniciando o ControleCliente (Frontend e Backend)
echo =======================================================
echo.

echo Iniciando o servidor Backend...
start "ControleCliente - Backend" cmd /k "cd backend && npm run dev"

echo Iniciando o servidor Frontend...
start "ControleCliente - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Aplicação iniciada! DUAS novas janelas do terminal foram abertas.
echo Pode fechar esta janela agora.
pause
