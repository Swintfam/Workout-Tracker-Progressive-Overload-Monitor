import { createAdminClient, createAuthClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const result: Record<string, unknown> = {};

  // 1. Can we read the user from the auth client?
  try {
    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.getUser();
    result.auth_user_id = data?.user?.id ?? null;
    result.auth_error = error?.message ?? null;
  } catch (e) {
    result.auth_exception = e instanceof Error ? e.message : String(e);
  }

  // 2. Can the admin client read the user_targets row?
  try {
    const db = createAdminClient();
    const userId = result.auth_user_id as string | null;

    if (userId) {
      const { data, error } = await db
        .from("user_targets")
        .select("user_id, display_name, onboarding_complete")
        .eq("user_id", userId)
        .maybeSingle();
      result.targets_row = data;
      result.targets_error = error?.message ?? null;
    } else {
      result.targets_row = "skipped — no user_id";
    }
  } catch (e) {
    result.targets_exception = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(result);
}
