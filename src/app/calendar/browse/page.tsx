import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { getSessionDatesInRange, getWeekStart } from "@/lib/workouts";

function parseMonth(month?: string): { year: number; monthIdx: number } {
  if (month) {
    const [y, m] = month.split("-").map(Number);
    return { year: y, monthIdx: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), monthIdx: now.getMonth() };
}

function monthKey(year: number, monthIdx: number): string {
  return `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
}

function shiftMonth(year: number, monthIdx: number, delta: number) {
  const d = new Date(year, monthIdx + delta, 1);
  return { year: d.getFullYear(), monthIdx: d.getMonth() };
}

export default async function BrowseCalendarPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const { year, monthIdx } = parseMonth(searchParams.month);

  const firstOfMonth = new Date(year, monthIdx, 1);
  const lastOfMonth = new Date(year, monthIdx + 1, 0);
  const from = firstOfMonth.toISOString().split("T")[0];
  const to = lastOfMonth.toISOString().split("T")[0];

  const sessionDates = new Set(await getSessionDatesInRange(from, to));

  // Build a Mon-start grid including leading/trailing days from adjacent months
  const startDay = firstOfMonth.getDay(); // 0=Sun
  const leadingBlanks = startDay === 0 ? 6 : startDay - 1;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - leadingBlanks);

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({ date: d, inMonth: d.getMonth() === monthIdx });
  }

  const monthLabel = firstOfMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prev = shiftMonth(year, monthIdx, -1);
  const next = shiftMonth(year, monthIdx, 1);
  const todayStr = new Date().toISOString().split("T")[0];
  const dayLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 px-4 lg:px-8 py-4 lg:py-6 pb-24 lg:pb-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Browse History</h1>
            <p className="text-sm text-muted">Days with a session logged are marked</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/calendar/browse?month=${monthKey(prev.year, prev.monthIdx)}`}
              className="rounded-xl p-2 text-muted transition hover:bg-surface-hover hover:text-foreground"
            >
              <ChevronLeft size={18} />
            </Link>
            <span className="w-36 text-center text-sm font-medium">{monthLabel}</span>
            <Link
              href={`/calendar/browse?month=${monthKey(next.year, next.monthIdx)}`}
              className="rounded-xl p-2 text-muted transition hover:bg-surface-hover hover:text-foreground"
            >
              <ChevronRight size={18} />
            </Link>
          </div>
        </header>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-muted">
            {dayLabels.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {cells.map(({ date, inMonth }) => {
              const dateStr = date.toISOString().split("T")[0];
              const hasSession = sessionDates.has(dateStr);
              const isToday = dateStr === todayStr;
              const weekStart = getWeekStart(date);

              return (
                <Link
                  key={dateStr}
                  href={`/calendar?week=${weekStart}`}
                  className={`flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition hover:bg-surface-hover ${
                    inMonth ? "text-foreground" : "text-muted/30"
                  } ${isToday ? "ring-1 ring-accent/50" : ""}`}
                >
                  <span>{date.getDate()}</span>
                  {hasSession && (
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
