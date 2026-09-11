"use client";

/**
 * AnatomyFigure — uses the ChatGPT-generated body-front.png + body-back.png
 * as visuals, with a transparent SVG overlay for clickable muscle regions.
 *
 * Overlay coordinates are in the original image pixel space (656 × 1199).
 * SVG viewBox matches so they scale together at any rendered size.
 */

export type MuscleStatus = "trained" | "rested" | "none";

interface MuscleRegion {
  muscle: string;
  points: string; // SVG polygon points
}

// ── Front figure regions (656 × 1199 pixel space) ────────────────────────────
const FRONT_REGIONS: MuscleRegion[] = [
  // Head / Neck
  { muscle: "Neck",       points: "290,165 370,165 375,230 285,230" },
  // Chest
  { muscle: "Chest",      points: "205,230 455,230 465,390 195,390" },
  // Shoulders
  { muscle: "Shoulders",  points: "130,210 210,210 215,320 125,340" },
  { muscle: "Shoulders",  points: "445,210 530,210 540,340 440,320" },
  // Biceps
  { muscle: "Biceps",     points: "115,320 190,320 195,485 105,490" },
  { muscle: "Biceps",     points: "465,320 540,320 550,490 460,485" },
  // Forearms
  { muscle: "Forearms",   points: "90,485 180,485 185,635 80,635" },
  { muscle: "Forearms",   points: "475,485 560,485 575,635 470,635" },
  // Abs
  { muscle: "Abs",        points: "255,385 405,385 415,545 245,545" },
  // Obliques
  { muscle: "Obliques",   points: "185,360 260,360 260,530 175,530" },
  { muscle: "Obliques",   points: "395,360 470,360 480,530 395,530" },
  // Hip flexors / Abductors
  { muscle: "Abductors",  points: "190,540 315,540 320,620 185,620" },
  { muscle: "Abductors",  points: "340,540 465,540 470,620 335,620" },
  // Quads
  { muscle: "Quads",      points: "185,615 320,615 325,815 180,815" },
  { muscle: "Quads",      points: "335,615 470,615 475,815 330,815" },
  // Knees
  { muscle: "Quads",      points: "200,810 315,810 320,875 195,875" },
  { muscle: "Quads",      points: "340,810 455,810 460,875 335,875" },
  // Tibialis / front calves
  { muscle: "Calves",     points: "200,870 295,870 300,1005 195,1005" },
  { muscle: "Calves",     points: "360,870 455,870 460,1005 355,1005" },
];

// ── Back figure regions (656 × 1199 pixel space) ─────────────────────────────
const BACK_REGIONS: MuscleRegion[] = [
  // Neck / Nape
  { muscle: "Neck",        points: "290,165 370,165 375,225 285,225" },
  // Traps
  { muscle: "Traps",       points: "210,185 450,185 455,310 205,310" },
  // Back deltoids
  { muscle: "Shoulders",   points: "130,200 215,200 220,305 125,320" },
  { muscle: "Shoulders",   points: "440,200 530,200 540,320 435,305" },
  // Lats
  { muscle: "Lats",        points: "155,295 270,295 280,470 145,470" },
  { muscle: "Lats",        points: "385,295 500,295 510,470 380,470" },
  // Upper back (rhomboids / mid traps)
  { muscle: "Upper Back",  points: "255,200 405,200 410,350 250,350" },
  // Lower back
  { muscle: "Lower Back",  points: "260,395 395,395 400,490 255,490" },
  // Triceps
  { muscle: "Triceps",     points: "115,295 185,295 190,475 105,480" },
  { muscle: "Triceps",     points: "470,295 540,295 550,480 465,475" },
  // Forearm extensors (back of arm)
  { muscle: "Forearms",    points: "85,475 170,475 175,635 75,640" },
  { muscle: "Forearms",    points: "485,475 570,475 580,640 480,635" },
  // Glutes
  { muscle: "Glutes",      points: "200,480 455,480 465,630 190,630" },
  // Hamstrings
  { muscle: "Hamstrings",  points: "200,625 320,625 330,820 195,820" },
  { muscle: "Hamstrings",  points: "335,625 455,625 460,820 330,820" },
  // Calves (back)
  { muscle: "Calves",      points: "205,815 305,815 310,1005 200,1005" },
  { muscle: "Calves",      points: "350,815 450,815 455,1005 345,1005" },
];

function fillFor(muscle: string, status: Record<string, MuscleStatus>): string {
  const s = status[muscle] ?? "none";
  if (s === "trained") return "rgba(239,68,68,0.42)";
  if (s === "rested")  return "rgba(34,197,94,0.38)";
  return "transparent";
}

interface Props {
  muscleStatus: Record<string, MuscleStatus>;
  onMuscleClick?: (muscle: string) => void;
}

function FigurePanel({
  src,
  regions,
  muscleStatus,
  onMuscleClick,
  label,
}: {
  src: string;
  regions: MuscleRegion[];
  muscleStatus: Record<string, MuscleStatus>;
  onMuscleClick?: (muscle: string) => void;
  label: string;
}) {
  return (
    <div style={{ position: "relative", flex: 1 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
      <svg
        viewBox="0 0 656 1199"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
        aria-hidden="true"
      >
        {regions.map((r, i) => (
          <polygon
            key={`${r.muscle}-${i}`}
            points={r.points}
            fill={fillFor(r.muscle, muscleStatus)}
            stroke="transparent"
            strokeWidth={0}
            style={{
              cursor: onMuscleClick ? "pointer" : "default",
              transition: "fill 0.2s",
            }}
            onClick={() => onMuscleClick?.(r.muscle)}
          />
        ))}
      </svg>
    </div>
  );
}

export default function AnatomyFigure({ muscleStatus, onMuscleClick }: Props) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <FigurePanel
        src="/body-front.png"
        regions={FRONT_REGIONS}
        muscleStatus={muscleStatus}
        onMuscleClick={onMuscleClick}
        label="Front muscle map"
      />
      <FigurePanel
        src="/body-back.png"
        regions={BACK_REGIONS}
        muscleStatus={muscleStatus}
        onMuscleClick={onMuscleClick}
        label="Back muscle map"
      />
    </div>
  );
}
