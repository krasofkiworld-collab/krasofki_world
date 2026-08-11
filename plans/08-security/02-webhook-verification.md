# Перевірка вебхука Telegram

## Секрет-токен (перевірка джерела запиту)

`setWebhook` реєструється з `secret_token` (`TELEGRAM_WEBHOOK_SECRET`). Telegram додає його в заголовок `X-Telegram-Bot-Api-Secret-Token` кожного POST-запиту на вебхук. `route.ts` звіряє заголовок **до** будь-якого парсингу тіла — без збігу відповідає `403` і нічого не обробляє. Це захищає від того, щоб хтось сторонній слав підроблені "апдейти" на публічний URL вебхука.

## `initData` (перевірка джерела Mini App запитів) — окремий механізм

Не плутати з вебхук-секретом. `initData` підписується Telegram при **відкритті Mini App** (HMAC-SHA256, ключ — SHA256 від bot token), перевіряється в `verify-init-data.ts` за офіційним алгоритмом:

```ts
import crypto from "node:crypto";

export function verifyInitData(initData: string, botToken: string): { ok: boolean; userId?: number; username?: string } {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) return { ok: false };

  const authDate = Number(params.get("auth_date"));
  if (Date.now() / 1000 - authDate > 86400) return { ok: false }; // старіше 24г

  const user = JSON.parse(params.get("user") ?? "{}");
  return { ok: true, userId: user.id, username: user.username };
}
```

## Обидва механізми обов'язкові одночасно

- Вебхук-секрет захищає **бота** від фальшивих апдейтів.
- `initData`-підпис захищає **API замовлень** від фальшивих `telegram_user_id`.

Втрата будь-якого з двох відкриває різний вектор атаки — не можна вважати один заміною іншого.
