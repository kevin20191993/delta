"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = exports.CompanyService = exports.QuotationService = void 0;
const DEFAULT_COMPANY_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';
function normalizeCompanySettingsId(value) {
    if (!value || value === 'default') {
        return DEFAULT_COMPANY_SETTINGS_ID;
    }
    return value;
}
class QuotationService {
    constructor(quotationRepo, itemRepo, settingsRepo, customerRepo) {
        this.quotationRepo = quotationRepo;
        this.itemRepo = itemRepo;
        this.settingsRepo = settingsRepo;
        this.customerRepo = customerRepo;
    }
    async getNextFolio() {
        const year = new Date().getFullYear();
        const existing = await this.quotationRepo.findAll({ limit: 500, offset: 0 });
        const maxSequence = existing
            .map((quotation) => {
            const match = quotation.folio.match(new RegExp(`^QT-${year}-(\\d+)$`));
            return match ? Number(match[1]) : 0;
        })
            .reduce((max, current) => Math.max(max, current), 0);
        return `QT-${year}-${String(maxSequence + 1).padStart(3, '0')}`;
    }
    async create(companySettingsId, data) {
        const resolvedCompanySettingsId = normalizeCompanySettingsId(companySettingsId);
        const safeFolio = (await this.quotationRepo.findByFolio(data.folio))
            ? await this.getNextFolio()
            : data.folio;
        const customer = await this.customerRepo.upsert({
            companyName: data.destinationCompany,
            contactName: data.customerAttention,
            email: data.customerEmail || undefined,
            phone: data.customerPhone || data.customerContact || undefined,
            rfc: data.customerRfc || undefined,
            address: data.customerAddress || undefined,
            logoDataUrl: data.clientLogo || undefined,
            updatedBy: 'api'
        });
        const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const discountAmount = subtotal * (data.discountPercent / 100);
        const taxable = Math.max(subtotal - discountAmount, 0);
        const taxAmount = taxable * (data.taxPercent / 100);
        const total = taxable + taxAmount;
        const quotation = await this.quotationRepo.create({
            folio: safeFolio,
            companySettingsId: resolvedCompanySettingsId,
            customerId: customer.id,
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
            showConditions: data.showConditions,
            showHse: data.showHse,
            showLegalNotes: data.showLegalNotes,
            showResponsibleSignature: data.showResponsibleSignature,
            showCustomerAcceptance: data.showCustomerAcceptance,
            showClientLogo: data.showClientLogo,
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
        return { quotation, items, customer };
    }
    async getById(id) {
        const quotation = await this.quotationRepo.findById(id);
        if (!quotation) {
            throw new Error(`Quotation ${id} not found`);
        }
        const items = await this.itemRepo.findByQuotationId(id);
        const customer = quotation.customerId ? await this.customerRepo.findByCompanyName(quotation.destinationCompany || '') : null;
        return { quotation, items, customer };
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
    async update(id, companySettingsId, data) {
        const resolvedCompanySettingsId = normalizeCompanySettingsId(companySettingsId);
        const existing = await this.quotationRepo.findById(id);
        if (!existing) {
            throw new Error(`Quotation ${id} not found`);
        }
        const conflicting = await this.quotationRepo.findByFolio(data.folio);
        const safeFolio = conflicting && conflicting.id !== id
            ? await this.getNextFolio()
            : data.folio;
        const customer = await this.customerRepo.upsert({
            companyName: data.destinationCompany,
            contactName: data.customerAttention,
            email: data.customerEmail || undefined,
            phone: data.customerPhone || data.customerContact || undefined,
            rfc: data.customerRfc || undefined,
            address: data.customerAddress || undefined,
            logoDataUrl: data.clientLogo || undefined,
            updatedBy: 'api'
        });
        const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const discountAmount = subtotal * (data.discountPercent / 100);
        const taxable = Math.max(subtotal - discountAmount, 0);
        const taxAmount = taxable * (data.taxPercent / 100);
        const total = taxable + taxAmount;
        const quotation = await this.quotationRepo.update(id, {
            folio: safeFolio,
            companySettingsId: resolvedCompanySettingsId,
            customerId: customer.id,
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
            showConditions: data.showConditions,
            showHse: data.showHse,
            showLegalNotes: data.showLegalNotes,
            showResponsibleSignature: data.showResponsibleSignature,
            showCustomerAcceptance: data.showCustomerAcceptance,
            showClientLogo: data.showClientLogo
        }, 'api');
        await this.itemRepo.deleteByQuotationId(id);
        await this.itemRepo.createBatch(id, data.items.map((item) => ({
            itemCode: item.itemCode,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice
        })), 'api');
        const items = await this.itemRepo.findByQuotationId(id);
        return { quotation, items, customer };
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
            showConditions: original.quotation.showConditions,
            showHse: original.quotation.showHse,
            showLegalNotes: original.quotation.showLegalNotes,
            showResponsibleSignature: original.quotation.showResponsibleSignature,
            showCustomerAcceptance: original.quotation.showCustomerAcceptance,
            showClientLogo: original.quotation.showClientLogo,
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
            logoDataUrl: '',
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
class CustomerService {
    constructor(customerRepo) {
        this.customerRepo = customerRepo;
    }
    async list(limit = 100) {
        return this.customerRepo.findAll(limit);
    }
}
exports.CustomerService = CustomerService;
//# sourceMappingURL=quotation.service.js.map