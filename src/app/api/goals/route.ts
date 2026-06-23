import { getActiveGoals, createGoal } from "@/lib/goals";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const goals = await getActiveGoals();
    return NextResponse.json(goals);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goal_type, exercise_name, muscle_group, target_value, target_date } = body;

    if (!goal_type || !target_value) {
      return NextResponse.json(
        { error: "goal_type and target_value are required" },
        { status: 400 }
      );
    }
    if (goal_type === "exercise_pr" && !exercise_name) {
      return NextResponse.json(
        { error: "exercise_name is required for exercise_pr goals" },
        { status: 400 }
      );
    }
    if (goal_type === "muscle_volume" && !muscle_group) {
      return NextResponse.json(
        { error: "muscle_group is required for muscle_volume goals" },
        { status: 400 }
      );
    }

    const goal = await createGoal({
      goal_type,
      exercise_name,
      muscle_group,
      target_value,
      target_date,
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
