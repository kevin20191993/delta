-- PostgreSQL data model for quotation platform

create table if not exists company_settings (
  id uuid primary key,
  company_name varchar(150) not null,
  legal_name varchar(200) not null,
  rfc varchar(20) not null,
  address text not null,
  phone varchar(40) not null,
  email varchar(120) not null,
  slogan varchar(180) not null,
  logo_file_id uuid,
  primary_color varchar(20) not null default '#08142b',
  accent_color varchar(20) not null default '#f97316',
  default_conditions text,
  default_notes text,
  default_hse text,
  technical_responsible_name varchar(120),
  technical_signature_file_id uuid,
  bank_details text,
  tax_percent numeric(5,2) not null default 16,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by varchar(100),
  updated_by varchar(100)
);

create table if not exists customers (
  id uuid primary key,
  name varchar(160) not null,
  company_name varchar(180),
  contact_name varchar(140),
  email varchar(120),
  phone varchar(40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by varchar(100),
  updated_by varchar(100)
);

create table if not exists quotations (
  id uuid primary key,
  folio varchar(30) unique not null,
  company_settings_id uuid not null references company_settings(id),
  customer_id uuid references customers(id),
  quotation_date date not null,
  validity_days int not null check (validity_days > 0),
  destination_company varchar(180),
  customer_attention varchar(160) not null,
  customer_contact varchar(160),
  project_location varchar(220) not null,
  currency char(3) not null default 'MXN',
  discount_percent numeric(5,2) not null default 0,
  subtotal numeric(14,2) not null default 0,
  tax_percent numeric(5,2) not null,
  tax_amount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  conditions text,
  hse_notes text,
  legal_notes text,
  observations text,
  responsible_signature_name varchar(120),
  client_logo_file_id uuid,
  status varchar(20) not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by varchar(100),
  updated_by varchar(100)
);

create table if not exists quotation_items (
  id uuid primary key,
  quotation_id uuid not null references quotations(id) on delete cascade,
  item_order int not null,
  item_code varchar(30) not null,
  description text not null,
  quantity numeric(12,2) not null check (quantity > 0),
  unit varchar(20) not null,
  unit_price numeric(14,2) not null check (unit_price >= 0),
  amount numeric(14,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by varchar(100),
  updated_by varchar(100)
);

create table if not exists quotation_files (
  id uuid primary key,
  quotation_id uuid references quotations(id) on delete cascade,
  file_kind varchar(40) not null,
  storage_path text not null,
  mime_type varchar(120) not null,
  file_size_bytes bigint not null,
  checksum_sha256 varchar(64),
  created_at timestamptz not null default now(),
  created_by varchar(100)
);

create table if not exists quotation_status_history (
  id uuid primary key,
  quotation_id uuid not null references quotations(id) on delete cascade,
  previous_status varchar(20),
  next_status varchar(20) not null,
  note text,
  changed_at timestamptz not null default now(),
  changed_by varchar(100)
);

create index if not exists idx_quotations_folio on quotations(folio);
create index if not exists idx_quotations_status on quotations(status);
create index if not exists idx_quotations_date on quotations(quotation_date);
create index if not exists idx_quotation_items_quotation_order on quotation_items(quotation_id, item_order);
