import { Beef, Dumbbell, Flame, TrendingUp } from "lucide-react";
import NextSessionPanel from "@/components/NextSessionPanel";
import ProgressBars from "@/components/ProgressBars";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import WeeklyVolumeChart from "@/components/WeeklyVolumeChart";
import {
  getWeeklyRepTotals,
  getWeeklySessionCount,
  getWeeklyVolumeByDay,
  getLastSession,
  REP_TARGETS,
} from "@/lib/workouts";

export default async function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const [repTotals, sessionCount, volumeByDay, lastSession] = await Promise.all([
    getWeeklyRepTotals(),
    getWeeklySessionCount(),
    getWeeklyVolumeByDay(),
    getLastSession(),
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

  const repGoals = (Object.entries(REP_TARGETS) as [string, number][]).map(
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
            <h1 className="text-2xl font-semibold">Welcome back, Naeem</h1>
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
          <NextSessionPanel lastSession={lastSession} />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProgressBars goals={repGoals} />
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
            <h3 className="text-sm font-semibold text-foreground">
              Phase B — Live
            </h3>
            <p>
              Workout logging is live. Head to{" "}
              <a href="/workouts" className="text-accent hover:underline">
                Workouts
              </a>{" "}
              to log a session and see your rep targets update in real time.
              Nutrition (Phase C) coming next.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
