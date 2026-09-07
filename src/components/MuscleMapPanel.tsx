"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
// Apache 2.0 — vulovix/body-muscles
import { FRONT_MUSCLES, BACK_MUSCLES } from "body-muscles";
import { muscleToIds } from "@/lib/muscleIds";

const RED  = "#EF4444";
const ORNG = "#F97316";
const DIM  = "rgba(255,255,255,0.06)";

interface Props {
  /** primary muscle strings from all logged exercises (deduplicated outside) */
  primary: string[];
  /** secondary muscle strings (excluding those already in primary) */
  secondary: string[];
}

export default function MuscleMapPanel({ primary, secondary }: Props) {
  const [open, setOpen] = useState(true);

  const pk = useMemo(() => muscleToIds(primary), [primary]);
  const sk = useMemo(() => {
    const s = muscleToIds(secondary);
    pk.forEach(id => s.delete(id));
    return s;
  }, [secondary, pk]);

  const fillOf   = (id: string) => pk.has(id) ? RED : sk.has(id) ? ORNG : DIM;
  const opOf     = (id: string) => pk.has(id) || sk.has(id) ? 1 : 0.55;

  const hasMuscles = pk.size > 0 || sk.size > 0;

  return (
    <div
      className="shrink-0 border-l border-border bg-surface flex flex-col items-center transition-all duration-200 overflow-hidden"
      style={{ width: open ? 116 : 28 }}
    >
      {/* Toggle strip */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-center py-2.5 text-muted hover:text-foreground border-b border-border/50 transition shrink-0"
        aria-label={open ? "Hide muscle map" : "Show muscle map"}
      >
        {open ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {open && (
        <div className="flex flex-col items-center gap-2 py-3 w-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <p className="text-[8px] font-bold uppercase tracking-widest text-muted/70 leading-none">Muscles</p>

          {/* Front view */}
          <svg viewBox="0 0 35 93" width={54} height={143} fill="none" aria-hidden="true">
            {FRONT_MUSCLES.map(m => (
              <path
                key={m.id}
                d={m.path}
                fill={fillOf(m.id)}
                opacity={opOf(m.id)}
              />
            ))}
          </svg>

          {/* Back view */}
          <svg viewBox="37 0 35 93" width={54} height={143} fill="none" aria-hidden="true">
            {BACK_MUSCLES.map(m => (
              <path
                key={m.id}
                d={m.path}
                fill={fillOf(m.id)}
                opacity={opOf(m.id)}
              />
            ))}
          </svg>

          {/* Legend */}
          <div className="flex flex-col gap-1 w-full px-2 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm shrink-0" style={{
                background: RED,
                backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,0.6) 2px,rgba(255,255,255,0.6) 3px)"
              }} />
              <span className="text-[8px] text-muted/70 leading-none">Primary</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: ORNG }} />
              <span className="text-[8px] text-muted/70 leading-none">Secondary</span>
            </div>
          </div>

          {hasMuscles && (
            <p className="text-[8px] text-muted/50 text-center mt-1">
              {primary.length}p · {secondary.length}s
            </p>
          )}
        </div>
      )}
    </div>
  );
}
