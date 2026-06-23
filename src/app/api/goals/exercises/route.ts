import { getDistinctExerciseNames } from "@/lib/goals";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const exercises = await getDistinctExerciseNames();
    return NextResponse.json(exercises);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
