# Dashboard (`/admin`)

Перша сторінка після логіну. Мета — власник за 5 секунд бачить, чи є щось, що вимагає уваги.

## Блоки

1. **Нові замовлення (status = pending)** — картка-лічильник + список останніх 5, кожне клікабельне → `/admin/orders/[id]`.
2. **Сума за сьогодні / за 7 днів** — `sum(total_amount)` де `payment_status = 'paid'` і `created_at >= ...`.
3. **Товари, що закінчуються** — `stock_quantity <= 5 and is_active = true`, лінк на `/admin/products?filter=low_stock`.
4. **Статус нотифікацій** — якщо в `notifications_log` за останню годину є `status = 'failed'` — банер-попередження (типова причина: ніхто не залінкований у `staff_chats`).

## Запити

Всі агрегати рахуються на сервері (Server Component, service-role клієнт) одним `Promise.all` — dashboard не повинен робити water­fall запитів.

## Порожній стан

Якщо `staff_chats` порожня — банер зверху: "Ви ще не підключили сповіщення в Telegram → [Прив'язати]" з кнопкою, що веде на `/admin/settings` (див. `03-bot/04-staff-linking.md`).
