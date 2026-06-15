# Naeem's Dashboard — Phase A (Foundation)

Personal workout/nutrition dashboard. Next.js (App Router) + Tailwind +
Supabase (Postgres + Auth) + Recharts. Replaces the Notion Phase 1 build
and the Google Sheets/Python toolchain (see
`../Standalone-Dashboard-PRD.md`).

## What's done (Phase A)

- Next.js 14 + TypeScript + Tailwind, dark theme with gold accent
  (LuxFitness-style reference), light-mode toggle
- Sidebar nav for all 5 domains (Workouts/Nutrition active in Phase B/C,
  Goals/Content/Mental Health stubbed for Phase E)
- Dashboard shell: stat cards, weekly volume chart, "Next Session" panel,
  weekly target progress bars — all sample data for now
- Supabase client (browser + server) wired up
- Auth: login/password via Supabase Auth in production; **local dev
  skips login entirely** (middleware checks `NODE_ENV`)
- Database schema (`../supabase/schema.sql`) for `workout_sessions` and
  `meals`, with RLS policies and a `meal_daily_totals` view (replaces the
  Notion rollups that were deferred in §5.2 of the original PRD)

## One-time setup (you do this part)

I can't create accounts on your behalf, but here's exactly what to do.
Should take ~15 minutes total.

### 1. Supabase project

1. Go to [supabase.com](https://supabase.com) → sign up / log in (free tier).
2. **New project** → name it (e.g. `naeem-dashboard`), pick a region close
   to you, set a database password (save it somewhere — you won't need it
   day-to-day, but Supabase asks for it).
3. Once the project finishes provisioning, go to **SQL Editor** → **New
   query** → paste the contents of `../supabase/schema.sql` → **Run**.
   This creates the `workout_sessions` and `meals` tables, the
   `meal_daily_totals` view, and row-level security policies.
4. Go to **Authentication → Users** → **Add user** → create yourself a
   login (email + password). This is the account you'll log in with once
   the app is deployed.
5. Go to **Project Settings → API**. You'll need two values for the next
   step:
   - **Project URL**
   - **anon public** key

### 2. Local environment

1. In the `dashboard/` folder, copy `.env.local.example` to `.env.local`.
2. Fill in the two Supabase values from above.
3. Install dependencies and run locally:

   ```bash
   cd dashboard
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) — no login required
   locally (by design, per your preference).

   > Note: an earlier setup attempt left a partially-installed
   > `node_modules/` in this folder that couldn't be cleanly removed due
   > to file permissions on this machine. If `npm install` complains,
   > delete the `dashboard/node_modules` folder manually first (Finder →
   > right-click → Move to Trash), then re-run `npm install`.

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → sign up / log in (free tier),
   ideally with your GitHub account.
2. Push this project to a GitHub repo (or use Vercel's CLI/drag-and-drop
   if you'd rather not use GitHub yet).
3. In Vercel, **Add New → Project** → import the repo → set the **Root
   Directory** to `dashboard`.
4. Add the same two environment variables from `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) under
   **Settings → Environment Variables**.
5. Deploy. You'll get a `*.vercel.app` URL — that's your dashboard,
   reachable from any device. It'll prompt for the login you created in
   step 1.4.

## What's next

- **Phase B** — Workout entry form, history, overload charts/suggestions
  (ports `tools/check_progressive_overload.py` and
  `tools/analyze_overload_trend.py`)
- **Phase C** — Nutrition entry form, macro charts (uses
  `meal_daily_totals` view)
- **Phase D** — Branding pass once your branding-direction doc arrives
