/**
 * sync-gifs.mjs
 * Run from the dashboard directory:
 *   node scripts/sync-gifs.mjs
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// ── Load .env.local ───────────────────────────────────────────────────────────
const env = {};
try {
  const raw = readFileSync('.env.local', 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, '');
  }
} catch {
  console.error('Could not read .env.local — run from the dashboard directory');
  process.exit(1);
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('❌  Missing Supabase env vars'); process.exit(1); }

// ── Name normalizer ───────────────────────────────────────────────────────────
function norm(name) {
  return name
    .toLowerCase()
    .replace(/\s*\(.*?\)/g, '')   // strip (equipment qualifier)
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Word-set similarity: catches "barbell squat" vs "squat barbell"
function similarity(a, b) {
  const wa = new Set(a.split(' ').filter(w => w.length > 2));
  const wb = new Set(b.split(' ').filter(w => w.length > 2));
  if (wa.size === 0 || wb.size === 0) return 0;
  let common = 0;
  for (const w of wa) if (wb.has(w)) common++;
  return common / Math.max(wa.size, wb.size);
}

// ── Fetch free-exercise-db ────────────────────────────────────────────────────
const DATASET_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const GIF_BASE    = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

console.log('📡  Fetching exercise dataset from GitHub...');
const dataRes = await fetch(DATASET_URL);
if (!dataRes.ok) { console.error(`❌  Dataset fetch failed: ${dataRes.status}`); process.exit(1); }
const dataset = await dataRes.json();
console.log(`✅  Dataset: ${dataset.length} exercises`);

// Build entries for matching
const entries = dataset
  .filter(ex => ex.images?.length > 0)
  .map(ex => ({
    key: norm(ex.name),
    url: `${GIF_BASE}/${ex.id}/${ex.images[0]}`,
  }));

// Fast exact map
const exactMap = new Map(entries.map(e => [e.key, e.url]));
console.log(`🗺️   GIF map: ${exactMap.size} entries`);

// ── Fetch our exercises ───────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const { data: ourExercises, error: fetchErr } = await supabase
  .from('exercises')
  .select('exercise_id, exercise_name');

if (fetchErr) { console.error('❌  Supabase fetch error:', fetchErr); process.exit(1); }
console.log(`📋  Our catalog: ${ourExercises.length} exercises`);

// ── Match ─────────────────────────────────────────────────────────────────────
const matched = [];
const missed  = [];

for (const ex of ourExercises) {
  const rawName = ex.exercise_name ?? '';
  const key = norm(rawName);

  // Extract qualifier from parentheses e.g. "Squat (Barbell)" → "barbell"
  const qualMatch = rawName.match(/\(([^)]+)\)/);
  const qualifier = qualMatch ? qualMatch[1].toLowerCase().replace(/[^a-z0-9 ]/g,'').trim() : '';
  // Build alternate key: "barbell squat" so it matches dataset's "Barbell Squat"
  const altKey = qualifier ? `${qualifier} ${key}` : key;

  // 1. Exact match on base key or alt key
  let url = exactMap.get(key) ?? exactMap.get(altKey);

  // 2. Best word-set similarity — test both key forms, take best score
  if (!url) {
    let bestScore = 0;
    let bestUrl   = null;
    for (const entry of entries) {
      const s1 = similarity(key, entry.key);
      const s2 = altKey !== key ? similarity(altKey, entry.key) : 0;
      const score = Math.max(s1, s2);
      if (score > bestScore) { bestScore = score; bestUrl = entry.url; }
    }
    if (bestScore >= 0.6) url = bestUrl;
  }

  if (url) matched.push({ exercise_id: ex.exercise_id, gif_url: url });
  else      missed.push(rawName);
}

console.log(`\n🎯  Matched: ${matched.length} / ${ourExercises.length}`);
console.log(`❌  Missed:  ${missed.length}`);

// ── Update Supabase (UPDATE not upsert — rows already exist) ──────────────────
console.log('\n💾  Writing to Supabase...');
let updated = 0;
let errors  = 0;

// Batch with Promise.all (10 concurrent updates)
const CONCURRENCY = 10;
for (let i = 0; i < matched.length; i += CONCURRENCY) {
  const batch = matched.slice(i, i + CONCURRENCY);
  await Promise.all(
    batch.map(({ exercise_id, gif_url }) =>
      supabase
        .from('exercises')
        .update({ gif_url })
        .eq('exercise_id', exercise_id)
        .then(({ error: e }) => {
          if (e) { console.error(`  Error on ${exercise_id}:`, e.message); errors++; }
          else updated++;
        })
    )
  );
  process.stdout.write(`\r  ${updated + errors}/${matched.length}...`);
}

console.log(`\n\n✅  Done — ${updated} exercises updated, ${errors} errors`);

if (missed.length) {
  console.log(`\nUnmatched (${missed.length}):`);
  missed.slice(0, 30).forEach(n => console.log(`  - ${n}`));
  if (missed.length > 30) console.log(`  ... and ${missed.length - 30} more`);
}
