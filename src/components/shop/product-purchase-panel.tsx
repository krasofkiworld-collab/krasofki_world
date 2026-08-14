"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/stores/cart";
import { MAX_QTY_PER_ITEM } from "@/lib/constants";
import { hapticLight } from "./telegram-init";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SizeVariant = {
  id: string;
  size: string;
  stock_quantity: number;
  is_active: boolean;
};

type ProductColor = {
  id: string;
  name: string;
  hex: string | null;
  image_url: string | null;
  sort_order: number;
  product_variants: SizeVariant[];
};

type Product = {
  id: string;
  name: string;
  price: number;
  images: string[];
  stock_quantity: number;
};

export function ProductPurchasePanel({
  product,
  colors,
  onColorSelect,
}: {
  product: Product;
  colors: ProductColor[];
  /** Notified when the selected color changes, so the page can sync the gallery to that color's photo. */
  onColorSelect?: (color: ProductColor | undefined) => void;
}) {
  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const hasColors = colors.length > 0;

  const [selectedColorId, setSelectedColorId] = useState<string | undefined>(colors[0]?.id);
  const selectedColor = colors.find((c) => c.id === selectedColorId);

  const sizes = useMemo(
    () => (selectedColor?.product_variants ?? []).filter((v) => v.is_active),
    [selectedColor]
  );

  const [selectedSize, setSelectedSize] = useState<string | undefined>(sizes[0]?.size);
  const [qty, setQty] = useState(1);

  // Reset the size choice whenever the color changes — sizes belong to a color.
  useEffect(() => {
    setSelectedSize(sizes[0]?.size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColorId]);

  useEffect(() => {
    onColorSelect?.(selectedColor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColorId]);

  const selectedVariant = hasColors ? sizes.find((v) => v.size === selectedSize) : undefined;

  const maxQty = hasColors ? (selectedVariant?.stock_quantity ?? 0) : product.stock_quantity;
  const outOfStock = maxQty <= 0;

  // How many of this exact product+variant are already sitting in the
  // cart — the stepper must clamp against *this*, not raw stock, or
  // clicking "Add" repeatedly lets you add past the real limit (each add
  // resets the local qty to 1, so a naive maxQty-only clamp never notices
  // the running total already in the cart).
  const alreadyInCart =
    items.find((i) => i.productId === product.id && i.variantId === selectedVariant?.id)?.qty ?? 0;
  // Clamp against both the real stock and the fixed per-order cap — whichever is stricter —
  // so one buyer can't take the entire shelf even when there's plenty left.
  const availableToAdd = Math.max(0, Math.min(maxQty, MAX_QTY_PER_ITEM) - alreadyInCart);
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
      variantLabel: selectedVariant
        ? [selectedColor?.name, selectedVariant.size].filter(Boolean).join(" / ")
        : undefined,
      name: product.name,
      price: product.price,
      image: selectedColor?.image_url ?? product.images[0],
      qty,
    });
    hapticLight();
    toast.success("Додано в кошик");
    setQty(1);
  }

  return (
    <div className="flex flex-col gap-4">
      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Колір</p>
          <div className="flex flex-wrap gap-3">
            {colors.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedColorId(c.id)}
                className="flex flex-col items-center gap-1"
              >
                <span
                  aria-label={c.name}
                  className={cn(
                    "size-8 rounded-full",
                    // Selected: ring sits offset from the fill by a visible gap
                    // (ring-offset), so it reads as "this one" instead of just
                    // a thicker edge that blends into the color itself.
                    selectedColorId === c.id
                      ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                      : "ring-1 ring-border"
                  )}
                  style={{ backgroundColor: c.hex ?? "#ccc" }}
                />
                <span
                  className={cn(
                    "max-w-14 truncate text-[11px]",
                    selectedColorId === c.id ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                >
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Розмір</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedSize(v.size)}
                disabled={v.stock_quantity <= 0}
                className={cn(
                  "relative flex size-10 items-center justify-center rounded-lg border text-sm",
                  selectedSize === v.size ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  v.stock_quantity <= 0 && "opacity-40"
                )}
              >
                {v.size}
                {v.stock_quantity > 0 && v.stock_quantity <= 3 && (
                  <span
                    className={cn(
                      "absolute -top-1.5 -right-1.5 rounded-full px-1 text-[9px] leading-[14px]",
                      selectedSize === v.size ? "bg-destructive text-white" : "bg-destructive/90 text-white"
                    )}
                  >
                    {v.stock_quantity}
                  </span>
                )}
              </button>
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
            aria-label="Зменшити кількість"
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
            aria-label="Збільшити кількість"
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
