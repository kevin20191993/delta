import { getPool } from './connection';

export async function ensureExtendedQuotationSchema(): Promise<void> {
  const pool = getPool();

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

  await pool.query(`
    ALTER TABLE quotations
    ADD COLUMN IF NOT EXISTS show_conditions boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_hse boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_legal_notes boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_responsible_signature boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_customer_acceptance boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_client_logo boolean DEFAULT true
  `);
}
