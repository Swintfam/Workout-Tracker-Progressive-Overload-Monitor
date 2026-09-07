/**
 * exerciseGLTF.ts
 *
 * Shared constants and helpers for the Three.js/GLTF exercise animation player.
 * All naming conventions here are authoritative — they must match the Blender
 * export exactly. See BLENDER_GLTF_PRODUCTION_SPEC.md at the project root.
 */

import type { MuscleGroup } from './exercises';
import type * as THREE_NS from 'three';

// ─── Muscle mesh map ───────────────────────────────────────────────────────────
//
// Maps each MuscleGroup value → the GLTF object names of the corresponding
// muscle meshes inside the model. Blender must export these exact names.
// Bilateral muscles use the _L / _R suffix (Blender convention).
//
// Rule: visualActivatedMuscles = primaryMuscles ∪ secondaryMuscles
// Both sets use the same highlight color — no visual distinction.

export const MUSCLE_MESH_MAP: Record<MuscleGroup, string[]> = {
  Biceps:         ['muscle_biceps_L',               'muscle_biceps_R'],
  Triceps:        ['muscle_triceps_long_L',          'muscle_triceps_long_R',
                   'muscle_triceps_lateral_L',       'muscle_triceps_lateral_R'],
  Chest:          ['muscle_pec_major_L',             'muscle_pec_major_R',
                   'muscle_pec_minor_L',             'muscle_pec_minor_R'],
  Shoulders:      ['muscle_deltoid_anterior_L',      'muscle_deltoid_anterior_R',
                   'muscle_deltoid_lateral_L',       'muscle_deltoid_lateral_R',
                   'muscle_deltoid_posterior_L',     'muscle_deltoid_posterior_R'],
  Lats:           ['muscle_latissimus_dorsi_L',      'muscle_latissimus_dorsi_R'],
  'Upper Back':   ['muscle_rhomboid_L',              'muscle_rhomboid_R',
                   'muscle_teres_major_L',           'muscle_teres_major_R',
                   'muscle_teres_minor_L',           'muscle_teres_minor_R',
                   'muscle_infraspinatus_L',         'muscle_infraspinatus_R'],
  Traps:          ['muscle_trapezius_upper_L',       'muscle_trapezius_upper_R',
                   'muscle_trapezius_mid_L',         'muscle_trapezius_mid_R',
                   'muscle_trapezius_lower_L',       'muscle_trapezius_lower_R'],
  Forearms:       ['muscle_forearm_flexors_L',       'muscle_forearm_flexors_R',
                   'muscle_forearm_extensors_L',     'muscle_forearm_extensors_R'],
  Neck:           ['muscle_sternocleidomastoid_L',   'muscle_sternocleidomastoid_R'],
  Abs:            ['muscle_rectus_abdominis'],
  Obliques:       ['muscle_obliques_external_L',     'muscle_obliques_external_R',
                   'muscle_obliques_internal_L',     'muscle_obliques_internal_R'],
  'Lower Back':   ['muscle_erector_spinae_L',        'muscle_erector_spinae_R',
                   'muscle_quadratus_lumborum_L',    'muscle_quadratus_lumborum_R'],
  Glutes:         ['muscle_gluteus_maximus_L',       'muscle_gluteus_maximus_R',
                   'muscle_gluteus_medius_L',        'muscle_gluteus_medius_R'],
  Quads:          ['muscle_rectus_femoris_L',        'muscle_rectus_femoris_R',
                   'muscle_vastus_lateralis_L',      'muscle_vastus_lateralis_R',
                   'muscle_vastus_medialis_L',       'muscle_vastus_medialis_R'],
  Hamstrings:     ['muscle_biceps_femoris_L',        'muscle_biceps_femoris_R',
                   'muscle_semitendinosus_L',        'muscle_semitendinosus_R'],
  Calves:         ['muscle_gastrocnemius_L',         'muscle_gastrocnemius_R',
                   'muscle_soleus_L',                'muscle_soleus_R'],
  Adductors:      ['muscle_adductor_magnus_L',       'muscle_adductor_magnus_R',
                   'muscle_adductor_longus_L',       'muscle_adductor_longus_R'],
  Abductors:      ['muscle_tensor_fasciae_latae_L',  'muscle_tensor_fasciae_latae_R'],
  Cardio:         [], // cardio exercises — no specific muscle meshes highlighted
  'Full Body':    [], // routine type — no specific meshes highlighted
};

// ─── Camera positions ──────────────────────────────────────────────────────────
//
// Maps the `camera_view` field from the exercises DB table to a Three.js
// camera position + look-at target. Units are in scene meters (model stands
// ~1.8 m tall, centered at origin, feet at Y=0).
//
// These are defaults — Blender artists can fine-tune per exercise if needed
// by exporting a named camera object (see spec doc).

