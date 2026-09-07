# Blender → GLTF Production Specification

**Authoritative source for all 3D asset creation for the Hevy-clone fitness app.**  
Animation pipeline: Blender (source of truth) → GLB export → Three.js (`ExerciseGLTFPlayer`).

> First production target: **Pull-Up** (`exercise_id: pull-up`).  
> Do not start additional exercises until Pull-Up is reviewed and approved.

---

## 1. Source Anatomical Model Requirements

Before licensing or acquiring a model, verify all of the following:

### Topology
- Manifold mesh with no non-manifold edges or holes.
- Human body split into **named mesh objects** per muscle group (see §3).
- Face count: body ~30k–80k tris; each muscle mesh ~2k–8k tris. Stay within a 250k total triangle budget for the full character.
- Quads preferred for deformation regions; tris acceptable for non-deforming areas.

### Rigging
- Full articulated rig: spine (5+ bones), neck/head, clavicles, full arm chain (shoulder → upper arm → forearm → hand → fingers optional), full leg chain (hip → thigh → shin → foot → toes optional).
- Bind pose: anatomical neutral (T-pose or A-pose — A-pose preferred for shoulder deformation quality).
- Skinning: smooth weight painting, no pinching at shoulder/hip joints.

### Licensing
- Must allow commercial use without attribution requirement in-product.
- No output restrictions. Check for clauses that block AI-assisted derivative work — these are acceptable as long as the exported GLB can be shipped in a commercial app without royalty.

---

## 2. Blender File Organization

```
hevy-anatomy.blend
├── Collection: Body
│   ├── body_skin          ← main skin mesh (non-muscle surface)
│   ├── body_eyes
│   └── body_hair (optional)
├── Collection: Muscles
│   ├── muscle_latissimus_dorsi_L
│   ├── muscle_latissimus_dorsi_R
│   └── ... (see §3 for full list)
├── Collection: Equipment
│   ├── equip_pull_up_bar
│   └── ... (see §5)
├── Collection: Rig
│   └── rig_anatomy        ← single armature object
├── Collection: Cameras
│   ├── cam_front_three_quarter
│   ├── cam_rear_three_quarter
│   └── ... (see §6)
└── Collection: Ground (hidden on export)
    └── ground_mat
```

**Object naming rules:**
- Lowercase, underscores only, no spaces.
- Always start with the prefix from the table below.
- Blender left/right suffix: `_L` (character's left) / `_R` (character's right). **Use Blender's "Flip Names" operator** to keep L/R pairs in sync.

| Prefix | Category |
|--------|----------|
| `muscle_` | Individual muscle meshes — highlighted at runtime |
| `body_` | Non-muscle body surface (skin, eyes, hair) |
| `equip_` | Exercise equipment (reusable across exercises) |
| `rig_` | Armature root |
| `cam_` | Named camera objects |
| `ground_` | Ground plane / mat (hidden at runtime by the player) |

---

## 3. Muscle Mesh Naming — Full Canonical List

The app reads `MUSCLE_MESH_MAP` in `src/lib/exerciseGLTF.ts`.  
Every mesh name below must exist in the exported GLB **exactly as written**.

### Bilateral (left + right)

| Muscle Group | Mesh Names |
|---|---|
| Biceps | `muscle_biceps_L`, `muscle_biceps_R` |
| Triceps | `muscle_triceps_long_L/R`, `muscle_triceps_lateral_L/R` |
| Chest | `muscle_pec_major_L/R`, `muscle_pec_minor_L/R` |
| Shoulders | `muscle_deltoid_anterior_L/R`, `muscle_deltoid_lateral_L/R`, `muscle_deltoid_posterior_L/R` |
| Lats | `muscle_latissimus_dorsi_L`, `muscle_latissimus_dorsi_R` |
| Upper Back | `muscle_rhomboid_L/R`, `muscle_teres_major_L/R`, `muscle_teres_minor_L/R`, `muscle_infraspinatus_L/R` |
| Traps | `muscle_trapezius_upper_L/R`, `muscle_trapezius_mid_L/R`, `muscle_trapezius_lower_L/R` |
| Forearms | `muscle_forearm_flexors_L/R`, `muscle_forearm_extensors_L/R` |
| Neck | `muscle_sternocleidomastoid_L`, `muscle_sternocleidomastoid_R` |
| Obliques | `muscle_obliques_external_L/R`, `muscle_obliques_internal_L/R` |
| Lower Back | `muscle_erector_spinae_L/R`, `muscle_quadratus_lumborum_L/R` |
| Glutes | `muscle_gluteus_maximus_L/R`, `muscle_gluteus_medius_L/R` |
| Quads | `muscle_rectus_femoris_L/R`, `muscle_vastus_lateralis_L/R`, `muscle_vastus_medialis_L/R` |
| Hamstrings | `muscle_biceps_femoris_L/R`, `muscle_semitendinosus_L/R` |
| Calves | `muscle_gastrocnemius_L/R`, `muscle_soleus_L/R` |
| Adductors | `muscle_adductor_magnus_L/R`, `muscle_adductor_longus_L/R` |
| Abductors | `muscle_tensor_fasciae_latae_L`, `muscle_tensor_fasciae_latae_R` |

