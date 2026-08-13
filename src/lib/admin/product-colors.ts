import "server-only";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

export const sizeSchema = z.object({
  size: z.string().min(1),
  stock_quantity: z.number().int().min(0).default(0),
  sku: z.string().optional().nullable(),
});

export const colorSchema = z.object({
  name: z.string().min(1),
  hex: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  sizes: z.array(sizeSchema).default([]),
});

export type ColorInput = z.infer<typeof colorSchema>;

/** Inserts product_colors + their nested product_variants for a product. */
export async function insertColors(productId: string, colors: ColorInput[]) {
  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    const { data: colorRow, error: colorError } = await supabaseServer
      .from("product_colors")
      .insert({
        product_id: productId,
        name: color.name,
        hex: color.hex ?? null,
        image_url: color.image_url ?? null,
        sort_order: i,
      })
      .select("id")
      .single();
    if (colorError || !colorRow) throw new Error(colorError?.message ?? "failed to create color");

    if (color.sizes.length) {
      const { error: sizesError } = await supabaseServer.from("product_variants").insert(
        color.sizes.map((s) => ({
          product_id: productId,
          product_color_id: colorRow.id,
          size: s.size,
          stock_quantity: s.stock_quantity,
          sku: s.sku ?? null,
        }))
      );
      if (sizesError) throw new Error(sizesError.message);
    }
  }
}

/** Replaces all of a product's colors/variants — used on PATCH. */
export async function replaceColors(productId: string, colors: ColorInput[]) {
  // product_variants cascade-deletes when their product_colors row goes,
  // so removing the colors is enough to clear the old size rows too.
  await supabaseServer.from("product_colors").delete().eq("product_id", productId);
  await insertColors(productId, colors);
}
