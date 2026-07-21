"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditGoalPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [goalType, setGoalType] = useState("");
  const [label, setLabel] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [unit, setUnit] = useState("lb");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/goals")
      .then((r) => r.json())
      .then((goals: Array<{
        id: string;
        goal_type: string;
        exercise_name: string | null;
        muscle_group: string | null;
        target_value: number;
        target_date: string | null;
      }>) => {
        const goal = goals.find((g) => g.id === id);
        if (!goal) { setError("Goal not found."); setLoading(false); return; }
        setGoalType(goal.goal_type);
        setLabel(
          goal.goal_type === "exercise_pr" || goal.goal_type === "skill_hold"
            ? goal.exercise_name ?? ""
            : `${goal.muscle_group} Volume`
        );
        setUnit(goal.goal_type === "skill_hold" ? "sec" : goal.goal_type === "exercise_pr" ? "lb" : "lb total");
        setTargetValue(String(goal.target_value));
        setTargetDate(goal.target_date ?? "");
        setLoading(false);
      })
      .catch(() => { setError("Failed to load goal."); setLoading(false); });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const val = parseFloat(targetValue);
    if (!val || val <= 0) { setError("Target must be greater than 0."); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_value: val,
          target_date: targetDate || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      router.push("/goals");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/goals"
            className="rounded-xl p-2 text-muted transition hover:bg-surface-hover hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-semibold">Edit Goal</h1>
        </div>

        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : error && !goalType ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">Goal</p>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted mt-0.5 capitalize">{goalType.replace("_", " ")}</p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
                Update Target
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Target ({unit})
                  </label>
                  <input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    min="0"
                    step={goalType === "skill_hold" ? "1" : "0.5"}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Target Date <span className="text-xs font-normal text-muted">optional</span>
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-accent py-3 text-sm font-semibold text-background transition hover:bg-accent-dark disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
