import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { identifyCustomer } from "@/lib/telegram/identify-customer";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const identity = identifyCustomer(req);
  if (!identity.ok) return NextResponse.json({ error: "unauthorized: " + identity.reason }, { status: 401 });

  const { data: order, error } = await supabaseServer
    .from("orders")
    .select(
      "id, order_number, status, payment_status, delivery_method, delivery_address, total_amount, currency, admin_note, created_at, customers!inner(telegram_user_id, web_client_id), order_items(id, product_name, variant_name, unit_price, quantity, line_total, products(images))"
    )
    .eq("id", id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const owns =
    identity.source === "telegram"
      ? order.customers.telegram_user_id === identity.telegramUserId
      : order.customers.web_client_id === identity.webClientId;

  if (!owns) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { customers, ...rest } = order;
  void customers;
  return NextResponse.json(rest);
}
