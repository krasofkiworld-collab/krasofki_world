-- krosofki_world: corrective fixes for the 0005 seed run.
--
-- `supabase db query --linked --file` (used to work around a seed-hash
-- skip) mangled Cyrillic text on Windows — bytes went through a stray
-- Latin-1 round-trip. `supabase db push` does not have this problem (the
-- categories seeded via db push earlier are correct), so fix the damage
-- here via a real migration instead.

delete from product_tags;
delete from tags;
insert into tags (slug, name) values
  ('new', 'Новинка'),
  ('sale', 'Розпродаж'),
  ('bestseller', 'Хіт продажів'),
  ('unisex', 'Унісекс');

update product_variants set color_name = 'Білий' where color_hex = '#FFFFFF';
update product_variants set color_name = 'Чорний' where color_hex = '#111111';
update product_variants set color_name = 'Сірий' where color_hex = '#8A8A8A';

insert into product_tags (product_id, tag_id)
select p.id, t.id from products p, tags t
where (p.slug = 'air-classic-white' and t.slug in ('new', 'bestseller'))
   or (p.slug = 'street-runner-black' and t.slug in ('sale'))
   or (p.slug = 'summer-slide-navy' and t.slug in ('new', 'unisex'));

-- brand_id was never backfilled: the seed's products INSERT hit
-- "on conflict (slug) do nothing" against already-existing rows, so the
-- brand_id in the VALUES list was silently discarded.
update products set brand_id = (select id from brands where slug = 'nike') where slug = 'air-classic-white';
update products set brand_id = (select id from brands where slug = 'adidas') where slug = 'street-runner-black';
update products set brand_id = (select id from brands where slug = 'puma') where slug = 'summer-slide-navy';
