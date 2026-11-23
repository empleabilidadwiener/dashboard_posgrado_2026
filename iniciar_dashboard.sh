#!/bin/bash
echo "========================================"
echo "  Dashboard de Egresados 2026"
echo "========================================"
echo ""
PORT=8080

# Si el puerto 8080 ya está en uso, liberarlo automáticamente
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "El servidor ya estaba activo en el puerto $PORT. Reiniciando..."
    fuser -k $PORT/tcp 2>/dev/null || kill -9 $(lsof -t -i:$PORT) 2>/dev/null
    sleep 1
fi

echo "Iniciando servidor local con tipos MIME correctos..."
echo "Abre en tu navegador: http://localhost:$PORT"
echo ""
echo "Presiona Ctrl+C para detener"
echo "========================================"
echo ""
python3 server.py
