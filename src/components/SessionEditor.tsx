"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MUSCLE_GROUPS = ["Abs", "Pull", "Push", "Legs", "Full Body"] as const;

const EXERCISE_SUGGESTIONS: Record<string, string[]> = {
  Abs: ["Hanging Leg Raises", "Dragon Flag", "Ab Wheel", "Plank", "Hollow Body Hold", "L-Sit", "Toes to Bar", "V-Ups", "Flutter Kicks", "Dead Bug"],
  Pull: ["Pull-Ups", "Wide Grip Pull-Up", "Archer Pull-Up", "Chin-Ups", "Australian Pull-Ups", "Muscle-Up", "Muscle-Up Negative", "Rows", "Cable Rows", "Lat Pulldown", "Face Pulls", "Deadlift", "Hammer Curls"],
  Push: ["Push-Ups", "Dips", "Bench Press", "Overhead Press", "Incline Press", "Iron Cross", "Tricep Pushdown", "Diamond Push-Ups", "Pike Push-Ups", "Chest Fly", "Lateral Raises"],
  Legs: ["Squats", "Lunges", "Romanian Deadlift", "Leg Press", "Calf Raises", "Bulgarian Split Squat", "Hip Thrust", "Leg Extensions", "Nordic Curl", "Hamstring Curl Machine", "Box Jumps", "Hip Abduction", "Hip Adduction", "Pistol Squats", "Sumo Squat", "Wall Sit", "Glute Kickback"],
  "Full Body": ["Burpees", "Thrusters", "Turkish Get-Up", "Kettlebell Swings", "Man Makers"],
};

interface SetDetail { reps: string; weight: string; }

interface ExRow {
  id: string;
  exercise: string;
  muscle_group: string;
  sets: number | string;
  reps: number | string;
  weight: number | string | null;
  notes: string | null;
  session_type: string;
  is_drop_set: boolean;
  set_data: Array<{ set: number; reps: number; weight: number | null }> | null;
  // standard multi-set UI state
  set_details: SetDetail[];
  // drop set UI state
  drop_start: string;
  drop_per_stop: string;
  drop_end: string;
  drop_reps: string;
  isNew?: boolean;
  deleted?: boolean;
}

let tmpId = -1;

function buildDropSeq(start: number, drop: number, end: number): number[] {
  if (!start || !drop || drop <= 0 || end < 0) return [];
  const seq: number[] = [];
  let w = start;
  while (w >= end - 0.01) { seq.push(Math.round(w * 10) / 10); w -= drop; }
  return seq;
}

/** Reverse-engineer drop fields from stored set_data */
function inferDropFields(
  set_data: Array<{ reps: number; weight: number | null }> | null
): { drop_start: string; drop_per_stop: string; drop_end: string; drop_reps: string } {
  if (!set_data || set_data.length === 0) {
    return { drop_start: "", drop_per_stop: "", drop_end: "", drop_reps: "" };
  }
  const weights = set_data.map((s) => s.weight ?? 0);
  const reps = set_data[0]?.reps ?? 0;
  const start = weights[0] ?? 0;
  const end = weights[weights.length - 1] ?? 0;
  const dropPer = weights.length > 1 ? Math.round((start - end) / (weights.length - 1)) : 0;
  return {
    drop_start: start > 0 ? String(start) : "",
    drop_per_stop: dropPer > 0 ? String(dropPer) : "",
    drop_end: end >= 0 ? String(end) : "",
    drop_reps: reps > 0 ? String(reps) : "",
  };
}

function toSetDetails(
  set_data: Array<{ set: number; reps: number; weight: number | null }> | null,
  sets: number | string,
  reps: number | string,
  weight: number | string | null
): SetDetail[] {
  const count = parseInt(String(sets)) || 0;
  if (count <= 1) return [];
  if (set_data && set_data.length > 0) {
    return set_data.map((s) => ({
      reps: String(s.reps),
      weight: s.weight != null ? String(s.weight) : "",
    }));
  }
  return Array.from({ length: count }, () => ({
    reps: reps != null ? String(reps) : "",
    weight: weight != null ? String(weight) : "",
  }));
}

interface Props {
  date: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialExercises: any[];
}

