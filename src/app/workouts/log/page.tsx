"use client";

import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SESSION_TYPES = ["Push", "Pull", "Legs", "Skill", "Cardio", "Mixed"] as const;
const MUSCLE_GROUPS = ["Abs", "Pull", "Push", "Legs", "Full Body"] as const;

const SESSION_TO_MUSCLE: Record<string, string> = {
  Push: "Push", Pull: "Pull", Legs: "Legs",
  Skill: "Pull", Cardio: "Legs", Mixed: "Full Body",
};

const EXERCISE_SUGGESTIONS: Record<string, string[]> = {
  Abs: ["Hanging Leg Raises", "Dragon Flag", "Ab Wheel", "Plank", "Hollow Body Hold", "L-Sit", "Toes to Bar", "V-Ups", "Flutter Kicks", "Dead Bug"],
  Pull: ["Pull-Ups", "Wide Grip Pull-Up", "Archer Pull-Up", "Chin-Ups", "Australian Pull-Ups", "Muscle-Up", "Muscle-Up Negative", "Rows", "Cable Rows", "Lat Pulldown", "Face Pulls", "Deadlift", "Hammer Curls"],
  Push: ["Push-Ups", "Dips", "Bench Press", "Overhead Press", "Incline Press", "Iron Cross", "Tricep Pushdown", "Diamond Push-Ups", "Pike Push-Ups", "Chest Fly", "Lateral Raises"],
  Legs: ["Squats", "Lunges", "Romanian Deadlift", "Leg Press", "Calf Raises", "Bulgarian Split Squat", "Hip Thrust", "Leg Extensions", "Nordic Curl", "Hamstring Curl Machine", "Box Jumps", "Hip Abduction", "Hip Adduction", "Pistol Squats", "Sumo Squat", "Wall Sit", "Glute Kickback"],
  "Full Body": ["Burpees", "Thrusters", "Turkish Get-Up", "Kettlebell Swings", "Man Makers"],
};

// One weight entry per set (reps are global)
interface SetWeight { weight: string; }

type ExMode = "standard" | "drop";

interface ExerciseRow {
  id: number;
  mode: ExMode;
  exercise: string;
  muscle_group: string;
  notes: string;
  // Standard fields
  sets: string;
  reps: string;
  set_weights: SetWeight[]; // one per set; length === parseInt(sets) when sets > 1
  // Drop set fields
  drop_start: string;
  drop_per_stop: string;
  drop_end: string;
  drop_reps: string;
}

let nextId = 1;
function newExercise(muscle: string): ExerciseRow {
  return {
    id: nextId++, mode: "standard",
    exercise: "", muscle_group: muscle, notes: "",
    sets: "", reps: "", set_weights: [],
    drop_start: "", drop_per_stop: "", drop_end: "", drop_reps: "",
  };
}

function buildDropSeq(start: number, drop: number, end: number): number[] {
  if (!start || !drop || drop <= 0 || end < 0) return [];
  const seq: number[] = [];
  let w = start;
  while (w >= end - 0.01) { seq.push(Math.round(w * 10) / 10); w -= drop; }
  return seq;
}

