// Placeholder goals — Phase B/C will pull real targets vs. actuals
// from workout_sessions / meals (and later Weekly Reviews).
const goals = [
  { label: "Weekly Workouts", current: 4, target: 5, unit: "sessions" },
  { label: "Daily Protein Avg", current: 142, target: 170, unit: "g" },
  { label: "Weekly Run Mileage", current: 6.2, target: 10, unit: "mi" },
];

export default function ProgressBars() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">This Week&apos;s Targets</h3>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
          Sample data
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {goals.map(({ label, current, target, unit }) => {
          const pct = Math.min(100, Math.round((current / target) * 100));
          return (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{label}</span>
                <span className="text-muted">
                  {current} / {target} {unit}
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
