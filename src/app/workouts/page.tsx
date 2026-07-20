import { Dumbbell, Plus } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import {
  getWeeklyRepTotals,
  getWeeklySessionCount,
  getRecentSessions,
  REP_TARGETS,
} from "@/lib/workouts";

function RepProgress({
  label,
  current,
  target,
}: {
  label: string;
  current: number;
  target: number;
}) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  const isComplete = pct >= 100;

  return (
    <div className="flex-1 rounded-2xl border border-border bg-surface p-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {isComplete && (
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
            ✓ Done
          </span>
        )}
      </div>
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
      <div className="mt-1 text-xs text-muted">{pct}% of weekly target</div>
    </div>
  );
}

export default async function WorkoutsPage() {
  const [repTotals, sessionCount, sessions] = await Promise.all([
    getWeeklyRepTotals(),
    getWeeklySessionCount(),
    getRecentSessions(30),
  ]);

  // Group sessions by date
  const byDate: Record<string, typeof sessions> = {};
  for (const s of sessions) {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  }
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 px-4 lg:px-8 py-4 lg:py-6 pb-24 lg:pb-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Workouts</h1>
            <p className="text-sm text-muted">
              {sessionCount} session{sessionCount !== 1 ? "s" : ""} this week
            </p>
          </div>
          <Link
            href="/workouts/log"
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-background transition hover:bg-accent-dark"
          >
            <Plus size={16} />
            Log Session
          </Link>
        </header>

        {/* Weekly Rep Targets */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Weekly Rep Targets
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {(Object.entries(REP_TARGETS) as [string, number][]).map(([mg, target]) => (
              <RepProgress
                key={mg}
                label={mg}
                current={repTotals[mg as keyof typeof repTotals] ?? 0}
                target={target}
              />
            ))}
          </div>
        </section>

        {/* Session History */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            History
          </h2>

          {sortedDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface py-16 text-center">
              <Dumbbell size={40} className="text-muted opacity-30" />
              <p className="text-sm text-muted">No sessions logged yet.</p>
              <Link
                href="/workouts/log"
                className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-background transition hover:bg-accent-dark"
              >
                Log your first session
              </Link>
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
                  <div
                    key={date}
                    className="rounded-2xl border border-border bg-surface p-5"
                  >
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
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted">
                          {totalReps.toLocaleString()} total reps
                        </span>
                        <Link
                          href={`/workouts/${date}`}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-accent transition hover:bg-accent/10"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {daySessions.map((s, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                            s.weight
                              ? "border border-accent/30 bg-accent/5"
                              : "bg-surface-hover"
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
                              <span className="text-xs text-muted">
                                ({s.muscle_group})
                              </span>
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
      </main>
    </div>
  );
}
