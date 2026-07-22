"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Search, Loader2 } from "lucide-react";

const MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
type Slot = (typeof MEAL_SLOTS)[number];
type Tab = "search" | "custom";

interface UsdaFood {
  fdcId: number;
  name: string;
  brand: string | null;
  per100g: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
  };
  defaultServing: number;
  servingUnit: string;
}

interface Props {
  foods: unknown[]; // legacy prop — kept for API compatibility
  date: string;
  isOpen: boolean;
  initialSlot: Slot;
  onClose: () => void;
}

function scale(val: number, grams: number) {
  return Math.round((val * grams) / 100 * 10) / 10;
}

export default function NutritionLogForm({ date, isOpen, initialSlot, onClose }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("search");
  const [slot, setSlot] = useState<Slot>(initialSlot);

  // USDA search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UsdaFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [grams, setGrams] = useState<Record<number, number>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Custom entry state
  const [cName, setCName] = useState("");
  const [cCal, setCCal] = useState("");
  const [cP, setCP] = useState("");
  const [cC, setCC] = useState("");
  const [cF, setCF] = useState("");
  const [cFib, setCFib] = useState("");
  const [cSug, setCSug] = useState("");

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setSlot(initialSlot); }, [initialSlot]);

  // Debounced USDA search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/food-search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        setResults(json.foods ?? []);
        // Set default grams for each result
        setGrams((prev) => {
          const next = { ...prev };
          for (const f of json.foods ?? []) {
            if (!(f.fdcId in next)) next[f.fdcId] = f.defaultServing ?? 100;
          }
          return next;
        });
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  function reset() {
    setQuery(""); setResults([]); setGrams({}); setError(null); setTab("search");
    setCName(""); setCCal(""); setCP(""); setCC(""); setCF(""); setCFib(""); setCSug("");
  }

  function handleClose() { reset(); onClose(); }

  function getGrams(fdcId: number, defaultServing: number) {
    return grams[fdcId] ?? defaultServing ?? 100;
  }

  function setFoodGrams(fdcId: number, val: number) {
    setGrams((p) => ({ ...p, [fdcId]: Math.max(1, val) }));
  }

  async function logUsda(food: UsdaFood) {
    const g = getGrams(food.fdcId, food.defaultServing);
    setLoading(String(food.fdcId)); setError(null);
    try {
      const res = await fetch("/api/nutrition/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          meal_name: slot,
          food_name: food.brand ? `${food.name} (${food.brand})` : food.name,
          food_id: null,
          servings: g,
          calories: scale(food.per100g.calories, g),
          protein_g: scale(food.per100g.protein_g, g),
          carbs_g: scale(food.per100g.carbs_g, g),
          fat_g: scale(food.per100g.fat_g, g),
          fiber_g: scale(food.per100g.fiber_g, g),
          sugar_g: scale(food.per100g.sugar_g, g),
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
          calories: parseFloat(cCal) || 0,
          protein_g: parseFloat(cP) || 0,
          carbs_g: parseFloat(cC) || 0,
          fat_g: parseFloat(cF) || 0,
          fiber_g: parseFloat(cFib) || null,
          sugar_g: parseFloat(cSug) || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      router.refresh(); handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally { setLoading(null); }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      style={{ backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="flex w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        style={{ maxHeight: "82vh" }}
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
              {t === "search" ? "Search USDA" : "Custom Entry"}
            </button>
          ))}
        </div>

        {/* Meal slot selector */}
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

          {/* ── USDA SEARCH TAB ── */}
          {tab === "search" && (
            <>
              <div className="px-5 pt-3 pb-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search foods (e.g. chicken breast, oats…)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-9 text-sm outline-none placeholder:text-muted/60 focus:border-accent"
                  />
                  {searching && (
                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted" />
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-muted">Powered by USDA FoodData Central</p>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-4">
                {query.trim().length < 2 ? (
                  <p className="py-10 text-center text-sm text-muted">Type at least 2 characters to search</p>
                ) : searching ? (
                  <p className="py-10 text-center text-sm text-muted">Searching…</p>
                ) : results.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted">No results for &ldquo;{query}&rdquo;</p>
                ) : (
                  results.map((food) => {
                    const g = getGrams(food.fdcId, food.defaultServing);
                    const cal = scale(food.per100g.calories, g);
                    const prot = scale(food.per100g.protein_g, g);
                    const carb = scale(food.per100g.carbs_g, g);
                    const fat = scale(food.per100g.fat_g, g);
                    const fib = scale(food.per100g.fiber_g, g);
                    return (
                      <div key={food.fdcId} className="border-b border-border/50 py-3 last:border-0">
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{food.name}</div>
                            {food.brand && (
                              <div className="text-[10px] text-muted">{food.brand}</div>
                            )}
                            <div className="mt-0.5 text-[10px] text-muted">
                              P {prot}g · C {carb}g · F {fat}g{fib > 0 ? ` · Fib ${fib}g` : ""}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <div className="text-right">
                              <div className="text-sm font-bold">{cal}</div>
                              <div className="text-[10px] text-muted">kcal</div>
                            </div>
                            <button
                              onClick={() => logUsda(food)}
                              disabled={!!loading}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-lg font-bold text-background transition hover:bg-accent-dark disabled:opacity-50"
                            >
                              {loading === String(food.fdcId) ? "…" : "+"}
                            </button>
                          </div>
                        </div>
                        {/* Gram adjuster */}
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            step="5"
                            value={g}
                            onChange={(e) => setFoodGrams(food.fdcId, parseFloat(e.target.value) || 100)}
                            className="w-16 rounded-lg border border-border bg-background px-2 py-0.5 text-center text-xs outline-none focus:border-accent"
                          />
                          <span className="text-[11px] text-muted">g serving</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {error && <p className="px-5 pb-3 text-sm text-red-400">{error}</p>}
            </>
          )}

          {/* ── CUSTOM ENTRY TAB ── */}
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
                  { label: "Fiber (g)", val: cFib, set: setCFib },
                  { label: "Sugar (g)", val: cSug, set: setCSug },
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
