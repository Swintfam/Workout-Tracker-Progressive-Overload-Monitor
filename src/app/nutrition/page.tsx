import { Salad } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import NutritionLogForm from "@/components/NutritionLogForm";
import NutritionTargetsForm from "@/components/NutritionTargetsForm";
import DeleteLogButton from "@/components/DeleteLogButton";
import {
  getNutritionTargets,
  getDailyLogs,
  getDailyTotals,
  getDailyRequirement,
  getFoodLibrary,
  getWeeklyAdherence,
} from "@/lib/nutrition";
import { getWeekStart } from "@/lib/workouts";

const MACROS = [
  { key: "calories" as const, label: "Calories", unit: "kcal", bar: "bg-orange-400" },
  { key: "protein_g" as const, label: "Protein", unit: "g", bar: "bg-blue-400" },
  { key: "carbs_g" as const, label: "Carbs", unit: "g", bar: "bg-yellow-400" },
  { key: "fat_g" as const, label: "Fat", unit: "g", bar: "bg-purple-400" },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function NutritionPage() {
  const today = new Date().toISOString().split("T")[0];
  const weekStart = getWeekStart();

  const [targets, logs, totals, foods, adherence] = await Promise.all([
    getNutritionTargets(),
    getDailyLogs(today),
    getDailyTotals(today),
    getFoodLibrary(),
    getWeeklyAdherence(weekStart),
  ]);

  const dailyReq = targets ? getDailyRequirement(targets) : null;

  // Group today's logs by meal_name, preserve insertion order
  const mealOrder: string[] = [];
  const byMeal: Record<string, typeof logs> = {};
  for (const log of logs) {
    if (!byMeal[log.meal_name]) {
      mealOrder.push(log.meal_name);
      byMeal[log.meal_name] = [];
    }
    byMeal[log.meal_name].push(log);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 px-8 py-6">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Nutrition</h1>
            <p className="text-sm text-muted">
              {new Date(today + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/nutrition/library"
              className="rounded-xl bg-surface-hover px-4 py-2 text-sm font-medium text-muted transition hover:text-foreground"
            >
              Food Library
            </Link>
            <NutritionLogForm foods={foods} today={today} />
          </div>
        </header>

        <div className="flex flex-col gap-8">
          {/* Daily Macro Progress */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Today {dailyReq ? "· vs daily target" : "· set targets below to track progress"}
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {MACROS.map(({ key, label, unit, bar }) => {
                const current = totals[key] ?? 0;
                const req = dailyReq?.[key] ?? 0;
                const pct = req > 0 ? Math.min(100, Math.round((current / req) * 100)) : 0;
                return (
                  <div key={key} className="rounded-2xl border border-border bg-surface p-4">
                    <div className="mb-1 text-sm font-medium">{label}</div>
                    <div className="mb-2 text-2xl font-bold">
                      {Math.round(current).toLocaleString()}
                      {req > 0 && (
                        <span className="text-sm font-normal text-muted">
                          {" "}/ {Math.round(req).toLocaleString()} {unit}
                        </span>
                      )}
                      {req === 0 && (
                        <span className="text-sm font-normal text-muted"> {unit}</span>
                      )}
                    </div>
                    {req > 0 && (
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
                        <div
                          className={`h-full rounded-full transition-all ${bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Weekly Adherence Strip */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              This Week
            </h2>
            <div className="grid grid-cols-7 gap-2 rounded-2xl border border-border bg-surface p-4">
              {adherence.map(({ date, met, logged, totals: dt }, i) => {
                const isToday = date === today;
                return (
                  <div key={date} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {DAY_LABELS[i]}
                    </span>
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-medium ${
                        met
                          ? "bg-accent text-background"
                          : logged
                          ? "bg-accent/20 text-accent"
                          : isToday
                          ? "ring-1 ring-accent/50 text-muted"
                          : "bg-surface-hover text-muted/40"
                      }`}
                    >
                      {new Date(date + "T00:00:00").getDate()}
                    </div>
                    {logged && (
                      <span className="text-[9px] text-muted">
                        {Math.round(dt.calories)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-1.5 text-[10px] text-muted">
              Filled = targets met · Partial = something logged · Empty = nothing tracked
            </p>
          </section>

          {/* Today's Meal Log */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Today&apos;s Log
            </h2>
            {mealOrder.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface py-16 text-center">
                <Salad size={40} className="text-muted opacity-30" />
                <p className="text-sm text-muted">Nothing logged today. Hit &ldquo;Log Food&rdquo; above.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {mealOrder.map((mealName) => {
                  const entries = byMeal[mealName];
                  const mealTotals = entries.reduce(
                    (sum, e) => ({
                      calories: sum.calories + (e.calories ?? 0),
                      protein_g: sum.protein_g + (e.protein_g ?? 0),
                      carbs_g: sum.carbs_g + (e.carbs_g ?? 0),
                      fat_g: sum.fat_g + (e.fat_g ?? 0),
                    }),
                    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
                  );
                  return (
                    <div key={mealName} className="rounded-2xl border border-border bg-surface p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="font-medium">{mealName}</p>
                        <span className="text-xs text-muted">
                          {Math.round(mealTotals.calories)} kcal ·{" "}
                          {Math.round(mealTotals.protein_g)}g P ·{" "}
                          {Math.round(mealTotals.carbs_g)}g C ·{" "}
                          {Math.round(mealTotals.fat_g)}g F
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between rounded-xl bg-surface-hover px-3 py-2 text-sm"
                          >
                            <span className="font-medium">{entry.food_name || "Food entry"}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted">
                                {Math.round(entry.calories ?? 0)} kcal ·{" "}
                                {Math.round(entry.protein_g ?? 0)}g P ·{" "}
                                {Math.round(entry.carbs_g ?? 0)}g C ·{" "}
                                {Math.round(entry.fat_g ?? 0)}g F
                              </span>
                              <DeleteLogButton logId={entry.id} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Weekly Targets Settings */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Weekly Targets
            </h2>
            <NutritionTargetsForm targets={targets} />
          </section>
        </div>
      </main>
    </div>
  );
}
