#!/usr/bin/env python3
"""
Generate still exercise images for the exercise catalog and upload them
straight into Supabase Storage at each row's reserved thumbnail_path.

RUN THIS ON YOUR OWN MACHINE, NOT INSIDE THE CLAUDE CLOUD SESSION.
That sandbox's network is locked down and can't reach api.openai.com.
Your own machine has normal internet access, so this just works there.

-------------------------------------------------------------------
SETUP (run once)
-------------------------------------------------------------------
1. Install dependencies:
     python3 -m pip install openai supabase pillow

2. Set two environment variables in your terminal (don't hardcode them
   in this file, and don't paste them into a chat with anyone):

     export OPENAI_API_KEY="sk-proj-..."
     export SUPABASE_SERVICE_ROLE_KEY="..."

   Get the service role key from your Supabase dashboard:
   Project Settings -> API -> service_role key (the SECRET one, not
   the publishable/anon key).

-------------------------------------------------------------------
USAGE  (run from the `dashboard` directory)
-------------------------------------------------------------------
     python3 generate_exercise_images.py --limit 5
     python3 generate_exercise_images.py            # full remaining batch
     python3 generate_exercise_images.py --force     # regenerate everything,
                                                       # even rows already Complete

Resumable: skips any row whose asset_status is already 'Complete'.

Muscle data source: this script reads src/lib/exercises.ts directly and
uses each exercise's `anatomicalHighlight` array (primaryMuscles union
secondaryMuscles, already computed in that file) to tell the image model
exactly which muscles to highlight -- not a guess from the folder name.
Any exercise_id present in Supabase but missing from exercises.ts is
skipped and reported, rather than generated with guessed data.
-------------------------------------------------------------------
"""

import argparse
import base64
import os
import re
import sys
import time

SUPABASE_URL = "https://ljbpbcjienthupeyzxhc.supabase.co"
BUCKET = "exercise-assets"
DEFAULT_TS_PATH = "src/lib/exercises.ts"

STYLE_BIBLE = (
    "High-detail 3D male anatomical figure, simplified/featureless face, "
    "wearing solid opaque black athletic compression shorts with full coverage "
    "(no exposed skin below the waist), transparent background, "
    "no gym or environment behind the figure. "
    "All equipment rendered with physically accurate proportions and correct "
    "spatial relationships: equipment must be realistically scaled relative to "
    "the human figure (a pull-up bar is as thick as a wrist, a barbell is "
    "shoulder-width plus collars, dumbbells fit in one hand), equipment is "
    "physically grounded and attached correctly with no floating bars, "
    "no disconnected elements, and no impossible geometries. "
    "Realistic but visually simplified equipment with no branding or weight labels. "
    "Grayscale inactive anatomy, activated muscles shown in ONE solid red "
    "highlight color with no gradients, glow, feathering, or painted overlays. "
    "Visible muscle fiber detail preserved inside the highlighted muscles. "
    "Highlight boundaries follow real anatomical muscle boundaries exactly. "
    "Consistent figure proportions and rendering style across the whole set. "
    "PG-13 fitness-education illustration in the style of a clinical anatomy "
    "textbook diagram."
)

FALLBACK_SUFFIX = (
    " The figure is fully clothed in opaque black athletic shorts and a "
    "form-fitting athletic tank top, covering the torso and hips completely. "
    "Educational fitness diagram, no nudity, no suggestive content, safe for "
    "all audiences."
)

# Equipment descriptions — precise and unambiguous so the model renders correctly.
EQUIPMENT_LABELS = {
    "barbell":    "a standard Olympic barbell (straight bar, 7 feet long, with weight plates on each end)",
    "dumbbell":   "a pair of hex dumbbells (short hand-held weights, one in each hand)",
    "cable":      "a cable pulley machine (upright frame with a cable, handle attachment, and weight stack)",
    "bodyweight": "no equipment — bodyweight only, no props",
    "machine":    "a standard plate-loaded or selectorized gym machine appropriate for the movement",
    "skill":      "appropriate calisthenics apparatus (pull-up bar, parallel bars, or gymnastics rings — choose whichever one is standard for this specific exercise, rendered at correct scale and attachment)",
    "cardio":     "standard cardio equipment appropriate for the movement",
    "kettlebell": "a single cast-iron kettlebell (ball with a flat base and looped handle on top)",
    "full body":  "no equipment — bodyweight only",
}

