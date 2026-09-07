"use client";
import { useEffect, useRef, useState } from "react";
import { X, Play, Pause } from "lucide-react";
import { ExerciseDef, MuscleGroup } from "../lib/exercises";
import { resolveExerciseMedia, ResolvedMedia } from "../lib/exerciseMedia";
import { ExerciseGLTFPlayer } from "./ExerciseGLTFPlayer";

// ── Types ──────────────────────────────────────────────────────────────────────
type Tab    = "summary" | "history" | "howto";
type Metric = "heaviest" | "one_rm" | "best_set" | "best_set_vol" | "session_vol" | "total_reps";

const METRICS: { id: Metric; label: string }[] = [
  { id: "heaviest",     label: "Heaviest Weight" },
  { id: "one_rm",       label: "One Rep Max"     },
  { id: "best_set",     label: "Best Set"        },
  { id: "best_set_vol", label: "Best Set Volume" },
  { id: "session_vol",  label: "Session Volume"  },
  { id: "total_reps",   label: "Total Reps"      },
];

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: "Barbell", dumbbell: "Dumbbell", cable: "Cable",
  bodyweight: "Bodyweight", machine: "Machine", skill: "Skills / Rings",
  cardio: "Cardio", kettlebell: "Kettlebell", "full body": "Full Body",
};

interface SetEntry { reps: number; weight: number }
interface HistoryEntry {
  sets: number; reps: number; weight: number | null;
  is_drop_set: boolean; set_data: SetEntry[] | null; date: string;
}

// ── Metric helpers ─────────────────────────────────────────────────────────────
function getSets(entry: HistoryEntry): SetEntry[] {
  if (entry.set_data?.length) return entry.set_data;
  if (entry.sets)
    return Array.from({ length: entry.sets }, () => ({ reps: entry.reps, weight: entry.weight ?? 0 }));
  return [];
}
function computeMetric(entry: HistoryEntry, metric: Metric): number {
  const s = getSets(entry);
  if (!s.length) return 0;
  switch (metric) {
    case "heaviest":     return Math.max(...s.map(x => x.weight));
    case "one_rm":       return Math.max(...s.map(x => Math.round(x.weight * (1 + x.reps / 30))));
    case "best_set":     return Math.max(...s.map(x => x.weight * x.reps));
    case "best_set_vol": return Math.max(...s.map(x => x.weight * x.reps));
    case "session_vol":  return s.reduce((a, x) => a + x.weight * x.reps, 0);
    case "total_reps":   return s.reduce((a, x) => a + x.reps, 0);
  }
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function shortDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
}

// ── HL key / view helpers ──────────────────────────────────────────────────────
function hlKey(m: MuscleGroup): string {
  const map: Partial<Record<MuscleGroup, string>> = {
    Chest:"chest", Lats:"lats", "Upper Back":"upper-back", Traps:"traps",
    Shoulders:"shoulders", Biceps:"biceps", Triceps:"triceps",
    Forearms:"forearms", Neck:"neck",
    Abs:"abs", Obliques:"obliques", "Lower Back":"lower-back",
    Glutes:"glutes", Quads:"quads", Hamstrings:"hamstrings",
    Calves:"calves", Adductors:"adductors", Abductors:"abductors",
  };
  return map[m] ?? "";
}
const BACK_SET = new Set(["lats","upper-back","traps","triceps","lower-back","glutes","hamstrings","calves"]);

