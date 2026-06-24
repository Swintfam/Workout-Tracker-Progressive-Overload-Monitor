import { getDbClient, getEffectiveUserId } from "@/lib/supabase/admin";

export const REP_TARGETS = {
  Abs: 2500,
  Pull: 500,
  Push: 500,
  Legs: 400,
} as const;

export type MuscleGroup = keyof typeof REP_TARGETS;

/** Monday of the week containing `ref` (defaults to now), as YYYY-MM-DD. */
export function getWeekStart(ref: Date = new Date()): string {
  const day = ref.getDay(); // 0=Sun
  const daysToMon = day === 0 ? 6 : day - 1;
  const mon = new Date(ref);
  mon.setDate(ref.getDate() - daysToMon);
  return mon.toISOString().split("T")[0];
}

/** Sunday of the week starting at `weekStart` (YYYY-MM-DD), as YYYY-MM-DD. */
export function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + 6);
  return d.toISOString().split("T")[0];
}

export async function getWeeklyRepTotals(
  weekStart?: string
): Promise<Record<MuscleGroup, number>> {
  const admin = getDbClient();
  const userId = await getEffectiveUserId();
  const from = weekStart ?? getWeekStart();
  const to = getWeekEnd(from);

  const { data } = await admin
    .from("workout_sessions")
    .select("muscle_group, sets, reps")
    .eq("user_id", userId)
    .gte("date", from)
    .lte("date", to);

  const totals: Record<MuscleGroup, number> = { Abs: 0, Pull: 0, Push: 0, Legs: 0 };

  for (const row of data ?? []) {
    const mg = row.muscle_group as MuscleGroup;
    if (mg in totals) {
      totals[mg] += (row.sets ?? 0) * (row.reps ?? 0);
    }
  }

  return totals;
}

export async function getWeeklySessionCount(weekStart?: string): Promise<number> {
  const admin = getDbClient();
  const userId = await getEffectiveUserId();
  const from = weekStart ?? getWeekStart();
  const to = getWeekEnd(from);

  const { data } = await admin
    .from("workout_sessions")
    .select("date")
    .eq("user_id", userId)
    .gte("date", from)
    .lte("date", to);

  if (!data) return 0;
  return new Set(data.map((r) => r.date)).size;
}

export async function getWeeklyVolumeByDay(
  weekStart?: string
): Promise<{ day: string; volume: number }[]> {
  const admin = getDbClient();
  const userId = await getEffectiveUserId();
  const from = weekStart ?? getWeekStart();
  const to = getWeekEnd(from);

  const { data } = await admin
    .from("workout_sessions")
    .select("date, sets, reps, weight")
    .eq("user_id", userId)
    .gte("date", from)
    .lte("date", to);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const byDay: Record<string, number> = {};

  for (const row of data ?? []) {
    const d = new Date(row.date + "T00:00:00");
    const idx = (d.getDay() + 6) % 7; // 0=Mon
    const label = days[idx];
    byDay[label] = (byDay[label] ?? 0) + (row.sets ?? 0) * (row.reps ?? 0) * (row.weight ?? 1);
  }

  return days.map((day) => ({ day, volume: byDay[day] ?? 0 }));
}

/** All raw session rows logged within the given week, most recent first. */
export async function getSessionsForWeek(weekStart?: string) {
  const admin = getDbClient();
  const userId = await getEffectiveUserId();
  const from = weekStart ?? getWeekStart();
  const to = getWeekEnd(from);

  const { data } = await admin
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  return data ?? [];
}

/**
 * Total volume (sets*reps*weight) per week for the last `weeksBack` weeks,
 * including the current week. Oldest first, for charting as a trend line.
 */
export async function getVolumeTrend(
  weeksBack = 8
): Promise<{ weekStart: string; weekLabel: string; volume: number }[]> {
  const admin = getDbClient();
  const userId = await getEffectiveUserId();

  const currentWeekStart = getWeekStart();
  const earliestStart = new Date(currentWeekStart + "T00:00:00");
  earliestStart.setDate(earliestStart.getDate() - 7 * (weeksBack - 1));
  const earliestStartStr = earliestStart.toISOString().split("T")[0];

  const { data } = await admin
    .from("workout_sessions")
    .select("date, sets, reps, weight")
    .eq("user_id", userId)
    .gte("date", earliestStartStr);

  const byWeek: Record<string, number> = {};
  for (const row of data ?? []) {
    const ws = getWeekStart(new Date(row.date + "T00:00:00"));
    byWeek[ws] =
      (byWeek[ws] ?? 0) + (row.sets ?? 0) * (row.reps ?? 0) * (row.weight ?? 1);
  }

  const weeks: { weekStart: string; weekLabel: string; volume: number }[] = [];
  for (let i = weeksBack - 1; i >= 0; i--) {
    const d = new Date(currentWeekStart + "T00:00:00");
    d.setDate(d.getDate() - 7 * i);
    const ws = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    weeks.push({ weekStart: ws, weekLabel: label, volume: byWeek[ws] ?? 0 });
  }

  return weeks;
}

/** Distinct dates with at least one logged session, within [from, to]. */
export async function getSessionDatesInRange(
  from: string,
  to: string
): Promise<string[]> {
  const admin = getDbClient();
  const userId = await getEffectiveUserId();

  const { data } = await admin
    .from("workout_sessions")
    .select("date")
    .eq("user_id", userId)
    .gte("date", from)
    .lte("date", to);

  return Array.from(new Set((data ?? []).map((r: { date: string }) => r.date)));
}

export async function getRecentSessions(limit = 30) {
  const admin = getDbClient();
  const userId = await getEffectiveUserId();

  const { data } = await admin
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getSessionByDate(date: string) {
  const admin = getDbClient();
  const userId = await getEffectiveUserId();

  const { data } = await admin
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at", { ascending: true });

  return data ?? [];
}

export async function getLastSession() {
  const admin = getDbClient();
  const userId = await getEffectiveUserId();

  const { data } = await admin
    .from("workout_sessions")
    .select("date, session_type, exercise, muscle_group, sets, reps, weight")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  return data ?? [];
}
