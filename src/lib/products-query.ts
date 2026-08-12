import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export const PRODUCT_FIELDS =
  "id, slug, name, price, compare_at_price, images, stock_quantity, category_id, brand_id";
export const PAGE_SIZE = 24;

export type ProductFilters = {
  category?: string;
  brand?: string;
  tag?: string;
  q?: string;
  sort?: string;
};

/**
 * Shared between the catalog Server Component (first page, SSR) and
 * /api/products (every page after that via infinite scroll) — the PostgREST
 * !inner-join gotcha (see (shop)/page.tsx history) only needs documenting
 * once here.
 */
export function buildProductsQuery(supabase: SupabaseClient<Database>, filters: ProductFilters) {
  const { category, brand, tag, q, sort } = filters;

  const relations = [
    `categories${category ? "!inner" : ""}(slug)`,
    `brands${brand ? "!inner" : ""}(name${brand ? ", slug" : ""})`,
    ...(tag ? [`product_tags!inner(tags!inner(slug))`] : []),
  ];
  const select = `${PRODUCT_FIELDS}, ${relations.join(", ")}`;

  let query = supabase
    .from("products")
    // count: "exact" is fine at catalog scale (thousands of rows with an
    // index on is_active); switch to "estimated" if the table ever grows
    // past ~100k rows and the count itself becomes the bottleneck.
    .select(select, { count: "exact" })
    .eq("is_active", true);

  if (category) query = query.eq("categories.slug", category);
  if (brand) query = query.eq("brands.slug", brand);
  if (tag) query = query.eq("product_tags.tags.slug", tag);
  if (q) query = query.ilike("name", `%${q}%`);

  query = query
    .order(sort === "price_asc" || sort === "price_desc" ? "price" : "created_at", {
      ascending: sort !== "price_desc",
    })
    // Stable tiebreaker: without a secondary sort key, rows sharing the
    // same created_at/price can shuffle between pages as the table grows,
    // causing infinite scroll to skip or duplicate items.
    .order("id", { ascending: true });

  return query;
}
