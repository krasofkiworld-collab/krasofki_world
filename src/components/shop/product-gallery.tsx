"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Heart } from "lucide-react";
import { useFavorites } from "@/stores/favorites";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
  productId,
  focusUrl,
}: {
  images: string[];
  name: string;
  productId: string;
  /** When set to an URL present in `images`, the carousel scrolls there (e.g. a color swatch's own photo). */
  focusUrl?: string | null;
}) {
  const [active, setActive] = useState(0);
  const isFavorite = useFavorites((s) => s.isFavorite(productId));
  const toggleFavorite = useFavorites((s) => s.toggle);
  const shown = images;
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollToIndex(i: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  }

  useEffect(() => {
    if (!focusUrl) return;
    const i = shown.indexOf(focusUrl);
    if (i >= 0) {
      setActive(i);
      scrollToIndex(i);
    }
    // only re-run when the requested focus target changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusUrl]);

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    setActive((prev) => (prev === i ? prev : i));
  }

  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {shown.length ? (
          shown.map((src, i) => (
            <div key={src + i} className="relative h-full w-full flex-none snap-center">
              <Image src={src} alt={name} fill priority={i === 0} className="object-cover" />
            </div>
          ))
        ) : (
          <div className="h-full w-full flex-none" />
        )}
      </div>

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
              onClick={() => {
                setActive(i);
                scrollToIndex(i);
              }}
              aria-label={`Зображення ${i + 1}`}
              className={cn("size-1.5 rounded-full transition-all", i === active ? "w-4 bg-white" : "bg-white/50")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
