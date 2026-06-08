import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  LEADERBOARD_TABLE,
  LEADERBOARD_LIMIT,
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
//   { playerName, categoryKey, categoryLabel, timeMs, formattedTime, createdAt }

export { isOnlineLeaderboardConfigured };

// Human-readable label for a category key ('level1' -> 'Level 1', etc.).
export function getCategoryLabel(categoryKey) {
  return CHALLENGE_LABELS[categoryKey] || categoryKey || '';
}

// Formats milliseconds the same way the in-game timer does.
export function formatTime(ms) {
  return ChallengeMode.formatTime(ms);
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
  return {
    playerName: row.player_name ?? '',
    categoryKey: row.category_key ?? '',
    categoryLabel: row.category_label ?? getCategoryLabel(row.category_key),
    timeMs: Number(row.time_ms),
    formattedTime: row.formatted_time ?? formatTime(Number(row.time_ms)),
    createdAt: row.created_at ?? null,
  };
}

// Maps a local store entry ({ timeMs, name, date }) to the shared entry shape.
function localToEntry(categoryKey, entry) {
  return {
    playerName: entry.name ?? 'Anonymous',
    categoryKey,
    categoryLabel: getCategoryLabel(categoryKey),
    timeMs: entry.timeMs,
    formattedTime: formatTime(entry.timeMs),
    createdAt: entry.date ? new Date(entry.date).toISOString() : null,
  };
}

// ---- Submit -------------------------------------------------------------

// Records a finished run. Validates, then submits online when configured,
// otherwise locally. Returns { ok, online, error }.
//
// LATER: to dedupe to a single best time per name, query the existing row for
// (player_name, category_key) here and PATCH it when the new time is faster
// instead of inserting. For real anti-cheat / identity, add accounts/auth
// (Supabase Auth) and validate times server-side — a frontend-only leaderboard
// can be spoofed by a determined player.
export async function submitScore(categoryKey, playerName, timeMs) {
  const valid = validateScore(categoryKey, playerName, timeMs);
  if (!valid.ok) return { ok: false, online: false, error: valid.error };

  const name = playerName.trim();
  if (isOnlineLeaderboardConfigured()) {
    return submitScoreOnline(categoryKey, name, timeMs);
  }
  return submitScoreLocal(categoryKey, name, timeMs);
}

export async function submitScoreOnline(categoryKey, playerName, timeMs) {
  const row = {
    player_name: playerName,
    category_key: categoryKey,
    category_label: getCategoryLabel(categoryKey),
    time_ms: Math.round(timeMs),
    formatted_time: formatTime(timeMs),
  };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${LEADERBOARD_TABLE}`, {
      method: 'POST',
      headers: supabaseHeaders({
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      }),
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      return { ok: false, online: true, error: `Submit failed (${res.status}).` };
    }
    // Keep a local copy too, so the player still sees their time offline.
    submitScoreLocal(categoryKey, playerName, timeMs);
    return { ok: true, online: true };
  } catch {
    return { ok: false, online: true, error: 'Network error. Please try again.' };
  }
}

export function submitScoreLocal(categoryKey, playerName, timeMs) {
  saveChallengeTime(categoryKey, timeMs, playerName);
  return { ok: true, online: false };
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
  const params = new URLSearchParams({
    select: 'player_name,category_key,category_label,time_ms,formatted_time,created_at',
    category_key: `eq.${categoryKey}`,
    order: 'time_ms.asc',
    limit: String(limit),
  });
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${LEADERBOARD_TABLE}?${params.toString()}`,
    { headers: supabaseHeaders({ Accept: 'application/json' }) }
  );
  if (!res.ok) throw new Error(`Fetch failed (${res.status}).`);
  const rows = await res.json();
  if (!Array.isArray(rows)) return [];
  return rows.map(rowToEntry);
}

export function getScoresLocal(categoryKey, limit = LEADERBOARD_LIMIT) {
  return getChallengeTimes(categoryKey)
    .slice(0, limit)
    .map((entry) => localToEntry(categoryKey, entry));
}
