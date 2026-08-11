-- krosofki_world: brands, tags, and structured product_variants
-- (size / color) so the storefront can filter by brand/tag/color and the
-- admin panel can manage them, per the "shoe store" catalog model.

-- ============================================================
-- brands — Nike, Adidas, etc. Owner-managed, used as a storefront filter.
-- ============================================================
create table brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_brands_is_active on brands (is_active);

alter table products add column brand_id uuid references brands (id) on delete set null;
create index idx_products_brand_id on products (brand_id);

-- ============================================================
-- tags — free-form labels (e.g. "нова колекція", "розпродаж", "унісекс"),
-- many-to-many with products, used as a storefront filter.
-- ============================================================
create table tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table product_tags (
  product_id uuid not null references products (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (product_id, tag_id)
);

create index idx_product_tags_tag_id on product_tags (tag_id);

-- ============================================================
-- product_variants — was a single free-text `name` (e.g. "42 / Чорний").
-- Split into structured size + color so the storefront can render size
-- pills and color swatches, and filter the catalog by color.
-- ============================================================
alter table product_variants add column size text;
alter table product_variants add column color_name text;
alter table product_variants add column color_hex text;

-- Backfill: best-effort split of the old "SIZE / COLOR" convention.
update product_variants
set size = trim(split_part(name, '/', 1)),
    color_name = nullif(trim(split_part(name, '/', 2)), '')
where size is null;

alter table product_variants drop column name;

create index idx_product_variants_size on product_variants (size);
