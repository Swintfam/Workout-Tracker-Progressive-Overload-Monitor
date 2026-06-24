import { getDbClient, getEffectiveUserId } from "@/lib/supabase/admin";
import { getWeekStart, getWeekEnd } from "@/lib/workouts";

// Re-export client-safe types and constants from the shared file
export { MOOD_COLORS } from "@/lib/mood-colors";
export type { MoodLog, WeekMoodDay, MoodTrendPoint } from "@/lib/mood-colors";

// Local type aliases for internal use
import type { MoodLog, WeekMoodDay, MoodTrendPoint } from "@/lib/mood-colors";

// ─── DB functions ─────────────────────────────────────────────────────────────

export async function getMoodForDate(date: string): Promise<MoodLog | null> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  const { data } = await db
    .from("mood_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  return data ?? null;
}

export async function upsertMood(input: {
  date: string;
  rating: number;
  note?: string | null;
}): Promise<MoodLog> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  const { data, error } = await db
    .from("mood_logs")
    .upsert(
      {
        user_id: userId,
        date: input.date,
        rating: input.rating,
        note: input.note ?? null,
      },
      { onConflict: "user_id,date" }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Returns one entry per day for the given week (Mon–Sun), nulls for unlogged days. */
export async function getWeekMood(weekStart?: string): Promise<WeekMoodDay[]> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  const ws = weekStart ?? getWeekStart();
  const we = getWeekEnd(ws);

  const { data } = await db
    .from("mood_logs")
    .select("date, rating, note")
    .eq("user_id", userId)
    .gte("date", ws)
    .lte("date", we);

  const byDate: Record<string, { rating: number; note: string | null }> = {};
  for (const row of data ?? []) {
    byDate[row.date] = { rating: row.rating, note: row.note };
  }

  const result: WeekMoodDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(ws + "T00:00:00");
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    result.push({
      date: dateStr,
      rating: byDate[dateStr]?.rating ?? null,
      note: byDate[dateStr]?.note ?? null,
    });
  }

  return result;
}

/** Average mood per week for the last `weeksBack` weeks. */
export async function getMoodTrend(weeksBack = 8): Promise<MoodTrendPoint[]> {
  const db = getDbClient();
  const userId = await getEffectiveUserId();

  const currentWeekStart = getWeekStart();
  const earliest = new Date(currentWeekStart + "T00:00:00");
  earliest.setDate(earliest.getDate() - 7 * (weeksBack - 1));
  const earliestStr = earliest.toISOString().split("T")[0];

  const { data } = await db
    .from("mood_logs")
    .select("date, rating")
    .eq("user_id", userId)
    .gte("date", earliestStr);

  // Aggregate by week
  const byWeek: Record<string, number[]> = {};
  for (const row of data ?? []) {
    const ws = getWeekStart(new Date(row.date + "T00:00:00"));
    if (!byWeek[ws]) byWeek[ws] = [];
    byWeek[ws].push(row.rating);
  }

  const result: MoodTrendPoint[] = [];
  for (let i = weeksBack - 1; i >= 0; i--) {
    const d = new Date(currentWeekStart + "T00:00:00");
    d.setDate(d.getDate() - 7 * i);
    const ws = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const ratings = byWeek[ws];
    const avg = ratings?.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;
    result.push({ weekStart: ws, weekLabel: label, avgRating: avg });
  }

  return result;
}
