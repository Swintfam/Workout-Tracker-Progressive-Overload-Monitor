"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronRight, Dumbbell, SkipForward } from "lucide-react";
import ChromaticFluid from "@/components/ui/chromatic-fluid";

type Focus = "build_muscle" | "lose_weight" | "endurance" | "general";

const FOCUS_OPTIONS: { id: Focus; label: string; desc: string; targets: RepTargets }[] = [
  {
    id: "build_muscle",
    label: "Build Muscle",
    desc: "Higher Push / Pull / Legs volume to drive hypertrophy.",
    targets: { abs: 1500, pull: 800, push: 800, legs: 600 },
  },
  {
    id: "lose_weight",
    label: "Lose Weight",
    desc: "Balanced volume with emphasis on Abs and conditioning.",
    targets: { abs: 2500, pull: 600, push: 600, legs: 700 },
  },
  {
    id: "endurance",
    label: "Endurance",
    desc: "High rep targets across the board with Legs emphasis.",
    targets: { abs: 3000, pull: 400, push: 400, legs: 1000 },
  },
  {
    id: "general",
    label: "General Fitness",
    desc: "Moderate targets for all-around health and consistency.",
    targets: { abs: 1000, pull: 400, push: 400, legs: 400 },
  },
];

interface RepTargets {
  abs: number;
  pull: number;
  push: number;
  legs: number;
}

type Step = 1 | 2 | 3 | 4 | 5;

// Shared glass card style applied to every step card
const CARD =
  "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-2xl";

// Input style — dark glass, white text
const INPUT =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 backdrop-blur-sm";

