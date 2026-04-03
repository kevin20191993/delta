import { Request, Response } from 'express';
import { QuotationService, CompanyService } from '../../application/services/quotation.service';
import { CreateQuotationValidation, UpdateQuotationStatusValidation } from '../../common/validation/index';
import { ZodError } from 'zod';

export class QuotationController {
  constructor(
    private quotationService: QuotationService,
    private companyService: CompanyService
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const companySettingsId = req.headers['x-company-id'] as string || 'default';
      const validated = CreateQuotationValidation.parse(req.body);

      const result = await this.quotationService.create(companySettingsId, validated);
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

  async list(req: Request, res: Response): Promise<void> {
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

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validated = UpdateQuotationStatusValidation.parse(req.body);

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

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
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
      const result = await this.companyService.update(companySettingsId, req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
}
