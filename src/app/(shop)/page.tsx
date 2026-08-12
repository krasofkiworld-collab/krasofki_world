import { createClient } from "@/lib/supabase/client";
import { ProductGrid } from "@/components/shop/product-grid";
import { CategoryFilter } from "@/components/shop/category-filter";
import { BrandFilter } from "@/components/shop/brand-filter";
import { TagFilter } from "@/components/shop/tag-filter";
import { SearchAndSort } from "@/components/shop/search-and-sort";
import { HeroBanner } from "@/components/shop/hero-banner";
import { buildProductsQuery, PAGE_SIZE } from "@/lib/products-query";

export const revalidate = 0;

type SearchParams = Promise<{ category?: string; brand?: string; tag?: string; q?: string; sort?: string }>;

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await searchParams;
  const supabase = createClient();

  const [{ data: categories }, { data: brands }, { data: tags }, { data, count }] = await Promise.all([
    supabase.from("categories").select("id, slug, name").eq("is_active", true).order("sort_order"),
    supabase.from("brands").select("id, slug, name, logo_url").eq("is_active", true).order("sort_order"),
    supabase.from("tags").select("id, slug, name").order("name"),
    buildProductsQuery(supabase, filters).range(0, PAGE_SIZE - 1),
  ]);

  const products = (data ?? []) as unknown as {
    id: string;
    slug: string;
    name: string;
    price: number;
    compare_at_price: number | null;
    images: string[];
    stock_quantity: number;
    brands: { name: string } | null;
  }[];

  return (
    <div className="flex flex-col gap-4">
      <HeroBanner storeName="Krosofki World" />
      <SearchAndSort />
      <CategoryFilter categories={categories ?? []} />
      <BrandFilter brands={brands ?? []} />
      <TagFilter tags={tags ?? []} />

      <ProductGrid
        initialProducts={products}
        hasMore={PAGE_SIZE < (count ?? 0)}
        filters={filters}
      />
    </div>
  );
}
