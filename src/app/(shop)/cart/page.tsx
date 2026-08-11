"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart, cartTotal } from "@/stores/cart";
import { formatMoney } from "@/lib/format";

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
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <Card key={`${item.productId}-${item.variantId ?? ""}`} className="flex-row items-center gap-3 p-3 rounded-2xl">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
            {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
            {item.variantLabel && <p className="text-xs text-muted-foreground">{item.variantLabel}</p>}
            <p className="text-sm text-muted-foreground">{formatMoney(item.price)}</p>
            <div className="mt-1 flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="size-7"
                onClick={() => setQty(item.productId, Math.max(1, item.qty - 1), item.variantId)}
              >
                <Minus className="size-3" />
              </Button>
              <Input
                readOnly
                value={item.qty}
                className="h-7 w-10 text-center px-0"
              />
              <Button
                size="icon"
                variant="outline"
                className="size-7"
                onClick={() => setQty(item.productId, item.qty + 1, item.variantId)}
              >
                <Plus className="size-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="ml-auto size-7 text-destructive"
                onClick={() => remove(item.productId, item.variantId)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}

      <div className="sticky bottom-16 mt-2 flex items-center justify-between rounded-lg border bg-background p-3">
        <span className="text-muted-foreground">Разом</span>
        <span className="text-lg font-semibold">{formatMoney(total)}</span>
      </div>

      <Button render={<Link href="/checkout">Оформити замовлення</Link>} size="lg" />
    </div>
  );
}
