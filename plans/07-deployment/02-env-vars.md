# Змінні оточення — повний список

| Змінна | Де використовується | Публічна? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | клієнт + сервер | так |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | клієнт + сервер (read-only каталог) | так (захищено RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | лише `lib/supabase/server.ts` | **ні, секрет** |
| `TELEGRAM_BOT_TOKEN` | `lib/telegram/bot.ts`, `verify-init-data.ts` | **ні, секрет** |
| `TELEGRAM_BOT_USERNAME` | deep-links (staff-link, menu button) | так |
| `TELEGRAM_WEBHOOK_SECRET` | перевірка вебхука | **ні, секрет** — згенерувати перед продом (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `ClerkProvider` | так |
| `CLERK_SECRET_KEY` | Clerk server SDK | **ні, секрет** |
| `NEXT_PUBLIC_APP_URL` | посилання в боті, редіректи | так |

## Правило

Будь-яка змінна без `NEXT_PUBLIC_` префіксу **ніколи** не імпортується у файл з `"use client"` і не передається в client-компоненти як prop. Це саме те, від чого захищає `import "server-only"` у `lib/supabase/server.ts` та `lib/telegram/bot.ts`.

## `TELEGRAM_WEBHOOK_SECRET`

Ще не згенеровано — заплановано в `.env.local` як коментар. Згенерувати перед деплоєм:

```bash
openssl rand -hex 32
```

Вписати і в `.env.local`/Vercel env, і передати в `setWebhook` як `secret_token` (`03-bot/01-botfather-setup.md`).
