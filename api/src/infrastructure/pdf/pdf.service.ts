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
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
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
    body { font-family: 'Archivo', Arial, sans-serif; line-height: 1.5; color: #11304f; background: #fff; }
    .page { width: 190mm; margin: 0 auto; padding: 10mm 0; background: white; }
    .page-break-avoid { break-inside: avoid; page-break-inside: avoid; }
    .page-break-before { break-before: page; page-break-before: always; }

    .top-line { height: 5px; background: ${brandBlue}; margin-bottom: 24px; }
    header { display: grid; grid-template-columns: minmax(0, 1fr) 240px; gap: 28px; margin-bottom: 22px; }
    .company-info { display: flex; gap: 14px; }
    .logo { width: 82px; height: 82px; background: #f3fcfe; border: 1px solid #b9edf6; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: ${brandBlue}; font-weight: 700; font-size: 16px; flex-shrink: 0; }
    .logo img { width: 100%; height: 100%; object-fit: contain; }
    .brand-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .brand-text { line-height: 1; }
    .brand-title { font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: 0.02em; }
    .brand-subtitle { font-size: 10px; font-weight: 700; color: ${brandBlue}; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 4px; }
    .company-details p { font-size: 11px; color: #64748b; margin-bottom: 3px; }
    .company-details p.contact { color: ${brandBlue}; }

    .folio-panel { text-align: left; }
    .folio-title { font-size: 22px; font-weight: 800; color: #d4d8e1; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 14px; }
    .folio-card { border: 1px solid #e7e9ee; background: #fafbfc; padding: 14px 16px; }
    .folio-row { display: grid; grid-template-columns: 86px 1fr; gap: 8px; font-size: 11px; color: #475569; margin-bottom: 6px; }
    .folio-row:last-child { margin-bottom: 0; }
    .folio-row strong { color: #0f172a; }

    .meta-grid { border-top: 1px solid #e7e9ee; margin-bottom: 20px; padding-top: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 28px; break-inside: avoid; page-break-inside: avoid; }
    .meta-box .label { font-size: 10px; text-transform: uppercase; color: #a0aec0; font-weight: 800; letter-spacing: 0.12em; margin-bottom: 6px; }
    .meta-box .title { font-size: 18px; font-weight: 800; color: #111827; margin-bottom: 4px; line-height: 1.25; }
    .meta-box .detail { font-size: 11px; color: #475569; margin-bottom: 2px; }
    .meta-box .detail strong { color: #0f172a; }
    .brand-pair { border-top: 1px solid #e7e9ee; margin-bottom: 20px; padding-top: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 28px; break-inside: avoid; page-break-inside: avoid; }
    .brand-card { border: 1px solid #d9f4fa; background: #f7fdff; padding: 18px; border-radius: 18px; }
    .brand-card-head { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
    .brand-logo-large { width: 86px; height: 86px; border: 1px solid #c9edf4; background: #fff; border-radius: 14px; padding: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .brand-logo-large.client { width: 140px; height: 96px; padding: 10px; }
    .brand-logo-large img { width: 100%; height: 100%; object-fit: contain; }
    .client-logo-wrap { margin-top: 0; width: 160px; min-height: 86px; display: flex; align-items: center; justify-content: center; border: 1px solid #c9edf4; background: #fff; padding: 10px 12px; border-radius: 14px; }
    .client-logo { max-width: 136px; max-height: 62px; width: auto; height: auto; }

    .pricing-section { margin-bottom: 20px; }
    .table-wrap { break-inside: auto; page-break-inside: auto; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; border-spacing: 0; }
    thead { background: ${brandBlue}; color: white; }
    thead, tfoot { display: table-header-group; }
    thead th { padding: 10px 10px; text-align: left; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: white; border-bottom: 1px solid ${brandBlueDark}; }
    tbody td { padding: 11px 10px; border-bottom: 1px solid #edf0f4; font-size: 11px; color: #334155; vertical-align: top; }
    tbody tr:nth-child(even) { background: #fff; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    .col-id { width: 36px; color: #64748b; }
    .col-qty, .col-unit { width: 62px; text-align: center; }
    .col-money { width: 92px; text-align: right; }
    .amount-strong { font-weight: 800; color: #0f172a; }
    
    .closing-section { break-inside: avoid; page-break-inside: avoid; }
    .summary-layout { margin-bottom: 28px; }
    .totals-wrap { display: flex; justify-content: flex-end; margin-top: 0; margin-bottom: 24px; break-inside: avoid; page-break-inside: avoid; }
    .conditions { display: block; padding-top: 16px; border-top: 1px solid #e7e9ee; }
    .condition-box { break-inside: avoid; page-break-inside: avoid; }
    .condition-box + .condition-box { margin-top: 16px; }
    .condition-box .label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .condition-box .label::before { content: ""; width: 8px; height: 8px; border: 1.5px solid ${brandBlue}; border-radius: 50%; display: inline-block; }
    .condition-box p { font-size: 11px; color: #475569; line-height: 1.55; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; }

    .totals-box { margin-left: auto; width: 240px; background: #f4fdff; padding: 14px 16px; border: 1px solid #bdebf5; box-shadow: 0 10px 24px rgba(17,183,216,0.10); break-inside: avoid; page-break-inside: avoid; }
    .total-row { display: flex; justify-content: space-between; gap: 12px; font-size: 11px; color: #475569; margin-bottom: 8px; }
    .total-row .value { font-weight: 700; color: #0f172a; }
    .total-divider { border-top: 1px solid #bdebf5; margin: 10px 0 12px; }
    .total-final-label { font-size: 12px; font-weight: 800; color: ${brandBlue}; line-height: 1.25; margin-bottom: 6px; }
    .total-final-amount { font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1; }
    .total-note { font-size: 9px; color: #a0aec0; margin-top: 8px; text-align: right; }

    .executive-card { margin: 24px 0 0; border: 1px solid #d9f4fa; background: #f7fdff; border-radius: 18px; padding: 14px 18px; text-align: center; break-inside: avoid; page-break-inside: avoid; }
    .executive-name { font-size: 13px; font-weight: 800; color: #0f172a; }
    .executive-role { font-size: 11px; font-weight: 700; color: ${brandBlue}; margin-top: 2px; }
    .executive-meta { margin-top: 8px; font-size: 10px; color: #64748b; display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
    .footer-note { margin-top: 26px; border-top: 1px solid #eef2f6; padding-top: 12px; text-align: center; font-size: 9px; color: #c0c7d2; }

    @media print {
      .top-line,
      header,
      .brand-pair,
      .table-wrap,
      .closing-section,
      .totals-box,
      .condition-box,
      .executive-card,
      .footer-note {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      .totals-box {
        margin-top: 18px;
      }
    }
    
  </style>
</head>
<body>
  <div class="page">
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
          <p>Soluciones Integrales</p>
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
            <div class="detail">Atn: <strong>${quotation.customerAttention}</strong></div>
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
          <div class="total-row">
            <span class="label">Descuento</span>
            <span class="value">${formatMoney(discountAmount, quotation.currency)}</span>
          </div>
          <div class="total-row">
            <span class="label">IVA (${quotation.taxPercent}%)</span>
            <span class="value">${formatMoney(taxAmount, quotation.currency)}</span>
          </div>
          <div class="total-divider"></div>
          <div class="total-final-label">Inversión<br>Total</div>
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
