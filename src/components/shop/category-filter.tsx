"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Category = { id: string; slug: string; name: string };

function buildHref(pathname: string, params: URLSearchParams, patch: Record<string, string | null>) {
  const next = new URLSearchParams(params.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) next.delete(key);
    else next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function CategoryFilter({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("category");

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        <Link
          href={buildHref(pathname, params, { category: null })}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-sm",
            !active ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground"
          )}
        >
          Усі
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={buildHref(pathname, params, { category: c.slug })}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm",
              active === c.slug ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground"
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