### Midline (single mesh)

| Muscle Group | Mesh Name |
|---|---|
| Abs | `muscle_rectus_abdominis` |

---

## 4. Bone Naming Convention (Armature)

Use Blender's standard `.L` / `.R` suffix. The player does not read bone names directly, but Blender's automatic IK/deformation depends on consistent naming.

```
rig_anatomy
├── spine_root
│   ├── spine_01 … spine_05
│   ├── chest
│   │   ├── clavicle.L / clavicle.R
│   │   │   └── upper_arm.L/R → forearm.L/R → hand.L/R → finger_*.L/R
│   │   └── neck_01
│   │       └── head
│   └── pelvis
│       └── thigh.L/R → shin.L/R → foot.L/R → toe.L/R
```

Shape key / morph target names (if used): `basis`, `flex_bicep_L`, `flex_bicep_R`, etc.  
The player does not currently drive shape keys — bone deformation only.

---

## 5. Equipment Naming

Equipment objects are **reused across exercises** — export only once per equipment type, then reference by name in each exercise GLB.

| Object Name | Used For |
|---|---|
| `equip_pull_up_bar` | Pull-Up, Chin-Up, Chest-to-Bar, etc. |
| `equip_barbell` | All barbell exercises |
| `equip_dumbbell_L`, `equip_dumbbell_R` | Dumbbell exercises |
| `equip_cable_handle` | Cable exercises |
| `equip_rings_L`, `equip_rings_R` | Ring exercises |
| `equip_bench_flat` | Bench Press, Dumbbell Fly, etc. |
| `equip_bench_incline` | Incline exercises |
| `equip_dip_bars` | Dips, Straight-Bar Dip |

Add equipment to the same GLB as the exercise animation — the player loads one file per exercise.

---

## 6. Camera Objects

Export named cameras so future tooling can drive per-exercise framing from Blender data. The player currently uses hardcoded `CAMERA_PRESETS` in `exerciseGLTF.ts` but will prefer the embedded camera if named correctly.

| Object Name | View |
|---|---|
| `cam_front_three_quarter` | Default — front-right diagonal |
| `cam_rear_three_quarter` | Pull-Up default — rear-right diagonal |
| `cam_side` | Lateral view |
| `cam_side_three_quarter` | Side + slight front angle |
| `cam_front` | Straight front |
| `cam_rear` | Straight rear |
| `cam_top` | Top-down |

Camera settings: **FOV 42°**, resolution **1280×720** (16:9). These match `CAMERA_PRESETS` in `exerciseGLTF.ts`.

---

## 7. Animation Clip Naming

Each exercise gets exactly **one** `AnimationAction` clip per GLB.  
The clip name **must equal the `exercise_id` slug** from the database.

Examples:
| exercise_id | Clip name in GLB |
|---|---|
| `pull-up` | `pull-up` |
| `chin-up` | `chin-up` |
| `bicep-curl-barbell` | `bicep-curl-barbell` |

**Clip settings:**
- Frame rate: 30 fps
- Duration: full movement cycle (one rep, seamless loop)
- Loop: the animation itself should be loopable (start pose = end pose). The player uses `AnimationAction` default loop mode (LoopRepeat).
- Isometric holds (`isHold: true`): 2–4 second hold in peak position, then a slow 1-second transition back to neutral, then loop. Or use a single held frame — the player will still loop it.

