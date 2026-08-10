// Exercise library — preset list with muscle mappings, type, hold flag, and illustration keys.
// To add exercises: append to EXERCISE_LIBRARY. To add custom illustrations: add the key to
// the illustrationKey field and implement the matching SVG in ExerciseSelectorPage.tsx.

export type MuscleGroup =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps"
  | "legs" | "core" | "skill" | "cardio";

export type ExerciseType =
  | "barbell" | "dumbbell" | "cable" | "bodyweight" | "machine" | "skill" | "cardio";

export interface MuscleGroupDef {
  id: MuscleGroup;
  label: string;
  /** Value stored in workout_sessions.muscle_group */
  dbValue: string;
}

export const MUSCLE_GROUP_DEFS: MuscleGroupDef[] = [
  { id: "chest",     label: "Chest",     dbValue: "Push"   },
  { id: "back",      label: "Back",      dbValue: "Pull"   },
  { id: "shoulders", label: "Shoulders", dbValue: "Push"   },
  { id: "biceps",    label: "Biceps",    dbValue: "Pull"   },
  { id: "triceps",   label: "Triceps",   dbValue: "Push"   },
  { id: "legs",      label: "Legs",      dbValue: "Legs"   },
  { id: "core",      label: "Core",      dbValue: "Abs"    },
  { id: "skill",     label: "Skill",     dbValue: "Skill"  },
  { id: "cardio",    label: "Cardio",    dbValue: "Cardio" },
];

export interface ExerciseDef {
  name: string;
  /** All muscle groups this exercise appears under in the selector */
  muscles: MuscleGroup[];
  type: ExerciseType;
  /** True → reps field shows "Seconds" label */
  isHold: boolean;
  /** Key for custom SVG illustration; omit → falls back to type icon */
  illustrationKey?: string;
}

