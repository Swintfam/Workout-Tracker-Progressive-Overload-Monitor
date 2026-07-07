"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const next = searchParams.get("next") ?? "/";

    async function handleCallback() {
      // First check if session already exists (implicit flow)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace(next);
        router.refresh();
        return;
      }

      // Try PKCE code exchange
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace(next);
          router.refresh();
          return;
        }
      }

      router.replace("/auth/sign-in?error=callback_failed");
    }

    handleCallback();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1117]">
      <p className="text-sm text-white/40">Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#0f1117]">
        <p className="text-sm text-white/40">Signing you in…</p>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
