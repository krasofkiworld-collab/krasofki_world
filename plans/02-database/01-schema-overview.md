# Схема БД — огляд

Джерело істини: `supabase/migrations/0001_init_schema.sql`. Проєкт: `Krasofki_world` (`ogcllgdnxtwmkdwgwksc`, eu-central-1), вже застосовано через `supabase db push`.

## Таблиці

- **customers** — один рядок на `telegram_user_id`. Створюється/оновлюється при першому замовленні.
- **categories** — з `parent_id` для підкатегорій (не обов'язково використовувати одразу).
- **products** — `price`, `compare_at_price` (закреслена стара ціна), `images text[]`, `stock_quantity`.
- **product_variants** — опційно, для розмірів/кольорів. Якщо в MVP варіантів нема — просто не використовується.
- **orders** — `order_number` (авто `KW-000001`), `status` (enum), `payment_status` (enum), `delivery_address jsonb`.
- **order_items** — знімок товару на момент покупки (назва/ціна не зміняться, навіть якщо товар пізніше відредагують).
- **payments** — лог транзакцій (для майбутньої інтеграції з LiqPay/Monobank).
- **notifications_log** — аудит усіх повідомлень бота (для дебагу "чому клієнт не отримав сповіщення").
- **staff_chats** / **staff_chat_links** — прив'язка Telegram-акаунтів співробітників до Clerk-логінів для нотифікацій про нові замовлення.
- **store_settings** — single-row конфіг (назва магазину, валюта, поріг безкоштовної доставки).

## Enum-и

```
order_status:      pending | confirmed | shipped | completed | cancelled
payment_status:    unpaid | paid | failed | refunded
delivery_method:   nova_poshta_branch | nova_poshta_courier | pickup
```

## Тригери (`0002_functions_triggers.sql`)

- `set_updated_at` — на `customers/categories/products/orders`.
- `set_order_number` — генерує `KW-000123` при вставці замовлення, якщо `order_number` порожній.
- `decrement_stock_on_confirm` — коли `orders.status` переходить у `confirmed`, списує `stock_quantity` з `products`/`product_variants` за товарами замовлення.

## Локальна робота зі схемою

```bash
# застосувати нові міграції на прод/дев проєкт
npx supabase db push

# застосувати ще й seed.sql
npx supabase db push --include-seed

# подивитись різницю локальних/віддалених міграцій
npx supabase migration list
```

Проєкт уже залінкований (`supabase link --project-ref ogcllgdnxtwmkdwgwksc`), повторний `login`/`link` не потрібен на цій машині.
