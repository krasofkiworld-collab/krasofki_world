import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";

const ADMIN_PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q");
  const blockedOnly = req.nextUrl.searchParams.get("filter") === "blocked";
  const page = Math.max(0, Number(req.nextUrl.searchParams.get("page") ?? "0") || 0);

  let query = supabaseServer
    .from("customers")
    .select(
      "id, source, username, first_name, last_name, phone, contact_telegram, is_blocked, blocked_reason, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (q) query = query.or(`username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`);
  if (blockedOnly) query = query.eq("is_blocked", true);

  const offset = page * ADMIN_PAGE_SIZE;
  const { data, count, error } = await query.range(offset, offset + ADMIN_PAGE_SIZE - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = count ?? 0;
  return NextResponse.json({ customers: data, hasMore: offset + ADMIN_PAGE_SIZE < total, total });
}
