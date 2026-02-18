"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 bg-bg-primary text-text-primary">
      <div className="flex items-center justify-center size-14 rounded-full bg-signal-danger/10">
        <AlertTriangle className="size-7 text-signal-danger" />
      </div>
      <h2 className="text-lg font-bold">문제가 발생했습니다</h2>
      <p className="text-sm text-text-secondary text-center max-w-md">
        일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
      </p>
      {error.digest && (
        <p className="text-xs text-text-disabled font-mono">
          Error ID: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 transition-colors"
      >
        <RotateCcw className="size-4" />
        다시 시도
      </button>
    </div>
  );
}
