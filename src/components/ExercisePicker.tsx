"use client";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export interface ExerciseResult {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  target: string;
  secondaryMuscles: string[];
}

// ─── Equipment config ──────────────────────────────────────────────────────────
const EQUIPMENT_OPTS = [
  { apiVal: "body weight", label: "None" },
  { apiVal: "barbell",     label: "Barbell" },
  { apiVal: "dumbbell",    label: "Dumbbell" },
  { apiVal: "kettlebell",  label: "Kettlebell" },
  { apiVal: "machine",     label: "Machine" },
  { apiVal: "cable",       label: "Cable" },
  { apiVal: "resistance band", label: "Resistance Band" },
  { apiVal: "rope",        label: "Suspension" },
  { apiVal: "__other__",   label: "Other" },
] as const;

// ─── Muscle config ─────────────────────────────────────────────────────────────
const MUSCLE_SECTIONS = [
  {
    title: "Upper Body",
    muscles: [
      { label: "Abdominals", apiTarget: "abs",        apiType: "target",   view: "front", hl: "abs" },
      { label: "Biceps",     apiTarget: "biceps",     apiType: "target",   view: "front", hl: "biceps" },
      { label: "Chest",      apiTarget: "pectorals",  apiType: "target",   view: "front", hl: "chest" },
      { label: "Forearms",   apiTarget: "forearms",   apiType: "target",   view: "front", hl: "forearms" },
      { label: "Lats",       apiTarget: "lats",       apiType: "target",   view: "back",  hl: "lats" },
      { label: "Lower Back", apiTarget: "spine",      apiType: "target",   view: "back",  hl: "lower-back" },
      { label: "Neck",       apiTarget: "neck",       apiType: "bodyPart", view: "front", hl: "neck" },
      { label: "Shoulders",  apiTarget: "delts",      apiType: "target",   view: "front", hl: "shoulders" },
      { label: "Traps",      apiTarget: "traps",      apiType: "target",   view: "back",  hl: "traps" },
      { label: "Triceps",    apiTarget: "triceps",    apiType: "target",   view: "back",  hl: "triceps" },
      { label: "Upper Back", apiTarget: "upper back", apiType: "target",   view: "back",  hl: "upper-back" },
    ],
  },
  {
    title: "Lower Body",
    muscles: [
      { label: "Calves",     apiTarget: "lower legs", apiType: "bodyPart", view: "back",  hl: "calves" },
      { label: "Glutes",     apiTarget: "glutes",     apiType: "target",   view: "back",  hl: "glutes" },
      { label: "Hamstrings", apiTarget: "hamstrings", apiType: "target",   view: "back",  hl: "hamstrings" },
      { label: "Quads",      apiTarget: "quads",      apiType: "target",   view: "front", hl: "quads" },
    ],
  },
  {
    title: "Other",
    muscles: [
      { label: "Cardio", apiTarget: "cardio", apiType: "bodyPart", view: "front", hl: "cardio" },
    ],
  },
] as const;

type MuscleOpt = typeof MUSCLE_SECTIONS[number]["muscles"][number];
type EquipmentOpt = typeof EQUIPMENT_OPTS[number];

