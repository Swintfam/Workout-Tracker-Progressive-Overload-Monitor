"use client";

import Link from "next/link";
import MuscleBodyMap from "@/components/MuscleBodyMap";
import { localDateYMD } from "@/lib/utils";

interface Props {
  muscles: string[];
  lastDate: string;
}

function dayLabel(dateStr: string): string {
  if (!dateStr) return "No sessions yet";
  const today = localDateYMD();
  const yest = new Date(); yest.setDate(yest.getDate() - 1);
  const yesterday = localDateYMD(yest);
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function BodyMapWidget({ muscles, lastDate }: Props) {
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

      {/* Muscle figure */}
      <div className="px-4 py-3 flex justify-center">
        <MuscleBodyMap
          primary={muscles}
          viewWidth={90}
          viewHeight={180}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 pb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
          <span className="text-[10px] text-muted">Trained</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#374151" }} />
          <span className="text-[10px] text-muted">Rested</span>
        </div>
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
