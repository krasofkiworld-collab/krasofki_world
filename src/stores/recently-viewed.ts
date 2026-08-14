import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RecentlyViewedProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  // Snapshot at view-time — may drift from live stock, same tradeoff every
  // "recently viewed" widget makes rather than re-fetching on every render.
  stock_quantity: number;
};

const MAX_ITEMS = 12;

type RecentlyViewedState = {
  items: RecentlyViewedProduct[];
  add: (product: RecentlyViewedProduct) => void;
};

export const useRecentlyViewed = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      add: (product) =>
        set((state) => ({
          // Newest first, deduped, capped — a re-view of the same product
          // just bumps it back to the front instead of duplicating.
          items: [product, ...state.items.filter((p) => p.id !== product.id)].slice(0, MAX_ITEMS),
        })),
    }),
    // Same skipHydration reasoning as favorites/cart — see store-hydrator.tsx.
    { name: "krosofki-recently-viewed", skipHydration: true }
  )
);
