#!/bin/bash

# Setup script para Cotizador Corporativo

echo "================================================"
echo "  Setup - Cotizador Corporativo"
echo "================================================"
echo ""

# Detectar si Docker está disponible
if command -v docker &> /dev/null; then
    echo "✓ Docker detectado"
    echo ""
    echo "Levantando servicios con Docker Compose..."
    docker-compose up --build
    exit 0
fi

echo "Docker no detectado. Setup manual necesario:"
echo ""
echo "1. Backend (en otra terminal):"
echo "   cd api"
echo "   npm install"
echo "   cp .env.example .env"
echo "   npm run dev"
echo ""
echo "2. Frontend (en otra terminal):"
echo "   cd cotizador-app"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "3. Base de datos (en otra terminal):"
echo "   psql -h localhost -U postgres -f api/scripts/migrate.sql"
echo ""
echo "Asegúrate que PostgreSQL está corriendo:"
echo "   brew services start postgresql  (macOS)"
echo "   sudo systemctl start postgresql  (Linux)"
echo ""
