import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ItemsTable from '../components/ItemsTable';
import QuotationForm from '../components/QuotationForm';
import QuotationPreview from '../components/QuotationPreview';
import { createDefaultQuotation, defaultCompanySettings } from '../data/defaults';
import { padItemId, readImageAsDataUrl } from '../lib/format';
import { ApiClient, CustomerRecord } from '../lib/api';
import { CompanySettings, QuotationDraft, QuotationItem } from '../types/quotation';

const COMPANY_STORAGE_KEY = 'kp-cotizador-company-v1';
const QUOTATION_STORAGE_KEY = 'kp-cotizador-draft-v1';
const QUOTATION_ID_KEY = 'kp-cotizador-id-v1';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function normalizeCompanyData(raw: Partial<CompanySettings>): CompanySettings {
  return {
    ...defaultCompanySettings,
    ...raw,
    taxPercent: Number(raw.taxPercent ?? defaultCompanySettings.taxPercent)
  };
}

function normalizeDateInput(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function reorder<T>(list: T[], index: number, direction: 'up' | 'down'): T[] {
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= list.length) return list;
  const copy = [...list];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

function mapApiQuotationToDraft(data: any): QuotationDraft {
  return {
    folio: data.quotation.folio,
    date: String(data.quotation.quotationDate || data.quotation.quotation_date || '').slice(0, 10),
    validityDays: Number(data.quotation.validityDays ?? data.quotation.validity_days ?? 15),
    discountPercent: Number(data.quotation.discountPercent ?? data.quotation.discount_percent ?? 0),
    customerName: data.quotation.customerAttention ?? data.quotation.customer_attention ?? '',
    customerContact: data.quotation.customerContact ?? data.quotation.customer_contact ?? '',
    customerEmail: data.customer?.email ?? '',
    customerPhone: data.customer?.phone ?? '',
    customerRfc: data.customer?.rfc ?? '',
    customerAddress: data.customer?.address ?? '',
    destinationCompany: data.quotation.destinationCompany ?? data.quotation.destination_company ?? '',
    projectLocation: data.quotation.projectLocation ?? data.quotation.project_location ?? '',
    currency: data.quotation.currency ?? 'MXN',
    observations: data.quotation.observations ?? '',
    conditions: data.quotation.conditions ?? '',
    hseNotes: data.quotation.hseNotes ?? data.quotation.hse_notes ?? '',
    legalNotes: data.quotation.legalNotes ?? data.quotation.legal_notes ?? '',
    responsibleSignature: data.quotation.responsibleSignatureName ?? data.quotation.responsible_signature_name ?? '',
    clientLogo: data.customer?.logoDataUrl,
    status: data.quotation.status ?? 'draft',
    items: (data.items ?? []).map((item: any, index: number) => ({
      id: item.itemCode ?? item.item_code ?? padItemId(index),
      description: item.description,
      quantity: Number(item.quantity),
      unit: item.unit,
      unitPrice: Number(item.unitPrice ?? item.unit_price)
    }))
  };
}

export default function QuotationEditorPage() {
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanySettings>(() =>
    normalizeCompanyData(loadFromStorage(COMPANY_STORAGE_KEY, defaultCompanySettings))
  );
  const [quotation, setQuotation] = useState<QuotationDraft>(() =>
    loadFromStorage(QUOTATION_STORAGE_KEY, createDefaultQuotation())
  );
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [error, setError] = useState('');
  const [quotationId, setQuotationId] = useState<string>(() => localStorage.getItem(QUOTATION_ID_KEY) || '');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [companyResponse, customerResponse] = await Promise.all([
          ApiClient.getCompany(),
          ApiClient.listCustomers()
        ]);

        const normalizedCompany = normalizeCompanyData({
          ...companyResponse,
          technicalLeadName: companyResponse.technicalResponsibleName ?? companyResponse.technicalLeadName,
          companyLogo: companyResponse.logoDataUrl ?? companyResponse.companyLogo
        });

        setCompany(normalizedCompany);
        localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(normalizedCompany));
        setCustomers(customerResponse.customers ?? []);
      } catch (err) {
        console.warn('No fue posible cargar datos iniciales del cotizador:', err);
      }
    };

    void loadInitialData();
  }, []);

  useEffect(() => {
    const loadQuotation = async () => {
      if (!quotationId) {
        try {
          const next = await ApiClient.getNextFolio();
          setQuotation((prev) => {
            const updated = { ...prev, folio: next.folio };
            localStorage.setItem(QUOTATION_STORAGE_KEY, JSON.stringify(updated));
            return updated;
          });
        } catch {
          // keep local fallback
        }
        return;
      }

      try {
        const data = await ApiClient.getQuotation(quotationId);
        const mapped = mapApiQuotationToDraft(data);
        setQuotation(mapped);
        localStorage.setItem(QUOTATION_STORAGE_KEY, JSON.stringify(mapped));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la cotización');
      }
    };

    void loadQuotation();
  }, [quotationId]);

  useEffect(() => {
    const matched = customers.find(
      (customer) => (customer.companyName || customer.name || '').toLowerCase() === quotation.destinationCompany.trim().toLowerCase()
    );

    if (!matched) return;

    setQuotation((prev) => {
      const updated: QuotationDraft = {
        ...prev,
        customerName: prev.customerName || matched.contactName || prev.customerName,
        customerEmail: prev.customerEmail || matched.email || '',
        customerPhone: prev.customerPhone || matched.phone || '',
        customerRfc: prev.customerRfc || matched.rfc || '',
        customerAddress: prev.customerAddress || matched.address || '',
        clientLogo: prev.clientLogo || matched.logoDataUrl
      };
      localStorage.setItem(QUOTATION_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [quotation.destinationCompany, customers]);

  const totals = useMemo(() => {
    const subtotal = quotation.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discountAmount = subtotal * (quotation.discountPercent / 100);
    const taxable = Math.max(subtotal - discountAmount, 0);
    const taxAmount = taxable * (Number(company.taxPercent) / 100);
    return {
      subtotal,
      discountAmount,
      taxAmount,
      total: taxable + taxAmount
    };
  }, [quotation.items, quotation.discountPercent, company.taxPercent]);

  const setCompanyField = <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) => {
    const updated = normalizeCompanyData({ ...company, [key]: value });
    setCompany(updated);
    localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(updated));
  };

  const setQuotationField = <K extends keyof QuotationDraft>(key: K, value: QuotationDraft[K]) => {
    const updated = { ...quotation, [key]: value };
    setQuotation(updated);
    localStorage.setItem(QUOTATION_STORAGE_KEY, JSON.stringify(updated));
  };

  const setItems = (items: QuotationItem[]) => {
    const updated = { ...quotation, items };
    setQuotation(updated);
    localStorage.setItem(QUOTATION_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleUploadCompanyLogo = async (file?: File) => {
    if (!file) return;
    try {
      const image = await readImageAsDataUrl(file);
      setCompanyField('companyLogo', image);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el logo de empresa');
    }
  };

  const handleUploadClientLogo = async (file?: File) => {
    if (!file) return;
    try {
      const image = await readImageAsDataUrl(file);
      setQuotationField('clientLogo', image);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el logo del cliente');
    }
  };

  const addItem = () => {
    setItems([
      ...quotation.items,
      {
        id: padItemId(quotation.items.length),
        description: 'Nuevo concepto tecnico',
        quantity: 1,
        unit: 'SERV',
        unitPrice: 0
      }
    ]);
  };

  const removeItem = (index: number) => {
    const next = quotation.items.filter((_, itemIndex) => itemIndex !== index);
    setItems(next.length ? next : quotation.items);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    setItems(reorder(quotation.items, index, direction));
  };

  const updateItem = <K extends keyof QuotationItem>(index: number, key: K, value: QuotationItem[K]) => {
    const normalizedValue =
      key === 'quantity' ? (Math.max(Number(value), 0.01) as QuotationItem[K]) :
      key === 'unitPrice' ? (Math.max(Number(value), 0) as QuotationItem[K]) :
      value;

    setItems(
      quotation.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: normalizedValue } : item))
    );
  };

  const saveToBackend = async () => {
    setIsSaving(true);
    setError('');

    try {
      await ApiClient.updateCompany({
        companyName: company.companyName,
        legalName: company.legalName,
        rfc: company.rfc,
        address: company.address,
        phone: company.phone,
        email: company.email,
        slogan: company.slogan,
        logoDataUrl: company.companyLogo || '',
        primaryColor: company.primaryColor,
        accentColor: company.accentColor,
        defaultConditions: quotation.conditions || company.defaultConditions,
        defaultNotes: quotation.legalNotes || company.defaultNotes,
        defaultHse: quotation.hseNotes || company.defaultHse,
        technicalResponsibleName: company.technicalLeadName,
        bankDetails: company.bankDetails || '',
        taxPercent: Number(company.taxPercent)
      });

      const payload = {
        folio: quotation.folio,
        quotationDate: normalizeDateInput(quotation.date),
        validityDays: Number(quotation.validityDays),
        destinationCompany: quotation.destinationCompany,
        customerAttention: quotation.customerName,
        customerContact: quotation.customerContact,
        customerEmail: quotation.customerEmail,
        customerPhone: quotation.customerPhone,
        customerRfc: quotation.customerRfc,
        customerAddress: quotation.customerAddress,
        clientLogo: quotation.clientLogo || '',
        projectLocation: quotation.projectLocation,
        currency: quotation.currency,
        discountPercent: Number(quotation.discountPercent),
        taxPercent: Number(company.taxPercent),
        conditions: quotation.conditions,
        hseNotes: quotation.hseNotes,
        legalNotes: quotation.legalNotes,
        observations: quotation.observations,
        responsibleSignatureName: quotation.responsibleSignature,
        items: quotation.items.map((item) => ({
          itemCode: item.id,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitPrice: Number(item.unitPrice)
        }))
      };

      if (quotationId) {
        setError('La edición remota completa aún no está habilitada. Ya quedó lista la persistencia; el siguiente paso es habilitar update.');
      } else {
        const result = await ApiClient.createQuotation(payload);
        const savedQuotation = { ...quotation, folio: result.quotation.folio };
        setQuotation(savedQuotation);
        setQuotationId(result.quotation.id);
        localStorage.setItem(QUOTATION_ID_KEY, result.quotation.id);
        localStorage.setItem(QUOTATION_STORAGE_KEY, JSON.stringify(savedQuotation));
        const customerResponse = await ApiClient.listCustomers();
        setCustomers(customerResponse.customers ?? []);
      }

      setLastSaved(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la cotización');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (!quotationId) {
      setError('Guarda la cotización antes de exportar PDF.');
      return;
    }

    setIsExportingPdf(true);
    setError('');
    try {
      const token = localStorage.getItem('kp-cotizador-token') || '';
      const response = await fetch(`/api/quotations/${quotationId}/export-pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error generando PDF');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quotation.folio}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const resetQuotation = async () => {
    const next = {
      ...createDefaultQuotation(),
      responsibleSignature: company.technicalLeadName,
      conditions: company.defaultConditions,
      hseNotes: company.defaultHse,
      legalNotes: company.defaultNotes
    };

    try {
      const folioResponse = await ApiClient.getNextFolio();
      next.folio = folioResponse.folio;
    } catch {
      // keep fallback
    }

    setQuotation(next);
    setQuotationId('');
    localStorage.removeItem(QUOTATION_ID_KEY);
    localStorage.setItem(QUOTATION_STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <main className="min-h-screen bg-pearl px-4 py-6 font-body text-ink md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1580px]">
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-panel backdrop-blur md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <button
                type="button"
                onClick={() => navigate('/cotizador/')}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-ember hover:text-orange-600 transition"
              >
                ← Todas las cotizaciones
              </button>
              <h1 className="mt-0.5 font-display text-3xl text-ink">
                {quotationId ? `Cotización ${quotation.folio}` : 'Nueva cotización'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/cotizador/users')}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50"
              >
                Usuarios
              </button>
              <button
                type="button"
                onClick={saveToBackend}
                disabled={isSaving}
                className="rounded-lg bg-steel px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : lastSaved ? 'Actualizar' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => void resetQuotation()}
                className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-steel"
              >
                + Nueva
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf || !quotationId}
                className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
                title={!quotationId ? 'Guarda primero la cotización' : 'Exportar PDF'}
              >
                {isExportingPdf ? 'Generando...' : 'Exportar PDF'}
              </button>
            </div>
          </div>
          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {lastSaved && (
            <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              ✓ Guardado: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[58%_42%]">
          <section className="space-y-5">
            <QuotationForm
              company={company}
              quotation={quotation}
              customers={customers}
              onCompanyField={setCompanyField}
              onQuotationField={setQuotationField}
              onUploadCompanyLogo={handleUploadCompanyLogo}
              onUploadClientLogo={handleUploadClientLogo}
            />
            <ItemsTable
              items={quotation.items}
              currency={quotation.currency}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onMoveItem={moveItem}
              onUpdateItem={updateItem}
            />
          </section>

          <section className="xl:sticky xl:top-6 xl:self-start">
            <QuotationPreview company={company} quotation={quotation} totals={totals} />
          </section>
        </div>
      </div>
    </main>
  );
}
