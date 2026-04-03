import { ChangeEvent } from 'react';
import { CompanySettings, QuotationDraft } from '../types/quotation';

interface QuotationFormProps {
  company: CompanySettings;
  quotation: QuotationDraft;
  onCompanyField: <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) => void;
  onQuotationField: <K extends keyof QuotationDraft>(key: K, value: QuotationDraft[K]) => void;
  onUploadCompanyLogo: (file?: File) => Promise<void>;
  onUploadClientLogo: (file?: File) => Promise<void>;
}

const panelClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-panel';

const fieldClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel';

function fileFromEvent(event: ChangeEvent<HTMLInputElement>): File | undefined {
  return event.target.files?.[0];
}

export default function QuotationForm({
  company,
  quotation,
  onCompanyField,
  onQuotationField,
  onUploadCompanyLogo,
  onUploadClientLogo
}: QuotationFormProps) {
  return (
    <div className="space-y-5">
      <section className={`${panelClass} animate-liftIn`}>
        <div className="mb-4">
          <h2 className="font-display text-xl text-ink">Configuracion corporativa</h2>
          <p className="text-sm text-slate">Logo global y datos de tu empresa para todas las cotizaciones.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <label className="text-sm text-slate">
            Nombre comercial
            <input
              className={fieldClass}
              value={company.companyName}
              onChange={(event) => onCompanyField('companyName', event.target.value)}
              maxLength={120}
            />
          </label>
          <label className="text-sm text-slate">
            RFC
            <input
              className={fieldClass}
              value={company.rfc}
              onChange={(event) => onCompanyField('rfc', event.target.value)}
              maxLength={20}
            />
          </label>
          <label className="text-sm text-slate lg:col-span-2">
            Slogan / giro
            <input
              className={fieldClass}
              value={company.slogan}
              onChange={(event) => onCompanyField('slogan', event.target.value)}
              maxLength={180}
            />
          </label>
          <label className="text-sm text-slate lg:col-span-2">
            Logo principal (global)
            <input type="file" accept="image/*" className={fieldClass} onChange={(event) => void onUploadCompanyLogo(fileFromEvent(event))} />
          </label>
        </div>
      </section>

      <section className={`${panelClass} animate-liftIn [animation-delay:40ms]`}>
        <div className="mb-4">
          <h2 className="font-display text-xl text-ink">Datos de cotizacion</h2>
          <p className="text-sm text-slate">Informacion comercial, cliente y parametros del documento.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <label className="text-sm text-slate">
            Folio
            <input
              className={fieldClass}
              value={quotation.folio}
              onChange={(event) => onQuotationField('folio', event.target.value)}
              maxLength={30}
            />
          </label>
          <label className="text-sm text-slate">
            Fecha
            <input
              type="date"
              className={fieldClass}
              value={quotation.date}
              onChange={(event) => onQuotationField('date', event.target.value)}
            />
          </label>
          <label className="text-sm text-slate">
            Cliente / atencion a
            <input
              className={fieldClass}
              value={quotation.customerName}
              onChange={(event) => onQuotationField('customerName', event.target.value)}
              maxLength={120}
            />
          </label>
          <label className="text-sm text-slate">
            Contacto / responsable
            <input
              className={fieldClass}
              value={quotation.customerContact}
              onChange={(event) => onQuotationField('customerContact', event.target.value)}
              maxLength={120}
            />
          </label>
          <label className="text-sm text-slate">
            Empresa destino
            <input
              className={fieldClass}
              value={quotation.destinationCompany}
              onChange={(event) => onQuotationField('destinationCompany', event.target.value)}
              maxLength={140}
            />
          </label>
          <label className="text-sm text-slate">
            Proyecto / ubicacion
            <input
              className={fieldClass}
              value={quotation.projectLocation}
              onChange={(event) => onQuotationField('projectLocation', event.target.value)}
              maxLength={180}
            />
          </label>
          <label className="text-sm text-slate">
            Moneda
            <select
              className={fieldClass}
              value={quotation.currency}
              onChange={(event) => onQuotationField('currency', event.target.value as QuotationDraft['currency'])}
            >
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label className="text-sm text-slate">
            IVA (%)
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              className={fieldClass}
              value={company.taxPercent}
              onChange={(event) => onCompanyField('taxPercent', Number(event.target.value))}
            />
          </label>
          <label className="text-sm text-slate">
            Vigencia (dias)
            <input
              type="number"
              min={1}
              max={365}
              className={fieldClass}
              value={quotation.validityDays}
              onChange={(event) => onQuotationField('validityDays', Number(event.target.value))}
            />
          </label>
          <label className="text-sm text-slate">
            Descuento (%)
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              className={fieldClass}
              value={quotation.discountPercent}
              onChange={(event) => onQuotationField('discountPercent', Number(event.target.value))}
            />
          </label>
          <label className="text-sm text-slate lg:col-span-2">
            Logo del cliente (opcional)
            <input type="file" accept="image/*" className={fieldClass} onChange={(event) => void onUploadClientLogo(fileFromEvent(event))} />
          </label>
          <label className="text-sm text-slate lg:col-span-2">
            Condiciones
            <textarea
              className={`${fieldClass} h-20`}
              value={quotation.conditions}
              onChange={(event) => onQuotationField('conditions', event.target.value)}
              maxLength={300}
            />
          </label>
          <label className="text-sm text-slate lg:col-span-2">
            HSE / seguridad
            <textarea
              className={`${fieldClass} h-20`}
              value={quotation.hseNotes}
              onChange={(event) => onQuotationField('hseNotes', event.target.value)}
              maxLength={300}
            />
          </label>
          <label className="text-sm text-slate lg:col-span-2">
            Notas tecnicas y legales
            <textarea
              className={`${fieldClass} h-20`}
              value={quotation.legalNotes}
              onChange={(event) => onQuotationField('legalNotes', event.target.value)}
              maxLength={300}
            />
          </label>
          <label className="text-sm text-slate lg:col-span-2">
            Responsable tecnico (firma)
            <input
              className={fieldClass}
              value={quotation.responsibleSignature}
              onChange={(event) => onQuotationField('responsibleSignature', event.target.value)}
              maxLength={120}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
