"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EXERCISE_LIBRARY, type MuscleGroup } from "@/lib/exercises";
import Sidebar from "@/components/Sidebar";
import AnatomyFigure, { type MuscleStatus } from "@/components/AnatomyFigure";

const MUSCLE_LIST: MuscleGroup[] = [
  "Chest", "Shoulders", "Biceps", "Triceps", "Forearms",
  "Abs", "Obliques", "Lower Back",
  "Lats", "Traps", "Upper Back",
  "Glutes", "Quads", "Hamstrings", "Adductors", "Abductors", "Calves",
  "Neck",
];

function toYMD(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function BodyPage() {
  const router = useRouter();
  const today     = toYMD(new Date());
  const yesterday = toYMD(new Date(Date.now() - 86_400_000));

  const [lastTrained, setLastTrained] = useState<Record<string, string>>({});

  const exToMuscles = useMemo(() => {
    const map: Record<string, string[]> = {};
    EXERCISE_LIBRARY.forEach(e => { map[e.name] = e.primaryMuscles as string[]; });
    return map;
  }, []);

  useEffect(() => {
    const from = toYMD(new Date(Date.now() - 14 * 86_400_000));
    fetch(`/api/workouts?from=${from}&to=${today}`)
      .then(r => r.json())
      .then((rows: Array<{ exercise: string; date: string }>) => {
        if (!Array.isArray(rows)) return;
        const map: Record<string, string> = {};
        rows.forEach(row => {
          (exToMuscles[row.exercise] ?? []).forEach(m => {
            const k = m.toLowerCase();
            if (!map[k] || row.date > map[k]) map[k] = row.date;
          });
        });
        setLastTrained(map);
      })
      .catch(() => {});
  }, [exToMuscles, today]);

  function statusFor(muscle: string): MuscleStatus {
    const date = lastTrained[muscle.toLowerCase()];
    if (!date) return "none";
    if (date === today || date === yesterday) return "trained";
    return "rested";
  }

  // Build Record<muscle, MuscleStatus> for AnatomyFigure
  const muscleStatus = Object.fromEntries(
    MUSCLE_LIST.map(m => [m, statusFor(m)])
  ) as Record<string, MuscleStatus>;

  function dotColor(status: MuscleStatus): string {
    if (status === "trained") return "bg-red-500";
    if (status === "rested")  return "bg-green-500";
    return "bg-white/20";
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto pb-24 lg:pb-6">
        <header className="px-4 lg:px-8 pt-4 lg:pt-6 pb-3">
          <h1 className="text-2xl font-semibold">Body</h1>
        </header>

        <div className="px-4 lg:px-8">
          {/* Legend */}
          <div className="flex gap-5 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
              Just Trained
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
              Rested
            </div>
          </div>

          {/* Anatomy figure */}
          <div className="rounded-2xl border border-border bg-white mb-4 overflow-hidden">
            <AnatomyFigure
              muscleStatus={muscleStatus}
              onMuscleClick={muscle => router.push(`/body/${encodeURIComponent(muscle)}`)}
            />
          </div>

          {/* Muscle group list */}
          <div className="rounded-2xl border border-border overflow-hidden">
            {MUSCLE_LIST.map((muscle, i) => {
              const status = statusFor(muscle);
              return (
                <Link
                  key={muscle}
                  href={`/body/${encodeURIComponent(muscle)}`}
                  className={`flex items-center gap-3 px-4 py-3.5 text-sm transition hover:bg-surface-hover ${
                    i < MUSCLE_LIST.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor(status)}`} />
                  <span className="flex-1 font-medium">{muscle}</span>
                  <ChevronRight size={16} className="text-muted" />
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
