import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import MoodLogForm from "@/components/MoodLogForm";
import MoodTrendChart from "@/components/MoodTrendChart";
import MoodWeekStrip from "@/components/MoodWeekStrip";
import { getWeekMood, getMoodTrend, getMoodForDate, MOOD_COLORS } from "@/lib/mental";
import { getWeekStart, getWeekEnd } from "@/lib/workouts";

function shiftWeek(weekStart: string, delta: number): string {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + 7 * delta);
  return d.toISOString().split("T")[0];
}

function formatWeekLabel(weekStart: string, weekEnd: string): string {
  const s = new Date(weekStart + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const e = new Date(weekEnd + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${s} – ${e}`;
}

export default async function MentalHealthPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const today = new Date().toISOString().split("T")[0];
  const currentWeekStart = getWeekStart();
  const weekStart = searchParams.week ?? currentWeekStart;
  const weekEnd = getWeekEnd(weekStart);
  const isCurrentWeek = weekStart === currentWeekStart;

  const [weekDays, trend, todayLog] = await Promise.all([
    getWeekMood(weekStart),
    getMoodTrend(8),
    isCurrentWeek ? getMoodForDate(today) : Promise.resolve(null),
  ]);

  const prevWeek = shiftWeek(weekStart, -1);
  const nextWeek = shiftWeek(weekStart, 1);

  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 px-8 py-6">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Mental Health</h1>
            <p className="text-sm text-muted">{formatWeekLabel(weekStart, weekEnd)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/mental-health?week=${prevWeek}`}
              className="rounded-xl p-2 text-muted transition hover:bg-surface-hover hover:text-foreground"
            >
              <ChevronLeft size={18} />
            </Link>
            {!isCurrentWeek && (
              <Link
                href="/mental-health"
                className="rounded-xl bg-surface-hover px-3 py-2 text-xs font-medium text-muted transition hover:text-foreground"
              >
                This week
              </Link>
            )}
            {isCurrentWeek ? (
              <span className="rounded-xl p-2 text-muted/30">
                <ChevronRight size={18} />
              </span>
            ) : (
              <Link
                href={`/mental-health?week=${nextWeek}`}
                className="rounded-xl p-2 text-muted transition hover:bg-surface-hover hover:text-foreground"
              >
                <ChevronRight size={18} />
              </Link>
            )}
          </div>
        </header>

        <div className="flex flex-col gap-8">
          {/* Week mood grid */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Week at a Glance
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(({ date, rating, note }, i) => {
                const isToday = date === today;
                const colors = rating ? MOOD_COLORS[rating] : null;
                return (
                  <div
                    key={date}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-3 ${
                      colors ? colors.bg : "bg-surface-hover"
                    } ${isToday ? "ring-1 ring-accent/40" : ""}`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {DAY_LABELS[i]}
                    </span>
                    <span className={`text-2xl font-bold ${colors ? colors.text : "text-muted/20"}`}>
                      {rating ?? "—"}
                    </span>
                    <span className="text-[10px] text-muted">
                      {colors ? colors.label : isToday ? "Today" : ""}
                    </span>
                    {note && (
                      <span className="mt-1 line-clamp-2 text-center text-[9px] text-muted leading-tight">
                        {note}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Log / update form — only shown on current week */}
          {isCurrentWeek && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Today
              </h2>
              <MoodLogForm today={today} existing={todayLog} />
            </section>
          )}

          {/* Trend chart */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              8-Week Trend
            </h2>
            <MoodTrendChart data={trend} />
          </section>
        </div>
      </main>
    </div>
  );
}