// ─── Body SVG with highlighted muscle ─────────────────────────────────────────
function BodySVG({ hl, view }: { hl: string; view: "front" | "back" }) {
  const B = "#3B82F6"; // blue highlight
  const G = "#4B5563"; // gray body
  const c = (...parts: string[]) => parts.includes(hl) ? B : G;

  if (view === "front") {
    return (
      <svg viewBox="0 0 50 76" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <circle cx="25" cy="6" r="5" fill={G} />
        {/* Neck */}
        <rect x="22" y="10" width="6" height="4" rx="1" fill={c("neck")} />
        {/* Left shoulder */}
        <rect x="10" y="14" width="7" height="5" rx="2.5" fill={c("shoulders")} />
        {/* Right shoulder */}
        <rect x="33" y="14" width="7" height="5" rx="2.5" fill={c("shoulders")} />
        {/* Shoulder bar (center) */}
        <rect x="17" y="14" width="16" height="5" rx="1" fill={c("shoulders")} />
        {/* Left upper arm */}
        <rect x="10" y="19" width="7" height="12" rx="3.5" fill={c("biceps")} />
        {/* Right upper arm */}
        <rect x="33" y="19" width="7" height="12" rx="3.5" fill={c("biceps")} />
        {/* Chest */}
        <rect x="17" y="19" width="16" height="10" rx="2" fill={c("chest")} />
        {/* Left forearm */}
        <rect x="10" y="32" width="6" height="10" rx="3" fill={c("forearms")} />
        {/* Right forearm */}
        <rect x="34" y="32" width="6" height="10" rx="3" fill={c("forearms")} />
        {/* Abs */}
        <rect x="18" y="29" width="14" height="12" rx="2" fill={c("abs")} />
        {/* Hip */}
        <rect x="17" y="41" width="16" height="4" rx="2" fill={G} />
        {/* Left quad */}
        <rect x="17" y="45" width="10" height="15" rx="3" fill={c("quads")} />
        {/* Right quad */}
        <rect x="23" y="45" width="10" height="15" rx="3" fill={c("quads")} />
        {/* Left calf */}
        <rect x="17" y="61" width="9" height="13" rx="3" fill={c("calves")} />
        {/* Right calf */}
        <rect x="24" y="61" width="9" height="13" rx="3" fill={c("calves")} />
      </svg>
    );
  }

  // Back view
  return (
    <svg viewBox="0 0 50 76" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <circle cx="25" cy="6" r="5" fill={G} />
      {/* Traps */}
      <path d="M17 11 Q25 9 33 11 L33 19 Q25 16 17 19 Z" fill={c("traps")} />
      {/* Left tricep */}
      <rect x="10" y="14" width="7" height="13" rx="3.5" fill={c("triceps")} />
      {/* Right tricep */}
      <rect x="33" y="14" width="7" height="13" rx="3.5" fill={c("triceps")} />
      {/* Upper back */}
      <rect x="17" y="19" width="16" height="8" rx="2" fill={c("upper-back")} />
      {/* Lats */}
      <path d="M13 21 L17 21 L17 30 L12 27 Z" fill={c("lats")} />
      <path d="M37 21 L33 21 L33 30 L38 27 Z" fill={c("lats")} />
      {/* Lower back */}
      <rect x="17" y="27" width="16" height="12" rx="2" fill={c("lower-back")} />
      {/* Left forearm */}
      <rect x="10" y="28" width="6" height="10" rx="3" fill={c("forearms")} />
      {/* Right forearm */}
      <rect x="34" y="28" width="6" height="10" rx="3" fill={c("forearms")} />
      {/* Glutes */}
      <rect x="17" y="39" width="16" height="8" rx="3" fill={c("glutes")} />
      {/* Left hamstring */}
      <rect x="17" y="47" width="10" height="14" rx="3" fill={c("hamstrings")} />
      {/* Right hamstring */}
      <rect x="23" y="47" width="10" height="14" rx="3" fill={c("hamstrings")} />
      {/* Left calf */}
      <rect x="17" y="62" width="9" height="12" rx="3" fill={c("calves")} />
      {/* Right calf */}
      <rect x="24" y="62" width="9" height="12" rx="3" fill={c("calves")} />
    </svg>
  );
}

