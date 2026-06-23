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
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">This Week&apos;s Rep Targets</h3>
      </div>
      <div className="flex flex-col gap-4">
        {goals.map(({ label, current, target, unit }) => {
          const pct = Math.min(100, Math.round((current / target) * 100));
          return (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{label}</span>
                <span className="text-muted">
                  {current.toLocaleString()} / {target.toLocaleString()} {unit}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
