-- Lets staff block a customer (by their Telegram account or, for web
-- guests, whatever identity their browser persists) from placing further
-- orders. They can still browse and add to cart — only checkout is gated,
-- both in the UI and defensively in the orders API itself.
alter table customers
  add column is_blocked boolean not null default false,
  add column blocked_reason text,
  add column blocked_at timestamptz;
