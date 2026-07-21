"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MUSCLE_GROUPS = ["Abs", "Pull", "Push", "Legs"] as const;

type GoalType = "exercise_pr" | "muscle_volume" | "skill_hold";

export default function NewGoalPage() {
  const router = useRouter();

  const [goalType, setGoalType] = useState<GoalType>("exercise_pr");
  const [exerciseName, setExerciseName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<string>("Push");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [exerciseOptions, setExerciseOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/goals/exercises")
      .then((res) => res.json())
      .then((names) => setExerciseOptions(Array.isArray(names) ? names : []))
      .catch(() => setExerciseOptions([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const val = parseFloat(targetValue);
    if (!val || val <= 0) {
      setError("Enter a target value greater than 0.");
      return;
    }
    if ((goalType === "exercise_pr" || goalType === "skill_hold") && !exerciseName.trim()) {
      setError("Enter or select an exercise.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal_type: goalType,
          exercise_name: goalType !== "muscle_volume" ? exerciseName.trim() : undefined,
          muscle_group: goalType === "muscle_volume" ? muscleGroup : undefined,
          target_value: val,
          target_date: targetDate || null,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to save");
      }

      router.push("/goals");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const targetLabel =
    goalType === "skill_hold" ? "Target (seconds)" :
    goalType === "exercise_pr" ? "Target (lb)" : "Target (lb total)";

  const targetPlaceholder =
    goalType === "skill_hold" ? "60" :
    goalType === "exercise_pr" ? "225" : "10000";

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
          <h1 className="text-xl font-semibold">New Goal</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <label className="mb-2 block text-sm font-medium">Goal Type</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setGoalType("exercise_pr")}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  goalType === "exercise_pr"
                    ? "bg-accent text-background"
                    : "bg-surface-hover text-muted hover:text-foreground"
                }`}
              >
                Exercise PR
              </button>
              <button
                type="button"
                onClick={() => setGoalType("skill_hold")}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  goalType === "skill_hold"
                    ? "bg-accent text-background"
                    : "bg-surface-hover text-muted hover:text-foreground"
                }`}
              >
                Skill Hold
              </button>
              <button
                type="button"
                onClick={() => setGoalType("muscle_volume")}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  goalType === "muscle_volume"
                    ? "bg-accent text-background"
                    : "bg-surface-hover text-muted hover:text-foreground"
                }`}
              >
                Muscle Group Volume
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">
              {goalType === "exercise_pr"
                ? "Tracks the heaviest weight you've ever logged for one exercise."
                : goalType === "skill_hold"
                ? "Tracks your best hold time (in seconds) for a skill. Log reps = seconds held."
                : "Tracks cumulative volume (sets × reps × weight) for a muscle group, starting from when this goal is created."}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
              Target
            </h2>

            {goalType === "muscle_volume" ? (
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium" htmlFor="muscle-group">
                  Muscle Group
                </label>
                <select
                  id="muscle-group"
                  value={muscleGroup}
                  onChange={(e) => setMuscleGroup(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {MUSCLE_GROUPS.map((mg) => (
                    <option key={mg} value={mg}>{mg}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium" htmlFor="exercise">
                  Exercise
                </label>
                <input
                  id="exercise"
                  type="text"
                  list="exercise-options"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  placeholder="e.g. Handstand Hold"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <datalist id="exercise-options">
                  {exerciseOptions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="target">
                  {targetLabel}
                </label>
                <input
                  id="target"
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={targetPlaceholder}
                  min="0"
                  step={goalType === "skill_hold" ? "1" : "0.5"}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="target-date">
                  Target Date{" "}
                  <span className="text-xs font-normal text-muted">optional</span>
                </label>
                <input
                  id="target-date"
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
            {submitting ? "Saving..." : "Save Goal"}
          </button>
        </form>
      </div>
    </div>
  );
}
