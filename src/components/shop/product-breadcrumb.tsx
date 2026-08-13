import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function ProductBreadcrumb({ name }: { name: string }) {
  return (
    <nav aria-label="breadcrumb" className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
      <Link href="/" className="hover:text-foreground">
        Каталог
      </Link>
      <ChevronRight className="size-3" />
      <span className="line-clamp-1 text-foreground">{name}</span>
    </nav>
  );
}
