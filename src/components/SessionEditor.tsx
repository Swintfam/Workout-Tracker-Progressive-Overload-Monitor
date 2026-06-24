"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MUSCLE_GROUPS = ["Abs", "Pull", "Push", "Legs", "Full Body"] as const;

const EXERCISE_SUGGESTIONS: Record<string, string[]> = {
  Abs: ["Hanging Leg Raises", "Dragon Flag", "Ab Wheel", "Plank", "Hollow Body Hold", "L-Sit", "Toes to Bar", "V-Ups", "Flutter Kicks", "Dead Bug"],
  Pull: ["Pull-Ups", "Wide Grip Pull-Up", "Archer Pull-Up", "Chin-Ups", "Australian Pull-Ups", "Muscle-Up", "Muscle-Up Negative", "Rows", "Cable Rows", "Lat Pulldown", "Face Pulls", "Deadlift", "Hammer Curls"],
  Push: ["Push-Ups", "Dips", "Bench Press", "Overhead Press", "Incline Press", "Iron Cross", "Tricep Pushdown", "Diamond Push-Ups", "Pike Push-Ups", "Chest Fly", "Lateral Raises"],
  Legs: ["Squats", "Lunges", "Romanian Deadlift", "Leg Press", "Calf Raises", "Bulgarian Split Squat", "Hip Thrust", "Leg Extensions", "Hamstring Curl", "Box Jumps"],
  "Full Body": ["Burpees", "Thrusters", "Turkish Get-Up", "Kettlebell Swings", "Man Makers"],
};

interface ExRow {
  id: string;
  exercise: string;
  muscle_group: string;
  sets: number | string;
  reps: number | string;
  weight: number | string | null;
  notes: string | null;
  session_type: string;
  isNew?: boolean;
  deleted?: boolean;
}

let tmpId = -1;

interface Props {
  date: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialExercises: any[];
}

export default function SessionEditor({ date, initialExercises }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<ExRow[]>(
    initialExercises.map((ex) => ({ ...ex, sets: String(ex.sets), reps: String(ex.reps), weight: ex.weight != null ? String(ex.weight) : "" }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const sessionType = initialExercises[0]?.session_type ?? "Push";
  const visible = rows.filter((r) => !r.deleted);

  function update(id: string, field: keyof ExRow, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    const newRow: ExRow = {
      id: String(tmpId--),
      exercise: "",
      muscle_group: sessionType in EXERCISE_SUGGESTIONS ? sessionType : "Pull",
      sets: "",
      reps: "",
      weight: "",
      notes: "",
      session_type: sessionType,
      isNew: true,
    };
    setRows((prev) => [...prev, newRow]);
  }

  function markDeleted(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, deleted: true } : r)));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const promises: Promise<Response>[] = [];

      for (const row of rows) {
        if (row.deleted && !row.isNew) {
          promises.push(fetch(`/api/workouts/${row.id}`, { method: "DELETE" }));
        } else if (!row.deleted && row.isNew && row.exercise.trim()) {
          promises.push(
            fetch("/api/workouts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                session_type: row.session_type,
                date,
                exercises: [{
                  exercise: row.exercise.trim(),
                  muscle_group: row.muscle_group,
                  sets: parseInt(String(row.sets)) || 0,
                  reps: parseInt(String(row.reps)) || 0,
                  weight: row.weight !== "" && row.weight != null ? parseFloat(String(row.weight)) : null,
                  notes: row.notes || null,
                }],
              }),
            })
          );
        } else if (!row.deleted && !row.isNew) {
          promises.push(
            fetch(`/api/workouts/${row.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                exercise: row.exercise.trim(),
                muscle_group: row.muscle_group,
                sets: parseInt(String(row.sets)) || 0,
                reps: parseInt(String(row.reps)) || 0,
                weight: row.weight !== "" && row.weight != null ? parseFloat(String(row.weight)) : null,
                notes: row.notes || null,
              }),
            })
          );
        }
      }

      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) throw new Error("One or more saves failed");

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {visible.length === 0 && (
        <p className="text-sm text-muted">No exercises logged for this day.</p>
      )}

      {visible.map((row, idx) => {
        const suggestions = EXERCISE_SUGGESTIONS[row.muscle_group] ?? [];
        const isWeighted = String(row.weight ?? "").trim() !== "";
        return (
          <div
            key={row.id}
            className={`rounded-2xl border bg-surface p-4 transition-colors ${
              isWeighted ? "border-accent/40" : "border-border"
            } ${row.isNew ? "border-dashed" : ""}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">#{idx + 1}{row.isNew ? " — new" : ""}</span>
              <button
                type="button"
                onClick={() => markDeleted(row.id)}
                className="rounded-lg p-1 text-muted transition hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted">Exercise</label>
                <input
                  type="text"
                  list={`sugg-edit-${row.id}`}
                  value={row.exercise}
                  onChange={(e) => update(row.id, "exercise", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <datalist id={`sugg-edit-${row.id}`}>
                  {suggestions.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Muscle Group</label>
                <select
                  value={row.muscle_group}
                  onChange={(e) => update(row.id, "muscle_group", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {MUSCLE_GROUPS.map((mg) => <option key={mg} value={mg}>{mg}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Sets</label>
                <input
                  type="number"
                  value={row.sets}
                  onChange={(e) => update(row.id, "sets", e.target.value)}
                  min="1"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Reps <span className="text-muted/60">(or secs)</span></label>
                <input
                  type="number"
                  value={row.reps}
                  onChange={(e) => update(row.id, "reps", e.target.value)}
                  min="1"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Weight (lb) <span className="text-muted/60">optional</span></label>
                <input
                  type="number"
                  value={row.weight ?? ""}
                  onChange={(e) => update(row.id, "weight", e.target.value)}
                  min="0"
                  step="0.5"
                  placeholder="bodyweight"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Notes <span className="text-muted/60">optional</span></label>
                <input
                  type="text"
                  value={row.notes ?? ""}
                  onChange={(e) => update(row.id, "notes", e.target.value)}
                  placeholder="e.g. 4s negatives"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addRow}
        className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm text-muted transition hover:border-accent/40 hover:text-accent"
      >
        <Plus size={16} />
        Add Exercise
      </button>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}
      {saved && (
        <p className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">Saved.</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-background transition hover:bg-accent-dark disabled:opacity-50"
      >
        <Save size={16} />
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}
