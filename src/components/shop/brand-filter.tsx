"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Brand = { id: string; slug: string; name: string; logo_url: string | null };

function buildHref(pathname: string, params: URLSearchParams, patch: Record<string, string | null>) {
  const next = new URLSearchParams(params.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) next.delete(key);
    else next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function BrandFilter({ brands }: { brands: Brand[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("brand");

  if (!brands.length) return null;

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-3 pb-2">
        <Link
          href={buildHref(pathname, params, { brand: null })}
          className={cn(
            "flex shrink-0 flex-col items-center gap-1 rounded-xl border px-3 py-2 text-xs",
            !active ? "border-primary bg-primary/5" : "border-transparent text-muted-foreground"
          )}
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
            Усі
          </span>
        </Link>
        {brands.map((b) => (
          <Link
            key={b.id}
            href={buildHref(pathname, params, { brand: active === b.slug ? null : b.slug })}
            className={cn(
              "flex shrink-0 flex-col items-center gap-1 rounded-xl border px-3 py-2 text-xs",
              active === b.slug ? "border-primary bg-primary/5" : "border-transparent text-muted-foreground"
            )}
          >
            <span className="relative size-8 overflow-hidden rounded-full bg-muted">
              {b.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element -- admin-entered, arbitrary external domain
                <img src={b.logo_url} alt={b.name} className="size-full object-cover" />
              )}
            </span>
            {b.name}
          </Link>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
