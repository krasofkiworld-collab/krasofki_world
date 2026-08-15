import { create } from "zustand";
import { persist } from "zustand/middleware";

type FavoritesState = {
  productIds: string[];
  toggle: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
};

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),
      isFavorite: (productId) => get().productIds.includes(productId),
    }),
    // skipHydration: the store must start at its SSR-matching default ([])
    // on the client too, or React's hydration diff breaks the moment a page
    // reads persisted state (e.g. the favorites heart icon) before React
    // finishes reconciling. StoreHydrator triggers the actual localStorage
    // read right after mount, once hydration is safe.
    { name: "krasofki-favorites", skipHydration: true }
  )
);