# Per-exercise equipment overrides for skill exercises where the generic label is ambiguous.
SKILL_EQUIPMENT_OVERRIDES = {
    "pull-up":           "a horizontal pull-up bar mounted overhead at standard height (bar ~1 inch diameter, figure hangs from it with arms fully extended)",
    "chin-up":           "a horizontal pull-up bar mounted overhead at standard height",
    "muscle-up":         "a horizontal pull-up bar mounted overhead at standard height",
    "dip":               "parallel dip bars at hip height (two horizontal bars, shoulder-width apart, figure supports body between them on straight arms)",
    "ring":              "gymnastics rings (two wooden rings suspended by straps from above, hanging at appropriate height for the movement)",
    "lever":             "a straight horizontal bar fixed at standard height (bar ~1 inch diameter, figure grips it with both hands)",
    "planche":           "the floor or parallel bars low to the ground — figure is horizontal, supported only by straight arms",
    "handstand":         "the floor — figure is inverted, balancing on both hands",
    "pistol":            "no equipment — single-leg bodyweight squat on the floor",
    "l-sit":             "parallel bars or the floor — figure holds body up with straight arms, legs extended horizontally",
    "human-flag":        "a vertical pole — figure grips it with both hands and holds body horizontal",
}


# ── exercises.ts parser ─────────────────────────────────────────────────────
# Parses the single-line-per-entry object literals in EXERCISE_LIBRARY.
# Not a general JS parser -- relies on the file's existing consistent format.

def parse_exercises_ts(path: str) -> dict:
    if not os.path.exists(path):
        sys.exit(
            f"Can't find {path}. Run this script from your `dashboard` directory, "
            f"or pass --exercises-ts <path>."
        )
    with open(path, encoding="utf-8") as f:
        content = f.read()

    defs = {}
    for line in content.splitlines():
        line = line.strip()
        if not line.startswith("{ exercise_id:"):
            continue

        def field_str(key):
            m = re.search(rf'{key}:\s*"([^"]*)"', line)
            return m.group(1) if m else None

        def field_arr(key):
            m = re.search(rf"{key}:\s*\[([^\]]*)\]", line)
            if not m:
                return []
            return [x.strip().strip('"') for x in m.group(1).split(",") if x.strip()]

        def field_bool(key):
            m = re.search(rf"{key}:\s*(true|false)", line)
            return m.group(1) == "true" if m else False

        exercise_id = field_str("exercise_id")
        if not exercise_id:
            continue
        defs[exercise_id] = {
            "name": field_str("name"),
            "primaryMuscles": field_arr("primaryMuscles"),
            "secondaryMuscles": field_arr("secondaryMuscles"),
            "anatomicalHighlight": field_arr("anatomicalHighlight"),
            "type": field_str("type"),
            "isHold": field_bool("isHold"),
        }
    return defs


def get_equipment_description(defn: dict) -> str:
    """Return the most specific equipment description available for this exercise."""
    exercise_id = defn.get("exercise_id", "") or ""
    ex_type = defn.get("type") or ""

    # Check skill overrides first — match on any keyword in the exercise_id
    if ex_type == "skill":
        for keyword, description in SKILL_EQUIPMENT_OVERRIDES.items():
            if keyword in exercise_id:
                return description

    return EQUIPMENT_LABELS.get(ex_type, "")


def build_prompt(defn: dict, fallback: bool = False) -> str:
    name = defn["name"]
    highlight = defn["anatomicalHighlight"] or defn["primaryMuscles"]
    equip = get_equipment_description(defn)
    equipment_note = f" using {equip}" if equip else ""
    pose_note = (
        "held in a static hold position"
        if defn.get("isHold")
        else "shown at the peak/working position of the movement"
    )
    highlight_str = ", ".join(highlight) if highlight else "the primary working muscles"

    prompt = (
        f"{STYLE_BIBLE} The figure is demonstrating the exercise "
        f"'{name}'{equipment_note}, {pose_note}, camera angle chosen to clearly "
        f"show these highlighted muscles: {highlight_str}. Only the listed "
        f"muscles are highlighted in red; all other muscles stay grayscale. "
        f"Single clean instructional pose, no text, no logos, no watermark."
    )
    if fallback:
        prompt += FALLBACK_SUFFIX
    return prompt


def get_supabase():
    from supabase import create_client
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        sys.exit("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.")
    return create_client(SUPABASE_URL, key)


def get_openai():
    from openai import OpenAI
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        sys.exit("Missing OPENAI_API_KEY environment variable.")
    return OpenAI(api_key=key)


def fetch_rows(sb, limit, force):
    q = sb.table("exercises").select(
        "exercise_id, exercise_name, thumbnail_path, asset_status"
    ).order("exercise_name")
    if not force:
        q = q.neq("asset_status", "Complete")
    if limit:
        q = q.limit(limit)
    return q.execute().data


