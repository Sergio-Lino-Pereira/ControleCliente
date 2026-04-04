@echo off
echo ==========================================
echo INICIANDO O BACKEND E O TUNEL NA INTERNET
echo ==========================================

cd /d "%~dp0"

echo [1/2] Iniciando o Servidor (npm run dev)...
start cmd /k "npm run dev"

echo [2/2] Abrindo o Tunel (localtunnel)...
start cmd /k "npx --yes localtunnel --port 3001 --subdomain sergio-agendador"

echo Tudo pronto! O Backend esta rodando e exposto na internet.
echo Mantenha as duas telas pretas abertas para que seu aplicativo funcione.
pause
