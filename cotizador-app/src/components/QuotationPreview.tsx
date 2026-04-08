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
  const companyWebsite = 'https://www.kp-delta-ing-tech.mx/';
  const activeTextBlocks = [
    quotation.showConditions ? { key: 'conditions', title: 'Condiciones', body: safeText(quotation.conditions) } : null,
    quotation.showHse ? { key: 'hse', title: 'HSE / seguridad', body: safeText(quotation.hseNotes) } : null,
    quotation.showLegalNotes ? { key: 'notes', title: 'Notas', body: safeText(quotation.legalNotes) } : null
  ].filter(Boolean) as Array<{ key: string; title: string; body: string }>;

  const companyInitials = safeText(company.companyName, 'KP')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <article className="overflow-hidden rounded-3xl border border-[#e7e9ee] bg-white p-6 shadow-panel animate-liftIn [animation-delay:120ms]">
      <div className="mb-6 h-1.5 w-full bg-[#11b7d8]" />

      <header className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex items-start gap-3">
          <div className="flex h-[82px] w-[82px] items-center justify-center overflow-hidden rounded-[14px] border border-[#b9edf6] bg-[#f3fcfe] text-sm font-bold text-white">
            {company.companyLogo ? (
              <img src={company.companyLogo} alt="Logo empresa" className="h-full w-full object-contain" />
            ) : (
              companyInitials || 'KP'
            )}
          </div>
          <div>
            <div className="text-xl font-extrabold uppercase tracking-tight text-[#0f172a]">{safeText(company.companyName, 'KP Delta')}</div>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#11b7d8]">
              {safeText(company.slogan, 'Ingenieria y tecnologia')}
            </p>
            <div className="mt-3 space-y-1 text-[11px] text-slate-500">
              <p>Soluciones Integrales</p>
              <p>RFC: {safeText(company.rfc)}</p>
              <p>{safeText(company.address)}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-4 text-right text-[22px] font-extrabold uppercase tracking-[0.16em] text-[#d4d8e1]">Cotización</p>
          <div className="border border-[#e7e9ee] bg-[#fafbfc] px-4 py-3 text-[11px] text-slate-600">
            <div className="grid grid-cols-[86px_1fr] gap-2 py-1">
              <span>Cotización No:</span>
              <strong className="text-[#0f172a]">{safeText(quotation.folio)}</strong>
            </div>
            <div className="grid grid-cols-[86px_1fr] gap-2 py-1">
              <span>Fecha:</span>
              <strong className="text-[#0f172a]">{safeText(quotation.date)}</strong>
            </div>
            <div className="grid grid-cols-[86px_1fr] gap-2 py-1">
              <span>Validez:</span>
              <strong className="text-[#0f172a]">{quotation.validityDays} dias naturales</strong>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-6 border-t border-[#e7e9ee] pt-5 lg:grid-cols-2">
        <div className="rounded-[18px] border border-[#d9f4fa] bg-[#f7fdff] p-5">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-[96px] w-[140px] items-center justify-center overflow-hidden rounded-[14px] border border-[#c9edf4] bg-white p-3">
              {quotation.showClientLogo && quotation.clientLogo ? (
                <img src={quotation.clientLogo} alt="Logo cliente" className="h-full w-full object-contain" />
              ) : (
                <span className="text-sm font-bold text-slate-400">Sin logo cliente</span>
              )}
            </div>
            <div>
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8fa4b0]">Preparado para</p>
              <p className="text-[18px] font-extrabold leading-tight text-[#111827]">{safeText(quotation.destinationCompany)}</p>
              <p className="mt-1 text-[11px] text-slate-600">Atn: <strong className="text-[#0f172a]">{safeText(quotation.customerName)}</strong></p>
              {quotation.customerContact ? <p className="text-[11px] text-slate-600">{safeText(quotation.customerContact)}</p> : null}
            </div>
          </div>
        </div>
        <div className="rounded-[18px] border border-[#d9f4fa] bg-[#f7fdff] p-5">
          <div className="mb-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8fa4b0]">Proyecto / cliente</p>
              <p className="text-[14px] font-extrabold text-[#111827]">{safeText(quotation.projectLocation)}</p>
              <p className="mt-1 text-[11px] text-slate-600">Ejecutivo a cargo: <strong className="text-[#0f172a]">{safeText(quotation.salespersonFullName || quotation.responsibleSignature)}</strong></p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#11b7d8] text-left text-white">
              <th className="w-[36px] border-b border-[#0ea0bd] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.05em]">ID</th>
              <th className="border-b border-[#0ea0bd] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.05em]">Descripción técnica del concepto</th>
              <th className="w-[62px] border-b border-[#0ea0bd] px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-[0.05em]">Cant.</th>
              <th className="w-[62px] border-b border-[#0ea0bd] px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-[0.05em]">Unidad</th>
              <th className="w-[92px] border-b border-[#0ea0bd] px-3 py-2 text-right text-[10px] font-extrabold uppercase tracking-[0.05em]">P. Unitario</th>
              <th className="w-[92px] border-b border-[#0ea0bd] px-3 py-2 text-right text-[10px] font-extrabold uppercase tracking-[0.05em]">Importe</th>
            </tr>
          </thead>
          <tbody>
            {quotation.items.map((item, index) => {
              const amount = item.quantity * item.unitPrice;
              return (
                <tr key={`${item.id}-${index}`} className="border-b border-[#edf0f4] align-top">
                  <td className="px-3 py-3 text-[11px] text-slate-500">{safeText(item.id)}</td>
                  <td className="px-3 py-3 text-[11px] text-[#334155]">{safeText(item.description)}</td>
                  <td className="px-3 py-3 text-center text-[11px] text-[#334155]">{item.quantity}</td>
                  <td className="px-3 py-3 text-center text-[11px] text-[#334155]">{safeText(item.unit)}</td>
                  <td className="px-3 py-3 text-right text-[11px] text-[#334155]">{toMoney(item.unitPrice, quotation.currency)}</td>
                  <td className="px-3 py-3 text-right text-[11px] font-extrabold text-[#0f172a]">{toMoney(amount, quotation.currency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section>
        <div className="mb-6 flex justify-end">
          <aside className="w-full max-w-[240px] border border-[#bdebf5] bg-[#f4fdff] p-4 shadow-[0_10px_24px_rgba(17,183,216,0.10)]">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Subtotal</span>
                <strong className="text-[#0f172a]">{toMoney(totals.subtotal, quotation.currency)}</strong>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Descuento</span>
                <strong className="text-[#0f172a]">{toMoney(totals.discountAmount, quotation.currency)}</strong>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>IVA ({company.taxPercent}%)</span>
                <strong className="text-[#0f172a]">{toMoney(totals.taxAmount, quotation.currency)}</strong>
              </div>
            </div>
            <div className="my-3 border-t border-[#bdebf5]" />
            <p className="mb-1 text-[12px] font-extrabold leading-5 text-[#11b7d8]">Inversión<br />Total</p>
            <p className="text-[18px] font-extrabold text-[#0f172a]">{toMoney(totals.total, quotation.currency)}</p>
            <p className="mt-2 text-right text-[9px] text-slate-400">* Precios expresados en Moneda Nacional ({quotation.currency})</p>
          </aside>
        </div>

        <div className="space-y-4 border-t border-[#e7e9ee] pt-5">
          <div className="space-y-2">
            {activeTextBlocks.map((block) => (
              <div key={block.key}>
                <p className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase text-[#0f172a]">
                  <span className="inline-block h-2 w-2 rounded-full border border-[#11b7d8]" />
                  {block.title}
                </p>
                <p className="whitespace-pre-wrap break-words text-[11px] leading-6 text-slate-600">{block.body}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[#d9f4fa] bg-[#f7fdff] px-5 py-4 text-center">
            <p className="text-[13px] font-extrabold text-[#0f172a]">{safeText(quotation.salespersonFullName || quotation.responsibleSignature)}</p>
            <p className="text-[11px] font-bold text-[#11b7d8]">{safeText(quotation.salespersonJobTitle, 'Asesor comercial')}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
              <span>{safeText(quotation.salespersonEmail, 'Sin correo')}</span>
              <span>{safeText(quotation.salespersonPhone, 'Sin teléfono')}</span>
              <span>{companyWebsite}</span>
            </div>
          </div>

          <div className="border-t border-[#eef2f6] pt-3 text-center text-[9px] text-[#c0c7d2]">
            Documento generado confidencialmente para uso exclusivo del cliente.
          </div>
        </div>
      </section>
    </article>
  );
}
