import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import { createRoutes } from './presentation/routes';
import { createPdfRoutes } from './presentation/pdf-routes';
import { createAuthRoutes } from './presentation/auth-routes';
import { initDb } from './infrastructure/database/connection';
import { PdfService } from './infrastructure/pdf/pdf.service';

async function bootstrap(): Promise<Express> {
  const app = express();
  const databaseUrl = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Initialize database
  await initDb({
    host: databaseUrl?.hostname || process.env.DB_HOST || 'localhost',
    port: parseInt(databaseUrl?.port || process.env.DB_PORT || '5432'),
    user: decodeURIComponent(databaseUrl?.username || process.env.DB_USER || 'postgres'),
    password: decodeURIComponent(databaseUrl?.password || process.env.DB_PASSWORD || 'postgres'),
    database: databaseUrl?.pathname.replace(/^\//, '') || process.env.DB_NAME || 'quotations'
  });

  // Initialize PDF service
  const pdfService = new PdfService();
  await pdfService.initialize();
  app.locals.pdfService = pdfService;

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use(createAuthRoutes());
  app.use(createRoutes());
  app.use(createPdfRoutes());

  // Error handling
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

async function main(): Promise<void> {
  const app = await bootstrap();
  const port = parseInt(process.env.PORT || '3000');

  const server = app.listen(port, () => {
    console.log(`\n✓ Cotizador API running on http://localhost:${port}`);
    console.log(`✓ Health check: http://localhost:${port}/health`);
    console.log(`✓ API docs available at http://localhost:${port}/api\n`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
