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
          className="flex shrink-0 flex-col items-center gap-1 px-1 py-2 text-xs"
        >
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-full text-[10px] font-medium",
              !active ? "bg-transparent ring-2 ring-foreground text-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            Усі
          </span>
        </Link>
        {brands.map((b) => (
          <Link
            key={b.id}
            href={buildHref(pathname, params, { brand: active === b.slug ? null : b.slug })}
            className="flex shrink-0 flex-col items-center gap-1 px-1 py-2 text-xs"
          >
            <span
              className={cn(
                "relative flex size-11 items-center justify-center overflow-hidden rounded-full",
                active === b.slug ? "bg-transparent ring-2 ring-foreground" : "bg-muted"
              )}
            >
              {b.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin-entered, arbitrary external domain
                <img src={b.logo_url} alt={b.name} className="size-full object-cover" />
              ) : (
                <span className={cn("text-[10px] font-medium", active === b.slug ? "text-foreground" : "text-muted-foreground")}>
                  {b.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </span>
            <span className={active === b.slug ? "text-foreground" : "text-muted-foreground"}>{b.name}</span>
          </Link>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