FAILURES_LOG = "generation_failures.csv"


def log_failure(exercise_id: str, name: str, reason: str):
    is_new = not os.path.exists(FAILURES_LOG)
    with open(FAILURES_LOG, "a") as f:
        if is_new:
            f.write("exercise_id,exercise_name,reason\n")
        clean_reason = reason.replace("\n", " ").replace(",", ";")[:300]
        f.write(f'{exercise_id},"{name}","{clean_reason}"\n')


def generate_one(openai_client, sb, row, defn, dry_run=False):
    exercise_id = row["exercise_id"]
    thumb_path = row["thumbnail_path"]

    prompt = build_prompt(defn)
    print(f"[{exercise_id}] generating...")

    if dry_run:
        print(f"    PROMPT: {prompt}")
        return

    try:
        result = openai_client.images.generate(
            model="gpt-image-1",
            prompt=prompt,
            size="1024x1024",
            background="transparent",
            n=1,
        )
    except Exception as e:
        if "moderation_blocked" in str(e):
            print(f"    moderation block, retrying with safer wording...")
            fallback_prompt = build_prompt(defn, fallback=True)
            try:
                result = openai_client.images.generate(
                    model="gpt-image-1",
                    prompt=fallback_prompt,
                    size="1024x1024",
                    background="transparent",
                    n=1,
                )
            except Exception as e2:
                log_failure(exercise_id, defn["name"], str(e2))
                raise
        else:
            log_failure(exercise_id, defn["name"], str(e))
            raise

    image_bytes = base64.b64decode(result.data[0].b64_json)

    from PIL import Image
    import io
    png_path = f"/tmp/{exercise_id}.png"
    with open(png_path, "wb") as f:
        f.write(image_bytes)
    im = Image.open(png_path).convert("RGBA")
    webp_bytes_io = io.BytesIO()
    im.save(webp_bytes_io, format="WEBP")
    webp_bytes = webp_bytes_io.getvalue()

    sb.storage.from_(BUCKET).upload(
        path=thumb_path.replace(f"{BUCKET}/", "", 1),
        file=webp_bytes,
        file_options={"content-type": "image/webp", "upsert": "true"},
    )

    sb.table("exercises").update({"asset_status": "Complete"}).eq(
        "exercise_id", exercise_id
    ).execute()

    print(f"    done -> {thumb_path}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=None, help="only process N rows (test batch)")
    ap.add_argument("--force", action="store_true", help="regenerate rows already marked Complete")
    ap.add_argument("--dry-run", action="store_true", help="print prompts only, no API calls")
    ap.add_argument("--exercises-ts", default=DEFAULT_TS_PATH, help="path to exercises.ts")
    ap.add_argument("--ids", nargs="+", help="specific exercise_ids to generate (space-separated)")
    args = ap.parse_args()

    ts_defs = parse_exercises_ts(args.exercises_ts)
    print(f"Loaded {len(ts_defs)} exercise definitions from {args.exercises_ts}")

    sb = get_supabase()
    openai_client = None if args.dry_run else get_openai()

    if args.ids:
        # Fetch only the specified exercise IDs
        all_rows = []
        for eid in args.ids:
            q = sb.table("exercises").select(
                "exercise_id, exercise_name, thumbnail_path, asset_status"
            ).eq("exercise_id", eid)
            result = q.execute().data
            if result:
                all_rows.extend(result)
            else:
                print(f"[{eid}] not found in Supabase exercises table")
        rows = all_rows
    else:
        rows = fetch_rows(sb, args.limit, args.force)
    print(f"Processing {len(rows)} exercise(s)...")

    failed_count = 0
    skipped_count = 0
    for row in rows:
        exercise_id = row["exercise_id"]
        defn = ts_defs.get(exercise_id)
        if not defn:
            print(f"[{exercise_id}] SKIPPED -- not found in exercises.ts (Supabase/ts are out of sync)")
            log_failure(exercise_id, row.get("exercise_name", ""), "missing from exercises.ts")
            skipped_count += 1
            continue
        try:
            generate_one(openai_client, sb, row, defn, dry_run=args.dry_run)
        except Exception as e:
            print(f"    FAILED [{exercise_id}]: {e}")
            failed_count += 1
            time.sleep(2)
            continue
        time.sleep(0.5)  # gentle pacing against rate limits

    print("Batch complete.")
    if failed_count or skipped_count:
        print(
            f"{failed_count} failed, {skipped_count} skipped (out of sync) -- both "
            f"logged to {FAILURES_LOG} for review. Re-run anytime; it only retries "
            f"rows still not 'Complete'."
        )


if __name__ == "__main__":
    main()
