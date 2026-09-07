// Shared mapping: muscle group string → body-muscles IDs (vulovix/body-muscles, Apache 2.0)
// Handles both title-case (ExerciseDef.primaryMuscles) and lowercase (ExerciseResult / ExerciseDB).

export const MUSCLE_TO_IDS: Record<string, string[]> = {
  // Front-dominant
  Biceps:       ["biceps-left", "biceps-right"],
  Chest:        ["chest-upper-left", "chest-lower-left", "chest-upper-right", "chest-lower-right"],
  Shoulders:    ["shoulder-front-left", "shoulder-side-left", "shoulder-front-right", "shoulder-side-right",
                 "deltoid-rear-left", "deltoid-rear-right"],
  Abs:          ["abs-upper-left", "abs-lower-left", "abs-upper-right", "abs-lower-right"],
  Obliques:     ["obliques-left", "obliques-right", "serratus-anterior-left", "serratus-anterior-right"],
  Quads:        ["quads-left", "quads-right"],
  Adductors:    ["adductors-left", "adductors-right"],
  Abductors:    ["hip-flexor-left", "hip-flexor-right"],
  Forearms:     ["forearm-left", "forearm-right", "forearm-flexors-left", "forearm-extensors-left",
                 "forearm-flexors-right", "forearm-extensors-right"],
  Neck:         ["neck-left", "neck-right", "nape"],
  // Back-dominant
  Lats:         ["lats-upper-left", "lats-mid-left", "lats-lower-left",
                 "lats-upper-right", "lats-mid-right", "lats-lower-right"],
  Triceps:      ["triceps-long-left", "triceps-lateral-left", "triceps-long-right", "triceps-lateral-right"],
  Traps:        ["traps-upper-left", "traps-upper-right", "nape"],
  "Upper Back": ["traps-mid-left", "traps-lower-left", "traps-mid-right", "traps-lower-right"],
  "Lower Back": ["lower-back-erectors-left", "lower-back-ql-left",
                 "lower-back-erectors-right", "lower-back-ql-right", "spine"],
  Glutes:       ["gluteus-maximus-left", "gluteus-maximus-right", "gluteus-medius-left", "gluteus-medius-right"],
  Hamstrings:   ["hamstrings-medial-left", "hamstrings-lateral-left",
                 "hamstrings-medial-right", "hamstrings-lateral-right"],
  Calves:       ["calves-gastroc-medial-left", "calves-gastroc-lateral-left", "calves-soleus-left",
                 "calves-gastroc-medial-right", "calves-gastroc-lateral-right", "calves-soleus-right"],
};

// Auto-add lowercase aliases (ExerciseDB / ExerciseResult strings)
(Object.keys(MUSCLE_TO_IDS) as string[]).forEach(k => {
  const lc = k.toLowerCase();
  if (!(lc in MUSCLE_TO_IDS)) MUSCLE_TO_IDS[lc] = MUSCLE_TO_IDS[k];
});

export function muscleToIds(muscles: string[]): Set<string> {
  return new Set(muscles.flatMap(m => MUSCLE_TO_IDS[m] ?? []));
}

// IDs that belong to the back view — used to choose which thumbnail face to show
const BACK_IDS = new Set([
  "lats-upper-left","lats-mid-left","lats-lower-left","lats-upper-right","lats-mid-right","lats-lower-right",
  "traps-upper-left","traps-mid-left","traps-lower-left","traps-upper-right","traps-mid-right","traps-lower-right","nape",
  "lower-back-erectors-left","lower-back-ql-left","lower-back-erectors-right","lower-back-ql-right","spine",
  "gluteus-maximus-left","gluteus-maximus-right","gluteus-medius-left","gluteus-medius-right",
  "hamstrings-medial-left","hamstrings-lateral-left","hamstrings-medial-right","hamstrings-lateral-right",
  "calves-gastroc-medial-left","calves-gastroc-lateral-left","calves-soleus-left",
  "calves-gastroc-medial-right","calves-gastroc-lateral-right","calves-soleus-right",
  "triceps-long-left","triceps-lateral-left","triceps-long-right","triceps-lateral-right",
  "deltoid-rear-left","deltoid-rear-right",
  "head-back","head-back-left","head-back-right","foot-back-left","foot-back-right",
  "knee-back-left","knee-back-right","hand-back-left","hand-back-right",
  "forearm-flexors-left","forearm-extensors-left","forearm-flexors-right","forearm-extensors-right",
]);

/** Pick front or back based on which side holds the majority of primary muscle IDs. */
export function preferredView(primaryIds: Set<string>): "front" | "back" {
  let back = 0, front = 0;
  primaryIds.forEach(id => BACK_IDS.has(id) ? back++ : front++);
  return back > front ? "back" : "front";
}

// ── Reverse map: body-muscles path ID → MuscleGroup display name ──────────────
// Built from title-case keys only (skips auto-added lowercase aliases).
// First assignment wins when multiple muscles share an ID (e.g. "nape" → "Traps").
export const ID_TO_MUSCLE: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  Object.entries(MUSCLE_TO_IDS).forEach(([muscle, ids]) => {
    if (muscle !== muscle.toLowerCase()) {           // title-case only
      ids.forEach(id => { if (!(id in out)) out[id] = muscle; });
    }
  });
  return out;
})();