// ─── Equipment SVG icons ───────────────────────────────────────────────────────
function EquipmentSVG({ type }: { type: string }) {
  const s = { stroke: "#6B7280", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  const f = { fill: "#6B7280" };

  switch (type) {
    case "body weight": return (
      <svg viewBox="0 0 40 40" {...{ xmlns: "http://www.w3.org/2000/svg" }}>
        <circle cx="20" cy="8" r="5" {...f} />
        <path d="M12 20 Q20 13 28 20 M20 13 L20 28 M13 24 L20 28 L27 24" {...s} />
      </svg>
    );
    case "barbell": return (
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="3"  y="16" width="7"  height="8" rx="1.5" {...f} />
        <rect x="30" y="16" width="7"  height="8" rx="1.5" {...f} />
        <rect x="8"  y="18" width="24" height="4" rx="2"   fill="#4B5563" />
      </svg>
    );
    case "dumbbell": return (
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="4"  y="15" width="8"  height="10" rx="2" {...f} />
        <rect x="28" y="15" width="8"  height="10" rx="2" {...f} />
        <rect x="10" y="18" width="20" height="4"  rx="2" fill="#4B5563" />
      </svg>
    );
    case "kettlebell": return (
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="26" r="10" {...f} />
        <path d="M15 18 Q20 7 25 18" {...s} strokeWidth={3} />
        <circle cx="20" cy="26" r="5" fill="#374151" />
      </svg>
    );
    case "machine": return (
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="8"  y="8"  width="24" height="24" rx="3" {...f} />
        <rect x="13" y="13" width="14" height="8"  rx="1.5" fill="#374151" />
        <circle cx="28" cy="28" r="2.5" fill="#374151" />
      </svg>
    );
    case "cable": return (
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="8"  r="4" {...f} />
        <line x1="20" y1="12" x2="20" y2="24" {...s} strokeWidth={2} />
        <rect x="14" y="24" width="12" height="8" rx="2" {...f} />
        <line x1="8"  y1="28" x2="14" y2="28" {...s} strokeWidth={2} />
        <line x1="26" y1="28" x2="32" y2="28" {...s} strokeWidth={2} />
      </svg>
    );
    case "resistance band": return (
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 20 Q12 8 20 20 Q28 32 35 20" {...s} strokeWidth={3} />
        <path d="M5 20 Q12 32 20 20 Q28 8 35 20" {...s} strokeWidth={3} />
      </svg>
    );
    case "rope": return (
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <line x1="20" y1="4" x2="20" y2="14" {...s} strokeWidth={2} />
        <circle cx="20" cy="16" r="3" {...f} />
        <line x1="17" y1="18" x2="8"  y2="28" {...s} strokeWidth={2} />
        <line x1="23" y1="18" x2="32" y2="28" {...s} strokeWidth={2} />
        <ellipse cx="8"  cy="31" rx="5" ry="3" {...f} />
        <ellipse cx="32" cy="31" rx="5" ry="3" {...f} />
      </svg>
    );
    default: return (
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="20" r="4" {...f} />
        <circle cx="20" cy="20" r="4" {...f} />
        <circle cx="28" cy="20" r="4" {...f} />
      </svg>
    );
  }
}

// ─── Bottom Sheet ──────────────────────────────────────────────────────────────
function BottomSheet({
  open, onClose, title, children,
  onClear, onApply, resultCount,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onClear: () => void;
  onApply: () => void;
  resultCount: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) { requestAnimationFrame(() => setVisible(true)); }
    else { setVisible(false); }
  }, [open]);

  if (!open && !visible) return null;

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />
      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl flex flex-col transition-transform duration-300"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
          maxHeight: "85dvh",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        {/* Title */}
        <p className="text-center text-base font-semibold py-3 border-b border-border">{title}</p>
        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 py-4">
          {children}
        </div>
        {/* Footer */}
        <div className="flex gap-3 px-4 py-4 border-t border-border">
          <button
            onClick={onClear}
            className="flex-1 rounded-xl border border-border py-3.5 text-sm font-semibold text-foreground transition hover:bg-surface-hover"
          >
            Clear Filters
          </button>
          <button
            onClick={onApply}
            className="flex-[2] rounded-xl bg-accent py-3.5 text-sm font-semibold text-background transition hover:bg-accent-dark"
          >
            {resultCount > 0 ? `Show ${resultCount} results` : "Show results"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
interface Props {
  onAdd: (ex: ExerciseResult) => void;
  onClose: () => void;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ExercisePicker({ onAdd, onClose }: Props) {
  const [query, setQuery]           = useState("");
  const [exercises, setExercises]   = useState<ExerciseResult[]>([]);
  const [loading, setLoading]       = useState(false);
  const [noKey, setNoKey]           = useState(false);

  const [selEquip, setSelEquip]     = useState<EquipmentOpt | null>(null);
  const [selMuscle, setSelMuscle]   = useState<MuscleOpt | null>(null);

  const [sheetEquip, setSheetEquip]   = useState(false);
  const [sheetMuscle, setSheetMuscle] = useState(false);

  // Pending selections (committed on "Show results")
  const [pendingEquip, setPendingEquip]   = useState<EquipmentOpt | null>(null);
  const [pendingMuscle, setPendingMuscle] = useState<MuscleOpt | null>(null);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchExercises(
    q: string,
    equip: EquipmentOpt | null,
    muscle: MuscleOpt | null,
  ) {
    setLoading(true);
    setNoKey(false);
    try {
      const params = new URLSearchParams({ limit: "50", offset: "0" });
      if (q.trim().length > 1) {
        params.set("search", q.trim());
      } else if (muscle) {
        if (muscle.apiType === "target") params.set("target", muscle.apiTarget);
        else params.set("bodyPart", muscle.apiTarget);
      } else if (equip && equip.apiVal !== "__other__") {
        params.set("equipment", equip.apiVal);
      }

      const res = await fetch(`/api/exercises?${params}`);
      if (res.status === 503) { setNoKey(true); setExercises([]); setLoading(false); return; }
      const data = await res.json();
      let results: ExerciseResult[] = Array.isArray(data) ? data : [];

      // If muscle AND equip both active, filter client-side by equipment
      if (muscle && equip && equip.apiVal !== "__other__" && q.trim().length <= 1) {
        results = results.filter(e => e.equipment === equip.apiVal);
      }

      setExercises(results);
    } catch { setExercises([]); }
    setLoading(false);
  }

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchExercises(query, selEquip, selMuscle), 350);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selEquip, selMuscle]);

  function openEquip() {
    setPendingEquip(selEquip);
    setSheetEquip(true);
  }
  function openMuscle() {
    setPendingMuscle(selMuscle);
    setSheetMuscle(true);
  }
  function applyEquip() {
    setSelEquip(pendingEquip);
    setSheetEquip(false);
  }
  function applyMuscle() {
    setSelMuscle(pendingMuscle);
    setSheetMuscle(false);
  }
  function clearAll() {
    setPendingEquip(null);
    setPendingMuscle(null);
  }

  const hasFilter = selEquip || selMuscle;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ height: "100dvh" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 border-b border-border">
        <button
          onClick={onClose}
          className="rounded-xl px-3 py-2 text-sm text-accent font-medium transition hover:bg-surface-hover"
        >
          Cancel
        </button>
        <span className="text-base font-semibold">Add Exercise</span>
        <div className="w-16" /> {/* spacer — "Create" button deferred */}
      </div>

      {/* ── Search ── */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
          <Search size={16} className="text-muted flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search exercise"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <button
          onClick={openEquip}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium border transition ${
            selEquip
              ? "border-accent/50 bg-accent/10 text-accent"
              : "border-border bg-surface text-foreground"
          }`}
        >
          {selEquip ? selEquip.label : "Equipment"}
          {selEquip && (
            <span
              onClick={e => { e.stopPropagation(); setSelEquip(null); }}
              className="ml-1 text-accent/60 hover:text-accent"
            >
              <X size={12} />
            </span>
          )}
        </button>

        <button
          onClick={openMuscle}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium border transition ${
            selMuscle
              ? "border-accent/50 bg-accent/10 text-accent"
              : "border-border bg-surface text-foreground"
          }`}
        >
          {selMuscle ? selMuscle.label : "Muscle Group"}
          {selMuscle && (
            <span
              onClick={e => { e.stopPropagation(); setSelMuscle(null); }}
              className="ml-1 text-accent/60 hover:text-accent"
            >
              <X size={12} />
            </span>
          )}
        </button>

        {hasFilter && (
          <button
            onClick={() => { setSelEquip(null); setSelMuscle(null); }}
            className="text-xs text-muted hover:text-foreground transition ml-auto"
          >
            Clear all
          </button>
        )}
      </div>

      {/* ── Exercise list ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {noKey ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-3xl">🔑</span>
            <p className="text-sm text-muted text-center px-8">
              Add your <span className="text-foreground font-medium">RAPIDAPI_KEY</span> to load exercises from ExerciseDB.
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        ) : exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <span className="text-3xl">🏋️</span>
            <p className="text-sm text-muted">No exercises found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {exercises.map(ex => (
              <button
                key={ex.id}
                onClick={() => onAdd(ex)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition text-left active:bg-surface-hover"
              >
                <div className="w-14 h-14 rounded-xl bg-surface-hover flex-shrink-0 overflow-hidden border border-border">
                  {ex.gifUrl ? (
                    <img
                      src={ex.gifUrl}
                      alt={ex.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted text-xs">—</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground capitalize truncate">{ex.name}</p>
                  <p className="text-xs text-muted capitalize mt-0.5">{ex.target}</p>
                  <p className="text-xs text-muted/60 capitalize">{ex.equipment}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Equipment Sheet ── */}
      <BottomSheet
        open={sheetEquip}
        onClose={() => setSheetEquip(false)}
        title="Equipment"
        onClear={clearAll}
        onApply={applyEquip}
        resultCount={exercises.length}
      >
        <div className="grid grid-cols-2 gap-3">
          {EQUIPMENT_OPTS.map(opt => {
            const active = pendingEquip?.label === opt.label;
            return (
              <button
                key={opt.label}
                onClick={() => setPendingEquip(active ? null : opt)}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  active
                    ? "border-accent bg-accent/10"
                    : "border-border bg-surface hover:bg-surface-hover"
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${
                  active ? "bg-accent/20" : "bg-surface-hover"
                }`}>
                  <div className="w-8 h-8">
                    <EquipmentSVG type={opt.apiVal} />
                  </div>
                </div>
                <span className={`text-sm font-medium leading-tight ${active ? "text-accent" : "text-foreground"}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* ── Muscle Group Sheet ── */}
      <BottomSheet
        open={sheetMuscle}
        onClose={() => setSheetMuscle(false)}
        title="Muscle Group"
        onClear={clearAll}
        onApply={applyMuscle}
        resultCount={exercises.length}
      >
        {MUSCLE_SECTIONS.map(section => (
          <div key={section.title} className="mb-5">
            <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-3">
              {section.title}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {section.muscles.map(m => {
                const active = pendingMuscle?.label === m.label;
                return (
                  <button
                    key={m.label}
                    onClick={() => setPendingMuscle(active ? null : m)}
                    className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-accent bg-accent/10"
                        : "border-border bg-surface hover:bg-surface-hover"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden ${
                      active ? "bg-accent/10" : "bg-surface-hover"
                    }`}>
                      <div className="w-9 h-9">
                        <BodySVG hl={m.hl} view={m.view as "front" | "back"} />
                      </div>
                    </div>
                    <span className={`text-sm font-medium leading-tight ${active ? "text-accent" : "text-foreground"}`}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </BottomSheet>
    </div>
  );
}
