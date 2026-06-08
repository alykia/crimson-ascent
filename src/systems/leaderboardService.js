import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  LEADERBOARD_TABLE,
  LEADERBOARD_LIMIT,
  LEADERBOARD_FETCH_LIMIT,
  MAX_NAME_LENGTH,
  isOnlineLeaderboardConfigured,
} from '../config/leaderboardConfig.js';
import { CHALLENGE_TYPES, CHALLENGE_LABELS } from '../config/challenge.js';
import { ChallengeMode } from './ChallengeMode.js';
import {
  saveChallengeTime,
  getChallengeTimes,
  getBestTime,
} from './ChallengeLeaderboard.js';

// Single seam between gameplay/UI and where leaderboard scores live. When a
// Supabase URL + anon key are configured (see config/leaderboardConfig.js) the
// online path is used; otherwise everything falls back to the localStorage
// store in ChallengeLeaderboard.js. The rest of the game only ever talks to this
// module, so swapping/extending the backend stays contained here.
//
// Entry shape returned everywhere:
//   { playerName, normalizedPlayerName, categoryKey, categoryLabel,
//     timeMs, formattedTime, createdAt, updatedAt }

export { isOnlineLeaderboardConfigured };

// ---- Player-name matching -------------------------------------------------
// Single switch for how player names are matched across the leaderboard. When
// true, "Luna", "luna", and " LUNA " all count as the SAME player. Set to false
// to make names case-sensitive (only the trim is then applied).
export const CASE_INSENSITIVE_NAMES = true;

// Canonical key used to decide whether two submissions belong to the same
// player. Always trimmed; lowercased when CASE_INSENSITIVE_NAMES is true. This
// is the value we group/dedupe by — it is NOT what gets displayed (the original
// submitted spelling is shown).
export function normalizeName(name) {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  return CASE_INSENSITIVE_NAMES ? trimmed.toLowerCase() : trimmed;
}

// Human-readable label for a category key ('level1' -> 'Level 1', etc.).
export function getCategoryLabel(categoryKey) {
  return CHALLENGE_LABELS[categoryKey] || categoryKey || '';
}

// Formats milliseconds the same way the in-game timer does.
export function formatTime(ms) {
  return ChallengeMode.formatTime(ms);
}

// Collapses a list of entries to one row per player (by normalizedPlayerName),
// keeping each player's fastest time (ties broken by the earliest createdAt).
// Returns a new array sorted fastest-first. This is the safety net that hides
// any duplicate rows that already exist in the backend, online or local.
//
// The kept entry's `playerName` is the spelling attached to that fastest row.
// Once the optional Supabase UPDATE migration is applied, a player's single row
// carries their most recently submitted spelling; without it, the fastest row's
// spelling is shown. To always prefer the most recent spelling instead, pick the
// name from the entry with the latest createdAt here.
export function dedupeBestPerPlayer(entries) {
  const best = new Map();
  for (const entry of entries) {
    if (!entry || !Number.isFinite(entry.timeMs)) continue;
    const key = entry.normalizedPlayerName || normalizeName(entry.playerName);
    const current = best.get(key);
    if (!current) {
      best.set(key, entry);
      continue;
    }
    if (entry.timeMs < current.timeMs) {
      best.set(key, entry);
    } else if (entry.timeMs === current.timeMs) {
      // Tie: keep the earliest submission for a stable order.
      const a = Date.parse(entry.createdAt ?? '') || Infinity;
      const b = Date.parse(current.createdAt ?? '') || Infinity;
      if (a < b) best.set(key, entry);
    }
  }
  return Array.from(best.values()).sort((a, b) => a.timeMs - b.timeMs);
}

// Fastest local time for a category (or null). Used by the completion popup's
// "best" line so it shows instantly without a network round-trip.
export function getLocalBest(categoryKey) {
  return getBestTime(categoryKey);
}

