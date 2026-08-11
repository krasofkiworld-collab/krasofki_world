import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { verifyInitData, DEV_INIT_DATA_FALLBACK_ENABLED } from "@/lib/telegram/verify-init-data";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initData = req.headers.get("x-telegram-init-data") ?? req.nextUrl.searchParams.get("initData") ?? "";
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;

  let telegramUserId: number;
  const verified = verifyInitData(initData, botToken);
  if (verified.ok) {
    telegramUserId = verified.userId;
  } else if (DEV_INIT_DATA_FALLBACK_ENABLED && req.nextUrl.searchParams.get("dev_user_id")) {
    telegramUserId = Number(req.nextUrl.searchParams.get("dev_user_id"));
  } else {
    return NextResponse.json({ error: "unauthorized: " + verified.reason }, { status: 401 });
  }

  const { data: order, error } = await supabaseServer
    .from("orders")
    .select(
      "id, order_number, status, payment_status, delivery_method, delivery_address, total_amount, currency, admin_note, created_at, customers!inner(telegram_user_id), order_items(id, product_name, variant_name, unit_price, quantity, line_total)"
    )
    .eq("id", id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (order.customers.telegram_user_id !== telegramUserId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { customers, ...rest } = order;
  void customers;
  return NextResponse.json(rest);
}
