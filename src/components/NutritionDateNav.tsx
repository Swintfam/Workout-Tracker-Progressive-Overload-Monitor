"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { localDateYMD } from "@/lib/utils";

interface Props {
  activeDate: string; // YYYY-MM-DD
}

function formatLabel(dateStr: string, today: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const label = d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  if (dateStr === today) return `Today — ${label}`;
  const yest = new Date(); yest.setDate(yest.getDate() - 1);
  if (dateStr === localDateYMD(yest)) return `Yesterday — ${label}`;
  return label;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00"); // parse as local midnight
  d.setDate(d.getDate() + n);
  return localDateYMD(d); // return local date, not UTC
}

export default function NutritionDateNav({ activeDate }: Props) {
  const router = useRouter();
  const today = localDateYMD(); // local date — client already runs in local time
  const isFuture = addDays(activeDate, 1) > today;

  function go(days: number) {
    const next = addDays(activeDate, days);
    if (next > today) return; // don't navigate into the future
    if (next === today) {
      router.push("/nutrition");
    } else {
      router.push(`/nutrition?date=${next}`);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => go(-1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted transition hover:bg-surface-hover hover:text-foreground"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-[160px] text-center text-[15px] font-semibold">
        {formatLabel(activeDate, today)}
      </span>
      <button
        onClick={() => go(1)}
        disabled={isFuture}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted transition hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
