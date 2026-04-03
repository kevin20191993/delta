CREATE DATABASE IF NOT EXISTS quotations;

\c quotations

-- Company Settings
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY,
  company_name varchar(150) NOT NULL,
  legal_name varchar(200) NOT NULL,
  rfc varchar(20) NOT NULL,
  address text NOT NULL,
  phone varchar(40) NOT NULL,
  email varchar(120) NOT NULL,
  slogan varchar(180) NOT NULL,
  logo_file_id uuid,
  primary_color varchar(20) NOT NULL DEFAULT '#08142b',
  accent_color varchar(20) NOT NULL DEFAULT '#f97316',
  default_conditions text,
  default_notes text,
  default_hse text,
  technical_responsible_name varchar(120),
  technical_signature_file_id uuid,
  bank_details text,
  tax_percent numeric(5,2) NOT NULL DEFAULT 16,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by varchar(100),
  updated_by varchar(100)
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY,
  name varchar(160) NOT NULL,
  company_name varchar(180),
  contact_name varchar(140),
  email varchar(120),
  phone varchar(40),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by varchar(100),
  updated_by varchar(100)
);

-- Quotations
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY,
  folio varchar(30) UNIQUE NOT NULL,
  company_settings_id uuid NOT NULL REFERENCES company_settings(id),
  customer_id uuid REFERENCES customers(id),
  quotation_date date NOT NULL,
  validity_days int NOT NULL CHECK (validity_days > 0),
  destination_company varchar(180),
  customer_attention varchar(160) NOT NULL,
  customer_contact varchar(160),
  project_location varchar(220) NOT NULL,
  currency char(3) NOT NULL DEFAULT 'MXN',
  discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  tax_percent numeric(5,2) NOT NULL,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  conditions text,
  hse_notes text,
  legal_notes text,
  observations text,
  responsible_signature_name varchar(120),
  client_logo_file_id uuid,
  status varchar(20) NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by varchar(100),
  updated_by varchar(100)
);

-- Quotation Items
CREATE TABLE IF NOT EXISTS quotation_items (
  id uuid PRIMARY KEY,
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  item_order int NOT NULL,
  item_code varchar(30) NOT NULL,
  description text NOT NULL,
  quantity numeric(12,2) NOT NULL CHECK (quantity > 0),
  unit varchar(20) NOT NULL,
  unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by varchar(100),
  updated_by varchar(100)
);

-- Quotation Files
CREATE TABLE IF NOT EXISTS quotation_files (
  id uuid PRIMARY KEY,
  quotation_id uuid REFERENCES quotations(id) ON DELETE CASCADE,
  file_kind varchar(40) NOT NULL,
  storage_path text NOT NULL,
  mime_type varchar(120) NOT NULL,
  file_size_bytes bigint NOT NULL,
  checksum_sha256 varchar(64),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by varchar(100)
);

-- Quotation Status History
CREATE TABLE IF NOT EXISTS quotation_status_history (
  id uuid PRIMARY KEY,
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  previous_status varchar(20),
  next_status varchar(20) NOT NULL,
  note text,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by varchar(100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quotations_folio ON quotations(folio);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_date ON quotations(quotation_date);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_order ON quotation_items(quotation_id, item_order);
CREATE INDEX IF NOT EXISTS idx_company_settings_id ON company_settings(id);
