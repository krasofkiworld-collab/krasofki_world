"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { getInitData, withDevUserId, isInTelegram } from "@/components/shop/telegram-init";
import { getWebClientId } from "@/components/shop/web-client-id";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending: "Нове",
  confirmed: "Підтверджено",
  shipped: "Відправлено",
  completed: "Завершено",
  cancelled: "Скасовано",
};

// Distinct color per status so the list is scannable at a glance instead of
// every badge reading the same regardless of where the order actually is.
const STATUS_CLASS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 hover:bg-amber-100",
  confirmed: "bg-blue-100 text-blue-900 hover:bg-blue-100",
  shipped: "bg-violet-100 text-violet-900 hover:bg-violet-100",
  completed: "bg-emerald-100 text-emerald-900 hover:bg-emerald-100",
  cancelled: "bg-destructive/10 text-destructive hover:bg-destructive/10",
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  order_items: { id: string; products: { images: string[] } | null }[];
};

export function OrdersView() {
  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch(withDevUserId("/api/orders"), {
        headers: {
          "X-Telegram-Init-Data": getInitData(),
          ...(isInTelegram() ? {} : { "X-Web-Client-Id": getWebClientId() }),
        },
      });
      if (!res.ok) throw new Error("failed");
      return (await res.json()) as { orders: Order[] };
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data?.orders.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">У вас ще немає замовлень</p>
        <Button render={<Link href="/">До каталогу</Link>} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.orders.map((order) => {
        const thumbs = order.order_items.slice(0, 3);
        const extraCount = order.order_items.length - thumbs.length;

        return (
          <Link key={order.id} href={`/orders/${order.id}`}>
            <Card className="flex-row items-center gap-3 p-3">
              <div className="flex -space-x-3">
                {thumbs.map((item) => (
                  <div
                    key={item.id}
                    className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted ring-2 ring-background"
                  >
                    {item.products?.images[0] ? (
                      <Image src={item.products.images[0]} alt="" fill className="object-cover" />
                    ) : (
                      <ImageOff className="size-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
                {extraCount > 0 && (
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium ring-2 ring-background">
                    +{extraCount}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium">{order.order_number}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString("uk-UA")}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <p className="font-semibold">{formatMoney(order.total_amount)}</p>
                <Badge className={cn(STATUS_CLASS[order.status])}>
                  {STATUS_LABEL[order.status] ?? order.status}
                </Badge>
              </div>

              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
