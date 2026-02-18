"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "auth_failed"
      ? "Authentication failed. Please try again."
      : null
  );

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-100">
      <div className="text-center mb-8">
        {/* Logo */}
        <div className="flex justify-center mb-5">
          <div className="w-12 h-12 rounded-lg bg-accent-primary flex items-center justify-center">
            <span className="text-bg-primary font-bold text-xl">AK</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-text-primary">
          Alpha K 로그인
        </h1>
        <p className="text-sm text-text-secondary mt-2">
          한국 코인 시장이 움직이기 전에 알려준다
        </p>
      </div>

      <div className="bg-bg-secondary border border-border-default rounded-lg p-6 flex flex-col gap-5">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-signal-danger/10 border border-signal-danger/20">
            <AlertTriangle className="size-4 text-signal-danger shrink-0" />
            <p className="text-xs text-signal-danger">{error}</p>
          </div>
        )}

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
      </div>

      <p className="text-center text-[11px] text-text-disabled mt-6 leading-relaxed">
        By signing in, you agree to our{" "}
        <span className="text-text-secondary">Terms of Service</span> and{" "}
        <span className="text-text-secondary">Privacy Policy</span>
      </p>
    </div>
  );
}
