@echo off
echo ===========================================
echo INICIANDO BACKEND - SERVIDOR PERMANENTE
echo ===========================================
echo.
echo DICA: Se o servidor estiver instavel, rode o 'limpar.bat' na raiz primeiro.
echo.

cd /d "%~dp0"

echo [1/2] Iniciando o Servidor Node.js...
start "Servidor Backend" cmd /k "npm run dev"

echo.
echo [2/2] Iniciando o Tunel Ngrok (PERMANENTE)...
echo Link fixo: https://lichenoid-kaia-photophilous.ngrok-free.dev
echo.

:: Configura o Authtoken e tenta iniciar o tunel em uma janela que permanece aberta para mostrar erros
start "Tunel Ngrok" cmd /k "echo Configurando token... && npx --yes ngrok config add-authtoken 3ByuteNtjAAlbkOpBfjmqhyVJdF_d7jzhMeKduaZhxa1Leim && echo. && echo Iniciando tunel no dominio... && npx --yes ngrok http --domain=lichenoid-kaia-photophilous.ngrok-free.dev 3001 || pause"

echo.
echo Tudo pronto! O Backend esta online.
echo OBS: Se a janela do Ngrok fechar, verifique o erro nela antes.
pause



