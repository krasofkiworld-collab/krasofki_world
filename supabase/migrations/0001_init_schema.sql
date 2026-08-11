-- krosofki_world: initial schema
-- Run in Supabase SQL editor or via `supabase db push`.

create extension if not exists "pgcrypto";

-- ============================================================
-- Enums
-- ============================================================
create type order_status as enum (
  'pending',      -- created, awaiting owner confirmation
  'confirmed',    -- owner confirmed, preparing
  'shipped',      -- handed to courier / Nova Poshta
  'completed',    -- delivered / picked up
  'cancelled'
);

create type payment_status as enum (
  'unpaid',
  'paid',
  'failed',
  'refunded'
);

create type delivery_method as enum (
  'nova_poshta_branch',
  'nova_poshta_courier',
  'pickup'
);

create type notification_recipient as enum ('customer', 'owner');
create type notification_status as enum ('pending', 'sent', 'failed');

-- ============================================================
-- customers — one row per Telegram user who opened the Mini App
-- ============================================================
create table customers (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null unique,
  username text,
  first_name text,
  last_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_customers_telegram_user_id on customers (telegram_user_id);

-- ============================================================
-- categories
-- ============================================================
create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories (id) on delete set null,
  slug text not null unique,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_categories_parent_id on categories (parent_id);
create index idx_categories_is_active on categories (is_active);

-- ============================================================
-- products
-- ============================================================
create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories (id) on delete set null,
  slug text not null unique,
  name text not null,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  compare_at_price numeric(12, 2) check (compare_at_price is null or compare_at_price >= 0),
  currency text not null default 'UAH',
  images text[] not null default '{}',
  sku text unique,
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_category_id on products (category_id);
create index idx_products_is_active on products (is_active);
create index idx_products_slug on products (slug);

-- ============================================================
-- product_variants — optional (size/color) sub-SKUs
-- ============================================================
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  name text not null, -- e.g. "42 / Чорний"
  sku text unique,
  price_override numeric(12, 2) check (price_override is null or price_override >= 0),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_product_variants_product_id on product_variants (product_id);

-- ============================================================
-- orders
-- ============================================================
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique, -- human-readable, e.g. KW-000123
  customer_id uuid not null references customers (id) on delete restrict,
  status order_status not null default 'pending',
  payment_status payment_status not null default 'unpaid',
  delivery_method delivery_method not null default 'nova_poshta_branch',
  delivery_address jsonb not null default '{}'::jsonb, -- city, branch/address, recipient
  contact_phone text not null,
  subtotal_amount numeric(12, 2) not null check (subtotal_amount >= 0),
  delivery_amount numeric(12, 2) not null default 0 check (delivery_amount >= 0),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  currency text not null default 'UAH',
  customer_note text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_customer_id on orders (customer_id);
create index idx_orders_status on orders (status);
create index idx_orders_payment_status on orders (payment_status);
create index idx_orders_created_at on orders (created_at desc);

-- ============================================================
-- order_items — snapshot of product at time of purchase
-- ============================================================
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  variant_id uuid references product_variants (id) on delete set null,
  product_name text not null,
  variant_name text,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  line_total numeric(12, 2) not null check (line_total >= 0)
);

create index idx_order_items_order_id on order_items (order_id);

-- ============================================================
-- payments — provider transaction log (LiqPay / Monobank / manual)
-- ============================================================
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  provider text not null default 'manual',
  amount numeric(12, 2) not null check (amount >= 0),
  status payment_status not null default 'unpaid',
  external_id text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index idx_payments_order_id on payments (order_id);

-- ============================================================
-- notifications_log — bot messages sent to customer/owner
-- ============================================================
create table notifications_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders (id) on delete cascade,
  recipient_type notification_recipient not null,
  telegram_chat_id bigint not null,
  message text not null,
  status notification_status not null default 'pending',
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index idx_notifications_log_order_id on notifications_log (order_id);

-- ============================================================
-- staff_chats — Telegram chats that receive owner/staff order alerts,
-- linked to a Clerk admin identity (one row per linked device/account).
-- ============================================================
create table staff_chats (
  chat_id bigint primary key,
  clerk_user_id text not null,
  username text,
  role text not null default 'staff', -- 'owner' | 'staff'
  created_at timestamptz not null default now()
);

create index idx_staff_chats_clerk_user_id on staff_chats (clerk_user_id);

-- ============================================================
-- staff_chat_links — one-time tokens the admin panel generates so a staff
-- member can link their Telegram account by opening
-- t.me/<bot>?start=<token>, which the bot exchanges for a staff_chats row.
-- ============================================================
create table staff_chat_links (
  token uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz not null default now()
);

-- ============================================================
-- store_settings — single-row config table
-- ============================================================
create table store_settings (
  id boolean primary key default true check (id), -- enforces single row
  store_name text not null default 'Krosofki World',
  currency text not null default 'UAH',
  free_delivery_threshold numeric(12, 2),
  updated_at timestamptz not null default now()
);

insert into store_settings (id) values (true);
