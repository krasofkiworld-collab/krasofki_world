-- krosofki_world: Row Level Security
--
-- Model: the Next.js server (API routes / Server Actions) talks to Supabase
-- with the SERVICE ROLE key, which bypasses RLS entirely — that's where all
-- writes and all customer/order reads happen. The browser only ever gets the
-- ANON key, and only needs read access to the public catalog. Every other
-- table is closed to anon/authenticated so a leaked anon key can't expose
-- customer data, orders, or admin identities.

alter table customers enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table notifications_log enable row level security;
alter table staff_chats enable row level security;
alter table staff_chat_links enable row level security;
alter table store_settings enable row level security;

-- Public read-only catalog
create policy "public read active categories"
  on categories for select
  to anon, authenticated
  using (is_active = true);

create policy "public read active products"
  on products for select
  to anon, authenticated
  using (is_active = true);

create policy "public read active product_variants"
  on product_variants for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from products p
      where p.id = product_variants.product_id and p.is_active = true
    )
  );

-- Everything else: no anon/authenticated policies at all.
-- customers, orders, order_items, payments, notifications_log,
-- staff_chats, staff_chat_links, store_settings are reachable only via the
-- service role key (server-side API routes), which bypasses RLS by design.
