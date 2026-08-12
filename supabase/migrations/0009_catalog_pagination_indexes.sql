-- krosofki_world: indexes backing the catalog's ORDER BY + range() pagination.
-- Without these, sorting by created_at/price at catalog scale forces a full
-- table scan + sort on every page request instead of an index walk.
create index if not exists idx_products_active_created_at
  on products (is_active, created_at desc, id);

create index if not exists idx_products_active_price
  on products (is_active, price, id);

-- Case-insensitive name search (ilike) — without this, `q=` filtering does
-- a sequential scan past a few thousand rows. pg_trgm supports partial
-- (substring) matches, which a plain btree index cannot.
create extension if not exists pg_trgm;
create index if not exists idx_products_name_trgm
  on products using gin (name gin_trgm_ops);
