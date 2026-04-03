"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresCustomerRepository = exports.PostgresCompanySettingsRepository = exports.PostgresQuotationItemRepository = exports.PostgresQuotationRepository = void 0;
const connection_1 = require("./connection");
const uuid_1 = require("uuid");
class PostgresQuotationRepository {
    async create(data) {
        const pool = (0, connection_1.getPool)();
        const id = (0, uuid_1.v4)();
        const query = `
      INSERT INTO quotations (
        id, folio, company_settings_id, quotation_date, validity_days,
        customer_id,
        destination_company, customer_attention, customer_contact, project_location, currency,
        discount_percent, subtotal, tax_percent, tax_amount, total,
        conditions, hse_notes, legal_notes, observations, responsible_signature_name,
        status, created_at, updated_at, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW(), $23, $23)
      RETURNING *
    `;
        const values = [
            id,
            data.folio,
            data.companySettingsId,
            data.quotationDate,
            data.validityDays,
            data.customerId || null,
            data.destinationCompany,
            data.customerAttention,
            data.customerContact,
            data.projectLocation,
            data.currency,
            data.discountPercent,
            data.subtotal,
            data.taxPercent,
            data.taxAmount,
            data.total,
            data.conditions,
            data.hseNotes,
            data.legalNotes,
            data.observations,
            data.responsibleSignatureName,
            data.status || 'draft',
            data.createdBy || 'system'
        ];
        const result = await pool.query(query, values);
        return this.rowToEntity(result.rows[0]);
    }
    async findById(id) {
        const pool = (0, connection_1.getPool)();
        const result = await pool.query('SELECT * FROM quotations WHERE id = $1', [id]);
        return result.rows.length > 0 ? this.rowToEntity(result.rows[0]) : null;
    }
    async findByFolio(folio) {
        const pool = (0, connection_1.getPool)();
        const result = await pool.query('SELECT * FROM quotations WHERE folio = $1', [folio]);
        return result.rows.length > 0 ? this.rowToEntity(result.rows[0]) : null;
    }
    async findAll(filters) {
        const pool = (0, connection_1.getPool)();
        let query = 'SELECT * FROM quotations WHERE 1=1';
        const values = [];
        let paramIndex = 1;
        if (filters?.status) {
            query += ` AND status = $${paramIndex}`;
            values.push(filters.status);
            paramIndex++;
        }
        if (filters?.startDate) {
            query += ` AND quotation_date >= $${paramIndex}`;
            values.push(filters.startDate);
            paramIndex++;
        }
        if (filters?.endDate) {
            query += ` AND quotation_date <= $${paramIndex}`;
            values.push(filters.endDate);
            paramIndex++;
        }
        query += ' ORDER BY quotation_date DESC';
        if (filters?.limit) {
            query += ` LIMIT $${paramIndex}`;
            values.push(filters.limit);
            paramIndex++;
        }
        if (filters?.offset) {
            query += ` OFFSET $${paramIndex}`;
            values.push(filters.offset);
        }
        const result = await pool.query(query, values);
        return result.rows.map((row) => this.rowToEntity(row));
    }
    async update(id, data, updatedBy) {
        const pool = (0, connection_1.getPool)();
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (data.status !== undefined) {
            updates.push(`status = $${paramIndex}`);
            values.push(data.status);
            paramIndex++;
        }
        if (data.discountPercent !== undefined) {
            updates.push(`discount_percent = $${paramIndex}`);
            values.push(data.discountPercent);
            paramIndex++;
        }
        if (data.total !== undefined) {
            updates.push(`total = $${paramIndex}`);
            values.push(data.total);
            paramIndex++;
        }
        updates.push('updated_at = NOW()');
        if (updatedBy) {
            updates.push(`updated_by = $${paramIndex}`);
            values.push(updatedBy);
            paramIndex++;
        }
        updates.push(`updated_by = COALESCE(updated_by, $${paramIndex})`);
        values.push(updatedBy || 'system');
        values.push(id);
        const query = `UPDATE quotations SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            throw new Error(`Quotation ${id} not found`);
        }
        return this.rowToEntity(result.rows[0]);
    }
    async updateStatus(id, status, note, updatedBy) {
        const pool = (0, connection_1.getPool)();
        await pool.query('BEGIN');
        try {
            const quotation = await this.findById(id);
            if (!quotation) {
                throw new Error(`Quotation ${id} not found`);
            }
            await pool.query(`UPDATE quotations SET status = $1, updated_at = NOW(), updated_by = $2 WHERE id = $3`, [status, updatedBy || 'system', id]);
            await pool.query(`INSERT INTO quotation_status_history (id, quotation_id, previous_status, next_status, note, changed_at, changed_by)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6)`, [(0, uuid_1.v4)(), id, quotation.status, status, note || null, updatedBy || 'system']);
            await pool.query('COMMIT');
        }
        catch (err) {
            await pool.query('ROLLBACK');
            throw err;
        }
    }
    async delete(id) {
        const pool = (0, connection_1.getPool)();
        const result = await pool.query('DELETE FROM quotations WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            throw new Error(`Quotation ${id} not found`);
        }
    }
    rowToEntity(row) {
        return {
            id: row.id,
            folio: row.folio,
            companySettingsId: row.company_settings_id,
            customerId: row.customer_id,
            quotationDate: row.quotation_date,
            validityDays: row.validity_days,
            destinationCompany: row.destination_company,
            customerAttention: row.customer_attention,
            customerContact: row.customer_contact,
            projectLocation: row.project_location,
            currency: row.currency,
            discountPercent: row.discount_percent,
            subtotal: row.subtotal,
            taxPercent: row.tax_percent,
            taxAmount: row.tax_amount,
            total: row.total,
            conditions: row.conditions,
            hseNotes: row.hse_notes,
            legalNotes: row.legal_notes,
            observations: row.observations,
            responsibleSignatureName: row.responsible_signature_name,
            clientLogoFileId: row.client_logo_file_id,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            createdBy: row.created_by,
            updatedBy: row.updated_by
        };
    }
}
exports.PostgresQuotationRepository = PostgresQuotationRepository;
class PostgresQuotationItemRepository {
    async createBatch(quotationId, items, createdBy) {
        const pool = (0, connection_1.getPool)();
        const created = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const id = (0, uuid_1.v4)();
            const query = `
        INSERT INTO quotation_items (
          id, quotation_id, item_order, item_code, description,
          quantity, unit, unit_price, amount, created_at, updated_at, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), $10, $10)
        RETURNING *
      `;
            const amount = item.quantity * item.unitPrice;
            const values = [
                id,
                quotationId,
                i + 1,
                item.itemCode,
                item.description,
                item.quantity,
                item.unit,
                item.unitPrice,
                amount,
                createdBy || 'system'
            ];
            const result = await pool.query(query, values);
            created.push(this.rowToEntity(result.rows[0]));
        }
        return created;
    }
    async findByQuotationId(quotationId) {
        const pool = (0, connection_1.getPool)();
        const result = await pool.query('SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY item_order ASC', [quotationId]);
        return result.rows.map((row) => this.rowToEntity(row));
    }
    async deleteByQuotationId(quotationId) {
        const pool = (0, connection_1.getPool)();
        await pool.query('DELETE FROM quotation_items WHERE quotation_id = $1', [quotationId]);
    }
    rowToEntity(row) {
        return {
            id: row.id,
            quotationId: row.quotation_id,
            itemOrder: row.item_order,
            itemCode: row.item_code,
            description: row.description,
            quantity: row.quantity,
            unit: row.unit,
            unitPrice: row.unit_price,
            amount: row.amount,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            createdBy: row.created_by,
            updatedBy: row.updated_by
        };
    }
}
exports.PostgresQuotationItemRepository = PostgresQuotationItemRepository;
class PostgresCompanySettingsRepository {
    async getOrCreate(id, defaultData) {
        const pool = (0, connection_1.getPool)();
        let result = await pool.query('SELECT * FROM company_settings WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            return this.rowToEntity(result.rows[0]);
        }
        if (!defaultData) {
            throw new Error(`Company settings ${id} not found`);
        }
        const query = `
      INSERT INTO company_settings (
        id, company_name, legal_name, rfc, address, phone, email, slogan,
        logo_data_url, primary_color, accent_color, default_conditions, default_notes, default_hse,
        technical_responsible_name, bank_details, tax_percent, created_at, updated_at, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW(), 'system', 'system')
      RETURNING *
    `;
        const values = [
            id,
            defaultData.companyName || 'MI EMPRESA',
            defaultData.legalName || 'MI EMPRESA SA DE CV',
            defaultData.rfc || 'XXX000000000',
            defaultData.address || 'Direccion',
            defaultData.phone || '+1 000 0000',
            defaultData.email || 'info@empresa.mx',
            defaultData.slogan || 'Servicios profesionales',
            defaultData.logoDataUrl || null,
            defaultData.primaryColor || '#08142b',
            defaultData.accentColor || '#f97316',
            defaultData.defaultConditions || '',
            defaultData.defaultNotes || '',
            defaultData.defaultHse || '',
            defaultData.technicalResponsibleName || '',
            defaultData.bankDetails || '',
            defaultData.taxPercent || 16
        ];
        result = await pool.query(query, values);
        return this.rowToEntity(result.rows[0]);
    }
    async update(id, data, updatedBy) {
        const pool = (0, connection_1.getPool)();
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (data.companyName !== undefined) {
            updates.push(`company_name = $${paramIndex}`);
            values.push(data.companyName);
            paramIndex++;
        }
        if (data.legalName !== undefined) {
            updates.push(`legal_name = $${paramIndex}`);
            values.push(data.legalName);
            paramIndex++;
        }
        if (data.logoFileId !== undefined) {
            updates.push(`logo_file_id = $${paramIndex}`);
            values.push(data.logoFileId);
            paramIndex++;
        }
        if (data.logoDataUrl !== undefined) {
            updates.push(`logo_data_url = $${paramIndex}`);
            values.push(data.logoDataUrl);
            paramIndex++;
        }
        if (data.rfc !== undefined) {
            updates.push(`rfc = $${paramIndex}`);
            values.push(data.rfc);
            paramIndex++;
        }
        if (data.address !== undefined) {
            updates.push(`address = $${paramIndex}`);
            values.push(data.address);
            paramIndex++;
        }
        if (data.phone !== undefined) {
            updates.push(`phone = $${paramIndex}`);
            values.push(data.phone);
            paramIndex++;
        }
        if (data.email !== undefined) {
            updates.push(`email = $${paramIndex}`);
            values.push(data.email);
            paramIndex++;
        }
        if (data.slogan !== undefined) {
            updates.push(`slogan = $${paramIndex}`);
            values.push(data.slogan);
            paramIndex++;
        }
        if (data.primaryColor !== undefined) {
            updates.push(`primary_color = $${paramIndex}`);
            values.push(data.primaryColor);
            paramIndex++;
        }
        if (data.accentColor !== undefined) {
            updates.push(`accent_color = $${paramIndex}`);
            values.push(data.accentColor);
            paramIndex++;
        }
        if (data.defaultConditions !== undefined) {
            updates.push(`default_conditions = $${paramIndex}`);
            values.push(data.defaultConditions);
            paramIndex++;
        }
        if (data.defaultNotes !== undefined) {
            updates.push(`default_notes = $${paramIndex}`);
            values.push(data.defaultNotes);
            paramIndex++;
        }
        if (data.defaultHse !== undefined) {
            updates.push(`default_hse = $${paramIndex}`);
            values.push(data.defaultHse);
            paramIndex++;
        }
        if (data.technicalResponsibleName !== undefined) {
            updates.push(`technical_responsible_name = $${paramIndex}`);
            values.push(data.technicalResponsibleName);
            paramIndex++;
        }
        if (data.bankDetails !== undefined) {
            updates.push(`bank_details = $${paramIndex}`);
            values.push(data.bankDetails);
            paramIndex++;
        }
        if (data.taxPercent !== undefined) {
            updates.push(`tax_percent = $${paramIndex}`);
            values.push(data.taxPercent);
            paramIndex++;
        }
        updates.push('updated_at = NOW()');
        if (updatedBy) {
            updates.push(`updated_by = $${paramIndex}`);
            values.push(updatedBy);
            paramIndex++;
        }
        values.push(id);
        const query = `UPDATE company_settings SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            throw new Error(`Company settings ${id} not found`);
        }
        return this.rowToEntity(result.rows[0]);
    }
    rowToEntity(row) {
        return {
            id: row.id,
            companyName: row.company_name,
            legalName: row.legal_name,
            rfc: row.rfc,
            address: row.address,
            phone: row.phone,
            email: row.email,
            slogan: row.slogan,
            logoFileId: row.logo_file_id,
            logoDataUrl: row.logo_data_url,
            primaryColor: row.primary_color,
            accentColor: row.accent_color,
            defaultConditions: row.default_conditions,
            defaultNotes: row.default_notes,
            defaultHse: row.default_hse,
            technicalResponsibleName: row.technical_responsible_name,
            technicalSignatureFileId: row.technical_signature_file_id,
            bankDetails: row.bank_details,
            taxPercent: row.tax_percent,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            createdBy: row.created_by,
            updatedBy: row.updated_by
        };
    }
}
exports.PostgresCompanySettingsRepository = PostgresCompanySettingsRepository;
class PostgresCustomerRepository {
    async findAll(limit = 100) {
        const pool = (0, connection_1.getPool)();
        const result = await pool.query(`SELECT * FROM customers ORDER BY updated_at DESC NULLS LAST, company_name ASC LIMIT $1`, [limit]);
        return result.rows.map((row) => this.rowToEntity(row));
    }
    async findByCompanyName(companyName) {
        const pool = (0, connection_1.getPool)();
        const normalized = companyName.trim().toLowerCase();
        const result = await pool.query(`SELECT * FROM customers WHERE LOWER(COALESCE(company_name, name)) = $1 LIMIT 1`, [normalized]);
        return result.rows.length ? this.rowToEntity(result.rows[0]) : null;
    }
    async upsert(data) {
        const existing = await this.findByCompanyName(data.companyName);
        const pool = (0, connection_1.getPool)();
        if (existing) {
            const result = await pool.query(`
          UPDATE customers
          SET
            name = $2,
            company_name = $2,
            contact_name = $3,
            email = $4,
            phone = $5,
            rfc = $6,
            address = $7,
            logo_data_url = COALESCE($8, logo_data_url),
            updated_at = NOW(),
            updated_by = $9
          WHERE id = $1
          RETURNING *
        `, [
                existing.id,
                data.companyName,
                data.contactName || null,
                data.email || null,
                data.phone || null,
                data.rfc || null,
                data.address || null,
                data.logoDataUrl || null,
                data.updatedBy || 'system'
            ]);
            return this.rowToEntity(result.rows[0]);
        }
        const result = await pool.query(`
        INSERT INTO customers (
          id, name, company_name, contact_name, email, phone, rfc, address, logo_data_url, created_at, updated_at, created_by, updated_by
        ) VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), $9, $9)
        RETURNING *
      `, [
            (0, uuid_1.v4)(),
            data.companyName,
            data.contactName || null,
            data.email || null,
            data.phone || null,
            data.rfc || null,
            data.address || null,
            data.logoDataUrl || null,
            data.updatedBy || 'system'
        ]);
        return this.rowToEntity(result.rows[0]);
    }
    rowToEntity(row) {
        return {
            id: row.id,
            name: row.name,
            companyName: row.company_name,
            contactName: row.contact_name,
            email: row.email,
            phone: row.phone,
            rfc: row.rfc,
            address: row.address,
            logoDataUrl: row.logo_data_url,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            createdBy: row.created_by,
            updatedBy: row.updated_by
        };
    }
}
exports.PostgresCustomerRepository = PostgresCustomerRepository;
//# sourceMappingURL=repositories.js.map