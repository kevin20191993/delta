"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateQuotationStatusValidation = exports.CreateCompanySettingsValidation = exports.CreateQuotationValidation = void 0;
const zod_1 = require("zod");
exports.CreateQuotationValidation = zod_1.z.object({
    folio: zod_1.z.string().min(3).max(30),
    quotationDate: zod_1.z.string().date(),
    validityDays: zod_1.z.number().int().positive(),
    destinationCompany: zod_1.z.string().min(1).max(180),
    customerAttention: zod_1.z.string().min(1).max(160),
    customerContact: zod_1.z.string().max(160).optional(),
    projectLocation: zod_1.z.string().min(1).max(220),
    currency: zod_1.z.enum(['MXN', 'USD']),
    discountPercent: zod_1.z.number().min(0).max(100).default(0),
    taxPercent: zod_1.z.number().min(0).max(100).default(16),
    conditions: zod_1.z.string().max(300).optional(),
    hseNotes: zod_1.z.string().max(300).optional(),
    legalNotes: zod_1.z.string().max(300).optional(),
    observations: zod_1.z.string().optional(),
    responsibleSignatureName: zod_1.z.string().max(120).optional(),
    items: zod_1.z.array(zod_1.z.object({
        itemCode: zod_1.z.string().min(1).max(30),
        description: zod_1.z.string().min(1).max(300),
        quantity: zod_1.z.number().positive(),
        unit: zod_1.z.string().min(1).max(20),
        unitPrice: zod_1.z.number().nonnegative()
    })).min(1)
});
exports.CreateCompanySettingsValidation = zod_1.z.object({
    companyName: zod_1.z.string().min(1).max(150),
    legalName: zod_1.z.string().min(1).max(200),
    rfc: zod_1.z.string().min(1).max(20),
    address: zod_1.z.string().min(1),
    phone: zod_1.z.string().min(1).max(40),
    email: zod_1.z.string().email(),
    slogan: zod_1.z.string().min(1).max(180),
    primaryColor: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i).default('#08142b'),
    accentColor: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i).default('#f97316'),
    defaultConditions: zod_1.z.string().optional(),
    defaultNotes: zod_1.z.string().optional(),
    defaultHse: zod_1.z.string().optional(),
    technicalResponsibleName: zod_1.z.string().max(120).optional(),
    bankDetails: zod_1.z.string().optional(),
    taxPercent: zod_1.z.number().min(0).max(100).default(16)
});
exports.UpdateQuotationStatusValidation = zod_1.z.object({
    status: zod_1.z.enum(['draft', 'sent', 'approved', 'rejected']),
    note: zod_1.z.string().optional()
});
//# sourceMappingURL=index.js.map