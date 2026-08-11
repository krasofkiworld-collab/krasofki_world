# Налаштування бота в BotFather

Бот вже створено: **@krasofki_world_staff_bot** (`TELEGRAM_BOT_TOKEN` в `.env.local`).

## Кроки в BotFather (@BotFather)

1. `/setmenubutton` → обрати бота → вставити URL продакшн-деплою (після Vercel) або `http://localhost:3000` під час локальної розробки через тунель (ngrok/Cloudflare Tunnel — Telegram вимагає HTTPS навіть для тестового Mini App).
2. `/setdescription`, `/setabouttext`, `/setuserpic` — брендинг.
3. `/mybots` → бот → **Bot Settings → Menu Button → Configure Menu Button** — текст кнопки, напр. "🛍 Магазин".
4. **Group Privacy**: якщо співробітники лінкуються в приватному чаті з ботом (а не в групі) — privacy mode не важливий, лишити дефолт.

## Реєстрація webhook (робиться кодом, не вручну)

Після деплою на Vercel:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://<vercel-domain>/api/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

`secret_token` перевіряється в `route.ts` через заголовок `X-Telegram-Bot-Api-Secret-Token` — захист від підробних POST-запитів на вебхук (див. `08-security/02-webhook-verification.md`).

## Локальна розробка

Telegram не б'є вебхуком на `localhost`. Два варіанти:
1. **Тунель** (`npx untun@latest tunnel http://localhost:3000` або ngrok) + тимчасовий `setWebhook` на тунельний URL.
2. **Без вебхука**: тестувати Mini App напряму в браузері (SDK деградує — `Telegram.WebApp` буде `undefined`, тому `verify-init-data.ts` має dev-fallback, див. `04-miniapp/01-telegram-webapp-sdk.md`), а бот-логіку (нотифікації) тестувати окремим `ts-node` скриптом, що напряму викликає `notify.ts`.
