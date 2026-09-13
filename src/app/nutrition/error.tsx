"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NutritionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Nutrition] page error:", error.message, error.digest);
  }, [error]);

  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <p className="text-lg font-semibold text-foreground">Something went wrong loading Nutrition.</p>
      <p className="text-sm text-muted">
        {error.digest ? `Error ref: ${error.digest}` : error.message}
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
