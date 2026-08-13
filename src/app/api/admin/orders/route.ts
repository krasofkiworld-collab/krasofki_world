import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";

const ADMIN_PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const payment = req.nextUrl.searchParams.get("payment");
  const q = req.nextUrl.searchParams.get("q");
  const page = Math.max(0, Number(req.nextUrl.searchParams.get("page") ?? "0") || 0);

  let query = supabaseServer
    .from("orders")
    .select(
      "id, order_number, status, payment_status, total_amount, contact_phone, created_at, source, customers(username, first_name, last_name, source)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status as never);
  if (payment) query = query.eq("payment_status", payment as never);
  if (q) query = query.or(`order_number.ilike.%${q}%,contact_phone.ilike.%${q}%`);

  const offset = page * ADMIN_PAGE_SIZE;
  const { data, count, error } = await query.range(offset, offset + ADMIN_PAGE_SIZE - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = count ?? 0;
  return NextResponse.json({ orders: data, hasMore: offset + ADMIN_PAGE_SIZE < total, total });
}
