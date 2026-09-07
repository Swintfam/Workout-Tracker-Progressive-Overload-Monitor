"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

interface SessionRow {
  date: string;
  exercise: string;
  sets: number;
  reps: number;
  weight: number | null;
  set_data: Array<{ set: number; reps: number; weight: number | null }> | null;
}

interface DayStats {
  sets: number;
  reps: number;
  exercises: number;
  volume: number;
}

const EMPTY_STATS: DayStats = { sets: 0, reps: 0, exercises: 0, volume: 0 };
const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function toYMD(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toYMD(d);
}

function getSundayOf(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() - d.getDay()); // go back to Sunday
  return toYMD(d);
}

function formatWeekLabel(sunday: string): string {
  const sat = addDays(sunday, 6);
  const fmt = (s: string) =>
    new Date(s + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(sunday)} – ${fmt(sat)}`;
}

function computeStats(rows: SessionRow[]): DayStats {
  let sets = 0, reps = 0, vol = 0;
  const names = new Set<string>();
  rows.forEach(r => {
    names.add(r.exercise);
    if (r.set_data && r.set_data.length > 0) {
      sets += r.set_data.length;
      r.set_data.forEach(s => {
        reps += s.reps;
        vol  += s.reps * (s.weight ?? 0);
      });
    } else {
      sets += r.sets;
      reps += r.sets * r.reps;
      vol  += r.sets * r.reps * (r.weight ?? 0);
    }
  });
  return { sets, reps, exercises: names.size, volume: Math.round(vol) };
}

export default function MuscleDetailPage({ params }: { params: { muscle: string } }) {
  const muscle = decodeURIComponent(params.muscle);
  const today  = toYMD(new Date());

  const [weekStart,   setWeekStart]   = useState(() => getSundayOf(today));
  const [selectedDay, setSelectedDay] = useState(today);
  const [history,     setHistory]     = useState<Record<string, SessionRow[]>>({});
  const [loading,     setLoading]     = useState(false);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const fetchHistory = useCallback(async (ws: string) => {
    setLoading(true);
    try {
      const from = ws;
      const to   = addDays(ws, 6);
      const res  = await fetch(
        `/api/body/history?muscle=${encodeURIComponent(muscle)}&from=${from}&to=${to}`
      );
      const data = await res.json();
      setHistory(typeof data === "object" && !Array.isArray(data) ? data : {});
    } catch {
      setHistory({});
    } finally {
      setLoading(false);
    }
  }, [muscle]);

  useEffect(() => { fetchHistory(weekStart); }, [weekStart, fetchHistory]);

  const stats = useMemo(() => {
    const rows = history[selectedDay];
    return rows?.length ? computeStats(rows) : EMPTY_STATS;
  }, [history, selectedDay]);

  const currentWeekSunday = getSundayOf(today);
  const isCurrentWeek     = weekStart === currentWeekSunday;

  const statRows = [
    { label: "Sets",        value: stats.sets      > 0 ? String(stats.sets)                              : "0" },
    { label: "Repetitions", value: stats.reps      > 0 ? String(stats.reps)                              : "0" },
    { label: "Exercises",   value: stats.exercises > 0 ? String(stats.exercises)                         : "0" },
    { label: "Volume",      value: stats.volume    > 0 ? `${stats.volume.toLocaleString()} lb`           : "0 lb" },
    { label: "Duration",    value: "—" },
    { label: "Avg Rest",    value: "—" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* No Sidebar on detail — back arrow suffices on mobile */}

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
          <Link
            href="/body"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-hover transition hover:bg-surface text-foreground shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="flex-1 text-center text-lg font-bold">{muscle}</h1>
          {/* Right spacer to keep title visually centered */}
          <div className="w-9 shrink-0" />
        </header>

        {/* Week navigation */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setWeekStart(ws => addDays(ws, -7))}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-surface-hover transition"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-xs text-muted font-medium">{formatWeekLabel(weekStart)}</span>
          <button
            onClick={() => !isCurrentWeek && setWeekStart(ws => addDays(ws, 7))}
            disabled={isCurrentWeek}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-surface-hover transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Week day strip */}
        <div className="grid grid-cols-7 gap-1 px-3 pb-4">
          {weekDays.map((day, i) => {
            const isSelected = day === selectedDay;
            const isToday    = day === today;
            const isFuture   = day > today;
            const hasData    = (history[day]?.length ?? 0) > 0;
            const dayNum     = parseInt(day.split("-")[2], 10);

            return (
              <button
                key={day}
                onClick={() => !isFuture && setSelectedDay(day)}
                disabled={isFuture}
                className="flex flex-col items-center gap-1 pt-2 pb-1.5 rounded-xl transition disabled:opacity-30"
                style={isSelected ? { backgroundColor: "var(--color-accent)" } : undefined}
              >
                <span
                  className="text-[10px] font-medium leading-none"
                  style={{ color: isSelected ? "var(--color-background)" : "var(--color-muted)" }}
                >
                  {DAY_LETTERS[i]}
                </span>
                <span
                  className={`text-sm font-bold leading-none ${isToday && !isSelected ? "text-accent" : ""}`}
                  style={isSelected ? { color: "var(--color-background)" } : undefined}
                >
                  {dayNum}
                </span>
                {/* data dot */}
                <span
                  className="w-1.5 h-1.5 rounded-full mt-0.5"
                  style={{
                    backgroundColor: hasData
                      ? isSelected ? "var(--color-background)" : "#22c55e"
                      : "transparent",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Stats card */}
        <div className="mx-4 rounded-2xl border border-border bg-surface p-5">
          {loading ? (
            <p className="text-center text-sm text-muted py-4">Loading…</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {statRows.map(({ label, value }) => (
                <div key={label}>
                  <div className="flex items-center gap-0.5 text-xs text-muted mb-0.5">
                    {label}
                    <ChevronRight size={11} className="text-muted/50" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight">{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exercise breakdown for selected day */}
        {!loading && (history[selectedDay]?.length ?? 0) > 0 && (
          <div className="mx-4 mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2">
              Exercises
            </p>
            <div className="rounded-2xl border border-border overflow-hidden">
              {history[selectedDay]!.map((row, i, arr) => {
                const setCount  = row.set_data?.length ?? row.sets;
                const weightStr = row.weight ? ` @ ${row.weight} lb` : "";
                return (
                  <div
                    key={`${row.exercise}-${i}`}
                    className={`px-4 py-3 text-sm ${i < arr.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <p className="font-medium">{row.exercise}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {setCount} {setCount === 1 ? "set" : "sets"}
                      {row.reps > 0 ? ` · ${row.reps} reps` : ""}
                      {weightStr}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
