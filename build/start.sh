#!/bin/bash

echo ""
echo "======================================"
echo "POLARITY TWINS - Game Server"
echo "======================================"
echo ""

# Verificar si Python está disponible
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "[ERROR] Python no encontrado. Por favor instala Python 3."
        echo "https://www.python.org/"
        exit 1
    fi
    PYTHON=python
else
    PYTHON=python3
fi

echo "[OK] Python encontrado"
echo ""
echo "Iniciando servidor en http://localhost:8000"
echo "Presiona Ctrl+C para detener el servidor"
echo ""

# Iniciar servidor
$PYTHON -m http.server 8000
