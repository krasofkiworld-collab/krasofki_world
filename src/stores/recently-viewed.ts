import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_ITEMS = 12;

type RecentlyViewedState = {
  productIds: string[];
  add: (productId: string) => void;
};

// Stores IDs only, not a data snapshot — mirrors the favorites store. A
// snapshot would go stale the moment an admin edits the product (name,
// price, photo), which is exactly what happened here: photos added after
// the fact never showed up in already-saved "recently viewed" entries.
export const useRecentlyViewed = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      productIds: [],
      add: (productId) =>
        set((state) => ({
          // Newest first, deduped, capped — a re-view of the same product
          // just bumps it back to the front instead of duplicating.
          productIds: [productId, ...state.productIds.filter((id) => id !== productId)].slice(0, MAX_ITEMS),
        })),
    }),
    // Same skipHydration reasoning as favorites/cart — see store-hydrator.tsx.
    { name: "krosofki-recently-viewed", skipHydration: true }
  )
);
