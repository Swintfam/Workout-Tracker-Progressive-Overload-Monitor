import { CalendarDays, ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import VolumeTrendChart from "@/components/VolumeTrendChart";
import {
  getWeekStart,
  getWeekEnd,
  getWeeklyRepTotals,
  getWeeklySessionCount,
  getSessionsForWeek,
  getVolumeTrend,
  REP_TARGETS,
} from "@/lib/workouts";
import { getGoalProgressAsOf } from "@/lib/goals";

function shiftWeek(weekStart: string, deltaWeeks: number): string {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + 7 * deltaWeeks);
  return d.toISOString().split("T")[0];
}

function formatWeekLabel(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(weekEnd + "T00:00:00");
  const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${startStr} – ${endStr}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const currentWeekStart = getWeekStart();
  const weekStart = searchParams.week ?? currentWeekStart;
  const weekEnd = getWeekEnd(weekStart);
  const isCurrentWeek = weekStart === currentWeekStart;
  const weeksBack = Math.round(
    (new Date(currentWeekStart + "T00:00:00").getTime() -
      new Date(weekStart + "T00:00:00").getTime()) /
      (7 * 24 * 60 * 60 * 1000)
  );
  const showCalendarJump = weeksBack >= 3;

  const [repTotals, sessionCount, sessions, volumeTrend, goalSnapshot] = await Promise.all([
    getWeeklyRepTotals(weekStart),
    getWeeklySessionCount(weekStart),
    getSessionsForWeek(weekStart),
    getVolumeTrend(8),
    getGoalProgressAsOf(weekEnd),
  ]);

  const byDate: Record<string, typeof sessions> = {};
  for (const s of sessions) {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  }
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  const prevWeek = shiftWeek(weekStart, -1);
  const nextWeek = shiftWeek(weekStart, 1);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 px-8 py-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Calendar</h1>
            <p className="text-sm text-muted">
              {sessionCount} session{sessionCount !== 1 ? "s" : ""} ·{" "}
              {formatWeekLabel(weekStart, weekEnd)}
              {isCurrentWeek ? " (this week)" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/calendar?week=${prevWeek}`}
              className="rounded-xl p-2 text-muted transition hover:bg-surface-hover hover:text-foreground"
            >
              <ChevronLeft size={18} />
            </Link>
            {!isCurrentWeek && (
              <Link
                href="/calendar"
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
                href={`/calendar?week=${nextWeek}`}
                className="rounded-xl p-2 text-muted transition hover:bg-surface-hover hover:text-foreground"
              >
                <ChevronRight size={18} />
              </Link>
            )}
            {showCalendarJump && (
              <Link
                href="/calendar/browse"
                className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-background transition hover:bg-accent-dark"
              >
                <CalendarDays size={16} />
                Browse
              </Link>
            )}
          </div>
        </header>

        <div className="flex flex-col gap-8">
          {/* Rep Targets for selected week */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Rep Targets
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {(Object.entries(REP_TARGETS) as [string, number][]).map(([mg, target]) => {
                const current = repTotals[mg as keyof typeof repTotals] ?? 0;
                const pct = Math.min(100, Math.round((current / target) * 100));
                return (
                  <div key={mg} className="rounded-2xl border border-border bg-surface p-4">
                    <div className="mb-1 text-sm font-medium">{mg}</div>
                    <div className="mb-2 text-2xl font-bold">
                      {current.toLocaleString()}
                      <span className="text-sm font-normal text-muted">
                        {" "}/ {target.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Volume Trend */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Volume Trend (last 8 weeks)
            </h2>
            <VolumeTrendChart data={volumeTrend} />
          </section>

          {/* Goal Snapshot */}
          {goalSnapshot.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Goal Progress · as of {formatWeekLabel(weekStart, weekEnd)}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {goalSnapshot.map((g) => {
                  const label =
                    g.goal_type === "exercise_pr"
                      ? g.exercise_name ?? "Exercise PR"
                      : `${g.muscle_group} Volume`;
                  const unit = g.goal_type === "exercise_pr" ? "lb" : "lb total";
                  return (
                    <div key={g.id} className="rounded-2xl border border-border bg-surface p-4">
                      <div className="mb-1 text-sm font-medium">{label}</div>
                      <div className="mb-2 text-xl font-bold">
                        {g.current_value.toLocaleString()}
                        <span className="text-sm font-normal text-muted">
                          {" "}/ {g.target_value.toLocaleString()} {unit}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${g.progress_pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Session Log */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Session Log
            </h2>

            {sortedDates.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface py-16 text-center">
                <Dumbbell size={40} className="text-muted opacity-30" />
                <p className="text-sm text-muted">No sessions logged this week.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {sortedDates.map((date) => {
                  const daySessions = byDate[date];
                  const sessionType = daySessions[0].session_type;
                  const totalReps = daySessions.reduce(
                    (sum, s) => sum + (s.sets ?? 0) * (s.reps ?? 0),
                    0
                  );

                  return (
                    <div key={date} className="rounded-2xl border border-border bg-surface p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{sessionType} Day</p>
                          <p className="text-xs text-muted">
                            {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <span className="text-xs text-muted">
                          {totalReps.toLocaleString()} total reps
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {daySessions.map((s, i) => (
                          <div
                            key={i}
                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                              s.weight ? "border border-accent/30 bg-accent/5" : "bg-surface-hover"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {s.weight && (
                                <span className="rounded-md bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                                  W
                                </span>
                              )}
                              <span className="font-medium">{s.exercise}</span>
                              {s.muscle_group && (
                                <span className="text-xs text-muted">({s.muscle_group})</span>
                              )}
                            </div>
                            <span className="text-muted">
                              {s.sets}×{s.reps}
                              {s.weight ? ` @ ${s.weight} lb` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