// Validates a score before submit. Returns { ok, error }.
export function validateScore(categoryKey, playerName, timeMs) {
  if (!CHALLENGE_TYPES.includes(categoryKey)) {
    return { ok: false, error: 'Unknown challenge category.' };
  }
  if (!Number.isFinite(timeMs) || timeMs <= 0) {
    return { ok: false, error: 'Invalid time.' };
  }
  const name = typeof playerName === 'string' ? playerName.trim() : '';
  if (!name) {
    return { ok: false, error: 'Please enter a name.' };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` };
  }
  return { ok: true };
}

// Builds the headers Supabase's REST API expects for anon access.
function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  };
}

// Maps a Supabase row (snake_case) to the shared entry shape.
function rowToEntry(row) {
  const playerName = row.player_name ?? '';
  return {
    playerName,
    normalizedPlayerName: normalizeName(playerName),
    categoryKey: row.category_key ?? '',
    categoryLabel: row.category_label ?? getCategoryLabel(row.category_key),
    timeMs: Number(row.time_ms),
    formattedTime: row.formatted_time ?? formatTime(Number(row.time_ms)),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

// Maps a local store entry ({ timeMs, name, date }) to the shared entry shape.
function localToEntry(categoryKey, entry) {
  const playerName = entry.name ?? 'Anonymous';
  const createdAt = entry.date ? new Date(entry.date).toISOString() : null;
  return {
    playerName,
    normalizedPlayerName: normalizeName(playerName),
    categoryKey,
    categoryLabel: getCategoryLabel(categoryKey),
    timeMs: entry.timeMs,
    formattedTime: formatTime(entry.timeMs),
    createdAt,
    updatedAt: createdAt,
  };
}

// ---- Submit -------------------------------------------------------------

// Records a finished run. Validates, then submits online when configured,
// otherwise locally. Returns { ok, online, status, error } where status is one
// of 'created' (first time for this player+category), 'improved' (replaced a
// slower time), or 'kept' (existing time was faster/equal, nothing changed).
//
// LATER: for real anti-cheat / identity, add accounts/auth (Supabase Auth) and
// validate times server-side — a frontend-only leaderboard can be spoofed by a
// determined player. The best-time-per-name dedupe lives in submitScoreOnline
// (online) and saveChallengeTime (local).
export async function submitScore(categoryKey, playerName, timeMs) {
  const valid = validateScore(categoryKey, playerName, timeMs);
  if (!valid.ok) return { ok: false, online: false, error: valid.error };

  const name = playerName.trim();
  if (isOnlineLeaderboardConfigured()) {
    return submitScoreOnline(categoryKey, name, timeMs);
  }
  return submitScoreLocal(categoryKey, name, timeMs);
}

// Inserts a brand-new row. Used both for first-time submissions and as the
// graceful fallback when an UPDATE isn't permitted (pre-migration).
async function insertScoreRow(categoryKey, playerName, timeMs) {
  const row = {
    player_name: playerName,
    category_key: categoryKey,
    category_label: getCategoryLabel(categoryKey),
    time_ms: Math.round(timeMs),
    formatted_time: formatTime(timeMs),
  };
  return fetch(`${SUPABASE_URL}/rest/v1/${LEADERBOARD_TABLE}`, {
    method: 'POST',
    headers: supabaseHeaders({
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }),
    body: JSON.stringify(row),
  });
}

// Read-modify-write: find this player's existing row for the category, then
// insert / replace / keep depending on the new time. Best-time-per-player is
// enforced here for the online store.
export async function submitScoreOnline(categoryKey, playerName, timeMs) {
  const newMs = Math.round(timeMs);
  try {
    // 1. Find existing rows for this player (case-insensitive via ilike, with a
    //    JS normalize() re-check so trimming/casing rules always agree).
    const norm = normalizeName(playerName);
    const findParams = new URLSearchParams({
      select: 'id,player_name,time_ms',
      category_key: `eq.${categoryKey}`,
      player_name: `ilike.${playerName}`,
    });
    const findRes = await fetch(
      `${SUPABASE_URL}/rest/v1/${LEADERBOARD_TABLE}?${findParams.toString()}`,
      { headers: supabaseHeaders({ Accept: 'application/json' }) }
    );
    if (!findRes.ok) throw new Error(`Lookup failed (${findRes.status}).`);
    const rows = await findRes.json();
    const mine = Array.isArray(rows)
      ? rows.filter((r) => normalizeName(r.player_name) === norm && Number.isFinite(Number(r.time_ms)))
      : [];

    // 2. No existing row -> insert.
    if (!mine.length) {
      const res = await insertScoreRow(categoryKey, playerName, timeMs);
      if (!res.ok) return { ok: false, online: true, error: `Submit failed (${res.status}).` };
      submitScoreLocal(categoryKey, playerName, timeMs);
      return { ok: true, online: true, status: 'created' };
    }

    // 3. Existing row(s): compare against the player's current best.
    const bestRow = mine.reduce((a, b) => (Number(b.time_ms) < Number(a.time_ms) ? b : a));
    if (newMs >= Number(bestRow.time_ms)) {
      // Slower or equal -> keep the existing best, write nothing.
      submitScoreLocal(categoryKey, playerName, timeMs);
      return { ok: true, online: true, status: 'kept' };
    }

    // 4. Faster -> replace the existing best row (PATCH). If UPDATE isn't
    //    permitted (no policy / column missing pre-migration), fall back to an
    //    insert so the run still records; dedup-on-display hides the slower row.
    const patchParams = new URLSearchParams({ id: `eq.${bestRow.id}` });
    const patchBody = {
      player_name: playerName,
      time_ms: newMs,
      formatted_time: formatTime(timeMs),
      updated_at: new Date().toISOString(),
    };
    const patchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/${LEADERBOARD_TABLE}?${patchParams.toString()}`,
      {
        method: 'PATCH',
        headers: supabaseHeaders({
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        }),
        body: JSON.stringify(patchBody),
      }
    );
    if (!patchRes.ok) {
      const res = await insertScoreRow(categoryKey, playerName, timeMs);
      if (!res.ok) return { ok: false, online: true, error: `Submit failed (${res.status}).` };
    }
    submitScoreLocal(categoryKey, playerName, timeMs);
    return { ok: true, online: true, status: 'improved' };
  } catch {
    return { ok: false, online: true, error: 'Network error. Please try again.' };
  }
}

