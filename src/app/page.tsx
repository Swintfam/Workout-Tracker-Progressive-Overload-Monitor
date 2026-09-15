import { Beef, Dumbbell, Flame, TrendingUp } from "lucide-react";
import NextSessionPanel from "@/components/NextSessionPanel";
import ProgressBars from "@/components/ProgressBars";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import WeeklyVolumeChart from "@/components/WeeklyVolumeChart";
import MoodWeekStrip from "@/components/MoodWeekStrip";
import BodyMapWidget from "@/components/BodyMapWidget";
import {
  getWeeklyRepTotals,
  getWeeklySessionCount,
  getWeeklyVolumeByDay,
  getLastSession,
  getNextPlannedSession,
  getLastSessionMuscles,
} from "@/lib/workouts";
import { getWeekMood } from "@/lib/mental";
import { getUserTargets } from "@/lib/targets";
import { getDailyTotals, getNutritionTargets, getDailyRequirement } from "@/lib/nutrition";
import { localDateYMD } from "@/lib/utils";

export default async function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const todayStr = localDateYMD();

  // Wrap each call so one failing query returns a safe default instead of
  // crashing the whole page. If the session token is stale the middleware
  // will have already refreshed it, but this is a belt-and-suspenders guard.
  const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> =>
    p.catch(() => fallback);

  const [repTotals, sessionCount, volumeByDay, lastSession, weekMood, nextSession, userTargets, todayMacros, nutritionTargets, lastSessionMuscles] = await Promise.all([
    safe(getWeeklyRepTotals(), { Abs: 0, Pull: 0, Push: 0, Legs: 0 }),
    safe(getWeeklySessionCount(), 0),
    safe(getWeeklyVolumeByDay(), []),
    safe(getLastSession(), []),
    safe(getWeekMood(), []),
    safe(getNextPlannedSession(), null),
    safe(getUserTargets(), null),
    safe(getDailyTotals(todayStr), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }),
    safe(getNutritionTargets(), null),
    safe(getLastSessionMuscles(), { date: "", muscles: [] }),
  ]);

  const dailyReq = nutritionTargets ? getDailyRequirement(nutritionTargets) : null;
  const calGoal = dailyReq?.calories ?? 0;
  const proteinGoal = dailyReq?.protein_g ?? 0;

  const totalWeeklyVolume = volumeByDay.reduce((sum, d) => sum + d.volume, 0);

  const stats = [
    {
      label: "Today's Calories",
      value: todayMacros.calories > 0 ? Math.round(todayMacros.calories).toLocaleString() : "—",
      sublabel: todayMacros.calories > 0
        ? calGoal > 0
          ? `${Math.round(calGoal - todayMacros.calories).toLocaleString()} kcal remaining`
          : `${Math.round(todayMacros.calories).toLocaleString()} kcal logged`
        : "Log a meal to see this",
      icon: Flame,
    },
    {
      label: "Today's Protein",
      value: todayMacros.protein_g > 0 ? `${Math.round(todayMacros.protein_g)}g` : "—",
      sublabel: todayMacros.protein_g > 0
        ? proteinGoal > 0
          ? `Goal: ${Math.round(proteinGoal)}g`
          : `${Math.round(todayMacros.protein_g)}g logged`
        : "Log a meal to see this",
      icon: Beef,
    },
    {
      label: "Workouts This Week",
      value: sessionCount > 0 ? String(sessionCount) : "—",
      sublabel:
        sessionCount > 0
          ? `${sessionCount} session${sessionCount !== 1 ? "s" : ""} logged`
          : "Log a session to see this",
      icon: Dumbbell,
    },
    {
      label: "Weekly Volume",
      value: totalWeeklyVolume > 0 ? totalWeeklyVolume.toLocaleString() : "—",
      sublabel:
        totalWeeklyVolume > 0
          ? "Sets × reps × weight"
          : "Log a session to see this",
      icon: TrendingUp,
    },
  ];

  const displayName = userTargets?.display_name ?? "there";
  const repTargetMap = {
    Abs: userTargets?.abs_weekly_reps ?? 0,
    Pull: userTargets?.pull_weekly_reps ?? 0,
    Push: userTargets?.push_weekly_reps ?? 0,
    Legs: userTargets?.legs_weekly_reps ?? 0,
  };

  const repGoals = (Object.entries(repTargetMap) as [string, number][]).map(
    ([label, target]) => ({
      label: `${label} reps`,
      current: repTotals[label as keyof typeof repTotals] ?? 0,
      target,
      unit: "reps",
    })
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      {/* ── MAIN CONTENT ── mobile-first: full width, generous bottom padding for nav bar */}
      <main className="flex-1 overflow-y-auto pb-28 lg:pb-8">

        {/* ── HEADER ── */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/40 px-4 py-3 lg:static lg:bg-transparent lg:backdrop-blur-none lg:border-0 lg:px-8 lg:pt-6 lg:pb-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider">{today}</p>
              <h1 className="text-xl font-bold leading-tight lg:text-2xl">
                Hey, {displayName} 👋
              </h1>
            </div>
          </div>
        </header>

        <div className="px-4 pt-4 lg:px-8 lg:pt-6 space-y-4">

          {/* ── STAT CARDS — 2-col on mobile, 4-col on desktop ── */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </section>

          {/* ── BODY MAP + NEXT SESSION — side-by-side on desktop, stacked on mobile ── */}
          <section className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
            <div className="lg:col-span-1">
              <BodyMapWidget muscles={lastSessionMuscles.muscles} lastDate={lastSessionMuscles.date} />
            </div>
            <div className="lg:col-span-2">
              <NextSessionPanel lastSession={lastSession} nextSession={nextSession} />
            </div>
          </section>

          {/* ── WEEKLY VOLUME CHART ── */}
          <section>
            <WeeklyVolumeChart data={volumeByDay} />
          </section>

          {/* ── WEEKLY PROGRESS BARS ── */}
          <section>
            <ProgressBars goals={repGoals} />
          </section>

          {/* ── MOOD STRIP ── */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Mental Health · This Week
              </h2>
              <a href="/mental-health" className="text-xs text-accent hover:underline">
                Log today →
              </a>
            </div>
            <MoodWeekStrip days={weekMood} today={todayStr} />
          </section>

        </div>
      </main>
    </div>
  );
}

