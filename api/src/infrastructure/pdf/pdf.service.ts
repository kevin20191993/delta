import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

export interface PdfGenerationData {
  quotation: any;
  items: any[];
  company: any;
  clientLogo?: string;
}

export class PdfService {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async generate(data: PdfGenerationData, outputPath: string): Promise<string> {
    if (!this.browser) {
      await this.initialize();
    }

    const html = this.renderHtml(data);
    const page = await this.browser!.newPage();

    await page.setContent(html);
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      printBackground: true
    });

    await page.close();
    return outputPath;
  }

  private renderHtml(data: PdfGenerationData): string {
    const { quotation, items, company, clientLogo } = data;
    const textBlocks = [
      quotation.showConditions !== false ? { key: 'conditions', title: 'Condiciones', body: quotation.conditions || '-' } : null,
      quotation.showHse !== false ? { key: 'hse', title: 'HSE / Seguridad', body: quotation.hseNotes || '-' } : null,
      quotation.showLegalNotes !== false ? { key: 'notes', title: 'Notas y validez', body: `${quotation.legalNotes || '-'} | Validez: ${quotation.validityDays} dias.` } : null
    ].filter(Boolean) as Array<{ key: string; title: string; body: string }>;
    const activeSignatures = [
      quotation.showResponsibleSignature !== false
        ? { key: 'responsible', title: quotation.responsibleSignatureName || 'Responsable Tecnico', subtitle: 'Responsable Tecnico' }
        : null,
      quotation.showCustomerAcceptance !== false
        ? { key: 'customer', title: 'Aceptacion Cliente', subtitle: 'Firma y Sello' }
        : null
    ].filter(Boolean) as Array<{ key: string; title: string; subtitle: string }>;

    const subtotal = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);
    const discountAmount = subtotal * (quotation.discountPercent / 100);
    const taxable = Math.max(subtotal - discountAmount, 0);
    const taxAmount = taxable * (quotation.taxPercent / 100);
    const total = taxable + taxAmount;

    const formatMoney = (amount: number, currency: string): string => {
      const locale = currency === 'USD' ? 'en-US' : 'es-MX';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    };

    const itemsHtml = items
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.itemCode}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.unit}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatMoney(item.unitPrice, quotation.currency)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${formatMoney(item.quantity * item.unitPrice, quotation.currency)}</td>
      </tr>
    `
      )
      .join('');

    const textBlocksHtml = textBlocks
      .map(
        (block) => `
        <div class="condition-box ${block.key === 'notes' ? 'condition-box-wide' : ''}">
          <label class="label">${block.title}</label>
          <p>${block.body}</p>
        </div>
      `
      )
      .join('');

    const signaturesHtml = activeSignatures.length
      ? `
      <div class="signatures ${activeSignatures.length === 1 ? 'signatures-single' : ''}">
        ${activeSignatures
          .map(
            (signature) => `
            <div class="signature">
              <div class="sig-line"></div>
              <div class="sig-label">${signature.title}</div>
              <div class="sig-subtitle">${signature.subtitle}</div>
            </div>
          `
          )
          .join('')}
      </div>
    `
      : '';

    return `
