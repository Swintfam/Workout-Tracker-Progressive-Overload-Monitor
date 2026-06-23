"use client";

import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SESSION_TYPES = ["Push", "Pull", "Legs", "Skill", "Cardio", "Mixed"] as const;
const MUSCLE_GROUPS = ["Abs", "Pull", "Push", "Legs", "Full Body"] as const;

const SESSION_TO_MUSCLE: Record<string, string> = {
  Push: "Push",
  Pull: "Pull",
  Legs: "Legs",
  Skill: "Pull",
  Cardio: "Legs",
  Mixed: "Full Body",
};

const EXERCISE_SUGGESTIONS: Record<string, string[]> = {
  Abs: ["Hanging Leg Raises", "Dragon Flag", "Ab Wheel", "Plank", "Hollow Body Hold", "L-Sit", "Toes to Bar", "V-Ups", "Flutter Kicks", "Dead Bug"],
  Pull: ["Pull-Ups", "Chin-Ups", "Rows", "Lat Pulldown", "Face Pulls", "Muscle-Up Negatives", "Australian Pull-Ups", "Cable Rows", "Deadlift", "Hammer Curls"],
  Push: ["Push-Ups", "Dips", "Bench Press", "Overhead Press", "Incline Press", "Tricep Pushdown", "Diamond Push-Ups", "Pike Push-Ups", "Chest Fly", "Lateral Raises"],
  Legs: ["Squats", "Lunges", "Romanian Deadlift", "Leg Press", "Calf Raises", "Bulgarian Split Squat", "Hip Thrust", "Leg Extensions", "Hamstring Curl", "Box Jumps"],
  "Full Body": ["Burpees", "Thrusters", "Turkish Get-Up", "Kettlebell Swings", "Man Makers"],
};

interface ExerciseRow {
  id: number;
  exercise: string;
  muscle_group: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
}

let nextId = 1;

function makeExercise(defaultMuscle: string): ExerciseRow {
  return {
    id: nextId++,
    exercise: "",
    muscle_group: defaultMuscle,
    sets: "",
    reps: "",
    weight: "",
    notes: "",
  };
}

export default function LogWorkoutPage() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [sessionType, setSessionType] = useState("Push");
  const [date, setDate] = useState(today);
  const [duration, setDuration] = useState("");
  const [exercises, setExercises] = useState<ExerciseRow[]>([makeExercise("Push")]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSessionTypeChange(type: string) {
    setSessionType(type);
    const newMuscle = SESSION_TO_MUSCLE[type] ?? "Full Body";
    setExercises((prev) =>
      prev.map((ex) => (ex.exercise === "" ? { ...ex, muscle_group: newMuscle } : ex))
    );
  }

  function addExercise() {
    if (exercises.length >= 8) return;
    const defaultMuscle = SESSION_TO_MUSCLE[sessionType] ?? "Full Body";
    setExercises((prev) => [...prev, makeExercise(defaultMuscle)]);
  }

  function removeExercise(id: number) {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }

  function updateExercise(id: number, field: keyof ExerciseRow, value: string) {
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const valid = exercises.filter(
      (ex) => ex.exercise.trim() && ex.sets && ex.reps
    );

    if (valid.length === 0) {
      setError("Add at least one exercise with a name, sets, and reps.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_type: sessionType,
          date,
          duration_min: duration ? parseInt(duration) : null,
          exercises: valid.map((ex) => ({
            exercise: ex.exercise.trim(),
            muscle_group: ex.muscle_group,
            sets: parseInt(ex.sets),
            reps: parseInt(ex.reps),
            weight: ex.weight ? parseFloat(ex.weight) : null,
            notes: ex.notes || null,
          })),
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to save");
      }

      router.push("/workouts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/workouts"
            className="rounded-xl p-2 text-muted transition hover:bg-surface-hover hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-semibold">Log Session</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Session Info */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
              Session
            </h2>

            {/* Session Type */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">Type</label>
              <div className="flex flex-wrap gap-2">
                {SESSION_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleSessionTypeChange(type)}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                      sessionType === type
                        ? "bg-accent text-background"
                        : "bg-surface-hover text-muted hover:text-foreground"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="date">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="duration">
                  Duration (min){" "}
                  <span className="text-xs font-normal text-muted">optional</span>
                </label>
                <input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="60"
                  min="1"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            </div>
          </div>

          {/* Exercises */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Exercises
              </h2>
              <p className="text-xs text-muted">TUT / negatives → enter seconds as reps</p>
            </div>

            {exercises.map((ex, idx) => {
              const isWeighted = ex.weight.trim() !== "";
              const suggestions = EXERCISE_SUGGESTIONS[ex.muscle_group] ?? [];

              return (
                <div
                  key={ex.id}
                  className={`rounded-2xl border bg-surface p-4 transition-colors ${
                    isWeighted ? "border-accent/40" : "border-border"
                  }`}
                >
                  {/* Row header */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted">#{idx + 1}</span>
                      {isWeighted && (
                        <span className="rounded-md bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                          WEIGHTED
                        </span>
                      )}
                    </div>
                    {exercises.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExercise(ex.id)}
                        className="rounded-lg p-1 text-muted transition hover:bg-surface-hover hover:text-foreground"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Exercise name (full width) */}
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs font-medium text-muted">
                        Exercise
                      </label>
                      <input
                        type="text"
                        list={`sugg-${ex.id}`}
                        value={ex.exercise}
                        onChange={(e) => updateExercise(ex.id, "exercise", e.target.value)}
                        placeholder="e.g. Pull-Ups"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                      <datalist id={`sugg-${ex.id}`}>
                        {suggestions.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    </div>

                    {/* Muscle group */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">
                        Muscle Group
                      </label>
                      <select
                        value={ex.muscle_group}
                        onChange={(e) => updateExercise(ex.id, "muscle_group", e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      >
                        {MUSCLE_GROUPS.map((mg) => (
                          <option key={mg} value={mg}>
                            {mg}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sets */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Sets</label>
                      <input
                        type="number"
                        value={ex.sets}
                        onChange={(e) => updateExercise(ex.id, "sets", e.target.value)}
                        placeholder="3"
                        min="1"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>

                    {/* Reps */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">
                        Reps <span className="text-muted/60">(or seconds for TUT)</span>
                      </label>
                      <input
                        type="number"
                        value={ex.reps}
                        onChange={(e) => updateExercise(ex.id, "reps", e.target.value)}
                        placeholder="10"
                        min="1"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>

                    {/* Weight */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">
                        Weight (lb){" "}
                        <span className="text-muted/60">optional</span>
                      </label>
                      <input
                        type="number"
                        value={ex.weight}
                        onChange={(e) => updateExercise(ex.id, "weight", e.target.value)}
                        placeholder="bodyweight"
                        min="0"
                        step="0.5"
                        className={`w-full rounded-xl border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 ${
                          isWeighted
                            ? "border-accent/50 bg-accent/5 focus:ring-accent/50"
                            : "border-border bg-background focus:ring-accent/50"
                        }`}
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">
                        Notes <span className="text-muted/60">optional</span>
                      </label>
                      <input
                        type="text"
                        value={ex.notes}
                        onChange={(e) => updateExercise(ex.id, "notes", e.target.value)}
                        placeholder="e.g. 4s negatives"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {exercises.length < 8 && (
              <button
                type="button"
                onClick={addExercise}
                className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm text-muted transition hover:border-accent/40 hover:text-accent"
              >
                <Plus size={16} />
                Add Exercise
              </button>
            )}
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
            {submitting ? "Saving..." : "Save Session"}
          </button>
        </form>
      </div>
    </div>
  );
}
