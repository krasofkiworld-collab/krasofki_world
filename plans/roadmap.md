# Roadmap

## Фаза 0 — Фундамент (готово)
- [x] `create-next-app` (TS, Tailwind v4, App Router, `src/`)
- [x] shadcn/ui init + базові компоненти (button, card, table, dialog, form...)
- [x] Залежності: `@supabase/supabase-js`, `@supabase/ssr`, `@clerk/nextjs`, `@tanstack/react-query`, `telegraf`, `@telegram-apps/sdk-react`, `zod`, `react-hook-form`
- [x] `.env.local` / `.env.example`
- [x] Supabase-схема (`supabase/migrations/0000-0003`) застосована через `supabase db push`
- [x] Dev seed (`supabase/seed.sql`)

## Фаза 1 — Інтеграційний каркас
- [ ] `src/lib/supabase/client.ts` (browser, anon key) + `server.ts` (service role, server-only)
- [ ] `src/lib/telegram/verify-init-data.ts` — перевірка підпису `initData`
- [ ] `src/middleware.ts` — Clerk-захист `/admin/**`
- [ ] TanStack Query provider в `app/providers.tsx`
- [ ] Базовий layout Mini App з Telegram WebApp SDK (`app/(shop)/layout.tsx`)

## Фаза 2 — Бот
- [ ] `src/lib/telegram/bot.ts` — інстанс Telegraf
- [ ] `/api/telegram/webhook/route.ts` — приймає апдейти
- [ ] `/start` — привітання + кнопка "Відкрити магазин" (Mini App button)
- [ ] `/start <token>` — лінкування співробітника (див. `03-bot/04-staff-linking.md`)
- [ ] `src/lib/telegram/notify.ts` — надсилання повідомлень клієнту та всім `staff_chats`
- [ ] Реєстрація webhook на BotFather / API (`03-bot/01-botfather-setup.md`)

## Фаза 3 — Mini App вітрина
- [ ] Каталог: категорії, картки товарів, фільтри, пошук
- [ ] Сторінка товару
- [ ] Кошик (Zustand або React Context + localStorage)
- [ ] Чекаут: контактні дані, доставка (Нова Пошта: місто/відділення), підтвердження
- [ ] `POST /api/orders` — створення замовлення (customer upsert + order + order_items), нотифікації
- [ ] Сторінка "Мої замовлення" / статус останнього замовлення

## Фаза 4 — Адмінка
- [ ] Clerk sign-in (`/admin/sign-in`)
- [ ] Dashboard: нові замовлення, сума за сьогодні/тиждень
- [ ] Товари: список + create/edit/delete форма (react-hook-form + zod)
- [ ] Категорії: CRUD
- [ ] Замовлення: список з фільтрами (статус/оплата), деталі, зміна статусу → тригерить нотифікацію клієнту
- [ ] "Прив'язати Telegram" — генерує токен, показує deep-link `t.me/krasofki_world_staff_bot?start=<token>`

## Фаза 5 — Деплой
- [ ] Vercel проєкт, env vars (`07-deployment/02-env-vars.md`)
- [ ] Продакшн Supabase RLS-аудит
- [ ] `setWebhook` на прод-домен + `TELEGRAM_WEBHOOK_SECRET`
- [ ] BotFather: `Menu Button` → посилання на прод Mini App URL
- [ ] Smoke test: замовлення в проді → нотифікації доходять

## Фаза 6 — Полірування
- [ ] Оплата онлайн (LiqPay/Monobank) — `06-integrations/03-payments.md` (опційно, зараз "оплачено вручну" адміном)
- [ ] Аналітика замовлень / експорт
- [ ] Rate-limit на `/api/orders`
- [ ] Error tracking (Sentry)
