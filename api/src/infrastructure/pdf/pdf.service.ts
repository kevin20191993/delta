import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

export interface PdfGenerationData {
  quotation: any;
  items: any[];
  company: any;
  clientLogo?: string;
  headerImage?: string;
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

    const html = this.renderHtml({
      ...data,
      headerImage: data.headerImage || await this.loadHeaderImage()
    });
    const page = await this.browser!.newPage();

    await page.setContent(html);
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: { top: '6mm', right: '6mm', bottom: '6mm', left: '6mm' },
      scale: 0.93,
      printBackground: true
    });

    await page.close();
    return outputPath;
  }

  private async loadHeaderImage(): Promise<string> {
    const candidates = [
      path.resolve(process.cwd(), 'images/header.jpeg'),
      path.resolve(process.cwd(), '../images/header.jpeg'),
      path.resolve(process.cwd(), '../../images/header.jpeg')
    ];

    for (const candidate of candidates) {
      try {
        const buffer = await fs.readFile(candidate);
        return `data:image/jpeg;base64,${buffer.toString('base64')}`;
      } catch {
        // Continue with next candidate path
      }
    }

    return '';
  }

  private renderHtml(data: PdfGenerationData): string {
    const { quotation, items, company, clientLogo } = data;
    const brandBlue = '#11b7d8';
    const brandBlueDark = '#0b7898';
    const companyWebsite = 'https://www.kp-delta-ing-tech.mx/';
    const textBlocks = [
      quotation.showConditions !== false ? { key: 'conditions', title: 'Condiciones', body: quotation.conditions || '-' } : null,
      quotation.showHse !== false ? { key: 'hse', title: 'HSE / Seguridad', body: quotation.hseNotes || '-' } : null,
      quotation.showLegalNotes !== false ? { key: 'notes', title: 'Notas', body: quotation.legalNotes || '-' } : null
    ].filter(Boolean) as Array<{ key: string; title: string; body: string }>;

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
        <div class="condition-box">
          <label class="label">${block.title}</label>
          <p>${block.body}</p>
        </div>
      `
      )
      .join('');

    const companyInitials = company.companyName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part.charAt(0).toUpperCase())
      .join('');

    return `
<!DOCTYPE html>
<html lang="es-MX">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotizacion - ${quotation.folio}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Archivo', Arial, sans-serif; line-height: 1.4; color: #11304f; background: #fff; }
    .page { width: 190mm; margin: 0 auto; padding: 6mm 0; background: white; min-height: 285mm; display: flex; flex-direction: column; }
    .main-content { flex: 1 1 auto; }
    .page-footer-anchor { margin-top: auto; break-inside: avoid; page-break-inside: avoid; }
    .page-break-avoid { break-inside: avoid; page-break-inside: avoid; }
    .page-break-before { break-before: page; page-break-before: always; }

    .top-line { height: 4px; background: ${brandBlue}; margin-bottom: 14px; }
    header { display: grid; grid-template-columns: minmax(0, 1fr) 222px; gap: 18px; margin-bottom: 12px; }
    .company-info { display: flex; gap: 10px; }
    .logo { width: 72px; height: 72px; background: #f3fcfe; border: 1px solid #b9edf6; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: ${brandBlue}; font-weight: 700; font-size: 14px; flex-shrink: 0; }
    .logo img { width: 100%; height: 100%; object-fit: contain; }
    .brand-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .brand-text { line-height: 1; }
    .brand-title { font-size: 16px; font-weight: 800; color: #0f172a; letter-spacing: 0.02em; }
    .brand-subtitle { font-size: 9px; font-weight: 700; color: ${brandBlue}; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }
    .company-details p { font-size: 10px; color: #64748b; margin-bottom: 2px; }
    .company-details p.contact { color: ${brandBlue}; }

    .folio-panel { text-align: left; }
    .folio-title { font-size: 18px; font-weight: 800; color: #d4d8e1; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px; }
    .folio-card { border: 1px solid #e7e9ee; background: #fafbfc; padding: 10px 12px; }
    .folio-row { display: grid; grid-template-columns: 74px 1fr; gap: 6px; font-size: 10px; color: #475569; margin-bottom: 4px; }
    .folio-row:last-child { margin-bottom: 0; }
    .folio-row strong { color: #0f172a; }

    .meta-grid { border-top: 1px solid #e7e9ee; margin-bottom: 14px; padding-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; break-inside: avoid; page-break-inside: avoid; }
    .meta-box .label { font-size: 9px; text-transform: uppercase; color: #a0aec0; font-weight: 800; letter-spacing: 0.1em; margin-bottom: 4px; }
    .meta-box .title { font-size: 15px; font-weight: 800; color: #111827; margin-bottom: 2px; line-height: 1.2; }
    .meta-box .detail { font-size: 10px; color: #475569; margin-bottom: 1px; }
    .meta-box .detail strong { color: #0f172a; }
    .brand-pair { border-top: 1px solid #e7e9ee; margin-bottom: 12px; padding-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; break-inside: avoid; page-break-inside: avoid; }
    .brand-card { border: 1px solid #d9f4fa; background: #f7fdff; padding: 12px; border-radius: 14px; }
    .brand-card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
    .brand-logo-large { width: 74px; height: 74px; border: 1px solid #c9edf4; background: #fff; border-radius: 12px; padding: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .brand-logo-large.client { width: 120px; height: 76px; padding: 8px; }
    .brand-logo-large img { width: 100%; height: 100%; object-fit: contain; }
    .client-logo-wrap { margin-top: 0; width: 130px; min-height: 74px; display: flex; align-items: center; justify-content: center; border: 1px solid #c9edf4; background: #fff; padding: 8px 10px; border-radius: 12px; font-size: 10px; }
    .client-logo { max-width: 116px; max-height: 56px; width: auto; height: auto; }

    .pricing-section { margin-bottom: 10px; }
    .table-wrap { break-inside: auto; page-break-inside: auto; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; border-spacing: 0; }
    thead { background: ${brandBlue}; color: white; }
    thead, tfoot { display: table-header-group; }
    thead th { padding: 7px 8px; text-align: left; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: white; border-bottom: 1px solid ${brandBlueDark}; }
    tbody td { padding: 7px 8px; border-bottom: 1px solid #edf0f4; font-size: 10px; color: #334155; vertical-align: top; line-height: 1.35; }
    tbody tr:nth-child(even) { background: #fff; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    .col-id { width: 32px; color: #64748b; }
    .col-qty, .col-unit { width: 56px; text-align: center; }
    .col-money { width: 82px; text-align: right; }
    .amount-strong { font-weight: 800; color: #0f172a; }
    
    .closing-section { break-inside: auto; page-break-inside: auto; }
    .summary-layout { margin-bottom: 12px; }
    .totals-wrap { display: flex; justify-content: flex-end; margin-top: 0; margin-bottom: 10px; break-inside: avoid; page-break-inside: avoid; }
    .conditions { display: block; padding-top: 10px; border-top: 1px solid #e7e9ee; }
    .condition-box { break-inside: avoid; page-break-inside: avoid; }
    .condition-box + .condition-box { margin-top: 10px; }
    .condition-box .label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
    .condition-box .label::before { content: ""; width: 8px; height: 8px; border: 1.5px solid ${brandBlue}; border-radius: 50%; display: inline-block; }
    .condition-box p { font-size: 10px; color: #475569; line-height: 1.4; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; }

    .totals-box { margin-left: auto; width: 220px; background: #f4fdff; padding: 10px 12px; border: 1px solid #bdebf5; box-shadow: 0 8px 18px rgba(17,183,216,0.08); break-inside: avoid; page-break-inside: avoid; }
    .total-row { display: flex; justify-content: space-between; gap: 10px; font-size: 10px; color: #475569; margin-bottom: 6px; }
    .total-row .value { font-weight: 700; color: #0f172a; }
    .total-divider { border-top: 1px solid #bdebf5; margin: 7px 0 8px; }
    .total-final-label { font-size: 11px; font-weight: 800; color: ${brandBlue}; line-height: 1.2; margin-bottom: 4px; }
    .total-final-amount { font-size: 16px; font-weight: 800; color: #0f172a; line-height: 1; }
    .total-note { font-size: 8px; color: #a0aec0; margin-top: 6px; text-align: right; }

    .executive-card { margin: 8px 0 0; border: 1px solid #d9f4fa; background: #f7fdff; border-radius: 14px; padding: 10px 12px; text-align: center; break-inside: avoid; page-break-inside: avoid; }
    .executive-name { font-size: 12px; font-weight: 800; color: #0f172a; }
    .executive-role { font-size: 10px; font-weight: 700; color: ${brandBlue}; margin-top: 1px; }
    .executive-meta { margin-top: 5px; font-size: 9px; color: #64748b; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
    .footer-note { margin-top: 8px; border-top: 1px solid #eef2f6; padding-top: 8px; text-align: center; font-size: 8px; color: #c0c7d2; }

    @media print {
      .top-line,
      header,
      .brand-pair,
      .table-wrap,
      .totals-box,
      .condition-box,
      .executive-card,
      .footer-note {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      .totals-box { margin-top: 8px; }
    }
    
  </style>
</head>
<body>
  <div class="page">
    <div class="main-content">
    <div class="top-line page-break-avoid"></div>
    <header class="page-break-avoid">
      <div class="company-info">
        <div class="logo">${company.logoDataUrl || company.logoFileId ? `<img src="${company.logoDataUrl || company.logoFileId}" alt="Logo">` : companyInitials || 'KP'}</div>
        <div class="company-details">
          <div class="brand-row">
            <div class="brand-text">
              <div class="brand-title">${company.companyName}</div>
              <div class="brand-subtitle">${company.slogan || 'Ingenieria y tecnologia'}</div>
            </div>
          </div>
          <p>RFC: ${company.rfc}</p>
          <p>${company.address}</p>
        </div>
      </div>
      <div class="folio-panel">
        <div class="folio-title">Cotización</div>
        <div class="folio-card">
          <div class="folio-row"><span>Cotización No:</span><strong>${quotation.folio}</strong></div>
          <div class="folio-row"><span>Fecha:</span><strong>${new Date(quotation.quotationDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></div>
          <div class="folio-row"><span>Validez:</span><strong>${quotation.validityDays} dias naturales</strong></div>
        </div>
      </div>
    </header>

    <div class="brand-pair page-break-avoid">
      <div class="brand-card">
        <div class="brand-card-head">
          ${quotation.showClientLogo !== false
            ? (clientLogo ? `<div class="brand-logo-large client"><img src="${clientLogo}" alt="Logo Cliente" class="client-logo"></div>` : '<div class="client-logo-wrap">Sin logo cliente</div>')
            : '<div class="client-logo-wrap">Logo cliente oculto</div>'}
          <div class="meta-box">
            <div class="label">Preparado para</div>
            <div class="title">${quotation.destinationCompany}</div>
            <div class="detail"><strong>${quotation.customerAttention || 'Sin contacto asignado'}</strong></div>
            ${quotation.customerContact ? `<div class="detail">${quotation.customerContact}</div>` : ''}
          </div>
        </div>
      </div>
      <div class="brand-card">
        <div class="brand-card-head">
          <div class="meta-box">
            <div class="label">Proyecto / cliente</div>
            <div class="detail">Proyecto: <strong>${quotation.projectLocation}</strong></div>
            <div class="detail">Ejecutivo a cargo: <strong>${quotation.salespersonFullName || quotation.responsibleSignatureName || 'Por asignar'}</strong></div>
          </div>
        </div>
      </div>
    </div>

    <div class="pricing-section">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="col-id">ID</th>
              <th>Descripcion tecnica del concepto</th>
              <th class="col-qty">Cant.</th>
              <th class="col-unit">Unidad</th>
              <th class="col-money">P. Unitario</th>
              <th class="col-money">Importe</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <div class="totals-wrap">
        <div class="totals-box page-break-avoid">
          <div class="total-row">
            <span class="label">Subtotal</span>
            <span class="value">${formatMoney(subtotal, quotation.currency)}</span>
          </div>
          ${discountAmount > 0 ? `
          <div class="total-row">
            <span class="label">Descuento</span>
            <span class="value">${formatMoney(discountAmount, quotation.currency)}</span>
          </div>
          ` : ''}
          <div class="total-row">
            <span class="label">IVA (${quotation.taxPercent}%)</span>
            <span class="value">${formatMoney(taxAmount, quotation.currency)}</span>
          </div>
          <div class="total-divider"></div>
          <div class="total-final-label">Inversión Total</div>
          <div class="total-final-amount">${formatMoney(total, quotation.currency)}</div>
          <div class="total-note">* Precios expresados en Moneda Nacional (${quotation.currency})</div>
        </div>
      </div>
    </div>

    <div class="closing-section">
      <div class="summary-layout">
        <div class="conditions">
          ${textBlocksHtml}
        </div>
      </div>
    </div>
    </div>

    <div class="page-footer-anchor">
      <div class="executive-card">
        <div class="executive-name">${quotation.salespersonFullName || quotation.responsibleSignatureName || 'Responsable comercial'}</div>
        <div class="executive-role">${quotation.salespersonJobTitle || 'Asesor comercial'}</div>
        <div class="executive-meta">
          <span>${quotation.salespersonEmail || 'Sin correo'}</span>
          <span>${quotation.salespersonPhone || 'Sin teléfono'}</span>
          <span>${companyWebsite}</span>
        </div>
      </div>
      <div class="footer-note">Documento generado confidencialmente para uso exclusivo del cliente.</div>
    </div>
  </div>
</body>
</html>
    `;
  }
}
