"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";

interface UserMenuProps {
  collapsed?: boolean;
}

export function UserMenu({ collapsed = false }: UserMenuProps) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (!user) return null;

  return (
    <div ref={menuRef} className="relative">
      <UserButton user={user} collapsed={collapsed} onClick={() => setOpen(!open)} />
      {open && (
        <UserDropdown
          user={user}
          onClose={() => setOpen(false)}
          position={collapsed ? "right" : "top"}
        />
      )}
    </div>
  );
}

/* ── Trigger button ── */
function UserButton({
  user,
  collapsed,
  onClick,
}: {
  user: AuthUser;
  collapsed: boolean;
  onClick: () => void;
}) {
  const initials = getInitials(user);

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 w-full p-2 rounded-md hover:bg-bg-secondary transition-colors",
        collapsed && "justify-center"
      )}
      aria-label="User menu"
      aria-haspopup="true"
    >
      <Avatar user={user} size={32} initials={initials} />
      {!collapsed && (
        <>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[13px] font-medium text-text-primary truncate">
              {user.displayName ?? user.email}
            </p>
            <p className="text-[11px] text-text-secondary truncate">
              {user.subscriptionTier === "whale"
                ? "Whale Plan"
                : user.subscriptionTier === "pro"
                  ? "Pro Plan"
                  : "Free Plan"}
            </p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-text-disabled shrink-0" />
        </>
      )}
    </button>
  );
}

/* ── Dropdown ── */
function UserDropdown({
  user,
  onClose,
  position,
}: {
  user: AuthUser;
  onClose: () => void;
  position: "top" | "right";
}) {
  const router = useRouter();
  const initials = getInitials(user);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAuthStore.getState().logout();
    onClose();
    router.push("/login");
    router.refresh();
  };

  return (
    <div
      className={cn(
        "absolute z-50 w-56 bg-bg-secondary border border-border-default rounded-lg shadow-lg overflow-hidden",
        position === "top" && "bottom-full left-0 mb-2",
        position === "right" && "left-full bottom-0 ml-2"
      )}
      role="menu"
    >
      {/* User info header */}
      <div className="px-3 py-3 border-b border-border-default">
        <div className="flex items-center gap-2.5">
          <Avatar user={user} size={36} initials={initials} />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-text-primary truncate">
              {user.displayName ?? user.email}
            </p>
            <p className="text-[11px] text-text-secondary truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="py-1">
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
          role="menuitem"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-signal-danger hover:bg-bg-tertiary transition-colors"
          role="menuitem"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </div>
  );
}

/* ── Avatar helper ── */
function Avatar({
  user,
  size,
  initials,
}: {
  user: AuthUser;
  size: number;
  initials: string;
}) {
  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={user.displayName ?? "User avatar"}
        width={size}
        height={size}
        className="rounded-full shrink-0 object-cover"
      />
    );
  }

  return (
    <div
      className="rounded-full bg-accent-secondary/20 flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="text-[12px] font-bold text-accent-secondary">
        {initials}
      </span>
    </div>
  );
}

/* ── Utils ── */
function getInitials(user: AuthUser): string {
  if (user.displayName) {
    return user.displayName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return user.email ? user.email[0].toUpperCase() : "?";
}
