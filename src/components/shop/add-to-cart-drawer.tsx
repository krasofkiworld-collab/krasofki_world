"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/stores/cart";
import { MAX_QTY_PER_ITEM } from "@/lib/constants";
import { hapticLight } from "./telegram-init";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SizeVariant = { id: string; size: string | null; stock_quantity: number; is_active: boolean };
type ProductColor = {
  id: string;
  name: string;
  hex: string | null;
  image_url: string | null;
  product_variants: SizeVariant[];
};
type ProductDetail = {
  id: string;
  name: string;
  price: number;
  images: string[];
  stock_quantity: number;
  product_colors: ProductColor[];
};

type ProductSummary = { id: string; slug: string; name: string; price: number; images: string[]; stock_quantity: number };

export function AddToCartDrawer({
  product,
  open,
  onOpenChange,
}: {
  product: ProductSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);

  const { data, isLoading } = useQuery({
    queryKey: ["product-detail", product.slug],
    queryFn: async () => {
      const res = await fetch(`/api/products/${product.slug}`);
      return (await res.json()) as ProductDetail;
    },
    enabled: open,
    staleTime: 60_000,
  });

  const colors = useMemo(
    () =>
      (data?.product_colors ?? []).map((c) => ({
        ...c,
        product_variants: c.product_variants.filter((v): v is SizeVariant & { size: string } => v.is_active && !!v.size),
      })),
    [data]
  );
  const hasColors = colors.length > 0;

  const [selectedColorId, setSelectedColorId] = useState<string | undefined>(undefined);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);

  // Reset selections each time the drawer opens for a (possibly different) product.
  useEffect(() => {
    if (!open) return;
    setSelectedColorId(undefined);
    setSelectedSize(undefined);
    setQty(1);
  }, [open, product.id]);

  useEffect(() => {
    if (colors.length && !selectedColorId) setSelectedColorId(colors[0].id);
  }, [colors, selectedColorId]);

  const selectedColor = colors.find((c) => c.id === selectedColorId);
  const sizes = selectedColor?.product_variants ?? [];

  useEffect(() => {
    setSelectedSize(sizes[0]?.size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColorId]);

  const selectedVariant = hasColors ? sizes.find((v) => v.size === selectedSize) : undefined;
  const maxQty = hasColors ? (selectedVariant?.stock_quantity ?? 0) : product.stock_quantity;
  const outOfStock = maxQty <= 0;

  const alreadyInCart = items.find((i) => i.productId === product.id && i.variantId === selectedVariant?.id)?.qty ?? 0;
  const availableToAdd = Math.max(0, Math.min(maxQty, MAX_QTY_PER_ITEM) - alreadyInCart);
  const maxedInCart = !outOfStock && availableToAdd <= 0;
  const ready = !hasColors || (!!selectedColorId && !!selectedSize);

  useEffect(() => {
    setQty((q) => (availableToAdd <= 0 ? 0 : Math.min(Math.max(q, 1), availableToAdd)));
  }, [availableToAdd]);

  function handleAdd() {
    if (!ready || availableToAdd <= 0 || qty < 1) return;
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
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{product.name}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          {isLoading && (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}

          {!isLoading && hasColors && (
            <>
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
                        <span className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive/90 px-1 text-[9px] leading-[14px] text-white">
                          {v.stock_quantity}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {!isLoading && (
            <div className="flex items-center gap-3">
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
              <span className="text-sm text-muted-foreground">
                {outOfStock ? "Немає в наявності" : maxedInCart ? "Максимум уже в кошику" : ""}
              </span>
            </div>
          )}
        </div>

        <SheetFooter>
          <Button size="lg" disabled={!ready || availableToAdd <= 0 || isLoading} onClick={handleAdd}>
            Додати · {formatMoney(product.price * qty)}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
