import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import { verifyInitData, DEV_INIT_DATA_FALLBACK_ENABLED } from "./verify-init-data";

const uuidSchema = z.string().uuid();

export type Identity =
  | { ok: true; source: "telegram"; telegramUserId: number; username?: string; firstName?: string; lastName?: string }
  | { ok: true; source: "web"; webClientId: string }
  | { ok: false; reason: string };

/**
 * Resolves who's calling a storefront API route: a verified Telegram user
 * (initData), or — when the shop is opened in a plain browser — a guest
 * identified only by the random id their browser generated and persisted.
 * The web path trusts the client-supplied id at face value; it's not an
 * auth credential, just a way to group a guest's own orders together.
 */
export function identifyCustomer(req: NextRequest): Identity {
  const initData = req.headers.get("x-telegram-init-data") ?? req.nextUrl.searchParams.get("initData") ?? "";
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;

  const verified = verifyInitData(initData, botToken);
  if (verified.ok) {
    return {
      ok: true,
      source: "telegram",
      telegramUserId: verified.userId,
      username: verified.username,
      firstName: verified.firstName,
      lastName: verified.lastName,
    };
  }
  if (DEV_INIT_DATA_FALLBACK_ENABLED && req.nextUrl.searchParams.get("dev_user_id")) {
    return { ok: true, source: "telegram", telegramUserId: Number(req.nextUrl.searchParams.get("dev_user_id")) };
  }

  const webClientId = req.headers.get("x-web-client-id");
  if (webClientId && uuidSchema.safeParse(webClientId).success) {
    return { ok: true, source: "web", webClientId };
  }

  return { ok: false, reason: verified.reason };
}
