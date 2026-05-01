#!/bin/bash

# Obtener la ruta absoluta de la carpeta donde está el script
BASE_DIR=$(pwd)

# Función para detener todo al presionar Ctrl+C
trap "echo -e '\n🛑 Deteniendo servicios...'; kill %1 %2; sudo docker compose -f $BASE_DIR/backend/docker-compose.yml -p habi down; exit" SIGINT

echo "🧹 1/4. Limpiando contenedores antiguos..."
sudo docker rm -f habi_postgres 2>/dev/null || true

echo "🐳 2/4. Levantando base de datos (Docker)..."
sudo docker compose -f "$BASE_DIR/backend/docker-compose.yml" -p habi up -d

echo "🐍 3/4. Iniciando el Backend (FastAPI)..."
# Entramos a backend, activamos venv y lanzamos uvicorn usando la ruta del venv
cd "$BASE_DIR/backend"
source venv/bin/activate
# Usamos el binario de uvicorn directamente del venv para evitar el 'command not found'
./venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

echo "⚛️  4/4. Iniciando el Frontend (Next.js)..."
cd "$BASE_DIR/frontend"
# Lanzamos npm run dev y redirigimos errores a la consola
npm run dev &
FRONTEND_PID=$!

echo "=============================================================================="
echo "✅ Entorno Iniciado Exitosamente"
echo "🌐 Frontend: http://localhost:3000"
echo "⚙️  Backend Docs: http://127.0.0.1:8000/docs"
echo "=============================================================================="

# Volver a la raíz y esperar a los procesos
cd "$BASE_DIR"
wait $BACKEND_PID $FRONTEND_PID