import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { buildProductsQuery, PAGE_SIZE } from "@/lib/products-query";

// Public, anon-key catalog pagination — same RLS-scoped read as the Server
// Component's first page (see supabase/migrations/0003_rls_policies.sql:
// anon can only ever see is_active products). Powers infinite scroll past
// the first PAGE_SIZE items rendered server-side.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const page = Math.max(0, Number(params.get("page") ?? "0") || 0);
  const filters = {
    category: params.get("category") ?? undefined,
    brand: params.get("brand") ?? undefined,
    tag: params.get("tag") ?? undefined,
    q: params.get("q") ?? undefined,
    sort: params.get("sort") ?? undefined,
  };

  const supabase = createClient();
  const offset = page * PAGE_SIZE;
  const { data, count, error } = await buildProductsQuery(supabase, filters).range(
    offset,
    offset + PAGE_SIZE - 1
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = count ?? 0;
  return NextResponse.json({
    products: data ?? [],
    hasMore: offset + PAGE_SIZE < total,
    total,
  });
}
