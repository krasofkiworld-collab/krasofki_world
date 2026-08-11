import { createClient } from "@/lib/supabase/client";
import { ProductCard } from "@/components/shop/product-card";
import { CategoryFilter } from "@/components/shop/category-filter";
import { BrandFilter } from "@/components/shop/brand-filter";
import { TagFilter } from "@/components/shop/tag-filter";
import { SearchAndSort } from "@/components/shop/search-and-sort";
import { HeroBanner } from "@/components/shop/hero-banner";

export const revalidate = 0;

type SearchParams = Promise<{ category?: string; brand?: string; tag?: string; q?: string; sort?: string }>;

const PRODUCT_FIELDS = "id, slug, name, price, compare_at_price, images, stock_quantity, category_id, brand_id";

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const { category, brand, tag, q, sort } = await searchParams;
  const supabase = createClient();

  const [{ data: categories }, { data: brands }, { data: tags }] = await Promise.all([
    supabase.from("categories").select("id, slug, name").eq("is_active", true).order("sort_order"),
    supabase.from("brands").select("id, slug, name, logo_url").eq("is_active", true).order("sort_order"),
    supabase.from("tags").select("id, slug, name").order("name"),
  ]);

  // PostgREST only filters on an embedded relation when the join is
  // `!inner` — a plain left join (`brands(name)`) lets `.eq("brands.slug", …)`
  // through as a no-op, silently returning every row. So the join for each
  // relation only becomes `!inner` when that filter is actually active;
  // otherwise it stays a plain left join so unfiltered products (no
  // category/brand/tag) still show up.
  const relations = [
    `categories${category ? "!inner" : ""}(slug)`,
    `brands${brand ? "!inner" : ""}(name${brand ? ", slug" : ""})`,
    ...(tag ? [`product_tags!inner(tags!inner(slug))`] : []),
  ];
  const select = `${PRODUCT_FIELDS}, ${relations.join(", ")}`;

  let query = supabase.from("products").select(select).eq("is_active", true);
  if (category) query = query.eq("categories.slug", category);
  if (brand) query = query.eq("brands.slug", brand);
  if (tag) query = query.eq("product_tags.tags.slug", tag);
  if (q) query = query.ilike("name", `%${q}%`);
  query = query.order(sort === "price_asc" || sort === "price_desc" ? "price" : "created_at", {
    ascending: sort !== "price_desc",
  });

  const { data } = await query;
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

      {!products.length ? (
        <p className="py-12 text-center text-muted-foreground">Товарів не знайдено.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
