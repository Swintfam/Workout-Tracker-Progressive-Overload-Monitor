"use client";
import { useMemo, useState } from "react";
import { Eye, Search, X } from "lucide-react";
import { EXERCISE_LIBRARY, ExerciseDef, MuscleGroup } from "../lib/exercises";
import ExerciseDetailSheet from "./ExerciseDetailSheet";

// ── ExerciseResult kept for log-page compatibility ─────────────────────────────
export interface ExerciseResult {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  target: string;
  secondaryMuscles: string[];
}

function toResult(def: ExerciseDef): ExerciseResult {
  return {
    id: def.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: def.name,
    bodyPart: def.appSection,
    equipment: def.type,
    gifUrl: "",
    target: (def.primaryMuscles[0] ?? def.clickableSelections[0] ?? "") as string,
    secondaryMuscles: def.secondaryMuscles as string[],
  };
}

// ── Equipment config ────────────────────────────────────────────────────────────
type ExerciseType = ExerciseDef["type"];

const EQUIPMENT_OPTS = [
  { apiVal: "bodyweight",  label: "Bodyweight" },
  { apiVal: "barbell",     label: "Barbell" },
  { apiVal: "dumbbell",    label: "Dumbbell" },
  { apiVal: "kettlebell",  label: "Kettlebell" },
  { apiVal: "machine",     label: "Machine" },
  { apiVal: "cable",       label: "Cable" },
  { apiVal: "skill",       label: "Skill / Calisthenics" },
  { apiVal: "cardio",      label: "Cardio" },
  { apiVal: "full body",   label: "Full Body" },
] as const;

type EquipmentOpt = typeof EQUIPMENT_OPTS[number];

// ── Muscle picker config (20 taxonomy groups) ───────────────────────────────────
const MUSCLE_PICKER_SECTIONS = [
  {
    title: "Upper Body",
    muscles: [
      { label: "Chest" as MuscleGroup,      hl: "chest",      view: "front" as const },
      { label: "Lats" as MuscleGroup,       hl: "lats",       view: "back"  as const },
      { label: "Upper Back" as MuscleGroup, hl: "upper-back", view: "back"  as const },
      { label: "Traps" as MuscleGroup,      hl: "traps",      view: "back"  as const },
      { label: "Shoulders" as MuscleGroup,  hl: "shoulders",  view: "front" as const },
      { label: "Biceps" as MuscleGroup,     hl: "biceps",     view: "front" as const },
      { label: "Triceps" as MuscleGroup,    hl: "triceps",    view: "back"  as const },
      { label: "Forearms" as MuscleGroup,   hl: "forearms",   view: "front" as const },
      { label: "Neck" as MuscleGroup,       hl: "neck",       view: "front" as const },
    ],
  },
  {
    title: "Core",
    muscles: [
      { label: "Abs" as MuscleGroup,        hl: "abs",        view: "front" as const },
      { label: "Obliques" as MuscleGroup,   hl: "obliques",   view: "front" as const },
      { label: "Lower Back" as MuscleGroup, hl: "lower-back", view: "back"  as const },
    ],
  },
  {
    title: "Lower Body",
    muscles: [
      { label: "Glutes" as MuscleGroup,     hl: "glutes",     view: "back"  as const },
      { label: "Quads" as MuscleGroup,      hl: "quads",      view: "front" as const },
      { label: "Hamstrings" as MuscleGroup, hl: "hamstrings", view: "back"  as const },
      { label: "Calves" as MuscleGroup,     hl: "calves",     view: "back"  as const },
      { label: "Adductors" as MuscleGroup,  hl: "adductors",  view: "front" as const },
      { label: "Abductors" as MuscleGroup,  hl: "abductors",  view: "front" as const },
    ],
  },
  {
    title: "Other",
    muscles: [
      { label: "Cardio" as MuscleGroup,    hl: "cardio",     view: "front" as const },
      { label: "Full Body" as MuscleGroup, hl: "full-body",  view: "front" as const },
    ],
  },
] as const;

