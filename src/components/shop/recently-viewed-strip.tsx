"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useRecentlyViewed } from "@/stores/recently-viewed";
import { ProductCard } from "./product-card";

export function RecentlyViewedStrip() {
  const items = useRecentlyViewed((s) => s.items);

  if (!items.length) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold tracking-tight">Нещодавно переглянуті</h2>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {items.map((p) => (
            <div key={p.id} className="w-40 shrink-0 whitespace-normal">
              <ProductCard product={{ ...p, sku: null, brands: null }} />
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