export const EXERCISE_LIBRARY: ExerciseDef[] = [
  // ── CHEST ──────────────────────────────────────────────────────────────
  { name: "Bench Press",          muscles: ["chest"],                                 type: "barbell",    isHold: false, illustrationKey: "bench-press"  },
  { name: "Incline Bench Press",  muscles: ["chest", "shoulders"],                    type: "barbell",    isHold: false                                   },
  { name: "Dumbbell Fly",         muscles: ["chest"],                                 type: "dumbbell",   isHold: false                                   },
  { name: "Cable Fly",            muscles: ["chest"],                                 type: "cable",      isHold: false                                   },
  { name: "Push-Up",              muscles: ["chest", "triceps"],                      type: "bodyweight", isHold: false, illustrationKey: "push-up"       },
  { name: "Incline Push-Up",      muscles: ["chest"],                                 type: "bodyweight", isHold: false                                   },
  { name: "Dips",                 muscles: ["chest", "triceps"],                      type: "bodyweight", isHold: false                                   },
  { name: "Chest Press Machine",  muscles: ["chest"],                                 type: "machine",    isHold: false                                   },

  // ── BACK ───────────────────────────────────────────────────────────────
  { name: "Pull-Up",              muscles: ["back", "biceps"],                        type: "bodyweight", isHold: false, illustrationKey: "pull-up"       },
  { name: "Wide Grip Pull-Up",    muscles: ["back"],                                  type: "bodyweight", isHold: false                                   },
  { name: "Chin-Up",              muscles: ["back", "biceps"],                        type: "bodyweight", isHold: false                                   },
  { name: "Australian Pull-Up",   muscles: ["back", "biceps"],                        type: "bodyweight", isHold: false                                   },
  { name: "Barbell Row",          muscles: ["back", "biceps"],                        type: "barbell",    isHold: false                                   },
  { name: "Dumbbell Row",         muscles: ["back", "biceps"],                        type: "dumbbell",   isHold: false                                   },
  { name: "Lat Pulldown",         muscles: ["back"],                                  type: "machine",    isHold: false                                   },
  { name: "Seated Cable Row",     muscles: ["back", "biceps"],                        type: "cable",      isHold: false                                   },
  { name: "Face Pulls",           muscles: ["back", "shoulders"],                     type: "cable",      isHold: false                                   },
  { name: "Deadlift",             muscles: ["back", "legs"],                          type: "barbell",    isHold: false                                   },
  { name: "Dead Hang",            muscles: ["back", "skill"],                         type: "skill",      isHold: true                                    },
  { name: "Front Lever",          muscles: ["back", "core", "shoulders", "skill"],    type: "skill",      isHold: true,  illustrationKey: "front-lever"  },
  { name: "Back Lever",           muscles: ["back", "shoulders", "core", "skill"],    type: "skill",      isHold: true                                    },

  // ── SHOULDERS ──────────────────────────────────────────────────────────
  { name: "Overhead Press",       muscles: ["shoulders", "triceps"],                  type: "barbell",    isHold: false                                   },
  { name: "Dumbbell Shoulder Press", muscles: ["shoulders"],                          type: "dumbbell",   isHold: false                                   },
  { name: "Lateral Raise",        muscles: ["shoulders"],                             type: "dumbbell",   isHold: false                                   },
  { name: "Front Raise",          muscles: ["shoulders"],                             type: "dumbbell",   isHold: false                                   },
  { name: "Upright Row",          muscles: ["shoulders", "back"],                     type: "barbell",    isHold: false                                   },
  { name: "Pike Push-Up",         muscles: ["shoulders", "triceps"],                  type: "bodyweight", isHold: false                                   },
  { name: "Handstand Hold",       muscles: ["shoulders", "core", "chest", "skill"],   type: "skill",      isHold: true,  illustrationKey: "handstand"     },
  { name: "Handstand Push-Up",    muscles: ["shoulders", "triceps", "skill"],         type: "skill",      isHold: false                                   },
  { name: "Handstand Walk",       muscles: ["shoulders", "core", "skill"],            type: "skill",      isHold: false                                   },
  { name: "Iron Cross",           muscles: ["shoulders", "chest", "back", "skill"],   type: "skill",      isHold: true                                    },
  { name: "Ring Support Hold",    muscles: ["shoulders", "core", "skill"],            type: "skill",      isHold: true                                    },

  // ── BICEPS ─────────────────────────────────────────────────────────────
  { name: "Barbell Curl",         muscles: ["biceps"],                                type: "barbell",    isHold: false                                   },
  { name: "Machine Bicep Curl",   muscles: ["biceps"],                                type: "machine",    isHold: false                                   },
  { name: "EZ Bar Curl",          muscles: ["biceps"],                                type: "barbell",    isHold: false                                   },
  { name: "Preacher Curl",        muscles: ["biceps"],                                type: "machine",    isHold: false                                   },
  { name: "Hammer Curl",          muscles: ["biceps"],                                type: "dumbbell",   isHold: false                                   },
  { name: "Incline Curl",         muscles: ["biceps"],                                type: "dumbbell",   isHold: false                                   },
  { name: "Concentration Curl",   muscles: ["biceps"],                                type: "dumbbell",   isHold: false                                   },

  // ── TRICEPS ────────────────────────────────────────────────────────────
  { name: "Tricep Pushdown",      muscles: ["triceps"],                               type: "cable",      isHold: false                                   },
  { name: "Skull Crusher",        muscles: ["triceps"],                               type: "barbell",    isHold: false                                   },
  { name: "Diamond Push-Up",      muscles: ["triceps", "chest"],                      type: "bodyweight", isHold: false                                   },
  { name: "Close-Grip Bench",     muscles: ["triceps", "chest"],                      type: "barbell",    isHold: false                                   },
  { name: "Overhead Tricep Ext",  muscles: ["triceps"],                               type: "dumbbell",   isHold: false                                   },
  { name: "Tuck Planche",         muscles: ["chest", "shoulders", "triceps", "skill"], type: "skill",    isHold: true                                    },
  { name: "Adv Tuck Planche",     muscles: ["chest", "shoulders", "triceps", "skill"], type: "skill",    isHold: true                                    },
  { name: "Planche Lean",         muscles: ["chest", "shoulders", "core", "skill"],   type: "skill",      isHold: true                                    },

  // ── LEGS ───────────────────────────────────────────────────────────────
  { name: "Squat",                muscles: ["legs"],                                  type: "barbell",    isHold: false, illustrationKey: "squat"         },
  { name: "Romanian Deadlift",    muscles: ["legs"],                                  type: "barbell",    isHold: false                                   },
  { name: "Leg Press",            muscles: ["legs"],                                  type: "machine",    isHold: false                                   },
  { name: "Walking Lunge",        muscles: ["legs"],                                  type: "bodyweight", isHold: false                                   },
  { name: "Bulgarian Split Squat", muscles: ["legs"],                                 type: "bodyweight", isHold: false                                   },
  { name: "Hip Thrust",           muscles: ["legs"],                                  type: "barbell",    isHold: false                                   },
  { name: "Leg Extension",        muscles: ["legs"],                                  type: "machine",    isHold: false                                   },
  { name: "Hamstring Curl Machine", muscles: ["legs"],                                type: "machine",    isHold: false                                   },
  { name: "Nordic Curl",          muscles: ["legs"],                                  type: "bodyweight", isHold: false                                   },
  { name: "Calf Raise",           muscles: ["legs"],                                  type: "bodyweight", isHold: false                                   },
  { name: "Box Jumps",            muscles: ["legs"],                                  type: "bodyweight", isHold: false                                   },
  { name: "Pistol Squat",         muscles: ["legs", "skill"],                         type: "skill",      isHold: false                                   },
  { name: "Wall Sit",             muscles: ["legs", "skill"],                         type: "skill",      isHold: true                                    },
  { name: "Hip Abduction",        muscles: ["legs"],                                  type: "machine",    isHold: false                                   },

  // ── CORE ───────────────────────────────────────────────────────────────
  { name: "Plank",                muscles: ["core", "skill"],                         type: "skill",      isHold: true,  illustrationKey: "plank"         },
  { name: "L-Sit",                muscles: ["core", "shoulders", "triceps", "skill"], type: "skill",      isHold: true,  illustrationKey: "l-sit"         },
  { name: "V-Sit",                muscles: ["core", "skill"],                         type: "skill",      isHold: true                                    },
  { name: "Hollow Body Hold",     muscles: ["core", "skill"],                         type: "skill",      isHold: true,  illustrationKey: "hollow-body"   },
  { name: "Arch Body Hold",       muscles: ["core", "back", "skill"],                 type: "skill",      isHold: true                                    },
  { name: "Ab Rollout",           muscles: ["core"],                                  type: "bodyweight", isHold: false                                   },
  { name: "Hanging Leg Raises",   muscles: ["core"],                                  type: "bodyweight", isHold: false                                   },
  { name: "Toes to Bar",          muscles: ["core"],                                  type: "bodyweight", isHold: false                                   },
  { name: "Dragon Flag",          muscles: ["core", "skill"],                         type: "skill",      isHold: false                                   },
  { name: "Dead Bug",             muscles: ["core"],                                  type: "bodyweight", isHold: false                                   },
  { name: "Human Flag",           muscles: ["core", "back", "shoulders", "skill"],    type: "skill",      isHold: true                                    },

  // ── CARDIO ─────────────────────────────────────────────────────────────
  { name: "Running",              muscles: ["cardio"],                                type: "cardio",     isHold: false, illustrationKey: "running"       },
  { name: "Treadmill Run",        muscles: ["cardio"],                                type: "cardio",     isHold: false                                   },
  { name: "Sprints",              muscles: ["cardio"],                                type: "cardio",     isHold: false                                   },
  { name: "Cycling",              muscles: ["cardio"],                                type: "cardio",     isHold: false                                   },
  { name: "Stationary Bike",      muscles: ["cardio"],                                type: "cardio",     isHold: false                                   },
  { name: "Assault Bike",         muscles: ["cardio"],                                type: "cardio",     isHold: false                                   },
  { name: "Jump Rope",            muscles: ["cardio", "shoulders"],                   type: "cardio",     isHold: false                                   },
  { name: "Row Machine",          muscles: ["cardio", "back"],                        type: "cardio",     isHold: false                                   },
  { name: "Stair Climber",        muscles: ["cardio", "legs"],                        type: "cardio",     isHold: false                                   },
  { name: "Battle Ropes",         muscles: ["cardio", "shoulders"],                   type: "cardio",     isHold: false                                   },
  { name: "Sled Push",            muscles: ["cardio", "legs"],                        type: "cardio",     isHold: false                                   },
  { name: "Swimming",             muscles: ["cardio"],                                type: "cardio",     isHold: false                                   },
];

/** All exercises that appear under a given muscle group */
export function getExercisesByMuscle(muscle: MuscleGroup): ExerciseDef[] {
  return EXERCISE_LIBRARY.filter((ex) => ex.muscles.includes(muscle));
}

/**
 * Maps an exercise to the DB muscle_group value for workout_exercises.
 * Priority: cardio → Cardio, skill type → Skill, else first non-meta muscle.
 */
export function exerciseToDbGroup(ex: ExerciseDef): string {
  if (ex.type === "cardio") return "Cardio";
  if (ex.type === "skill" || ex.muscles.includes("skill")) return "Skill";
  const primary = ex.muscles.find((m) => m !== "skill" && m !== "cardio");
  const map: Record<MuscleGroup, string> = {
    chest: "Push", shoulders: "Push", triceps: "Push",
    back: "Pull",  biceps: "Pull",
    legs: "Legs",
    core: "Abs",
    skill: "Skill",
    cardio: "Cardio",
  };
  return primary ? (map[primary] ?? "Mixed") : "Mixed";
}
