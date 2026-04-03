import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import { QuotationService, CompanyService } from '../application/services/quotation.service';
import { PdfService } from '../infrastructure/pdf/pdf.service';
import {
  PostgresQuotationRepository,
  PostgresQuotationItemRepository,
  PostgresCompanySettingsRepository,
  PostgresCustomerRepository
} from '../infrastructure/database/repositories';
import path from 'path';
import { requireAuth } from '../middleware/auth';

declare const __dirname: string;

const DEFAULT_COMPANY_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

export function createPdfRoutes(): Router {
  const router = Router();

  const quotationRepo = new PostgresQuotationRepository();
  const itemRepo = new PostgresQuotationItemRepository();
  const settingsRepo = new PostgresCompanySettingsRepository();
  const customerRepo = new PostgresCustomerRepository();

  const quotationService = new QuotationService(quotationRepo, itemRepo, settingsRepo, customerRepo);
  const pdfService = new PdfService();

  router.post('/api/quotations/:id/export-pdf', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const quotationData = await quotationService.getById(id);
      const company = await settingsRepo.getOrCreate(DEFAULT_COMPANY_SETTINGS_ID, {
        companyName: 'KP Delta Ing Tech',
        legalName: 'KP Delta Ing Tech',
        rfc: 'XAXX010101000',
        address: 'Por definir',
        phone: '+52 000 000 0000',
        email: 'info@kp-delta-ing-tech.mx',
        slogan: 'Soluciones de ingenieria y tecnologia',
        primaryColor: '#08142b',
        accentColor: '#f97316',
        defaultConditions: '',
        defaultNotes: '',
        defaultHse: '',
        technicalResponsibleName: '',
        bankDetails: '',
        taxPercent: 16
      });

      const outputDir = path.join(__dirname, '../../../PDFs');
      await fs.mkdir(outputDir, { recursive: true });
      const outputPath = path.join(outputDir, `${quotationData.quotation.folio}.pdf`);

      await pdfService.generate(
        {
          quotation: quotationData.quotation,
          items: quotationData.items,
          company,
          clientLogo: quotationData.quotation.clientLogoFileId
        },
        outputPath
      );

      res.download(outputPath, `${quotationData.quotation.folio}.pdf`);
    } catch (err) {
      res.status(500).json({ error: 'Error generating PDF' });
    }
  });

  return router;
}
