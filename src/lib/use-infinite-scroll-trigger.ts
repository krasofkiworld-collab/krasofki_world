import { useEffect, type RefObject } from "react";

/**
 * Fires `onLoadMore` when `sentinelRef`'s element approaches the viewport.
 *
 * Uses IntersectionObserver as the primary trigger, but backs it with a
 * plain scroll-position check — some WebViews (observed in headless
 * automation browsers, and plausible in low-power Telegram-embedded
 * WebViews) never fire IO callbacks, likely because they skip the
 * continuous compositor loop IO depends on when the surface isn't fully
 * "active". A single missed trigger silently caps how much of the catalog
 * a customer can ever see, so this can't rely on IO alone.
 */
export function useInfiniteScrollTrigger(
  sentinelRef: RefObject<HTMLElement | null>,
  hasMore: boolean,
  isLoading: boolean,
  onLoadMore: () => void
) {
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) onLoadMore();
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const rect = el!.getBoundingClientRect();
        if (rect.top < window.innerHeight + 600 && !isLoading) onLoadMore();
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // covers the sentinel already being on-screen at mount

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoading, onLoadMore]);
}
