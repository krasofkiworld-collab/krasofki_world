import "server-only";
import { bot } from "./bot";
import { supabaseServer } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type NotificationRecipient = Database["public"]["Enums"]["notification_recipient"];

async function sendAndLog(
  orderId: string | null,
  recipientType: NotificationRecipient,
  chatId: number,
  message: string
) {
  const { data: log } = await supabaseServer
    .from("notifications_log")
    .insert({ order_id: orderId, recipient_type: recipientType, telegram_chat_id: chatId, message })
    .select("id")
    .single();

  try {
    await bot.telegram.sendMessage(chatId, message);
    if (log) {
      await supabaseServer
        .from("notifications_log")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", log.id);
    }
  } catch (err) {
    if (log) {
      await supabaseServer
        .from("notifications_log")
        .update({ status: "failed", error: String(err) })
        .eq("id", log.id);
    }
  }
}

export async function notifyCustomer(orderId: string, chatId: number, message: string) {
  await sendAndLog(orderId, "customer", chatId, message);
}

export async function notifyStaff(orderId: string, message: string) {
  const { data: staff } = await supabaseServer.from("staff_chats").select("chat_id");
  await Promise.allSettled((staff ?? []).map((s) => sendAndLog(orderId, "owner", s.chat_id, message)));
}

export const orderMessages = {
  created: (orderNumber: string, total: number) =>
    `✅ Замовлення ${orderNumber} прийнято!\nСума: ${total} грн.\n\nНезабаром з вами зв'яжеться менеджер для підтвердження 🙌`,
  createdForStaff: (orderNumber: string, total: number, username?: string | null) =>
    `🆕 Нове замовлення ${orderNumber} на ${total} грн${username ? ` від @${username}` : ""}.`,
  confirmed: (orderNumber: string) =>
    `📦 Замовлення ${orderNumber} підтверджено!\nПакуємо та готуємо до відправки — тримаємо в курсі 👌`,
  shipped: (orderNumber: string, ttn?: string | null) =>
    `🚚 Замовлення ${orderNumber} в дорозі!${ttn ? `\nТТН: ${ttn}` : ""}\n\nЗовсім скоро буде у вас 🔥`,
  completed: (orderNumber: string) =>
    `🎉 Дякуємо за покупку!\nЗамовлення ${orderNumber} отримано.\n\nСподіваємось, вам сподобалось 💛 Незабаром тут можна буде залишити відгук — поки що цієї функції немає, але ми над цим працюємо 👀`,
  cancelled: (orderNumber: string, reason?: string | null) =>
    `❌ Замовлення ${orderNumber} скасовано.${reason ? `\nПричина: ${reason}` : ""}`,
};
