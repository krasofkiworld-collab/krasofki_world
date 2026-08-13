"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { getInitData, withDevUserId, isInTelegram } from "@/components/shop/telegram-init";
import { getWebClientId } from "@/components/shop/web-client-id";

const STATUS_LABEL: Record<string, string> = {
  pending: "Нове",
  confirmed: "Підтверджено",
  shipped: "Відправлено",
  completed: "Завершено",
  cancelled: "Скасовано",
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
};

export default function OrdersPage() {
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
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!data?.orders.length) {
    return <p className="py-12 text-center text-muted-foreground">У вас ще немає замовлень.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {data.orders.map((order) => (
        <Link key={order.id} href={`/orders/${order.id}`}>
          <Card className="flex-row items-center justify-between p-3">
            <div>
              <p className="font-medium">{order.order_number}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString("uk-UA")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatMoney(order.total_amount)}</p>
              <Badge variant="secondary">{STATUS_LABEL[order.status] ?? order.status}</Badge>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
