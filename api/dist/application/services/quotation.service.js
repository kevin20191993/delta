"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyService = exports.QuotationService = void 0;
const DEFAULT_COMPANY_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';
function normalizeCompanySettingsId(value) {
    if (!value || value === 'default') {
        return DEFAULT_COMPANY_SETTINGS_ID;
    }
    return value;
}
class QuotationService {
    constructor(quotationRepo, itemRepo, settingsRepo) {
        this.quotationRepo = quotationRepo;
        this.itemRepo = itemRepo;
        this.settingsRepo = settingsRepo;
    }
    async create(companySettingsId, data) {
        const resolvedCompanySettingsId = normalizeCompanySettingsId(companySettingsId);
        const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const discountAmount = subtotal * (data.discountPercent / 100);
        const taxable = Math.max(subtotal - discountAmount, 0);
        const taxAmount = taxable * (data.taxPercent / 100);
        const total = taxable + taxAmount;
        const quotation = await this.quotationRepo.create({
            folio: data.folio,
            companySettingsId: resolvedCompanySettingsId,
            quotationDate: new Date(data.quotationDate),
            validityDays: data.validityDays,
            destinationCompany: data.destinationCompany,
            customerAttention: data.customerAttention,
            customerContact: data.customerContact,
            projectLocation: data.projectLocation,
            currency: data.currency,
            discountPercent: data.discountPercent,
            subtotal,
            taxPercent: data.taxPercent,
            taxAmount,
            total,
            conditions: data.conditions,
            hseNotes: data.hseNotes,
            legalNotes: data.legalNotes,
            observations: data.observations,
            responsibleSignatureName: data.responsibleSignatureName,
            status: 'draft',
            createdBy: 'api'
        });
        await this.itemRepo.createBatch(quotation.id, data.items.map((item) => ({
            itemCode: item.itemCode,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice
        })), 'api');
        const items = await this.itemRepo.findByQuotationId(quotation.id);
        return { quotation, items };
    }
    async getById(id) {
        const quotation = await this.quotationRepo.findById(id);
        if (!quotation) {
            throw new Error(`Quotation ${id} not found`);
        }
        const items = await this.itemRepo.findByQuotationId(id);
        return { quotation, items };
    }
    async getByFolio(folio) {
        const quotation = await this.quotationRepo.findByFolio(folio);
        if (!quotation) {
            throw new Error(`Quotation with folio ${folio} not found`);
        }
        const items = await this.itemRepo.findByQuotationId(quotation.id);
        return { quotation, items };
    }
    async list(filters) {
        const quotations = await this.quotationRepo.findAll(filters);
        const result = [];
        for (const quotation of quotations) {
            const items = await this.itemRepo.findByQuotationId(quotation.id);
            result.push({ quotation, items });
        }
        return result;
    }
    async updateStatus(id, status, note) {
        await this.quotationRepo.updateStatus(id, status, note, 'api');
    }
    async duplicate(id, newFolio) {
        const original = await this.getById(id);
        const newQuotation = await this.quotationRepo.create({
            folio: newFolio,
            companySettingsId: original.quotation.companySettingsId,
            quotationDate: new Date(),
            validityDays: original.quotation.validityDays,
            destinationCompany: original.quotation.destinationCompany,
            customerAttention: original.quotation.customerAttention,
            customerContact: original.quotation.customerContact,
            projectLocation: original.quotation.projectLocation,
            currency: original.quotation.currency,
            discountPercent: original.quotation.discountPercent,
            subtotal: original.quotation.subtotal,
            taxPercent: original.quotation.taxPercent,
            taxAmount: original.quotation.taxAmount,
            total: original.quotation.total,
            conditions: original.quotation.conditions,
            hseNotes: original.quotation.hseNotes,
            legalNotes: original.quotation.legalNotes,
            observations: original.quotation.observations,
            responsibleSignatureName: original.quotation.responsibleSignatureName,
            status: 'draft',
            createdBy: 'api'
        });
        await this.itemRepo.createBatch(newQuotation.id, original.items.map((item) => ({
            itemCode: item.itemCode,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice
        })), 'api');
        const items = await this.itemRepo.findByQuotationId(newQuotation.id);
        return { quotation: newQuotation, items };
    }
    async delete(id) {
        await this.itemRepo.deleteByQuotationId(id);
        await this.quotationRepo.delete(id);
    }
}
exports.QuotationService = QuotationService;
class CompanyService {
    constructor(settingsRepo) {
        this.settingsRepo = settingsRepo;
    }
    async getOrCreate(id) {
        return this.settingsRepo.getOrCreate(normalizeCompanySettingsId(id), {
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
    }
    async update(id, data) {
        const resolvedId = normalizeCompanySettingsId(id);
        await this.getOrCreate(resolvedId);
        return this.settingsRepo.update(resolvedId, data, 'api');
    }
}
exports.CompanyService = CompanyService;
//# sourceMappingURL=quotation.service.js.map