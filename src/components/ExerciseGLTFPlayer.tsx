'use client';

/**
 * ExerciseGLTFPlayer.tsx
 *
 * Real Three.js/GLTF anatomical animation player.
 *
 * Rules:
 * - No fake placeholder geometry. If the GLB hasn't loaded or fails, show text.
 * - Muscle highlight color = --color-accent CSS variable (single solid color, no gradients/glow).
 * - Inactive muscle meshes = solid mid-grey.
 * - prefers-reduced-motion: no autoplay, show tap-to-play overlay.
 * - Speed toggle: 1× ↔ 0.5× via AnimationMixer.action.timeScale.
 * - Transparent background (alpha: true on WebGLRenderer).
 * - ResizeObserver keeps canvas filling the container.
 * - Complete cleanup on unmount: cancelAnimationFrame, renderer.dispose(), removeChild.
 *
 * First production target: Pull-Up. Do NOT scale to other exercises until
 * Naeem reviews and approves the Pull-Up rendering.
 */

import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import type { MuscleGroup } from '@/lib/exercises';
import type { ResolvedMedia } from '@/lib/exerciseMedia';
import {
  CAMERA_PRESETS,
  DEFAULT_CAMERA_PRESET,
  resolveActivatedMeshNames,
  getCSSAccentColor,
  INACTIVE_MUSCLE_COLOR,
  PREFIX,
} from '@/lib/exerciseGLTF';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ExerciseGLTFPlayerProps {
  /** Supabase public URL for the .glb file. */
  glbUrl: string;
  /** exercise_id slug — must match the AnimationClip name inside the GLB. */
  exerciseId: string;
  /** Union of primary + secondary muscles (anatomicalHighlight from ExerciseDef). */
  activatedMuscles: MuscleGroup[];
  /** Maps to a CAMERA_PRESETS key, e.g. 'rear-three-quarter'. */
  cameraView: string;
  playback: ResolvedMedia['playback'];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExerciseGLTFPlayer({
  glbUrl,
  exerciseId,
  activatedMuscles,
  cameraView,
  playback,
}: ExerciseGLTFPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mutable Three.js objects — stored in refs, not state, so changes
  // don't trigger re-renders. Only UI state (playing, speed, loaded, error)
  // lives in React state.
  const actionRef   = useRef<any>(null);
  const mixerRef    = useRef<any>(null);
  const rendererRef = useRef<any>(null);

  const [playing, setPlaying] = useState(false);
  const [speed,   setSpeed]   = useState<number>(playback.default_speed ?? 1.0);
  const [loaded,  setLoaded]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [hasClip, setHasClip] = useState(false);

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const speedOptions = playback.speed_options ?? [1.0, 0.5];

  // ── Three.js setup ─────────────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frameId: number;
    let observer: ResizeObserver;
    let cancelled = false;

    const init = async () => {
      try {
        // Dynamic imports keep Three.js out of the initial bundle and
        // prevent SSR issues (WebGLRenderer needs window/document).
        const THREE = await import('three');
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js' as string);

        if (cancelled) return;

        // ── Scene
        const scene = new THREE.Scene();

        // ── Renderer (transparent background so UI themes show through)
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        rendererRef.current = renderer;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth || 400, container.clientHeight || 225);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(renderer.domElement);

        // ── Camera
        const preset = CAMERA_PRESETS[cameraView] ?? DEFAULT_CAMERA_PRESET;
        const aspect = (container.clientWidth || 400) / (container.clientHeight || 225);
        const camera = new THREE.PerspectiveCamera(preset.fov, aspect, 0.01, 100);
        camera.position.set(...preset.position);
        camera.lookAt(new THREE.Vector3(...preset.target));

        // ── Lights
        // Ambient: even base illumination
        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        // Key light: front-top-right
        const key = new THREE.DirectionalLight(0xffffff, 1.2);
        key.position.set(2, 4, 3);
        scene.add(key);
        // Fill light: front-top-left, lower intensity
        const fill = new THREE.DirectionalLight(0xffffff, 0.4);
        fill.position.set(-3, 2, -2);
        scene.add(fill);

        // ── Load GLB
        const loader = new GLTFLoader();
        const gltf = await new Promise<any>((resolve, reject) => {
          loader.load(glbUrl, resolve, undefined, reject);
        });

        if (cancelled) return;

        scene.add(gltf.scene);

        // ── Muscle highlighting
        const activeMeshNames = resolveActivatedMeshNames(activatedMuscles);
        const accentColor = getCSSAccentColor(THREE);

        gltf.scene.traverse((obj: any) => {
          if (!obj.isMesh) return;
          const name: string = obj.name ?? '';

          if (name.startsWith(PREFIX.MUSCLE)) {
            const isActive = activeMeshNames.has(name);
            // Replace whatever material came from Blender with a clean
            // MeshStandardMaterial. This keeps rendering consistent
            // regardless of how the Blender material was configured.
            obj.material = new THREE.MeshStandardMaterial({
              color: isActive ? accentColor : new THREE.Color(INACTIVE_MUSCLE_COLOR),
              roughness: 0.75,
              metalness: 0.05,
            });
          } else if (name.startsWith(PREFIX.GROUND)) {
            // Hide ground plane / mat — the app background is the stage.
            obj.visible = false;
          }
        });

        // ── Animation
        // Clip must be named with the exercise_id slug (see BLENDER_GLTF_PRODUCTION_SPEC.md).
        // Fallback: play the first available clip so we get something during development.
        let clip = THREE.AnimationClip.findByName(gltf.animations, exerciseId);
        if (!clip && gltf.animations.length > 0) {
          console.warn(
            `[ExerciseGLTFPlayer] No clip named "${exerciseId}" in ${glbUrl}. ` +
            `Falling back to first clip: "${gltf.animations[0].name}".`
          );
          clip = gltf.animations[0];
        }

        if (clip) {
          const mixer = new THREE.AnimationMixer(gltf.scene);
          mixerRef.current = mixer;
          const action = mixer.clipAction(clip);
          action.timeScale = playback.default_speed ?? 1.0;
          actionRef.current = action;
          setHasClip(true);

          if (!prefersReduced && playback.autoplay) {
            action.play();
            setPlaying(true);
          }
        }

        setLoaded(true);

        // ── ResizeObserver — keeps canvas filling the container
        observer = new ResizeObserver(() => {
          if (!container || !camera || !renderer) return;
          const w = container.clientWidth;
          const h = container.clientHeight;
          if (w === 0 || h === 0) return;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        });
        observer.observe(container);

        // ── Render loop
        const clock = new THREE.Clock();
        const animate = () => {
          frameId = requestAnimationFrame(animate);
          const delta = clock.getDelta();
          mixerRef.current?.update(delta);
          renderer.render(scene, camera);
        };
        animate();

      } catch (err) {
        if (!cancelled) {
          console.error('[ExerciseGLTFPlayer] Failed to load GLB:', err);
          setError('Failed to load 3D model');
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      observer?.disconnect();
      rendererRef.current?.dispose();
      // Remove canvas from DOM
      while (container.firstChild) container.removeChild(container.firstChild);
      rendererRef.current = null;
      mixerRef.current    = null;
      actionRef.current   = null;
    };
  }, [glbUrl, cameraView, exerciseId]);
  // Note: activatedMuscles and playback are captured once at mount.
  // They're fixed per exercise, so no re-init is needed when the sheet
  // re-renders with the same exercise.

  // ── Controls ───────────────────────────────────────────────────────────────

  function togglePlay() {
    const action = actionRef.current;
    if (!action) return;
    if (action.paused || !action.isRunning()) {
      action.paused = false;
      if (!action.isRunning()) action.play();
      setPlaying(true);
    } else {
      action.paused = true;
      setPlaying(false);
    }
  }

  function cycleSpeed() {
    const action = actionRef.current;
    if (!action) return;
    const idx  = speedOptions.indexOf(speed);
    const next = speedOptions[(idx + 1) % speedOptions.length];
    action.timeScale = next;
    setSpeed(next);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative w-full bg-surface-hover overflow-hidden"
      style={{ aspectRatio: '16/9' }}
    >
      {/* Canvas mount point — Three.js appends its <canvas> here */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading state */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-muted">Loading model…</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-muted">{error}</span>
        </div>
      )}

      {/* Controls — only shown once loaded */}
      {loaded && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
          {hasClip && (
            <button
              onClick={cycleSpeed}
              className="px-2 py-1 rounded-lg bg-background/70 backdrop-blur-sm text-[11px] font-bold text-foreground"
            >
              {speed === 1 ? '1×' : '0.5×'}
            </button>
          )}
          {hasClip && (
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-background/70 backdrop-blur-sm text-foreground"
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
          )}
        </div>
      )}

      {/* prefers-reduced-motion overlay — tap to start */}
      {loaded && prefersReduced && !playing && hasClip && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/40 z-10"
        >
          <div className="p-3 rounded-full bg-background/80">
            <Play size={20} className="text-foreground" />
          </div>
          <span className="text-xs text-foreground/70">Tap to play</span>
        </button>
      )}
    </div>
  );
}

export default ExerciseGLTFPlayer;
