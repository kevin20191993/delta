export interface Quotation {
  id: string;
  folio: string;
  companySettingsId: string;
  customerId?: string;
  quotationDate: Date;
  validityDays: number;
  destinationCompany: string;
  customerAttention: string;
  customerContact?: string;
  projectLocation: string;
  currency: 'MXN' | 'USD';
  discountPercent: number;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  conditions?: string;
  hseNotes?: string;
  legalNotes?: string;
  observations?: string;
  responsibleSignatureName?: string;
  clientLogoFileId?: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  itemOrder: number;
  itemCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  legalName: string;
  rfc: string;
  address: string;
  phone: string;
  email: string;
  slogan: string;
  logoFileId?: string;
  primaryColor: string;
  accentColor: string;
  defaultConditions?: string;
  defaultNotes?: string;
  defaultHse?: string;
  technicalResponsibleName?: string;
  technicalSignatureFileId?: string;
  bankDetails?: string;
  taxPercent: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface QuotationFile {
  id: string;
  quotationId?: string;
  fileKind: 'company_logo' | 'client_logo' | 'exported_pdf';
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  checksumSha256?: string;
  createdAt: Date;
  createdBy?: string;
}

export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}
