import { create } from "zustand";
import type { SubscriptionTier, SubscriptionStatus } from "@/types";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  avatarUrl?: string | null;
}

interface AuthStore {
  /** Current authenticated user (null = not logged in) */
  user: AuthUser | null;
  /** Loading state during auth check */
  loading: boolean;

  /** Current tier: 'free' | 'pro' | 'whale' | null (unauthenticated) */
  tier: SubscriptionTier | null;
  /** true if Pro or Whale */
  isPro: boolean;
  /** true if Whale only */
  isWhale: boolean;
  /** true if currently on trial */
  isOnTrial: boolean;
  /** subscription status */
  subscriptionStatus: SubscriptionStatus | null;

  /** Set user on login / session restore */
  setUser: (user: AuthUser | null) => void;
  /** Update subscription tier (after purchase / downgrade) */
  setSubscription: (tier: SubscriptionTier) => void;
  /** Clear auth state on logout */
  logout: () => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
}

function deriveTier(user: AuthUser | null) {
  if (!user)
    return {
      tier: null as SubscriptionTier | null,
      isPro: false,
      isWhale: false,
      isOnTrial: false,
      subscriptionStatus: null as SubscriptionStatus | null,
    };
  const t = user.subscriptionTier ?? "free";
  return {
    tier: t,
    isPro: t === "pro" || t === "whale",
    isWhale: t === "whale",
    isOnTrial: user.subscriptionStatus === "trialing",
    subscriptionStatus: user.subscriptionStatus ?? "free",
  };
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  tier: null,
  isPro: false,
  isWhale: false,
  isOnTrial: false,
  subscriptionStatus: null,
  setUser: (user) => set({ user, loading: false, ...deriveTier(user) }),
  setSubscription: (tier) =>
    set((state) => {
      const updated = state.user ? { ...state.user, subscriptionTier: tier } : null;
      return { user: updated, ...deriveTier(updated) };
    }),
  logout: () =>
    set({
      user: null,
      loading: false,
      tier: null,
      isPro: false,
      isWhale: false,
      isOnTrial: false,
      subscriptionStatus: null,
    }),
  setLoading: (loading) => set({ loading }),
}));
