import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const payment = req.nextUrl.searchParams.get("payment");
  const q = req.nextUrl.searchParams.get("q");

  let query = supabaseServer
    .from("orders")
    .select("id, order_number, status, payment_status, total_amount, contact_phone, created_at, customers(username, first_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status as never);
  if (payment) query = query.eq("payment_status", payment as never);
  if (q) query = query.or(`order_number.ilike.%${q}%,contact_phone.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}
