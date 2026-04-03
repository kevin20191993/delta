import { Router } from 'express';
import { QuotationController, CompanyController } from './controllers';
import { QuotationService, CompanyService } from '../application/services/quotation.service';
import {
  PostgresQuotationRepository,
  PostgresQuotationItemRepository,
  PostgresCompanySettingsRepository
} from '../infrastructure/database/repositories';
import { requireAuth } from '../middleware/auth';

export function createRoutes(): Router {
  const router = Router();

  const quotationRepo = new PostgresQuotationRepository();
  const itemRepo = new PostgresQuotationItemRepository();
  const settingsRepo = new PostgresCompanySettingsRepository();

  const quotationService = new QuotationService(quotationRepo, itemRepo, settingsRepo);
  const companyService = new CompanyService(settingsRepo);

  const quotationController = new QuotationController(quotationService, companyService);
  const companyController = new CompanyController(companyService);

  // Quotation routes (protected)
  router.post('/api/quotations', requireAuth, (req, res) => quotationController.create(req, res));
  router.get('/api/quotations', requireAuth, (req, res) => quotationController.list(req, res));
  router.get('/api/quotations/folio/:folio', requireAuth, (req, res) => quotationController.getByFolio(req, res));
  router.get('/api/quotations/:id', requireAuth, (req, res) => quotationController.getById(req, res));
  router.patch('/api/quotations/:id/status', requireAuth, (req, res) => quotationController.updateStatus(req, res));
  router.post('/api/quotations/:id/duplicate', requireAuth, (req, res) => quotationController.duplicate(req, res));
  router.delete('/api/quotations/:id', requireAuth, (req, res) => quotationController.delete(req, res));

  // Company routes (protected)
  router.get('/api/company', requireAuth, (req, res) => companyController.get(req, res));
  router.put('/api/company', requireAuth, (req, res) => companyController.update(req, res));

  return router;
}
