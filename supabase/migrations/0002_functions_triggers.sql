-- krosofki_world: updated_at triggers + order number sequence

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_customers_updated_at before update on customers
  for each row execute function set_updated_at();

create trigger trg_categories_updated_at before update on categories
  for each row execute function set_updated_at();

create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();

-- ============================================================
-- order_number generator: KW-000001, KW-000002, ...
-- ============================================================
create sequence if not exists order_number_seq start 1;

create or replace function next_order_number()
returns text
language sql
as $$
  select 'KW-' || lpad(nextval('order_number_seq')::text, 6, '0');
$$;

create or replace function set_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := next_order_number();
  end if;
  return new;
end;
$$;

create trigger trg_orders_set_order_number before insert on orders
  for each row execute function set_order_number();

-- ============================================================
-- decrement stock on order confirmation (status -> confirmed)
-- ============================================================
create or replace function decrement_stock_on_confirm()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    update products p
    set stock_quantity = greatest(p.stock_quantity - oi.quantity, 0)
    from order_items oi
    where oi.order_id = new.id
      and oi.product_id = p.id
      and oi.variant_id is null;

    update product_variants v
    set stock_quantity = greatest(v.stock_quantity - oi.quantity, 0)
    from order_items oi
    where oi.order_id = new.id
      and oi.variant_id = v.id;
  end if;
  return new;
end;
$$;

create trigger trg_orders_decrement_stock after update on orders
  for each row execute function decrement_stock_on_confirm();
