import { Target, Plus } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { getActiveGoals } from "@/lib/goals";
import ArchiveGoalButton from "@/components/ArchiveGoalButton";

function GoalCard({
  goal,
}: {
  goal: Awaited<ReturnType<typeof getActiveGoals>>[number];
}) {
  const label =
    goal.goal_type === "exercise_pr"
      ? goal.exercise_name ?? "Exercise PR"
      : `${goal.muscle_group} Volume`;

  const unit = goal.goal_type === "exercise_pr" ? "lb" : "lb total";
  const isComplete = goal.progress_pct >= 100;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">{label}</span>
          <span className="ml-2 rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
            {goal.goal_type === "exercise_pr" ? "PR" : "Volume"}
          </span>
        </div>
        {isComplete && (
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
            ✓ Hit
          </span>
        )}
      </div>

      <div className="mb-2 text-2xl font-bold">
        {goal.current_value.toLocaleString()}
        <span className="text-sm font-normal text-muted">
          {" "}/ {goal.target_value.toLocaleString()} {unit}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${goal.progress_pct}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>
          {goal.progress_pct}%
          {goal.target_date
            ? ` · by ${new Date(goal.target_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
            : ""}
        </span>
        <ArchiveGoalButton goalId={goal.id} />
      </div>
    </div>
  );
}

export default async function GoalsPage() {
  const goals = await getActiveGoals();
  const prGoals = goals.filter((g) => g.goal_type === "exercise_pr");
  const volumeGoals = goals.filter((g) => g.goal_type === "muscle_volume");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 px-8 py-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Goals</h1>
            <p className="text-sm text-muted">
              {goals.length} active goal{goals.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/goals/new"
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-background transition hover:bg-accent-dark"
          >
            <Plus size={16} />
            New Goal
          </Link>
        </header>

        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface py-16 text-center">
            <Target size={40} className="text-muted opacity-30" />
            <p className="text-sm text-muted">No active goals yet.</p>
            <Link
              href="/goals/new"
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-background transition hover:bg-accent-dark"
            >
              Set your first goal
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {prGoals.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Personal Records
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {prGoals.map((g) => (
                    <GoalCard key={g.id} goal={g} />
                  ))}
                </div>
              </section>
            )}

            {volumeGoals.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Volume Goals
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {volumeGoals.map((g) => (
                    <GoalCard key={g.id} goal={g} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