export default function OnboardPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [displayName, setDisplayName] = useState("");

  // Step 2 + 3
  const [focus, setFocus] = useState<Focus | null>(null);
  const [targets, setTargets] = useState<RepTargets>({ abs: 0, pull: 0, push: 0, legs: 0 });

  // Step 4
  const [caloriesWeekly, setCaloriesWeekly] = useState("");
  const [proteinWeekly, setProteinWeekly] = useState("");
  const [carbsWeekly, setCarbsWeekly] = useState("");
  const [fatWeekly, setFatWeekly] = useState("");

  // Check if already onboarded — cookie is set server-side in the response,
  // then we do a hard navigation so middleware sees it immediately.
  useEffect(() => {
    fetch("/api/user-targets")
      .then((r) => {
        if (!r.ok) throw new Error("api_error");
        return r.json();
      })
      .then((data) => {
        if (data?.onboarding_complete === true) {
          // Cookie already set by server in the GET response — hard navigate
          window.location.href = "/";
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        // Network or server error — set cookie client-side as fallback, hard navigate
        document.cookie =
          "app_onboarded=1; path=/; max-age=" + 60 * 60 * 24 * 365 + "; SameSite=Lax";
        window.location.href = "/";
      });
  }, []);

  function handleFocusSelect(f: Focus) {
    setFocus(f);
    setTargets({ ...FOCUS_OPTIONS.find((o) => o.id === f)!.targets });
  }

  async function submit(skipped = false) {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          abs_weekly_reps: skipped ? 0 : targets.abs,
          pull_weekly_reps: skipped ? 0 : targets.pull,
          push_weekly_reps: skipped ? 0 : targets.push,
          legs_weekly_reps: skipped ? 0 : targets.legs,
          calories_weekly: skipped ? 0 : Number(caloriesWeekly) || 0,
          protein_weekly_g: skipped ? 0 : Number(proteinWeekly) || 0,
          carbs_weekly_g: skipped ? 0 : Number(carbsWeekly) || 0,
          fat_weekly_g: skipped ? 0 : Number(fatWeekly) || 0,
          skipped,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Save failed");
      }
      // Cookie is set server-side in the POST response — hard navigate so middleware sees it
      if (skipped) {
        window.location.href = "/";
      } else {
        setStep(5);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-sm text-white/40">Loading…</div>
      </div>
    );
  }

  return (
    <ChromaticFluid
      height="100dvh"
      flowStrength={0.8}
      grain={0.035}
      contrast={1.15}
      speed={0.35}
    >
      <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">

          {/* ── Header ── */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-lg">
              <Dumbbell size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Personal OS</h1>
            {step < 5 && (
              <p className="mt-1 text-sm text-white/40">
                Step {step} of 4 — let&apos;s set up your dashboard
              </p>
            )}
          </div>

          {/* ── Step dots ── */}
          {step < 5 && (
            <div className="mb-5 flex items-center justify-center gap-2">
              {([1, 2, 3, 4] as const).map((n) => (
                <div
                  key={n}
                  className={`h-1.5 rounded-full transition-all ${
                    n === step
                      ? "w-5 bg-white"
                      : n < step
                      ? "w-1.5 bg-white/50"
                      : "w-1.5 bg-white/15"
                  }`}
                />
              ))}
            </div>
          )}

          {/* ── Step 1: Display Name ── */}
          {step === 1 && (
            <div className={CARD}>
              <h2 className="mb-1 text-lg font-semibold text-white">Welcome 👋</h2>
              <p className="mb-5 text-sm text-white/50">What should we call you?</p>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className={`${INPUT} mb-5`}
                onKeyDown={(e) => e.key === "Enter" && setStep(2)}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => submit(true)}
                  disabled={submitting}
                  className="flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70"
                >
                  <SkipForward size={13} /> Skip setup
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 border border-white/10"
                >
                  Continue <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Fitness Focus ── */}
          {step === 2 && (
            <div className={CARD}>
              <h2 className="mb-1 text-lg font-semibold text-white">What&apos;s your focus?</h2>
              <p className="mb-5 text-sm text-white/50">
                This sets your weekly rep targets. Adjustable in the next step.
              </p>
              <div className="mb-5 flex flex-col gap-2">
                {FOCUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleFocusSelect(opt.id)}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      focus === opt.id
                        ? "border-white/30 bg-white/10"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
                        focus === opt.id ? "border-white bg-white" : "border-white/30"
                      }`}
                    >
                      {focus === opt.id && (
                        <div className="h-1.5 w-1.5 rounded-full bg-black" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{opt.label}</p>
                      <p className="text-xs text-white/40">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-white/40 transition hover:text-white/70"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => focus && setStep(3)}
                  disabled={!focus}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Continue <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm / Adjust Targets ── */}
          {step === 3 && (
            <div className={CARD}>
              <h2 className="mb-1 text-lg font-semibold text-white">Your weekly rep targets</h2>
              <p className="mb-5 text-sm text-white/50">
                Pre-filled from your focus. Adjust any number.
              </p>
              <div className="mb-5 grid grid-cols-2 gap-3">
                {(
                  [
                    { key: "abs" as const, label: "Abs (reps/week)" },
                    { key: "pull" as const, label: "Pull (reps/week)" },
                    { key: "push" as const, label: "Push (reps/week)" },
                    { key: "legs" as const, label: "Legs (reps/week)" },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs font-medium text-white/50">{label}</label>
                    <input
                      type="number"
                      value={targets[key]}
                      onChange={(e) =>
                        setTargets((prev) => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))
                      }
                      min="0"
                      className={INPUT}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm text-white/40 transition hover:text-white/70"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 border border-white/10"
                >
                  Continue <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Nutrition Targets ── */}
          {step === 4 && (
            <div className={CARD}>
              <h2 className="mb-1 text-lg font-semibold text-white">Nutrition targets</h2>
              <p className="mb-5 text-sm text-white/50">
                Weekly totals. All fields optional.
              </p>
              <div className="mb-5 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-white/50">Calories / week</label>
                  <input
                    type="number"
                    value={caloriesWeekly}
                    onChange={(e) => setCaloriesWeekly(e.target.value)}
                    placeholder="e.g. 14000"
                    min="0"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/50">Protein (g / week)</label>
                  <input
                    type="number"
                    value={proteinWeekly}
                    onChange={(e) => setProteinWeekly(e.target.value)}
                    placeholder="e.g. 1050"
                    min="0"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/50">Carbs (g / week)</label>
                  <input
                    type="number"
                    value={carbsWeekly}
                    onChange={(e) => setCarbsWeekly(e.target.value)}
                    placeholder="e.g. 1400"
                    min="0"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/50">Fat (g / week)</label>
                  <input
                    type="number"
                    value={fatWeekly}
                    onChange={(e) => setFatWeekly(e.target.value)}
                    placeholder="e.g. 490"
                    min="0"
                    className={INPUT}
                  />
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-sm text-white/40 transition hover:text-white/70"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => submit(false)}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 border border-white/10 disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Finish Setup"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: Done ── */}
          {step === 5 && (
            <div className={`${CARD} text-center`}>
              <CheckCircle size={48} className="mx-auto mb-4 text-white/80" />
              <h2 className="mb-2 text-xl font-bold text-white">
                You&apos;re all set{displayName ? `, ${displayName}` : ""}!
              </h2>
              <p className="mb-6 text-sm text-white/50">
                Your dashboard is ready. Weekly rep targets and nutrition goals are now personalized to you.
              </p>
              <button
                type="button"
                onClick={() => { window.location.href = "/"; }}
                className="rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20 border border-white/10"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </ChromaticFluid>
  );
}
