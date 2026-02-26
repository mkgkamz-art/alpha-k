"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { AuthUser } from "@/stores/auth-store";
import type { SubscriptionTier, SubscriptionStatus } from "@/types";
import type { User } from "@supabase/supabase-js";

/**
 * Initializes auth state from Supabase session.
 * Call once in a root client layout (e.g. DashboardLayout).
 *
 * - Checks current session on mount
 * - Listens for onAuthStateChange (login / logout / token refresh)
 * - Fetches subscription state from users table (webhook keeps this in sync)
 * - Syncs user → Zustand auth store
 */
export function useAuthInit() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser(u: User | null) {
      if (!u) {
        setUser(null);
        return;
      }

      const meta = u.user_metadata ?? {};

      // Fetch subscription state from users table (webhook keeps this up-to-date)
      const { data: profile } = await supabase
        .from("users")
        .select("subscription_tier, subscription_status, trial_ends_at")
        .eq("id", u.id)
        .single();

      const authUser: AuthUser = {
        id: u.id,
        email: u.email ?? "",
        displayName:
          meta.full_name ?? meta.display_name ?? meta.name ?? u.email ?? null,
        subscriptionTier:
          (profile?.subscription_tier as SubscriptionTier) ?? "free",
        subscriptionStatus:
          (profile?.subscription_status as SubscriptionStatus) ?? "free",
        trialEndsAt: profile?.trial_ends_at ?? null,
        avatarUrl: meta.avatar_url ?? meta.picture ?? null,
      };

      setUser(authUser);
    }

    // 1. Check existing session
    supabase.auth.getUser().then(({ data: { user } }) => {
      loadUser(user);
    });

    // 2. Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);
}
