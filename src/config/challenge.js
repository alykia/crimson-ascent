// Challenge Mode configuration: tunables, display text, and localStorage keys.
// Everything a designer is likely to tweak (ranking size, intro copy, category
// labels, which level each mode starts on) lives here so it is easy to find.

// How many ranking entries to keep per category. Change this to store more or
// fewer best times (e.g. top 5 vs top 10).
export const MAX_RANKING_ENTRIES = 10;

// The three challenge categories. Order drives the selection popup buttons and
// the ranking tabs. Keys are also the leaderboard category keys.
export const CHALLENGE_TYPES = Object.freeze(['level1', 'level2', 'fullGame']);

// Human-readable labels for each category.
export const CHALLENGE_LABELS = Object.freeze({
  level1: 'Level 1',
  level2: 'Level 2',
  fullGame: 'Full Game',
});

// Which level config each challenge type starts on. Level 1 and Full Game begin on
// Level 1; Level 2 jumps straight to the Level 2 spawn.
export const CHALLENGE_START_LEVEL = Object.freeze({
  level1: 'level1',
  level2: 'level2',
  fullGame: 'level1',
});

// Explanation shown in the Challenge Mode selection popup. Edit this string to
// change the wording the player sees.
export const CHALLENGE_INTRO_TEXT =
  'Complete the selected level as fast as possible. Your best times will be saved in the ranking.';

// localStorage keys: unlock flag, the "newly unlocked" flag (for the NEW badge),
// and one ranking list per category.
export const CHALLENGE_KEYS = Object.freeze({
  unlocked: 'challengeModeUnlocked',
  seen: 'challengeModeSeen',
  times: Object.freeze({
    level1: 'challengeTimes_level1',
    level2: 'challengeTimes_level2',
    fullGame: 'challengeTimes_fullGame',
  }),
});
