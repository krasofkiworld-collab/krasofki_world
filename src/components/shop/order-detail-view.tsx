"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Copy, Check, ImageOff, Truck, XCircle } from "lucide-react";
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

const DELIVERY_METHOD_LABEL: Record<string, string> = {
  nova_poshta_branch: "Нова пошта, відділення",
  nova_poshta_courier: "Нова пошта, кур'єр",
  pickup: "Самовивіз",
};

type OrderDetail = {
  order_number: string;
  status: string;
  payment_status: string;
  delivery_method: string;
  delivery_address: { city?: string; branch?: string; street?: string };
  total_amount: number;
  admin_note: string | null;
  created_at: string;
  order_items: {
    id: string;
    product_name: string;
    variant_name: string | null;
    unit_price: number;
    quantity: number;
    line_total: number;
    products: { images: string[] } | null;
  }[];
};

export function OrderDetailView({ id }: { id: string }) {
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
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-semibold">{order.order_number}</h2>
          <CopyOrderNumberButton value={order.order_number} />
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(order.created_at).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <Badge variant={order.payment_status === "paid" ? "default" : "secondary"} className="mt-1.5">
          {order.payment_status === "paid" ? "Оплачено" : "Не оплачено"}
        </Badge>
      </div>

      {cancelled ? (
        <p className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <XCircle className="size-4 shrink-0" />
          Замовлення скасовано{order.admin_note ? `: ${order.admin_note}` : ""}
        </p>
      ) : (
        <div className="flex items-start">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full items-center">
                <div className={cn("h-0.5 flex-1", i === 0 ? "bg-transparent" : i <= currentStepIndex ? "bg-primary" : "bg-muted")} />
                <div
                  className={cn(
                    "size-3 shrink-0 rounded-full",
                    i <= currentStepIndex ? "bg-primary" : "bg-muted"
                  )}
                />
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    i === STEPS.length - 1 ? "bg-transparent" : i < currentStepIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              </div>
              <span className="text-center text-[11px] text-muted-foreground">{step.label}</span>
            </div>
          ))}
        </div>
      )}

      <Separator />

      <div className="flex flex-col gap-3">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 text-sm">
            <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {item.products?.images[0] ? (
                <Image src={item.products.images[0]} alt={item.product_name} fill className="object-cover" />
              ) : (
                <ImageOff className="size-4 text-muted-foreground" />
              )}
            </div>
            <span className="min-w-0 flex-1">
              {item.product_name}
              {item.variant_name && <span className="text-muted-foreground"> ({item.variant_name})</span>} ×{" "}
              {item.quantity}
            </span>
            <span className="shrink-0">{formatMoney(item.line_total)}</span>
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex justify-between font-semibold">
        <span>Разом</span>
        <span>{formatMoney(order.total_amount)}</span>
      </div>

      <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <Truck className="size-3.5 shrink-0" />
          {DELIVERY_METHOD_LABEL[order.delivery_method] ?? order.delivery_method}
          {order.delivery_address.city ? ` — ${order.delivery_address.city}` : ""}
          {order.delivery_address.branch ? `, відділення ${order.delivery_address.branch}` : ""}
          {order.delivery_address.street ? `, ${order.delivery_address.street}` : ""}
        </p>
        <p>Оплата: при отриманні + передоплата</p>
      </div>
    </div>
  );
}

function CopyOrderNumberButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button onClick={copy} aria-label="Скопіювати номер замовлення" className="text-muted-foreground">
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
    </button>
  );
}
