import { CompanySettings, QuotationDraft } from '../types/quotation';

const year = new Date().getFullYear();

export const defaultCompanySettings: CompanySettings = {
  companyName: 'KP Delta Ingenieria',
  legalName: 'KP Delta Ingenieria y Servicios Industriales SA de CV',
  rfc: 'KPD260101AAA',
  address: 'Calle Industria #123, Parque Industrial',
  phone: '(55) 0000 0000',
  email: 'contacto@kpdelta.mx',
  slogan: 'Ingenieria • Construccion • Mantenimiento',
  taxPercent: 16,
  defaultConditions: 'Pago 50% anticipo / 50% contra entrega. Garantia 12 meses.',
  defaultNotes: 'Propuesta valida por 15 dias naturales.',
  defaultHse: 'Personal con registro IMSS y EPP completo.',
  technicalLeadName: 'Ing. Responsable Tecnico',
  bankDetails: 'Banco Ejemplo, CLABE 000000000000000000',
  primaryColor: '#08142b',
  accentColor: '#f97316'
};

export const createDefaultQuotation = (): QuotationDraft => ({
  folio: `QT-${year}-001`,
  date: new Date().toISOString().slice(0, 10),
  validityDays: 15,
  discountPercent: 0,
  customerName: 'Cliente o Empresa Destino',
  customerContact: 'Ing. Responsable de Obra',
  customerEmail: '',
  customerPhone: '',
  customerRfc: '',
  customerAddress: '',
  destinationCompany: 'Empresa destino',
  projectLocation: 'Proyecto / ubicacion',
  currency: 'MXN',
  observations: '',
  conditions: defaultCompanySettings.defaultConditions,
  hseNotes: defaultCompanySettings.defaultHse,
  legalNotes: defaultCompanySettings.defaultNotes,
  responsibleSignature: defaultCompanySettings.technicalLeadName,
  status: 'draft',
  items: [
    {
      id: '01',
      description: 'Servicio de mantenimiento preventivo y correctivo.',
      quantity: 1,
      unit: 'SERV',
      unitPrice: 15800
    }
  ]
});
