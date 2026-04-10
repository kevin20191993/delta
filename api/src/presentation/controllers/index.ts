import { Request, Response } from 'express';
import { QuotationService, CompanyService, CustomerService } from '../../application/services/quotation.service';
import { CreateQuotationValidation, UpdateQuotationStatusValidation, CreateCompanySettingsValidation } from '../../common/validation/index';
import { ZodError } from 'zod';
import { MySqlAuthRepository } from '../../infrastructure/mysql/auth-repository';
import { hashPassword } from '../../auth/password';
import { AuthenticatedRequest } from '../../middleware/auth';

export class QuotationController {
  constructor(
    private quotationService: QuotationService,
    private companyService: CompanyService,
    private authRepo: MySqlAuthRepository
  ) {}

  private async resolveCurrentUser(req: AuthenticatedRequest) {
    return req.authUser?.id ? await this.authRepo.findById(Number(req.authUser.id)) : null;
  }

  private canEditQuotation(currentUser: Awaited<ReturnType<QuotationController['resolveCurrentUser']>>, quotation: { createdBy?: string | null; salespersonFullName?: string | null; responsibleSignatureName?: string | null }): boolean {
    if (!currentUser) return false;
    if (currentUser.canEditAllQuotations) return true;

    const currentUsername = (currentUser.username || '').trim().toLowerCase();
    const currentFullName = (currentUser.fullName || '').trim().toLowerCase();
    const createdBy = (quotation.createdBy || '').trim().toLowerCase();
    const salespersonFullName = (quotation.salespersonFullName || '').trim().toLowerCase();
    const responsibleSignatureName = (quotation.responsibleSignatureName || '').trim().toLowerCase();

    return Boolean(
      (createdBy && createdBy === currentUsername) ||
      (salespersonFullName && (salespersonFullName === currentFullName || salespersonFullName === currentUsername)) ||
      (responsibleSignatureName && (responsibleSignatureName === currentFullName || responsibleSignatureName === currentUsername))
    );
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const companySettingsId = req.headers['x-company-id'] as string || 'default';
      const validated = CreateQuotationValidation.parse(req.body);
      const currentUser = await this.resolveCurrentUser(req);
      const result = await this.quotationService.createWithAuthor(companySettingsId, validated, {
        username: currentUser?.username || req.authUser?.username || 'api',
        fullName: currentUser?.fullName || req.authUser?.fullName || req.authUser?.username,
        jobTitle: currentUser?.jobTitle || req.authUser?.jobTitle || '',
        email: currentUser?.email || req.authUser?.email || '',
        phone: currentUser?.phone || req.authUser?.phone || ''
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ error: 'Validation error', details: err.errors });
      } else if (err instanceof Error) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Unknown error' });
      }
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.quotationService.getById(id);
      res.json(result);
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        res.status(404).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Unknown error' });
      }
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companySettingsId = req.headers['x-company-id'] as string || 'default';
      const validated = CreateQuotationValidation.parse(req.body);
      const currentUser = await this.resolveCurrentUser(req);
      const existing = await this.quotationService.getById(id);

      if (!this.canEditQuotation(currentUser, existing.quotation)) {
        res.status(403).json({ error: 'No tienes permiso para editar esta cotización' });
        return;
      }

      const result = await this.quotationService.updateWithAuthor(id, companySettingsId, validated, {
        username: currentUser?.username || req.authUser?.username || 'api',
        fullName: currentUser?.fullName || req.authUser?.fullName || req.authUser?.username,
        jobTitle: currentUser?.jobTitle || req.authUser?.jobTitle || '',
        email: currentUser?.email || req.authUser?.email || '',
        phone: currentUser?.phone || req.authUser?.phone || ''
      });
      res.json(result);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ error: 'Validation error', details: err.errors });
      } else if (err instanceof Error && err.message.includes('not found')) {
        res.status(404).json({ error: err.message });
      } else if (err instanceof Error) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Unknown error' });
      }
    }
  }

  async getByFolio(req: Request, res: Response): Promise<void> {
    try {
      const { folio } = req.params;
      const result = await this.quotationService.getByFolio(folio);
      res.json(result);
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        res.status(404).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Unknown error' });
      }
    }
  }

  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, limit = '20', offset = '0' } = req.query;

      const result = await this.quotationService.list({
        status: status as string | undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Unknown error' });
    }
  }

  async nextFolio(req: Request, res: Response): Promise<void> {
    try {
      const folio = await this.quotationService.getNextFolio();
      res.json({ folio });
    } catch {
      res.status(500).json({ error: 'No fue posible generar el siguiente folio' });
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validated = UpdateQuotationStatusValidation.parse(req.body);

      const currentUser = await this.resolveCurrentUser(req);
      const existing = await this.quotationService.getById(id);

      if (!this.canEditQuotation(currentUser, existing.quotation)) {
        res.status(403).json({ error: 'No tienes permiso para editar esta cotización' });
        return;
      }

      await this.quotationService.updateStatus(id, validated.status, validated.note);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ error: 'Validation error', details: err.errors });
      } else {
        res.status(500).json({ error: 'Unknown error' });
      }
    }
  }

  async duplicate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { folio } = req.body;

      if (!folio) {
        res.status(400).json({ error: 'Folio is required' });
        return;
      }

      const result = await this.quotationService.duplicate(id, folio);
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: 'Unknown error' });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const currentUser = await this.resolveCurrentUser(req);
      const existing = await this.quotationService.getById(id);

      if (!this.canEditQuotation(currentUser, existing.quotation)) {
        res.status(403).json({ error: 'No tienes permiso para eliminar esta cotización' });
        return;
      }

      await this.quotationService.delete(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
}

