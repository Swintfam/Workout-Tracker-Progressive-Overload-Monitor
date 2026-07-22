import { Beef, Dumbbell, Flame, TrendingUp } from "lucide-react";
import NextSessionPanel from "@/components/NextSessionPanel";
import ProgressBars from "@/components/ProgressBars";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import WeeklyVolumeChart from "@/components/WeeklyVolumeChart";
import MoodWeekStrip from "@/components/MoodWeekStrip";
import {
  getWeeklyRepTotals,
  getWeeklySessionCount,
  getWeeklyVolumeByDay,
  getLastSession,
  getNextPlannedSession,
} from "@/lib/workouts";
import { getWeekMood } from "@/lib/mental";
import { getUserTargets } from "@/lib/targets";

export default async function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const todayStr = new Date().toISOString().split("T")[0];

  const [repTotals, sessionCount, volumeByDay, lastSession, weekMood, nextSession, userTargets] = await Promise.all([
    getWeeklyRepTotals(),
    getWeeklySessionCount(),
    getWeeklyVolumeByDay(),
    getLastSession(),
    getWeekMood(),
    getNextPlannedSession(),
    getUserTargets(),
  ]);

  const totalWeeklyVolume = volumeByDay.reduce((sum, d) => sum + d.volume, 0);

  const stats = [
    {
      label: "Today's Calories",
      value: "—",
      sublabel: "Log a meal to see this",
      icon: Flame,
    },
    {
      label: "Today's Protein",
      value: "—",
      sublabel: "Log a meal to see this",
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
      <main className="flex-1 px-8 py-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Welcome back, {displayName}</h1>
            <p className="text-sm text-muted">{today}</p>
          </div>
        </header>
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>
        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <WeeklyVolumeChart data={volumeByDay} />
          </div>
          <NextSessionPanel lastSession={lastSession} nextSession={nextSession} />
        </section>
        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProgressBars goals={repGoals} />
          </div>
        </section>
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
      </main>
    </div>
  );
}

