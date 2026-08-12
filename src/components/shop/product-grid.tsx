"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ProductCard } from "./product-card";
import { Skeleton } from "@/components/ui/skeleton";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  stock_quantity: number;
  brands: { name: string } | null;
};

type Filters = { category?: string; brand?: string; tag?: string; q?: string; sort?: string };

export function ProductGrid({ initialProducts, hasMore: initialHasMore, filters }: {
  initialProducts: Product[];
  hasMore: boolean;
  filters: Filters;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["products", filters],
    queryFn: async ({ pageParam }) => {
      const qs = new URLSearchParams();
      if (filters.category) qs.set("category", filters.category);
      if (filters.brand) qs.set("brand", filters.brand);
      if (filters.tag) qs.set("tag", filters.tag);
      if (filters.q) qs.set("q", filters.q);
      if (filters.sort) qs.set("sort", filters.sort);
      qs.set("page", String(pageParam));
      const res = await fetch(`/api/products?${qs.toString()}`);
      return (await res.json()) as { products: Product[]; hasMore: boolean };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.hasMore ? (lastPageParam as number) + 1 : undefined,
    // Page 0 (the first PAGE_SIZE items) was already fetched server-side —
    // seed react-query's cache with it so infinite scroll starts from page 1
    // instead of re-fetching what the Server Component already rendered.
    initialData: { pages: [{ products: initialProducts, hasMore: initialHasMore }], pageParams: [0] },
  });

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "600px" } // start loading before the user hits the literal bottom
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const products = data?.pages.flatMap((p) => p.products) ?? initialProducts;

  if (!products.length) {
    return <p className="py-12 text-center text-muted-foreground">Товарів не знайдено.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {hasNextPage && (
        <div ref={sentinelRef} className="grid grid-cols-2 gap-3">
          {isFetchingNextPage &&
            [...Array(2)].map((_, i) => <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />)}
        </div>
      )}
    </div>
  );
}
