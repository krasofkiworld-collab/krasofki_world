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

const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().min(0).optional(),
  compare_at_price: z.number().min(0).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  brand_id: z.string().uuid().optional().nullable(),
  images: z.array(z.string()).optional(),
  stock_quantity: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
  variants: z.array(variantSchema).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await supabaseServer
    .from("products")
    .select("*, product_tags(tag_id), product_variants(id, size, color_name, color_hex, stock_quantity, sku)")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = productUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const { tag_ids, variants, ...productData } = parsed.data;

  if (Object.keys(productData).length) {
    const { error } = await supabaseServer.from("products").update(productData).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (tag_ids) {
    await supabaseServer.from("product_tags").delete().eq("product_id", id);
    if (tag_ids.length) {
      await supabaseServer.from("product_tags").insert(tag_ids.map((tag_id) => ({ product_id: id, tag_id })));
    }
  }

  if (variants) {
    await supabaseServer.from("product_variants").delete().eq("product_id", id);
    if (variants.length) {
      await supabaseServer
        .from("product_variants")
        .insert(variants.map((v) => ({ ...v, product_id: id })));
    }
  }

  return NextResponse.json({ ok: true });
}

// Soft delete only — order_items reference product_id and must keep resolving.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const { error } = await supabaseServer.from("products").update({ is_active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
