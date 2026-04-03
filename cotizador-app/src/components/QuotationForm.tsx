import { ChangeEvent } from 'react';
import { CompanySettings, CustomerRecord, QuotationDraft } from '../types/quotation';

interface QuotationFormProps {
  company: CompanySettings;
  quotation: QuotationDraft;
  customers: CustomerRecord[];
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
  customers,
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
            <input className={fieldClass} value={company.companyName} onChange={(e) => onCompanyField('companyName', e.target.value)} />
          </label>
          <label className="text-sm text-slate">
            RFC
            <input className={fieldClass} value={company.rfc} onChange={(e) => onCompanyField('rfc', e.target.value)} />
          </label>
          <label className="text-sm text-slate lg:col-span-2">
            Razon social
            <input className={fieldClass} value={company.legalName} onChange={(e) => onCompanyField('legalName', e.target.value)} />
          </label>
          <label className="text-sm text-slate lg:col-span-2">
            Slogan / giro
            <input className={fieldClass} value={company.slogan} onChange={(e) => onCompanyField('slogan', e.target.value)} />
          </label>
          <label className="text-sm text-slate lg:col-span-2">
            Direccion
            <input className={fieldClass} value={company.address} onChange={(e) => onCompanyField('address', e.target.value)} />
          </label>
          <label className="text-sm text-slate">
            Telefono
            <input className={fieldClass} value={company.phone} onChange={(e) => onCompanyField('phone', e.target.value)} />
          </label>
          <label className="text-sm text-slate">
            Correo
            <input type="email" className={fieldClass} value={company.email} onChange={(e) => onCompanyField('email', e.target.value)} />
          </label>
          <label className="text-sm text-slate">
            Responsable tecnico
            <input className={fieldClass} value={company.technicalLeadName} onChange={(e) => onCompanyField('technicalLeadName', e.target.value)} />
          </label>
          <label className="text-sm text-slate">
            Datos bancarios
            <input className={fieldClass} value={company.bankDetails || ''} onChange={(e) => onCompanyField('bankDetails', e.target.value)} />
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
            <input className={fieldClass} value={quotation.folio} onChange={(e) => onQuotationField('folio', e.target.value)} />
          </label>
          <label className="text-sm text-slate">
            Fecha
            <input type="date" className={fieldClass} value={quotation.date} onChange={(e) => onQuotationField('date', e.target.value)} />
          </label>
          <label className="text-sm text-slate">
            Cliente / atencion a
            <input className={fieldClass} value={quotation.customerName} onChange={(e) => onQuotationField('customerName', e.target.value)} />
          </label>
          <label className="text-sm text-slate">
            Contacto / responsable
            <input className={fieldClass} value={quotation.customerContact} onChange={(e) => onQuotationField('customerContact', e.target.value)} />
          </label>
          <label className="text-sm text-slate">
            Empresa destino
            <input list="customer-company-options" className={fieldClass} value={quotation.destinationCompany} onChange={(e) => onQuotationField('destinationCompany', e.target.value)} />
          </label>
          <label className="text-sm text-slate">
            Proyecto / ubicacion
            <input className={fieldClass} value={quotation.projectLocation} onChange={(e) => onQuotationField('projectLocation', e.target.value)} />
          </label>
          <label className="text-sm text-slate lg:col-span-2">
            Correo del cliente
            <input type="email" className={fieldClass} value={quotation.customerEmail} onChange={(e) => onQuotationField('customerEmail', e.target.value)} />
          </label>
          <label className="text-sm text-slate">
            Telefono del cliente
            <input className={fieldClass} value={quotation.customerPhone} onChange={(e) => onQuotationField('customerPhone', e.target.value)} />
          </label>
          <label className="text-sm text-slate">
            RFC del cliente
            <input className={fieldClass} value={quotation.customerRfc} onChange={(e) => onQuotationField('customerRfc', e.target.value)} />
          </label>
          <label className="text-sm text-slate lg:col-span-2">
            Direccion del cliente
            <input className={fieldClass} value={quotation.customerAddress} onChange={(e) => onQuotationField('customerAddress', e.target.value)} />
          </label>
          <label className="text-sm text-slate">
            Moneda
            <select className={fieldClass} value={quotation.currency} onChange={(e) => onQuotationField('currency', e.target.value as QuotationDraft['currency'])}>
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label className="text-sm text-slate">
            IVA (%)
            <input type="number" min={0} max={100} step={0.5} className={fieldClass} value={company.taxPercent} onChange={(e) => onCompanyField('taxPercent', Number(e.target.value))} />
          </label>
          <label className="text-sm text-slate">
            Vigencia (dias)
            <input type="number" min={1} max={365} className={fieldClass} value={quotation.validityDays} onChange={(e) => onQuotationField('validityDays', Number(e.target.value))} />
          </label>
          <label className="text-sm text-slate">
            Descuento (%)
            <input type="number" min={0} max={100} step={0.5} className={fieldClass} value={quotation.discountPercent} onChange={(e) => onQuotationField('discountPercent', Number(e.target.value))} />
          </label>
          <label className="text-sm text-slate lg:col-span-2">
            Logo del cliente (opcional)
            <input type="file" accept="image/*" className={fieldClass} onChange={(event) => void onUploadClientLogo(fileFromEvent(event))} />
          </label>
          <label className="text-sm text-slate lg:col-span-2">
            Condiciones
            <textarea className={`${fieldClass} h-20`} value={quotation.conditions} onChange={(e) => onQuotationField('conditions', e.target.value)} />
          </label>
          <label className="text-sm text-slate lg:col-span-2">
            HSE / seguridad
            <textarea className={`${fieldClass} h-20`} value={quotation.hseNotes} onChange={(e) => onQuotationField('hseNotes', e.target.value)} />
          </label>
          <label className="text-sm text-slate lg:col-span-2">
            Notas tecnicas y legales
            <textarea className={`${fieldClass} h-20`} value={quotation.legalNotes} onChange={(e) => onQuotationField('legalNotes', e.target.value)} />
          </label>
          <label className="text-sm text-slate lg:col-span-2">
            Responsable tecnico (firma)
            <input className={fieldClass} value={quotation.responsibleSignature} onChange={(e) => onQuotationField('responsibleSignature', e.target.value)} />
          </label>
        </div>
        <datalist id="customer-company-options">
          {customers.map((customer) => (
            <option key={customer.id} value={customer.companyName || customer.name} />
          ))}
        </datalist>
      </section>
    </div>
  );
}
