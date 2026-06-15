"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Placeholder data — Phase B will replace this with real
// workout_sessions volume aggregated by day for the current week.
const sampleData = [
  { day: "Mon", volume: 4200 },
  { day: "Tue", volume: 3100 },
  { day: "Wed", volume: 0 },
  { day: "Thu", volume: 5400 },
  { day: "Fri", volume: 3800 },
  { day: "Sat", volume: 6200 },
  { day: "Sun", volume: 0 },
];

export default function WeeklyVolumeChart() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Weekly Volume</h3>
          <p className="text-xs text-muted">Sets × reps × weight, per day</p>
        </div>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
          Sample data
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={sampleData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgb(var(--color-border))"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            stroke="rgb(var(--color-muted))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="rgb(var(--color-muted))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--color-surface))",
              border: "1px solid rgb(var(--color-border))",
              borderRadius: "0.75rem",
              color: "rgb(var(--color-foreground))",
              fontSize: "0.8rem",
            }}
          />
          <Bar dataKey="volume" fill="rgb(var(--color-accent))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
