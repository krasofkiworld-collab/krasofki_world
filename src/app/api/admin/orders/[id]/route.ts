import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";
import { updateOrderSchema, ORDER_STATUS_TRANSITIONS } from "@/lib/validation/order";
import { notifyCustomer, orderMessages } from "@/lib/telegram/notify";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await supabaseServer
    .from("orders")
    .select(
      "*, customers(username, first_name, last_name, telegram_user_id), order_items(id, product_name, variant_name, unit_price, quantity, line_total)"
    )
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = updateOrderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { data: current, error: currentError } = await supabaseServer
    .from("orders")
    .select("status, order_number, customers(telegram_user_id)")
    .eq("id", id)
    .single();

  if (currentError || !current) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (parsed.data.status && parsed.data.status !== current.status) {
    const allowed = ORDER_STATUS_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(parsed.data.status)) {
      return NextResponse.json(
        { error: `Неможливий перехід ${current.status} → ${parsed.data.status}` },
        { status: 400 }
      );
    }
  }

  const { error } = await supabaseServer.from("orders").update(parsed.data).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (parsed.data.status && parsed.data.status !== current.status) {
    const chatId = current.customers?.telegram_user_id;
    if (chatId) {
      const messages: Record<string, string | null> = {
        confirmed: orderMessages.confirmed(current.order_number),
        shipped: orderMessages.shipped(current.order_number, parsed.data.admin_note),
        completed: orderMessages.completed(current.order_number),
        cancelled: orderMessages.cancelled(current.order_number, parsed.data.admin_note),
      };
      const text = messages[parsed.data.status];
      if (text) await notifyCustomer(id, chatId, text);
    }
  }

  return NextResponse.json({ ok: true });
}
