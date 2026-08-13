-- Support guest checkout from a plain browser (no Telegram context), and
-- let the admin store a Nova Poshta API key for the upcoming shipping
-- integration.

alter table customers alter column telegram_user_id drop not null;

alter table customers
  add column source text not null default 'telegram' check (source in ('telegram', 'web')),
  add column web_client_id uuid unique,
  add column contact_telegram text;

create index idx_customers_web_client_id on customers (web_client_id);

alter table orders
  add column source text not null default 'telegram' check (source in ('telegram', 'web'));

alter table store_settings
  add column nova_poshta_api_key text;
