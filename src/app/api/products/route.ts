import { NextRequest, NextResponse } from "next/server";
import { PAGE_SIZE } from "@/lib/products-query";
import { getCachedProducts } from "@/lib/catalog-cache";

// Public, anon-key catalog pagination — same RLS-scoped read as the Server
// Component's first page (see supabase/migrations/0003_rls_policies.sql:
// anon can only ever see is_active products). Powers infinite scroll past
// the first PAGE_SIZE items rendered server-side. Backed by the same
// unstable_cache layer as the page itself (src/lib/catalog-cache.ts).
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

  const { products, total } = await getCachedProducts(filters, page);

  return NextResponse.json({
    products,
    hasMore: page * PAGE_SIZE + PAGE_SIZE < total,
    total,
  });
}
