"use client";
import { ArrowLeft, ChevronDown, ChevronUp, Dumbbell, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ExercisePicker, { ExerciseResult } from "@/components/ExercisePicker";

// ─── Types ────────────────────────────────────────────────────────────────────
type Unit = "lb" | "kg";

interface ActiveSet {
  id: number;
  weight: string;
  reps: string;
  completed: boolean;
}

interface DropConfig {
  start: string;
  dropPer: string;
  end: string;
  repsPerStop: string;
}

interface WorkoutExercise {
  uid: number;
  ex: ExerciseResult;
  unit: Unit;
  mode: "standard" | "drop";
  sets: ActiveSet[];
  drop: DropConfig;
  expanded: boolean;
}

interface PrevData {
  weight: number | null;
  reps: number;
  date: string;
  pr_weight: number | null;
  pr_reps: number;
  pr_date: string;
}

let UID = 1;
let SID = 1;

function newSet(weight = "", reps = ""): ActiveSet {
  return { id: SID++, weight, reps, completed: false };
}

function buildDropSeq(start: number, drop: number, end: number): number[] {
  if (!start || !drop || drop <= 0 || end < 0) return [];
  const seq: number[] = [];
  let w = start;
  while (w >= end - 0.01) { seq.push(Math.round(w * 10) / 10); w -= drop; }
  return seq;
}

function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function toKg(lb: number) { return Math.round((lb / 2.205) * 10) / 10; }
function toLb(kg: number) { return Math.round(kg * 2.205 * 10) / 10; }

// ─── Component ────────────────────────────────────────────────────────────────
export default function LogWorkoutPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prevData, setPrevData] = useState<Record<string, PrevData>>({});
  const startRef = useRef(Date.now());

  // Timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  // Stats
  const totalSets = exercises.reduce((acc, e) =>
    acc + (e.mode === "standard" ? e.sets.filter(s => s.completed).length : 0), 0);
  const totalVol  = exercises.reduce((acc, e) => {
    if (e.mode === "standard") {
      return acc + e.sets.filter(s => s.completed).reduce((a, s) => {
        const w = parseFloat(s.weight) || 0;
        const r = parseInt(s.reps) || 0;
        return a + (e.unit === "kg" ? toLb(w) : w) * r;
      }, 0);
    }
    const ds = e.drop;
    const seq = buildDropSeq(parseFloat(ds.start), parseFloat(ds.dropPer), parseFloat(ds.end));
    const r = parseInt(ds.repsPerStop) || 0;
    return acc + seq.reduce((a, w) => a + (e.unit === "kg" ? toLb(w) : w) * r, 0);
  }, 0);

  // Fetch previous performance for an exercise
  async function fetchPrev(name: string) {
    if (prevData[name]) return;
    try {
      const res = await fetch(`/api/workouts/prev?exercise=${encodeURIComponent(name)}`);
      if (res.ok) {
        const d = await res.json();
        setPrevData(p => ({ ...p, [name]: d }));
      }
    } catch { /* silent */ }
  }

  // Add exercise from picker
  function handleAdd(ex: ExerciseResult) {
    const row: WorkoutExercise = {
      uid: UID++, ex, unit: "lb", mode: "standard",
      sets: [newSet()], drop: { start: "", dropPer: "", end: "", repsPerStop: "" },
      expanded: true,
    };
    setExercises(prev => [...prev, row]);
    setShowPicker(false);
    fetchPrev(ex.name);
  }

  function update(uid: number, patch: Partial<WorkoutExercise>) {
    setExercises(prev => prev.map(e => e.uid === uid ? { ...e, ...patch } : e));
  }

  function adjustSet(uid: number, sid: number, field: "weight" | "reps", dir: 1 | -1) {
    setExercises(prev => prev.map(e => {
      if (e.uid !== uid) return e;
      const step = field === "weight"
        ? (e.unit === "kg" ? 1.25 : 2.5)
        : 1;
      const sets = e.sets.map(s => {
        if (s.id !== sid) return s;
        const cur = parseFloat(s[field]) || 0;
        const next = Math.max(0, Math.round((cur + dir * step) * 10) / 10);
        return { ...s, [field]: String(next) };
      });
      return { ...e, sets };
    }));
  }

  function completeSet(uid: number, sid: number) {
    setExercises(prev => prev.map(e => {
      if (e.uid !== uid) return e;
      const sets = e.sets.map(s => s.id === sid ? { ...s, completed: true } : s);
      // Add a new blank set after completing if this was the last one
      const allDone = sets.every(s => s.completed);
      return { ...e, sets: allDone ? [...sets, newSet(sets[sets.length - 1]?.weight, sets[sets.length - 1]?.reps)] : sets };
    }));
  }

  function removeSet(uid: number, sid: number) {
    setExercises(prev => prev.map(e => {
      if (e.uid !== uid) return e;
      const sets = e.sets.filter(s => s.id !== sid);
      return { ...e, sets: sets.length ? sets : [newSet()] };
    }));
  }

  function toggleUnit(uid: number) {
    setExercises(prev => prev.map(e => {
      if (e.uid !== uid) return e;
      const newUnit: Unit = e.unit === "lb" ? "kg" : "lb";
      const sets = e.sets.map(s => {
        const w = parseFloat(s.weight);
        if (!w) return s;
        return { ...s, weight: String(e.unit === "lb" ? toKg(w) : toLb(w)) };
      });
      return { ...e, unit: newUnit, sets };
    }));
  }

  const handleFinish = useCallback(async () => {
    const valid = exercises.filter(e => {
      if (e.mode === "drop") {
        return e.drop.start && e.drop.dropPer && e.drop.end && e.drop.repsPerStop;
      }
      return e.sets.some(s => s.completed && (s.weight || s.reps));
    });
    if (!valid.length) { setError("Complete at least one set before finishing."); return; }
    setSubmitting(true);
    setError(null);

    // Detect session type from exercises
    const bodyParts = [...new Set(valid.map(e => e.ex.bodyPart))];
    let sessionType = "Mixed";
    if (bodyParts.length === 1) {
      const bp = bodyParts[0];
      if (bp === "chest" || bp === "shoulders" || bp === "upper arms") sessionType = "Push";
      else if (bp === "back" || bp === "upper arms") sessionType = "Pull";
      else if (bp === "upper legs" || bp === "lower legs") sessionType = "Legs";
      else if (bp === "waist") sessionType = "Abs";
      else if (bp === "cardio") sessionType = "Cardio";
    }

    try {
      const payload = valid.map(e => {
        if (e.mode === "drop") {
          const start = parseFloat(e.drop.start);
          const dropPer = parseFloat(e.drop.dropPer);
          const end = parseFloat(e.drop.end);
          const repsPerStop = parseInt(e.drop.repsPerStop) || 0;
          const inLb = e.unit === "kg";
          const seq = buildDropSeq(
            inLb ? toLb(start) : start,
            inLb ? toLb(dropPer) : dropPer,
            inLb ? toLb(end) : end,
          );
          return {
            exercise: e.ex.name, muscle_group: e.ex.bodyPart,
            sets: 1, reps: seq.length * repsPerStop,
            weight: inLb ? toLb(start) : start,
            notes: null, is_drop_set: true,
            set_data: seq.map((w, i) => ({ set: i + 1, reps: repsPerStop, weight: w })),
          };
        }
        const doneSets = e.sets.filter(s => s.completed);
        const inLb = e.unit === "kg";
        return {
          exercise: e.ex.name, muscle_group: e.ex.bodyPart,
          sets: doneSets.length,
          reps: parseInt(doneSets[0]?.reps) || 0,
          weight: inLb ? toLb(parseFloat(doneSets[0]?.weight) || 0) : (parseFloat(doneSets[0]?.weight) || null),
          notes: null, is_drop_set: false,
          set_data: doneSets.map((s, i) => ({
            set: i + 1,
            reps: parseInt(s.reps) || 0,
            weight: inLb ? toLb(parseFloat(s.weight) || 0) : (parseFloat(s.weight) || null),
          })),
        };
      });

      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_type: sessionType,
          date: new Date().toISOString().split("T")[0],
          duration_min: Math.round(elapsed / 60) || null,
          exercises: payload,
        }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? "Failed"); }
      router.push("/workouts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }, [exercises, elapsed, router]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {showPicker && <ExercisePicker onAdd={handleAdd} onClose={() => setShowPicker(false)} />}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <Link href="/workouts" className="p-2 rounded-xl text-muted hover:bg-surface-hover hover:text-foreground transition">
            <ArrowLeft size={18} />
          </Link>
          <div className="text-center">
            <p className="text-sm font-semibold">Log Workout</p>
            <p className="text-xs text-accent">{fmtTime(elapsed)}</p>
          </div>
          <button
            onClick={handleFinish}
            disabled={submitting}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-background transition hover:bg-accent-dark disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Finish"}
          </button>
        </div>

        {/* Live stats bar */}
        <div className="flex items-center gap-6 px-6 pb-3 max-w-2xl mx-auto">
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wide">Duration</p>
            <p className="text-sm font-semibold text-accent">{fmtTime(elapsed)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wide">Volume</p>
            <p className="text-sm font-semibold">{Math.round(totalVol).toLocaleString()} lb</p>
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wide">Sets</p>
            <p className="text-sm font-semibold">{totalSets}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-3">
        {/* Empty state */}
        {exercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Dumbbell size={48} className="text-muted/40" />
            <div className="text-center">
              <p className="font-semibold text-foreground">Get started</p>
              <p className="text-sm text-muted mt-1">Add an exercise to start your workout</p>
            </div>
          </div>
        )}

        {/* Exercise cards */}
        {exercises.map((e, idx) => {
          const prev = prevData[e.ex.name];
          const isExpanded = e.expanded;
          const activeSet = e.mode === "standard" ? e.sets.find(s => !s.completed) : null;
          const doneSets  = e.mode === "standard" ? e.sets.filter(s => s.completed) : [];
          const ds = e.mode === "drop" && e.drop.start && e.drop.dropPer && e.drop.end
            ? buildDropSeq(parseFloat(e.drop.start), parseFloat(e.drop.dropPer), parseFloat(e.drop.end))
            : [];

          return (
            <div key={e.uid} className={`rounded-2xl border bg-surface overflow-hidden transition-colors ${e.mode === "drop" ? "border-orange-500/40" : "border-border"}`}>
              {/* Exercise header */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                onClick={() => update(e.uid, { expanded: !isExpanded })}
              >
                {e.ex.gifUrl && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-hover flex-shrink-0 border border-border">
                    <img src={e.ex.gifUrl} alt={e.ex.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold capitalize truncate">{e.ex.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted capitalize">{e.ex.target}</span>
                    <span className="text-muted/40">·</span>
                    <span className="text-xs text-muted capitalize">{e.ex.equipment}</span>
                    {e.mode === "drop" && (
                      <span className="rounded-md bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-bold text-orange-400">DROP</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={ev => { ev.stopPropagation(); setExercises(prev => prev.filter(x => x.uid !== e.uid)); }}
                    className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition"
                  >
                    <Trash2 size={14} />
                  </button>
                  {isExpanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border">
                  {/* Mode toggle + unit toggle */}
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50">
                    <button
                      onClick={() => update(e.uid, { mode: e.mode === "drop" ? "standard" : "drop", sets: [newSet()] })}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                        e.mode === "drop"
                          ? "bg-orange-500/20 text-orange-400"
                          : "text-muted hover:bg-surface-hover hover:text-foreground"
                      }`}
                    >
                      Drop Set
                    </button>
                    <div className="ml-auto flex rounded-lg overflow-hidden border border-border">
                      <button
                        onClick={() => e.unit !== "lb" && toggleUnit(e.uid)}
                        className={`px-2.5 py-1 text-[11px] font-semibold transition ${e.unit === "lb" ? "bg-accent text-background" : "text-muted"}`}
                      >LB</button>
                      <button
                        onClick={() => e.unit !== "kg" && toggleUnit(e.uid)}
                        className={`px-2.5 py-1 text-[11px] font-semibold transition ${e.unit === "kg" ? "bg-accent text-background" : "text-muted"}`}
                      >KG</button>
                    </div>
                  </div>

                  {/* ── STANDARD MODE ── */}
                  {e.mode === "standard" && (
                    <div>
                      {/* Completed sets */}
                      {doneSets.map((s, i) => (
                        <div key={s.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
                          <span className="text-xs text-muted">Set {i + 1}</span>
                          <span className="text-sm font-medium">{s.weight || "BW"} {e.unit} × {s.reps} reps</span>
                          <button onClick={() => removeSet(e.uid, s.id)} className="text-muted hover:text-foreground">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}

                      {/* Active set */}
                      {activeSet && (
                        <div className="px-4 py-4">
                          <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-3">
                            Set {doneSets.length + 1}
                          </p>
                          <div className="flex gap-4 mb-4">
                            {/* Weight */}
                            <div className="flex-1">
                              <p className="text-[10px] text-muted uppercase tracking-wide mb-2">Weight ({e.unit})</p>
                              <div className="flex items-center gap-0">
                                <button
                                  onClick={() => adjustSet(e.uid, activeSet.id, "weight", -1)}
                                  className="w-11 h-14 rounded-l-xl bg-surface-hover text-foreground text-xl font-light flex items-center justify-center active:bg-border transition"
                                >−</button>
                                <div className="flex-1 h-14 bg-surface-hover flex items-center justify-center">
                                  <input
                                    type="number"
                                    value={activeSet.weight}
                                    onChange={ev => setExercises(prev => prev.map(ex =>
                                      ex.uid !== e.uid ? ex : {
                                        ...ex, sets: ex.sets.map(s => s.id === activeSet.id ? { ...s, weight: ev.target.value } : s)
                                      }
                                    ))}
                                    className="w-full text-center text-3xl font-semibold bg-transparent text-foreground focus:outline-none"
                                    placeholder="0"
                                    step="0.5"
                                  />
                                </div>
                                <button
                                  onClick={() => adjustSet(e.uid, activeSet.id, "weight", 1)}
                                  className="w-11 h-14 rounded-r-xl bg-surface-hover text-foreground text-xl font-light flex items-center justify-center active:bg-border transition"
                                >+</button>
                              </div>
                            </div>
                            {/* Reps */}
                            <div className="flex-1">
                              <p className="text-[10px] text-muted uppercase tracking-wide mb-2">Reps</p>
                              <div className="flex items-center gap-0">
                                <button
                                  onClick={() => adjustSet(e.uid, activeSet.id, "reps", -1)}
                                  className="w-11 h-14 rounded-l-xl bg-surface-hover text-foreground text-xl font-light flex items-center justify-center active:bg-border transition"
                                >−</button>
                                <div className="flex-1 h-14 bg-surface-hover flex items-center justify-center">
                                  <input
                                    type="number"
                                    value={activeSet.reps}
                                    onChange={ev => setExercises(prev => prev.map(ex =>
                                      ex.uid !== e.uid ? ex : {
                                        ...ex, sets: ex.sets.map(s => s.id === activeSet.id ? { ...s, reps: ev.target.value } : s)
                                      }
                                    ))}
                                    className="w-full text-center text-3xl font-semibold bg-transparent text-foreground focus:outline-none"
                                    placeholder="0"
                                    step="1"
                                  />
                                </div>
                                <button
                                  onClick={() => adjustSet(e.uid, activeSet.id, "reps", 1)}
                                  className="w-11 h-14 rounded-r-xl bg-surface-hover text-foreground text-xl font-light flex items-center justify-center active:bg-border transition"
                                >+</button>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => completeSet(e.uid, activeSet.id)}
                            className="w-full py-3.5 rounded-xl bg-accent text-background text-sm font-semibold transition hover:bg-accent-dark active:scale-[0.98]"
                          >
                            ✓ Complete set
                          </button>
                        </div>
                      )}

                      {/* Add set manually */}
                      <button
                        onClick={() => update(e.uid, { sets: [...e.sets, newSet(e.sets.at(-1)?.weight, e.sets.at(-1)?.reps)] })}
                        className="w-full py-3 text-sm text-muted hover:text-foreground border-t border-border/40 transition"
                      >
                        + Add set
                      </button>
                    </div>
                  )}

                  {/* ── DROP SET MODE ── */}
                  {e.mode === "drop" && (
                    <div className="px-4 py-4">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-[10px] text-orange-400 uppercase tracking-wide mb-1 block">Start weight ({e.unit})</label>
                          <input type="number" value={e.drop.start} min="0" step="0.5"
                            onChange={ev => update(e.uid, { drop: { ...e.drop, start: ev.target.value } })}
                            placeholder="100"
                            className="w-full rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-orange-400 uppercase tracking-wide mb-1 block">Drop per stop ({e.unit})</label>
                          <input type="number" value={e.drop.dropPer} min="0.5" step="0.5"
                            onChange={ev => update(e.uid, { drop: { ...e.drop, dropPer: ev.target.value } })}
                            placeholder="10"
                            className="w-full rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-orange-400 uppercase tracking-wide mb-1 block">End weight ({e.unit})</label>
                          <input type="number" value={e.drop.end} min="0" step="0.5"
                            onChange={ev => update(e.uid, { drop: { ...e.drop, end: ev.target.value } })}
                            placeholder="60"
                            className="w-full rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-orange-400 uppercase tracking-wide mb-1 block">Reps per stop</label>
                          <input type="number" value={e.drop.repsPerStop} min="1" step="1"
                            onChange={ev => update(e.uid, { drop: { ...e.drop, repsPerStop: ev.target.value } })}
                            placeholder="8"
                            className="w-full rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                          />
                        </div>
                      </div>
                      {ds.length > 0 && (
                        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3">
                          <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wide mb-1">
                            {ds.length} stops · {ds.length * (parseInt(e.drop.repsPerStop) || 0)} total reps
                          </p>
                          <p className="text-sm text-muted">
                            {ds.map((w, i) => (
                              <span key={i}>
                                <span className="font-medium text-foreground">{w}</span>
                                {i < ds.length - 1 && <span className="text-orange-400"> → </span>}
                              </span>
                            ))}
                            <span className="ml-1 text-muted/60">{e.unit}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Previous performance */}
                  {prev && (
                    <div className="flex gap-0 border-t border-border/40">
                      <div className="flex-1 px-4 py-2.5">
                        <p className="text-[10px] text-muted uppercase tracking-wide">Previous</p>
                        <p className="text-xs font-medium mt-0.5">
                          {prev.weight ? `${prev.weight} lb` : "BW"} × {prev.reps} reps
                        </p>
                        <p className="text-[10px] text-muted">{prev.date}</p>
                      </div>
                      <div className="flex-1 px-4 py-2.5 border-l border-border/40">
                        <p className="text-[10px] text-accent uppercase tracking-wide">All-time best</p>
                        <p className="text-xs font-medium mt-0.5 text-accent">
                          {prev.pr_weight ? `${prev.pr_weight} lb` : "BW"} × {prev.pr_reps} reps
                        </p>
                        <p className="text-[10px] text-muted">{prev.pr_date}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Exercise button */}
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-accent/50 py-4 text-sm font-medium text-accent transition hover:bg-accent/5"
        >
          <Plus size={16} />
          Add Exercise
        </button>

        {/* Discard */}
        <Link
          href="/workouts"
          className="text-center text-sm text-red-400 hover:text-red-300 transition py-2"
        >
          Discard workout
        </Link>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
