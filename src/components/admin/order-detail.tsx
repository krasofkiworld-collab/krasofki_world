"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

const NEXT_STATUS: Record<string, { value: string; label: string }[]> = {
  pending: [
    { value: "confirmed", label: "Підтвердити" },
    { value: "cancelled", label: "Скасувати" },
  ],
  confirmed: [
    { value: "shipped", label: "Позначити відправленим" },
    { value: "cancelled", label: "Скасувати" },
  ],
  shipped: [
    { value: "completed", label: "Позначити завершеним" },
    { value: "cancelled", label: "Скасувати" },
  ],
  completed: [],
  cancelled: [],
};

type OrderDetail = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  delivery_method: string;
  delivery_address: { city?: string; branch?: string; street?: string };
  contact_phone: string;
  customer_note: string | null;
  admin_note: string | null;
  total_amount: number;
  customers: {
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    contact_telegram: string | null;
    source: string;
  } | null;
  order_items: {
    id: string;
    product_name: string;
    variant_name: string | null;
    unit_price: number;
    quantity: number;
    line_total: number;
  }[];
};

export function OrderDetail({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const data = (await res.json()) as OrderDetail;
      setNote(data.admin_note ?? "");
      return data;
    },
  });

  async function updateOrder(patch: Record<string, unknown>) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Помилка оновлення");
        return;
      }
      toast.success("Оновлено");
      queryClient.invalidateQueries({ queryKey: ["admin-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    } finally {
      setUpdating(false);
    }
  }

  if (isLoading || !order) return <p>Завантаження...</p>;

  const transitions = NEXT_STATUS[order.status] ?? [];

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{order.order_number}</h1>
        <Badge variant="secondary">{order.status}</Badge>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={order.payment_status === "paid"}
          disabled={updating}
          onCheckedChange={(checked) => updateOrder({ payment_status: checked ? "paid" : "unpaid" })}
        />
        <span>{order.payment_status === "paid" ? "Оплачено" : "Не оплачено"}</span>
      </div>

      <div className="flex gap-2">
        {transitions.map((t) => (
          <Button key={t.value} disabled={updating} onClick={() => updateOrder({ status: t.value, admin_note: note || undefined })}>
            {t.label}
          </Button>
        ))}
      </div>

      <Separator />

      <div>
        <h2 className="mb-2 font-medium">Товари</h2>
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
        <div className="mt-2 flex justify-between font-semibold">
          <span>Разом</span>
          <span>{formatMoney(order.total_amount)}</span>
        </div>
      </div>

      <Separator />

      <div className="text-sm">
        {order.customers?.source === "web" ? (
          <>
            <p>Ім&apos;я: {order.customers.first_name}</p>
            <p>Прізвище: {order.customers.last_name}</p>
            {order.customers.contact_telegram && <p>Telegram: {order.customers.contact_telegram}</p>}
          </>
        ) : (
          <p>
            Клієнт:{" "}
            {order.customers?.username
              ? `@${order.customers.username}`
              : `${order.customers?.first_name ?? ""} ${order.customers?.last_name ?? ""}`}
          </p>
        )}
        <p>Телефон: {order.contact_phone}</p>
        <Badge variant="outline" className="mt-0.5">
          {order.customers?.source === "web" ? "Замовлено з сайту" : "Замовлено через Telegram"}
        </Badge>
        <p>
          Доставка: {order.delivery_address.city}
          {order.delivery_address.branch ? `, відділення ${order.delivery_address.branch}` : ""}
          {order.delivery_address.street ? `, ${order.delivery_address.street}` : ""}
        </p>
        {order.customer_note && <p>Коментар клієнта: {order.customer_note}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Нотатка адміна (ТТН, причина скасування...)</label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        <Button variant="outline" className="w-fit" disabled={updating} onClick={() => updateOrder({ admin_note: note })}>
          Зберегти нотатку
        </Button>
      </div>
    </div>
  );
}
