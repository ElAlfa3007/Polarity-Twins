@echo off
REM Script para iniciar el servidor local del juego
REM Polarity Twins Build

echo.
echo ======================================
echo POLARITY TWINS - Game Server
echo ======================================
echo.

REM Verificar si Python está disponible
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no encontrado. Por favor instala Python 3.
    echo https://www.python.org/
    pause
    exit /b 1
)

echo [OK] Python encontrado
echo.
echo Iniciando servidor en http://localhost:8000
echo Presiona Ctrl+C para detener el servidor
echo.

REM Iniciar servidor
python -m http.server 8000

pause
