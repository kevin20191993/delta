# Guía de configuración y deployment

## Variables de entorno

### Backend (.env)

```plaintext
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=quotations

# Servidor
PORT=3000
NODE_ENV=development

# Opcional: S3 / almacenamiento
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=
```

### Frontend (.env.local)

```plaintext
# API
VITE_API_BASE_URL=http://localhost:3000

# Optional: Analytics, etc
VITE_DEBUG=false
```

---

## Deployment en producción

### Recomendaciones de infraestructura

#### Hosting
- Frontend: Vercel, Netlify, CloudFlare Pages
- Backend: Heroku, Railway, Render, DigitalOcean App Platform
- DB: Amazon RDS PostgreSQL, DigitalOcean Managed Database, Supabase

#### Dominio y SSL
- Certificado SSL automático (Let's Encrypt)
- DNS apuntando a CDN
- Rate limiting en reverse proxy

#### Base de datos
- Backups automáticos diarios
- Replicación master-slave
- Índices optimizados según queries más frecuentes
- Connection pooling (PgBouncer)

#### Storage
- S3 o equivalente para logos y PDFs
- Cloudfront o CDN para distribución
- Versionado y expiración de archivos

### Docker production

**Backend Dockerfile optimizado:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
COPY tsconfig.json ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Frontend Dockerfile optimizado:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx configuration (nginx.conf)

```nginx
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:3000;
    }

    server {
        listen 80;
        server_name _;

        root /usr/share/nginx/html;
        index index.html;

        # Frontend
        location / {
            try_files $uri $uri/ /index.html;
            expires 1h;
            add_header Cache-Control "public, max-age=3600";
        }

        # API proxy
        location /api {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_no_cache 1;
            proxy_cache_bypass 1;
        }

        # Health check
        location /health {
            proxy_pass http://api;
        }
    }
}
```

### Kubernetes deployment (opcional)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cotizador-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cotizador-api
  template:
    metadata:
      labels:
        app: cotizador-api
    spec:
      containers:
      - name: api
        image: gcr.io/project/cotizador-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: host
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## Monitoreo y logs

### Backend logging

Agregar Winston:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Prometheus metrics

```typescript
import promClient from 'prom-client';

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route.path, res.statusCode)
      .observe(duration);
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

---

## CI/CD

### GitHub Actions workflow

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build backend
        run: |
          cd api
          npm ci
          npm run build
      
      - name: Build frontend
        run: |
          cd cotizador-app
          npm ci
          npm run build
      
      - name: Push to Docker Registry
        run: |
          docker build -t gcr.io/project/cotizador-api:$GITHUB_SHA api/
          docker build -t gcr.io/project/cotizador-app:$GITHUB_SHA cotizador-app/
          # Push commands...
      
      - name: Deploy to production
        run: |
          # Deployment commands (kubectl, etc)
```

---

## Checklist pre-producción

- [ ] Variables de entorno configuradas
- [ ] Base de datos con índices optimizados
- [ ] Backups automáticos habilitados
- [ ] SSL/HTTPS activado
- [ ] Rate limiting configurado
- [ ] CORS restringido a dominios conocidos
- [ ] Logs centralizados
- [ ] Alertas para errores críticos
- [ ] Tests pasando (unit + integration)
- [ ] Load testing realizado
- [ ] Documentación de API actualizada
- [ ] Plan de disaster recovery

---

## Escalabilidad futura

### Estrategias

1. **Database**: Separar read replicas, sharding por empresa
2. **Cache**: Redis para sesiones y cotizaciones frecuentes
3. **Queue**: Bull o RabbitMQ para generación async de PDFs
4. **CDN**: Cloudfront para assets y PDFs
5. **Load Balancer**: Nginx, HAProxy o AWS ELB
6. **Microservicios**: Separar PDF generator en servicio independiente
7. **Search**: Elasticsearch para búsquedas complejas

---

## Rollback procedure

```bash
# Rollback de versión anterior
git revert <commit-hash>
docker build -t cotizador-api:v$(date +%s) api/
docker run -e DB_HOST=... cotizador-api:v$(date +%s)

# O con Kubernetes
kubectl rollout undo deployment/cotizador-api
```
