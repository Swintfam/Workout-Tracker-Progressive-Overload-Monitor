import { getDbClient, getEffectiveUserId } from "@/lib/supabase/admin";
import type { MuscleGroup } from "@/lib/workouts";

export type GoalType = "exercise_pr" | "muscle_volume" | "skill_hold";

export interface Goal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  exercise_name: string | null;
  muscle_group: MuscleGroup | null;
  target_value: number;
  target_date: string | null;
  status: "active" | "archived";
  created_at: string;
  archived_at: string | null;
}

export interface GoalWithProgress extends Goal {
  current_value: number;
  progress_pct: number;
}

export interface CreateGoalInput {
  goal_type: GoalType;
  exercise_name?: string;
  muscle_group?: MuscleGroup;
  target_value: number;
  target_date?: string | null;
}

/**
 * Computes current_value for a single goal, optionally bounded to a
 * point in time (`asOf`, YYYY-MM-DD) instead of "right now":
 * - exercise_pr: heaviest weight logged for that exact exercise name,
 *   up to and including `asOf` (or all-time if no asOf given).
 * - muscle_volume: sum of sets*reps*weight for that muscle group, logged
 *   between the goal's creation date and `asOf` (or now).
 */
async function computeCurrentValue(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  userId: string,
  goal: Goal,
  asOf?: string
): Promise<number> {
  if (goal.goal_type === "exercise_pr") {
    if (!goal.exercise_name) return 0;
    let query = db
      .from("workout_sessions")
      .select("weight")
      .eq("user_id", userId)
      .eq("exercise", goal.exercise_name);
    if (asOf) query = query.lte("date", asOf);
    const { data } = await query.order("weight", { ascending: false }).limit(1);
    return data?.[0]?.weight ?? 0;
  }

  if (goal.goal_type === "skill_hold") {
    // Current value = best (max) reps logged for this exercise, where reps = seconds held
    if (!goal.exercise_name) return 0;
    let query = db
      .from("workout_sessions")
      .select("reps")
      .eq("user_id", userId)
      .eq("exercise", goal.exercise_name);
    if (asOf) query = query.lte("date", asOf);
    const { data } = await query.order("reps", { ascending: false }).limit(1);
    return data?.[0]?.reps ?? 0;
  }

  if (goal.goal_type === "muscle_volume") {
    if (!goal.muscle_group) return 0;
    let query = db
      .from("workout_sessions")
      .select("sets, reps, weight")
      .eq("user_id", userId)
      .eq("muscle_group", goal.muscle_group)
      .gte("date", goal.created_at.split("T")[0]);
    if (asOf) query = query.lte("date", asOf);
    const { data } = await query;

    return (data ?? []).reduce(
      (sum: number, row: { sets: number; reps: number; weight: number | null }) =>
        sum + (row.sets ?? 0) * (row.reps ?? 0) * (row.weight ?? 1),
      0
    );
  }

  return 0;
}

export async function getActiveGoals(): Promise<GoalWithProgress[]> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  const { data: goals } = await db
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (!goals) return [];

  const withProgress = await Promise.all(
    goals.map(async (goal: Goal) => {
      const current_value = await computeCurrentValue(db, userId, goal);
      const progress_pct = goal.target_value > 0
        ? Math.min(100, Math.round((current_value / goal.target_value) * 100))
        : 0;
      return { ...goal, current_value, progress_pct };
    })
  );

  return withProgress;
}

/**
 * Creates a new goal. If an active goal already exists for the same
 * exercise_name (exercise_pr) or muscle_group (muscle_volume), it gets
 * archived first — the new goal replaces it as the active target.
 */
export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  let query = db
    .from("goals")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("goal_type", input.goal_type);

  if (input.goal_type === "exercise_pr" && input.exercise_name) {
    query = query.eq("exercise_name", input.exercise_name);
  } else if (input.goal_type === "muscle_volume" && input.muscle_group) {
    query = query.eq("muscle_group", input.muscle_group);
  }

  await query;

  const { data, error } = await db
    .from("goals")
    .insert({
      user_id: userId,
      goal_type: input.goal_type,
      exercise_name: input.exercise_name ?? null,
      muscle_group: input.muscle_group ?? null,
      target_value: input.target_value,
      target_date: input.target_date ?? null,
      status: "active",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateGoal(
  goalId: string,
  patch: { target_value?: number; target_date?: string | null }
): Promise<void> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();
  await db
    .from("goals")
    .update(patch)
    .eq("id", goalId)
    .eq("user_id", userId);
}

export async function archiveGoal(goalId: string): Promise<void> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  await db
    .from("goals")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", goalId);
}

/**
 * Reconstructs goal progress as it stood at the end of a past week.
 * Includes any goal that existed at that point in time — i.e. created
 * on or before `asOf`, and not yet archived as of `asOf` (goals are
 * never edited, only replaced-and-archived, so this is fully accurate).
 */
export async function getGoalProgressAsOf(asOf: string): Promise<GoalWithProgress[]> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  const { data: goals } = await db
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .lte("created_at", asOf + "T23:59:59")
    .or(`archived_at.is.null,archived_at.gt.${asOf}T23:59:59`)
    .order("created_at", { ascending: false });

  if (!goals) return [];

  const withProgress = await Promise.all(
    goals.map(async (goal: Goal) => {
      const current_value = await computeCurrentValue(db, userId, goal, asOf);
      const progress_pct = goal.target_value > 0
        ? Math.min(100, Math.round((current_value / goal.target_value) * 100))
        : 0;
      return { ...goal, current_value, progress_pct };
    })
  );

  return withProgress;
}

export async function getDistinctExerciseNames(): Promise<string[]> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  const { data } = await db
    .from("workout_sessions")
    .select("exercise")
    .eq("user_id", userId);

  const names = new Set((data ?? []).map((r: { exercise: string }) => r.exercise));
  return Array.from(names).sort();
}
