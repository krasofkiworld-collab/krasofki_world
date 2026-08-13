"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const isFavorite = useFavorites((s) => s.isFavorite(productId));
  const toggleFavorite = useFavorites((s) => s.toggle);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // With 2+ photos the carousel loops: a clone of the last photo is
  // prepended and a clone of the first is appended, so scrolling past
  // either end keeps going instead of hitting a wall. Once a clone settles
  // into view we silently re-center on the real slide it stands in for.
  const loop = images.length > 1;
  const loopImages = useMemo(
    () => (loop ? [images[images.length - 1], ...images, images[0]] : images),
    [images, loop]
  );

  const [loopIndex, setLoopIndex] = useState(loop ? 1 : 0);
  const activeIndex = loop ? (loopIndex - 1 + images.length) % images.length : 0;

  function scrollToLoopIndex(i: number, behavior: ScrollBehavior = "smooth") {
    slideRefs.current[i]?.scrollIntoView({ behavior, inline: "center", block: "nearest" });
  }

  useEffect(() => {
    setLoopIndex(loop ? 1 : 0);
    scrollToLoopIndex(loop ? 1 : 0, "instant");
    // only re-run when the image set itself changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  useEffect(() => {
    if (!focusUrl) return;
    const i = images.indexOf(focusUrl);
    if (i < 0) return;
    const target = loop ? i + 1 : i;
    setLoopIndex(target);
    scrollToLoopIndex(target);
    // only re-run when the requested focus target changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusUrl]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !loop) return;

    let settleTimer: ReturnType<typeof setTimeout>;
    function handleScroll() {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        if (!track) return;
        const center = track.getBoundingClientRect().left + track.clientWidth / 2;
        let closest = 0;
        let closestDist = Infinity;
        slideRefs.current.forEach((el, i) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const dist = Math.abs(rect.left + rect.width / 2 - center);
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        });

        if (closest === 0) {
          scrollToLoopIndex(images.length, "instant");
          setLoopIndex(images.length);
        } else if (closest === loopImages.length - 1) {
          scrollToLoopIndex(1, "instant");
          setLoopIndex(1);
        } else {
          setLoopIndex(closest);
        }
      }, 120);
    }

    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", handleScroll);
      clearTimeout(settleTimer);
    };
  }, [loop, images.length, loopImages.length]);

  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
      <div
        ref={trackRef}
        className="flex h-full snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loopImages.length ? (
          loopImages.map((src, i) => (
            <div
              key={i}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className={cn(
                "relative h-full shrink-0 snap-center overflow-hidden rounded-2xl bg-muted",
                loop ? "w-[82%]" : "w-full"
              )}
            >
              <Image src={src} alt={name} fill priority={i === (loop ? 1 : 0)} className="object-cover" />
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

      {images.length > 1 && (
        // Dark pill behind the dots — plain white dots disappear against a light photo otherwise.
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/35 px-2.5 py-1.5 backdrop-blur-sm">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const target = loop ? i + 1 : i;
                setLoopIndex(target);
                scrollToLoopIndex(target);
              }}
              aria-label={`Зображення ${i + 1}`}
              className={cn("size-1.5 rounded-full transition-all", i === activeIndex ? "w-4 bg-white" : "bg-white/50")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
