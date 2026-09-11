/**
 * Pulls verified gif_url values from Supabase and writes them to
 * src/lib/exerciseGifs.json so the app uses correct image URLs.
 *
 * Run from the dashboard directory:
 *   node scripts/export-gifs-json.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const env = {};
const raw = readFileSync('.env.local', 'utf8');
for (const line of raw.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const idx = t.indexOf('=');
  if (idx === -1) continue;
  env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim().replace(/^"|"$/g, '');
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Missing Supabase env vars — run from the dashboard directory');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('📡  Fetching gif_urls from Supabase...');
const { data, error } = await supabase
  .from('exercises')
  .select('exercise_id, gif_url')
  .not('gif_url', 'is', null);

if (error) { console.error('❌  Supabase error:', error); process.exit(1); }

const map = {};
for (const row of data) {
  if (row.gif_url) map[row.exercise_id] = row.gif_url;
}

writeFileSync('src/lib/exerciseGifs.json', JSON.stringify(map, null, 2));
console.log(`✅  Wrote ${Object.keys(map).length} entries to src/lib/exerciseGifs.json`);
