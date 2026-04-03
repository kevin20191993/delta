# Arquitectura recomendada

## Vision general
Arquitectura modular por dominios con separacion frontend/backend para escalar sin friccion:

- Frontend: React + TypeScript + Tailwind (SPA con vistas de cotizador, listado, configuracion).
- Backend API: Node.js + Express + TypeScript (capas controller/service/repository).
- DB: PostgreSQL con migraciones versionadas.
- PDF: servicio de render HTML + Puppeteer para fidelidad visual.
- Archivos: almacenamiento local en desarrollo y S3 compatible en produccion.

## Estilo arquitectonico
- Patrón: Clean-ish layered architecture.
- Capas backend:
  - `presentation`: rutas y controladores HTTP.
  - `application`: casos de uso y orquestacion.
  - `domain`: entidades, reglas de negocio y validaciones.
  - `infrastructure`: persistencia SQL, almacenamiento de archivos, PDF engine.

## Modulos funcionales
- `settings`: configuracion global de empresa y branding.
- `quotations`: CRUD, folios, calculos, estatus.
- `quotation-items`: partidas dinamicas y orden.
- `files`: logos de empresa y clientes.
- `pdf`: render e historial de exportaciones.

## Estrategia PDF
1. Backend obtiene cotizacion + settings + rutas de logos.
2. Renderiza template HTML SSR con estilos dedicados de impresion.
3. Puppeteer genera PDF con:
   - `printBackground: true`
   - encabezados/pies consistentes
   - paginacion limpia para tablas largas
4. Guarda artefacto PDF y retorna URL temporal.

## Escalabilidad y mantenibilidad
- DTOs tipados y validados con Zod en API.
- Migraciones SQL con Prisma Migrate o Drizzle Kit.
- Indices por folio, fecha, cliente y estatus.
- Auditoria por `created_at`, `updated_at`, `created_by`, `updated_by`.
- Logs estructurados y trazabilidad de exportaciones PDF.
