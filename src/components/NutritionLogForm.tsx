"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import type { NutritionFood } from "@/lib/nutrition";

const MEAL_PRESETS = ["Breakfast", "Lunch", "Dinner", "Snack"];

interface Props {
  foods: NutritionFood[];
  today: string;
}

type Mode = "library" | "manual";

export default function NutritionLogForm({ foods, today }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Meal name
  const [mealName, setMealName] = useState("Breakfast");
  const [customMeal, setCustomMeal] = useState("");

  // Mode toggle
  const [mode, setMode] = useState<Mode>("library");

  // Library mode
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [servings, setServings] = useState("1");

  // Manual mode
  const [manualName, setManualName] = useState("");
  const [manualCal, setManualCal] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");

  const selectedFood = foods.find((f) => f.id === selectedFoodId) ?? null;
  const servingsNum = parseFloat(servings) || 1;

  const effectiveMealName = mealName === "custom" ? customMeal : mealName;

  function resetForm() {
    setMealName("Breakfast");
    setCustomMeal("");
    setMode("library");
    setSelectedFoodId("");
    setServings("1");
    setManualName("");
    setManualCal("");
    setManualProtein("");
    setManualCarbs("");
    setManualFat("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveMealName.trim()) {
      setError("Meal name is required.");
      return;
    }

    let payload: Record<string, unknown>;

    if (mode === "library") {
      if (!selectedFood) {
        setError("Select a food from the library.");
        return;
      }
      const multiplier = servingsNum;
      payload = {
        date: today,
        meal_name: effectiveMealName.trim(),
        food_name: selectedFood.name,
        food_id: selectedFood.id,
        servings: multiplier,
        calories: Math.round(selectedFood.calories * multiplier * 10) / 10,
        protein_g: Math.round(selectedFood.protein_g * multiplier * 10) / 10,
        carbs_g: Math.round(selectedFood.carbs_g * multiplier * 10) / 10,
        fat_g: Math.round(selectedFood.fat_g * multiplier * 10) / 10,
      };
    } else {
      if (!manualName.trim()) {
        setError("Food name is required.");
        return;
      }
      payload = {
        date: today,
        meal_name: effectiveMealName.trim(),
        food_name: manualName.trim(),
        food_id: null,
        servings: null,
        calories: parseFloat(manualCal) || 0,
        protein_g: parseFloat(manualProtein) || 0,
        carbs_g: parseFloat(manualCarbs) || 0,
        fat_g: parseFloat(manualFat) || 0,
      };
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/nutrition/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to log meal");
      }
      resetForm();
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-background transition hover:bg-accent-dark"
      >
        <Plus size={16} />
        Log Food
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Log Food</h2>
              <button
                onClick={() => { resetForm(); setOpen(false); }}
                className="rounded-xl p-1 text-muted transition hover:bg-surface-hover hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Meal name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                  Meal
                </label>
                <div className="flex flex-wrap gap-2">
                  {MEAL_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMealName(preset)}
                      className={`rounded-xl px-3 py-1.5 text-sm transition ${
                        mealName === preset
                          ? "bg-accent font-medium text-background"
                          : "bg-surface-hover text-muted hover:text-foreground"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMealName("custom")}
                    className={`rounded-xl px-3 py-1.5 text-sm transition ${
                      mealName === "custom"
                        ? "bg-accent font-medium text-background"
                        : "bg-surface-hover text-muted hover:text-foreground"
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {mealName === "custom" && (
                  <input
                    type="text"
                    placeholder="e.g. Pre-workout, Cheat meal…"
                    value={customMeal}
                    onChange={(e) => setCustomMeal(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                  />
                )}
              </div>

              {/* Mode toggle */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                  Entry type
                </label>
                <div className="flex gap-2">
                  {(["library", "manual"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`rounded-xl px-3 py-1.5 text-sm capitalize transition ${
                        mode === m
                          ? "bg-accent font-medium text-background"
                          : "bg-surface-hover text-muted hover:text-foreground"
                      }`}
                    >
                      {m === "library" ? "From library" : "Enter manually"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Library mode */}
              {mode === "library" && (
                <div className="flex flex-col gap-3">
                  {foods.length === 0 ? (
                    <p className="text-sm text-muted">
                      No foods in your library yet.{" "}
                      <a href="/nutrition/library" className="text-accent underline-offset-2 hover:underline">
                        Add some →
                      </a>
                    </p>
                  ) : (
                    <>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                          Food
                        </label>
                        <select
                          value={selectedFoodId}
                          onChange={(e) => setSelectedFoodId(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                        >
                          <option value="">Select a food…</option>
                          {foods.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.calories} kcal / {f.serving_size} {f.serving_unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedFood && (
                        <>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                              Servings
                            </label>
                            <input
                              type="number"
                              min="0.25"
                              step="0.25"
                              value={servings}
                              onChange={(e) => setServings(e.target.value)}
                              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                            />
                          </div>
                          <div className="rounded-xl bg-surface-hover px-3 py-2 text-xs text-muted">
                            {Math.round(selectedFood.calories * servingsNum)} kcal ·{" "}
                            {Math.round(selectedFood.protein_g * servingsNum)}g P ·{" "}
                            {Math.round(selectedFood.carbs_g * servingsNum)}g C ·{" "}
                            {Math.round(selectedFood.fat_g * servingsNum)}g F
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Manual mode */}
              {mode === "manual" && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                      Food name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chicken breast, Rice bowl…"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Calories (kcal)", val: manualCal, set: setManualCal },
                      { label: "Protein (g)", val: manualProtein, set: setManualProtein },
                      { label: "Carbs (g)", val: manualCarbs, set: setManualCarbs },
                      { label: "Fat (g)", val: manualFat, set: setManualFat },
                    ].map(({ label, val, set }) => (
                      <div key={label}>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                          {label}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-background transition hover:bg-accent-dark disabled:opacity-50"
              >
                {loading ? "Logging…" : "Log Food"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
