"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useRecentlyViewed } from "@/stores/recently-viewed";
import { ProductCard } from "./product-card";

export function RecentlyViewedStrip() {
  const productIds = useRecentlyViewed((s) => s.productIds);

  const { data: products } = useQuery({
    queryKey: ["recently-viewed", productIds],
    queryFn: async () => {
      if (!productIds.length) return [];
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("id, slug, name, price, compare_at_price, images, stock_quantity, sku, brands(name)")
        .in("id", productIds)
        .eq("is_active", true);
      // Supabase's .in() doesn't preserve input order — resort to match the
      // most-recently-viewed-first order the store maintains.
      const byId = new Map((data ?? []).map((p) => [p.id, p]));
      return productIds.map((id) => byId.get(id)).filter((p) => p !== undefined);
    },
    enabled: productIds.length > 0,
  });

  if (!products?.length) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold tracking-tight">Нещодавно переглянуті</h2>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {products.map((p) => (
            <div key={p.id} className="w-40 shrink-0 whitespace-normal">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