export interface CameraPreset {
  position: [number, number, number]; // [x, y, z]
  target:   [number, number, number]; // look-at [x, y, z]
  fov:      number;                   // vertical field of view in degrees
}

export const CAMERA_PRESETS: Record<string, CameraPreset> = {
  'front-three-quarter': { position: [ 1.4,  1.1,  2.6], target: [0, 0.9, 0], fov: 42 },
  'rear-three-quarter':  { position: [-1.4,  1.1,  2.6], target: [0, 0.9, 0], fov: 42 },
  'side':                { position: [ 3.2,  1.0,  0  ], target: [0, 0.9, 0], fov: 38 },
  'side-three-quarter':  { position: [ 2.2,  1.1,  1.8], target: [0, 0.9, 0], fov: 40 },
  'front':               { position: [ 0,    1.1,  3.2], target: [0, 0.9, 0], fov: 40 },
  'rear':                { position: [ 0,    1.1, -3.2], target: [0, 0.9, 0], fov: 40 },
  'top':                 { position: [ 0,    4.0,  0.5], target: [0, 0.9, 0], fov: 45 },
};

export const DEFAULT_CAMERA_PRESET: CameraPreset = CAMERA_PRESETS['front-three-quarter'];

// ─── Resolve activated mesh names ─────────────────────────────────────────────

/**
 * Given the union of primary and secondary muscles for an exercise,
 * returns the complete flat list of GLTF mesh names to highlight.
 */
export function resolveActivatedMeshNames(muscles: MuscleGroup[]): Set<string> {
  const names = new Set<string>();
  for (const m of muscles) {
    const meshes = MUSCLE_MESH_MAP[m] ?? [];
    for (const n of meshes) names.add(n);
  }
  return names;
}

// ─── CSS accent color → Three.js Color ────────────────────────────────────────
//
// Reads `--color-accent` at runtime so muscle highlight color tracks the
// active theme without regenerating any assets.
// Format of the CSS variable is "R G B" with values 0–255.

export function getCSSAccentColor(THREE: typeof THREE_NS): THREE_NS.Color {
  if (typeof window === 'undefined') {
    return new THREE.Color(0.302, 0.486, 1.0); // fallback #4D7CFF
  }
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-accent')
    .trim();
  const parts = raw.split(' ').map(Number);
  if (parts.length === 3 && parts.every(n => !isNaN(n))) {
    return new THREE.Color(parts[0] / 255, parts[1] / 255, parts[2] / 255);
  }
  return new THREE.Color(0.302, 0.486, 1.0);
}

// ─── Inactive muscle color ─────────────────────────────────────────────────────
//
// Grayscale — no gradient, no glow. Matches the approved visual direction.

export const INACTIVE_MUSCLE_COLOR = 0x8a8a8a; // mid-grey

// ─── GLTF object name prefixes ─────────────────────────────────────────────────
//
// Used by the player to identify muscle meshes, equipment, and cameras
// without hard-coded name lists. All objects in the Blender export must
// follow these prefix conventions (see spec doc).

export const PREFIX = {
  MUSCLE:    'muscle_',
  EQUIPMENT: 'equip_',
  BODY:      'body_',
  CAMERA:    'cam_',
  RIG:       'rig_',       // armature / bone hierarchy root
  GROUND:    'ground_',    // ground plane or mat (hidden at runtime)
} as const;

// ─── Animation clip naming ─────────────────────────────────────────────────────
//
// Clips inside the GLB must be named with the exercise_id slug from the DB.
// Example: a Pull-Up GLB contains one clip named "pull-up".
// The player selects it with:
//   THREE.AnimationClip.findByName(gltf.animations, exerciseId)

// ─── Storage path helpers ──────────────────────────────────────────────────────
//
// Expected GLB path pattern (mirrors the video convention):
//   exercise-assets/{app_selector_kebab}/{exercise_id}/demo.glb
//
// Thumbnail path (still render from Blender, exported as .webp):
//   exercise-assets/{app_selector_kebab}/{exercise_id}/thumbnail.webp
//
// Set asset_status = 'Complete' in the exercises table only after BOTH
// demo.glb and thumbnail.webp are uploaded and verified.

export function isGLTFPath(path: string | null): boolean {
  if (!path) return false;
  const lower = path.toLowerCase();
  return lower.endsWith('.glb') || lower.endsWith('.gltf');
}

export function isVideoPath(path: string | null): boolean {
  if (!path) return false;
  const lower = path.toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov');
}

export type AnimationFormat = 'gltf' | 'video' | null;

export function detectAnimationFormat(path: string | null): AnimationFormat {
  if (isGLTFPath(path)) return 'gltf';
  if (isVideoPath(path)) return 'video';
  return null;
}