type MuscleOpt = { label: MuscleGroup; hl: string; view: "front" | "back" };

// ── Body SVG ────────────────────────────────────────────────────────────────────
function BodySVG({ hl, view }: { hl: string; view: "front" | "back" }) {
  const B = "#3B82F6";
  const G = "#4B5563";
  const hi = (...parts: string[]) => (parts.includes(hl) || hl === "full-body") ? B : G;
  const hiBody = hl === "full-body";

  if (view === "front") {
    return (
      <svg viewBox="0 0 50 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <circle cx="25" cy="6" r="5" fill={G} />
        {/* Neck */}
        <rect x="22" y="10" width="6" height="4" rx="1" fill={hi("neck")} />
        {/* Shoulders (left + right + bar) */}
        <rect x="10" y="14" width="7" height="5" rx="2.5" fill={hi("shoulders")} />
        <rect x="33" y="14" width="7" height="5" rx="2.5" fill={hi("shoulders")} />
        <rect x="17" y="14" width="16" height="5" rx="1" fill={hi("shoulders")} />
        {/* Upper arms (biceps) */}
        <rect x="10" y="19" width="7" height="12" rx="3.5" fill={hi("biceps")} />
        <rect x="33" y="19" width="7" height="12" rx="3.5" fill={hi("biceps")} />
        {/* Chest */}
        <rect x="17" y="19" width="16" height="10" rx="2" fill={hi("chest")} />
        {/* Forearms */}
        <rect x="10" y="32" width="6" height="10" rx="3" fill={hi("forearms")} />
        <rect x="34" y="32" width="6" height="10" rx="3" fill={hi("forearms")} />
        {/* Abs */}
        <rect x="20" y="29" width="10" height="12" rx="2" fill={hi("abs")} />
        {/* Obliques */}
        <rect x="16" y="30" width="4"  height="10" rx="2" fill={hi("obliques")} />
        <rect x="30" y="30" width="4"  height="10" rx="2" fill={hi("obliques")} />
        {/* Hip */}
        <rect x="16" y="41" width="18" height="4" rx="2" fill={hiBody ? B : G} />
        {/* Adductors (inner thigh) */}
        <rect x="21" y="45" width="4"  height="14" rx="2" fill={hi("adductors")} />
        <rect x="25" y="45" width="4"  height="14" rx="2" fill={hi("adductors")} />
        {/* Quads (outer) */}
        <rect x="16" y="45" width="5"  height="14" rx="2.5" fill={hi("quads")} />
        <rect x="29" y="45" width="5"  height="14" rx="2.5" fill={hi("quads")} />
        {/* Abductors (outer hip) */}
        <rect x="13" y="43" width="3"  height="8"  rx="1.5" fill={hi("abductors")} />
        <rect x="34" y="43" width="3"  height="8"  rx="1.5" fill={hi("abductors")} />
        {/* Calves (front lower leg) */}
        <rect x="16" y="60" width="8"  height="13" rx="3" fill={hi("calves")} />
        <rect x="26" y="60" width="8"  height="13" rx="3" fill={hi("calves")} />
      </svg>
    );
  }

  // ── Back view ────────────────────────────────────────────────────────────────
  return (
    <svg viewBox="0 0 50 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <circle cx="25" cy="6" r="5" fill={G} />
      {/* Traps */}
      <path d="M17 11 Q25 9 33 11 L33 19 Q25 16 17 19 Z" fill={hi("traps")} />
      {/* Triceps */}
      <rect x="10" y="14" width="7" height="13" rx="3.5" fill={hi("triceps")} />
      <rect x="33" y="14" width="7" height="13" rx="3.5" fill={hi("triceps")} />
      {/* Upper back */}
      <rect x="17" y="19" width="16" height="8" rx="2" fill={hi("upper-back")} />
      {/* Lats */}
      <path d="M13 21 L17 21 L17 30 L12 27 Z" fill={hi("lats")} />
      <path d="M37 21 L33 21 L33 30 L38 27 Z" fill={hi("lats")} />
      {/* Lower back */}
      <rect x="17" y="27" width="16" height="12" rx="2" fill={hi("lower-back")} />
      {/* Forearms */}
      <rect x="10" y="28" width="6" height="10" rx="3" fill={hi("forearms")} />
      <rect x="34" y="28" width="6" height="10" rx="3" fill={hi("forearms")} />
      {/* Glutes */}
      <rect x="17" y="39" width="16" height="8" rx="3" fill={hi("glutes")} />
      {/* Hamstrings */}
      <rect x="17" y="47" width="8"  height="13" rx="2.5" fill={hi("hamstrings")} />
      <rect x="25" y="47" width="8"  height="13" rx="2.5" fill={hi("hamstrings")} />
      {/* Calves */}
      <rect x="17" y="61" width="8"  height="12" rx="3" fill={hi("calves")} />
      <rect x="25" y="61" width="8"  height="12" rx="3" fill={hi("calves")} />
    </svg>
  );
}

