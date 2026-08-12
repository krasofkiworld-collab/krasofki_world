import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductPurchasePanel } from "@/components/shop/product-purchase-panel";
import { getCachedProductBySlug } from "@/lib/catalog-cache";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);

  if (!product) notFound();

  const variants = (product.product_variants ?? []).filter(
    (v): v is typeof v & { size: string } => v.is_active && !!v.size
  );
  const tags = (product.product_tags ?? []).map((pt) => pt.tags?.name).filter((n): n is string => !!n);

  return (
    <div className="flex flex-col gap-4 pb-4">
      <ProductGallery images={product.images} name={product.name} productId={product.id} />

      <div>
        {product.brands && (
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.brands.name}</p>
        )}
        <h2 className="text-xl font-semibold">{product.name}</h2>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-lg font-bold">{formatMoney(product.price)}</span>
          {product.compare_at_price && (
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

      <ProductPurchasePanel product={product} variants={variants} />
    </div>
  );
}
