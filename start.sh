#!/bin/bash

# Colores para mejor legibilidad
GREEN='\039[0;32m'
BLUE='\039[0;34m'
RED='\039[0;31m'
NC='\039[0m'

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}   Iniciando Sistema de Recetas Laravel    ${NC}"
echo -e "${BLUE}===========================================${NC}"

# 1. Comprobaciones de entorno (Modo Evaluación)
echo -e "${GREEN}[1/4] Verificando entorno y dependencias...${NC}"

# Backend (PHP/Composer)
if [ ! -f "backend-recetas/.env" ]; then
    echo "      -> Copiando .env de ejemplo en Backend..."
    cp backend-recetas/.env.example backend-recetas/.env
fi

if [ ! -d "backend-recetas/vendor" ]; then
    echo "      -> Instalando dependencias Backend (Composer)..."
    cd backend-recetas && composer install && cd ..
fi

# Frontend (Node/React)
if [ ! -f "frontend-recetas/.env" ]; then
    echo "      -> Creando .env en Frontend..."
    echo "VITE_API_URL=http://localhost:8000/api" > frontend-recetas/.env
fi

if [ ! -d "frontend-recetas/node_modules" ]; then
    echo "      -> Instalando dependencias Frontend (NPM)..."
    cd frontend-recetas && npm install && cd ..
fi

# 2. Base de Datos
echo -e "${GREEN}[2/4] Recordatorio de Base de Datos:${NC}"
echo "      - Nombre de DB esperado: recetas_db"
echo "      - Importa el archivo recetas_db.sql si está vacío."

# 3. Limpiar puertos
echo -e "${GREEN}[3/4] Liberando puertos...${NC}"
lsof -i :8000 | awk 'NR>1 {print $2}' | xargs kill -9 > /dev/null 2>&1
lsof -i :5173 | awk 'NR>1 {print $2}' | xargs kill -9 > /dev/null 2>&1

# 4. Lanzar Servidores
echo -e "${GREEN}[4/4] Levantando Servidores...${NC}"
cd backend-recetas/public
# Ejecutamos PHP en background
php -S 127.0.0.1:8000 server.php &
PHP_PID=$!
cd ../../

cd frontend-recetas
# Ejecutamos Vite en foreground para ver los logs
echo -e "${BLUE}>>> Frontend corriendo en: http://localhost:5173${NC}"
echo -e "${BLUE}>>> (Presiona Ctrl+C para detener ambos servidores)${NC}"
npm run dev

# Al presionar Ctrl+C para detener Vite, matar también el server PHP
kill $PHP_PID
echo -e "${RED}Servidores apagados.${NC}"
