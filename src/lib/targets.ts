import { createAdminClient, getEffectiveUserId } from "@/lib/supabase/admin";

export interface UserTargets {
  user_id: string;
  display_name: string | null;
  abs_weekly_reps: number;
  pull_weekly_reps: number;
  push_weekly_reps: number;
  legs_weekly_reps: number;
  onboarding_complete: boolean;
}

export async function getUserTargets(): Promise<UserTargets | null> {
  const db = createAdminClient();
  const userId = await getEffectiveUserId();

  const { data } = await db
    .from("user_targets")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return data ?? null;
}

export async function upsertUserTargets(patch: {
  display_name?: string;
  abs_weekly_reps?: number;
  pull_weekly_reps?: number;
  push_weekly_reps?: number;
  legs_weekly_reps?: number;
  onboarding_complete?: boolean;
}): Promise<void> {
  const db = createAdminClient();
  const userId = await getEffectiveUserId();

  await db.from("user_targets").upsert({
    user_id: userId,
    ...patch,
    updated_at: new Date().toISOString(),
  });
}

/** Rep targets as a Record keyed by muscle group name, with fallback defaults. */
export async function getRepTargets(): Promise<Record<string, number>> {
  const targets = await getUserTargets();
  return {
    Abs: targets?.abs_weekly_reps ?? 0,
    Pull: targets?.pull_weekly_reps ?? 0,
    Push: targets?.push_weekly_reps ?? 0,
    Legs: targets?.legs_weekly_reps ?? 0,
  };
}
