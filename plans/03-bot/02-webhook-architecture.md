# Архітектура вебхука

`src/app/api/telegram/webhook/route.ts` — єдина точка входу для всіх апдейтів бота.

```ts
import { bot } from "@/lib/telegram/bot";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new NextResponse("forbidden", { status: 403 });
  }

  const update = await req.json();
  await bot.handleUpdate(update);
  return NextResponse.json({ ok: true });
}
```

`src/lib/telegram/bot.ts` — інстанс Telegraf з обробниками, **без `bot.launch()`** (launch — це long-polling, несумісний з serverless; вебхук-режим просто викликає `handleUpdate` на кожен запит):

```ts
import { Telegraf } from "telegraf";

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.start(async (ctx) => {
  const payload = ctx.startPayload; // параметр після /start
  if (payload?.startsWith("link_")) {
    return handleStaffLink(ctx, payload.replace("link_", ""));
  }
  await ctx.reply("Вітаємо у Krosofki World! Тисни кнопку нижче, щоб відкрити магазин.", {
    reply_markup: {
      inline_keyboard: [[
        { text: "🛍 Відкрити магазин", web_app: { url: process.env.NEXT_PUBLIC_APP_URL! } },
      ]],
    },
  });
});
```

## Чому не `webhookCallback` з Telegraf напряму

Telegraf має вбудований `bot.webhookCallback()`, але він очікує Node `http` request/response, а не Next.js `Request`/`Response`. Простіше і надійніше вручну розпарсити JSON і викликати `bot.handleUpdate()` — саме так рекомендує сам Telegraf для serverless-оточень.

## Ідемпотентність

Telegram може повторно надіслати апдейт, якщо ваш вебхук не відповів вчасно (таймаут ~60с на боці Telegram, Vercel Function — до 10-60с залежно від плану). `bot.handleUpdate` не повинен виконувати довгі операції — нотифікації надсилаються паралельно (`Promise.allSettled`), не послідовно.
