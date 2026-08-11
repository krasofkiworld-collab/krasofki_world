-- krosofki_world: RLS for brands/tags/product_tags — same public-read
-- model as categories/products (see 0003_rls_policies.sql).

alter table brands enable row level security;
alter table tags enable row level security;
alter table product_tags enable row level security;

create policy "public read active brands"
  on brands for select
  to anon, authenticated
  using (is_active = true);

create policy "public read tags"
  on tags for select
  to anon, authenticated
  using (true);

create policy "public read product_tags"
  on product_tags for select
  to anon, authenticated
  using (
    exists (
      select 1 from products p
      where p.id = product_tags.product_id and p.is_active = true
    )
  );
