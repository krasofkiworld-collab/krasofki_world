import "server-only";
import { bot } from "./bot";
import { supabaseServer } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
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

type OrderItemLine = { product_name: string; variant_name: string | null; quantity: number; line_total: number };

// Everything the customer typed in at checkout — shown back to them so they
// can catch a typo, and shown to staff since it's what they actually need
// to pack and ship the order.
type OrderContactDetails = {
  city: string;
  branch?: string | null;
  phone: string;
  note?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  contactTelegram?: string | null;
};

// Bulleted "name (variant) × qty — price" per line, e.g.:
//   • Nike P-6000 Anthracite Chrome (42 / Основний) × 1 — 2 899 грн
function formatItemLines(items: OrderItemLine[]) {
  return items
    .map((i) => `• ${i.product_name}${i.variant_name ? ` (${i.variant_name})` : ""} × ${i.quantity} — ${formatMoney(i.line_total)}`)
    .join("\n");
}

function formatContactDetails(d: OrderContactDetails, { includeName }: { includeName: boolean }) {
  const lines: string[] = [];
  const fullName = [d.firstName, d.lastName].filter(Boolean).join(" ");
  if (includeName && fullName) lines.push(`👤 ${fullName}`);
  lines.push(`📍 ${d.city}${d.branch ? `, відділення ${d.branch}` : ""}`);
  lines.push(`📞 ${d.phone}`);
  if (includeName && d.contactTelegram) lines.push(`💬 Telegram: ${d.contactTelegram}`);
  if (d.note) lines.push(`📝 ${d.note}`);
  return lines.join("\n");
}

export const orderMessages = {
  created: (orderNumber: string, total: number, items: OrderItemLine[], contact: OrderContactDetails) =>
    `✅ Замовлення ${orderNumber} прийнято!\n\n${formatItemLines(items)}\n\nСума: ${formatMoney(total)}.\n\n${formatContactDetails(contact, { includeName: false })}\n\nНезабаром з вами зв'яжеться менеджер для підтвердження 🙌`,
  createdForStaff: (orderNumber: string, total: number, items: OrderItemLine[], contact: OrderContactDetails, username?: string | null) =>
    `🆕 Нове замовлення ${orderNumber}${username ? ` від @${username}` : ""}\n\n${formatItemLines(items)}\n\nСума: ${formatMoney(total)}\n\n${formatContactDetails(contact, { includeName: true })}`,
  confirmed: (orderNumber: string) =>
    `📦 Замовлення ${orderNumber} підтверджено!\nПакуємо та готуємо до відправки — тримаємо в курсі 👌`,
  shipped: (orderNumber: string, ttn?: string | null) =>
    `🚚 Замовлення ${orderNumber} в дорозі!${ttn ? `\nТТН: ${ttn}` : ""}\n\nЗовсім скоро буде у вас 🔥`,
  completed: (orderNumber: string) =>
    `🎉 Дякуємо за покупку!\nЗамовлення ${orderNumber} отримано.\n\nСподіваємось, вам сподобалось 💛 Незабаром тут можна буде залишити відгук — поки що цієї функції немає, але ми над цим працюємо 👀`,
  cancelled: (orderNumber: string, reason?: string | null) =>
    `❌ Замовлення ${orderNumber} скасовано.${reason ? `\nПричина: ${reason}` : ""}`,
};
