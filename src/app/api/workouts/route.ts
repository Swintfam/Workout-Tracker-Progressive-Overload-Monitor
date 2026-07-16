import { getDbClient, getEffectiveUserId } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const admin = getDbClient();
  const userId = await getEffectiveUserId();
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const admin = getDbClient();
  const userId = await getEffectiveUserId();
  const body = await request.json();
  const { session_type, date, duration_min, exercises } = body;

  const rows = exercises.map((ex: {
    exercise: string;
    muscle_group: string;
    sets: number;
    reps: number;
    weight?: number | null;
    notes?: string | null;
    is_drop_set?: boolean;
    set_data?: Array<{ set: number; reps: number; weight: number | null }> | null;
  }) => ({
    user_id: userId,
    session_type,
    date,
    duration_min: duration_min ?? null,
    exercise: ex.exercise,
    muscle_group: ex.muscle_group,
    sets: ex.sets,
    reps: ex.reps,
    weight: ex.weight ?? null,
    notes: ex.notes ?? null,
    is_drop_set: ex.is_drop_set ?? false,
    set_data: ex.set_data ?? null,
  }));

  const { data, error } = await admin
    .from("workout_sessions")
    .insert(rows)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
