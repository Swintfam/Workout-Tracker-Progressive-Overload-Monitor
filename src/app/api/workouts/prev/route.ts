import { getDbClient, getEffectiveUserId } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/workouts/prev?exercise=<name>
 * Returns the most recent set logged for an exercise + the all-time weight PR.
 */
export async function GET(request: NextRequest) {
  const admin  = getDbClient();
  const userId = await getEffectiveUserId();
  const { searchParams } = new URL(request.url);
  const exercise = searchParams.get("exercise");

  if (!exercise) {
    return NextResponse.json({ error: "exercise param required" }, { status: 400 });
  }

  // Most recent entry for this exercise
  const { data: recent, error: e1 } = await admin
    .from("workout_sessions")
    .select("weight, reps, date")
    .eq("user_id", userId)
    .ilike("exercise", exercise)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });
  if (!recent) return NextResponse.json(null);

  // All-time best weight for this exercise
  const { data: pr, error: e2 } = await admin
    .from("workout_sessions")
    .select("weight, reps, date")
    .eq("user_id", userId)
    .ilike("exercise", exercise)
    .not("weight", "is", null)
    .order("weight", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  return NextResponse.json({
    weight:   recent.weight,
    reps:     recent.reps,
    date:     recent.date,
    pr_weight: pr?.weight ?? recent.weight,
    pr_reps:   pr?.reps   ?? recent.reps,
    pr_date:   pr?.date   ?? recent.date,
  });
}