export class CompanyController {
  constructor(private companyService: CompanyService) {}

  async get(req: Request, res: Response): Promise<void> {
    try {
      const companySettingsId = req.headers['x-company-id'] as string || 'default';
      const result = await this.companyService.getOrCreate(companySettingsId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Unknown error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const companySettingsId = req.headers['x-company-id'] as string || 'default';
      const validated = CreateCompanySettingsValidation.parse(req.body);
      const result = await this.companyService.update(companySettingsId, validated);
      res.json(result);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ error: 'Validation error', details: err.errors });
      } else {
        res.status(500).json({ error: 'Unknown error' });
      }
    }
  }
}

export class CustomerController {
  constructor(private customerService: CustomerService) {}

  async list(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt((req.query.limit as string) || '100', 10);
      const customers = await this.customerService.list(limit);
      res.json({ customers });
    } catch {
      res.status(500).json({ error: 'No fue posible cargar los clientes' });
    }
  }
}

export class UserController {
  constructor(private authRepo: MySqlAuthRepository) {}

  async list(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.authRepo.listUsers();
      res.json({ users });
    } catch {
      res.status(500).json({ error: 'No fue posible cargar los usuarios' });
    }
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { username, email, phone = '', password, confirmPassword, role = 'admin', canEditAllQuotations = true, fullName = '', jobTitle = '' } = req.body ?? {};

      if (
        typeof username !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        typeof confirmPassword !== 'string'
      ) {
        res.status(400).json({ error: 'Completa todos los datos del usuario' });
        return;
      }

      if (!username.trim() || !email.trim()) {
        res.status(400).json({ error: 'Usuario y correo son obligatorios' });
        return;
      }

      if (typeof fullName !== 'string' || !fullName.trim()) {
        res.status(400).json({ error: 'El nombre completo es obligatorio' });
        return;
      }

      if (typeof jobTitle !== 'string' || !jobTitle.trim()) {
        res.status(400).json({ error: 'El puesto es obligatorio' });
        return;
      }

      if (typeof phone !== 'string' || !phone.trim()) {
        res.status(400).json({ error: 'El teléfono es obligatorio' });
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        res.status(400).json({ error: 'Correo electrónico inválido' });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        return;
      }

      if (password !== confirmPassword) {
        res.status(400).json({ error: 'Las contraseñas no coinciden' });
        return;
      }

      const user = await this.authRepo.createUser({
        username,
        email,
        passwordHash: hashPassword(password),
        role: role === 'viewer' ? 'viewer' : 'admin',
        canEditAllQuotations: Boolean(canEditAllQuotations),
        fullName,
        jobTitle,
        phone
      });

      res.status(201).json({ user });
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'El usuario o correo ya existe' });
        return;
      }

      res.status(500).json({ error: 'No fue posible crear el usuario' });
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const {
        username,
        email,
        password = '',
        confirmPassword = '',
        role = 'admin',
        canEditAllQuotations = true,
        fullName = '',
        jobTitle = '',
        phone = ''
      } = req.body ?? {};

      if (!id || Number.isNaN(id)) {
        res.status(400).json({ error: 'Usuario inválido' });
        return;
      }

      if (
        typeof username !== 'string' ||
        typeof email !== 'string' ||
        typeof fullName !== 'string' ||
        typeof jobTitle !== 'string' ||
        typeof phone !== 'string'
      ) {
        res.status(400).json({ error: 'Completa todos los datos del usuario' });
        return;
      }

      if (!username.trim() || !email.trim() || !fullName.trim() || !jobTitle.trim() || !phone.trim()) {
        res.status(400).json({ error: 'Usuario, correo, teléfono, nombre completo y puesto son obligatorios' });
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        res.status(400).json({ error: 'Correo electrónico inválido' });
        return;
      }

      if ((password || confirmPassword) && password !== confirmPassword) {
        res.status(400).json({ error: 'Las contraseñas no coinciden' });
        return;
      }

      if (password && password.length < 8) {
        res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        return;
      }

      const user = await this.authRepo.updateUser(id, {
        username,
        email,
        fullName,
        jobTitle,
        phone,
        role: role === 'viewer' ? 'viewer' : 'admin',
        canEditAllQuotations: Boolean(canEditAllQuotations),
        passwordHash: password ? hashPassword(password) : undefined
      });

      res.json({ user });
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'El usuario o correo ya existe' });
        return;
      }

      if (err instanceof Error && err.message.includes('no encontrado')) {
        res.status(404).json({ error: err.message });
        return;
      }

      res.status(500).json({ error: 'No fue posible actualizar el usuario' });
    }
  }
}
