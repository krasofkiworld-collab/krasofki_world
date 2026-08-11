"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Tag = { id: string; slug: string; name: string };

export function TagFilter({ tags }: { tags: Tag[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("tag");

  if (!tags.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => {
        const next = new URLSearchParams(params.toString());
        const isActive = active === t.slug;
        if (isActive) next.delete("tag");
        else next.set("tag", t.slug);
        const qs = next.toString();

        return (
          <Link
            key={t.id}
            href={qs ? `${pathname}?${qs}` : pathname}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs",
              isActive ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            #{t.name}
          </Link>
        );
      })}
    </div>
  );
}