export default function LogWorkoutPage() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [sessionType, setSessionType] = useState("Push");
  const [date, setDate] = useState(today);
  const [duration, setDuration] = useState("");
  const [exercises, setExercises] = useState<ExerciseRow[]>([newExercise("Push")]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateEx(id: number, patch: Partial<ExerciseRow>) {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }

  function handleSessionType(type: string) {
    setSessionType(type);
    const m = SESSION_TO_MUSCLE[type] ?? "Full Body";
    setExercises(prev => prev.map(e => e.exercise === "" ? { ...e, muscle_group: m } : e));
  }

  function handleSets(id: number, val: string) {
    const n = parseInt(val) || 0;
    setExercises(prev => prev.map(e => {
      if (e.id !== id) return e;
      // Resize set_weights to match new set count
      const sw: SetWeight[] = n > 1
        ? Array.from({ length: n }, (_, i) => e.set_weights[i] ?? { weight: "" })
        : [];
      return { ...e, sets: val, set_weights: sw };
    }));
  }

  function handleSetWeight(id: number, idx: number, val: string) {
    setExercises(prev => prev.map(e => {
      if (e.id !== id) return e;
      const sw = e.set_weights.map((s, i) => i === idx ? { weight: val } : s);
      return { ...e, set_weights: sw };
    }));
  }

  function setMode(id: number, mode: ExMode) {
    setExercises(prev => prev.map(e =>
      e.id !== id ? e : { ...e, mode, sets: "", set_weights: [], reps: "" }
    ));
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    const valid = exercises.filter(e => {
      if (!e.exercise.trim()) return false;
      if (e.mode === "drop") return e.drop_start && e.drop_per_stop && e.drop_end && e.drop_reps;
      return e.sets && e.reps;
    });
    if (!valid.length) { setError("Add at least one complete exercise."); return; }

    setSubmitting(true);
    try {
      const payload = valid.map(ex => {
        if (ex.mode === "drop") {
          const start = parseFloat(ex.drop_start);
          const dropPer = parseFloat(ex.drop_per_stop);
          const end = parseFloat(ex.drop_end);
          const repsPerStop = parseInt(ex.drop_reps) || 0;
          const seq = buildDropSeq(start, dropPer, end);
          return {
            exercise: ex.exercise.trim(),
            muscle_group: ex.muscle_group,
            sets: 1,
            reps: seq.length * repsPerStop,
            weight: start,
            notes: ex.notes || null,
            is_drop_set: true,
            set_data: seq.map((w, i) => ({ set: i + 1, reps: repsPerStop, weight: w })),
          };
        }
        // Standard
        const setsN = parseInt(ex.sets) || 1;
        const repsN = parseInt(ex.reps) || 0;
        const isMulti = setsN > 1 && ex.set_weights.length > 0;
        const set_data = isMulti
          ? ex.set_weights.map((s, i) => ({
              set: i + 1, reps: repsN,
              weight: s.weight ? parseFloat(s.weight) : null,
            }))
          : null;
        const summaryWeight = isMulti
          ? (Math.max(...ex.set_weights.map(s => parseFloat(s.weight) || 0)) || null)
          : null;
        return {
          exercise: ex.exercise.trim(),
          muscle_group: ex.muscle_group,
          sets: setsN, reps: repsN,
          weight: summaryWeight,
          notes: ex.notes || null,
          is_drop_set: false,
          set_data,
        };
      });

      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_type: sessionType, date, duration_min: duration ? parseInt(duration) : null, exercises: payload }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? "Failed"); }
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
          <Link href="/workouts" className="rounded-xl p-2 text-muted transition hover:bg-surface-hover hover:text-foreground">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-semibold">Log Session</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Session info */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">Session</h2>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">Type</label>
              <div className="flex flex-wrap gap-2">
                {SESSION_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => handleSessionType(t)}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${sessionType === t ? "bg-accent text-background" : "bg-surface-hover text-muted hover:text-foreground"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Duration (min) <span className="text-xs font-normal text-muted">optional</span></label>
                <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="60" min="1"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
              </div>
            </div>
          </div>

          {/* Exercises */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Exercises</h2>
              <p className="text-xs text-muted">Seconds as reps for TUT</p>
            </div>

            {exercises.map((ex, idx) => {
              const suggestions = EXERCISE_SUGGESTIONS[ex.muscle_group] ?? [];
              const setsN = parseInt(ex.sets) || 0;
              const isMultiSet = ex.mode === "standard" && setsN > 1;

              // Drop set preview
              const ds = ex.mode === "drop" && ex.drop_start && ex.drop_per_stop && ex.drop_end
                ? buildDropSeq(parseFloat(ex.drop_start), parseFloat(ex.drop_per_stop), parseFloat(ex.drop_end))
                : [];
              const dsTotalReps = ds.length * (parseInt(ex.drop_reps) || 0);

              return (
                <div key={ex.id} className={`rounded-2xl border bg-surface p-4 transition-colors ${ex.mode === "drop" ? "border-orange-500/40" : "border-border"}`}>

                  {/* Header */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted">#{idx + 1}</span>
                      {ex.mode === "drop" && (
                        <span className="rounded-md bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400">DROP SET</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Mode toggle */}
                      <button type="button"
                        onClick={() => setMode(ex.id, ex.mode === "drop" ? "standard" : "drop")}
                        className={`rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                          ex.mode === "drop"
                            ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                            : "text-muted hover:bg-surface-hover hover:text-foreground"
                        }`}>
                        {ex.mode === "drop" ? "Drop ✓" : "Drop Set"}
                      </button>
                      {exercises.length > 1 && (
                        <button type="button" onClick={() => setExercises(prev => prev.filter(e => e.id !== ex.id))}
                          className="rounded-lg p-1 text-muted transition hover:bg-surface-hover hover:text-foreground">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Exercise + muscle group + notes — always shown */}
                  <div className="mb-3 grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs font-medium text-muted">Exercise</label>
                      <input type="text" list={`sugg-${ex.id}`} value={ex.exercise}
                        onChange={e => updateEx(ex.id, { exercise: e.target.value })}
                        placeholder="e.g. Bench Press"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
                      <datalist id={`sugg-${ex.id}`}>{suggestions.map(s => <option key={s} value={s} />)}</datalist>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Muscle Group</label>
                      <select value={ex.muscle_group} onChange={e => updateEx(ex.id, { muscle_group: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50">
                        {MUSCLE_GROUPS.map(mg => <option key={mg} value={mg}>{mg}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Notes <span className="text-muted/60">optional</span></label>
                      <input type="text" value={ex.notes} onChange={e => updateEx(ex.id, { notes: e.target.value })}
                        placeholder="e.g. slow negatives"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
                    </div>
                  </div>

                  {/* ── MODE SWITCHER (ternary guarantees exactly one branch renders) ── */}
                  {ex.mode === "drop" ? (
                    <div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-orange-400">Start Weight (lb)</label>
                          <input type="number" value={ex.drop_start} onChange={e => updateEx(ex.id, { drop_start: e.target.value })}
                            placeholder="330" min="0" step="5"
                            className="w-full rounded-xl border border-orange-400 bg-orange-500/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-orange-400">Drop Per Stop (lb)</label>
                          <input type="number" value={ex.drop_per_stop} onChange={e => updateEx(ex.id, { drop_per_stop: e.target.value })}
                            placeholder="30" min="1" step="5"
                            className="w-full rounded-xl border border-orange-400 bg-orange-500/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-orange-400">End Weight (lb)</label>
                          <input type="number" value={ex.drop_end} onChange={e => updateEx(ex.id, { drop_end: e.target.value })}
                            placeholder="50" min="0" step="5"
                            className="w-full rounded-xl border border-orange-400 bg-orange-500/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-orange-400">Reps Per Stop</label>
                          <input type="number" value={ex.drop_reps} onChange={e => updateEx(ex.id, { drop_reps: e.target.value })}
                            placeholder="10" min="1"
                            className="w-full rounded-xl border border-orange-400 bg-orange-500/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        </div>
                      </div>

                      {ds.length > 0 && (
                        <div className="mt-3 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-orange-400">
                            {ds.length} stops · {dsTotalReps} total reps
                          </p>
                          <p className="text-sm text-muted">
                            {ds.map((w, i) => (
                              <span key={i}>
                                <span className="font-medium text-foreground">{w}</span>
                                {i < ds.length - 1 && <span className="text-orange-400"> → </span>}
                              </span>
                            ))}
                            <span className="ml-1 text-muted/60">lb</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ── STANDARD MODE ── */
                    <div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted">Sets</label>
                          <input type="number" value={ex.sets} onChange={e => handleSets(ex.id, e.target.value)}
                            placeholder="3" min="1"
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted">Reps</label>
                          <input type="number" value={ex.reps} onChange={e => updateEx(ex.id, { reps: e.target.value })}
                            placeholder="10" min="1"
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
                        </div>
                        {!isMultiSet && (
                          <div>
                            <label className="mb-1 block text-xs font-medium text-muted">Weight (lb)</label>
                            <input type="number" value={ex.set_weights[0]?.weight ?? ""} min="0" step="0.5"
                              onChange={e => handleSetWeight(ex.id, 0, e.target.value)}
                              placeholder="bw"
                              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
                          </div>
                        )}
                      </div>
                      {isMultiSet && (
                        <div className="mt-3">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">Weight per set (lb)</p>
                          <div className="grid grid-cols-3 gap-2">
                            {ex.set_weights.map((sw, i) => (
                              <div key={i}>
                                <label className="mb-1 block text-[10px] text-muted">Set {i + 1}</label>
                                <input type="number" value={sw.weight}
                                  onChange={e => handleSetWeight(ex.id, i, e.target.value)}
                                  placeholder="bw" min="0" step="0.5"
                                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {exercises.length < 8 && (
              <button type="button" onClick={() => setExercises(prev => [...prev, newExercise(SESSION_TO_MUSCLE[sessionType] ?? "Full Body")])}
                className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm text-muted transition hover:border-accent/40 hover:text-accent">
                <Plus size={16} /> Add Exercise
              </button>
            )}
          </div>

          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

          <button type="submit" disabled={submitting}
            className="rounded-xl bg-accent py-3 text-sm font-semibold text-background transition hover:bg-accent-dark disabled:opacity-50">
            {submitting ? "Saving..." : "Save Session"}
          </button>
        </form>
      </div>
    </div>
  );
}
