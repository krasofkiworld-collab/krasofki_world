# Нотифікації

`src/lib/telegram/notify.ts` — єдина точка відправки повідомлень, логує кожну спробу в `notifications_log`.

```ts
import { bot } from "./bot";
import { supabaseServer } from "@/lib/supabase/server";

export async function notifyCustomer(orderId: string, chatId: number, text: string) {
  await sendAndLog(orderId, "customer", chatId, text);
}

export async function notifyStaff(orderId: string, text: string) {
  const { data: staff } = await supabaseServer.from("staff_chats").select("chat_id");
  await Promise.allSettled(
    (staff ?? []).map((s) => sendAndLog(orderId, "owner", s.chat_id, text))
  );
}

async function sendAndLog(orderId: string, recipientType: "customer" | "owner", chatId: number, message: string) {
  const { data: log } = await supabaseServer
    .from("notifications_log")
    .insert({ order_id: orderId, recipient_type: recipientType, telegram_chat_id: chatId, message })
    .select("id")
    .single();

  try {
    await bot.telegram.sendMessage(chatId, message);
    await supabaseServer.from("notifications_log").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", log!.id);
  } catch (err) {
    await supabaseServer.from("notifications_log").update({ status: "failed", error: String(err) }).eq("id", log!.id);
  }
}
```

## Тексти повідомлень (укр., приклад)

| Подія | Кому | Текст |
|---|---|---|
| Нове замовлення | клієнт | `✅ Замовлення {order_number} прийнято! Сума: {total} грн. Ми повідомимо, коли підтвердимо.` |
| Нове замовлення | всі staff_chats | `🆕 Нове замовлення {order_number} на {total} грн від @{username}.` |
| confirmed | клієнт | `📦 Замовлення {order_number} підтверджено, готуємо до відправки.` |
| shipped | клієнт | `🚚 Замовлення {order_number} відправлено. ТТН: {ttn}` |
| completed | клієнт | `🎉 Дякуємо за покупку!` |
| cancelled | клієнт | `❌ Замовлення {order_number} скасовано. {причина}` |

## `notifications_log` навіщо

Коли клієнт пише "не прийшло сповіщення" — перший крок дебагу: `select * from notifications_log where order_id = '...'`. Якщо `status = 'failed'` — типова причина: користувач ще не тиснув `/start` боту (Telegram Bot API не дозволяє писати першим без цього).
