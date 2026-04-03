import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiClient, clearToken } from '../lib/api';

type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected';

interface QuotationSummary {
  id: string;
  folio: string;
  status: QuotationStatus;
  destinationCompany: string;
  customerAttention: string;
  quotationDate: string;
  currency: string;
  total?: number;
  createdAt: string;
}

const STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  approved: 'Aprobada',
  rejected: 'Rechazada'
};

const STATUS_CLASSES: Record<QuotationStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
};

function formatCurrency(amount: number | undefined, currency: string): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function QuotationsListPage() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<QuotationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const loadQuotations = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await ApiClient.listQuotations({
        status: filterStatus || undefined,
        limit: 100
      });
      const normalized = (Array.isArray(result) ? result : result.quotations ?? []).map((entry: any) => ({
        id: entry.quotation?.id ?? entry.id,
        folio: entry.quotation?.folio ?? entry.folio,
        status: entry.quotation?.status ?? entry.status,
        destinationCompany: entry.quotation?.destinationCompany ?? entry.destinationCompany ?? entry.destination_company ?? '',
        customerAttention: entry.quotation?.customerAttention ?? entry.customerAttention ?? entry.customer_attention ?? '',
        quotationDate: entry.quotation?.quotationDate ?? entry.quotationDate ?? entry.quotation_date ?? '',
        currency: entry.quotation?.currency ?? entry.currency ?? 'MXN',
        total: Number(entry.quotation?.total ?? entry.total ?? entry.total_amount ?? 0),
        createdAt: entry.quotation?.createdAt ?? entry.createdAt ?? entry.created_at ?? ''
      }));
      setQuotations(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando cotizaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, [filterStatus]);

  const handleLogout = () => {
    clearToken();
    navigate('/cotizador/login');
  };

  const handleNewQuotation = () => {
    // Clear any stored draft so editor starts fresh
    localStorage.removeItem('kp-cotizador-draft-v1');
    localStorage.removeItem('kp-cotizador-id-v1');
    navigate('/cotizador/editor');
  };

  const handleDelete = async (id: string, folio: string) => {
    if (!confirm(`¿Eliminar la cotización ${folio}? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    try {
      await ApiClient.deleteQuotation(id);
      setQuotations((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportPdf = async (id: string) => {
    setExportingId(id);
    const previewWindow = window.open('', '_blank');
    try {
      const token = localStorage.getItem('kp-cotizador-token') || '';
      const response = await fetch(`/api/quotations/${id}/export-pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error generando PDF');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (previewWindow) {
        previewWindow.location.href = url;
      } else {
        window.open(url, '_blank');
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      if (previewWindow && !previewWindow.closed) {
        previewWindow.close();
      }
      alert(err instanceof Error ? err.message : 'Error al exportar PDF');
    } finally {
      setExportingId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setStatusUpdatingId(id);
    try {
      await ApiClient.updateQuotationStatus(id, newStatus);
      setQuotations((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: newStatus as QuotationStatus } : q))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error actualizando estado');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleOpenEditor = (id: string) => {
    // Store the quotation ID so the editor can load it
    localStorage.setItem('kp-cotizador-id-v1', id);
    navigate('/cotizador/editor');
  };

  return (
    <div className="min-h-screen bg-pearl px-4 py-6 font-body text-ink md:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-panel backdrop-blur md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ember">
                Sistema corporativo de cotizaciones
              </p>
              <h1 className="font-display text-3xl text-ink">Cotizaciones</h1>
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
                onClick={handleNewQuotation}
                className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                + Nueva cotización
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          {['', 'draft', 'sent', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                filterStatus === s
                  ? 'bg-ink text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s === '' ? 'Todas' : STATUS_LABELS[s as QuotationStatus]}
            </button>
          ))}
        </div>

        {/* Table card */}
        <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-panel backdrop-blur overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
              Cargando cotizaciones...
            </div>
          )}

          {error && (
            <div className="p-4">
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            </div>
          )}

          {!loading && !error && quotations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-slate-400 text-sm mb-4">No hay cotizaciones{filterStatus ? ' con ese estado' : ''}.</p>
              <button
                type="button"
                onClick={handleNewQuotation}
                className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                + Crear primera cotización
              </button>
            </div>
          )}

          {!loading && quotations.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Folio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Empresa / Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-ink">
                        {q.folio}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{q.destinationCompany || '—'}</p>
                        {q.customerAttention && (
                          <p className="text-xs text-slate-400">Att: {q.customerAttention}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(q.quotationDate)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={q.status}
                          disabled={statusUpdatingId === q.id}
                          onChange={(e) => handleStatusChange(q.id, e.target.value)}
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold border-0 cursor-pointer focus:outline-none ${STATUS_CLASSES[q.status]}`}
                        >
                          <option value="draft">Borrador</option>
                          <option value="sent">Enviada</option>
                          <option value="approved">Aprobada</option>
                          <option value="rejected">Rechazada</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-ink">
                        {formatCurrency(q.total, q.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            title="Abrir en editor"
                            onClick={() => handleOpenEditor(q.id)}
                            className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-ink hover:bg-slate-200 transition"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            title="Ver PDF"
                            disabled={exportingId === q.id}
                            onClick={() => handleExportPdf(q.id)}
                            className="rounded-md bg-ink px-2 py-1 text-xs font-semibold text-white hover:bg-steel disabled:opacity-50 transition"
                          >
                            {exportingId === q.id ? '...' : 'PDF'}
                          </button>
                          <button
                            type="button"
                            title="Eliminar"
                            disabled={deletingId === q.id}
                            onClick={() => handleDelete(q.id, q.folio)}
                            className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition"
                          >
                            {deletingId === q.id ? '...' : '✕'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          {quotations.length} cotización{quotations.length !== 1 ? 'es' : ''} registrada{quotations.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
