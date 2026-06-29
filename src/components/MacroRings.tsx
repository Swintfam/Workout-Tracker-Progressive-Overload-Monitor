"use client";

const CIRCUMFERENCE = 2 * Math.PI * 33; // r=33

interface RingProps {
  label: string;
  value: number;
  goal: number;
  color: string;
}

function Ring({ label, value, goal, color }: RingProps) {
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  const offset = CIRCUMFERENCE * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-20 w-20">
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="40" cy="40" r="33"
            fill="none"
            stroke="var(--color-surface-hover)"
            strokeWidth="7"
          />
          <circle
            cx="40" cy="40" r="33"
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[13px] font-bold leading-tight">{value}g</span>
          <span className="text-[9px] text-muted">/ {goal}g</span>
        </div>
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      <span className="text-[10px] text-muted/50">{goal > 0 ? Math.round(pct * 100) : 0}%</span>
    </div>
  );
}

interface Props {
  protein: number;
  carbs: number;
  fat: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

export default function MacroRings({ protein, carbs, fat, proteinGoal, carbsGoal, fatGoal }: Props) {
  return (
    <div className="flex gap-5">
      <Ring label="Protein" value={protein} goal={proteinGoal} color="var(--color-accent)" />
      <Ring label="Carbs"   value={carbs}   goal={carbsGoal}   color="#f59e0b" />
      <Ring label="Fat"     value={fat}     goal={fatGoal}     color="#10b981" />
    </div>
  );
}
