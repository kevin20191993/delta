import { Router } from 'express';
import { QuotationController, CompanyController, UserController, CustomerController } from './controllers';
import { QuotationService, CompanyService, CustomerService } from '../application/services/quotation.service';
import {
  PostgresQuotationRepository,
  PostgresQuotationItemRepository,
  PostgresCompanySettingsRepository,
  PostgresCustomerRepository
} from '../infrastructure/database/repositories';
import { MySqlAuthRepository } from '../infrastructure/mysql/auth-repository';
import { requireAuth } from '../middleware/auth';

export function createRoutes(): Router {
  const router = Router();

  const quotationRepo = new PostgresQuotationRepository();
  const itemRepo = new PostgresQuotationItemRepository();
  const settingsRepo = new PostgresCompanySettingsRepository();
  const customerRepo = new PostgresCustomerRepository();

  const quotationService = new QuotationService(quotationRepo, itemRepo, settingsRepo, customerRepo);
  const companyService = new CompanyService(settingsRepo);
  const customerService = new CustomerService(customerRepo);
  const authRepo = new MySqlAuthRepository();

  const quotationController = new QuotationController(quotationService, companyService);
  const companyController = new CompanyController(companyService);
  const userController = new UserController(authRepo);
  const customerController = new CustomerController(customerService);

  // Quotation routes (protected)
  router.post('/api/quotations', requireAuth, (req, res) => quotationController.create(req, res));
  router.get('/api/quotations', requireAuth, (req, res) => quotationController.list(req, res));
  router.get('/api/quotations/next-folio', requireAuth, (req, res) => quotationController.nextFolio(req, res));
  router.get('/api/quotations/folio/:folio', requireAuth, (req, res) => quotationController.getByFolio(req, res));
  router.get('/api/quotations/:id', requireAuth, (req, res) => quotationController.getById(req, res));
  router.put('/api/quotations/:id', requireAuth, (req, res) => quotationController.update(req, res));
  router.patch('/api/quotations/:id/status', requireAuth, (req, res) => quotationController.updateStatus(req, res));
  router.post('/api/quotations/:id/duplicate', requireAuth, (req, res) => quotationController.duplicate(req, res));
  router.delete('/api/quotations/:id', requireAuth, (req, res) => quotationController.delete(req, res));

  // Company routes (protected)
  router.get('/api/company', requireAuth, (req, res) => companyController.get(req, res));
  router.put('/api/company', requireAuth, (req, res) => companyController.update(req, res));

  // Customer routes (protected)
  router.get('/api/customers', requireAuth, (req, res) => customerController.list(req, res));

  // User routes (protected)
  router.get('/api/users', requireAuth, (req, res) => userController.list(req, res));
  router.post('/api/users', requireAuth, (req, res) => userController.create(req as any, res));

  return router;
}
