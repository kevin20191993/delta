insert into company_settings (
  id, company_name, legal_name, rfc, address, phone, email, slogan, primary_color, accent_color,
  default_conditions, default_notes, default_hse, technical_responsible_name, bank_details, tax_percent,
  created_by, updated_by
) values (
  '11111111-1111-1111-1111-111111111111',
  'KP Delta Ingenieria',
  'KP Delta Ingenieria y Servicios Industriales SA de CV',
  'KPD260101AAA',
  'Calle Industria #123, Parque Industrial',
  '(55) 0000 0000',
  'contacto@kpdelta.mx',
  'Ingenieria • Construccion • Mantenimiento',
  '#08142b',
  '#f97316',
  'Pago 50% anticipo / 50% contra entrega. Garantia 12 meses contra defecto de instalacion.',
  'Propuesta valida por 15 dias naturales.',
  'Personal con registro IMSS y EPP completo.',
  'Ing. Responsable Tecnico',
  'Banco Ejemplo, CLABE 000000000000000000',
  16.00,
  'seed',
  'seed'
);

insert into customers (id, name, company_name, contact_name, email, phone, created_by, updated_by) values
('22222222-2222-2222-2222-222222222221', 'Cliente Industrial Toluca', 'Cliente Industrial SA de CV', 'Ing. Obra', 'obra@cliente.com', '(722) 111 2233', 'seed', 'seed');

insert into quotations (
  id, folio, company_settings_id, customer_id, quotation_date, validity_days,
  destination_company, customer_attention, customer_contact, project_location, currency,
  discount_percent, subtotal, tax_percent, tax_amount, total,
  conditions, hse_notes, legal_notes, observations, responsible_signature_name,
  status, created_by, updated_by
) values (
  '33333333-3333-3333-3333-333333333331',
  'QT-2026-001',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  current_date,
  15,
  'Cliente Industrial SA de CV',
  'Cliente Industrial Toluca',
  'Ing. Obra',
  'Naves industriales - Toluca',
  'MXN',
  0,
  15800,
  16,
  2528,
  18328,
  'Pago 50% anticipo / 50% contra entrega.',
  'Personal con EPP completo y protocolos de altura.',
  'Propuesta valida por 15 dias.',
  'Incluye mano de obra y supervision tecnica.',
  'Ing. Responsable Tecnico',
  'draft',
  'seed',
  'seed'
);

insert into quotation_items (
  id, quotation_id, item_order, item_code, description, quantity, unit, unit_price, amount, created_by, updated_by
) values (
  '44444444-4444-4444-4444-444444444441',
  '33333333-3333-3333-3333-333333333331',
  1,
  '01',
  'Servicio de impermeabilizacion de techumbres en nave industrial.',
  1,
  'SERV',
  15800,
  15800,
  'seed',
  'seed'
);
