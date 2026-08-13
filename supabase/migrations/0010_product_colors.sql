-- krosofki_world: promote "color" from a free-text field on each variant
-- row to its own entity per product — lets a color carry its own photo
-- (shown in the gallery when that color is selected) and groups sizes
-- under it in the admin UI instead of one flat repeating list.

create table product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  name text not null,
  hex text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_product_colors_product_id on product_colors (product_id);

-- Backfill: one product_colors row per distinct (product_id, color_name,
-- color_hex) currently referenced by product_variants.
insert into product_colors (product_id, name, hex)
select distinct product_id, color_name, color_hex
from product_variants
where color_name is not null;

alter table product_variants add column product_color_id uuid references product_colors (id) on delete cascade;

update product_variants v
set product_color_id = c.id
from product_colors c
where v.color_name is not null
  and c.product_id = v.product_id
  and c.name = v.color_name
  and c.hex is not distinct from v.color_hex;

alter table product_variants drop column color_name;
alter table product_variants drop column color_hex;

create index idx_product_variants_product_color_id on product_variants (product_color_id);

-- RLS: same public-read-if-product-active model as product_variants
-- (see 0003_rls_policies.sql).
alter table product_colors enable row level security;

create policy "public read active product_colors"
  on product_colors for select
  to anon, authenticated
  using (
    exists (
      select 1 from products p
      where p.id = product_colors.product_id and p.is_active = true
    )
  );
