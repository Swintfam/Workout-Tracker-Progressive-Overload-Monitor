"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App] unhandled error:", error.message, error.digest);
  }, [error]);

  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <p className="text-lg font-semibold text-foreground">Something went wrong.</p>
      <p className="max-w-xs text-sm text-muted">
        {error.digest ? `Ref: ${error.digest}` : error.message}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-background hover:bg-accent-dark"
        >
          Try again
        </button>
        <button
          onClick={() => router.push("/")}
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
        >
          Go home
        </button>
      </div>
    </div>
  );
}
