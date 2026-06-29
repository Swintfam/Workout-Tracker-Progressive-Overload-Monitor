"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import MacroRings from "@/components/MacroRings";
import NutritionLogForm from "@/components/NutritionLogForm";
import NutritionTargetsForm from "@/components/NutritionTargetsForm";
import DeleteLogButton from "@/components/DeleteLogButton";
import type { NutritionFood, NutritionLog, NutritionTargets, DailyMacros } from "@/lib/nutrition";
import Link from "next/link";

const MEAL_SLOTS = [
  { key: "Breakfast", emoji: "🍳" },
  { key: "Lunch",     emoji: "☀️" },
  { key: "Dinner",    emoji: "🌙" },
  { key: "Snack",     emoji: "🍎" },
] as const;
type SlotKey = (typeof MEAL_SLOTS)[number]["key"];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface AdherenceDay {
  date: string;
  met: boolean;
  logged: boolean;
  totals: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
}

interface Props {
  logs: NutritionLog[];
  totals: DailyMacros;
  dailyReq: DailyMacros | null;
  foods: NutritionFood[];
  adherence: AdherenceDay[];
  targets: NutritionTargets | null;
  activeDate: string;
  today: string;
}

export default function NutritionPageClient({
  logs, totals, dailyReq, foods, adherence, targets, activeDate, today,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<SlotKey>("Breakfast");

  function openModal(slot: SlotKey) {
    setActiveSlot(slot);
    setModalOpen(true);
  }

  // Group logs into 4 fixed slots
  const bySlot: Record<SlotKey, NutritionLog[]> = {
    Breakfast: [], Lunch: [], Dinner: [], Snack: [],
  };
  for (const log of logs) {
    const name = log.meal_name;
    if (name === "Breakfast") bySlot.Breakfast.push(log);
    else if (name === "Lunch") bySlot.Lunch.push(log);
    else if (name === "Dinner") bySlot.Dinner.push(log);
    else bySlot.Snack.push(log);
  }

  const calGoal = dailyReq?.calories ?? 0;
  const calConsumed = Math.round(totals.calories);
  const calRemaining = Math.max(0, Math.round(calGoal - calConsumed));
  const calPct = calGoal > 0 ? Math.min(100, (calConsumed / calGoal) * 100) : 0;

  return (
    <>
      {/* Log Food button (header row, rendered by parent server component but state here) */}
      {/* Actually: Log Food button here so we have access to openModal */}
      <div className="hidden" id="nutrition-log-trigger" />

      {/* Summary card */}
      <div className="mb-5 grid grid-cols-[1fr_auto] items-center gap-6 rounded-2xl border border-border bg-surface p-5">
        {/* Calorie bar */}
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Calories</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold leading-none">{calConsumed.toLocaleString()}</span>
            {calGoal > 0 && (
              <>
                <span className="text-lg text-muted/50">/</span>
                <span className="text-lg font-medium text-muted">{Math.round(calGoal).toLocaleString()}</span>
              </>
            )}
          </div>
          {calGoal > 0 && (
            <p className="mt-1 text-[13px] text-muted">
              <span className="font-semibold text-accent">{calRemaining.toLocaleString()}</span> kcal remaining
            </p>
          )}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${calPct}%` }}
            />
          </div>
        </div>

        {/* Macro rings */}
        <MacroRings
          protein={Math.round(totals.protein_g)}
          carbs={Math.round(totals.carbs_g)}
          fat={Math.round(totals.fat_g)}
          proteinGoal={Math.round(dailyReq?.protein_g ?? 0)}
          carbsGoal={Math.round(dailyReq?.carbs_g ?? 0)}
          fatGoal={Math.round(dailyReq?.fat_g ?? 0)}
        />
      </div>

      {/* Top action row */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/nutrition/library"
          className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
        >
          Food Library
        </Link>
        <button
          onClick={() => openModal("Breakfast")}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-background transition hover:bg-accent-dark"
        >
          <Plus size={15} />
          Log Food
        </button>
      </div>

      {/* Meal slots 2x2 */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {MEAL_SLOTS.map(({ key, emoji }) => {
          const entries = bySlot[key];
          const slotCals = entries.reduce((s, e) => s + (e.calories ?? 0), 0);
          return (
            <div key={key} className="rounded-2xl border border-border bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                  <span>{emoji}</span>
                  {key}
                </div>
                <span className="text-xs text-muted">
                  <span className="font-semibold text-foreground/80">{Math.round(slotCals)}</span> kcal
                </span>
              </div>

              {entries.length === 0 ? (
                <p className="py-3 text-center text-xs text-muted/50">Nothing logged</p>
              ) : (
                <div className="flex flex-col">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between border-b border-border/50 py-2 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">{entry.food_name}</div>
                        <div className="text-[10px] text-muted">
                          P{Math.round(entry.protein_g ?? 0)}g · C{Math.round(entry.carbs_g ?? 0)}g · F{Math.round(entry.fat_g ?? 0)}g
                        </div>
                      </div>
                      <div className="ml-2 flex shrink-0 items-center gap-2">
                        <span className="text-[13px] font-semibold">{Math.round(entry.calories ?? 0)}</span>
                        <DeleteLogButton logId={entry.id} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => openModal(key)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-1.5 text-xs text-muted transition hover:border-accent hover:text-accent"
              >
                + Add to {key}
              </button>
            </div>
          );
        })}
      </div>

      {/* Weekly Adherence Strip */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">This Week</h2>
        <div className="grid grid-cols-7 gap-2 rounded-2xl border border-border bg-surface p-4">
          {adherence.map(({ date, met, logged, totals: dt }, i) => {
            const isToday = date === today;
            return (
              <div key={date} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {DAY_LABELS[i]}
                </span>
                <Link href={date === today ? "/nutrition" : `/nutrition?date=${date}`}>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-medium transition hover:opacity-80 ${
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
                </Link>
                {logged && (
                  <span className="text-[9px] text-muted">{Math.round(dt.calories)}</span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-1.5 text-[10px] text-muted">
          Filled = targets met · Partial = something logged · Empty = nothing tracked
        </p>
      </section>

      {/* Weekly Targets */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Weekly Targets</h2>
        <NutritionTargetsForm targets={targets} />
      </section>

      {/* Log Food Modal */}
      <NutritionLogForm
        foods={foods}
        date={activeDate}
        isOpen={modalOpen}
        initialSlot={activeSlot}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
