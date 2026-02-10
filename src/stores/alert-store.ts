import { create } from "zustand";
import type { AlertType } from "@/types";

interface AlertFilterState {
  activeFilter: AlertType | "all";
  setFilter: (filter: AlertType | "all") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useAlertStore = create<AlertFilterState>((set) => ({
  activeFilter: "all",
  setFilter: (activeFilter) => set({ activeFilter }),
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
