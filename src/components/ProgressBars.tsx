interface Goal {
  label: string;
  current: number;
  target: number;
  unit: string;
}

interface Props {
  goals: Goal[];
}

export default function ProgressBars({ goals }: Props) {
  const hasAnyTarget = goals.some((g) => g.target > 0);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">This Week&apos;s Rep Targets</h3>
        {!hasAnyTarget && (
          <a href="/onboard" className="text-xs text-accent hover:underline">
            Set targets →
          </a>
        )}
      </div>
      <div className="flex flex-col gap-4">
        {goals.map(({ label, current, target, unit }) => {
          const hasTarget = target > 0;
          const pct = hasTarget ? Math.min(100, Math.round((current / target) * 100)) : 0;
          return (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{label}</span>
                <span className="text-muted">
                  {hasTarget
                    ? `${current.toLocaleString()} / ${target.toLocaleString()} ${unit}`
                    : `${current.toLocaleString()} ${unit} · no target`}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
                {hasTarget ? (
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${pct}%` }}
                  />
                ) : (
                  <div
                    className="h-full rounded-full bg-muted/30 transition-all"
                    style={{ width: current > 0 ? "100%" : "0%" }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
