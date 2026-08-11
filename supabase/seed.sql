-- krosofki_world: dev seed data — run manually against a dev project only.

insert into categories (slug, name, sort_order) values
  ('sneakers', 'Кросівки', 1),
  ('slides', 'Шльопанці', 2),
  ('accessories', 'Аксесуари', 3)
on conflict (slug) do nothing;

insert into brands (slug, name, logo_url, sort_order) values
  ('nike', 'Nike', 'https://placehold.co/64x64?text=Nike', 1),
  ('adidas', 'Adidas', 'https://placehold.co/64x64?text=Adidas', 2),
  ('puma', 'Puma', 'https://placehold.co/64x64?text=Puma', 3),
  ('new-balance', 'New Balance', 'https://placehold.co/64x64?text=NB', 4)
on conflict (slug) do nothing;

insert into tags (slug, name) values
  ('new', 'Новинка'),
  ('sale', 'Розпродаж'),
  ('bestseller', 'Хіт продажів'),
  ('unisex', 'Унісекс')
on conflict (slug) do nothing;

insert into products (category_id, brand_id, slug, name, description, price, compare_at_price, images, stock_quantity)
select c.id, b.id, v.slug, v.name, v.description, v.price, v.compare_at_price, v.images, v.stock_quantity
from (values
  ('sneakers', 'nike', 'air-classic-white', 'Air Classic White', 'Класичні білі кросівки на кожен день.', 1899.00, 2299.00, array['https://placehold.co/600x600?text=Air+Classic'], 25),
  ('sneakers', 'adidas', 'street-runner-black', 'Street Runner Black', 'Легкі бігові кросівки, чорна гама.', 2199.00, null, array['https://placehold.co/600x600?text=Street+Runner'], 14),
  ('slides', 'puma', 'summer-slide-navy', 'Summer Slide Navy', 'Літні шльопанці, темно-синій колір.', 699.00, null, array['https://placehold.co/600x600?text=Summer+Slide'], 40)
) as v(cat_slug, brand_slug, slug, name, description, price, compare_at_price, images, stock_quantity)
join categories c on c.slug = v.cat_slug
join brands b on b.slug = v.brand_slug
on conflict (slug) do nothing;

insert into product_tags (product_id, tag_id)
select p.id, t.id from products p, tags t
where (p.slug = 'air-classic-white' and t.slug in ('new', 'bestseller'))
   or (p.slug = 'street-runner-black' and t.slug in ('sale'))
   or (p.slug = 'summer-slide-navy' and t.slug in ('new', 'unisex'))
on conflict do nothing;

insert into product_variants (product_id, size, color_name, color_hex, sku, stock_quantity)
select p.id, v.size, v.color_name, v.color_hex, p.slug || '-' || v.size || '-' || v.color_name, v.stock_quantity
from products p
join (values
  ('air-classic-white', '40', 'Білий', '#FFFFFF', 8),
  ('air-classic-white', '41', 'Білий', '#FFFFFF', 10),
  ('air-classic-white', '42', 'Білий', '#FFFFFF', 7),
  ('air-classic-white', '42', 'Чорний', '#111111', 5),
  ('street-runner-black', '41', 'Чорний', '#111111', 6),
  ('street-runner-black', '42', 'Чорний', '#111111', 8),
  ('street-runner-black', '43', 'Сірий', '#8A8A8A', 4)
) as v(slug, size, color_name, color_hex, stock_quantity) on v.slug = p.slug
on conflict (sku) do nothing;
