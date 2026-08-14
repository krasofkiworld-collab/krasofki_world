"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ProductCard } from "@/components/shop/product-card";
import { useFavorites } from "@/stores/favorites";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function FavoritesView() {
  const productIds = useFavorites((s) => s.productIds);

  const { data: products, isLoading } = useQuery({
    queryKey: ["favorites", productIds],
    queryFn: async () => {
      if (!productIds.length) return [];
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("id, slug, name, price, compare_at_price, images, stock_quantity, brands(name)")
        .in("id", productIds)
        .eq("is_active", true);
      return data ?? [];
    },
  });

  if (!productIds.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">Ще немає обраних товарів</p>
        <Button render={<Link href="/">До каталогу</Link>} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products?.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
