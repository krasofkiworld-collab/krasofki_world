"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductPurchasePanel } from "@/components/shop/product-purchase-panel";
import { useRecentlyViewed } from "@/stores/recently-viewed";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  images: string[];
  stock_quantity: number;
  brands: { name: string } | null;
  product_tags: { tags: { name: string } | null }[];
  product_colors: {
    id: string;
    name: string;
    hex: string | null;
    image_url: string | null;
    sort_order: number;
    product_variants: { id: string; size: string | null; stock_quantity: number; is_active: boolean }[];
  }[];
};

export function ProductDetail({ product }: { product: Product }) {
  // Only sizes with a non-null label are sellable — DB allows null while a variant row is mid-edit in the admin.
  // Memoized so the array/object identities stay stable across re-renders
  // (e.g. focusUrl updates) — the gallery's carousel-setup effect depends
  // on `images` by reference and would re-fire on every render otherwise.
  const colors = useMemo(
    () =>
      (product.product_colors ?? []).map((c) => ({
        ...c,
        product_variants: c.product_variants.filter((v): v is typeof v & { size: string } => v.size != null),
      })),
    [product]
  );
  const tags = (product.product_tags ?? []).map((pt) => pt.tags?.name).filter((n): n is string => !!n);

  // The gallery shows the product's own photos plus every color's own photo
  // (deduped) so selecting a color can jump straight to its picture without
  // needing a second image source.
  const galleryImages = useMemo(
    () => [...new Set([...product.images, ...colors.map((c) => c.image_url).filter((u): u is string => !!u)])],
    [product, colors]
  );

  const [focusUrl, setFocusUrl] = useState<string | null>(null);

  const addRecentlyViewed = useRecentlyViewed((s) => s.add);
  useEffect(() => {
    addRecentlyViewed(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  return (
    <div className="flex flex-col gap-4 pb-4">
      <ProductGallery images={galleryImages} name={product.name} productId={product.id} focusUrl={focusUrl} />

      <div>
        {product.brands && (
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.brands.name}</p>
        )}
        <h2 className="font-heading text-xl font-semibold tracking-tight">{product.name}</h2>
        <div className="mt-1.5 flex items-center gap-2.5">
          <span className="text-lg font-bold">{formatMoney(product.price)}</span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatMoney(product.compare_at_price)}
            </span>
          )}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Badge key={t} variant="secondary">
              #{t}
            </Badge>
          ))}
        </div>
      )}

      {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}

      <ProductPurchasePanel product={product} colors={colors} onColorSelect={(c) => setFocusUrl(c?.image_url ?? null)} />
    </div>
  );
}
