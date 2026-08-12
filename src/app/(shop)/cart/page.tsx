"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart, cartTotal } from "@/stores/cart";
import { formatMoney } from "@/lib/format";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const total = cartTotal(items);

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">Кошик порожній</p>
        <Button render={<Link href="/">До каталогу</Link>} />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {items.map((item, i) => (
        <div
          key={`${item.productId}-${item.variantId ?? ""}`}
          className={
            i < items.length - 1
              ? "flex gap-4 border-b border-dashed border-border py-4"
              : "flex gap-4 py-4"
          }
        >
          <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
            {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-sm font-semibold uppercase tracking-tight">{item.name}</p>
              <button
                onClick={() => remove(item.productId, item.variantId)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Видалити"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {item.variantLabel && <DetailRow label="Варіант" value={item.variantLabel} />}
              <DetailRow label="Ціна" value={formatMoney(item.price)} />
              <DetailRow label="Разом" value={formatMoney(item.price * item.qty)} />
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="size-7"
                onClick={() => setQty(item.productId, Math.max(1, item.qty - 1), item.variantId)}
              >
                <Minus className="size-3" />
              </Button>
              <span className="w-5 text-center text-sm">{item.qty}</span>
              <Button
                size="icon"
                variant="outline"
                className="size-7"
                onClick={() => setQty(item.productId, item.qty + 1, item.variantId)}
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      <div className="sticky bottom-16 mt-2 flex items-center justify-between rounded-lg border bg-background p-3">
        <span className="text-muted-foreground">Разом</span>
        <span className="text-lg font-semibold">{formatMoney(total)}</span>
      </div>

      <Button render={<Link href="/checkout">Оформити замовлення</Link>} size="lg" className="mt-4" />
    </div>
  );
}
