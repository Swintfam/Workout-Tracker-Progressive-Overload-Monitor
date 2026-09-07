import { getDbClient, getEffectiveUserId } from "@/lib/supabase/admin";
import { EXERCISE_LIBRARY } from "@/lib/exercises";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const muscle = searchParams.get("muscle") ?? "";
  const from   = searchParams.get("from")   ?? "";
  const to     = searchParams.get("to")     ?? "";

  if (!muscle || !from || !to) {
    return NextResponse.json({ error: "muscle, from, to required" }, { status: 400 });
  }

  // Find all exercise names whose primaryMuscles or secondaryMuscles include this muscle
  const matchingNames = EXERCISE_LIBRARY
    .filter(e =>
      (e.primaryMuscles as string[]).some(
        m => m.toLowerCase() === muscle.toLowerCase()
      ) ||
      (e.secondaryMuscles as string[]).some(
        m => m.toLowerCase() === muscle.toLowerCase()
      )
    )
    .map(e => e.name);

  if (matchingNames.length === 0) {
    return NextResponse.json({});
  }

  const admin  = getDbClient();
  const userId = await getEffectiveUserId();

  const { data, error } = await admin
    .from("workout_sessions")
    .select("date, exercise, sets, reps, weight, set_data, is_drop_set")
    .eq("user_id", userId)
    .in("exercise", matchingNames)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group rows by date
  type Row = NonNullable<typeof data>[number];
  const grouped: Record<string, Row[]> = {};
  for (const row of data ?? []) {
    if (!grouped[row.date]) grouped[row.date] = [];
    grouped[row.date].push(row);
  }

  return NextResponse.json(grouped);
}