export function submitScoreLocal(categoryKey, playerName, timeMs) {
  const { status } = saveChallengeTime(categoryKey, timeMs, playerName);
  return { ok: true, online: false, status: status || 'created' };
}

// ---- Read ---------------------------------------------------------------

// Top scores for a category, fastest-first. Online when configured, falling
// back to local on any failure. Returns { entries, source, error? } so the UI
// can show a fallback banner.
export async function getScores(categoryKey) {
  return getBestScores(categoryKey, LEADERBOARD_LIMIT);
}

export async function getBestScores(categoryKey, limit = LEADERBOARD_LIMIT) {
  if (isOnlineLeaderboardConfigured()) {
    try {
      const entries = await getScoresOnline(categoryKey, limit);
      return { entries, source: 'online' };
    } catch {
      return {
        entries: getScoresLocal(categoryKey, limit),
        source: 'local',
        error: 'online-failed',
      };
    }
  }
  return { entries: getScoresLocal(categoryKey, limit), source: 'local' };
}

export async function getScoresOnline(categoryKey, limit = LEADERBOARD_LIMIT) {
  // Pull more rows than we display (LEADERBOARD_FETCH_LIMIT) so dedupe-by-player
  // sees every duplicate before collapsing to one best time each. `updated_at`
  // is requested but tolerated-missing (pre-migration) via `??` in rowToEntry.
  const params = new URLSearchParams({
    select: 'player_name,category_key,category_label,time_ms,formatted_time,created_at,updated_at',
    category_key: `eq.${categoryKey}`,
    order: 'time_ms.asc',
    limit: String(LEADERBOARD_FETCH_LIMIT),
  });
  let res = await fetch(
    `${SUPABASE_URL}/rest/v1/${LEADERBOARD_TABLE}?${params.toString()}`,
    { headers: supabaseHeaders({ Accept: 'application/json' }) }
  );
  // If the optional `updated_at` column doesn't exist yet, retry without it so
  // the leaderboard keeps working before the migration is applied.
  if (!res.ok) {
    params.set(
      'select',
      'player_name,category_key,category_label,time_ms,formatted_time,created_at'
    );
    res = await fetch(
      `${SUPABASE_URL}/rest/v1/${LEADERBOARD_TABLE}?${params.toString()}`,
      { headers: supabaseHeaders({ Accept: 'application/json' }) }
    );
  }
  if (!res.ok) throw new Error(`Fetch failed (${res.status}).`);
  const rows = await res.json();
  if (!Array.isArray(rows)) return [];
  const entries = rows.map(rowToEntry);
  return dedupeBestPerPlayer(entries).slice(0, limit);
}

export function getScoresLocal(categoryKey, limit = LEADERBOARD_LIMIT) {
  const entries = getChallengeTimes(categoryKey).map((entry) =>
    localToEntry(categoryKey, entry)
  );
  return dedupeBestPerPlayer(entries).slice(0, limit);
}
