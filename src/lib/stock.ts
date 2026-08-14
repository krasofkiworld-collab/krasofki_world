import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { syncProductStockFromColors } from "@/lib/admin/product-colors";

type StockAdjustment = { productId: string; variantId?: string | null; qty: number };

/**
 * Moves stock up or down when an order is placed (sign -1) or cancelled
 * (sign +1). For a variant (color+size) this adjusts that size's own row
 * and then re-sums the product's total from all its variants, so the
 * product-level stock_quantity — which the catalog card, admin list, and
 * low-stock widget all read directly — never drifts out of sync. For a
 * variant-less product it adjusts stock_quantity directly.
 */
export async function adjustStock(items: StockAdjustment[], sign: 1 | -1) {
  for (const item of items) {
    if (item.variantId) {
      const { data: variant } = await supabaseServer
        .from("product_variants")
        .select("stock_quantity")
        .eq("id", item.variantId)
        .maybeSingle();
      if (!variant) continue;
      const next = Math.max(0, variant.stock_quantity + sign * item.qty);
      await supabaseServer.from("product_variants").update({ stock_quantity: next }).eq("id", item.variantId);
      await syncProductStockFromColors(item.productId);
    } else {
      const { data: product } = await supabaseServer
        .from("products")
        .select("stock_quantity")
        .eq("id", item.productId)
        .maybeSingle();
      if (!product) continue;
      const next = Math.max(0, product.stock_quantity + sign * item.qty);
      await supabaseServer.from("products").update({ stock_quantity: next }).eq("id", item.productId);
    }
  }
}
