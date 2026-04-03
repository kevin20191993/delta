# Quick Reference - Cotizador Corporativo

## Comandos esenciales

### Desarrollo local

```bash
# Iniciar stack completo
docker-compose up --build

# Ver logs
docker-compose logs -f

# Detener
docker-compose down

# Limpiar volúmenes
docker-compose down -v
```

### Frontend

```bash
cd cotizador-app
npm install
npm run dev          # Dev server http://localhost:5173
npm run build        # Production build
npm run preview      # Preview build
```

### Backend

```bash
cd api
npm install
npm run dev          # Dev server http://localhost:3000
npm run build        # Compilar TypeScript
```

### Base de datos

```bash
# Conectar a PostgreSQL
psql -h localhost -U postgres -d quotations

# Ver tablas
\dt

# Salir
\q
```

---

## URLs en desarrollo

| Servicio | URL | Puerto |
|----------|-----|--------|
| Frontend | http://localhost:5173 | 5173 |
| Backend API | http://localhost:3000 | 3000 |
| PostgreSQL | postgres://postgres:password@localhost:5432/quotations | 5432 |

---

## Estructura carpetas

```
/public_html/
├── cotizador-app/              # Frontend React
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilitarios (api.ts, format.ts)
│   │   ├── types/              # TypeScript types
│   │   ├── data/               # Defaults y seed
│   │   └── App.tsx             # App principal
│   ├── vite.config.ts          # Configuración Vite
│   └── package.json            # Dependencies
│
├── api/                        # Backend Express
│   ├── src/
│   │   ├── presentation/       # Controllers + Routes
│   │   ├── application/        # Services (lógica negocio)
│   │   ├── domain/             # Entities + types
│   │   ├── infrastructure/     # DB, PDF, storage
│   │   ├── common/             # Validations, utilities
│   │   └── index.ts            # Entry point
│   ├── scripts/
│   │   ├── migrate.sql         # Schema DB
│   │   └── seed.sql            # Datos iniciales
│   ├── Dockerfile              # Imagen producción
│   └── package.json            # Dependencies
│
├── docker-compose.yml          # Orquestación 3 servicios
├── README.md                   # Documentación
├── PHASES.md                   # Detalles por fase
├── DEPLOYMENT.md               # Guía producción
└── ENTREGA_FINAL.md            # Resumen entrega
```

---

## Endpoints API

### Quotations

```bash
# GET - Listar cotizaciones
GET /api/quotations?status=draft&limit=10

# POST - Crear cotización
POST /api/quotations
Content-Type: application/json
{
  "folio": "QT-2026-001",
  "quotationDate": "2026-02-11",
  "validityDays": 30,
  "clientName": "Acme Corp",
  "clientEmail": "contact@acme.com",
  "projectName": "Sistema integral",
  "items": [...]
}

# GET - Obtener por ID
GET /api/quotations/:id

# GET - Obtener por folio
GET /api/quotations/folio/:folio

# PUT - Actualizar
PUT /api/quotations/:id
{...}

# PATCH - Cambiar estatus
PATCH /api/quotations/:id/status
{
  "status": "sent",
  "note": "Enviada a cliente"
}

# POST - Duplicar
POST /api/quotations/:id/duplicate

# DELETE - Eliminar
DELETE /api/quotations/:id
```

### Company Settings

```bash
# GET - Configuración empresa
GET /api/company/settings

# PUT - Actualizar configuración
PUT /api/company/settings
{
  "companyName": "...",
  "companyEmail": "...",
  "companyPhone": "...",
  "companyLogo": "data:image/png;base64,...",
  "currency": "MXN",
  "taxRate": 16,
  ...
}
```

---

## Validaciones importantes

### Frontend (Zod)
- Nombres: max 120 caracteres
- Email: formato válido
- Cantidad: > 0.01
- Precio: >= 0
- Descuento: 0-100%
- IVA: 0-99%
- Imágenes: JPG/PNG, max 2MB

### Backend (Zod)
- Todos los campos requeridos
- Folio: único
- Items: no vacío
- Estado: draft|sent|approved|rejected
- Fechas: ISO 8601

---

## Variables de entorno

### `.env` Frontend
```env
VITE_API_BASE_URL=http://localhost:3000
```

### `.env` Backend
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@postgres:5432/quotations
```

### `docker-compose.yml`
```yaml
POSTGRES_USER: postgres
POSTGRES_PASSWORD: password
POSTGRES_DB: quotations
```

---

## Troubleshooting

### Error: port 5173 in use
```bash
lsof -i :5173
kill -9 <PID>
```

### Error: port 3000 in use
```bash
lsof -i :3000
kill -9 <PID>
```

### Error: PostgreSQL connection refused
```bash
# Reiniciar servicio
docker-compose restart postgres

# Ver logs
docker-compose logs postgres
```

### Error: "Module not found"
```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors en IDE
```bash
# TypeScript types
cd cotizador-app
npm install

# O reiniciar VS Code
```

---

## Deploy rápido

### Railway.app
1. `git push` repo a GitHub
2. Conectar Railway a GitHub
3. Agregar BuildPack: Node + Docker
4. Variables de entorno automáticas
5. Deploy automático

### Render.com
1. Crear 2 servicios: API + Frontend
2. Conectar PostgreSQL managed
3. Configurar env vars
4. Deploy desde GitHub

### DigitalOcean
1. Crear Droplet (Docker pre-instalado)
2. SSH y clonar repo
3. Crear `.env` de producción
4. `docker-compose -f docker-compose.prod.yml up -d`
5. Nginx reverse proxy

---

## Próximos pasos

### Inmediatos (MVP)
1. ✅ Correr `docker-compose up --build`
2. ✅ Probar flujo completo (crear → guardar → exportar PDF)
3. ✅ Verificar datos en PostgreSQL
4. [ ] Agregar JWT auth
5. [ ] Implementar tests

### Seguridad (antes producción)
- [ ] Cambiar POSTGRES_PASSWORD en env
- [ ] Generar JWT_SECRET fuerte
- [ ] CORS solo desde dominio propio
- [ ] Rate limiting en API
- [ ] HTTPS obligatorio
- [ ] Backups automáticos DB

### Optimizaciones
- [ ] Image optimization (logos)
- [ ] API caching (Redis)
- [ ] Frontend bundle analysis
- [ ] Database query optimization

---

## Referencias

- [TypeScript Docs](https://www.typescriptlang.org/)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Express Docs](https://expressjs.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Puppeteer Docs](https://pptr.dev/)
- [Docker Docs](https://docs.docker.com/)

---

**Última actualización**: Mar 19, 2026  
**Versión**: 1.0 - Production Ready
