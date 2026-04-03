"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoutes = createRoutes;
const express_1 = require("express");
const controllers_1 = require("./controllers");
const quotation_service_1 = require("../application/services/quotation.service");
const repositories_1 = require("../infrastructure/database/repositories");
const auth_1 = require("../middleware/auth");
function createRoutes() {
    const router = (0, express_1.Router)();
    const quotationRepo = new repositories_1.PostgresQuotationRepository();
    const itemRepo = new repositories_1.PostgresQuotationItemRepository();
    const settingsRepo = new repositories_1.PostgresCompanySettingsRepository();
    const quotationService = new quotation_service_1.QuotationService(quotationRepo, itemRepo, settingsRepo);
    const companyService = new quotation_service_1.CompanyService(settingsRepo);
    const quotationController = new controllers_1.QuotationController(quotationService, companyService);
    const companyController = new controllers_1.CompanyController(companyService);
    // Quotation routes (protected)
    router.post('/api/quotations', auth_1.requireAuth, (req, res) => quotationController.create(req, res));
    router.get('/api/quotations', auth_1.requireAuth, (req, res) => quotationController.list(req, res));
    router.get('/api/quotations/folio/:folio', auth_1.requireAuth, (req, res) => quotationController.getByFolio(req, res));
    router.get('/api/quotations/:id', auth_1.requireAuth, (req, res) => quotationController.getById(req, res));
    router.patch('/api/quotations/:id/status', auth_1.requireAuth, (req, res) => quotationController.updateStatus(req, res));
    router.post('/api/quotations/:id/duplicate', auth_1.requireAuth, (req, res) => quotationController.duplicate(req, res));
    router.delete('/api/quotations/:id', auth_1.requireAuth, (req, res) => quotationController.delete(req, res));
    // Company routes (protected)
    router.get('/api/company', auth_1.requireAuth, (req, res) => companyController.get(req, res));
    router.put('/api/company', auth_1.requireAuth, (req, res) => companyController.update(req, res));
    return router;
}
//# sourceMappingURL=routes.js.map