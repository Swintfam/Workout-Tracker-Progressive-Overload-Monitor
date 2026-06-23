"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { MoodTrendPoint } from "@/lib/mental";

interface Props {
  data: MoodTrendPoint[];
}

export default function MoodTrendChart({ data }: Props) {
  const chartData = data.map((d) => ({
    label: d.weekLabel,
    avg: d.avgRating,
  }));

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="mb-1 text-sm font-medium">Mood Trend</p>
      <p className="mb-4 text-xs text-muted">Average rating per week (last 8 weeks)</p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 11, fill: "var(--color-muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              fontSize: "12px",
            }}
            formatter={(val: number) =>
              val != null ? [`${val} / 5`, "Avg mood"] : ["—", "No data"]
            }
          />
          <ReferenceLine y={3} stroke="var(--color-muted)" strokeDasharray="4 4" strokeOpacity={0.4} />
          <Line
            type="monotone"
            dataKey="avg"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--color-accent)", strokeWidth: 0 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
