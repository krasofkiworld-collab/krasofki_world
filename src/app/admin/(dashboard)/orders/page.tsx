"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { useInfiniteScrollTrigger } from "@/lib/use-infinite-scroll-trigger";

const STATUS_TABS = [
  { value: "", label: "Усі" },
  { value: "pending", label: "Нові" },
  { value: "confirmed", label: "Підтверджені" },
  { value: "shipped", label: "Відправлені" },
  { value: "completed", label: "Завершені" },
  { value: "cancelled", label: "Скасовані" },
];

const PAYMENT_TABS = [
  { value: "", label: "Усі" },
  { value: "paid", label: "Оплачено" },
  { value: "unpaid", label: "Не оплачено" },
];

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  contact_phone: string;
  created_at: string;
  customers: { username: string | null; first_name: string | null } | null;
};

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="flex flex-col gap-4"><h1 className="text-2xl font-semibold">Замовлення</h1></div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}

function AdminOrdersContent() {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get("status") ?? "";
  const payment = params.get("payment") ?? "";
  const q = params.get("q") ?? "";
  const [search, setSearch] = useState(q);

  const sentinelRef = useRef<HTMLTableRowElement>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["admin-orders", status, payment, q],
    queryFn: async ({ pageParam }) => {
      const qs = new URLSearchParams();
      if (status) qs.set("status", status);
      if (payment) qs.set("payment", payment);
      if (q) qs.set("q", q);
      qs.set("page", String(pageParam));
      const res = await fetch(`/api/admin/orders?${qs.toString()}`);
      return (await res.json()) as { orders: Order[]; hasMore: boolean };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + 1 : undefined,
  });

  useInfiniteScrollTrigger(sentinelRef, hasNextPage, isFetchingNextPage, fetchNextPage);

  const orders = data?.pages.flatMap((p) => p.orders) ?? [];

  function setFilter(key: "status" | "payment" | "q", value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/admin/orders?${next.toString()}`);
  }

  useEffect(() => {
    const handle = setTimeout(() => setFilter("q", search), 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Замовлення</h1>

      <div className="flex flex-wrap gap-4">
        <div className="flex gap-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter("status", t.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                status === t.value ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {PAYMENT_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter("payment", t.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                payment === t.value ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Input
          placeholder="Пошук за номером/телефоном"
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Номер</TableHead>
            <TableHead>Клієнт</TableHead>
            <TableHead>Сума</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Оплата</TableHead>
            <TableHead>Дата</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={6}>Завантаження...</TableCell>
            </TableRow>
          )}
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell>
                <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                  {o.order_number}
                </Link>
              </TableCell>
              <TableCell>{o.customers?.username ? `@${o.customers.username}` : o.customers?.first_name ?? "—"}</TableCell>
              <TableCell>{formatMoney(o.total_amount)}</TableCell>
              <TableCell>
                <Badge variant="secondary">{o.status}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={o.payment_status === "paid" ? "default" : "secondary"}>
                  {o.payment_status === "paid" ? "Оплачено" : "Не оплачено"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(o.created_at).toLocaleString("uk-UA")}
              </TableCell>
            </TableRow>
          ))}
          {!isLoading && !orders.length && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Немає замовлень за цими фільтрами.
              </TableCell>
            </TableRow>
          )}
          {hasNextPage && (
            <TableRow ref={sentinelRef}>
              <TableCell colSpan={6} className="text-center text-xs text-muted-foreground">
                {isFetchingNextPage ? "Завантаження ще…" : ""}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
