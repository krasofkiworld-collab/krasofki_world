"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Ban, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInfiniteScrollTrigger } from "@/lib/use-infinite-scroll-trigger";
import { toast } from "sonner";

type Customer = {
  id: string;
  source: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  contact_telegram: string | null;
  is_blocked: boolean;
  blocked_reason: string | null;
  created_at: string;
};

const FILTER_TABS = [
  { value: "", label: "Усі" },
  { value: "blocked", label: "Заблоковані" },
];

export default function AdminCustomersPage() {
  return (
    <Suspense fallback={<div className="flex flex-col gap-4"><h1 className="text-2xl font-semibold">Клієнти</h1></div>}>
      <AdminCustomersContent />
    </Suspense>
  );
}

function AdminCustomersContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const filter = params.get("filter") ?? "";
  const q = params.get("q") ?? "";
  const [search, setSearch] = useState(q);
  const [blocking, setBlocking] = useState<Customer | null>(null);
  const [reason, setReason] = useState("");
  const sentinelRef = useRef<HTMLTableRowElement>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["admin-customers", filter, q],
    queryFn: async ({ pageParam }) => {
      const qs = new URLSearchParams();
      if (filter) qs.set("filter", filter);
      if (q) qs.set("q", q);
      qs.set("page", String(pageParam));
      const res = await fetch(`/api/admin/customers?${qs.toString()}`);
      return (await res.json()) as { customers: Customer[]; hasMore: boolean };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) => (lastPage.hasMore ? lastPageParam + 1 : undefined),
  });

  useInfiniteScrollTrigger(sentinelRef, hasNextPage, isFetchingNextPage, fetchNextPage);

  const customers = data?.pages.flatMap((p) => p.customers) ?? [];

  function setFilter(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("filter", value);
    else next.delete("filter");
    router.push(`/admin/customers?${next.toString()}`);
  }

  function runSearch(value: string) {
    setSearch(value);
    const next = new URLSearchParams(params.toString());
    if (value) next.set("q", value);
    else next.delete("q");
    router.push(`/admin/customers?${next.toString()}`);
  }

  async function unblock(customer: Customer) {
    const res = await fetch(`/api/admin/customers/${customer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_blocked: false }),
    });
    if (!res.ok) {
      toast.error("Не вдалося розблокувати");
      return;
    }
    toast.success("Клієнта розблоковано");
    queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
  }

  async function confirmBlock() {
    if (!blocking) return;
    const res = await fetch(`/api/admin/customers/${blocking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_blocked: true, reason: reason || undefined }),
    });
    if (!res.ok) {
      toast.error("Не вдалося заблокувати");
      return;
    }
    toast.success("Клієнта заблоковано — оформити замовлення він більше не зможе");
    setBlocking(null);
    setReason("");
    queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
  }

  function displayName(c: Customer) {
    if (c.source === "web") return `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "—";
    return c.username ? `@${c.username}` : (c.first_name ?? "—");
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Клієнти</h1>

      <div className="flex flex-wrap gap-4">
        <div className="flex gap-1">
          {FILTER_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                filter === t.value ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Input
          placeholder="Пошук за іменем/username/телефоном"
          className="max-w-xs"
          value={search}
          onChange={(e) => runSearch(e.target.value)}
        />
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Клієнт</TableHead>
              <TableHead>Джерело</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата реєстрації</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6}>Завантаження...</TableCell>
              </TableRow>
            )}
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{displayName(c)}</TableCell>
                <TableCell className="text-muted-foreground">{c.source === "web" ? "Сайт" : "Telegram"}</TableCell>
                <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                <TableCell>
                  {c.is_blocked ? (
                    <Badge variant="destructive" title={c.blocked_reason ?? undefined}>
                      Заблокований
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Активний</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("uk-UA")}
                </TableCell>
                <TableCell>
                  {c.is_blocked ? (
                    <Button variant="outline" size="sm" onClick={() => unblock(c)}>
                      <CheckCircle2 /> Розблокувати
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setBlocking(c)}>
                      <Ban /> Заблокувати
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && !customers.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Клієнтів не знайдено.
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

      <Dialog open={!!blocking} onOpenChange={(open) => !open && setBlocking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Заблокувати {blocking ? displayName(blocking) : ""}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Клієнт зможе далі переглядати каталог і додавати товари в кошик, але оформити замовлення більше не
            зможе — при спробі побачить повідомлення з посиланням на менеджера.
          </p>
          <Textarea
            placeholder="Причина (опційно, видно лише вам)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="destructive" onClick={confirmBlock}>
              Заблокувати
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
