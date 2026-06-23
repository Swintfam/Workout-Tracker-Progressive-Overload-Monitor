import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase admin client — uses the service role key to bypass RLS.
 * Dev only. Server-side only. Never import this in client components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Server-side Supabase client that carries the user's session cookies.
 * auth.uid() = user's ID in Postgres — works with RLS policies.
 * Used in production so the user JWT flows through to Supabase.
 */
export function createAuthClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}

/**
 * Returns the right DB client for the current environment:
 * - Production: auth client (user session + RLS policies enforce row-level access)
 * - Dev: admin client (service role bypasses RLS; uses DEV_USER_ID)
 */
export function getDbClient() {
  return process.env.NODE_ENV === "production"
    ? createAuthClient()
    : createAdminClient();
}

/**
 * Returns the authenticated user's ID.
 * - Local dev: returns DEV_USER_ID from .env.local
 * - Production: returns the ID from the active Supabase auth session
 */
export async function getEffectiveUserId(): Promise<string> {
  if (process.env.NODE_ENV !== "production") {
    const devId = process.env.DEV_USER_ID;
    if (!devId) throw new Error("DEV_USER_ID not set in .env.local");
    return devId;
  }

  const {
    data: { user },
  } = await createAuthClient().auth.getUser();

  if (!user) throw new Error("Not authenticated");
  return user.id;
}