---

## 8. Blender Export Settings (GLB)

**File → Export → glTF 2.0** with these settings:

```
Format:              Binary (.glb)
Include:             Selected Objects (or all if single-exercise file)
Transform:           Y Up  ✓
Geometry:
  Apply Modifiers:   ✓
  UVs:               ✓
  Normals:           ✓
  Tangents:          ✓
  Vertex Colors:     ✗  (we drive color from code)
  Materials:         Export
  Compression:       ✗  (Draco off — Three.js needs DRACOLoader added separately)
Animation:
  Use Current Frame: ✗
  Limit to Playback Range: ✓
  Always Sample:     ✓
  NLA Tracks:        ✓
  Actions:           ✓
  Optimize Animation: ✓  (removes redundant keyframes)
```

**Before exporting:**
1. Apply all transforms (Ctrl+A → All Transforms).
2. Check that all muscle mesh origins are within the mesh bounds.
3. Verify mesh names in the Outliner match the canonical list exactly (§3).
4. Run **Object → Clean Up → Merge by Distance** on each muscle mesh to remove duplicate verts.
5. Export one GLB per exercise (not one master file).

---

## 9. Materials in Blender

Keep Blender materials simple — the player replaces them at runtime with `MeshStandardMaterial`.

- Muscle meshes: any solid color Principled BSDF. Color doesn't matter; the player overwrites it.
- Skin mesh (`body_skin`): Principled BSDF. The player does NOT replace this — author it for visual quality.
- Equipment: Principled BSDF, metallic/roughness physically plausible.

Do **not** use emission, volume, subsurface scattering, or node-group procedural textures on muscle meshes — they will be discarded.

---

## 10. Supabase Storage Paths

```
exercise-assets/
└── {appSection-kebab}/
    └── {exercise_id}/
        ├── demo.glb          ← animation asset (Three.js loads this)
        └── thumbnail.webp    ← static still render (exercise picker uses this)
```

Example for Pull-Up (`appSection: "Upper Body"`):

```
exercise-assets/upper-body/pull-up/demo.glb
exercise-assets/upper-body/pull-up/thumbnail.webp
```

Upload both files before setting `asset_status = 'Complete'` in the `exercises` table.  
Use the `exercise-assets` bucket (public). The `exercise-masters` bucket (private) stores the source `.blend` files.

### Database fields to update per exercise

| Field | Value |
|---|---|
| `animation_path` | `upper-body/pull-up/demo.glb` (without bucket prefix) |
| `thumbnail_path` | `upper-body/pull-up/thumbnail.webp` |
| `camera_view` | e.g. `rear-three-quarter` |
| `asset_status` | `'Complete'` |

---

## 11. Thumbnail Pipeline

1. In Blender, position the camera matching the `camera_view` preset for that exercise.
2. Set render engine to **EEVEE** or **Cycles** (Cycles for final quality).
3. Resolution: **640×360** (16:9).
4. Background: transparent alpha.
5. Render a single frame at the mid-point of the animation (peak contraction).
6. Export as **PNG**, then compress to **WebP** at 85% quality: `cwebp -q 85 render.png -o thumbnail.webp`.
7. Upload to `exercise-assets/{section}/{exercise_id}/thumbnail.webp`.

---

## 12. Review Checklist Before Marking `asset_status = 'Complete'`

- [ ] GLB loads in `<ExerciseGLTFPlayer>` without console errors.
- [ ] Activated muscle meshes highlight in the accent color.
- [ ] Inactive muscle meshes render in mid-grey.
- [ ] Animation loops seamlessly at 1× and 0.5× speed.
- [ ] Canvas renders on a transparent background (no black box).
- [ ] Camera framing matches the intended `camera_view`.
- [ ] prefers-reduced-motion: autoplay does not trigger; tap-to-play overlay appears.
- [ ] No visual geometry artifacts (z-fighting, missing meshes, inverted normals).
- [ ] Thumbnail loads in the exercise picker before the sheet opens.
- [ ] Naeem has reviewed and approved the Pull-Up before any other exercise is started.
