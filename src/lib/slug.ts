import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

// Ukrainian transliteration — close to the national standard, good enough
// for a readable URL slug (doesn't need to be perfectly reversible).
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
  з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", ъ: "",
};

export function slugify(input: string): string {
  const transliterated = input
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("");
  const slug = transliterated
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip latin accents (café -> cafe)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "item";
}

/** Slugifies `name` and appends -2, -3, ... until it's unique in `table`. */
export async function generateUniqueSlug(
  table: "products" | "categories" | "brands" | "tags",
  name: string
): Promise<string> {
  const base = slugify(name).slice(0, 80);
  let slug = base;
  let attempt = 2;
  for (;;) {
    const { data } = await supabaseServer.from(table).select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${attempt++}`;
  }
}