// ── Multi-muscle body SVG ──────────────────────────────────────────────────────
function BodySVGMulti({ hls, view }: { hls: Set<string>; view: "front" | "back" }) {
  const B = "rgb(var(--color-accent))";
  const G = "rgb(var(--color-muted))";
  const hi  = (p: string) => hls.has(p) ? B : G;
  const dim = (p: string) => hls.has(p) ? 1 : 0.22;

  if (view === "front") return (
    <svg viewBox="0 0 50 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <circle cx="25" cy="6" r="5" fill={G} opacity={0.4} />
      <rect x="22" y="10" width="6"  height="4"  rx="1"   fill={hi("neck")}      opacity={dim("neck")} />
      <rect x="10" y="14" width="7"  height="5"  rx="2.5" fill={hi("shoulders")} opacity={dim("shoulders")} />
      <rect x="33" y="14" width="7"  height="5"  rx="2.5" fill={hi("shoulders")} opacity={dim("shoulders")} />
      <rect x="17" y="14" width="16" height="5"  rx="1"   fill={hi("shoulders")} opacity={dim("shoulders")} />
      <rect x="10" y="19" width="7"  height="12" rx="3.5" fill={hi("biceps")}    opacity={dim("biceps")} />
      <rect x="33" y="19" width="7"  height="12" rx="3.5" fill={hi("biceps")}    opacity={dim("biceps")} />
      <rect x="17" y="19" width="16" height="10" rx="2"   fill={hi("chest")}     opacity={dim("chest")} />
      <rect x="10" y="32" width="6"  height="10" rx="3"   fill={hi("forearms")}  opacity={dim("forearms")} />
      <rect x="34" y="32" width="6"  height="10" rx="3"   fill={hi("forearms")}  opacity={dim("forearms")} />
      <rect x="20" y="29" width="10" height="12" rx="2"   fill={hi("abs")}       opacity={dim("abs")} />
      <rect x="16" y="30" width="4"  height="10" rx="2"   fill={hi("obliques")}  opacity={dim("obliques")} />
      <rect x="30" y="30" width="4"  height="10" rx="2"   fill={hi("obliques")}  opacity={dim("obliques")} />
      <rect x="16" y="41" width="18" height="4"  rx="2"   fill={G} opacity={0.2} />
      <rect x="13" y="43" width="3"  height="8"  rx="1.5" fill={hi("abductors")} opacity={dim("abductors")} />
      <rect x="34" y="43" width="3"  height="8"  rx="1.5" fill={hi("abductors")} opacity={dim("abductors")} />
      <rect x="21" y="45" width="4"  height="14" rx="2"   fill={hi("adductors")} opacity={dim("adductors")} />
      <rect x="25" y="45" width="4"  height="14" rx="2"   fill={hi("adductors")} opacity={dim("adductors")} />
      <rect x="16" y="45" width="5"  height="14" rx="2.5" fill={hi("quads")}     opacity={dim("quads")} />
      <rect x="29" y="45" width="5"  height="14" rx="2.5" fill={hi("quads")}     opacity={dim("quads")} />
      <rect x="16" y="60" width="8"  height="13" rx="3"   fill={hi("calves")}    opacity={dim("calves")} />
      <rect x="26" y="60" width="8"  height="13" rx="3"   fill={hi("calves")}    opacity={dim("calves")} />
    </svg>
  );
  return (
    <svg viewBox="0 0 50 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <circle cx="25" cy="6" r="5" fill={G} opacity={0.4} />
      <path d="M17 11 Q25 9 33 11 L33 19 Q25 16 17 19 Z"   fill={hi("traps")}      opacity={dim("traps")} />
      <rect x="10" y="14" width="7"  height="13" rx="3.5"  fill={hi("triceps")}    opacity={dim("triceps")} />
      <rect x="33" y="14" width="7"  height="13" rx="3.5"  fill={hi("triceps")}    opacity={dim("triceps")} />
      <rect x="17" y="19" width="16" height="8"  rx="2"    fill={hi("upper-back")} opacity={dim("upper-back")} />
      <path d="M13 21 L17 21 L17 30 L12 27 Z"               fill={hi("lats")}       opacity={dim("lats")} />
      <path d="M37 21 L33 21 L33 30 L38 27 Z"               fill={hi("lats")}       opacity={dim("lats")} />
      <rect x="17" y="27" width="16" height="12" rx="2"    fill={hi("lower-back")} opacity={dim("lower-back")} />
      <rect x="10" y="28" width="6"  height="10" rx="3"    fill={hi("forearms")}   opacity={dim("forearms")} />
      <rect x="34" y="28" width="6"  height="10" rx="3"    fill={hi("forearms")}   opacity={dim("forearms")} />
      <rect x="17" y="39" width="16" height="8"  rx="3"    fill={hi("glutes")}     opacity={dim("glutes")} />
      <rect x="17" y="47" width="8"  height="13" rx="2.5"  fill={hi("hamstrings")} opacity={dim("hamstrings")} />
      <rect x="25" y="47" width="8"  height="13" rx="2.5"  fill={hi("hamstrings")} opacity={dim("hamstrings")} />
      <rect x="17" y="61" width="8"  height="12" rx="3"    fill={hi("calves")}     opacity={dim("calves")} />
      <rect x="25" y="61" width="8"  height="12" rx="3"    fill={hi("calves")}     opacity={dim("calves")} />
    </svg>
  );
}

