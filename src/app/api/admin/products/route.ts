import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";
import { colorSchema, insertColors } from "@/lib/admin/product-colors";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.number().min(0),
  compare_at_price: z.number().min(0).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  brand_id: z.string().uuid().optional().nullable(),
  images: z.array(z.string()).default([]),
  stock_quantity: z.number().int().min(0),
  is_active: z.boolean().default(true),
  tag_ids: z.array(z.string().uuid()).default([]),
  colors: z.array(colorSchema).default([]),
});

const ADMIN_PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const category = req.nextUrl.searchParams.get("category");
  const brand = req.nextUrl.searchParams.get("brand");
  const q = req.nextUrl.searchParams.get("q");
  const lowStock = req.nextUrl.searchParams.get("filter") === "low_stock";
  const page = Math.max(0, Number(req.nextUrl.searchParams.get("page") ?? "0") || 0);

  let query = supabaseServer
    .from("products")
    .select(
      "id, slug, name, price, stock_quantity, is_active, images, category_id, brand_id, categories(name), brands(name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category_id", category);
  if (brand) query = query.eq("brand_id", brand);
  if (q) query = query.ilike("name", `%${q}%`);
  if (lowStock) query = query.lte("stock_quantity", 5);

  const offset = page * ADMIN_PAGE_SIZE;
  const { data, count, error } = await query.range(offset, offset + ADMIN_PAGE_SIZE - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = count ?? 0;
  return NextResponse.json({ products: data, hasMore: offset + ADMIN_PAGE_SIZE < total, total });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const { tag_ids, colors, ...productData } = parsed.data;

  const { data: product, error } = await supabaseServer.from("products").insert(productData).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (tag_ids.length) {
    await supabaseServer.from("product_tags").insert(tag_ids.map((tag_id) => ({ product_id: product.id, tag_id })));
  }
  try {
    await insertColors(product.id, colors);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed to save colors" }, { status: 500 });
  }

  revalidateTag("catalog:products", { expire: 0 });
  return NextResponse.json({ id: product.id });
}
