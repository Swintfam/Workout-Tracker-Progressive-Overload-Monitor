"use client";

import Link from "next/link";
import AnatomyFigure, { type MuscleStatus } from "@/components/AnatomyFigure";
import { muscleToIds } from "@/lib/muscleIds";

interface Props {
  muscles: string[];
  lastDate: string;
}

function dayLabel(dateStr: string): string {
  if (!dateStr) return "No sessions yet";
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// All known muscle groups for the widget
const ALL_MUSCLES = [
  "Chest","Shoulders","Biceps","Triceps","Forearms",
  "Abs","Obliques","Lower Back","Lats","Traps","Upper Back",
  "Glutes","Quads","Hamstrings","Adductors","Abductors","Calves","Neck",
];

export default function BodyMapWidget({ muscles, lastDate }: Props) {
  const trained = new Set(muscles.map(m => m.toLowerCase()));

  const muscleStatus = Object.fromEntries(
    ALL_MUSCLES.map(m => [
      m,
      trained.has(m.toLowerCase()) ? ("trained" as MuscleStatus) : ("none" as MuscleStatus),
    ])
  ) as Record<string, MuscleStatus>;

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Last Worked</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">{dayLabel(lastDate)}</p>
        </div>
        <Link href="/body" className="text-xs text-accent hover:underline">
          View all →
        </Link>
      </div>

      {/* Figure */}
      <div className="bg-white mx-3 mb-3 rounded-xl overflow-hidden">
        <AnatomyFigure muscleStatus={muscleStatus} />
      </div>

      {/* Muscle tags */}
      {muscles.length > 0 && (
        <div className="px-3 pb-3 flex flex-wrap gap-1.5">
          {muscles.map(m => (
            <span
              key={m}
              className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-500"
            >
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