// ── Bar chart ──────────────────────────────────────────────────────────────────
function BarChart({ data, metric }: { data: HistoryEntry[]; metric: Metric }) {
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10">
        <svg width="48" height="40" viewBox="0 0 48 40" fill="none">
          <rect x="4"  y="22" width="10" height="16" rx="2" fill="rgb(var(--color-muted))" opacity={0.3} />
          <rect x="19" y="14" width="10" height="24" rx="2" fill="rgb(var(--color-muted))" opacity={0.3} />
          <rect x="34" y="6"  width="10" height="32" rx="2" fill="rgb(var(--color-muted))" opacity={0.3} />
        </svg>
        <p className="text-sm text-muted">No data yet</p>
      </div>
    );
  }
  const pts  = [...data].reverse().slice(-10);
  const vals = pts.map(d => computeMetric(d, metric));
  const maxV = Math.max(...vals, 1);
  const W = 300; const H = 110;
  const pT = 8; const pB = 28; const pL = 6; const pR = 6;
  const cW = W - pL - pR; const cH = H - pT - pB;
  const barW = Math.max(8, Math.floor(cW / pts.length) - 3);
  const step = cW / pts.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 110 }} xmlns="http://www.w3.org/2000/svg">
      {pts.map((entry, i) => {
        const bH = Math.max(4, (vals[i] / maxV) * cH);
        const x  = pL + i * step + (step - barW) / 2;
        const y  = pT + cH - bH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bH} rx={2} fill="rgb(var(--color-accent))" opacity={0.85} />
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={8} fill="rgb(var(--color-muted))">
              {shortDate(entry.date)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Exercise video player ──────────────────────────────────────────────────────
function ExerciseVideoPlayer({
  animationUrl,
  thumbnailUrl,
  playback,
}: {
  animationUrl: string | null;
  thumbnailUrl: string | null;
  playback: ResolvedMedia["playback"];
}) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying]   = useState(false);
  const [speed,   setSpeed]     = useState<number>(playback.default_speed ?? 1.0);
  const speedOptions = playback.speed_options ?? [1.0, 0.5];

  // Detect reduced-motion preference
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !animationUrl) return;
    // Autoplay only when motion is allowed and playback config permits it
    if (!prefersReduced && playback.autoplay) {
      v.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [animationUrl, prefersReduced, playback.autoplay]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().then(() => setPlaying(true)).catch(() => {}); }
    else          { v.pause(); setPlaying(false); }
  }

  function cycleSpeed() {
    const v = videoRef.current;
    if (!v) return;
    const idx  = speedOptions.indexOf(speed);
    const next = speedOptions[(idx + 1) % speedOptions.length];
    v.playbackRate = next;
    setSpeed(next);
  }

  const [videoFailed, setVideoFailed] = useState(false);
  const showVideo = !!animationUrl && !videoFailed;
  const showThumbnail = !showVideo && !!thumbnailUrl;

  return (
    <div className="relative w-full bg-surface-hover" style={{ aspectRatio: "16/9" }}>
      {showVideo ? (
        <>
          <video
            ref={videoRef}
            src={animationUrl ?? undefined}
            poster={thumbnailUrl ?? undefined}
            loop={playback.loop}
            muted={playback.muted}
            playsInline={playback.plays_inline}
            className="w-full h-full object-cover"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => setVideoFailed(true)}
          />
          {/* Speed + play/pause controls */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
            <button
              onClick={cycleSpeed}
              className="px-2 py-1 rounded-lg bg-background/70 backdrop-blur-sm text-[11px] font-bold text-foreground"
            >
              {speed === 1 ? "1×" : "0.5×"}
            </button>
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-background/70 backdrop-blur-sm text-foreground"
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>
          {/* Reduced-motion overlay hint */}
          {prefersReduced && !playing && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/40"
            >
              <div className="p-3 rounded-full bg-background/80">
                <Play size={20} className="text-foreground" />
              </div>
              <span className="text-xs text-foreground/70">Tap to play</span>
            </button>
          )}
        </>
      ) : showThumbnail ? (
        /* No animation yet (or it failed to load) but we have a real still image */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl ?? undefined}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        /* Nothing produced yet for this exercise */
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-muted">Image coming soon</p>
        </div>
      )}
    </div>
  );
}

// ── Anatomy map (compact, side-by-side) ───────────────────────────────────────
function AnatomyMap({ frontHls, backHls }: { frontHls: Set<string>; backHls: Set<string> }) {
  return (
    <div className="flex justify-center gap-6 px-4 py-4">
      <div className="flex flex-col items-center gap-1">
        <div style={{ width: 72, height: 116 }}>
          <BodySVGMulti hls={frontHls} view="front" />
        </div>
        <span className="text-[10px] text-muted uppercase tracking-wide">Front</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div style={{ width: 72, height: 116 }}>
          <BodySVGMulti hls={backHls} view="back" />
        </div>
        <span className="text-[10px] text-muted uppercase tracking-wide">Back</span>
      </div>
    </div>
  );
}

