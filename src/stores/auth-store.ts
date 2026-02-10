import { create } from "zustand";
import type { SubscriptionTier } from "@/types";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  subscriptionTier: SubscriptionTier;
  avatarUrl?: string | null;
}

interface AuthStore {
  /** Current authenticated user (null = not logged in) */
  user: AuthUser | null;
  /** Loading state during auth check */
  loading: boolean;
  /** Set user on login / session restore */
  setUser: (user: AuthUser | null) => void;
  /** Update subscription tier (after purchase / downgrade) */
  setSubscription: (tier: SubscriptionTier) => void;
  /** Clear auth state on logout */
  logout: () => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setSubscription: (tier) =>
    set((state) => ({
      user: state.user ? { ...state.user, subscriptionTier: tier } : null,
    })),
  logout: () => set({ user: null, loading: false }),
  setLoading: (loading) => set({ loading }),
}));
