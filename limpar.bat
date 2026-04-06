@echo off
echo ==========================================
echo LIMPANDO AMBIENTE (ENCERRANDO PROCESSOS)
echo ==========================================
echo.

echo [1/2] Encerrando processos do Node.js...
taskkill /f /im node.exe /t 2>nul
if %errorlevel% equ 0 (
    echo Processos do Node.js encerrados com sucesso.
) else (
    echo Nenhum processo do Node.js estava em execucao.
)

echo.
echo [2/2] Encerrando terminais cmd.exe (exceto este)...
echo Voce precisara reabrir as janelas de comando apos este passo.
echo.
echo Limpeza concluida! 
echo Agora voce pode rodar o 'iniciar.bat' ou 'backend/LigarServidor.bat' novamente.
pause
