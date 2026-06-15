import { ArrowRight, Dumbbell } from "lucide-react";

// Placeholder — Phase B will compute this from the most recent
// workout_sessions rows + overload trend (ports
// analyze_overload_trend.py / check_progressive_overload.py).
export default function NextSessionPanel() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Next Session</h3>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
          Sample data
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-background">
          <Dumbbell size={20} />
        </div>
        <div>
          <p className="font-medium">Strength — Push Day</p>
          <p className="text-xs text-muted">Suggested for tomorrow</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background/40 p-3 text-sm text-muted">
        Last session: <span className="text-foreground">Bench Press 3×8 @ 185 lb</span>.
        Volume trending <span className="text-accent">up</span> — try 187.5 lb or
        add one rep.
      </div>

      <button className="flex items-center justify-center gap-2 rounded-xl bg-accent py-2 text-sm font-medium text-background transition hover:bg-accent-dark">
        Log today&apos;s session
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
