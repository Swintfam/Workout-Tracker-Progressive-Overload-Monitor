import { ArrowRight, Dumbbell, Sparkles } from "lucide-react";
import Link from "next/link";

interface SessionRow {
  date: string;
  session_type: string;
  exercise: string;
  muscle_group: string | null;
  sets: number | null;
  reps: number | null;
  weight: number | null;
}

interface PlannedSession {
  target_date: string;
  session_type: string;
  muscle_group: string | null;
  exercise: string;
  target_sets: number | null;
  target_reps: number | null;
  target_weight: number | null;
  target_rpe: number | null;
  rationale: string | null;
}

interface Props {
  lastSession: SessionRow[];
  nextSession: PlannedSession | null;
}

export default function NextSessionPanel({ lastSession, nextSession }: Props) {
  const hasData = lastSession.length > 0;
  const lastDate = hasData ? lastSession[0].date : null;
  const lastType = hasData ? lastSession[0].session_type : null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      {nextSession && (
        <div className="rounded-xl border border-accent/40 bg-accent/10 p-3">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles size={14} className="text-accent" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-accent">
              Next Up · {nextSession.session_type}
            </h4>
          </div>
          <p className="text-sm font-medium">{nextSession.exercise}</p>
          <p className="text-xs text-muted">
            {[
              nextSession.target_sets && `${nextSession.target_sets} sets`,
              nextSession.target_reps && `${nextSession.target_reps} reps`,
              nextSession.target_weight && `@ ${nextSession.target_weight} lb`,
              nextSession.target_rpe && `RPE ${nextSession.target_rpe}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {nextSession.rationale && (
            <p className="mt-1 text-xs italic text-muted">{nextSession.rationale}</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Last Session</h3>
        {!hasData && (
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
            No data yet
          </span>
        )}
      </div>
      {hasData ? (
        <>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-background">
              <Dumbbell size={20} />
            </div>
            <div>
              <p className="font-medium">{lastType} Day</p>
              <p className="text-xs text-muted">
                {lastDate
                  ? new Date(lastDate + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                  : ""}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-3 text-sm text-muted">
            {lastSession.slice(0, 3).map((s, i) => (
              <div key={i} className={i > 0 ? "mt-1" : ""}>
                <span className="text-foreground">{s.exercise}</span>{" "}
                {s.sets}×{s.reps}
                {s.weight ? (
                  <span className="text-accent"> @ {s.weight} lb</span>
                ) : null}
              </div>
            ))}
            {lastSession.length > 3 && (
              <div className="mt-1 text-xs">
                +{lastSession.length - 3} more exercises
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-4 text-sm text-muted">
          <Dumbbell size={32} className="opacity-30" />
          <p>No sessions logged yet</p>
        </div>
      )}
      <Link
        href="/workouts/log"
        className="flex items-center justify-center gap-2 rounded-xl bg-accent py-2 text-sm font-medium text-background transition hover:bg-accent-dark"
      >
        Log today&apos;s session
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
