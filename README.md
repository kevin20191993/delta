# Cotizador Corporativo - Sistema Completo

Sistema web profesional de generación de cotizaciones para empresas de ingeniería, construcción y servicios industriales.

**Stack tecnológico:**
- Frontend: React 18 + TypeScript + Tailwind CSS + Vite
- Backend: Node.js + Express + TypeScript
- Base de datos: PostgreSQL 16
- PDF: Puppeteer
- Orquestación: Docker Compose

---

## Contenido del proyecto

```
.
├── cotizador-app/              # Frontend SPA
│   ├── src/
│   │   ├── components/         # Componentes React reutilizables
│   │   ├── lib/                # Utilidades y cliente API
│   │   ├── types/              # Tipos TypeScript
│   │   ├── data/               # Datos por defecto
│   │   └── App.tsx             # Aplicación principal
│   ├── Dockerfile
│   ├── package.json
│   └── index.html
├── api/                        # Backend API REST
│   ├── src/
│   │   ├── presentation/       # Controladores y rutas
│   │   ├── application/        # Servicios de negocio
│   │   ├── domain/             # Entidades y tipos
│   │   ├── infrastructure/     # DB, PDF, almacenamiento
│   │   └── index.ts            # Servidor Express
│   ├── scripts/
│   │   └── migrate.sql         # Migraciones SQL
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── docker-compose.yml          # Orquestación de servicios
└── README.md
```

---

## Inicio rápido con Docker Compose

### Requisitos
- Docker 24+
- Docker Compose 2.0+

### Pasos

1. **Clonar/descargar el proyecto:**
   ```bash
   cd public_html
   ```

2. **Crear archivo .env backend (opcional):**
   ```bash
   cd api
   cp .env.example .env
   cd ..
   ```

3. **Levantar los servicios:**
   ```bash
   docker-compose up --build
   ```

   **Salida esperada:**
   ```
   quotations-db        | * Database is ready to accept connections
   quotations-api       | ✓ Cotizador API running on http://localhost:3000
   quotations-frontend  | VITE v5.x.x  ready in 500 ms
   ```

4. **Acceder a la aplicación:**
   - Frontend: http://localhost:5173
   - API: http://localhost:3000
   - Base de datos: localhost:5432 (postgres / postgres)

---

## Setup manual (sin Docker)

### Requisitos
- Node.js 20+ y npm 10+
- PostgreSQL 16+

### Backend

1. **Instalar dependencias:**
   ```bash
   cd api
   npm install
   ```

2. **Configurar base de datos:**
   ```bash
   # Crear base de datos y ejecutar migraciones
   psql -h localhost -U postgres -f scripts/migrate.sql
   # O si necesitas contraseña interactiva
   psql -h localhost -U postgres -d quotations -f scripts/migrate.sql
   ```

3. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   # Editar .env con tus valores
   ```

4. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

   El servidor estará disponible en `http://localhost:3000`

### Frontend

1. **Instalar dependencias:**
   ```bash
   cd cotizador-app
   npm install
   ```

2. **Configurar variable de entorno (si es necesario):**
   Crear `.env.local`:
   ```bash
   VITE_API_BASE_URL=http://localhost:3000
   ```

3. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

   La aplicación estará disponible en `http://localhost:5173`

---

## Uso de la aplicación

### 1. Configuración global de empresa

En la pestaña **"Configuracion corporativa"**, ingresa:
- Nombre comercial y razón social
- RFC
- Dirección, teléfono, email
- Slogan o giro empresarial
- Logo principal (se guardará globalmente)
- Porcentaje de IVA aplicable

### 2. Crear una cotización

En **"Datos de cotizacion"**:
- El folio se genera automáticamente (QT-2026-001, etc.)
- Selecciona fecha y vigencia
- Datos del cliente y proyecto
- Condiciones comerciales, HSE, notas legales
- Logo del cliente (opcional)

### 3. Agregar partidas dinámicamente

La tabla de **"Partidas"** permite:
- Agregar conceptos técnicos
- Especificar cantidad, unidad, precio unitario
- El importe se calcula automáticamente
- Reordenar partidas
- Eliminar partidas (mínimo 1 requerida)

