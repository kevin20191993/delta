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
    const { quotation, items, company, clientLogo, headerImage } = data;
    const textBlocks = [
      quotation.showConditions !== false ? { key: 'conditions', title: 'Condiciones', body: quotation.conditions || '-' } : null,
      quotation.showHse !== false ? { key: 'hse', title: 'HSE / Seguridad', body: quotation.hseNotes || '-' } : null,
      quotation.showLegalNotes !== false ? { key: 'notes', title: 'Notas y validez', body: `${quotation.legalNotes || '-'} | Validez: ${quotation.validityDays} dias.` } : null
    ].filter(Boolean) as Array<{ key: string; title: string; body: string }>;
    const activeSignatures = [
      quotation.showResponsibleSignature !== false
        ? {
            key: 'responsible',
            title: quotation.salespersonFullName || quotation.responsibleSignatureName || 'Responsable comercial',
            subtitle: quotation.salespersonJobTitle || 'Asesor comercial'
          }
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
        <div class="condition-box">
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
    body { font-family: 'Archivo', Arial, sans-serif; line-height: 1.5; color: #11304f; background: #fff; }
    .page { width: 190mm; margin: 0 auto; padding: 10mm 0; background: white; }
    .page-break-avoid { break-inside: avoid; page-break-inside: avoid; }
    .page-break-before { break-before: page; page-break-before: always; }

    .hero-header { margin-bottom: 18px; border-radius: 20px; overflow: hidden; border: 1px solid #c9ecff; box-shadow: 0 16px 32px rgba(6, 50, 97, 0.08); }
    .hero-header img { display: block; width: 100%; height: auto; }

    header { display: grid; grid-template-columns: 1.3fr auto; gap: 20px; margin-bottom: 24px; padding: 18px 22px; background: linear-gradient(135deg, #f6fcff 0%, #edf8ff 45%, #ffffff 100%); border: 1px solid #cbe9ff; border-radius: 22px; }
    .company-info { display: flex; gap: 15px; }
    .logo { width: 76px; height: 76px; background: linear-gradient(180deg, #0d4f94 0%, #08264f 100%); border-radius: 18px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 28px; box-shadow: 0 12px 24px rgba(8, 38, 79, 0.18); }
    .logo img { width: 100%; height: 100%; object-fit: contain; }
    .company-details h1 { font-size: 24px; font-weight: bold; color: #08264f; margin-bottom: 4px; }
    .company-details .slogan { font-size: 11px; color: #14b4ff; font-weight: bold; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px; }
    .company-details p { font-size: 10px; color: #46627d; margin-bottom: 2px; }

    .folios { text-align: right; min-width: 170px; border-radius: 18px; padding: 14px 16px; background: linear-gradient(160deg, #0a2d5a 0%, #124d90 65%, #1db4ff 100%); color: white; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08); }
    .folios .label { font-size: 9px; text-transform: uppercase; color: rgba(255,255,255,0.68); font-weight: bold; letter-spacing: 1px; margin-bottom: 4px; }
    .folios .folio { font-size: 22px; font-weight: bold; color: white; margin-bottom: 4px; }
    .folios .date { font-size: 10px; color: rgba(255,255,255,0.84); }

    .blocks { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 16px; margin-bottom: 20px; break-inside: avoid; page-break-inside: avoid; }
    .block { padding: 18px; border-radius: 20px; position: relative; overflow: hidden; }
    .block::before { content: ""; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(12, 78, 147, 0.98) 0%, rgba(8, 38, 79, 0.98) 100%); }
    .block.client-block::before { background: linear-gradient(135deg, rgba(4, 52, 109, 0.98) 0%, rgba(18, 116, 196, 0.96) 72%, rgba(29, 180, 255, 0.9) 100%); }
    .block > * { position: relative; z-index: 1; }
    .block .label { font-size: 9px; text-transform: uppercase; color: #7fdcff; font-weight: bold; letter-spacing: 1.2px; margin-bottom: 8px; }
    .block .title { font-size: 18px; font-weight: bold; margin-bottom: 6px; color: white; }
    .block .subtitle { font-size: 12px; color: rgba(255,255,255,0.85); margin-bottom: 4px; }
    .block .detail { font-size: 10px; color: rgba(255,255,255,0.78); }

    .client-logo-wrap { margin-top: 14px; background: rgba(255,255,255,0.98); border-radius: 18px; padding: 14px 18px; min-height: 112px; display: flex; align-items: center; justify-content: center; box-shadow: 0 14px 26px rgba(4, 25, 58, 0.18); }
    .client-logo { max-width: 180px; max-height: 76px; width: auto; height: auto; }

    .table-wrap { break-inside: auto; page-break-inside: auto; margin-bottom: 14px; }
    table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #d9eefc; border-radius: 18px; overflow: hidden; }
    thead { background: linear-gradient(90deg, #08264f 0%, #104887 100%); color: white; }
    thead, tfoot { display: table-header-group; }
    thead th { padding: 10px; text-align: left; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
    tbody td { padding: 8px; border-bottom: 1px solid #e2edf5; font-size: 10px; }
    tbody tr:nth-child(even) { background: #f7fcff; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    
    .summary { display: block; margin-bottom: 16px; }
    .summary-section { break-inside: avoid; page-break-inside: avoid; margin-bottom: 12px; }
    .conditions { display: block; }
    .conditions-section { break-inside: avoid; page-break-inside: avoid; }
    .condition-box { background: linear-gradient(180deg, #ffffff 0%, #f5fbff 100%); border: 1px solid #d7ebfb; border-radius: 16px; padding: 12px 14px; min-height: 68px; width: 100%; box-shadow: 0 8px 18px rgba(15, 72, 136, 0.04); break-inside: avoid; page-break-inside: avoid; }
    .condition-box .label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #0d4f94; letter-spacing: 0.7px; margin-bottom: 8px; display: block; }
    .condition-box p { font-size: 10px; color: #4c647c; line-height: 1.5; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; }

    .totals-box { background: linear-gradient(135deg, #081f47 0%, #0d4f94 72%, #12b1ff 100%); color: white; border-radius: 20px; padding: 16px 18px; width: 100%; box-shadow: 0 20px 32px rgba(8, 38, 79, 0.16); break-inside: avoid; page-break-inside: avoid; }
    .total-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px; }
    .total-row .label { color: rgba(255,255,255,0.7); }
    .total-row .value { font-weight: bold; }
    
    .total-divider { border-top: 1px solid rgba(255,255,255,0.15); margin: 10px 0; padding-top: 10px; margin-bottom: 10px; }
    .total-final { display: flex; align-items: end; justify-content: space-between; gap: 14px; margin-top: 8px; }
    .total-final .label { font-size: 10px; text-transform: uppercase; color: #98e8ff; font-weight: bold; letter-spacing: 0.5px; display: block; margin-bottom: 6px; }
    .total-final .amount { font-size: 30px; font-weight: bold; line-height: 1; }
    
    .signatures { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 36px; margin-top: 24px; break-inside: avoid; page-break-inside: avoid; }
    .signatures-single { grid-template-columns: 1fr; justify-items: center; }
    .signature { text-align: center; width: 100%; max-width: 250px; justify-self: center; break-inside: avoid; page-break-inside: avoid; }
    .sig-line { border-top: 1px solid #333; width: 140px; margin: 0 auto 6px; }
    .sig-label { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
    .sig-subtitle { font-size: 9px; color: #999; margin-top: 4px; }

    @media print {
      .hero-header,
      header,
      .blocks,
      .block,
      .table-wrap,
      .totals-box,
      .summary-section,
      .condition-box,
      .signatures,
      .signature {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      .summary,
      .conditions {
        display: block !important;
        break-inside: auto;
        page-break-inside: auto;
      }
    }
    
  </style>
</head>
<body>
  <div class="page">
    ${headerImage ? `<div class="hero-header page-break-avoid"><img src="${headerImage}" alt="Header corporativo"></div>` : ''}
    <header class="page-break-avoid">
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

    <div class="blocks page-break-avoid">
      <div class="block">
        <div class="label">Atencion a</div>
        <div class="title">${quotation.customerAttention}</div>
        <div class="subtitle">${quotation.customerContact || ''}</div>
        <div class="detail">Empresa: ${quotation.destinationCompany}</div>
      </div>
      <div class="block client-block">
        <div class="label">Proyecto / cliente</div>
        <div class="title">${quotation.projectLocation}</div>
        <div class="detail">Ejecutivo responsable: ${quotation.salespersonFullName || quotation.responsibleSignatureName || 'Por asignar'}</div>
        ${quotation.showClientLogo !== false
          ? (clientLogo ? `<div class="client-logo-wrap"><img src="${clientLogo}" alt="Logo Cliente" class="client-logo"></div>` : '<div class="detail" style="margin-top: 12px;">Sin logo de cliente</div>')
          : '<div class="detail" style="margin-top: 12px;">Logo del cliente oculto</div>'}
      </div>
    </div>

    <div class="table-wrap">
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
    </div>

    <div class="summary">
      <div class="summary-section">
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

      <div class="conditions">
        <div class="conditions-section">
        ${textBlocksHtml}
        </div>
      </div>
    </div>

    ${signaturesHtml}
  </div>
</body>
</html>
    `;
  }
}
