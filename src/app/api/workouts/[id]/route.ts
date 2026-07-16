import { getDbClient, getEffectiveUserId } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDbClient();
  const userId = await getEffectiveUserId();
  const body = await request.json();

  const { data, error } = await db
    .from("workout_sessions")
    .update({
      exercise: body.exercise,
      muscle_group: body.muscle_group,
      sets: body.sets,
      reps: body.reps,
      weight: body.weight ?? null,
      notes: body.notes ?? null,
      is_drop_set: body.is_drop_set ?? false,
      set_data: body.set_data ?? null,
    })
    .eq("id", params.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  const { error } = await db
    .from("workout_sessions")
    .delete()
    .eq("id", params.id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
