"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureExtendedQuotationSchema = ensureExtendedQuotationSchema;
const connection_1 = require("./connection");
async function ensureExtendedQuotationSchema() {
    const pool = (0, connection_1.getPool)();
    await pool.query(`
    ALTER TABLE company_settings
    ADD COLUMN IF NOT EXISTS logo_data_url text
  `);
    await pool.query(`
    ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS rfc varchar(20),
    ADD COLUMN IF NOT EXISTS address text,
    ADD COLUMN IF NOT EXISTS logo_data_url text
  `);
}
//# sourceMappingURL=schema.js.map