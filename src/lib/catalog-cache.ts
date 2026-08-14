import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/client";
import { buildProductsQuery, PAGE_SIZE, type ProductFilters } from "@/lib/products-query";

// ISR-style caching for the public catalog: these wrap the Supabase reads
// (not the page itself) so a cache hit skips the network round-trip to
// Supabase entirely. `revalidate` is the time-based fallback; the admin
// mutation routes call `revalidateTag(...)` on write so real edits show up
// immediately instead of waiting out the window.
const REVALIDATE_SECONDS = 60;

export const getCachedCategories = unstable_cache(
  async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("id, slug, name")
      .eq("is_active", true)
      .order("sort_order");
    return data ?? [];
  },
  ["catalog:categories"],
  { revalidate: REVALIDATE_SECONDS, tags: ["catalog:categories"] }
);

export const getCachedBrands = unstable_cache(
  async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("brands")
      .select("id, slug, name, logo_url")
      .eq("is_active", true)
      .order("sort_order");
    return data ?? [];
  },
  ["catalog:brands"],
  { revalidate: REVALIDATE_SECONDS, tags: ["catalog:brands"] }
);

export const getCachedTags = unstable_cache(
  async () => {
    const supabase = createClient();
    const { data } = await supabase.from("tags").select("id, slug, name").order("name");
    return data ?? [];
  },
  ["catalog:tags"],
  { revalidate: REVALIDATE_SECONDS, tags: ["catalog:tags"] }
);

export const getCachedProducts = unstable_cache(
  async (filters: ProductFilters, page: number) => {
    const supabase = createClient();
    const { data, count } = await buildProductsQuery(supabase, filters).range(
      page * PAGE_SIZE,
      page * PAGE_SIZE + PAGE_SIZE - 1
    );
    return { products: data ?? [], total: count ?? 0 };
  },
  ["catalog:products"],
  { revalidate: REVALIDATE_SECONDS, tags: ["catalog:products"] }
);

export const getCachedProductBySlug = unstable_cache(
  async (slug: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select(
        "id, slug, name, description, price, compare_at_price, images, stock_quantity, category_id, brands(name), product_tags(tags(name)), product_colors(id, name, hex, image_url, sort_order, product_variants(id, size, stock_quantity, is_active))"
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    return data ?? null;
  },
  ["catalog:product-by-slug"],
  { revalidate: REVALIDATE_SECONDS, tags: ["catalog:products"] }
);

// Same-category cross-sell strip on the product detail page. Deliberately
// simple (category match, newest first) rather than a real recommendation
// engine — good enough to surface *something* relevant without a
// behavioral-data pipeline this store doesn't have yet.
export const getCachedRelatedProducts = unstable_cache(
  async (categoryId: string | null, excludeProductId: string) => {
    if (!categoryId) return [];
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("id, slug, name, price, compare_at_price, images, stock_quantity, sku, brands(name)")
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .neq("id", excludeProductId)
      .order("created_at", { ascending: false })
      .limit(8);
    return data ?? [];
  },
  ["catalog:related-products"],
  { revalidate: REVALIDATE_SECONDS, tags: ["catalog:products"] }
);
