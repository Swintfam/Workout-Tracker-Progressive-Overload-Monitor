"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: { weekLabel: string; volume: number }[];
}

export default function VolumeTrendChart({ data }: Props) {
  const hasData = data.some((d) => d.volume > 0);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Volume Trend</h3>
          <p className="text-xs text-muted">Total sets × reps × weight, per week</p>
        </div>
        {!hasData && (
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
            No data yet
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgb(var(--color-border))"
            vertical={false}
          />
          <XAxis
            dataKey="weekLabel"
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
          <Line
            type="monotone"
            dataKey="volume"
            stroke="rgb(var(--color-accent))"
            strokeWidth={2}
            dot={{ r: 3, fill: "rgb(var(--color-accent))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
