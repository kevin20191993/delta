export type CurrencyCode = 'MXN' | 'USD';

export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected';

export interface CompanySettings {
  companyName: string;
  legalName: string;
  rfc: string;
  address: string;
  phone: string;
  email: string;
  slogan: string;
  taxPercent: number;
  defaultConditions: string;
  defaultNotes: string;
  defaultHse: string;
  technicalLeadName: string;
  bankDetails?: string;
  primaryColor: string;
  accentColor: string;
  companyLogo?: string;
}

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface QuotationDraft {
  folio: string;
  date: string;
  validityDays: number;
  discountPercent: number;
  customerName: string;
  customerContact: string;
  destinationCompany: string;
  projectLocation: string;
  currency: CurrencyCode;
  observations: string;
  conditions: string;
  hseNotes: string;
  legalNotes: string;
  responsibleSignature: string;
  clientLogo?: string;
  status: QuotationStatus;
  items: QuotationItem[];
}
