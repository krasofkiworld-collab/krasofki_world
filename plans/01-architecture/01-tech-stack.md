# Стек і причини вибору

| Рішення | Чому |
|---|---|
| **Next.js App Router, один репозиторій** | Mini App, Bot webhook і Admin — це один деплой на Vercel: `/`, `/admin/**`, `/api/telegram/webhook`. Не потрібен окремий сервер для бота — Telegram б'є вебхуком в serverless API route. |
| **Supabase замість власного Postgres** | Готовий REST/RPC шар (PostgREST), RLS з коробки, миттєвий `db push` для міграцій, безкоштовний tier достатній для старту. |
| **RLS-модель: anon = read-only каталог, все інше — тільки service role** | Браузер Mini App ніколи не отримує service role key. Усі записи (замовлення, клієнти) йдуть через Next.js API routes на сервері — це єдина точка, де можна валідувати `initData` Telegram і бізнес-правила (stock, ціни). |
| **Clerk для адмінки** | Не для Mini App (там ідентифікація через Telegram), а саме для `/admin` — готовий UI логіну, сесії, без власного пароль-стораджу. |
| **Telegraf** | Стандарт для Telegram-ботів на Node; вебхук-режим ідеально лягає на serverless (на відміну від long-polling). |
| **TanStack Query** | Кешування каталогу/замовлень на клієнті, оптимістичні апдейти в адмінці (зміна статусу замовлення). |
| **shadcn/ui + Tailwind v4** | Компоненти копіюються в репо (не npm-залежність) — легко кастомізувати під бренд і Telegram-теми (light/dark слідує `Telegram.WebApp.colorScheme`). |

## Чому НЕ монорепо (pnpm workspaces)

Обрано користувачем свідомо: один Next.js застосунок. Бот — це не окремий процес, а `/api/telegram/webhook` route + shared `src/lib/telegram/*`. Якщо пізніше знадобиться довгоживучий воркер (наприклад, cron-розсилки), він однаково піде як Vercel Cron / Edge Function, а не окремий сервіс.
