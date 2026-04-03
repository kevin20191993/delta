"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = exports.CustomerController = exports.CompanyController = exports.QuotationController = void 0;
const index_1 = require("../../common/validation/index");
const zod_1 = require("zod");
const password_1 = require("../../auth/password");
class QuotationController {
    constructor(quotationService, companyService) {
        this.quotationService = quotationService;
        this.companyService = companyService;
    }
    async create(req, res) {
        try {
            const companySettingsId = req.headers['x-company-id'] || 'default';
            const validated = index_1.CreateQuotationValidation.parse(req.body);
            const result = await this.quotationService.create(companySettingsId, validated);
            res.status(201).json(result);
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                res.status(400).json({ error: 'Validation error', details: err.errors });
            }
            else if (err instanceof Error) {
                res.status(500).json({ error: err.message });
            }
            else {
                res.status(500).json({ error: 'Unknown error' });
            }
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const result = await this.quotationService.getById(id);
            res.json(result);
        }
        catch (err) {
            if (err instanceof Error && err.message.includes('not found')) {
                res.status(404).json({ error: err.message });
            }
            else {
                res.status(500).json({ error: 'Unknown error' });
            }
        }
    }
    async getByFolio(req, res) {
        try {
            const { folio } = req.params;
            const result = await this.quotationService.getByFolio(folio);
            res.json(result);
        }
        catch (err) {
            if (err instanceof Error && err.message.includes('not found')) {
                res.status(404).json({ error: err.message });
            }
            else {
                res.status(500).json({ error: 'Unknown error' });
            }
        }
    }
    async list(req, res) {
        try {
            const { status, limit = '20', offset = '0' } = req.query;
            const result = await this.quotationService.list({
                status: status,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'Unknown error' });
        }
    }
    async nextFolio(req, res) {
        try {
            const folio = await this.quotationService.getNextFolio();
            res.json({ folio });
        }
        catch {
            res.status(500).json({ error: 'No fue posible generar el siguiente folio' });
        }
    }
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const validated = index_1.UpdateQuotationStatusValidation.parse(req.body);
            await this.quotationService.updateStatus(id, validated.status, validated.note);
            res.json({ success: true });
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                res.status(400).json({ error: 'Validation error', details: err.errors });
            }
            else {
                res.status(500).json({ error: 'Unknown error' });
            }
        }
    }
    async duplicate(req, res) {
        try {
            const { id } = req.params;
            const { folio } = req.body;
            if (!folio) {
                res.status(400).json({ error: 'Folio is required' });
                return;
            }
            const result = await this.quotationService.duplicate(id, folio);
            res.status(201).json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'Unknown error' });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.quotationService.delete(id);
            res.json({ success: true });
        }
        catch (err) {
            res.status(500).json({ error: 'Unknown error' });
        }
    }
}
exports.QuotationController = QuotationController;
class CompanyController {
    constructor(companyService) {
        this.companyService = companyService;
    }
    async get(req, res) {
        try {
            const companySettingsId = req.headers['x-company-id'] || 'default';
            const result = await this.companyService.getOrCreate(companySettingsId);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: 'Unknown error' });
        }
    }
    async update(req, res) {
        try {
            const companySettingsId = req.headers['x-company-id'] || 'default';
            const validated = index_1.CreateCompanySettingsValidation.parse(req.body);
            const result = await this.companyService.update(companySettingsId, validated);
            res.json(result);
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                res.status(400).json({ error: 'Validation error', details: err.errors });
            }
            else {
                res.status(500).json({ error: 'Unknown error' });
            }
        }
    }
}
exports.CompanyController = CompanyController;
class CustomerController {
    constructor(customerService) {
        this.customerService = customerService;
    }
    async list(req, res) {
        try {
            const limit = parseInt(req.query.limit || '100', 10);
            const customers = await this.customerService.list(limit);
            res.json({ customers });
        }
        catch {
            res.status(500).json({ error: 'No fue posible cargar los clientes' });
        }
    }
}
exports.CustomerController = CustomerController;
class UserController {
    constructor(authRepo) {
        this.authRepo = authRepo;
    }
    async list(req, res) {
        try {
            const users = await this.authRepo.listUsers();
            res.json({ users });
        }
        catch {
            res.status(500).json({ error: 'No fue posible cargar los usuarios' });
        }
    }
    async create(req, res) {
        try {
            const { username, email, password, confirmPassword, role = 'admin' } = req.body ?? {};
            if (typeof username !== 'string' ||
                typeof email !== 'string' ||
                typeof password !== 'string' ||
                typeof confirmPassword !== 'string') {
                res.status(400).json({ error: 'Completa todos los datos del usuario' });
                return;
            }
            if (!username.trim() || !email.trim()) {
                res.status(400).json({ error: 'Usuario y correo son obligatorios' });
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
                passwordHash: (0, password_1.hashPassword)(password),
                role: role === 'viewer' ? 'viewer' : 'admin'
            });
            res.status(201).json({ user });
        }
        catch (err) {
            if (err?.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: 'El usuario o correo ya existe' });
                return;
            }
            res.status(500).json({ error: 'No fue posible crear el usuario' });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=index.js.map