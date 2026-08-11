# Структура репозиторію (цільова)

```
krosofki_world/
├── plans/                          # ця документація
├── supabase/
│   ├── migrations/                 # 0000_drop_legacy … 0003_rls_policies
│   └── seed.sql
├── src/
│   ├── app/
│   │   ├── (shop)/                 # Mini App — публічна вітрина
│   │   │   ├── layout.tsx          # Telegram WebApp SDK init, theme sync
│   │   │   ├── page.tsx            # каталог
│   │   │   ├── product/[slug]/page.tsx
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   └── orders/[id]/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx          # Clerk guard + nav
│   │   │   ├── sign-in/[[...rest]]/page.tsx
│   │   │   ├── page.tsx            # dashboard
│   │   │   ├── products/page.tsx
│   │   │   ├── products/[id]/page.tsx
│   │   │   ├── categories/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── orders/[id]/page.tsx
│   │   │   └── settings/page.tsx   # прив'язка Telegram
│   │   ├── api/
│   │   │   ├── telegram/webhook/route.ts
│   │   │   ├── orders/route.ts             # POST — створити замовлення (Mini App)
│   │   │   ├── orders/[id]/route.ts        # GET статус (Mini App), PATCH (admin)
│   │   │   ├── admin/products/route.ts
│   │   │   ├── admin/products/[id]/route.ts
│   │   │   ├── admin/categories/route.ts
│   │   │   └── admin/staff-link/route.ts   # генерація токена лінкування
│   │   └── providers.tsx           # QueryClientProvider, ClerkProvider
│   ├── components/
│   │   ├── ui/                     # shadcn
│   │   ├── shop/                   # ProductCard, CartSheet, CheckoutForm...
│   │   └── admin/                  # OrdersTable, ProductForm...
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # browser, anon key
│   │   │   └── server.ts           # server-only, service role
│   │   ├── telegram/
│   │   │   ├── bot.ts              # Telegraf instance
│   │   │   ├── verify-init-data.ts
│   │   │   └── notify.ts
│   │   ├── validation/             # zod-схеми (order, product)
│   │   └── utils.ts
│   ├── stores/
│   │   └── cart.ts                 # zustand cart store
│   └── middleware.ts                # clerkMiddleware, guards /admin/**
├── .env.local / .env.example
└── package.json
```

## Правило меж

- **Ніщо в `app/(shop)/**` не імпортує Clerk.** Ніщо в `app/admin/**` не читає `Telegram.WebApp`. Дві поверхні перетинаються лише через спільні `src/lib/supabase` і типи БД.
- **Service-role Supabase-клієнт (`lib/supabase/server.ts`) імпортується лише в `route.ts` файлах** (API routes / server actions), ніколи в клієнтських компонентах.
