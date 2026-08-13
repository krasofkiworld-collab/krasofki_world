"use client";

import { Heart, Plus } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

type PreviewData = {
  name: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  brandName?: string;
  description?: string;
};

/** Mimics one card exactly as it'll look on the storefront catalog. */
export function CatalogGridPreview({ data }: { data: PreviewData }) {
  const discountPct = data.compareAtPrice
    ? Math.round((1 - data.price / data.compareAtPrice) * 100)
    : 0;
  const cover = data.images[0];

  return (
    <div className="w-full max-w-[160px] overflow-hidden rounded-2xl border bg-card">
      <div className="relative aspect-square bg-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- mix of blob: previews and remote URLs
          <img src={cover} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            Немає фото
          </div>
        )}
        <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-background/90">
          <Heart className="size-3 text-muted-foreground" />
        </span>
        {discountPct > 0 && (
          <Badge className="absolute left-2 top-2 bg-destructive text-white hover:bg-destructive">
            -{discountPct}%
          </Badge>
        )}
      </div>
      <div className="flex items-start justify-between gap-2 p-2.5">
        <div className="min-w-0">
          {data.brandName && (
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{data.brandName}</p>
          )}
          <p className="line-clamp-2 text-xs font-medium">{data.name || "Назва товару"}</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-xs font-semibold">{formatMoney(data.price || 0)}</span>
            {!!data.compareAtPrice && data.compareAtPrice > data.price && (
              <span className="text-[10px] text-muted-foreground/70 line-through">
                {formatMoney(data.compareAtPrice)}
              </span>
            )}
          </div>
        </div>
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary">
          <Plus className="size-3" />
        </span>
      </div>
    </div>
  );
}

/** Mimics the storefront product-detail page — gallery + title/price. */
export function ProductDetailPreview({ data }: { data: PreviewData }) {
  const cover = data.images[0];

  return (
    <div className="flex w-full max-w-[280px] flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- mix of blob: previews and remote URLs
          <img src={cover} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            Немає фото
          </div>
        )}
        {data.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {data.images.map((_, i) => (
              <span key={i} className={i === 0 ? "h-1 w-3 rounded-full bg-white" : "size-1 rounded-full bg-white/50"} />
            ))}
          </div>
        )}
      </div>
      <div>
        {data.brandName && (
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{data.brandName}</p>
        )}
        <p className="text-sm font-semibold">{data.name || "Назва товару"}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-bold">{formatMoney(data.price || 0)}</span>
          {!!data.compareAtPrice && data.compareAtPrice > data.price && (
            <span className="text-xs text-muted-foreground/70 line-through">{formatMoney(data.compareAtPrice)}</span>
          )}
        </div>
      </div>
      {data.description && <p className="line-clamp-4 text-xs text-muted-foreground">{data.description}</p>}
    </div>
  );
}
