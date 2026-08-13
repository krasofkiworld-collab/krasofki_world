"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatMoney } from "@/lib/format";
import { getInitData, withDevUserId, isInTelegram } from "@/components/shop/telegram-init";
import { getWebClientId } from "@/components/shop/web-client-id";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "pending", label: "Прийнято" },
  { key: "confirmed", label: "Підтверджено" },
  { key: "shipped", label: "Відправлено" },
  { key: "completed", label: "Отримано" },
];

type OrderDetail = {
  order_number: string;
  status: string;
  payment_status: string;
  delivery_method: string;
  delivery_address: { city?: string; branch?: string; street?: string };
  total_amount: number;
  admin_note: string | null;
  order_items: { id: string; product_name: string; variant_name: string | null; unit_price: number; quantity: number; line_total: number }[];
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const res = await fetch(withDevUserId(`/api/orders/${id}`), {
        headers: {
          "X-Telegram-Init-Data": getInitData(),
          ...(isInTelegram() ? {} : { "X-Web-Client-Id": getWebClientId() }),
        },
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "failed");
      return (await res.json()) as OrderDetail;
    },
    refetchInterval: 15_000,
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error || !order) return <p className="py-12 text-center text-muted-foreground">Замовлення не знайдено.</p>;

  const currentStepIndex = STEPS.findIndex((s) => s.key === order.status);
  const cancelled = order.status === "cancelled";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">{order.order_number}</h2>
        <Badge variant={order.payment_status === "paid" ? "default" : "secondary"} className="mt-1">
          {order.payment_status === "paid" ? "Оплачено" : "Не оплачено"}
        </Badge>
      </div>

      {cancelled ? (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Замовлення скасовано{order.admin_note ? `: ${order.admin_note}` : ""}
        </p>
      ) : (
        <div className="flex justify-between">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  "size-3 rounded-full",
                  i <= currentStepIndex ? "bg-primary" : "bg-muted"
                )}
              />
              <span className="text-center text-[11px] text-muted-foreground">{step.label}</span>
            </div>
          ))}
        </div>
      )}

      <Separator />

      <div className="flex flex-col gap-2">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.product_name}
              {item.variant_name && <span className="text-muted-foreground"> ({item.variant_name})</span>} ×{" "}
              {item.quantity}
            </span>
            <span>{formatMoney(item.line_total)}</span>
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex justify-between font-semibold">
        <span>Разом</span>
        <span>{formatMoney(order.total_amount)}</span>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>Доставка: {order.delivery_address.city}{order.delivery_address.branch ? `, відділення ${order.delivery_address.branch}` : ""}{order.delivery_address.street ? `, ${order.delivery_address.street}` : ""}</p>
      </div>
    </div>
  );
}