export default function SessionEditor({ date, initialExercises }: Props) {
  const router = useRouter();

  const [rows, setRows] = useState<ExRow[]>(
    initialExercises.map((ex) => {
      const dropFields = ex.is_drop_set
        ? inferDropFields(ex.set_data ?? null)
        : { drop_start: "", drop_per_stop: "", drop_end: "", drop_reps: "" };

      const setDetails = !ex.is_drop_set
        ? toSetDetails(ex.set_data ?? null, ex.sets, ex.reps, ex.weight)
        : [];

      return {
        ...ex,
        sets: String(ex.sets),
        reps: String(ex.reps),
        weight: ex.weight != null ? String(ex.weight) : "",
        is_drop_set: ex.is_drop_set ?? false,
        set_data: ex.set_data ?? null,
        set_details: setDetails,
        ...dropFields,
      };
    })
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const sessionType = initialExercises[0]?.session_type ?? "Push";
  const visible = rows.filter((r) => !r.deleted);

  function update(id: string, patch: Partial<ExRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function toggleDropSet(id: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (!r.is_drop_set) {
          // switching TO drop mode — clear standard fields
          return { ...r, is_drop_set: true, sets: "", set_details: [], reps: "" };
        } else {
          // switching back to standard
          return { ...r, is_drop_set: false, drop_start: "", drop_per_stop: "", drop_end: "", drop_reps: "" };
        }
      })
    );
  }

  function handleSetsChange(id: string, value: string) {
    const count = parseInt(value) || 0;
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const details =
          count > 1
            ? r.set_details.length > 0
              ? (() => {
                  const existing = [...r.set_details];
                  while (existing.length < count) existing.push({ reps: String(r.reps), weight: String(r.weight ?? "") });
                  return existing.slice(0, count);
                })()
              : Array.from({ length: count }, () => ({
                  reps: String(r.reps),
                  weight: String(r.weight ?? ""),
                }))
            : [];
        return { ...r, sets: value, set_details: details };
      })
    );
  }

  function updateSetDetail(rowId: string, setIdx: number, field: keyof SetDetail, value: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const updated = r.set_details.map((s, i) => (i === setIdx ? { ...s, [field]: value } : s));
        return { ...r, set_details: updated };
      })
    );
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
      is_drop_set: false,
      set_data: null,
      set_details: [],
      drop_start: "", drop_per_stop: "", drop_end: "", drop_reps: "",
      isNew: true,
    };
    setRows((prev) => [...prev, newRow]);
  }

  function markDeleted(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, deleted: true } : r)));
  }

  function buildPayload(row: ExRow) {
    if (row.is_drop_set) {
      const start = parseFloat(row.drop_start);
      const dropPer = parseFloat(row.drop_per_stop);
      const end = parseFloat(row.drop_end);
      const repsPerStop = parseInt(row.drop_reps) || 0;
      const seq = buildDropSeq(start, dropPer, end);
      return {
        exercise: row.exercise.trim(),
        muscle_group: row.muscle_group,
        sets: 1,
        reps: seq.length * repsPerStop,
        weight: start || null,
        notes: row.notes || null,
        is_drop_set: true,
        set_data: seq.map((w, i) => ({ set: i + 1, reps: repsPerStop, weight: w })),
      };
    }

    const setsCount = parseInt(String(row.sets)) || 1;
    const isMultiSet = row.set_details.length > 0;
    const set_data = isMultiSet
      ? row.set_details.map((s, i) => ({
          set: i + 1,
          reps: parseInt(s.reps) || 0,
          weight: s.weight ? parseFloat(s.weight) : null,
        }))
      : null;
    const summaryReps = isMultiSet
      ? Math.round(row.set_details.reduce((a, s) => a + (parseInt(s.reps) || 0), 0) / setsCount)
      : parseInt(String(row.reps)) || 0;
    const summaryWeight = isMultiSet
      ? Math.max(...row.set_details.map((s) => parseFloat(s.weight) || 0)) || null
      : row.weight !== "" && row.weight != null ? parseFloat(String(row.weight)) : null;

    return {
      exercise: row.exercise.trim(),
      muscle_group: row.muscle_group,
      sets: setsCount,
      reps: summaryReps,
      weight: summaryWeight,
      notes: row.notes || null,
      is_drop_set: false,
      set_data,
    };
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
              body: JSON.stringify({ session_type: row.session_type, date, exercises: [buildPayload(row)] }),
            })
          );
        } else if (!row.deleted && !row.isNew) {
          promises.push(
            fetch(`/api/workouts/${row.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(buildPayload(row)),
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
        const setsN = parseInt(String(row.sets)) || 0;
        const isMultiSet = !row.is_drop_set && setsN > 1;

        // Drop preview
        const ds = row.is_drop_set && row.drop_start && row.drop_per_stop && row.drop_end
          ? buildDropSeq(parseFloat(row.drop_start), parseFloat(row.drop_per_stop), parseFloat(row.drop_end))
          : [];
        const dsTotalReps = ds.length * (parseInt(row.drop_reps) || 0);

        const isWeighted = row.is_drop_set
          ? !!row.drop_start
          : isMultiSet
          ? row.set_details.some((s) => s.weight.trim() !== "")
          : String(row.weight ?? "").trim() !== "";

        return (
          <div
            key={row.id}
            className={`rounded-2xl border bg-surface p-4 transition-colors ${
              row.is_drop_set
                ? "border-orange-500/40"
                : isWeighted
                ? "border-accent/40"
                : "border-border"
            } ${row.isNew ? "border-dashed" : ""}`}
          >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted">
                  #{idx + 1}{row.isNew ? " — new" : ""}
                </span>
                {row.is_drop_set && (
                  <span className="rounded-md bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                    DROP SET
                  </span>
                )}
                {!row.is_drop_set && isWeighted && (
                  <span className="rounded-md bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                    WEIGHTED
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleDropSet(row.id)}
                  className={`rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                    row.is_drop_set
                      ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                      : "text-muted hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  {row.is_drop_set ? "Drop ✓" : "Drop Set"}
                </button>
                <button
                  type="button"
                  onClick={() => markDeleted(row.id)}
                  className="rounded-lg p-1 text-muted transition hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Always visible: Exercise + Muscle Group + Notes */}
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted">Exercise</label>
                <input
                  type="text"
                  list={`sugg-edit-${row.id}`}
                  value={row.exercise}
                  onChange={(e) => update(row.id, { exercise: e.target.value })}
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
                  onChange={(e) => update(row.id, { muscle_group: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {MUSCLE_GROUPS.map((mg) => <option key={mg} value={mg}>{mg}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  Notes <span className="text-muted/60">optional</span>
                </label>
                <input
                  type="text"
                  value={row.notes ?? ""}
                  onChange={(e) => update(row.id, { notes: e.target.value })}
                  placeholder="e.g. slow negatives"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            </div>

            {/* ── MODE SWITCHER ── */}
            {row.is_drop_set ? (
              <div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-orange-400">Start Weight (lb)</label>
                    <input
                      type="number" value={row.drop_start} placeholder="330" min="0" step="5"
                      onChange={(e) => update(row.id, { drop_start: e.target.value })}
                      className="w-full rounded-xl border border-orange-400 bg-orange-500/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-orange-400">Drop Per Stop (lb)</label>
                    <input
                      type="number" value={row.drop_per_stop} placeholder="30" min="1" step="5"
                      onChange={(e) => update(row.id, { drop_per_stop: e.target.value })}
                      className="w-full rounded-xl border border-orange-400 bg-orange-500/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-orange-400">End Weight (lb)</label>
                    <input
                      type="number" value={row.drop_end} placeholder="50" min="0" step="5"
                      onChange={(e) => update(row.id, { drop_end: e.target.value })}
                      className="w-full rounded-xl border border-orange-400 bg-orange-500/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-orange-400">Reps Per Stop</label>
                    <input
                      type="number" value={row.drop_reps} placeholder="10" min="1"
                      onChange={(e) => update(row.id, { drop_reps: e.target.value })}
                      className="w-full rounded-xl border border-orange-400 bg-orange-500/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
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
                    <input
                      type="number" value={row.sets} min="1"
                      onChange={(e) => handleSetsChange(row.id, e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">
                      Reps <span className="text-muted/60">(or secs)</span>
                    </label>
                    <input
                      type="number" value={String(row.reps)} min="1"
                      onChange={(e) => update(row.id, { reps: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                  {!isMultiSet && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">
                        Weight (lb) <span className="text-muted/60">opt</span>
                      </label>
                      <input
                        type="number" value={String(row.weight ?? "")} min="0" step="0.5" placeholder="bw"
                        onChange={(e) => update(row.id, { weight: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>
                  )}
                </div>

                {isMultiSet && (
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="grid grid-cols-[32px_1fr_1fr] gap-2 px-1">
                      <span />
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">Reps</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">Weight (lb)</span>
                    </div>
                    {row.set_details.map((s, i) => (
                      <div key={i} className="grid grid-cols-[32px_1fr_1fr] items-center gap-2 px-1">
                        <span className="text-xs font-semibold text-muted">S{i + 1}</span>
                        <input
                          type="number" value={s.reps} placeholder="10" min="1"
                          onChange={(e) => updateSetDetail(row.id, i, "reps", e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                        <input
                          type="number" value={s.weight} placeholder="bw" min="0" step="0.5"
                          onChange={(e) => updateSetDetail(row.id, i, "weight", e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
