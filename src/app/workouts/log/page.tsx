"use client";

import { ArrowLeft, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
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
  Pull: ["Pull-Ups", "Wide Grip Pull-Up", "Archer Pull-Up", "Chin-Ups", "Australian Pull-Ups", "Muscle-Up", "Muscle-Up Negative", "Rows", "Cable Rows", "Lat Pulldown", "Face Pulls", "Deadlift", "Hammer Curls"],
  Push: ["Push-Ups", "Dips", "Bench Press", "Overhead Press", "Incline Press", "Iron Cross", "Tricep Pushdown", "Diamond Push-Ups", "Pike Push-Ups", "Chest Fly", "Lateral Raises"],
  Legs: ["Squats", "Lunges", "Romanian Deadlift", "Leg Press", "Calf Raises", "Bulgarian Split Squat", "Hip Thrust", "Leg Extensions", "Hamstring Curl", "Box Jumps"],
  "Full Body": ["Burpees", "Thrusters", "Turkish Get-Up", "Kettlebell Swings", "Man Makers"],
};

interface SetDetail {
  reps: string;
  weight: string;
}

interface ExerciseRow {
  id: number;
  exercise: string;
  muscle_group: string;
  sets: string;
  reps: string;       // used when sets === 1
  weight: string;     // used when sets === 1
  notes: string;
  is_drop_set: boolean;
  set_details: SetDetail[];  // used when sets > 1
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
    is_drop_set: false,
    set_details: [],
  };
}

