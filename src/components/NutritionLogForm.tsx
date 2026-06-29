"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Search } from "lucide-react";
import type { NutritionFood } from "@/lib/nutrition";

const MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
type Slot = (typeof MEAL_SLOTS)[number];

type Tab = "search" | "custom";

interface Props {
  foods: NutritionFood[];
  date: string;
  isOpen: boolean;
  initialSlot: Slot;
  onClose: () => void;
}

export default function NutritionLogForm({ foods, date, isOpen, initialSlot, onClose }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("search");
  const [slot, setSlot] = useState<Slot>(initialSlot);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "high-protein">("all");
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [cName, setCName] = useState("");
  const [cCal, setCCal] = useState("");
  const [cP, setCP] = useState("");
  const [cC, setCC] = useState("");
  const [cF, setCF] = useState("");

  useEffect(() => { setSlot(initialSlot); }, [initialSlot]);

  function reset() {
    setQuery(""); setFilter("all"); setQtys({}); setError(null); setTab("search");
    setCName(""); setCCal(""); setCP(""); setCC(""); setCF("");
  }

  function handleClose() { reset(); onClose(); }

  function getQty(id: string) { return qtys[id] ?? 1; }
  function setQty(id: string, val: number) {
    setQtys((p) => ({ ...p, [id]: Math.max(0.25, val) }));
  }

  async function logFood(food: NutritionFood) {
    const qty = getQty(food.id);
    setLoading(food.id); setError(null);
    try {
      const res = await fetch("/api/nutrition/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date, meal_name: slot, food_name: food.name, food_id: food.id, servings: qty,
          calories: Math.round(food.calories * qty * 10) / 10,
          protein_g: Math.round(food.protein_g * qty * 10) / 10,
          carbs_g: Math.round(food.carbs_g * qty * 10) / 10,
          fat_g: Math.round(food.fat_g * qty * 10) / 10,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      router.refresh(); handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally { setLoading(null); }
  }

  async function logCustom() {
    if (!cName.trim()) { setError("Food name is required."); return; }
    setLoading("custom"); setError(null);
    try {
      const res = await fetch("/api/nutrition/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date, meal_name: slot, food_name: cName.trim(), food_id: null, servings: null,
          calories: parseFloat(cCal) || 0, protein_g: parseFloat(cP) || 0,
          carbs_g: parseFloat(cC) || 0, fat_g: parseFloat(cF) || 0,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      router.refresh(); handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally { setLoading(null); }
  }

  const filtered = foods.filter((f) => {
    const q = query.trim().toLowerCase();
    return (
      (q === "" || f.name.toLowerCase().includes(q)) &&
      (filter === "all" || f.protein_g >= 20)
    );
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      style={{ backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="flex w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        style={{ maxHeight: "80vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <span className="text-base font-bold">Log Food</span>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-hover text-muted transition hover:text-foreground"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border px-5 pt-4">
          {(["search", "custom"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`mb-[-1px] border-b-2 px-3 pb-2 text-[13px] font-medium transition ${
                tab === t
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t === "search" ? "Search" : "Custom Entry"}
            </button>
          ))}
        </div>

        {/* Slot selector */}
        <div className="flex flex-wrap gap-2 px-5 pt-3 pb-0">
          {MEAL_SLOTS.map((s) => (
            <button
              key={s}
              onClick={() => setSlot(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                slot === s
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-background text-muted hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {tab === "search" && (
            <>
              <div className="px-5 pt-3 pb-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search your food library…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted/60 focus:border-accent"
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  {(["all", "high-protein"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                        filter === f
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-background text-muted"
                      }`}
                    >
                      {f === "all" ? "All" : "High Protein"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-4">
                {foods.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted">
                    No foods in your library yet.{" "}
                    <a href="/nutrition/library" className="text-accent hover:underline">Add some →</a>
                  </p>
                ) : filtered.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted">No results for &ldquo;{query}&rdquo;</p>
                ) : (
                  filtered.map((food) => {
                    const qty = getQty(food.id);
                    return (
                      <div key={food.id} className="flex items-center gap-3 border-b border-border/50 py-3 last:border-0">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{food.name}</div>
                          <div className="mt-0.5 text-[10px] text-muted">
                            P{food.protein_g}g · C{food.carbs_g}g · F{food.fat_g}g
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <input
                              type="number"
                              min="0.25"
                              step="0.25"
                              value={qty}
                              onChange={(e) => setQty(food.id, parseFloat(e.target.value) || 1)}
                              className="w-14 rounded-lg border border-border bg-background px-2 py-0.5 text-center text-xs outline-none focus:border-accent"
                            />
                            <span className="text-[11px] text-muted">
                              × {food.serving_size} {food.serving_unit}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-bold">{Math.round(food.calories * qty)}</div>
                            <div className="text-[10px] text-muted">kcal</div>
                          </div>
                          <button
                            onClick={() => logFood(food)}
                            disabled={!!loading}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-lg font-bold text-background transition hover:bg-accent-dark disabled:opacity-50"
                          >
                            {loading === food.id ? "…" : "+"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {error && <p className="px-5 pb-3 text-sm text-red-400">{error}</p>}
            </>
          )}

          {tab === "custom" && (
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="mb-3 text-[13px] text-muted">Enter food details manually</p>
              <input
                type="text"
                placeholder="Food name"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                className="mb-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <div className="mb-2 grid grid-cols-2 gap-2">
                {[
                  { label: "Calories", val: cCal, set: setCCal },
                  { label: "Protein (g)", val: cP, set: setCP },
                  { label: "Carbs (g)", val: cC, set: setCC },
                  { label: "Fat (g)", val: cF, set: setCF },
                ].map(({ label, val, set }) => (
                  <div key={label}>
                    <label className="mb-1 block text-[11px] font-medium text-muted">{label}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
                    />
                  </div>
                ))}
              </div>
              {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
              <button
                onClick={logCustom}
                disabled={loading === "custom"}
                className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-background transition hover:bg-accent-dark disabled:opacity-50"
              >
                {loading === "custom" ? "Logging…" : "Add to Log"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
