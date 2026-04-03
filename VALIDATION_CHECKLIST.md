# Checklist de validación - Cotizador Corporativo

## Pre-requisitos del sistema

- [ ] Docker instalado (`docker --version`)
- [ ] Docker Compose instalado (`docker-compose --version`)
- [ ] Puerto 5173 disponible (frontend)
- [ ] Puerto 3000 disponible (backend)
- [ ] Puerto 5432 disponible (PostgreSQL)
- [ ] 4GB RAM mínimo
- [ ] Conexión a internet (para descargas)

---

## 1. Inicialización del proyecto

- [ ] Clonar/descargar repositorio
- [ ] Navegar a carpeta raíz (`/public_html`)
- [ ] Verificar archivos principales existen:
  - [ ] `docker-compose.yml`
  - [ ] `cotizador-app/` carpeta
  - [ ] `api/` carpeta
  - [ ] `README.md`

---

## 2. Arranque con Docker (recomendado)

### Terminal principal
```bash
docker-compose up --build
```

Validar salida:
- [ ] PostgreSQL iniciando
- [ ] API compilando TypeScript
- [ ] Frontend iniciando Vite
- [ ] Health checks pasando
- [ ] Ningún error crítico

**Tiempo esperado**: 2-3 minutos primera vez

### Logs verificar
```
✓ postgres: database system is ready to accept connections
✓ api: Listening on port 3000
✓ frontend: Local: http://localhost:5173
```

---

## 3. Acceso a interfaces

### Frontend
- [ ] Abrir http://localhost:5173
- [ ] Página carga sin errores
- [ ] Logo visible
- [ ] Colores correcto (azul + naranja)
- [ ] Componentes visible (form, tabla, preview)

### Backend Health
- [ ] Abrir http://localhost:3000 (debe retornar {"status":"ok"})
- [ ] Respuesta: `{status: "ok", timestamp: "..."}`

### Base de datos
```bash
docker exec -it postgres psql -U postgres -d quotations -c "\dt"
```
Validar tablas:
- [ ] company_settings
- [ ] quotations
- [ ] quotation_items
- [ ] quotation_files
- [ ] customers
- [ ] quotation_status_history

---

## 4. Test de flujo principal

### Paso 1: Configurar empresa
1. [ ] En frontend, ver página inicial
2. [ ] Ingresar datos empresa:
   - [ ] Nombre empresarial
   - [ ] Email contacto
   - [ ] Teléfono
   - [ ] RFC/NIT
3. [ ] Upload logo (JPG/PNG)
4. [ ] Guardar configuración
5. [ ] Verificar éxito (toast verde)

### Paso 2: Crear cotización
1. [ ] Click "Nueva cotización"
2. [ ] Folio se genera automáticamente (QT-2026-XXX)
3. [ ] Fecha actual mostrada
4. [ ] Completar datos cliente:
   - [ ] Nombre cliente
   - [ ] Email cliente
   - [ ] Nombre proyecto
5. [ ] Ingresar observaciones

### Paso 3: Agregar partidas
1. [ ] Click "Agregar partida"
2. [ ] Tabla se expande
3. [ ] Ingresar:
   - [ ] Descripción (ej: "Desarrollo backend")
   - [ ] Cantidad (ej: 40)
   - [ ] Unidad (ej: "horas")
   - [ ] Precio unitario (ej: 500)
4. [ ] Click agregar
5. [ ] Partida aparece en tabla
6. [ ] Subtotal se recalcula automáticamente
7. [ ] Descuento se aplica
8. [ ] IVA (16%) se calcula
9. [ ] Total actualiza

### Paso 4: Preview en vivo
1. [ ] Mirar panel derecho
2. [ ] Verifica datos reflejan en preview
3. [ ] Logo aparece (si subió)
4. [ ] Tabla partidas correcta
5. [ ] Totales correctos
6. [ ] Colores corporativos aplicados

### Paso 5: Guardar en backend
1. [ ] Click botón "Guardar en servidor"
2. [ ] Indicador "Guardando..." aparece
3. [ ] Tras segundos, aparece "✓ Guardado" (verde)
4. [ ] Timestamp "Última actualización" muestra

### Paso 6: Exportar PDF
1. [ ] Click botón "Descargar PDF"
2. [ ] Navegador descarga archivo `QT-2026-XXX.pdf`
3. [ ] Archivo abre correctamente
4. [ ] PDF contiene:
   - [ ] Logo empresa
   - [ ] Datos cliente
   - [ ] Tabla partidas
   - [ ] Totales
   - [ ] Colores + diseño

### Paso 7: Validaciones
Probar validaciones (deben rechazar):
- [ ] Cantidad negativa (rojo error)
- [ ] Precio negativo (rojo error)
- [ ] Email inválido (rojo error)
- [ ] Foto > 2MB (rechaza)
- [ ] Foto en formato incorrecto (rechaza)

---

## 5. Test API directamente

### Test de endpoints

#### Health check
```bash
curl http://localhost:3000/api/health
```
Esperado: `{"status":"ok"}`

#### GET Company Settings
```bash
curl -H "x-company-id: default" http://localhost:3000/api/company/settings
```
Esperado: 200, datos empresa

#### POST Create Quotation
```bash
curl -X POST http://localhost:3000/api/quotations \
  -H "x-company-id: default" \
  -H "Content-Type: application/json" \
  -d '{
    "folio": "QT-2026-TEST",
    "quotationDate": "2026-02-11",
    "validityDays": 30,
    "clientName": "Test Client",
    "items": [{
      "description": "Test item",
      "quantity": 1,
      "unitPrice": 100,
      "unit": "pcs"
    }]
  }'
```
Esperado: 201, objeto cotización con ID

