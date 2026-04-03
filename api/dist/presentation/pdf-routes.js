"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPdfRoutes = createPdfRoutes;
const express_1 = require("express");
const promises_1 = __importDefault(require("fs/promises"));
const quotation_service_1 = require("../application/services/quotation.service");
const pdf_service_1 = require("../infrastructure/pdf/pdf.service");
const repositories_1 = require("../infrastructure/database/repositories");
const path_1 = __importDefault(require("path"));
const auth_1 = require("../middleware/auth");
const DEFAULT_COMPANY_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';
function createPdfRoutes() {
    const router = (0, express_1.Router)();
    const quotationRepo = new repositories_1.PostgresQuotationRepository();
    const itemRepo = new repositories_1.PostgresQuotationItemRepository();
    const settingsRepo = new repositories_1.PostgresCompanySettingsRepository();
    const quotationService = new quotation_service_1.QuotationService(quotationRepo, itemRepo, settingsRepo);
    const pdfService = new pdf_service_1.PdfService();
    router.post('/api/quotations/:id/export-pdf', auth_1.requireAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const quotationData = await quotationService.getById(id);
            const company = await settingsRepo.getOrCreate(DEFAULT_COMPANY_SETTINGS_ID, {
                companyName: 'KP Delta Ing Tech',
                legalName: 'KP Delta Ing Tech',
                rfc: 'XAXX010101000',
                address: 'Por definir',
                phone: '+52 000 000 0000',
                email: 'info@kp-delta-ing-tech.mx',
                slogan: 'Soluciones de ingenieria y tecnologia',
                primaryColor: '#08142b',
                accentColor: '#f97316',
                defaultConditions: '',
                defaultNotes: '',
                defaultHse: '',
                technicalResponsibleName: '',
                bankDetails: '',
                taxPercent: 16
            });
            const outputDir = path_1.default.join(__dirname, '../../../PDFs');
            await promises_1.default.mkdir(outputDir, { recursive: true });
            const outputPath = path_1.default.join(outputDir, `${quotationData.quotation.folio}.pdf`);
            await pdfService.generate({
                quotation: quotationData.quotation,
                items: quotationData.items,
                company,
                clientLogo: quotationData.quotation.clientLogoFileId
            }, outputPath);
            res.download(outputPath, `${quotationData.quotation.folio}.pdf`);
        }
        catch (err) {
            res.status(500).json({ error: 'Error generating PDF' });
        }
    });
    return router;
}
//# sourceMappingURL=pdf-routes.js.map