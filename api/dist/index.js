"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = require("./presentation/routes");
const pdf_routes_1 = require("./presentation/pdf-routes");
const auth_routes_1 = require("./presentation/auth-routes");
const connection_1 = require("./infrastructure/database/connection");
const pdf_service_1 = require("./infrastructure/pdf/pdf.service");
const auth_repository_1 = require("./infrastructure/mysql/auth-repository");
const schema_1 = require("./infrastructure/database/schema");
async function bootstrap() {
    const app = (0, express_1.default)();
    const databaseUrl = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
    const authRepo = new auth_repository_1.MySqlAuthRepository();
    // Middleware
    app.set('trust proxy', true);
    app.use((0, cors_1.default)());
    app.use(express_1.default.json({ limit: '50mb' }));
    // Initialize database
    await (0, connection_1.initDb)({
        host: databaseUrl?.hostname || process.env.DB_HOST || 'localhost',
        port: parseInt(databaseUrl?.port || process.env.DB_PORT || '5432'),
        user: decodeURIComponent(databaseUrl?.username || process.env.DB_USER || 'postgres'),
        password: decodeURIComponent(databaseUrl?.password || process.env.DB_PASSWORD || 'postgres'),
        database: databaseUrl?.pathname.replace(/^\//, '') || process.env.DB_NAME || 'quotations'
    });
    await (0, schema_1.ensureExtendedQuotationSchema)();
    await authRepo.ensureSchema();
    await authRepo.ensureDefaultAdminUser({
        username: process.env.ADMIN_USER || 'admin',
        password: process.env.ADMIN_PASSWORD || 'changeme',
        email: process.env.ADMIN_EMAIL || process.env.MAIL_FROM_EMAIL || 'admin@localhost'
    });
    // Initialize PDF service
    const pdfService = new pdf_service_1.PdfService();
    await pdfService.initialize();
    app.locals.pdfService = pdfService;
    // Health check
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    // Routes
    app.use((0, auth_routes_1.createAuthRoutes)());
    app.use((0, routes_1.createRoutes)());
    app.use((0, pdf_routes_1.createPdfRoutes)());
    // Error handling
    app.use((err, req, res, next) => {
        console.error('Unhandled error:', err);
        res.status(500).json({ error: 'Internal server error' });
    });
    return app;
}
async function main() {
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
//# sourceMappingURL=index.js.map