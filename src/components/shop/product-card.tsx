"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Heart, Copy } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/stores/cart";
import { useFavorites } from "@/stores/favorites";
import { MAX_QTY_PER_ITEM } from "@/lib/constants";
import { AddToCartDrawer } from "./add-to-cart-drawer";
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
  sku?: string | null;
  brands?: { name: string } | null;
};

export function ProductCard({ product }: { product: Product }) {
  const items = useCart((s) => s.items);
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  function copySku() {
    if (!product.sku) return;
    navigator.clipboard.writeText(product.sku);
    toast.success("Код товару скопійовано");
  }

  return (
    <Card className="overflow-hidden py-0 gap-0 rounded-2xl">
      <div className="relative aspect-square bg-white">
        <Link href={`/product/${product.slug}`} className="block size-full">
          {product.images[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, 300px"
              className="object-contain p-6"
            />
          )}
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          disabled={outOfStock || maxedInCart}
          className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/90 py-1 pl-1 pr-2.5 text-xs shadow-sm disabled:opacity-50"
        >
          <span className="flex size-5 items-center justify-center rounded-full border border-foreground/30">
            <Plus className="size-3" />
          </span>
          Додати
        </button>
        <button
          onClick={() => toggleFavorite(product.id)}
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/90 shadow-sm"
          aria-label="У обране"
        >
          <Heart className={cn("size-3.5", isFavorite ? "fill-destructive text-destructive" : "text-muted-foreground")} />
        </button>
        {outOfStock ? (
          <Badge variant="secondary" className="absolute left-2 bottom-2">
            Немає
          </Badge>
        ) : (
          discountPct > 0 && (
            <Badge className="absolute left-2 bottom-2 bg-destructive text-white hover:bg-destructive">
              -{discountPct}%
            </Badge>
          )
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        {product.brands && (
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{product.brands.name}</p>
        )}
        <Link href={`/product/${product.slug}`} className="line-clamp-2 text-sm font-bold uppercase leading-tight">
          {product.name}
        </Link>
        {product.sku && (
          <button onClick={copySku} className="flex w-fit items-center gap-1 text-xs text-muted-foreground">
            Код товару: {product.sku}
            <Copy className="size-3" />
          </button>
        )}
        <div className="flex items-baseline gap-2">
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-sm text-orange-500 line-through">{formatMoney(product.compare_at_price)}</span>
          )}
          <span className="font-bold">{formatMoney(product.price)}</span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          disabled={outOfStock || maxedInCart}
          className="mt-1 w-full rounded-lg bg-foreground py-2.5 text-xs font-semibold uppercase tracking-wide text-background disabled:opacity-50"
        >
          {outOfStock ? "Немає в наявності" : "Швидка покупка"}
        </button>
      </div>

      <AddToCartDrawer product={product} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </Card>
  );
}