// ── Cardio / Full Body icon ─────────────────────────────────────────────────────
function CardioSVG() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 32 C20 32 6 22 6 13 C6 9 9 6 13 6 C16 6 18.5 8 20 10 C21.5 8 24 6 27 6 C31 6 34 9 34 13 C34 22 20 32 20 32Z" fill="#3B82F6" />
    </svg>
  );
}

function FullBodySVG() {
  const B = "#3B82F6";
  const G = "#4B5563";
  return (
    <svg viewBox="0 0 50 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="25" cy="6" r="5" fill={B} />
      <rect x="22" y="10" width="6" height="4" rx="1" fill={B} />
      <rect x="10" y="14" width="30" height="5" rx="2.5" fill={B} />
      <rect x="10" y="19" width="7" height="12" rx="3.5" fill={B} />
      <rect x="33" y="19" width="7" height="12" rx="3.5" fill={B} />
      <rect x="17" y="19" width="16" height="22" rx="2" fill={B} />
      <rect x="10" y="32" width="6" height="10" rx="3" fill={B} />
      <rect x="34" y="32" width="6" height="10" rx="3" fill={B} />
      <rect x="16" y="41" width="18" height="4" rx="2" fill={B} />
      <rect x="16" y="45" width="7"  height="14" rx="2.5" fill={B} />
      <rect x="27" y="45" width="7"  height="14" rx="2.5" fill={B} />
      <rect x="16" y="60" width="8"  height="13" rx="3" fill={B} />
      <rect x="26" y="60" width="8"  height="13" rx="3" fill={B} />
    </svg>
  );
}

