"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NutritionTargets } from "@/lib/nutrition";

interface Props {
  targets: NutritionTargets | null;
}

export default function NutritionTargetsForm({ targets }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [calories, setCalories] = useState(String(targets?.calories_weekly ?? ""));
  const [protein, setProtein] = useState(String(targets?.protein_weekly_g ?? ""));
  const [carbs, setCarbs] = useState(String(targets?.carbs_weekly_g ?? ""));
  const [fat, setFat] = useState(String(targets?.fat_weekly_g ?? ""));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/nutrition/targets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calories_weekly: parseFloat(calories) || 0,
          protein_weekly_g: parseFloat(protein) || 0,
          carbs_weekly_g: parseFloat(carbs) || 0,
          fat_weekly_g: parseFloat(fat) || 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save targets");
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { label: "Calories / week (kcal)", val: calories, set: setCalories, daily: targets ? Math.round(targets.calories_weekly / 7) : null, unit: "kcal/day" },
    { label: "Protein / week (g)", val: protein, set: setProtein, daily: targets ? Math.round(targets.protein_weekly_g / 7) : null, unit: "g/day" },
    { label: "Carbs / week (g)", val: carbs, set: setCarbs, daily: targets ? Math.round(targets.carbs_weekly_g / 7) : null, unit: "g/day" },
    { label: "Fat / week (g)", val: fat, set: setFat, daily: targets ? Math.round(targets.fat_weekly_g / 7) : null, unit: "g/day" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-medium">Weekly Macro Targets</p>
          {targets && (
            <p className="text-xs text-muted">
              Last updated {new Date(targets.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-xl bg-surface-hover px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
        >
          {open ? "Collapse" : targets ? "Edit" : "Set targets"}
        </button>
      </div>

      {!open && targets && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {fields.map(({ label, daily, unit }) => (
            <div key={label} className="rounded-xl bg-surface-hover px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                {label.split("/")[0].trim()}
              </p>
              <p className="text-lg font-bold">{daily?.toLocaleString()}</p>
              <p className="text-[10px] text-muted">{unit}</p>
            </div>
          ))}
        </div>
      )}

      {open && (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {fields.map(({ label, val, set }) => (
              <div key={label}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                  {label}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {saved && <p className="text-sm text-green-500">Targets saved.</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-background transition hover:bg-accent-dark disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save Targets"}
          </button>
        </form>
      )}
    </div>
  );
}
