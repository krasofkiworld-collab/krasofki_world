# Telegram WebApp SDK інтеграція

Пакет: `@telegram-apps/sdk-react`. Ініціалізація в `app/(shop)/layout.tsx`:

```tsx
"use client";
import { useEffect } from "react";

export function TelegramInit() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return; // dev-режим у звичайному браузері
    tg.ready();
    tg.expand();
    document.documentElement.dataset.theme = tg.colorScheme; // "light" | "dark"
    tg.setHeaderColor(tg.themeParams.bg_color ?? "#ffffff");
  }, []);
  return null;
}
```

## `initData` — як передавати і перевіряти

Клієнт бере `window.Telegram.WebApp.initData` (сирий підписаний рядок) і кладе його в заголовок кожного запиту до `/api/orders`:

```ts
fetch("/api/orders", {
  method: "POST",
  headers: { "X-Telegram-Init-Data": window.Telegram.WebApp.initData },
  body: JSON.stringify(payload),
});
```

Сервер перевіряє підпис у `src/lib/telegram/verify-init-data.ts` (HMAC-SHA256 з `TELEGRAM_BOT_TOKEN` як ключем — офіційний алгоритм Telegram). Якщо підпис невалідний або `auth_date` старіший за 24 години — `401`.

## Dev-режим без Telegram

Якщо `window.Telegram` відсутній (звичайний браузер) — `verify-init-data.ts` у `NODE_ENV=development` дозволяє fallback: бере `telegram_user_id` з query-параметра `?dev_user_id=123456` замість перевірки підпису. **Цей fallback обов'язково вимкнений, якщо `NODE_ENV=production`** — жорстка перевірка на старті модуля, не рантайм-прапорець, щоб її неможливо було випадково залишити увімкненою в проді.

## Кнопки Telegram UI

- `MainButton` — "Оформити замовлення" на сторінці чекауту, замість власної `<Button>`, для нативного вигляду.
- `BackButton` — навігація назад замість браузерного back.
- `HapticFeedback` — легка вібрація при додаванні в кошик (`tg.HapticFeedback.impactOccurred('light')`).
