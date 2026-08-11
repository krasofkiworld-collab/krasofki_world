"use client";

import { useEffect } from "react";
import { useCart } from "@/stores/cart";
import { useFavorites } from "@/stores/favorites";

// Both stores use `skipHydration: true` so their SSR-matching default state
// ([]) is also what the client renders on the very first pass. Triggering
// the real localStorage read here, after mount, means it happens after
// React has already reconciled against the server HTML — no mismatch.
export function StoreHydrator() {
  useEffect(() => {
    useCart.persist.rehydrate();
    useFavorites.persist.rehydrate();
  }, []);

  return null;
}
