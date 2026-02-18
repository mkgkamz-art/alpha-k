"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface LoginPromptModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export function LoginPromptModal({
  open,
  onClose,
  message = "Sign in to access this feature",
}: LoginPromptModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm bg-bg-secondary border border-border-default rounded-lg shadow-lg"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-accent-primary flex items-center justify-center">
                <span className="text-bg-primary font-bold text-xs">B</span>
              </div>
              <span className="text-sm font-bold text-text-primary">
                BLOSAFE
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-5 flex flex-col gap-4">
            <p className="text-sm text-text-primary text-center">
              {message}
            </p>

            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-11 bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 font-medium"
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin mr-2" />
              ) : (
                <GoogleIcon className="size-5 mr-2" />
              )}
              Continue with Google
            </Button>

            <button
              onClick={onClose}
              className="text-xs text-text-disabled hover:text-text-secondary transition-colors text-center"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
