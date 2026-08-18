"use client";
import { useEffect, useRef, useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";

export interface ExerciseResult {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  target: string;
  secondaryMuscles: string[];
}

interface Props {
  onAdd: (ex: ExerciseResult) => void;
  onClose: () => void;
}

const BODY_PARTS = ["all muscles", "back", "cardio", "chest", "lower arms", "lower legs", "neck", "shoulders", "upper arms", "upper legs", "waist"];
const EQUIPMENT  = ["all equipment", "barbell", "body weight", "cable", "dumbbell", "kettlebell", "machine", "resistance band", "smith machine"];

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

export default function ExercisePicker({ onAdd, onClose }: Props) {
  const [query, setQuery]         = useState("");
  const [bodyPart, setBodyPart]   = useState("all muscles");
  const [equipment, setEquipment] = useState("all equipment");
  const [exercises, setExercises] = useState<ExerciseResult[]>([]);
  const [loading, setLoading]     = useState(false);
  const [showBPMenu, setShowBPMenu]  = useState(false);
  const [showEqMenu, setShowEqMenu]  = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchExercises(q: string, bp: string, eq: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "40", offset: "0" });
      if (q.trim().length > 1)           params.set("search", q.trim());
      else if (bp !== "all muscles")     params.set("bodyPart", bp);
      else if (eq !== "all equipment")   params.set("equipment", eq);
      const res  = await fetch(`/api/exercises?${params}`);
      const data = await res.json();
      setExercises(Array.isArray(data) ? data : []);
    } catch { setExercises([]); }
    setLoading(false);
  }

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchExercises(query, bodyPart, equipment), 350);
  }, [query, bodyPart, equipment]);

  const selectedCount = 0; // picker is single-add (tap to add immediately)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
        <button onClick={onClose} className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover transition">
          <X size={20} />
        </button>
        <span className="text-base font-semibold">Add Exercise</span>
        <div className="w-9" />
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

      {/* Filters */}
      <div className="flex gap-2 px-4 pb-3">
        {/* Equipment filter */}
        <div className="relative flex-1">
          <button
            onClick={() => { setShowEqMenu(v => !v); setShowBPMenu(false); }}
            className={`w-full flex items-center justify-between gap-1 rounded-xl px-3 py-2 text-sm font-medium border transition ${
              equipment !== "all equipment"
                ? "bg-accent/10 border-accent/40 text-accent"
                : "bg-surface border-border text-foreground"
            }`}
          >
            <span className="truncate">{cap(equipment)}</span>
            <ChevronDown size={14} className="flex-shrink-0" />
          </button>
          {showEqMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-surface border border-border rounded-xl overflow-hidden shadow-lg">
              {EQUIPMENT.map(eq => (
                <button key={eq}
                  onClick={() => { setEquipment(eq); setShowEqMenu(false); setQuery(""); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-surface-hover ${
                    equipment === eq ? "text-accent font-medium" : "text-foreground"
                  }`}
                >{cap(eq)}</button>
              ))}
            </div>
          )}
        </div>

        {/* Body part filter */}
        <div className="relative flex-1">
          <button
            onClick={() => { setShowBPMenu(v => !v); setShowEqMenu(false); }}
            className={`w-full flex items-center justify-between gap-1 rounded-xl px-3 py-2 text-sm font-medium border transition ${
              bodyPart !== "all muscles"
                ? "bg-accent/10 border-accent/40 text-accent"
                : "bg-surface border-border text-foreground"
            }`}
          >
            <span className="truncate">{cap(bodyPart)}</span>
            <ChevronDown size={14} className="flex-shrink-0" />
          </button>
          {showBPMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-surface border border-border rounded-xl overflow-hidden shadow-lg">
              {BODY_PARTS.map(bp => (
                <button key={bp}
                  onClick={() => { setBodyPart(bp); setShowBPMenu(false); setQuery(""); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-surface-hover ${
                    bodyPart === bp ? "text-accent font-medium" : "text-foreground"
                  }`}
                >{cap(bp)}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted text-sm">Loading exercises…</div>
        ) : exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <span className="text-2xl">🏋️</span>
            <p className="text-sm text-muted">
              {!process.env.RAPIDAPI_KEY && exercises.length === 0
                ? "Add your RAPIDAPI_KEY to load exercises"
                : "No exercises found"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {exercises.map(ex => (
              <button
                key={ex.id}
                onClick={() => onAdd(ex)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition text-left"
              >
                {/* GIF thumbnail */}
                <div className="w-14 h-14 rounded-xl bg-surface flex-shrink-0 overflow-hidden border border-border">
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
                {/* Info */}
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
    </div>
  );
}
