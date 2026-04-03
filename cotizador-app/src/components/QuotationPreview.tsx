import { CompanySettings, QuotationDraft } from '../types/quotation';
import { safeText, toMoney } from '../lib/format';

interface Totals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

interface QuotationPreviewProps {
  company: CompanySettings;
  quotation: QuotationDraft;
  totals: Totals;
}

export default function QuotationPreview({ company, quotation, totals }: QuotationPreviewProps) {
  const activeTextBlocks = [
    quotation.showConditions ? { key: 'conditions', title: 'Condiciones', body: safeText(quotation.conditions) } : null,
    quotation.showHse ? { key: 'hse', title: 'HSE / seguridad', body: safeText(quotation.hseNotes) } : null,
    quotation.showLegalNotes ? { key: 'notes', title: 'Notas y validez', body: `${safeText(quotation.legalNotes)} | Validez: ${quotation.validityDays} dias.` } : null
  ].filter(Boolean) as Array<{ key: string; title: string; body: string }>;

  const activeSignatures = [
    quotation.showResponsibleSignature
      ? { key: 'responsible', title: safeText(quotation.responsibleSignature), subtitle: 'Responsable tecnico', accent: 'text-ink' }
      : null,
    quotation.showCustomerAcceptance
      ? { key: 'customer', title: 'Aceptacion de cliente', subtitle: 'Firma y sello', accent: 'text-slate-300' }
      : null
  ].filter(Boolean) as Array<{ key: string; title: string; subtitle: string; accent: string }>;

  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-panel animate-liftIn [animation-delay:120ms]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-[#eef2fb] via-transparent to-[#fff6ed]" />

      <header className="relative mb-6 grid grid-cols-1 gap-4 border-b border-slate-200 pb-5 lg:grid-cols-[1fr_auto]">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-ink text-2xl font-bold text-white">
            {company.companyLogo ? (
              <img src={company.companyLogo} alt="Logo empresa" className="h-full w-full object-contain" />
            ) : (
              company.companyName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="font-display text-3xl tracking-tight text-ink">{safeText(company.companyName, 'Tu empresa')}</h1>
            <p className="mt-1 text-sm font-semibold tracking-[0.16em] text-ember uppercase">{safeText(company.slogan, 'Servicios industriales')}</p>
            <p className="mt-2 text-xs text-slate">RFC: {safeText(company.rfc)} | {safeText(company.address)}</p>
            <p className="text-xs text-slate">Tel: {safeText(company.phone)} | {safeText(company.email)}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-5xl font-display tracking-wide text-slate-200">Cotizacion</p>
          <p className="text-xs font-semibold uppercase text-slate">Folio</p>
          <p className="text-2xl font-display text-ink">{safeText(quotation.folio)}</p>
          <p className="text-xs text-slate">Fecha: {safeText(quotation.date)}</p>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-0 overflow-hidden rounded-2xl bg-ink text-white lg:grid-cols-2">
        <div className="border-r border-white/15 p-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ember">Atencion a</p>
          <p className="text-2xl font-display">{safeText(quotation.customerName)}</p>
          <p className="text-sm text-slate-200">{safeText(quotation.customerContact)}</p>
          <p className="mt-2 text-xs text-slate-300">Empresa: {safeText(quotation.destinationCompany)}</p>
        </div>
        <div className="p-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ember">Proyecto / ubicacion</p>
          <p className="text-2xl font-display">{safeText(quotation.projectLocation)}</p>
          {quotation.showClientLogo && quotation.clientLogo ? (
            <div className="mt-3 inline-flex rounded-xl bg-white p-2">
              <img src={quotation.clientLogo} alt="Logo cliente" className="h-10 w-auto object-contain" />
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-300">
              {quotation.showClientLogo ? 'Sin logo de cliente.' : 'Logo del cliente oculto.'}
            </p>
          )}
        </div>
      </section>

      <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink text-left text-white">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Descripcion tecnica del concepto</th>
              <th className="px-3 py-2">Cant.</th>
              <th className="px-3 py-2">Unidad</th>
              <th className="px-3 py-2">P. Unitario</th>
              <th className="px-3 py-2 text-right">Importe</th>
            </tr>
          </thead>
          <tbody>
            {quotation.items.map((item, index) => {
              const amount = item.quantity * item.unitPrice;
              return (
                <tr key={`${item.id}-${index}`} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-3 py-2 font-semibold text-slate">{safeText(item.id)}</td>
                  <td className="px-3 py-2 text-ink">{safeText(item.description)}</td>
                  <td className="px-3 py-2">{item.quantity}</td>
                  <td className="px-3 py-2">{safeText(item.unit)}</td>
                  <td className="px-3 py-2">{toMoney(item.unitPrice, quotation.currency)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{toMoney(amount, quotation.currency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="space-y-4">
        <aside className="rounded-3xl bg-ink p-4 text-white">
          <div className="space-y-2 border-b border-white/10 pb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Subtotal</span>
              <strong>{toMoney(totals.subtotal, quotation.currency)}</strong>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Descuento</span>
              <strong>{toMoney(totals.discountAmount, quotation.currency)}</strong>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">IVA ({company.taxPercent}%)</span>
              <strong>{toMoney(totals.taxAmount, quotation.currency)}</strong>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ember">Inversion total</p>
            <p className="font-display text-4xl tracking-tight">{toMoney(totals.total, quotation.currency)}</p>
          </div>
        </aside>

        <div className="space-y-3">
          {activeTextBlocks.length > 0 && (
            <div className="grid gap-3 grid-cols-1">
              {activeTextBlocks.map((block) => (
                <div
                  key={block.key}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink">{block.title}</p>
                  <p className="min-h-16 whitespace-pre-wrap break-words text-sm leading-6 text-slate">{block.body}</p>
                </div>
              ))}
            </div>
          )}
          {activeSignatures.length > 0 && (
            <div className={`grid gap-6 pt-4 ${activeSignatures.length === 1 ? 'grid-cols-1 justify-items-center' : 'grid-cols-2'}`}>
              {activeSignatures.map((signature) => (
                <div key={signature.key} className="w-full max-w-xs text-center">
                  <div className="mx-auto mb-2 h-px w-40 bg-slate-300" />
                  <p className={`text-sm font-semibold ${signature.accent}`}>{signature.title}</p>
                  <p className={`text-xs uppercase tracking-[0.1em] ${signature.key === 'customer' ? 'text-slate-300' : 'text-slate'}`}>
                    {signature.subtitle}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </article>
  );
}
