"use client";

import Link from "next/link";
import { useRef } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMoney } from "@/lib/format";
import { Plus, MoreVertical, Pencil, ExternalLink, EyeOff, Eye, Trash2 } from "lucide-react";
import { useInfiniteScrollTrigger } from "@/lib/use-infinite-scroll-trigger";
import { toast } from "sonner";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  images: string[];
  categories: { name: string } | null;
};

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
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

  async function toggleActive(p: Product) {
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    if (!res.ok) {
      toast.error("Не вдалося оновити статус");
      return;
    }
    toast.success(p.is_active ? "Товар приховано" : "Товар активовано");
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  }

  async function removeProduct(p: Product) {
    if (!confirm(`Видалити «${p.name}»? Товар приховається з каталогу.`)) return;
    const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Не вдалося видалити");
      return;
    }
    toast.success("Товар видалено");
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Товари</h1>
        <Button render={<Link href="/admin/products/new" />}>
          <Plus className="size-4" /> Додати товар
        </Button>
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Фото</TableHead>
            <TableHead>Назва</TableHead>
            <TableHead>Категорія</TableHead>
            <TableHead>Ціна</TableHead>
            <TableHead>Залишок</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={7}>Завантаження...</TableCell>
            </TableRow>
          )}
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                {p.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element -- small fixed-size thumbnail, not worth Image's overhead here
                  <img src={p.images[0]} alt="" className="size-9 rounded-md object-cover" />
                )}
              </TableCell>
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
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" className="size-8" aria-label="Дії з товаром" />
                    }
                  >
                    <MoreVertical className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem render={<Link href={`/admin/products/${p.id}`} />}>
                      <Pencil /> Редагувати
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={<a href={`/product/${p.slug}`} target="_blank" rel="noreferrer" />}
                    >
                      <ExternalLink /> Переглянути на сайті
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleActive(p)}>
                      {p.is_active ? <EyeOff /> : <Eye />}
                      {p.is_active ? "Приховати" : "Активувати"}
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => removeProduct(p)}>
                      <Trash2 /> Видалити
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {!isLoading && !products.length && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Товарів ще немає.
              </TableCell>
            </TableRow>
          )}
          {hasNextPage && (
            <TableRow ref={sentinelRef}>
              <TableCell colSpan={7} className="text-center text-xs text-muted-foreground">
                {isFetchingNextPage ? "Завантаження ще…" : ""}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
