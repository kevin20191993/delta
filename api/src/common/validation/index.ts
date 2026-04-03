import { z } from 'zod';

export const CreateQuotationValidation = z.object({
  folio: z.string().min(3).max(30),
  quotationDate: z.string().date(),
  validityDays: z.number().int().positive(),
  destinationCompany: z.string().min(1).max(180),
  customerAttention: z.string().min(1).max(160),
  customerContact: z.string().max(160).optional(),
  projectLocation: z.string().min(1).max(220),
  currency: z.enum(['MXN', 'USD']),
  discountPercent: z.number().min(0).max(100).default(0),
  taxPercent: z.number().min(0).max(100).default(16),
  conditions: z.string().max(300).optional(),
  hseNotes: z.string().max(300).optional(),
  legalNotes: z.string().max(300).optional(),
  observations: z.string().optional(),
  responsibleSignatureName: z.string().max(120).optional(),
  items: z.array(
    z.object({
      itemCode: z.string().min(1).max(30),
      description: z.string().min(1).max(300),
      quantity: z.number().positive(),
      unit: z.string().min(1).max(20),
      unitPrice: z.number().nonnegative()
    })
  ).min(1)
});

export const CreateCompanySettingsValidation = z.object({
  companyName: z.string().min(1).max(150),
  legalName: z.string().min(1).max(200),
  rfc: z.string().min(1).max(20),
  address: z.string().min(1),
  phone: z.string().min(1).max(40),
  email: z.string().email(),
  slogan: z.string().min(1).max(180),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).default('#08142b'),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i).default('#f97316'),
  defaultConditions: z.string().optional(),
  defaultNotes: z.string().optional(),
  defaultHse: z.string().optional(),
  technicalResponsibleName: z.string().max(120).optional(),
  bankDetails: z.string().optional(),
  taxPercent: z.number().min(0).max(100).default(16)
});

export const UpdateQuotationStatusValidation = z.object({
  status: z.enum(['draft', 'sent', 'approved', 'rejected']),
  note: z.string().optional()
});

export type CreateQuotationDTO = z.infer<typeof CreateQuotationValidation>;
export type CreateCompanySettingsDTO = z.infer<typeof CreateCompanySettingsValidation>;
export type UpdateQuotationStatusDTO = z.infer<typeof UpdateQuotationStatusValidation>;
