"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Heart } from "lucide-react";
import { useFavorites } from "@/stores/favorites";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name, productId }: { images: string[]; name: string; productId: string }) {
  const [active, setActive] = useState(0);
  const isFavorite = useFavorites((s) => s.isFavorite(productId));
  const toggleFavorite = useFavorites((s) => s.toggle);
  const shown = images.length ? images : [undefined];

  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
      {shown[active] && <Image src={shown[active]!} alt={name} fill priority className="object-cover" />}

      <Link
        href="/"
        className="absolute left-3 top-3 flex size-8 items-center justify-center rounded-full bg-background/90 shadow-sm"
      >
        <ChevronLeft className="size-4" />
      </Link>
      <button
        onClick={() => toggleFavorite(productId)}
        aria-label="У обране"
        className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-background/90 shadow-sm"
      >
        <Heart className={cn("size-4", isFavorite ? "fill-destructive text-destructive" : "text-muted-foreground")} />
      </button>

      {shown.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {shown.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Зображення ${i + 1}`}
              className={cn("size-1.5 rounded-full transition-all", i === active ? "w-4 bg-white" : "bg-white/50")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
