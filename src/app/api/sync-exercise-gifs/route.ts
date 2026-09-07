/**
 * /api/sync-exercise-gifs
 *
 * One-shot sync: fetches all exercises from ExerciseDB (RapidAPI),
 * matches them against our 496-exercise catalog by name,
 * and bulk-writes gif_url into the exercises table.
 *
 * Strategy: fetch ExerciseDB once (~1,300 exercises in one call),
 * build a name→gifUrl lookup, match our exercises, batch-update Supabase.
 *
 * Invoke: POST /api/sync-exercise-gifs
 * Protected by CRON_SECRET header.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY ?? '';
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const CRON_SECRET   = process.env.CRON_SECRET ?? '';

// ─── Name normalizer ──────────────────────────────────────────────────────────
// Lowercase, strip parenthetical qualifiers, collapse whitespace, strip punctuation.
// "Barbell Curl (wide grip)" → "barbell curl"
// "Dumbbell Fly" → "dumbbell fly"
function norm(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\(.*?\)/g, '')   // drop (parenthetical)
    .replace(/[^a-z0-9 ]/g, '')   // drop punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(req: Request) {
  // Auth check
  const secret = req.headers.get('x-cron-secret') ?? '';
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!RAPIDAPI_KEY) {
    return NextResponse.json({ error: 'RAPIDAPI_KEY not set' }, { status: 500 });
  }

  try {
    // ── Step 1: Fetch all ExerciseDB exercises in one call ──────────────────
    console.log('[sync-gifs] Fetching ExerciseDB catalog...');
    const edbRes = await fetch(
      'https://exercisedb.p.rapidapi.com/exercises?limit=1500&offset=0',
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
        },
        // 30s timeout
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (!edbRes.ok) {
      const text = await edbRes.text();
      return NextResponse.json(
        { error: `ExerciseDB returned ${edbRes.status}`, detail: text },
        { status: 502 }
      );
    }

    const edbExercises: Array<{ name: string; gifUrl: string }> = await edbRes.json();
    console.log(`[sync-gifs] ExerciseDB returned ${edbExercises.length} exercises`);

    // ── Step 2: Build normalized name → gifUrl map ──────────────────────────
    const gifMap = new Map<string, string>();
    for (const ex of edbExercises) {
      const key = norm(ex.name);
      if (!gifMap.has(key)) {
        gifMap.set(key, ex.gifUrl);
      }
    }

    // ── Step 3: Fetch our exercise catalog ─────────────────────────────────
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: ourExercises, error: fetchErr } = await supabase
      .from('exercises')
      .select('exercise_id, name');

    if (fetchErr || !ourExercises) {
      return NextResponse.json({ error: 'Failed to fetch exercises', detail: fetchErr }, { status: 500 });
    }

    console.log(`[sync-gifs] Matching ${ourExercises.length} exercises...`);

    // ── Step 4: Match and collect updates ──────────────────────────────────
    const matched: Array<{ exercise_id: string; gif_url: string; name: string }> = [];
    const missed: string[] = [];

    for (const ex of ourExercises) {
      const key = norm(ex.name ?? '');
      const gifUrl = gifMap.get(key);

      if (gifUrl) {
        matched.push({ exercise_id: ex.exercise_id, gif_url: gifUrl, name: ex.name });
      } else {
        // Try partial match: check if any ExerciseDB key contains our key
        let partialMatch: string | undefined;
        for (const [edbKey, url] of gifMap.entries()) {
          if (edbKey.includes(key) || key.includes(edbKey)) {
            partialMatch = url;
            break;
          }
        }
        if (partialMatch) {
          matched.push({ exercise_id: ex.exercise_id, gif_url: partialMatch, name: ex.name });
        } else {
          missed.push(ex.name ?? ex.exercise_id);
        }
      }
    }

    console.log(`[sync-gifs] Matched: ${matched.length}, Missed: ${missed.length}`);

    // ── Step 5: Bulk-update in batches of 50 ───────────────────────────────
    const BATCH = 50;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < matched.length; i += BATCH) {
      const batch = matched.slice(i, i + BATCH);
      // Supabase upsert by exercise_id
      const { error: upsertErr } = await supabase
        .from('exercises')
        .upsert(
          batch.map(({ exercise_id, gif_url }) => ({ exercise_id, gif_url })),
          { onConflict: 'exercise_id' }
        );

      if (upsertErr) {
        console.error('[sync-gifs] Upsert error:', upsertErr);
        errors += batch.length;
      } else {
        updated += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      edbTotal: edbExercises.length,
      ourTotal: ourExercises.length,
      matched: matched.length,
      updated,
      errors,
      missed: missed.slice(0, 50), // first 50 unmatched for review
      missedCount: missed.length,
    });

  } catch (err) {
    console.error('[sync-gifs] Unexpected error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
