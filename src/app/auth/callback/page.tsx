"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

function CallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const next = searchParams.get("next") ?? "/";

    async function handleCallback() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = next;
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          window.location.href = next;
          return;
        }
      }

      window.location.href = "/auth/sign-in?error=callback_failed";
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
