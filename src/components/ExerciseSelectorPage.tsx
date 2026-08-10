"use client";
import { useState } from "react";
import { Check, X } from "lucide-react";
import {
  ExerciseDef,
  EXERCISE_LIBRARY,
  ExerciseType,
  MuscleGroup,
  MUSCLE_GROUP_DEFS,
  getExercisesByMuscle,
} from "@/lib/exercises";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  onConfirm: (exercises: ExerciseDef[]) => void;
  onClose: () => void;
}

// ─── Colours ──────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<ExerciseType, { bg: string; ic: string }> = {
  barbell:    { bg: "#185FA5", ic: "#B5D4F4" },
  dumbbell:   { bg: "#185FA5", ic: "#B5D4F4" },
  cable:      { bg: "#185FA5", ic: "#B5D4F4" },
  bodyweight: { bg: "#0F6E56", ic: "#9FE1CB" },
  machine:    { bg: "#5F5E5A", ic: "#D3D1C7" },
  skill:      { bg: "#534AB7", ic: "#CECBF6" },
  cardio:     { bg: "#993C1D", ic: "#F5C4B3" },
};

// ─── Body silhouette ──────────────────────────────────────────────────────────

function BodySilhouette({ muscle }: { muscle: MuscleGroup }) {
  const HL  = "#EF4444";
  const DIM = "#9CA3AF";
  const D   = 0.45; // dim opacity

  const isHL = (region: string): boolean => {
    const map: Record<MuscleGroup, string[]> = {
      chest:     ["chest"],
      back:      ["back"],
      shoulders: ["shoulders"],
      biceps:    ["biceps"],
      triceps:   ["triceps"],
      legs:      ["legs"],
      core:      ["abs"],
      skill:     ["chest", "shoulders", "biceps", "abs", "legs"],
      cardio:    ["legs", "abs"],
    };
    return (map[muscle] ?? []).includes(region);
  };

  const f = (r: string) => (isHL(r) ? HL  : DIM);
  const o = (r: string) => (isHL(r) ? 1   : D  );

  // Back view for back/triceps so the highlighted region makes anatomical sense
  const backView = muscle === "back" || muscle === "triceps";

  if (backView) {
    return (
      <svg width="28" height="46" viewBox="0 0 28 46" fill="none" aria-hidden="true">
        <circle cx="14" cy="4" r="3" fill={DIM} opacity={0.35} />
        {/* Traps / upper back */}
        <ellipse cx="5"  cy="12" rx="4" ry="3" fill={f("back")} opacity={o("back")} />
        <ellipse cx="23" cy="12" rx="4" ry="3" fill={f("back")} opacity={o("back")} />
        <rect x="8"  y="9"  width="12" height="12" rx="2"   fill={f("back")} opacity={o("back")} />
        <rect x="8"  y="22" width="12" height="8"  rx="1.5" fill={f("back")} opacity={o("back") * 0.55} />
        {/* Triceps */}
        <rect x="2"  y="13" width="4" height="8" rx="2" fill={f("triceps")} opacity={o("triceps")} />
        <rect x="22" y="13" width="4" height="8" rx="2" fill={f("triceps")} opacity={o("triceps")} />
        {/* Legs (back) */}
        <rect x="8"  y="31" width="5" height="14" rx="2" fill={DIM} opacity={D} />
        <rect x="15" y="31" width="5" height="14" rx="2" fill={DIM} opacity={D} />
      </svg>
    );
  }

  return (
    <svg width="28" height="46" viewBox="0 0 28 46" fill="none" aria-hidden="true">
      <circle cx="14" cy="4" r="3" fill={DIM} opacity={0.35} />
      {/* Shoulders */}
      <ellipse cx="5"  cy="12" rx="4" ry="3" fill={f("shoulders")} opacity={o("shoulders")} />
      <ellipse cx="23" cy="12" rx="4" ry="3" fill={f("shoulders")} opacity={o("shoulders")} />
      {/* Chest */}
      <rect x="8"  y="9"  width="12" height="9"  rx="2" fill={f("chest")} opacity={o("chest")} />
      {/* Biceps */}
      <rect x="2"  y="13" width="4"  height="8"  rx="2" fill={f("biceps")} opacity={o("biceps")} />
      <rect x="22" y="13" width="4"  height="8"  rx="2" fill={f("biceps")} opacity={o("biceps")} />
      {/* Abs */}
      <rect x="8"  y="19" width="12" height="11" rx="2" fill={f("abs")}  opacity={o("abs")}  />
      {/* Legs */}
      <rect x="8"  y="31" width="5"  height="14" rx="2" fill={f("legs")} opacity={o("legs")} />
      <rect x="15" y="31" width="5"  height="14" rx="2" fill={f("legs")} opacity={o("legs")} />
    </svg>
  );
}

