import Link from "next/link";
import { MOOD_COLORS } from "@/lib/mental";
import type { WeekMoodDay } from "@/lib/mental";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  days: WeekMoodDay[];
  today: string;
}

export default function MoodWeekStrip({ days, today }: Props) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(({ date, rating }, i) => {
        const isToday = date === today;
        const colors = rating ? MOOD_COLORS[rating] : null;

        return (
          <Link
            key={date}
            href="/mental-health"
            className={`flex flex-col items-center gap-1.5 rounded-xl p-3 transition hover:opacity-80 ${
              colors ? colors.bg : "bg-surface-hover"
            } ${isToday ? "ring-1 ring-accent/40" : ""}`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              {DAY_LABELS[i]}
            </span>
            <span
              className={`text-lg font-bold ${
                colors ? colors.text : "text-muted/30"
              }`}
            >
              {rating ?? "—"}
            </span>
            <span className="text-[9px] text-muted">
              {colors ? colors.label : isToday ? "Log" : ""}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
