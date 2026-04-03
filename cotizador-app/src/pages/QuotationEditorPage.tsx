import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ItemsTable from '../components/ItemsTable';
import QuotationForm from '../components/QuotationForm';
import QuotationPreview from '../components/QuotationPreview';
import { createDefaultQuotation, defaultCompanySettings } from '../data/defaults';
import { padItemId, readImageAsDataUrl } from '../lib/format';
import { CompanySettings, QuotationDraft, QuotationItem } from '../types/quotation';
import { ApiClient } from '../lib/api';

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

function reorder<T>(list: T[], index: number, direction: 'up' | 'down'): T[] {
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= list.length) return list;
  const copy = [...list];
  const current = copy[index];
  copy[index] = copy[target];
  copy[target] = current;
  return copy;
}

function generateFolio(): string {
  const year = new Date().getFullYear();
  const sequenceKey = `kp-cotizador-seq-${year}`;
  const next = Number(localStorage.getItem(sequenceKey) ?? '0') + 1;
  localStorage.setItem(sequenceKey, String(next));
  return `QT-${year}-${String(next).padStart(3, '0')}`;
}

export default function QuotationEditorPage() {
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanySettings>(() =>
    loadFromStorage(COMPANY_STORAGE_KEY, defaultCompanySettings)
  );
  const [quotation, setQuotation] = useState<QuotationDraft>(() =>
    loadFromStorage(QUOTATION_STORAGE_KEY, createDefaultQuotation())
  );
  const [error, setError] = useState<string>('');
  const [quotationId, setQuotationId] = useState<string>(() => localStorage.getItem(QUOTATION_ID_KEY) || '');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Load company settings from API on mount
  useEffect(() => {
    const loadCompany = async () => {
      try {
        const data = await ApiClient.getCompany();
        if (data) {
          setCompany((prev) => ({ ...prev, ...data }));
          localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify({ ...company, ...data }));
        }
      } catch (err) {
        console.warn('Could not load company settings from API:', err);
      }
    };
    loadCompany();
  }, []);

  const totals = useMemo(() => {
    const subtotal = quotation.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discountAmount = subtotal * (quotation.discountPercent / 100);
    const taxable = Math.max(subtotal - discountAmount, 0);
    const taxAmount = taxable * (company.taxPercent / 100);
    const total = taxable + taxAmount;
    return { subtotal, discountAmount, taxAmount, total };
  }, [quotation.items, quotation.discountPercent, company.taxPercent]);

  const setCompanyField = <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) => {
    const updated = { ...company, [key]: value };
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
    setError('');
    if (!file) return;
    try {
      const image = await readImageAsDataUrl(file);
      setCompanyField('companyLogo', image);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo cargar el logo.');
    }
  };

  const handleUploadClientLogo = async (file?: File) => {
    setError('');
    if (!file) return;
    try {
      const image = await readImageAsDataUrl(file);
      setQuotationField('clientLogo', image);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo cargar el logo de cliente.');
    }
  };

  const addItem = () => {
    const next: QuotationItem = {
      id: padItemId(quotation.items.length),
      description: 'Nuevo concepto tecnico',
      quantity: 1,
      unit: 'SERV',
      unitPrice: 0
    };
    setItems([...quotation.items, next]);
  };

  const removeItem = (index: number) => {
    const next = quotation.items.filter((_, itemIndex) => itemIndex !== index);
    setItems(next.length > 0 ? next : quotation.items);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    setItems(reorder(quotation.items, index, direction));
  };

  const updateItem = <K extends keyof QuotationItem>(index: number, key: K, value: QuotationItem[K]) => {
    const normalizedValue =
      key === 'quantity'
        ? (Math.max(Number(value), 0.01) as QuotationItem[K])
        : key === 'unitPrice'
          ? (Math.max(Number(value), 0) as QuotationItem[K])
          : value;

    const updated = quotation.items.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      return { ...item, [key]: normalizedValue };
    });
    setItems(updated);
  };

  const saveToBackend = async () => {
    setIsSaving(true);
    setError('');
    try {
      const payload = {
        folio: quotation.folio,
        quotationDate: quotation.date,
        validityDays: quotation.validityDays,
        destinationCompany: quotation.destinationCompany,
        customerAttention: quotation.customerName,
        customerContact: quotation.customerContact,
        projectLocation: quotation.projectLocation,
        currency: quotation.currency,
        discountPercent: quotation.discountPercent,
        taxPercent: company.taxPercent,
        conditions: quotation.conditions,
        hseNotes: quotation.hseNotes,
        legalNotes: quotation.legalNotes,
        observations: quotation.observations,
        responsibleSignatureName: quotation.responsibleSignature,
        items: quotation.items.map((item) => ({
          itemCode: item.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice
        }))
      };

      if (quotationId) {
        console.log('Update not yet implemented');
      } else {
        const result = await ApiClient.createQuotation(payload);
        setQuotationId(result.quotation.id);
        localStorage.setItem(QUOTATION_ID_KEY, result.quotation.id);
      }

      setLastSaved(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving to backend');
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

  const resetQuotation = () => {
    const next = {
      ...createDefaultQuotation(),
      folio: generateFolio(),
      responsibleSignature: company.technicalLeadName,
      conditions: company.defaultConditions,
      hseNotes: company.defaultHse,
      legalNotes: company.defaultNotes
    };
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
              <h1 className="font-display text-3xl text-ink mt-0.5">
                {quotationId ? `Cotización ${quotation.folio}` : 'Nueva cotización'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
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
                onClick={resetQuotation}
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
