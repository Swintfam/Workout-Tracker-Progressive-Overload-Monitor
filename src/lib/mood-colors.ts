// Client-safe exports — no server imports here.
// Used by both server and client components.

export const MOOD_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "bg-red-500/15",     text: "text-red-400",     label: "Rough" },
  2: { bg: "bg-orange-500/15",  text: "text-orange-400",  label: "Low" },
  3: { bg: "bg-yellow-500/15",  text: "text-yellow-400",  label: "Okay" },
  4: { bg: "bg-green-400/15",   text: "text-green-400",   label: "Good" },
  5: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Great" },
};

export interface MoodLog {
  id: string;
  user_id: string;
  date: string;
  rating: 1 | 2 | 3 | 4 | 5;
  note: string | null;
  created_at: string;
}

export interface WeekMoodDay {
  date: string;
  rating: number | null;
  note: string | null;
}

export interface MoodTrendPoint {
  weekStart: string;
  weekLabel: string;
  avgRating: number | null;
}
