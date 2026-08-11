# Krosofki World — огляд проєкту

Telegram-магазин: Mini App вітрина + бот-нотифікації + адмінка. Клієнт обирає товар і оформлює замовлення прямо в Telegram; бот повідомляє клієнта про статус і повідомляє всіх залінкованих співробітників про нове замовлення; адмінка (захищена Clerk) керує товарами та замовленнями.

## Стек

| Шар | Технологія |
|---|---|
| Frontend (Mini App + Admin) | Next.js 15 (App Router) + TypeScript + Tailwind v4 + shadcn/ui |
| Data fetching / cache | TanStack Query |
| БД | Supabase (Postgres + RLS), проєкт `Krasofki_world` (`ogcllgdnxtwmkdwgwksc`) |
| Auth адмінки | Clerk |
| Telegram | Telegraf (бот), `@telegram-apps/sdk-react` (Mini App SDK) |
| Деплой | Vercel |

## Три поверхні застосунку

1. **Mini App** (`/` в Telegram WebView) — публічна вітрина: каталог, кошик, чекаут, статус замовлення. Не потребує Clerk — ідентифікація йде через `Telegram.WebApp.initData` (перевіряється на сервері підписом бота).
2. **Bot webhook** (`/api/telegram/webhook`) — приймає апдейти від Telegram, обробляє `/start`, лінкування співробітників, надсилає нотифікації.
3. **Admin panel** (`/admin/**`) — захищено Clerk. CRUD товарів/категорій, керування замовленнями (статус, оплата), прив'язка Telegram-акаунта співробітника для нотифікацій.

## Порядок реалізації

Дивись `plans/roadmap.md` — файли в `01-…08-…` відповідають фазам збірки, кожен документ самодостатній і містить конкретні кроки/код-приклади для conкретної підсистеми.

## Стан на зараз

- ✅ Next.js + Tailwind + shadcn ініціалізовано, весь стек-пакет встановлено.
- ✅ Supabase-схема спроєктована та **застосована** до `ogcllgdnxtwmkdwgwksc` (стару placeholder-схему видалено, дивись `supabase/migrations/`).
- ✅ `.env.local` заповнено реальними ключами.
- ⏳ Bot / Mini App / Admin UI — в процесі (дивись TaskList поточної сесії).