// ── Component props ────────────────────────────────────────────────────────────
interface Props {
  ex: ExerciseDef;
  onClose: () => void;
  onAdd?: (ex: ExerciseDef) => void;
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ExerciseDetailSheet({ ex, onClose, onAdd }: Props) {
  const [tab,     setTab]     = useState<Tab>("summary");
  const [metric,  setMetric]  = useState<Metric>("heaviest");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [hLoading, setHLoading] = useState(true);
  const [media,   setMedia]   = useState<ResolvedMedia | null>(null);

  // Load workout history
  useEffect(() => {
    fetch(`/api/workouts/history?exercise=${encodeURIComponent(ex.name)}`)
      .then(r => r.json())
      .then(d => setHistory(Array.isArray(d) ? d : []))
      .catch(() => setHistory([]))
      .finally(() => setHLoading(false));
  }, [ex.name]);

  // Load media metadata on demand (only when exercise_id is present)
  useEffect(() => {
    if (!ex.exercise_id) return;
    resolveExerciseMedia(ex.exercise_id).then(setMedia);
  }, [ex.exercise_id]);

  // Build highlight sets
  const allHls   = new Set(ex.anatomicalHighlight.map(hlKey).filter(Boolean));
  const frontHls = new Set([...allHls].filter(k => !BACK_SET.has(k)));
  const backHls  = new Set([...allHls].filter(k =>  BACK_SET.has(k)));

  const isFullBody = ex.clickableSelections.includes("Full Body");
  const isCardio   = ex.clickableSelections.includes("Cardio");
  const isRoutine  = ex.demoType === "routine";

  // Full body / routine → light up everything
  if (isFullBody || isRoutine) {
    (["chest","shoulders","biceps","forearms","abs","quads","calves","adductors","obliques","neck"] as string[])
      .forEach(k => frontHls.add(k));
    (["traps","upper-back","lats","triceps","lower-back","glutes","hamstrings","calves"] as string[])
      .forEach(k => backHls.add(k));
  }

  // PRs (computed from history)
  const prHeaviest   = history.length ? Math.max(...history.map(e => computeMetric(e, "heaviest")))    : null;
  const prOneRM      = history.length ? Math.max(...history.map(e => computeMetric(e, "one_rm")))       : null;
  const prBestSetVol = history.length ? Math.max(...history.map(e => computeMetric(e, "best_set_vol"))) : null;
  const prTotalReps  = history.length ? Math.max(...history.map(e => computeMetric(e, "total_reps")))   : null;

  const equipLabel = EQUIPMENT_LABELS[ex.type] ?? ex.type;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background" style={{ height: "100dvh" }}>

      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 border-b border-border shrink-0"
        style={{ paddingTop: "max(16px, env(safe-area-inset-top))", paddingBottom: "12px" }}
      >
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-foreground truncate">{ex.name}</h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition">
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        {(["summary","history","howto"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold transition border-b-2 capitalize ${
              tab === t ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t === "howto" ? "How To" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* ── SUMMARY TAB ── */}
        {tab === "summary" && (
          <div className="pb-6">

            {/* 1. Video player / fallback */}
            {isCardio || isRoutine ? (
              /* Cardio / routine: show anatomy map as the hero visual */
              <div className="bg-surface-hover">
                <AnatomyMap frontHls={frontHls} backHls={backHls} />
              </div>
            ) : media?.animationFormat === 'gltf' && media.animationUrl ? (
              /* ── GLTF/Three.js anatomical animation ── */
              <ExerciseGLTFPlayer
                glbUrl={media.animationUrl}
                exerciseId={ex.exercise_id}
                activatedMuscles={ex.anatomicalHighlight}
                cameraView={media.cameraView}
                playback={media.playback}
              />
            ) : (
              /* ── Video fallback (mp4/webm) or "coming soon" placeholder ── */
              <ExerciseVideoPlayer
                animationUrl={media?.animationUrl ?? null}
                thumbnailUrl={media?.thumbnailUrl ?? null}
                playback={media?.playback ?? {
                  autoplay: true, loop: true, muted: true, plays_inline: true,
                  speed_options: [1.0, 0.5], default_speed: 1.0,
                }}
              />
            )}

            {/* 2. Name + equipment chip */}
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-lg font-bold text-foreground">{ex.name}</h3>
              <div className="flex flex-wrap gap-2 mt-1.5">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-surface border border-border text-muted uppercase tracking-wide">
                  {equipLabel}
                </span>
                {ex.isHold && (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-400 uppercase tracking-wide">
                    Hold — log in seconds
                  </span>
                )}
              </div>
            </div>

            {/* 3. Primary + secondary muscle labels */}
            <div className="px-4 pb-1">
              {ex.primaryMuscles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center mb-1">
                  <span className="text-[10px] text-muted uppercase tracking-wide w-16 shrink-0">Primary</span>
                  {ex.primaryMuscles.map(m => (
                    <span key={m} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-accent/15 text-accent">
                      {m}
                    </span>
                  ))}
                </div>
              )}
              {ex.secondaryMuscles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-muted uppercase tracking-wide w-16 shrink-0">Secondary</span>
                  {ex.secondaryMuscles.map(m => (
                    <span key={m} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface border border-border text-muted">
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Anatomy map — only for non-cardio/non-routine (cardio already has it as hero) */}
            {!isCardio && !isRoutine && (
              <div className="border-t border-border mt-3">
                <AnatomyMap frontHls={frontHls} backHls={backHls} />
              </div>
            )}

            {/* 5. Form cues area — placeholder until populated per exercise */}
            <div className="mx-4 mt-3 rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Form Cues</p>
              </div>
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <span className="text-2xl">📋</span>
                <p className="text-sm text-muted text-center">Form cues coming soon for this exercise.</p>
              </div>
            </div>

          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === "history" && (
          <div className="pb-6">

            {/* Chart card */}
            <div className="mx-4 mt-4 rounded-2xl border border-border bg-surface overflow-hidden">
              {hLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="px-3 pt-3 pb-1">
                  <BarChart data={history} metric={metric} />
                </div>
              )}
            </div>

            {/* Metric pills */}
            <div className="flex gap-2 px-4 mt-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {METRICS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMetric(m.id)}
                  className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap ${
                    metric === m.id
                      ? "bg-accent text-background"
                      : "border border-border bg-surface text-foreground hover:bg-surface-hover"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Personal Records */}
            <div className="mx-4 mt-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🏅</span>
                <p className="text-sm font-semibold text-foreground">Personal Records</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
                {[
                  { label: "Heaviest Weight",  val: prHeaviest   != null ? `${prHeaviest} lb`                    : "—" },
                  { label: "Best 1RM",          val: prOneRM      != null ? `${prOneRM} lb`                      : "—" },
                  { label: "Best Set Volume",   val: prBestSetVol != null ? `${prBestSetVol.toLocaleString()} lb` : "—" },
                  { label: "Most Reps (1 set)", val: prTotalReps  != null ? `${prTotalReps} reps`                : "—" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between px-4 py-3">
                    <p className="text-sm text-foreground">{row.label}</p>
                    <p className="text-sm font-semibold text-foreground">{row.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Session log */}
            <div className="mx-4 mt-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">📅</span>
                <p className="text-sm font-semibold text-foreground">Session History</p>
              </div>
              {hLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-3">
                  <span className="text-3xl">📭</span>
                  <p className="text-sm text-muted text-center">No sessions logged yet for {ex.name}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {history.map((entry, i) => {
                    const sets = getSets(entry);
                    return (
                      <div key={i} className="rounded-2xl border border-border bg-surface px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-foreground">{fmtDate(entry.date)}</p>
                          <div className="flex items-center gap-2">
                            {entry.is_drop_set && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-orange-500/15 text-orange-400">
                                Drop Set
                              </span>
                            )}
                            <span className="text-xs text-muted">{sets.length} sets</span>
                          </div>
                        </div>
                        {sets.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {sets.map((s, j) => (
                              <div key={j} className="flex items-center gap-2 text-xs text-muted">
                                <span className="w-5 text-muted/40 text-right">#{j + 1}</span>
                                <span className="text-foreground font-medium">
                                  {s.weight ? `${s.weight} lb` : "BW"}
                                </span>
                                <span className="text-muted/40">×</span>
                                <span>{s.reps} reps</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted">
                            {entry.sets} sets · {entry.reps} reps
                            {entry.weight ? ` · ${entry.weight} lb` : ""}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── HOW TO TAB ── */}
        {tab === "howto" && (
          <div className="flex flex-col items-center justify-center py-20 px-8 gap-4">
            <span className="text-4xl">📋</span>
            <p className="text-base font-semibold text-foreground text-center">Step-by-step instructions</p>
            <p className="text-sm text-muted text-center">Form guides are being added for each exercise.</p>
          </div>
        )}

      </div>

      {/* Add to Workout button */}
      {onAdd && (
        <div
          className="shrink-0 px-4 pt-3 border-t border-border bg-background"
          style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={() => { onAdd(ex); onClose(); }}
            className="w-full py-3.5 rounded-xl bg-accent text-background text-sm font-semibold transition hover:bg-accent-dark"
          >
            Add to Workout
          </button>
        </div>
      )}
    </div>
  );
}
