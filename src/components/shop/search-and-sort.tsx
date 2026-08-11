"use client";

import { useState, useEffect, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const SORT_LABELS: Record<string, string> = {
  default: "Новинки",
  price_asc: "Дешевші",
  price_desc: "Дорожчі",
};

export function SearchAndSort() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (q) next.set("q", q);
      else next.delete("q");
      startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setSort(value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "default") next.delete("sort");
    else next.set("sort", value);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Пошук товарів..."
          className="pl-8"
        />
      </div>
      <Select defaultValue={params.get("sort") ?? "default"} onValueChange={setSort}>
        <SelectTrigger className="w-[130px]">
          <SelectValue>{(value: string) => SORT_LABELS[value] ?? SORT_LABELS.default}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Новинки</SelectItem>
          <SelectItem value="price_asc">Дешевші</SelectItem>
          <SelectItem value="price_desc">Дорожчі</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
