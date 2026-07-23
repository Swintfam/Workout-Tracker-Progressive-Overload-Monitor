"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Search, Loader2, Camera, Trash2, CheckCircle2 } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
type Slot = (typeof MEAL_SLOTS)[number];
type Tab = "photo" | "search" | "custom";
type Phase = "upload" | "analyzing" | "reviewing" | "logging";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MacroSet {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
}

interface ReviewItem {
  id: string;
  food_name: string;
  grams: number;
  usdaName: string | null;
  per100g: MacroSet | null;
  looking_up: boolean;
}

interface UsdaFood {
  fdcId: number;
  name: string;
  brand: string | null;
  per100g: MacroSet;
  defaultServing: number;
  servingUnit: string;
}

interface Props {
  foods: unknown[];
  date: string;
  isOpen: boolean;
  initialSlot: Slot;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function scale(val: number, grams: number) {
  return Math.round((val * grams / 100) * 10) / 10;
}

function sumMacros(items: ReviewItem[]): MacroSet {
  return items.reduce(
    (acc, item) => {
      if (!item.per100g) return acc;
      return {
        calories: acc.calories + scale(item.per100g.calories, item.grams),
        protein_g: acc.protein_g + scale(item.per100g.protein_g, item.grams),
        carbs_g: acc.carbs_g + scale(item.per100g.carbs_g, item.grams),
        fat_g: acc.fat_g + scale(item.per100g.fat_g, item.grams),
        fiber_g: acc.fiber_g + scale(item.per100g.fiber_g, item.grams),
        sugar_g: acc.sugar_g + scale(item.per100g.sugar_g, item.grams),
      };
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0 }
  );
}

async function compressImage(file: File): Promise<{ base64: string; mediaType: "image/jpeg" }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1024;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      URL.revokeObjectURL(url);
      resolve({ base64: dataUrl.split(",")[1], mediaType: "image/jpeg" });
    };
    img.src = url;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NutritionLogForm({ date, isOpen, initialSlot, onClose }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>("photo");
  const [slot, setSlot] = useState<Slot>(initialSlot);
  const [error, setError] = useState<string | null>(null);

  // Photo tab state
  const [phase, setPhase] = useState<Phase>("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisNotes, setAnalysisNotes] = useState<string | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);

  // USDA search tab state
  const [query, setQuery] = useState("");
  const [usdaResults, setUsdaResults] = useState<UsdaFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [usdaGrams, setUsdaGrams] = useState<Record<number, number>>({});
  const [usdaLoading, setUsdaLoading] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Custom entry state
  const [cName, setCName] = useState("");
  const [cCal, setCCal] = useState("");
  const [cP, setCP] = useState("");
  const [cC, setCC] = useState("");
  const [cF, setCF] = useState("");
  const [cFib, setCFib] = useState("");
  const [cSug, setCSug] = useState("");
  const [customLoading, setCustomLoading] = useState(false);

  useEffect(() => { setSlot(initialSlot); }, [initialSlot]);

  // USDA debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) { setUsdaResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/food-search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        const foods = json.foods ?? [];
        setUsdaResults(foods);
        setUsdaGrams((prev) => {
          const next = { ...prev };
          for (const f of foods) {
            if (!(f.fdcId in next)) next[f.fdcId] = f.defaultServing ?? 100;
          }
          return next;
        });
      } catch { setUsdaResults([]); }
      finally { setSearching(false); }
    }, 400);
  }, [query]);

  function reset() {
    setTab("photo"); setPhase("upload"); setPreviewUrl(null);
    setAnalysisNotes(null); setReviewItems([]); setError(null);
    setQuery(""); setUsdaResults([]); setUsdaGrams({});
    setCName(""); setCCal(""); setCP(""); setCC(""); setCF(""); setCFib(""); setCSug("");
  }

  function handleClose() { reset(); onClose(); }

  // ── Photo: file selected ──
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    setError(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    await analyzeImage(file);
  }

  // ── Photo: analyze ──
  async function analyzeImage(file: File) {
    setPhase("analyzing");
    setError(null);
    try {
      const { base64, mediaType } = await compressImage(file);
      const res = await fetch("/api/analyze-meal-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Analysis failed");
      const { items, notes } = await res.json();

      setAnalysisNotes(notes ?? null);

      // Build initial review items, then kick off USDA lookups in parallel
      const initial: ReviewItem[] = (items as { food_name: string; estimated_grams: number }[]).map((item) => ({
        id: uid(),
        food_name: item.food_name,
        grams: item.estimated_grams,
        usdaName: null,
        per100g: null,
        looking_up: true,
      }));
      setReviewItems(initial);
      setPhase("reviewing");

      // USDA lookup for each item in parallel
      await Promise.all(
        initial.map(async (item) => {
          try {
            const r = await fetch(`/api/food-search?q=${encodeURIComponent(item.food_name)}`);
            const json = await r.json();
            const top: UsdaFood | undefined = json.foods?.[0];
            setReviewItems((prev) =>
              prev.map((p) =>
                p.id === item.id
                  ? { ...p, looking_up: false, usdaName: top?.name ?? null, per100g: top?.per100g ?? null }
                  : p
              )
            );
          } catch {
            setReviewItems((prev) =>
              prev.map((p) => (p.id === item.id ? { ...p, looking_up: false } : p))
            );
          }
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      setPhase("upload");
    }
  }

  function updateGrams(id: string, val: number) {
    setReviewItems((prev) => prev.map((p) => (p.id === id ? { ...p, grams: Math.max(1, val) } : p)));
  }

  function removeItem(id: string) {
    setReviewItems((prev) => prev.filter((p) => p.id !== id));
  }

  // ── Photo: log all review items ──
  async function logReviewItems() {
    const loggable = reviewItems.filter((i) => i.per100g);
    if (loggable.length === 0) { setError("No items with nutrition data to log."); return; }
    setPhase("logging"); setError(null);
    try {
      await Promise.all(
        loggable.map((item) =>
          fetch("/api/nutrition/logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date,
              meal_name: slot,
              food_name: item.food_name,
              food_id: null,
              servings: item.grams,
              calories: scale(item.per100g!.calories, item.grams),
              protein_g: scale(item.per100g!.protein_g, item.grams),
              carbs_g: scale(item.per100g!.carbs_g, item.grams),
              fat_g: scale(item.per100g!.fat_g, item.grams),
              fiber_g: scale(item.per100g!.fiber_g, item.grams),
              sugar_g: scale(item.per100g!.sugar_g, item.grams),
            }),
          })
        )
      );
      router.refresh();
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to log items");
      setPhase("reviewing");
    }
  }

  // ── USDA search: log single food ──
  async function logUsda(food: UsdaFood) {
    const g = usdaGrams[food.fdcId] ?? food.defaultServing ?? 100;
    setUsdaLoading(String(food.fdcId)); setError(null);
    try {
      const res = await fetch("/api/nutrition/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date, meal_name: slot,
          food_name: food.brand ? `${food.name} (${food.brand})` : food.name,
          food_id: null, servings: g,
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
    } finally { setUsdaLoading(null); }
  }

  // ── Custom entry: log ──
  async function logCustom() {
    if (!cName.trim()) { setError("Food name is required."); return; }
    setCustomLoading(true); setError(null);
    try {
      const res = await fetch("/api/nutrition/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date, meal_name: slot, food_name: cName.trim(), food_id: null, servings: null,
          calories: parseFloat(cCal) || 0, protein_g: parseFloat(cP) || 0,
          carbs_g: parseFloat(cC) || 0, fat_g: parseFloat(cF) || 0,
          fiber_g: parseFloat(cFib) || null, sugar_g: parseFloat(cSug) || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      router.refresh(); handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally { setCustomLoading(false); }
  }

  if (!isOpen) return null;

  const totals = sumMacros(reviewItems);
  const allLookedUp = reviewItems.every((i) => !i.looking_up);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      style={{ backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="flex w-full max-w-[580px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        style={{ maxHeight: "88vh" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <span className="text-base font-bold">Log Food</span>
          <button onClick={handleClose} className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-hover text-muted transition hover:text-foreground">
            <X size={15} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 border-b border-border px-5 pt-4">
          {(["photo", "search", "custom"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); }}
              className={`mb-[-1px] border-b-2 px-3 pb-2 text-[13px] font-medium transition ${
                tab === t ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t === "photo" ? "📷 Photo" : t === "search" ? "Search" : "Manual"}
            </button>
          ))}
        </div>

        {/* ── Meal slot ── */}
        <div className="flex flex-wrap gap-2 px-5 pt-3 pb-0">
          {MEAL_SLOTS.map((s) => (
            <button
              key={s}
              onClick={() => setSlot(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                slot === s ? "border-accent bg-accent/10 text-accent" : "border-border bg-background text-muted hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">

          {/* ═══════════════ PHOTO TAB ═══════════════ */}
          {tab === "photo" && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">

              {/* UPLOAD phase */}
              {phase === "upload" && (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-6">
                  {previewUrl && (
                    <img src={previewUrl} alt="meal preview" className="max-h-48 w-full rounded-xl object-cover" />
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-background px-8 py-8 text-center transition hover:border-accent hover:bg-accent/5 w-full"
                  >
                    <Camera size={32} className="text-muted" />
                    <div>
                      <p className="text-sm font-medium">Take or upload a photo</p>
                      <p className="mt-1 text-[12px] text-muted">Snap your meal — AI will identify foods and estimate portions</p>
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {error && <p className="text-sm text-red-400">{error}</p>}
                </div>
              )}

              {/* ANALYZING phase */}
              {phase === "analyzing" && (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-6">
                  {previewUrl && (
                    <img src={previewUrl} alt="meal" className="max-h-40 w-full rounded-xl object-cover opacity-60" />
                  )}
                  <div className="flex items-center gap-3 text-muted">
                    <Loader2 size={20} className="animate-spin text-accent" />
                    <span className="text-sm">Analyzing your meal…</span>
                  </div>
                  <p className="text-[11px] text-muted">Identifying foods and looking up nutrition data</p>
                </div>
              )}

              {/* REVIEWING phase */}
              {phase === "reviewing" && (
                <>
                  {previewUrl && (
                    <div className="px-5 pt-3">
                      <img src={previewUrl} alt="meal" className="h-28 w-full rounded-xl object-cover" />
                    </div>
                  )}
                  {analysisNotes && (
                    <p className="px-5 pt-2 text-[11px] text-muted italic">{analysisNotes}</p>
                  )}

                  <div className="flex-1 overflow-y-auto px-5 pt-3 pb-2">
                    {reviewItems.map((item) => {
                      const cal = item.per100g ? scale(item.per100g.calories, item.grams) : null;
                      const prot = item.per100g ? scale(item.per100g.protein_g, item.grams) : null;
                      const carb = item.per100g ? scale(item.per100g.carbs_g, item.grams) : null;
                      const fat = item.per100g ? scale(item.per100g.fat_g, item.grams) : null;
                      return (
                        <div key={item.id} className="mb-3 rounded-xl border border-border bg-background p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium capitalize">{item.food_name}</p>
                              {item.looking_up ? (
                                <p className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                                  <Loader2 size={10} className="animate-spin" /> Looking up nutrition…
                                </p>
                              ) : item.usdaName ? (
                                <p className="text-[10px] text-muted mt-0.5">USDA: {item.usdaName}</p>
                              ) : (
                                <p className="text-[10px] text-amber-400 mt-0.5">No USDA match — macros unknown</p>
                              )}
                            </div>
                            <button onClick={() => removeItem(item.id)} className="text-muted hover:text-red-400 transition shrink-0 mt-0.5">
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                step="5"
                                value={item.grams}
                                onChange={(e) => updateGrams(item.id, parseFloat(e.target.value) || item.grams)}
                                className="w-16 rounded-lg border border-border bg-surface px-2 py-0.5 text-center text-xs outline-none focus:border-accent"
                              />
                              <span className="text-[11px] text-muted">g</span>
                            </div>
                            {cal !== null && (
                              <span className="text-[11px] text-muted">
                                {cal} kcal · P{prot}g · C{carb}g · F{fat}g
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {reviewItems.length === 0 && (
                      <p className="py-6 text-center text-sm text-muted">No items identified. Try a clearer photo.</p>
                    )}
                  </div>

                  {/* Totals bar */}
                  {reviewItems.some((i) => i.per100g) && (
                    <div className="border-t border-border px-5 py-3">
                      <div className="flex items-center justify-between text-[11px] text-muted">
                        <span className="font-semibold text-foreground">{Math.round(totals.calories)} kcal total</span>
                        <span>P {totals.protein_g}g · C {totals.carbs_g}g · F {totals.fat_g}g</span>
                      </div>
                    </div>
                  )}

                  {error && <p className="px-5 pb-2 text-sm text-red-400">{error}</p>}

                  <div className="flex gap-2 px-5 pb-4 pt-1">
                    <button
                      onClick={() => { setPhase("upload"); setPreviewUrl(null); setReviewItems([]); }}
                      className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted transition hover:text-foreground"
                    >
                      Retake
                    </button>
                    <button
                      onClick={logReviewItems}
                      disabled={phase === "logging" || !allLookedUp || reviewItems.every((i) => !i.per100g)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-background transition hover:bg-accent-dark disabled:opacity-50"
                    >
                      {phase === "logging" ? (
                        <><Loader2 size={14} className="animate-spin" /> Logging…</>
                      ) : !allLookedUp ? (
                        <><Loader2 size={14} className="animate-spin" /> Looking up…</>
                      ) : (
                        <><CheckCircle2 size={14} /> Log {reviewItems.filter((i) => i.per100g).length} items</>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* LOGGING phase */}
              {phase === "logging" && (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-8">
                  <Loader2 size={24} className="animate-spin text-accent" />
                  <p className="text-sm text-muted">Logging your meal…</p>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ SEARCH TAB ═══════════════ */}
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
                  {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted" />}
                </div>
                <p className="mt-1.5 text-[11px] text-muted">Powered by USDA FoodData Central</p>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-4">
                {query.trim().length < 2 ? (
                  <p className="py-10 text-center text-sm text-muted">Type at least 2 characters to search</p>
                ) : searching ? (
                  <p className="py-10 text-center text-sm text-muted">Searching…</p>
                ) : usdaResults.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted">No results for &ldquo;{query}&rdquo;</p>
                ) : (
                  usdaResults.map((food) => {
                    const g = usdaGrams[food.fdcId] ?? 100;
                    return (
                      <div key={food.fdcId} className="border-b border-border/50 py-3 last:border-0">
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{food.name}</div>
                            {food.brand && <div className="text-[10px] text-muted">{food.brand}</div>}
                            <div className="mt-0.5 text-[10px] text-muted">
                              P {scale(food.per100g.protein_g, g)}g · C {scale(food.per100g.carbs_g, g)}g · F {scale(food.per100g.fat_g, g)}g
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <div className="text-right">
                              <div className="text-sm font-bold">{scale(food.per100g.calories, g)}</div>
                              <div className="text-[10px] text-muted">kcal</div>
                            </div>
                            <button
                              onClick={() => logUsda(food)}
                              disabled={!!usdaLoading}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-lg font-bold text-background transition hover:bg-accent-dark disabled:opacity-50"
                            >
                              {usdaLoading === String(food.fdcId) ? "…" : "+"}
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="number" min="1" step="5"
                            value={g}
                            onChange={(e) => setUsdaGrams((p) => ({ ...p, [food.fdcId]: parseFloat(e.target.value) || 100 }))}
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

          {/* ═══════════════ MANUAL TAB ═══════════════ */}
          {tab === "custom" && (
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="mb-3 text-[13px] text-muted">Enter food details manually</p>
              <input
                type="text" placeholder="Food name" value={cName}
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
                      type="number" min="0" step="0.1" value={val}
                      onChange={(e) => set(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
                    />
                  </div>
                ))}
              </div>
              {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
              <button
                onClick={logCustom} disabled={customLoading}
                className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-background transition hover:bg-accent-dark disabled:opacity-50"
              >
                {customLoading ? "Logging…" : "Add to Log"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
