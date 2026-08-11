# Статус замовлення в Mini App

`app/(shop)/orders/[id]/page.tsx` — читає замовлення через `GET /api/orders/[id]?initData=...` (перевіряє, що `customers.telegram_user_id` з `initData` збігається з власником замовлення — інакше `403`, щоб один клієнт не міг підглянути чуже замовлення за id).

## UI

- Таймлайн статусів (`pending → confirmed → shipped → completed`), поточний етап підсвічений, `cancelled` — окремий червоний стан.
- Список товарів із `order_items` (знімок, не live-дані з `products`).
- Сума, спосіб доставки, адреса.
- Якщо `status = shipped` і є ТТН в `admin_note` — кнопка "Відстежити на Новій Пошті" (лінк на `https://novaposhta.ua/tracking/?cargo_number=...`).

## "Мої замовлення" (список)

`app/(shop)/orders/page.tsx` — усі замовлення поточного `telegram_user_id`, сортовані за `created_at desc`. Посилання в головному меню/шапці Mini App.

## Реалтайм (опційно, post-MVP)

Supabase Realtime можна підписати на `orders` за `customer_id`, щоб статус оновлювався без перезавантаження сторінки, поки клієнт тримає Mini App відкритим. У MVP достатньо звичайного refetch (TanStack Query `refetchInterval: 15000` на сторінці статусу).
