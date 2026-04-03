"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyController = exports.QuotationController = void 0;
const index_1 = require("../../common/validation/index");
const zod_1 = require("zod");
class QuotationController {
    constructor(quotationService, companyService) {
        this.quotationService = quotationService;
        this.companyService = companyService;
    }
    async create(req, res) {
        try {
            const companySettingsId = req.headers['x-company-id'] || 'default';
            const validated = index_1.CreateQuotationValidation.parse(req.body);
            const result = await this.quotationService.create(companySettingsId, validated);
            res.status(201).json(result);
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                res.status(400).json({ error: 'Validation error', details: err.errors });
            }
            else if (err instanceof Error) {
                res.status(500).json({ error: err.message });
            }
            else {
                res.status(500).json({ error: 'Unknown error' });
            }
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const result = await this.quotationService.getById(id);
            res.json(result);
        }
        catch (err) {
            if (err instanceof Error && err.message.includes('not found')) {
                res.status(404).json({ error: err.message });
            }
            else {
                res.status(500).json({ error: 'Unknown error' });
            }
        }
    }
    async getByFolio(req, res) {
        try {
            const { folio } = req.params;
            const result = await this.quotationService.getByFolio(folio);
            res.json(result);
        }
        catch (err) {
            if (err instanceof Error && err.message.includes('not found')) {
                res.status(404).json({ error: err.message });
            }
            else {
                res.status(500).json({ error: 'Unknown error' });
            }
        }
    }
    async list(req, res) {
        try {
            const { status, limit = '20', offset = '0' } = req.query;
            const result = await this.quotationService.list({
                status: status,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'Unknown error' });
        }
    }
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const validated = index_1.UpdateQuotationStatusValidation.parse(req.body);
            await this.quotationService.updateStatus(id, validated.status, validated.note);
            res.json({ success: true });
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                res.status(400).json({ error: 'Validation error', details: err.errors });
            }
            else {
                res.status(500).json({ error: 'Unknown error' });
            }
        }
    }
    async duplicate(req, res) {
        try {
            const { id } = req.params;
            const { folio } = req.body;
            if (!folio) {
                res.status(400).json({ error: 'Folio is required' });
                return;
            }
            const result = await this.quotationService.duplicate(id, folio);
            res.status(201).json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'Unknown error' });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.quotationService.delete(id);
            res.json({ success: true });
        }
        catch (err) {
            res.status(500).json({ error: 'Unknown error' });
        }
    }
}
exports.QuotationController = QuotationController;
class CompanyController {
    constructor(companyService) {
        this.companyService = companyService;
    }
    async get(req, res) {
        try {
            const companySettingsId = req.headers['x-company-id'] || 'default';
            const result = await this.companyService.getOrCreate(companySettingsId);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'Unknown error' });
        }
    }
    async update(req, res) {
        try {
            const companySettingsId = req.headers['x-company-id'] || 'default';
            const result = await this.companyService.update(companySettingsId, req.body);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'Unknown error' });
        }
    }
}
exports.CompanyController = CompanyController;
//# sourceMappingURL=index.js.map