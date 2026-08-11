"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { Plus } from "lucide-react";

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
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const res = await fetch("/api/admin/products");
      return (await res.json()) as { products: Product[] };
    },
  });

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
          {data?.products.map((p) => (
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
          {!isLoading && !data?.products.length && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Товарів ще немає.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
