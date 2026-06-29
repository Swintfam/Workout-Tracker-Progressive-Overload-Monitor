import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in browser/client components.
 * Uses anon key — safe to call client-side.
 * Manages auth session via localStorage + cookies automatically.
 */
export function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
