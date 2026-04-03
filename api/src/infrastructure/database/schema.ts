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
}
