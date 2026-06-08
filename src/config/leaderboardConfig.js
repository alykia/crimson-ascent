// ---------------------------------------------------------------------------
// Online leaderboard config (Supabase) — the ONE place to paste backend values.
// ---------------------------------------------------------------------------
//
// This game is a static site (GitHub Pages). The leaderboard talks to Supabase's
// public REST API with the project's *public anon key* via fetch — no server of
// your own and no SDK dependency. The anon key is meant to be public; Row Level
// Security on the table is what protects the data.
//
// SECURITY: Only paste the PUBLIC values below (Project URL + anon/"public" key).
// NEVER paste the `service_role` / admin / secret key into frontend code or the
// repo — that key bypasses Row Level Security.
//
// Until both values are filled in, isOnlineLeaderboardConfigured() returns false
// and the game uses the localStorage leaderboard fallback automatically.
//
// Setup (do this once in your Supabase project):
//   1. Create a project at https://supabase.com
//   2. SQL editor -> run:
//        create table public.scores (
//          id bigint generated always as identity primary key,
//          player_name text not null,
//          category_key text not null,
//          category_label text not null,
//          time_ms integer not null,
//          formatted_time text not null,
//          created_at timestamptz not null default now()
//        );
//        alter table public.scores enable row level security;
//        create policy "public read"  on public.scores for select to anon using (true);
//        create policy "public insert" on public.scores for insert to anon with check (true);
//   3. Project Settings -> API: copy the Project URL and the anon/public key.
//   4. Paste them into SUPABASE_URL and SUPABASE_ANON_KEY below.
//   5. npm run build, push to GitHub Pages, finish a challenge, submit a name,
//      and confirm it shows up in the Ranking screen from another device.

// Paste your Supabase Project URL here, e.g. 'https://abcd1234.supabase.co'
// NOTE: base project URL only — the service appends '/rest/v1/<table>' itself.
export const SUPABASE_URL = 'https://unkwgnnzomocqugdgclg.supabase.co';

// Paste your Supabase anon/public key here (NOT the service_role key).
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVua3dnbm56b21vY3F1Z2RnY2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTY1NjksImV4cCI6MjA5NjQ5MjU2OX0.WNhk54IrqHmEglu8DCC38OogueL4ms9wXw0n_j9YELI';

// Table that stores leaderboard rows (matches the SQL above).
export const LEADERBOARD_TABLE = 'scores';

// Top-N entries shown per ranking category. Change this single value to show
// more/fewer ranked players.
export const LEADERBOARD_LIMIT = 10;

// How many rows to pull from the backend BEFORE collapsing to one best time per
// player (dedup-on-display). Must be comfortably larger than LEADERBOARD_LIMIT
// so duplicate rows for the same player can't push real players out of the top
// list before dedup runs. Raise it if your table grows very large.
export const LEADERBOARD_FETCH_LIMIT = 500;

// Max characters allowed for a submitted player name.
export const MAX_NAME_LENGTH = 12;

// True only when both public values are present. When false, the whole
// leaderboard transparently falls back to localStorage.
export function isOnlineLeaderboardConfigured() {
  return (
    typeof SUPABASE_URL === 'string' &&
    SUPABASE_URL.trim().length > 0 &&
    typeof SUPABASE_ANON_KEY === 'string' &&
    SUPABASE_ANON_KEY.trim().length > 0
  );
}