function buildSetDetails(count: number, reps: string, weight: string): SetDetail[] {
  return Array.from({ length: count }, () => ({ reps, weight }));
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

  function updateField(id: number, field: keyof ExerciseRow, value: string | boolean) {
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }

  function handleSetsChange(id: number, value: string) {
    const count = parseInt(value) || 0;
    setExercises((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const details = count > 1 ? buildSetDetails(count, e.reps, e.weight) : [];
        return { ...e, sets: value, set_details: details };
      })
    );
  }

  function updateSetDetail(exId: number, setIdx: number, field: keyof SetDetail, value: string) {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.id !== exId) return e;
        const updated = e.set_details.map((s, i) =>
          i === setIdx ? { ...s, [field]: value } : s
        );
        return { ...e, set_details: updated };
      })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const valid = exercises.filter((ex) => ex.exercise.trim() && ex.sets);

    if (valid.length === 0) {
      setError("Add at least one exercise with a name and sets.");
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
          exercises: valid.map((ex) => {
            const setsCount = parseInt(ex.sets) || 1;
            const isMultiSet = ex.set_details.length > 0;

            // Build set_data for multi-set exercises
            const set_data = isMultiSet
              ? ex.set_details.map((s, i) => ({
                  set: i + 1,
                  reps: parseInt(s.reps) || 0,
                  weight: s.weight ? parseFloat(s.weight) : null,
                }))
              : null;

            // Summary values (for backward compat + volume calcs)
            const summaryReps = isMultiSet
              ? Math.round(ex.set_details.reduce((a, s) => a + (parseInt(s.reps) || 0), 0) / setsCount)
              : parseInt(ex.reps) || 0;
            const summaryWeight = isMultiSet
              ? Math.max(...ex.set_details.map((s) => parseFloat(s.weight) || 0)) || null
              : ex.weight ? parseFloat(ex.weight) : null;

            return {
              exercise: ex.exercise.trim(),
              muscle_group: ex.muscle_group,
              sets: setsCount,
              reps: summaryReps,
              weight: summaryWeight,
              notes: ex.notes || null,
              is_drop_set: ex.is_drop_set,
              set_data,
            };
          }),
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
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">Session</h2>
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
                <label className="mb-1 block text-sm font-medium" htmlFor="date">Date</label>
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
                  Duration (min) <span className="text-xs font-normal text-muted">optional</span>
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
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Exercises</h2>
              <p className="text-xs text-muted">TUT / negatives → enter seconds as reps</p>
            </div>

            {exercises.map((ex, idx) => {
              const isMultiSet = ex.set_details.length > 0;
              const isWeighted = isMultiSet
                ? ex.set_details.some((s) => s.weight.trim() !== "")
                : ex.weight.trim() !== "";

              const suggestions = EXERCISE_SUGGESTIONS[ex.muscle_group] ?? [];

              return (
                <div
                  key={ex.id}
                  className={`rounded-2xl border bg-surface p-4 transition-colors ${
                    ex.is_drop_set
                      ? "border-orange-500/40"
                      : isWeighted
                      ? "border-accent/40"
                      : "border-border"
                  }`}
                >
                  {/* Card header */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted">#{idx + 1}</span>
                      {ex.is_drop_set && (
                        <span className="rounded-md bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                          DROP SET
                        </span>
                      )}
                      {!ex.is_drop_set && isWeighted && (
                        <span className="rounded-md bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                          WEIGHTED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Drop set toggle */}
                      <button
                        type="button"
                        onClick={() => updateField(ex.id, "is_drop_set", !ex.is_drop_set)}
                        title={ex.is_drop_set ? "Remove drop set" : "Mark as drop set"}
                        className={`rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                          ex.is_drop_set
                            ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                            : "text-muted hover:bg-surface-hover hover:text-foreground"
                        }`}
                      >
                        {ex.is_drop_set ? "Drop ✓" : "Drop Set"}
                      </button>
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
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Exercise name */}
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs font-medium text-muted">Exercise</label>
                      <input
                        type="text"
                        list={`sugg-${ex.id}`}
                        value={ex.exercise}
                        onChange={(e) => updateField(ex.id, "exercise", e.target.value)}
                        placeholder="e.g. Bench Press"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                      <datalist id={`sugg-${ex.id}`}>
                        {suggestions.map((s) => <option key={s} value={s} />)}
                      </datalist>
                    </div>

                    {/* Muscle group */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Muscle Group</label>
                      <select
                        value={ex.muscle_group}
                        onChange={(e) => updateField(ex.id, "muscle_group", e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      >
                        {MUSCLE_GROUPS.map((mg) => <option key={mg} value={mg}>{mg}</option>)}
                      </select>
                    </div>

                    {/* Sets */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Sets</label>
                      <input
                        type="number"
                        value={ex.sets}
                        onChange={(e) => handleSetsChange(ex.id, e.target.value)}
                        placeholder="3"
                        min="1"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>

                    {/* Single-set mode: show reps + weight inline */}
                    {!isMultiSet && (
                      <>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted">
                            Reps <span className="text-muted/60">(or secs)</span>
                          </label>
                          <input
                            type="number"
                            value={ex.reps}
                            onChange={(e) => updateField(ex.id, "reps", e.target.value)}
                            placeholder="10"
                            min="1"
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted">
                            Weight (lb) <span className="text-muted/60">optional</span>
                          </label>
                          <input
                            type="number"
                            value={ex.weight}
                            onChange={(e) => updateField(ex.id, "weight", e.target.value)}
                            placeholder="bodyweight"
                            min="0"
                            step="0.5"
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                          />
                        </div>
                      </>
                    )}

                    {/* Notes */}
                    <div className={isMultiSet ? "col-span-2" : "col-span-2"}>
                      <label className="mb-1 block text-xs font-medium text-muted">
                        Notes <span className="text-muted/60">optional</span>
                      </label>
                      <input
                        type="text"
                        value={ex.notes}
                        onChange={(e) => updateField(ex.id, "notes", e.target.value)}
                        placeholder="e.g. 4s negatives"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>
                  </div>

                  {/* Per-set rows (multi-set mode) */}
                  {isMultiSet && (
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="grid grid-cols-[32px_1fr_1fr] gap-2 px-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted"></span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">Reps</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">Weight (lb)</span>
                      </div>
                      {ex.set_details.map((s, i) => (
                        <div key={i} className={`grid grid-cols-[32px_1fr_1fr] items-center gap-2 rounded-xl px-1 py-1 ${
                          ex.is_drop_set && i > 0 ? "border-l-2 border-orange-500/30 pl-2" : ""
                        }`}>
                          <span className="text-xs font-semibold text-muted">
                            {ex.is_drop_set ? (i === 0 ? "1st" : `↓${i + 1}`) : `S${i + 1}`}
                          </span>
                          <input
                            type="number"
                            value={s.reps}
                            onChange={(e) => updateSetDetail(ex.id, i, "reps", e.target.value)}
                            placeholder="10"
                            min="1"
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                          />
                          <input
                            type="number"
                            value={s.weight}
                            onChange={(e) => updateSetDetail(ex.id, i, "weight", e.target.value)}
                            placeholder="bw"
                            min="0"
                            step="0.5"
                            className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                              ex.is_drop_set
                                ? "border-orange-500/30 bg-orange-500/5 focus:ring-orange-500/30"
                                : "border-border bg-background focus:ring-accent/50"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
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
