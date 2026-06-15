import { Beef, Dumbbell, Flame, TrendingUp } from "lucide-react";
import NextSessionPanel from "@/components/NextSessionPanel";
import ProgressBars from "@/components/ProgressBars";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import WeeklyVolumeChart from "@/components/WeeklyVolumeChart";

// Phase A shell — stat values below are placeholders. Phase B/C
// will replace these with live queries against workout_sessions
// and meals (see supabase/schema.sql).
const stats = [
  { label: "Today's Calories", value: "—", sublabel: "Log a meal to see this", icon: Flame },
  { label: "Today's Protein", value: "—", sublabel: "Log a meal to see this", icon: Beef },
  { label: "Workouts This Week", value: "—", sublabel: "Log a session to see this", icon: Dumbbell },
  { label: "Weekly Volume", value: "—", sublabel: "Sets × reps × weight", icon: TrendingUp },
];

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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
            <WeeklyVolumeChart />
          </div>
          <NextSessionPanel />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProgressBars />
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
            <h3 className="text-sm font-semibold text-foreground">Phase A — Foundation</h3>
            <p>
              This is the dashboard shell: layout, theme, auth, and Supabase
              connection are wired up. Workout and nutrition logging,
              charts, and overload suggestions are sample data for now —
              Phase B and C connect them to your live database.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
