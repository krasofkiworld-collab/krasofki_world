"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/stores/cart";
import { hapticLight } from "./telegram-init";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Variant = {
  id: string;
  size: string;
  color_name: string | null;
  color_hex: string | null;
  stock_quantity: number;
};

type Product = {
  id: string;
  name: string;
  price: number;
  images: string[];
  stock_quantity: number;
};

export function ProductPurchasePanel({ product, variants }: { product: Product; variants: Variant[] }) {
  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const hasVariants = variants.length > 0;

  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size))], [variants]);
  const colors = useMemo(() => {
    const seen = new Map<string, { name: string; hex: string | null }>();
    for (const v of variants) {
      if (v.color_name) seen.set(v.color_name, { name: v.color_name, hex: v.color_hex });
    }
    return [...seen.values()];
  }, [variants]);

  const [selectedSize, setSelectedSize] = useState<string | undefined>(sizes[0]);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(colors[0]?.name);
  const [qty, setQty] = useState(1);

  const selectedVariant = hasVariants
    ? variants.find((v) => v.size === selectedSize && (colors.length === 0 || v.color_name === selectedColor))
    : undefined;

  const maxQty = hasVariants ? (selectedVariant?.stock_quantity ?? 0) : product.stock_quantity;
  const outOfStock = maxQty <= 0;

  // How many of this exact product+variant are already sitting in the
  // cart — the stepper must clamp against *this*, not raw stock, or
  // clicking "Add" repeatedly lets you add past the real limit (each add
  // resets the local qty to 1, so a naive maxQty-only clamp never notices
  // the running total already in the cart).
  const alreadyInCart =
    items.find((i) => i.productId === product.id && i.variantId === selectedVariant?.id)?.qty ?? 0;
  const availableToAdd = Math.max(0, maxQty - alreadyInCart);
  const maxedInCart = !outOfStock && availableToAdd <= 0;

  // Clamp qty to what's actually available every time the selected
  // size/color changes, or the cart itself changes — otherwise a qty
  // picked for one variant (e.g. 5) silently carries over to a variant
  // with less stock (or none at all), or past what's already in the cart.
  useEffect(() => {
    setQty((q) => (availableToAdd <= 0 ? 0 : Math.min(Math.max(q, 1), availableToAdd)));
  }, [availableToAdd]);

  function handleAdd() {
    if (availableToAdd <= 0 || qty < 1) return; // defensive — the button is disabled for this too
    add({
      productId: product.id,
      variantId: selectedVariant?.id,
      variantLabel: selectedVariant ? [selectedVariant.size, selectedVariant.color_name].filter(Boolean).join(" / ") : undefined,
      name: product.name,
      price: product.price,
      image: product.images[0],
      qty,
    });
    hapticLight();
    toast.success("Додано в кошик");
    setQty(1);
  }

  return (
    <div className="flex flex-col gap-4">
      {sizes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Розмір</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const availableForColor = variants.some(
                (v) => v.size === size && (colors.length === 0 || v.color_name === selectedColor) && v.stock_quantity > 0
              );
              return (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  disabled={!availableForColor}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg border text-sm",
                    selectedSize === size ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    !availableForColor && "opacity-40"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Колір</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedColor(c.name)}
                aria-label={c.name}
                title={c.name}
                className={cn(
                  "size-8 rounded-full",
                  // Selected: ring sits offset from the fill by a visible gap
                  // (ring-offset), so it reads as "this one" instead of just
                  // a thicker edge that blends into the color itself.
                  selectedColor === c.name
                    ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                    : "ring-1 ring-border"
                )}
                style={{ backgroundColor: c.hex ?? "#ccc" }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="sticky bottom-16 flex items-center gap-3 rounded-xl border bg-background p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="size-8"
            disabled={availableToAdd <= 0 || qty <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            <Minus className="size-3.5" />
          </Button>
          <span className="w-4 text-center text-sm">{qty}</span>
          <Button
            size="icon"
            variant="outline"
            className="size-8"
            disabled={qty >= availableToAdd}
            onClick={() => setQty((q) => Math.min(availableToAdd, q + 1))}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
        <Button size="lg" className="flex-1" disabled={availableToAdd <= 0} onClick={handleAdd}>
          {outOfStock
            ? "Немає в наявності"
            : maxedInCart
              ? "Максимум уже в кошику"
              : `Додати · ${formatMoney(product.price * qty)}`}
        </Button>
      </div>
    </div>
  );
}
