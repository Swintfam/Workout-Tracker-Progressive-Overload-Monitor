/**
 * exerciseMedia.ts
 *
 * On-demand media resolution for exercises.
 * - Builds Supabase Storage public URLs from stable exercise_id slugs.
 * - Checks the `exercises` DB table for asset_status before loading.
 * - In-memory LRU cache for recently-viewed assets (no pre-bundling).
 * - Falls back gracefully when no production asset exists.
 */

import { getSupabaseBrowser } from '@/lib/supabase/browser';
import { detectAnimationFormat, type AnimationFormat } from './exerciseGLTF';

const STORAGE_BUCKET = 'exercise-assets';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssetStatus = 'Not started' | 'In progress' | 'Complete';

export interface ExerciseMediaRecord {
  exercise_id: string;
  thumbnail_path: string | null;
  animation_path: string | null;
  asset_status: AssetStatus;
  demo_type: string;
  camera_view: string | null;
  playback: {
    autoplay: boolean;
    loop: boolean;
    muted: boolean;
    plays_inline: boolean;
    speed_options: number[];
    default_speed: number;
  };
}

export interface ResolvedMedia {
  thumbnailUrl: string | null;          // null = no asset yet, show fallback
  animationUrl: string | null;          // null = no asset yet
  animationFormat: AnimationFormat;     // 'gltf' | 'video' | null
  cameraView: string;                   // e.g. 'rear-three-quarter'
  assetStatus: AssetStatus;
  playback: ExerciseMediaRecord['playback'];
}

// ─── In-memory LRU cache (max 30 recently-viewed exercises) ──────────────────

const CACHE_MAX = 30;
const cache = new Map<string, ResolvedMedia>();

function cacheSet(key: string, value: ResolvedMedia) {
  if (cache.size >= CACHE_MAX) {
    // Evict oldest entry
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, value);
}

// ─── Storage URL builder ──────────────────────────────────────────────────────

/**
 * Convert a storage path (e.g. "exercise-assets/biceps/bicep-curl-barbell/thumbnail.webp")
 * to a Supabase public URL. Works with or without the bucket prefix in the path.
 */
export function storagePathToUrl(path: string | null): string | null {
  if (!path) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  // Strip bucket prefix if present
  const cleanPath = path.startsWith(`${STORAGE_BUCKET}/`)
    ? path.slice(STORAGE_BUCKET.length + 1)
    : path;

  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${cleanPath}`;
}

// ─── Main resolver ────────────────────────────────────────────────────────────

const DEFAULT_PLAYBACK: ExerciseMediaRecord['playback'] = {
  autoplay: true,
  loop: true,
  muted: true,
  plays_inline: true,
  speed_options: [1.0, 0.5],
  default_speed: 1.0,
};

/**
 * Fetch media metadata for a single exercise from the `exercises` table.
 * Returns null thumbnail/animation URLs if asset_status is not 'Complete'.
 * Results are cached in memory for the session.
 */
export async function resolveExerciseMedia(
  exercise_id: string
): Promise<ResolvedMedia> {
  // Cache hit
  if (cache.has(exercise_id)) {
    return cache.get(exercise_id)!;
  }

  try {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from('exercises')
      .select('exercise_id, thumbnail_path, animation_path, asset_status, demo_type, camera_view, playback')
      .eq('exercise_id', exercise_id)
      .single();

    if (error || !data) {
      const fallback: ResolvedMedia = {
        thumbnailUrl: null,
        animationUrl: null,
        animationFormat: null,
        cameraView: 'front-three-quarter',
        assetStatus: 'Not started',
        playback: DEFAULT_PLAYBACK,
      };
      cacheSet(exercise_id, fallback);
      return fallback;
    }

    const record = data as ExerciseMediaRecord;
    const isReady = record.asset_status === 'Complete';
    const animationPath = isReady ? record.animation_path : null;
    const animationUrl  = storagePathToUrl(animationPath);

    const resolved: ResolvedMedia = {
      thumbnailUrl:    isReady ? storagePathToUrl(record.thumbnail_path) : null,
      animationUrl,
      animationFormat: detectAnimationFormat(animationPath),
      cameraView:      record.camera_view ?? 'front-three-quarter',
      assetStatus:     record.asset_status,
      playback:        record.playback ?? DEFAULT_PLAYBACK,
    };

    cacheSet(exercise_id, resolved);
    return resolved;
  } catch {
    const fallback: ResolvedMedia = {
      thumbnailUrl: null,
      animationUrl: null,
      animationFormat: null,
      cameraView: 'front-three-quarter',
      assetStatus: 'Not started',
      playback: DEFAULT_PLAYBACK,
    };
    cacheSet(exercise_id, fallback);
    return fallback;
  }
}

/**
 * Invalidate a single exercise from the cache (call after uploading new assets).
 */
export function invalidateExerciseMedia(exercise_id: string) {
  cache.delete(exercise_id);
}
