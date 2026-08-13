"use client";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Heart } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/stores/cart";
import { useFavorites } from "@/stores/favorites";
import { MAX_QTY_PER_ITEM } from "@/lib/constants";
import { hapticLight } from "./telegram-init";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  stock_quantity: number;
  brands?: { name: string } | null;
};

export function ProductCard({ product }: { product: Product }) {
  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const isFavorite = useFavorites((s) => s.isFavorite(product.id));
  const toggleFavorite = useFavorites((s) => s.toggle);
  const outOfStock = product.stock_quantity <= 0;
  // Quick-add only applies to variant-less products (variantId undefined).
  // Clamp against what's already in the cart, not just raw stock — otherwise
  // repeated clicks add past the real limit. Distinct from `outOfStock`
  // above: this can be true even when the product itself still has stock.
  const alreadyInCart =
    items.find((i) => i.productId === product.id && i.variantId === undefined)?.qty ?? 0;
  // Same reasoning as the purchase panel: cap at stock AND the fixed
  // per-order limit, whichever is stricter, so one buyer can't sweep the shelf.
  const maxedInCart = alreadyInCart >= Math.min(product.stock_quantity, MAX_QTY_PER_ITEM);
  const discountPct = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;

  return (
    <Card className="overflow-hidden py-0 gap-0 rounded-2xl">
      <div className="relative aspect-square bg-muted">
        <Link href={`/product/${product.slug}`} className="block size-full">
          {product.images[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, 300px"
              className="object-cover"
            />
          )}
        </Link>
        <button
          onClick={() => toggleFavorite(product.id)}
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/90 shadow-sm"
          aria-label="У обране"
        >
          <Heart className={cn("size-3.5", isFavorite ? "fill-destructive text-destructive" : "text-muted-foreground")} />
        </button>
        {outOfStock ? (
          <Badge variant="secondary" className="absolute left-2 top-2">
            Немає
          </Badge>
        ) : (
          discountPct > 0 && (
            <Badge className="absolute left-2 top-2 bg-destructive text-white hover:bg-destructive">
              -{discountPct}%
            </Badge>
          )
        )}
      </div>
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0">
          {product.brands && (
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{product.brands.name}</p>
          )}
          <Link href={`/product/${product.slug}`} className="line-clamp-2 text-sm font-medium">
            {product.name}
          </Link>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-semibold">{formatMoney(product.price)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-xs text-muted-foreground/70 line-through">
                {formatMoney(product.compare_at_price)}
              </span>
            )}
          </div>
        </div>
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full"
          disabled={outOfStock || maxedInCart}
          onClick={() => {
            add({ productId: product.id, name: product.name, price: product.price, image: product.images[0], qty: 1 });
            hapticLight();
            toast.success("Додано в кошик");
          }}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </Card>
  );
}
