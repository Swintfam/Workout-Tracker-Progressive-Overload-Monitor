"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddFoodForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [servingSize, setServingSize] = useState("1");
  const [servingUnit, setServingUnit] = useState("serving");

  function reset() {
    setName(""); setCalories(""); setProtein("");
    setCarbs(""); setFat(""); setServingSize("1");
    setServingUnit("serving"); setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/nutrition/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          calories: parseFloat(calories) || 0,
          protein_g: parseFloat(protein) || 0,
          carbs_g: parseFloat(carbs) || 0,
          fat_g: parseFloat(fat) || 0,
          serving_size: parseFloat(servingSize) || 1,
          serving_unit: servingUnit.trim() || "serving",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add food");
      }
      reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="font-medium">Add Food to Library</p>
        <button
          type="button"
          onClick={() => { setOpen((v) => !v); if (open) reset(); }}
          className="rounded-xl bg-surface-hover px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
        >
          {open ? "Cancel" : "+ New food"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Food name
            </label>
            <input
              type="text"
              placeholder="e.g. Chicken breast, Greek yogurt…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                Serving size
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                Unit
              </label>
              <input
                type="text"
                placeholder="serving, oz, g, cup…"
                value={servingUnit}
                onChange={(e) => setServingUnit(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Macros per serving
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Calories (kcal)", val: calories, set: setCalories },
              { label: "Protein (g)", val: protein, set: setProtein },
              { label: "Carbs (g)", val: carbs, set: setCarbs },
              { label: "Fat (g)", val: fat, set: setFat },
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

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-background transition hover:bg-accent-dark disabled:opacity-50"
          >
            {loading ? "Saving…" : "Add Food"}
          </button>
        </form>
      )}
    </div>
  );
}