// ─── Exercise illustrations ────────────────────────────────────────────────────

/** Custom SVG illustrations for key exercises. Returns null when no illustration exists. */
function CustomIllustration({ illustrationKey, color }: { illustrationKey: string; color: string }) {
  const c = color;
  switch (illustrationKey) {
    case "handstand":
      return (
        <svg width="38" height="48" viewBox="0 0 38 48" fill="none">
          <line x1="3"  y1="46" x2="14" y2="38" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="35" y1="46" x2="24" y2="38" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="14" y1="38" x2="24" y2="38" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="19" y1="38" x2="19" y2="18" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="19" y1="18" x2="13" y2="4"  stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="19" y1="18" x2="25" y2="4"  stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <circle cx="19" cy="46" r="3" fill={c} />
        </svg>
      );
    case "pull-up":
      return (
        <svg width="38" height="48" viewBox="0 0 38 48" fill="none">
          <line x1="1"  y1="5"    x2="37" y2="5"    stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="11" y1="5"    x2="15" y2="13"   stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="27" y1="5"    x2="23" y2="13"   stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="15" y1="13"   x2="23" y2="13"   stroke={c} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="19" y1="13"   x2="19" y2="28"   stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="19" cy="33" r="4.5" fill={c} />
          <line x1="19" y1="37.5" x2="13" y2="47"   stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="19" y1="37.5" x2="25" y2="47"   stroke={c} strokeWidth="2"   strokeLinecap="round" />
        </svg>
      );
    case "bench-press":
      return (
        <svg width="38" height="48" viewBox="0 0 38 48" fill="none">
          <rect x="5"  y="27" width="28" height="5" rx="2" fill={c} opacity={0.3} />
          <line x1="8"  y1="27" x2="8"  y2="43" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="30" y1="27" x2="30" y2="43" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <circle cx="19" cy="20" r="4.5" fill={c} />
          <line x1="19" y1="24.5" x2="19" y2="30" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="2"  y1="17"   x2="36" y2="17" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="2"  cy="17" r="2.5" fill={c} />
          <circle cx="36" cy="17" r="2.5" fill={c} />
          <line x1="13" y1="17" x2="13" y2="24.5" stroke={c} strokeWidth="2" strokeLinecap="round" />
          <line x1="25" y1="17" x2="25" y2="24.5" stroke={c} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "squat":
      return (
        <svg width="38" height="48" viewBox="0 0 38 48" fill="none">
          <circle cx="19" cy="7" r="4.5" fill={c} />
          <line x1="19" y1="11.5" x2="19" y2="24" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="12" y1="15"   x2="26" y2="15" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="19" y1="24"   x2="10" y2="35" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="19" y1="24"   x2="28" y2="35" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="10" y1="35"   x2="8"  y2="46" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="28" y1="35"   x2="30" y2="46" stroke={c} strokeWidth="2"   strokeLinecap="round" />
        </svg>
      );
    case "plank":
      return (
        <svg width="38" height="48" viewBox="0 0 38 48" fill="none">
          <line x1="5"  y1="40" x2="5"  y2="46" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="31" y1="32" x2="31" y2="46" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="5"  y1="40" x2="31" y2="26" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="35" cy="24" r="4.5" fill={c} />
          <line x1="1"  y1="46" x2="37" y2="46" stroke={c} strokeWidth="1"   strokeLinecap="round" opacity={0.3} />
        </svg>
      );
    case "l-sit":
      return (
        <svg width="38" height="48" viewBox="0 0 38 48" fill="none">
          <circle cx="4"  cy="22" r="3" fill={c} />
          <circle cx="34" cy="22" r="3" fill={c} />
          <line x1="4"  y1="25" x2="4"  y2="40" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="34" y1="25" x2="34" y2="40" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="4"  y1="31" x2="34" y2="31" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="19" cy="23" r="4.5" fill={c} />
          <line x1="19" y1="27.5" x2="19" y2="37" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="19" y1="33"   x2="36" y2="33" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="36" y1="33"   x2="36" y2="40" stroke={c} strokeWidth="2"   strokeLinecap="round" />
        </svg>
      );
    case "front-lever":
      return (
        <svg width="38" height="48" viewBox="0 0 38 48" fill="none">
          <line x1="1"  y1="8"  x2="37" y2="8"  stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="19" y1="8"  x2="19" y2="16" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <circle cx="19" cy="20.5" r="4.5" fill={c} />
          <line x1="19" y1="25" x2="19" y2="31" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="3"  y1="31" x2="35" y2="31" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="3"  y1="31" x2="3"  y2="40" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="35" y1="31" x2="35" y2="40" stroke={c} strokeWidth="2"   strokeLinecap="round" />
        </svg>
      );
    case "hollow-body":
      return (
        <svg width="38" height="48" viewBox="0 0 38 48" fill="none">
          <circle cx="34" cy="27" r="4" fill={c} />
          <line x1="34" y1="31" x2="5"  y2="30" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="5"  y1="30" x2="5"  y2="22" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="5"  y1="30" x2="5"  y2="38" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="34" y1="27" x2="38" y2="19" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="34" y1="27" x2="38" y2="35" stroke={c} strokeWidth="2"   strokeLinecap="round" />
        </svg>
      );
    case "push-up":
      return (
        <svg width="38" height="48" viewBox="0 0 38 48" fill="none">
          <line x1="5"  y1="37" x2="5"  y2="44" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="32" y1="30" x2="32" y2="44" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="5"  y1="37" x2="32" y2="24" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="36" cy="22" r="4.5" fill={c} />
          <line x1="1"  y1="44" x2="16" y2="44" stroke={c} strokeWidth="1"   strokeLinecap="round" opacity={0.35} />
        </svg>
      );
    case "running":
      return (
        <svg width="38" height="48" viewBox="0 0 38 48" fill="none">
          <circle cx="26" cy="6"  r="4" fill={c} />
          <line x1="26" y1="10"  x2="20" y2="22" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="20" y1="17"  x2="9"  y2="13" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="20" y1="17"  x2="28" y2="11" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="20" y1="22"  x2="12" y2="35" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="20" y1="22"  x2="27" y2="37" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="12" y1="35"  x2="7"  y2="46" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="27" y1="37"  x2="35" y2="44" stroke={c} strokeWidth="2"   strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

/** Fallback icon SVG when no custom illustration exists */
function TypeIcon({ type, color }: { type: ExerciseType; color: string }) {
  const c = color;
  switch (type) {
    case "barbell":
    case "dumbbell":
      return (
        <svg width="34" height="22" viewBox="0 0 34 22" fill="none">
          <line x1="8"  y1="11" x2="26" y2="11" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <rect x="0"  y="6"   width="7"  height="10" rx="1.5" fill={c} />
          <rect x="27" y="6"   width="7"  height="10" rx="1.5" fill={c} />
          <rect x="5"  y="7.5" width="4"  height="7"  rx="0.5" fill={c} opacity={0.65} />
          <rect x="25" y="7.5" width="4"  height="7"  rx="0.5" fill={c} opacity={0.65} />
        </svg>
      );
    case "cable":
      return (
        <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
          <rect x="0" y="0" width="28" height="9" rx="2" fill={c} opacity={0.35} />
          <line x1="14" y1="9"  x2="14" y2="26" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="14" y1="22" x2="22" y2="30" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <circle cx="22" cy="30" r="3.5" fill={c} />
        </svg>
      );
    case "bodyweight":
      return (
        <svg width="26" height="38" viewBox="0 0 26 38" fill="none">
          <circle cx="13" cy="5.5" r="4.5" fill={c} />
          <line x1="13" y1="10" x2="13" y2="22" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="5"  y1="15" x2="21" y2="15" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="13" y1="22" x2="7"  y2="33" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="13" y1="22" x2="19" y2="33" stroke={c} strokeWidth="2"   strokeLinecap="round" />
        </svg>
      );
    case "machine":
      return (
        <svg width="32" height="30" viewBox="0 0 32 30" fill="none">
          <rect x="2"  y="4"   width="28" height="22" rx="3"   stroke={c} strokeWidth="2" fill="none" />
          <line x1="2" y1="11" x2="30"   y2="11"              stroke={c} strokeWidth="1.5" opacity={0.5} />
          <circle cx="16" cy="20" r="4" fill={c} />
          <rect x="6" y="5.5" width="7" height="4" rx="1" fill={c} opacity={0.5} />
        </svg>
      );
    case "skill":
      return (
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <polygon
            points="15,2 18.5,10.5 28,10.5 20.5,16 23,25 15,19.5 7,25 9.5,16 2,10.5 11.5,10.5"
            fill={c}
          />
        </svg>
      );
    case "cardio":
      return (
        <svg width="30" height="38" viewBox="0 0 30 38" fill="none">
          <circle cx="22" cy="5.5" r="3.5" fill={c} />
          <line x1="22" y1="9"  x2="16" y2="20" stroke={c} strokeWidth="2"   strokeLinecap="round" />
          <line x1="16" y1="15" x2="7"  y2="11" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="16" y1="15" x2="23" y2="10" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="16" y1="20" x2="10" y2="30" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="16" y1="20" x2="21" y2="30" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="10" y1="30" x2="7"  y2="38" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="21" y1="30" x2="26" y2="37" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
}

// ─── Exercise card ─────────────────────────────────────────────────────────────

function ExerciseCard({
  ex,
  selected,
  onToggle,
}: {
  ex: ExerciseDef;
  selected: boolean;
  onToggle: () => void;
}) {
  const { bg, ic } = TYPE_COLORS[ex.type];
  const isSkill   = ex.type === "skill"  || ex.muscles.includes("skill");
  const isCardio  = ex.type === "cardio";
  const displayMuscles = ex.muscles
    .filter((m) => m !== "skill" && m !== "cardio")
    .join(" · ");

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-3 w-full px-3 py-3 rounded-2xl border text-left transition-colors ${
        selected
          ? "border-red-500/50 bg-red-500/10"
          : "border-border bg-surface hover:bg-surface-hover"
      }`}
    >
      {/* Illustration */}
      <div
        style={{ backgroundColor: bg }}
        className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
        aria-hidden="true"
      >
        {ex.illustrationKey ? (
          <CustomIllustration illustrationKey={ex.illustrationKey} color={ic} />
        ) : (
          <TypeIcon type={ex.type} color={ic} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span className="text-sm font-medium text-foreground leading-snug">{ex.name}</span>
          {ex.isHold && (
            <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded leading-none">
              HOLD
            </span>
          )}
          {isSkill && (
            <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded leading-none">
              SKILL
            </span>
          )}
          {isCardio && (
            <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded leading-none">
              CARDIO
            </span>
          )}
        </div>
        {displayMuscles && (
          <p className="text-xs text-muted truncate">{displayMuscles}</p>
        )}
      </div>

      {/* Checkbox */}
      <div
        className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
          selected ? "border-red-500 bg-red-500" : "border-muted"
        }`}
      >
        {selected && <Check size={11} className="text-white stroke-[3]" />}
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ExerciseSelectorPage({ onConfirm, onClose }: Props) {
  const [activeMuscle, setActiveMuscle] = useState<MuscleGroup>("chest");
  const [selected, setSelected]         = useState<Set<string>>(new Set());

  const exercises = getExercisesByMuscle(activeMuscle);
  const count     = selected.size;

  function toggleExercise(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function handleConfirm() {
    const picks = EXERCISE_LIBRARY.filter((ex) => selected.has(ex.name));
    onConfirm(picks);
  }

  const activeLabel = MUSCLE_GROUP_DEFS.find((m) => m.id === activeMuscle)?.label ?? "";

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      style={{ height: "100dvh" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 border-b border-border bg-background shrink-0"
           style={{ paddingTop: "max(12px, env(safe-area-inset-top))", paddingBottom: "12px" }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close exercise selector"
          className="p-1.5 -ml-1.5 rounded-xl text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
        >
          <X size={20} />
        </button>
        <h1 className="text-base font-semibold">Add exercises</h1>
        {count > 0 && (
          <span className="ml-auto text-xs font-medium bg-surface-hover text-muted px-2.5 py-1 rounded-xl">
            {count} selected
          </span>
        )}
      </div>

      {/* ── Muscle group row ── */}
      <div className="border-b border-border bg-surface shrink-0 px-3 py-3">
        <div
          className="flex gap-1.5 overflow-x-auto"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
          role="tablist"
          aria-label="Muscle groups"
        >
          {MUSCLE_GROUP_DEFS.map((mg) => {
            const isActive   = mg.id === activeMuscle;
            const isSkillTab = mg.id === "skill";
            const isCardioTab = mg.id === "cardio";
            const borderColor = isActive
              ? isSkillTab ? "#534AB7" : isCardioTab ? "#0F6E56" : "#EF4444"
              : "transparent";
            const bgColor = isActive
              ? isSkillTab ? "rgba(83,74,183,0.12)" : isCardioTab ? "rgba(15,110,86,0.12)" : "rgba(239,68,68,0.10)"
              : "transparent";
            const textColor = isActive
              ? isSkillTab ? "#CECBF6" : isCardioTab ? "#9FE1CB" : "#EF4444"
              : "";

            return (
              <button
                key={mg.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveMuscle(mg.id)}
                style={{ borderColor, backgroundColor: bgColor }}
                className="flex flex-col items-center gap-1.5 px-2.5 py-2 rounded-xl border-2 min-w-[58px] shrink-0 transition-colors"
              >
                <BodySilhouette muscle={mg.id} />
                <span
                  className="text-[10px] font-semibold leading-none"
                  style={{ color: isActive ? textColor : undefined }}
                >
                  {mg.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Exercise list ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-3 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {activeLabel}{" "}
            <span className="font-normal normal-case tracking-normal text-muted/60">
              · {exercises.length} exercises
            </span>
          </p>
        </div>
        <div className="px-4 pb-4 flex flex-col gap-2">
          {exercises.map((ex) => (
            <ExerciseCard
              key={ex.name}
              ex={ex}
              selected={selected.has(ex.name)}
              onToggle={() => toggleExercise(ex.name)}
            />
          ))}
        </div>
      </div>

      {/* ── Footer / add button ── */}
      <div
        className="shrink-0 border-t border-border bg-background px-4 pt-3"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={handleConfirm}
          disabled={count === 0}
          className="w-full py-3.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-accent text-background hover:bg-accent-dark"
        >
          {count === 0
            ? "Select exercises above"
            : `Add ${count} exercise${count > 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
