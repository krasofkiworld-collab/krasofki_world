import { NextRequest, NextResponse } from "next/server";
import { bot } from "@/lib/telegram/bot";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (expected && secret !== expected) {
    return new NextResponse("forbidden", { status: 403 });
  }

  const update = await req.json();
  await bot.handleUpdate(update);
  return NextResponse.json({ ok: true });
}