<!DOCTYPE html>
<html lang="es-MX">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotizacion - ${quotation.folio}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Archivo', Arial, sans-serif; line-height: 1.5; color: #333; }
    .page { width: 190mm; margin: 0 auto; padding: 10mm 0; background: white; }
    
    header { display: grid; grid-template-columns: 1fr auto; gap: 20px; margin-bottom: 30px; border-bottom: 3px solid #08142b; padding-bottom: 20px; }
    .company-info { display: flex; gap: 15px; }
    .logo { width: 60px; height: 60px; background: #08142b; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 28px; }
    .logo img { width: 100%; height: 100%; object-fit: contain; }
    .company-details h1 { font-size: 24px; font-weight: bold; color: #08142b; margin-bottom: 4px; }
    .company-details .slogan { font-size: 11px; color: #f97316; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .company-details p { font-size: 10px; color: #666; margin-bottom: 2px; }
    
    .folios { text-align: right; }
    .folios .label { font-size: 9px; text-transform: uppercase; color: #999; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 4px; }
    .folios .folio { font-size: 22px; font-weight: bold; color: #08142b; margin-bottom: 4px; }
    .folios .date { font-size: 10px; color: #666; }
    
    .blocks { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-bottom: 20px; background: #08142b; color: white; border-radius: 12px; overflow: hidden; }
    .block { padding: 16px; border-right: 1px solid rgba(255,255,255,0.1); }
    .block:last-child { border-right: none; }
    .block .label { font-size: 9px; text-transform: uppercase; color: #f97316; font-weight: bold; letter-spacing: 1px; margin-bottom: 8px; }
    .block .title { font-size: 18px; font-weight: bold; margin-bottom: 6px; }
    .block .subtitle { font-size: 12px; color: rgba(255,255,255,0.8); margin-bottom: 4px; }
    .block .detail { font-size: 10px; color: rgba(255,255,255,0.7); }
    
    .client-logo { width: 80px; height: auto; margin-top: 12px; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead { background: #08142b; color: white; }
    thead th { padding: 10px; text-align: left; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
    tbody td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    
    .summary { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 20px; margin-bottom: 20px; align-items: start; }
    .conditions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; align-items: start; }
    .condition-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; min-height: 98px; }
    .condition-box-wide { grid-column: 1 / -1; }
    .condition-box .label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #08142b; letter-spacing: 0.5px; margin-bottom: 8px; display: block; }
    .condition-box p { font-size: 10px; color: #666; line-height: 1.5; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; }
    
    .totals-box { background: #08142b; color: white; border-radius: 16px; padding: 20px; }
    .total-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 8px; }
    .total-row .label { color: rgba(255,255,255,0.7); }
    .total-row .value { font-weight: bold; }
    
    .total-divider { border-top: 1px solid rgba(255,255,255,0.15); margin: 12px 0; padding-top: 12px; margin-bottom: 12px; }
    .total-final { margin-top: 16px; }
    .total-final .label { font-size: 10px; text-transform: uppercase; color: #f97316; font-weight: bold; letter-spacing: 0.5px; display: block; margin-bottom: 6px; }
    .total-final .amount { font-size: 42px; font-weight: bold; line-height: 1; }
    
    .signatures { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px; margin-top: 34px; }
    .signatures-single { grid-template-columns: 1fr; justify-items: center; }
    .signature { text-align: center; width: 100%; max-width: 250px; justify-self: center; }
    .sig-line { border-top: 1px solid #333; width: 140px; margin: 0 auto 6px; }
    .sig-label { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
    .sig-subtitle { font-size: 9px; color: #999; margin-top: 4px; }
    
    .footer-note { font-size: 9px; color: #999; margin-top: 20px; text-align: center; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="page">
    <header>
      <div class="company-info">
        <div class="logo">${company.logoDataUrl || company.logoFileId ? `<img src="${company.logoDataUrl || company.logoFileId}" alt="Logo">` : company.companyName.charAt(0).toUpperCase()}</div>
        <div class="company-details">
          <h1>${company.companyName}</h1>
          <div class="slogan">${company.slogan}</div>
          <p>RFC: ${company.rfc}</p>
          <p>${company.address}</p>
          <p>Tel: ${company.phone} | ${company.email}</p>
        </div>
      </div>
      <div class="folios">
        <div class="label">Cotizacion</div>
        <div class="folio">${quotation.folio}</div>
        <div class="date">${new Date(quotation.quotationDate).toLocaleDateString('es-MX')}</div>
      </div>
    </header>

    <div class="blocks">
      <div class="block">
        <div class="label">Atencion a</div>
        <div class="title">${quotation.customerAttention}</div>
        <div class="subtitle">${quotation.customerContact || ''}</div>
        <div class="detail">Empresa: ${quotation.destinationCompany}</div>
      </div>
      <div class="block">
        <div class="label">Proyecto / ubicacion</div>
        <div class="title">${quotation.projectLocation}</div>
        ${quotation.showClientLogo !== false
          ? (clientLogo ? `<img src="${clientLogo}" alt="Logo Cliente" class="client-logo">` : '<div class="detail" style="margin-top: 12px;">Sin logo de cliente</div>')
          : '<div class="detail" style="margin-top: 12px;">Logo del cliente oculto</div>'}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Descripcion tecnica del concepto</th>
          <th>Cant.</th>
          <th>Unidad</th>
          <th>P. Unitario</th>
          <th>Importe</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="summary">
      <div class="conditions">
        ${textBlocksHtml}
      </div>

      <div class="totals-box">
        <div class="total-row">
          <span class="label">Subtotal</span>
          <span class="value">${formatMoney(subtotal, quotation.currency)}</span>
        </div>
        <div class="total-row">
          <span class="label">Descuento</span>
          <span class="value">${formatMoney(discountAmount, quotation.currency)}</span>
        </div>
        <div class="total-row">
          <span class="label">IVA (${quotation.taxPercent}%)</span>
          <span class="value">${formatMoney(taxAmount, quotation.currency)}</span>
        </div>
        <div class="total-divider"></div>
        <div class="total-final">
          <label class="label">Inversion Total</label>
          <div class="amount">${formatMoney(total, quotation.currency)}</div>
        </div>
      </div>
    </div>

    ${signaturesHtml}

    <div class="footer-note">
      Propuesta valida por ${quotation.validityDays} dias naturales | Generado automaticamente
    </div>
  </div>
</body>
</html>
    `;
  }
}
