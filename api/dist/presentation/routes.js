"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoutes = createRoutes;
const express_1 = require("express");
const controllers_1 = require("./controllers");
const quotation_service_1 = require("../application/services/quotation.service");
const repositories_1 = require("../infrastructure/database/repositories");
const auth_repository_1 = require("../infrastructure/mysql/auth-repository");
const auth_1 = require("../middleware/auth");
function createRoutes() {
    const router = (0, express_1.Router)();
    const quotationRepo = new repositories_1.PostgresQuotationRepository();
    const itemRepo = new repositories_1.PostgresQuotationItemRepository();
    const settingsRepo = new repositories_1.PostgresCompanySettingsRepository();
    const customerRepo = new repositories_1.PostgresCustomerRepository();
    const quotationService = new quotation_service_1.QuotationService(quotationRepo, itemRepo, settingsRepo, customerRepo);
    const companyService = new quotation_service_1.CompanyService(settingsRepo);
    const customerService = new quotation_service_1.CustomerService(customerRepo);
    const authRepo = new auth_repository_1.MySqlAuthRepository();
    const quotationController = new controllers_1.QuotationController(quotationService, companyService);
    const companyController = new controllers_1.CompanyController(companyService);
    const userController = new controllers_1.UserController(authRepo);
    const customerController = new controllers_1.CustomerController(customerService);
    // Quotation routes (protected)
    router.post('/api/quotations', auth_1.requireAuth, (req, res) => quotationController.create(req, res));
    router.get('/api/quotations', auth_1.requireAuth, (req, res) => quotationController.list(req, res));
    router.get('/api/quotations/next-folio', auth_1.requireAuth, (req, res) => quotationController.nextFolio(req, res));
    router.get('/api/quotations/folio/:folio', auth_1.requireAuth, (req, res) => quotationController.getByFolio(req, res));
    router.get('/api/quotations/:id', auth_1.requireAuth, (req, res) => quotationController.getById(req, res));
    router.put('/api/quotations/:id', auth_1.requireAuth, (req, res) => quotationController.update(req, res));
    router.patch('/api/quotations/:id/status', auth_1.requireAuth, (req, res) => quotationController.updateStatus(req, res));
    router.post('/api/quotations/:id/duplicate', auth_1.requireAuth, (req, res) => quotationController.duplicate(req, res));
    router.delete('/api/quotations/:id', auth_1.requireAuth, (req, res) => quotationController.delete(req, res));
    // Company routes (protected)
    router.get('/api/company', auth_1.requireAuth, (req, res) => companyController.get(req, res));
    router.put('/api/company', auth_1.requireAuth, (req, res) => companyController.update(req, res));
    // Customer routes (protected)
    router.get('/api/customers', auth_1.requireAuth, (req, res) => customerController.list(req, res));
    // User routes (protected)
    router.get('/api/users', auth_1.requireAuth, (req, res) => userController.list(req, res));
    router.post('/api/users', auth_1.requireAuth, (req, res) => userController.create(req, res));
    return router;
}
//# sourceMappingURL=routes.js.map