### 4. Vista previa en vivo

La **"Cotizacion"** (panel derecho sticky) muestra:
- Encabezado corporativo con tu logo
- Datos del cliente y proyecto
- Tabla profesional de concepts
- Recuadro oscuro con subtotal, descuento, IVA y total
- Espacios para firmas

### 5. Guardar cotización

- Click en **"Guardar"** → se envía al backend y se asigna un ID
- La cotización pasa a estado "draft"
- Aparece fecha de último guardado

### 6. Exportar a PDF

- Click **"Exportar PDF"** (fase siguiente completa)
- Se genera un PDF con diseño fiel a la vista previa
- Incluye todos los datos, logos, firmas, condiciones

---

## API REST

Base URL: `http://localhost:3000/api`

### Autenticación
- Actualmente usa header `x-company-id` (default: 'default')
- Fase siguiente: agregar JWT y roles

### Endpoints

#### Cotizaciones

**POST /quotations**
- Crear nueva cotización
- Body:
  ```json
  {
    "folio": "QT-2026-001",
    "quotationDate": "2026-03-19",
    "validityDays": 15,
    "destinationCompany": "Cliente S.A.",
    "customerAttention": "Ing. Responsable",
    "projectLocation": "Proyecto",
    "currency": "MXN",
    "discountPercent": 0,
    "taxPercent": 16,
    "conditions": "...",
    "hseNotes": "...",
    "legalNotes": "...",
    "items": [
      {
        "itemCode": "01",
        "description": "Concepto",
        "quantity": 1,
        "unit": "SERV",
        "unitPrice": 15800
      }
    ]
  }
  ```

**GET /quotations**
- Listar cotizaciones con filtros
- Query params: `status`, `limit`, `offset`

**GET /quotations/:id**
- Obtener cotización por ID

**GET /quotations/folio/:folio**
- Obtener cotización por folio

**PATCH /quotations/:id/status**
- Cambiar estado (draft → sent → approved/rejected)
- Body: `{ "status": "sent", "note": "Opcional" }`

**POST /quotations/:id/duplicate**
- Duplicar cotización con folio nuevo
- Body: `{ "folio": "QT-2026-002" }`

**DELETE /quotations/:id**
- Eliminar cotización

#### Configuración de empresa

**GET /company**
- Obtener configuración global

**PUT /company**
- Actualizar configuración global

---

## Archivos de configuración

### Dockerfile (Backend)
Imagen Node 20-Alpine optimizada para entwicklung.

### Dockerfile (Frontend)
Imagen Node 20-Alpine con Vite, expone puerto 5173.

### docker-compose.yml
Orquesta PostgreSQL, backend API y frontend SPA con volúmenes para desarrollo.

---

## Escalabilidad y producción

### Próximos pasos

1. **Autenticación y autorización**
   - JWT con roles (admin, user)
   - Separación por empresas

2. **Almacenamiento de archivos**
   - S3 / MinIO para logos y PDFs
   - Hash y versionado

3. **Caching y performance**
   - Redis para sesiones
   - CDN para assets estáticos

4. **Monitoreo y logs**
   - Winston o Pino para logs estructurados
   - Prometheus + Grafana

5. **Tests**
   - Jest para backend
   - Vitest para frontend

---

## Troubleshooting

### Error de conexión a BD
```bash
# Verificar que PostgreSQL está corriendo
docker ps | grep postgres
# O si es manual
psql -h localhost -U postgres -d quotations
```

### Puerto 5432 o 3000 en uso
```bash
# Cambiar en docker-compose.yml o:
lsof -i :5432
kill -9 <PID>
```

### Frontend no ve API
- Verificar `VITE_API_BASE_URL` en desarrollo
- En Docker Compose usa `http://api:3000` internamente

---

## Documentación adicional

- [Arquitectura]: `api/docs/architecture.md` (fase 1)
- [Modelo de datos]: `api/docs/data-model.sql`
- [Validaciones]: `api/src/common/validation/index.ts`
- [Tipos TypeScript]: `cotizador-app/src/types/quotation.ts`
