# Cotizador Corporativo - Frontend

Aplicación React + TypeScript + Tailwind CSS para creación profesional de cotizaciones corporativas.

## Características

- ✅ Formulario corporativo de captura de datos
- ✅ Carga de logo global de empresa (persistente)
- ✅ Carga opcional de logo de cliente por cotización
- ✅ Tabla dinámica de partidas (agregar, editar, eliminar, reordenar)
- ✅ Cálculo automático de subtotal, descuento, IVA y total
- ✅ Vista previa ejecutiva en vivo
- ✅ Folio autogenerable
- ✅ Guardado de borrador en localStorage
- ✅ Integración con API backend
- 🔄 Exportación a PDF (en desarrollo)

## Stack

- React 18.3
- TypeScript 5.6
- Tailwind CSS 3.4
- Vite 5.4
- Zod para validaciones (lado cliente)

## Instalación

```bash
cd cotizador-app
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Build

```bash
npm run build
```

Los archivos optimizados se generarán en `dist/`

## Componentes principales

- `App.tsx`: Lógica principal, gestión de estado y coordinación
- `components/QuotationForm.tsx`: Captura de datos corporativos
- `components/ItemsTable.tsx`: Tabla dinámica de partidas
- `components/QuotationPreview.tsx`: Vista previa premium
- `lib/api.ts`: Cliente HTTP para comunicarse con backend
- `lib/format.ts`: Utilidades de formato (moneda, números, validación de imágenes)
- `types/quotation.ts`: Tipos TypeScript compartidos
- `data/defaults.ts`: Datos iniciales por defecto

## Variables de entorno

Crear `.env.local`:

```plaintext
VITE_API_BASE_URL=http://localhost:3000
```

## Flujo típico

1. Ingresar datos de configuración corporativa (nombre, RFC, logo, etc.)
2. Iniciar nueva cotización (folio autogenerado)
3. Cargar datos del cliente y proyecto
4. Agregar partidas técnicas con cantidades y precios
5. Revisar vista previa
6. Guardar en backend
7. Exportar a PDF (fase siguiente)
8. Cambiar estatus (borrador → enviada → aprobada)

## Persistencia

- **localStorage**: Guardado de borrador local para no perder cambios
- **Backend API**: Guardado permanente en PostgreSQL
- Sincronización bidireccional con backend (botón "Guardar")

## Próximas mejoras

- Exportación a PDF integrada
- Listad de cotizaciones anteriores
- Duplicar cotización
- Cambio de estatus
- Filtros avanzados
- Validación de formatos de imagen mejorada

