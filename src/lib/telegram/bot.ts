import "server-only";
import { Telegraf, type Context } from "telegraf";
import { supabaseServer } from "@/lib/supabase/server";

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.start(async (ctx) => {
  const payload = ctx.startPayload;

  if (payload?.startsWith("link_")) {
    await handleStaffLink(ctx, payload.replace("link_", ""));
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  await ctx.reply(
    "Вітаємо у Krosofki World! 👟\nТисни кнопку нижче, щоб відкрити магазин.",
    appUrl
      ? {
          reply_markup: {
            inline_keyboard: [[{ text: "🛍 Відкрити магазин", web_app: { url: appUrl } }]],
          },
        }
      : undefined
  );
});

bot.command("unlink", async (ctx) => {
  await supabaseServer.from("staff_chats").delete().eq("chat_id", ctx.chat.id);
  await ctx.reply("Сповіщення вимкнено для цього чату.");
});

async function handleStaffLink(ctx: Context, token: string) {
  const { data: link } = await supabaseServer
    .from("staff_chat_links")
    .select("clerk_user_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!link || new Date(link.expires_at) < new Date()) {
    await ctx.reply("Посилання недійсне або протерміноване. Згенеруйте нове в адмінці (Налаштування → Прив'язати Telegram).");
    return;
  }

  await supabaseServer.from("staff_chats").upsert({
    chat_id: ctx.chat!.id,
    clerk_user_id: link.clerk_user_id,
    username: ctx.from?.username ?? null,
  });
  await supabaseServer.from("staff_chat_links").delete().eq("token", token);

  await ctx.reply("✅ Готово! Тепер ви отримуватимете сповіщення про нові замовлення.");
}
