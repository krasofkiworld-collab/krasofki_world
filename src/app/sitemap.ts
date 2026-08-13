import type { MetadataRoute } from "next";
import { supabaseServer } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

const STATIC_ROUTES = ["", "/about", "/faq", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products } = await supabaseServer
    .from("products")
    .select("slug, updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(5000);

  const staticEntries = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: (path === "" ? "daily" : "monthly") as "daily" | "monthly",
    priority: path === "" ? 1 : 0.5,
  }));

  const productEntries = (products ?? []).map((p) => ({
    url: `${SITE_URL}/product/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...productEntries];
}
