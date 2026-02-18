"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  NewListingItem,
  ListingsResponse,
} from "@/app/api/listings/route";

export type { NewListingItem };

export interface ListingFilters {
  exchange: "all" | "upbit" | "bithumb";
}

export const listingKeys = {
  all: ["listings"] as const,
  list: (f: ListingFilters) => ["listings", f.exchange] as const,
};

export function useListings(filters: ListingFilters, interval = 30_000) {
  return useQuery<ListingsResponse>({
    queryKey: listingKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams({
        exchange: filters.exchange,
        limit: "50",
      });
      const res = await fetch(`/api/listings?${params}`);
      if (!res.ok) throw new Error("Failed to fetch listings");
      return res.json();
    },
    refetchInterval: interval,
    staleTime: 15_000,
  });
}
