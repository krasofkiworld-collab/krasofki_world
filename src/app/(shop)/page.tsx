import { ProductGrid } from "@/components/shop/product-grid";
import { CategoryFilter } from "@/components/shop/category-filter";
import { BrandFilter } from "@/components/shop/brand-filter";
import { TagFilter } from "@/components/shop/tag-filter";
import { SearchAndSort } from "@/components/shop/search-and-sort";
import { HeroBanner } from "@/components/shop/hero-banner";
import { PAGE_SIZE } from "@/lib/products-query";
import { getCachedCategories, getCachedBrands, getCachedTags, getCachedProducts } from "@/lib/catalog-cache";

type SearchParams = Promise<{ category?: string; brand?: string; tag?: string; q?: string; sort?: string }>;

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  stock_quantity: number;
  brands: { name: string } | null;
};

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await searchParams;

  const [categories, brands, tags, { products, total }] = await Promise.all([
    getCachedCategories(),
    getCachedBrands(),
    getCachedTags(),
    getCachedProducts(filters, 0),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <HeroBanner storeName="Krosofki World" />
      <SearchAndSort />
      <CategoryFilter categories={categories} />
      <BrandFilter brands={brands} />
      <TagFilter tags={tags} />

      <ProductGrid
        initialProducts={products as unknown as Product[]}
        hasMore={PAGE_SIZE < total}
        filters={filters}
      />
    </div>
  );
}
