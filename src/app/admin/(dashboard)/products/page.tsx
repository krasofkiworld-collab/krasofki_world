"use client";

import Link from "next/link";
import { useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { Plus } from "lucide-react";
import { useInfiniteScrollTrigger } from "@/lib/use-infinite-scroll-trigger";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  categories: { name: string } | null;
};

export default function AdminProductsPage() {
  const sentinelRef = useRef<HTMLTableRowElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["admin-products"],
    queryFn: async ({ pageParam }) => {
      const res = await fetch(`/api/admin/products?page=${pageParam}`);
      return (await res.json()) as { products: Product[]; hasMore: boolean };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + 1 : undefined,
  });

  useInfiniteScrollTrigger(sentinelRef, hasNextPage, isFetchingNextPage, fetchNextPage);

  const products = data?.pages.flatMap((p) => p.products) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Товари</h1>
        <Button render={<Link href="/admin/products/new" />}>
          <Plus className="size-4" /> Додати товар
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Назва</TableHead>
            <TableHead>Категорія</TableHead>
            <TableHead>Ціна</TableHead>
            <TableHead>Залишок</TableHead>
            <TableHead>Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5}>Завантаження...</TableCell>
            </TableRow>
          )}
          {products.map((p) => (
            <TableRow key={p.id} className="cursor-pointer">
              <TableCell>
                <Link href={`/admin/products/${p.id}`} className="hover:underline">
                  {p.name}
                </Link>
              </TableCell>
              <TableCell>{p.categories?.name ?? "—"}</TableCell>
              <TableCell>{formatMoney(p.price)}</TableCell>
              <TableCell className={p.stock_quantity <= 5 ? "text-destructive" : ""}>
                {p.stock_quantity}
              </TableCell>
              <TableCell>
                <Badge variant={p.is_active ? "default" : "secondary"}>
                  {p.is_active ? "Активний" : "Прихований"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {!isLoading && !products.length && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Товарів ще немає.
              </TableCell>
            </TableRow>
          )}
          {hasNextPage && (
            <TableRow ref={sentinelRef}>
              <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                {isFetchingNextPage ? "Завантаження ще…" : ""}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
