import { MAX_RANKING_ENTRIES, CHALLENGE_KEYS } from '../config/challenge.js';

// Local leaderboard backed by localStorage. This module is the single seam
// between the game and where times are stored. To move to an online leaderboard
// later, implement the network calls inside `submitChallengeTime` /
// `fetchOnlineTimes` and leave the rest of the game untouched.
//
// Each stored entry is { timeMs, name, date }. `name` is null for now
// (anonymous) — it exists so player names can be added later without changing
// the storage shape (see the optional `name` argument below).

function storageKey(category) {
  return CHALLENGE_KEYS.times[category] || null;
}

// Returns the stored entries for a category, sorted fastest-first.
export function getChallengeTimes(category) {
  const key = storageKey(category);
  if (!key) return [];
  try {
    const raw = window.localStorage?.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && Number.isFinite(e.timeMs))
      .sort((a, b) => a.timeMs - b.timeMs);
  } catch {
    return [];
  }
}

// Fastest recorded time for a category, or null if none.
export function getBestTime(category) {
  const times = getChallengeTimes(category);
  return times.length ? times[0].timeMs : null;
}

// Records a finished run locally: inserts the entry, sorts fastest-first, trims
// to MAX_RANKING_ENTRIES, and persists. Returns { rank, isNewBest } where rank
// is 1-based (or -1 if the time didn't make the table).
export function saveChallengeTime(category, timeMs, name = null) {
  const key = storageKey(category);
  if (!key || !Number.isFinite(timeMs)) return { rank: -1, isNewBest: false };

  const prevBest = getBestTime(category);
  const entry = { timeMs: Math.round(timeMs), name: name ?? null, date: Date.now() };

  const times = getChallengeTimes(category);
  times.push(entry);
  times.sort((a, b) => a.timeMs - b.timeMs);
  const trimmed = times.slice(0, MAX_RANKING_ENTRIES);

  try {
    window.localStorage?.setItem(key, JSON.stringify(trimmed));
  } catch {
    // Persistence is best-effort (private browsing / storage limits).
  }

  const rank = trimmed.indexOf(entry) + 1; // 0 means trimmed out -> sentinel -1
  const isNewBest = prevBest === null || entry.timeMs < prevBest;
  return { rank: rank || -1, isNewBest };
}

// Clears one category's ranking (handy for a future "reset times" button).
export function clearChallengeTimes(category) {
  const key = storageKey(category);
  if (!key) return;
  try {
    window.localStorage?.removeItem(key);
  } catch {
    // ignore
  }
}

// ---- Future online leaderboard seam --------------------------------------
// Today this only records the time locally. When an online backend exists, POST
// the result here and keep the local save as an offline fallback. This is the
// function gameplay calls on completion, so swapping it is the only change
// needed to go online.
export function submitChallengeTime(category, timeMs, name = null) {
  const result = saveChallengeTime(category, timeMs, name);
  // TODO (online leaderboard): POST the result to the backend here, e.g.
  //   fetch('/api/leaderboard', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ category, timeMs: Math.round(timeMs), name }),
  //   }).catch(() => { /* offline: local save above already kept it */ });
  return result;
}

// Placeholder for fetching an online ranking. Returns the local times for now;
// swap the body for a real request later (the UI already treats this as async).
export async function fetchOnlineTimes(category) {
  // TODO (online leaderboard):
  //   const res = await fetch(`/api/leaderboard/${category}`);
  //   return await res.json();
  return getChallengeTimes(category);
}
