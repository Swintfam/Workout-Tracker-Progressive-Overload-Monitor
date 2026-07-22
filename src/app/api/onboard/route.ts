import { createAuthClient, getEffectiveUserId } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      display_name,
      abs_weekly_reps,
      pull_weekly_reps,
      push_weekly_reps,
      legs_weekly_reps,
      calories_weekly,
      protein_weekly_g,
      carbs_weekly_g,
      fat_weekly_g,
      skipped = false,
    } = body;

    const db = createAuthClient();
    const userId = await getEffectiveUserId();

    // Upsert rep targets + display name
    const { error: targetError } = await db.from("user_targets").upsert({
      user_id: userId,
      display_name: display_name ?? null,
      abs_weekly_reps: Number(abs_weekly_reps) || 0,
      pull_weekly_reps: Number(pull_weekly_reps) || 0,
      push_weekly_reps: Number(push_weekly_reps) || 0,
      legs_weekly_reps: Number(legs_weekly_reps) || 0,
      onboarding_complete: !skipped,
      updated_at: new Date().toISOString(),
    });

    if (targetError) throw new Error(targetError.message);

    // Upsert nutrition targets (only if not skipped and values provided)
    if (!skipped && (calories_weekly || protein_weekly_g)) {
      const { error: nutError } = await db.from("nutrition_targets").upsert({
        user_id: userId,
        calories_weekly: Number(calories_weekly) || 0,
        protein_weekly_g: Number(protein_weekly_g) || 0,
        carbs_weekly_g: Number(carbs_weekly_g) || 0,
        fat_weekly_g: Number(fat_weekly_g) || 0,
        updated_at: new Date().toISOString(),
      });
      if (nutError) throw new Error(nutError.message);
    }

    // Set the app_onboarded cookie so middleware stops redirecting
    const response = NextResponse.json({ ok: true });
    response.cookies.set("app_onboarded", "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
      httpOnly: false,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
