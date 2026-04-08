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
  const headerImage = '/images/header.jpeg';
  const activeTextBlocks = [
    quotation.showConditions ? { key: 'conditions', title: 'Condiciones', body: safeText(quotation.conditions) } : null,
    quotation.showHse ? { key: 'hse', title: 'HSE / seguridad', body: safeText(quotation.hseNotes) } : null,
    quotation.showLegalNotes ? { key: 'notes', title: 'Notas y validez', body: `${safeText(quotation.legalNotes)} | Validez: ${quotation.validityDays} dias.` } : null
  ].filter(Boolean) as Array<{ key: string; title: string; body: string }>;

  const activeSignatures = [
    quotation.showResponsibleSignature
      ? {
          key: 'responsible',
          title: safeText(quotation.salespersonFullName || quotation.responsibleSignature),
          subtitle: safeText(quotation.salespersonJobTitle, 'Asesor comercial'),
          accent: 'text-[#08264f]'
        }
      : null,
    quotation.showCustomerAcceptance
      ? { key: 'customer', title: 'Aceptacion de cliente', subtitle: 'Firma y sello', accent: 'text-slate-300' }
      : null
  ].filter(Boolean) as Array<{ key: string; title: string; subtitle: string; accent: string }>;

  return (
    <article className="relative overflow-hidden rounded-3xl border border-[#cfe8fb] bg-white p-6 shadow-panel animate-liftIn [animation-delay:120ms]">
      <div className="mb-5 overflow-hidden rounded-[26px] border border-[#bfe6ff] shadow-[0_18px_36px_rgba(6,50,97,0.08)]">
        <img src={headerImage} alt="Header corporativo KP Delta" className="block h-auto w-full" />
      </div>

      <header className="relative mb-6 grid grid-cols-1 gap-4 rounded-[26px] border border-[#cfe8fb] bg-[linear-gradient(135deg,#f5fcff_0%,#ecf8ff_45%,#ffffff_100%)] p-5 lg:grid-cols-[1.3fr_auto]">
        <div className="flex items-start gap-4">
          <div className="flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,#0d4f94_0%,#08264f_100%)] text-2xl font-bold text-white shadow-[0_12px_24px_rgba(8,38,79,0.18)]">
            {company.companyLogo ? (
              <img src={company.companyLogo} alt="Logo empresa" className="h-full w-full object-contain" />
            ) : (
              company.companyName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="font-display text-3xl tracking-tight text-[#08264f]">{safeText(company.companyName, 'Tu empresa')}</h1>
            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-[#14b4ff]">{safeText(company.slogan, 'Servicios industriales')}</p>
            <p className="mt-2 text-xs text-slate">RFC: {safeText(company.rfc)} | {safeText(company.address)}</p>
            <p className="text-xs text-slate">Tel: {safeText(company.phone)} | {safeText(company.email)}</p>
          </div>
        </div>

        <div className="text-right rounded-[22px] bg-[linear-gradient(160deg,#0a2d5a_0%,#124d90_65%,#1db4ff_100%)] px-5 py-4 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Cotizacion</p>
          <p className="text-2xl font-display">{safeText(quotation.folio)}</p>
          <p className="mt-1 text-xs text-white/80">Fecha: {safeText(quotation.date)}</p>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#0c4e93_0%,#08264f_100%)] p-5 text-white shadow-[0_18px_32px_rgba(8,38,79,0.14)]">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7fdcff]">Atencion a</p>
          <p className="text-2xl font-display">{safeText(quotation.customerName)}</p>
          <p className="text-sm text-slate-200">{safeText(quotation.customerContact)}</p>
          <p className="mt-2 text-xs text-slate-300">Empresa: {safeText(quotation.destinationCompany)}</p>
        </div>
        <div className="overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#04346d_0%,#1274c4_72%,#1db4ff_100%)] p-5 text-white shadow-[0_18px_32px_rgba(8,38,79,0.14)]">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8f6ff]">Proyecto / cliente</p>
          <p className="text-2xl font-display">{safeText(quotation.projectLocation)}</p>
          <p className="mt-2 text-xs text-white/80">
            Ejecutivo responsable: {safeText(quotation.salespersonFullName || quotation.responsibleSignature)}
          </p>
          {quotation.showClientLogo && quotation.clientLogo ? (
            <div className="mt-4 flex min-h-[110px] items-center justify-center rounded-[18px] bg-white p-4 shadow-[0_14px_26px_rgba(4,25,58,0.18)]">
              <img src={quotation.clientLogo} alt="Logo cliente" className="max-h-[76px] w-auto object-contain" />
            </div>
          ) : (
            <p className="mt-3 text-xs text-white/75">
              {quotation.showClientLogo ? 'Sin logo de cliente.' : 'Logo del cliente oculto.'}
            </p>
          )}
        </div>
      </section>

      <section className="mb-6 overflow-hidden rounded-[22px] border border-[#d9eefc]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[linear-gradient(90deg,#08264f_0%,#104887_100%)] text-left text-white">
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
        <aside className="rounded-3xl bg-[linear-gradient(135deg,#081f47_0%,#0d4f94_72%,#12b1ff_100%)] p-4 text-white shadow-[0_20px_32px_rgba(8,38,79,0.16)]">
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#98e8ff]">Inversion total</p>
            <p className="font-display text-4xl tracking-tight">{toMoney(totals.total, quotation.currency)}</p>
          </div>
        </aside>

        <div className="space-y-3">
          {activeTextBlocks.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {activeTextBlocks.map((block) => (
                <div
                  key={block.key}
                  className="rounded-2xl border border-[#d7ebfb] bg-[linear-gradient(180deg,#ffffff_0%,#f5fbff_100%)] p-4 shadow-[0_8px_18px_rgba(15,72,136,0.04)]"
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0d4f94]">{block.title}</p>
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
