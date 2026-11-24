@echo off
cd /d "%~dp0"
echo Iniciando servidor local...
start "Piano de Blocos - servidor" python serve.py
timeout /t 2 >nul
echo.
echo Criando link HTTPS publico (procure a linha https://....trycloudflare.com abaixo)
echo Esse link funciona em qualquer computador com internet.
echo.
npx -y cloudflared tunnel --url http://localhost:8000
pause
