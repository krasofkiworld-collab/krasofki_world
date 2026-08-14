import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ProductCard } from "./product-card";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  stock_quantity: number;
  sku: string | null;
  brands: { name: string } | null;
};

export function RelatedProducts({ products, title = "Схожі товари" }: { products: Product[]; title?: string }) {
  if (!products.length) return null;

  return (
    <div className="flex flex-col gap-3 pb-4">
      <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2">
          {products.map((p) => (
            <div key={p.id} className="w-40 shrink-0">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
