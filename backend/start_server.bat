@echo off
echo =============================================
echo  SEI-Com AI - Inicializacao do Backend
echo =============================================

REM Navegar para o diretorio backend
cd /d "%~dp0"

REM Configurar variavel de ambiente para usar SQLite
set ENVIRONMENT=test

REM Verificar se esta no diretorio correto
if not exist "app\main.py" (
    echo ❌ ERRO: Arquivo app\main.py nao encontrado
    echo    Verifique se esta no diretorio backend/
    pause
    exit /b 1
)

echo ✅ Diretorio correto confirmado
echo ✅ Configuracao: SQLite (test mode)
echo.
echo 🚀 Iniciando servidor FastAPI...
echo    URL: http://127.0.0.1:8000
echo    Docs: http://127.0.0.1:8000/docs
echo.
echo ⏹️  Para parar: Ctrl+C
echo.

REM Iniciar servidor
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

echo.
echo 🔴 Servidor finalizado
pause 