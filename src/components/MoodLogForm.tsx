"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOOD_COLORS } from "@/lib/mood-colors";
import type { MoodLog } from "@/lib/mood-colors";

const RATINGS = [1, 2, 3, 4, 5] as const;

interface Props {
  today: string;
  existing: MoodLog | null;
}

export default function MoodLogForm({ today, existing }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState<number>(existing?.rating ?? 0);
  const [note, setNote] = useState(existing?.note ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) { setError("Pick a rating."); return; }

    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/mental", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, rating, note: note.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="mb-4 font-medium">
        {existing ? "Update today's mood" : "How are you feeling today?"}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Rating selector */}
        <div className="flex gap-2">
          {RATINGS.map((r) => {
            const colors = MOOD_COLORS[r];
            const selected = rating === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRating(r)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-3 text-sm font-medium transition ${
                  selected
                    ? `${colors.bg} ${colors.text} ring-1 ring-current`
                    : "bg-surface-hover text-muted hover:text-foreground"
                }`}
              >
                <span className="text-lg font-bold">{r}</span>
                <span className="text-[10px] uppercase tracking-wide">
                  {colors.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Note */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
            Note (optional)
          </label>
          <textarea
            rows={2}
            placeholder="What's on your mind today?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {saved && <p className="text-sm text-green-500">Saved.</p>}

        <button
          type="submit"
          disabled={loading || !rating}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-background transition hover:bg-accent-dark disabled:opacity-50"
        >
          {loading ? "Saving…" : existing ? "Update" : "Log Mood"}
        </button>
      </form>
    </div>
  );
}
