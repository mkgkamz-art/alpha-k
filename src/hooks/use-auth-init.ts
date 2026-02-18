"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { AuthUser } from "@/stores/auth-store";
import type { SubscriptionTier } from "@/types";
import type { User } from "@supabase/supabase-js";

/**
 * Maps a Supabase User to our AuthUser shape.
 * Handles Google OAuth metadata: full_name, avatar_url, etc.
 */
function mapUser(u: User): AuthUser {
  const meta = u.user_metadata ?? {};

  return {
    id: u.id,
    email: u.email ?? "",
    displayName: meta.full_name ?? meta.display_name ?? meta.name ?? u.email ?? null,
    subscriptionTier: (meta.subscription_tier as SubscriptionTier) ?? "free",
    avatarUrl: meta.avatar_url ?? meta.picture ?? null,
  };
}

/**
 * Initializes auth state from Supabase session.
 * Call once in a root client layout (e.g. DashboardLayout).
 *
 * - Checks current session on mount
 * - Listens for onAuthStateChange (login / logout / token refresh)
 * - Syncs user → Zustand auth store
 */
export function useAuthInit() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const supabase = createClient();

    // 1. Check existing session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ? mapUser(user) : null);
    });

    // 2. Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapUser(session.user) : null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);
}
