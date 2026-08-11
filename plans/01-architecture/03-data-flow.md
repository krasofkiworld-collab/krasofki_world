# Потік даних: від кліку до нотифікації

## 1. Клієнт відкриває Mini App
`t.me/krasofki_world_staff_bot` → кнопка меню/`/start` → Telegram відкриває `NEXT_PUBLIC_APP_URL` у WebView, передає `Telegram.WebApp.initData` (підписаний рядок з `user`, `auth_date`, hash).

## 2. Каталог
`app/(shop)/page.tsx` (Server Component) читає `products`/`categories` напряму через Supabase anon-клієнт — це дозволено RLS-політикою `public read active products/categories`.

## 3. Кошик
Локальний стан (`stores/cart.ts`, zustand + `persist` у `localStorage`). Жодних записів у БД до оформлення.

## 4. Чекаут → створення замовлення
`POST /api/orders` body: `{ initData, items[], deliveryAddress, contactPhone, note }`.

Сервер:
1. Верифікує `initData` підписом бота (`verify-init-data.ts`) — без цього будь-хто міг би підсунути чужий `telegram_user_id`.
2. `upsert customers` по `telegram_user_id`.
3. Перечитує актуальні ціни/наявність товарів із БД (ніколи не довіряє цінам з клієнта) → рахує `subtotal/total`.
4. `insert orders` (тригер `set_order_number` генерує `KW-000123`) + `insert order_items`.
5. Викликає `notify.ts`:
   - клієнту (`orders.customer_id → customers.telegram_user_id`): "Замовлення KW-000123 прийнято".
   - усім рядкам `staff_chats`: "Нове замовлення KW-000123 на 1899 грн".
6. Повертає `{ orderId, orderNumber }` → Mini App редіректить на `/orders/[id]`.

## 5. Адмін обробляє замовлення
Адмінка: `PATCH /api/admin/orders/[id]` `{ status?, payment_status? }`.
- Зміна `payment_status → paid` — просто оновлення поля (оплата підтверджується вручну адміном або вебхуком платіжного провайдера, див. `06-integrations/03-payments.md`).
- Зміна `status → confirmed` — тригер БД `decrement_stock_on_confirm` списує залишки; після відповіді API сервер шле клієнту нотифікацію "Замовлення підтверджено".
- Зміна `status → shipped/completed/cancelled` — так само шле нотифікацію клієнту з відповідним текстом.

## 6. Лінкування співробітника (щоб отримувати нотифікації)
Адмінка → "Налаштування" → кнопка "Прив'язати Telegram" → `POST /api/admin/staff-link` створює рядок `staff_chat_links (token, clerk_user_id)` → показує deep-link `https://t.me/krasofki_world_staff_bot?start=link_<token>`. Співробітник тапає, бот у `/start` бачить параметр, звіряє `staff_chat_links`, пише `chat_id` в `staff_chats`, видаляє токен.

Детально: `03-bot/04-staff-linking.md`.
