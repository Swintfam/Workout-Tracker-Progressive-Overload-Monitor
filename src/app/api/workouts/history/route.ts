import { getDbClient, getEffectiveUserId } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/workouts/history?exercise=<name>&limit=10
 * Returns the last N sessions logged for an exercise, most recent first.
 */
export async function GET(request: NextRequest) {
  const admin  = getDbClient();
  const userId = await getEffectiveUserId();
  const { searchParams } = new URL(request.url);
  const exercise = searchParams.get("exercise");
  const limit    = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);

  if (!exercise) {
    return NextResponse.json({ error: "exercise param required" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("workout_sessions")
    .select("sets, reps, weight, is_drop_set, set_data, date")
    .eq("user_id", userId)
    .ilike("exercise", exercise)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
