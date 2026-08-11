import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const variantSchema = z.object({
  size: z.string().min(1),
  color_name: z.string().optional().nullable(),
  color_hex: z.string().optional().nullable(),
  stock_quantity: z.number().int().min(0).default(0),
  sku: z.string().optional().nullable(),
});

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
  variants: z.array(variantSchema).default([]),
});

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const category = req.nextUrl.searchParams.get("category");
  const brand = req.nextUrl.searchParams.get("brand");
  const q = req.nextUrl.searchParams.get("q");
  const lowStock = req.nextUrl.searchParams.get("filter") === "low_stock";

  let query = supabaseServer
    .from("products")
    .select("id, slug, name, price, stock_quantity, is_active, images, category_id, brand_id, categories(name), brands(name)")
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category_id", category);
  if (brand) query = query.eq("brand_id", brand);
  if (q) query = query.ilike("name", `%${q}%`);
  if (lowStock) query = query.lte("stock_quantity", 5);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const { tag_ids, variants, ...productData } = parsed.data;

  const { data: product, error } = await supabaseServer.from("products").insert(productData).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (tag_ids.length) {
    await supabaseServer.from("product_tags").insert(tag_ids.map((tag_id) => ({ product_id: product.id, tag_id })));
  }
  if (variants.length) {
    await supabaseServer
      .from("product_variants")
      .insert(variants.map((v) => ({ ...v, product_id: product.id })));
  }

  return NextResponse.json({ id: product.id });
}