// ── Equipment SVGs ──────────────────────────────────────────────────────────────
function EquipmentSVG({ type }: { type: string }) {
  const s = { stroke: "#6B7280", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  const f = { fill: "#6B7280" };

  switch (type) {
    case "bodyweight": return (
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="8" r="5" {...f} />
        <path d="M12 20 Q20 13 28 20 M20 13 L20 28 M13 24 L20 28 L27 24" {...s} />
      </svg>
    );
    case "barbell": return (
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="3"  y="16" width="7"  height="8" rx="1.5" {...f} />
        <rect x="30" y="16" width="7"  height="8" rx="1.5" {...f} />
        <rect x="8"  y="18" width="24" height="4" rx="2" fill="#4B5563" />
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
    case "skill": return (
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="8" r="5" {...f} />
        <line x1="6"  y1="18" x2="34" y2="18" {...s} strokeWidth={3} />
        <path d="M13 18 L13 32 M27 18 L27 32" {...s} strokeWidth={2} />
      </svg>
    );
    case "cardio": return (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 32 C20 32 6 22 6 13 C6 9 9 6 13 6 C16 6 18.5 8 20 10 C21.5 8 24 6 27 6 C31 6 34 9 34 13 C34 22 20 32 20 32Z" {...f} />
      </svg>
    );
    case "full body": return (
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="6" r="4" {...f} />
        <path d="M10 16 Q20 11 30 16 M20 11 L20 24 M13 20 L20 24 L27 20" {...s} />
        <line x1="16" y1="24" x2="14" y2="34" {...s} strokeWidth={2} />
        <line x1="24" y1="24" x2="26" y2="34" {...s} strokeWidth={2} />
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

// ── Bottom Sheet ────────────────────────────────────────────────────────────────
import { useEffect } from "react";

function BottomSheet({
  open, onClose, title, children, onClear, onApply, resultCount,
}: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
  onClear: () => void; onApply: () => void; resultCount: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [open]);
  if (!open && !visible) return null;

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div
        className="absolute inset-0 bg-black/60 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl flex flex-col transition-transform duration-300"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
          maxHeight: "85dvh",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <p className="text-center text-base font-semibold py-3 border-b border-border">{title}</p>
        <div className="overflow-y-auto flex-1 px-4 py-4">{children}</div>
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

// ── Main Component ──────────────────────────────────────────────────────────────
interface Props {
  onAdd: (ex: ExerciseResult) => void;
  onClose: () => void;
}

export default function ExercisePicker({ onAdd, onClose }: Props) {
  const [query, setQuery] = useState("");

  const [selEquip,  setSelEquip]  = useState<EquipmentOpt | null>(null);
  const [selMuscle, setSelMuscle] = useState<MuscleOpt | null>(null);

  const [sheetEquip,  setSheetEquip]  = useState(false);
  const [sheetMuscle, setSheetMuscle] = useState(false);

  const [pendingEquip,  setPendingEquip]  = useState<EquipmentOpt | null>(null);
  const [pendingMuscle, setPendingMuscle] = useState<MuscleOpt | null>(null);

  const [detailEx, setDetailEx] = useState<ExerciseDef | null>(null);

  // ── Filter logic (all client-side — static library) ────────────────────────
  const exercises = useMemo<ExerciseDef[]>(() => {
    let results = EXERCISE_LIBRARY;

    // Text search
    if (query.trim().length > 1) {
      const q = query.trim().toLowerCase();
      results = results.filter(e => e.name.toLowerCase().includes(q));
    }

    // Muscle filter
    if (selMuscle) {
      results = results.filter(e => e.clickableSelections.includes(selMuscle.label));
    }

    // Equipment/type filter
    if (selEquip) {
      results = results.filter(e => e.type === selEquip.apiVal);
    }

    return results;
  }, [query, selEquip, selMuscle]);

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

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 border-b border-border">
        <button
          onClick={onClose}
          className="rounded-xl px-3 py-2 text-sm text-accent font-medium transition hover:bg-surface-hover"
        >
          Cancel
        </button>
        <span className="text-base font-semibold">Add Exercise</span>
        <div className="w-16" />
      </div>

      {/* Search */}
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

      {/* Filter pills */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <button
          onClick={() => { setPendingEquip(selEquip); setSheetEquip(true); }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium border transition ${
            selEquip
              ? "border-accent/50 bg-accent/10 text-accent"
              : "border-border bg-surface text-foreground"
          }`}
        >
          {selEquip ? selEquip.label : "Equipment"}
          {selEquip && (
            <span onClick={e => { e.stopPropagation(); setSelEquip(null); }} className="ml-1 text-accent/60 hover:text-accent">
              <X size={12} />
            </span>
          )}
        </button>

        <button
          onClick={() => { setPendingMuscle(selMuscle); setSheetMuscle(true); }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium border transition ${
            selMuscle
              ? "border-accent/50 bg-accent/10 text-accent"
              : "border-border bg-surface text-foreground"
          }`}
        >
          {selMuscle ? selMuscle.label : "Muscle Group"}
          {selMuscle && (
            <span onClick={e => { e.stopPropagation(); setSelMuscle(null); }} className="ml-1 text-accent/60 hover:text-accent">
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

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <span className="text-3xl">🏋️</span>
            <p className="text-sm text-muted">No exercises found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {exercises.map(def => (
              <div key={def.name} className="flex items-center gap-3 px-4 py-3">
                {/* Tap row to add exercise */}
                <button
                  onClick={() => onAdd(toResult(def))}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-surface-hover flex-shrink-0 overflow-hidden border border-border flex items-center justify-center">
                    {def.clickableSelections.includes("Full Body") ? (
                      <div className="w-10 h-10"><FullBodySVG /></div>
                    ) : def.clickableSelections.includes("Cardio") ? (
                      <div className="w-8 h-8"><CardioSVG /></div>
                    ) : def.anatomicalHighlight.length > 0 ? (
                      <div className="w-10 h-10">
                        <BodySVG
                          hl={hlKeyForMuscle(def.anatomicalHighlight[0])}
                          view={viewForMuscle(def.anatomicalHighlight[0])}
                        />
                      </div>
                    ) : (
                      <div className="text-muted text-lg">💪</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{def.name}</p>
                    <p className="text-xs text-muted capitalize mt-0.5">
                      {def.primaryMuscles.length > 0
                        ? def.primaryMuscles.join(", ")
                        : def.clickableSelections.join(", ")}
                    </p>
                    <p className="text-xs text-muted/60 capitalize">{def.type}</p>
                  </div>
                </button>
                {/* Eye icon → detail sheet */}
                <button
                  onClick={() => setDetailEx(def)}
                  className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover transition flex-shrink-0"
                  aria-label={`Info for ${def.name}`}
                >
                  <Eye size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipment Sheet */}
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
                  active ? "border-accent bg-accent/10" : "border-border bg-surface hover:bg-surface-hover"
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${active ? "bg-accent/20" : "bg-surface-hover"}`}>
                  <div className="w-8 h-8"><EquipmentSVG type={opt.apiVal} /></div>
                </div>
                <span className={`text-sm font-medium leading-tight ${active ? "text-accent" : "text-foreground"}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* Exercise Detail Sheet */}
      {detailEx && (
        <ExerciseDetailSheet
          ex={detailEx}
          onClose={() => setDetailEx(null)}
          onAdd={(def) => { onAdd(toResult(def)); setDetailEx(null); onClose(); }}
        />
      )}

      {/* Muscle Group Sheet */}
      <BottomSheet
        open={sheetMuscle}
        onClose={() => setSheetMuscle(false)}
        title="Muscle Group"
        onClear={clearAll}
        onApply={applyMuscle}
        resultCount={exercises.length}
      >
        {MUSCLE_PICKER_SECTIONS.map(section => (
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
                      active ? "border-accent bg-accent/10" : "border-border bg-surface hover:bg-surface-hover"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden ${active ? "bg-accent/10" : "bg-surface-hover"}`}>
                      {m.hl === "full-body" ? (
                        <div className="w-8 h-8"><FullBodySVG /></div>
                      ) : m.hl === "cardio" ? (
                        <div className="w-7 h-7"><CardioSVG /></div>
                      ) : (
                        <div className="w-9 h-9">
                          <BodySVG hl={m.hl} view={m.view} />
                        </div>
                      )}
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

// ── Helpers: map MuscleGroup → SVG hl key / view ───────────────────────────────
function hlKeyForMuscle(m: MuscleGroup): string {
  const map: Partial<Record<MuscleGroup, string>> = {
    "Chest": "chest", "Lats": "lats", "Upper Back": "upper-back",
    "Traps": "traps", "Shoulders": "shoulders", "Biceps": "biceps",
    "Triceps": "triceps", "Forearms": "forearms", "Neck": "neck",
    "Abs": "abs", "Obliques": "obliques", "Lower Back": "lower-back",
    "Glutes": "glutes", "Quads": "quads", "Hamstrings": "hamstrings",
    "Calves": "calves", "Adductors": "adductors", "Abductors": "abductors",
    "Full Body": "full-body", "Cardio": "cardio",
  };
  return map[m] ?? "abs";
}

function viewForMuscle(m: MuscleGroup): "front" | "back" {
  const backMuscles: MuscleGroup[] = ["Lats","Upper Back","Traps","Triceps","Lower Back","Glutes","Hamstrings","Calves"];
  return backMuscles.includes(m) ? "back" : "front";
}
