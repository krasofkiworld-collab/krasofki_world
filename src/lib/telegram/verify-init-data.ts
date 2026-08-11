import "server-only";
import crypto from "node:crypto";

export type VerifiedTelegramUser = {
  ok: true;
  userId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
};

export type VerificationFailure = { ok: false; reason: string };

const MAX_AUTH_AGE_SECONDS = 60 * 60 * 24; // 24h

/**
 * Verifies Telegram WebApp `initData` per the official algorithm:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyInitData(
  initData: string,
  botToken: string
): VerifiedTelegramUser | VerificationFailure {
  if (!initData) return { ok: false, reason: "missing initData" };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false, reason: "missing hash" };
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) return { ok: false, reason: "signature mismatch" };

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > MAX_AUTH_AGE_SECONDS) {
    return { ok: false, reason: "stale initData" };
  }

  const userRaw = params.get("user");
  if (!userRaw) return { ok: false, reason: "missing user" };

  const user = JSON.parse(userRaw) as {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };

  return {
    ok: true,
    userId: user.id,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
  };
}

/**
 * Dev-only fallback so the storefront is testable in a plain browser
 * (no window.Telegram present). Hard-disabled outside development —
 * this check lives at module scope, not behind a runtime flag, so it
 * can't be accidentally left on in production.
 */
export const DEV_INIT_DATA_FALLBACK_ENABLED = process.env.NODE_ENV === "development";