#### GET All Quotations
```bash
curl -H "x-company-id: default" http://localhost:3000/api/quotations
```
Esperado: 200, array cotizaciones

---

## 6. Verificación base de datos

### Ver cotizaciones guardadas
```bash
docker exec -it postgres psql -U postgres -d quotations -c \
  "SELECT id, folio, status, created_at FROM quotations;"
```
Debería listar cotizaciones creadas.

### Ver configuración empresa
```bash
docker exec -it postgres psql -U postgres -d quotations -c \
  "SELECT company_name, company_email FROM company_settings;"
```
Debería mostrar datos ingresados.

### Ver partidas
```bash
docker exec -it postgres psql -U postgres -d quotations -c \
  "SELECT * FROM quotation_items LIMIT 5;"
```
Debería listar partidas.

---

## 7. Test de errores controlados

Probar que sistema maneja errores gracefully:

- [ ] Cerrar PostgreSQL:
  - [ ] API debe retornar 500
  - [ ] Frontend debe mostrar error (rojo)
  - [ ] No debe crash

- [ ] Datos incompletos en form:
  - [ ] Validación client-side (roja)
  - [ ] Botón "Guardar" deshabilitado hasta validar

- [ ] JSON inválido en API:
  - [ ] Retorno 400 con mensaje claro
  - [ ] No genera error interno

---

## 8. Performance checks

### Frontend
- [ ] Sitio carga en < 2 segundos (localhost)
- [ ] No hay warnings en console (`F12` → Console)
- [ ] React Developer Tools funciona
- [ ] LocalStorage persist (abrir DevTools → Application → Storage)

### Backend
- [ ] Respuesta API en < 100ms (queries simples)
- [ ] No hay memory leaks (monitor RAM)
- [ ] TypeScript sin errores estrictos

### Base de datos
- [ ] Queries ejecutadas en < 50ms
- [ ] Índices usando (EXPLAIN ANALYZE)

---

## 9. Integración frontend-backend

- [ ] Frontend request a API va al host correcto
- [ ] Header `x-company-id` enviado
- [ ] Respuestas JSON parseadas correctamente
- [ ] Errores API mostrados al usuario
- [ ] Éxito confirmado con toast/UI

---

## 10. Responsividad (cuando sea necesario)

Test en diferentes pantallas:
- [ ] Desktop 1920x1080: Perfecto
- [ ] Tablet 768x1024: Funcional (puede requerir scroll)
- [ ] Mobile 375x667: Degradación controlada

---

## 11. Seguridad básica

- [ ] CORS configurado (solo localhost en dev)
- [ ] Contraseñas PostgreSQL configuradas
- [ ] JWT tokens (cuando se implemente)
- [ ] Input validation en frontend
- [ ] Input validation en backend
- [ ] SQL injection imposible (prepared statements)
- [ ] XSS imposible (React escaping automático)

---

## 12. Documentación

- [ ] README.md accesible y correcto
- [ ] PHASES.md describe todas las fases
- [ ] DEPLOYMENT.md con instrucciones
- [ ] QUICK_REFERENCE.md con comandos
- [ ] Comentarios en código donde aplica

---

## Logs esperados en terminal Docker

```
postgres_1    | LOG: database system is ready to accept connections
api_1         | Server listening on port 3000
frontend_1    | Local: http://localhost:5173
```

Ningún `ERROR` en rojo debería estar presente.

---

## Success Criteria - Todos deben estar ✅

General:
- [ ] ✅ Docker stack completo corriendo
- [ ] ✅ Frontend accesible
- [ ] ✅ Backend respondiendo
- [ ] ✅ PostgreSQL conectado

Funcionalidad:
- [ ] ✅ Configurar empresa
- [ ] ✅ Crear cotización
- [ ] ✅ Agregar partidas
- [ ] ✅ Cálculos automáticos
- [ ] ✅ Vista previa en vivo
- [ ] ✅ Guardar en backend
- [ ] ✅ Descargar PDF

Datos:
- [ ] ✅ Datos persisten en PostgreSQL
- [ ] ✅ Reload no pierde datos
- [ ] ✅ Nuevas cotizaciones crean folio único

Validación:
- [ ] ✅ Rechaza datos inválidos
- [ ] ✅ Valida campos requeridos
- [ ] ✅ Valida formatos (email, números)
- [ ] ✅ Valida tamaños (imágenes)

---

## Troubleshooting rápido

| Problema | Solución |
|----------|----------|
| Puerto en uso | `docker-compose down` + `lsof -i :5173` + kill |
| DB no conecta | `docker-compose logs postgres` + revisar env vars |
| Frontend blanco | DevTools → Console, buscar errores |
| API 500 error | `docker-compose logs api` para ver stack trace |
| TypeScript spam | Reinstalar: `rm node_modules && npm install` |
| CORS error | Revisar header `x-company-id` |

---

## Próximos pasos post-validación

1. [ ] Documentar issues encontrados
2. [ ] Crear branch `production` desde `main`
3. [ ] Agregar GitHub Actions CI/CD
4. [ ] Configurar backups automáticos DB
5. [ ] Implementar JWT auth
6. [ ] Agregar tests (jest/vitest)
7. [ ] Deploy a staging
8. [ ] Deploy a producción

---

**Checklist completado**: Mar 19, 2026  
**Versión**: 1.0  
**Estado**: Ready for use ✅
