import { LEVEL } from './level.js';
import { LEVEL_TWO } from './levelTwo.js';
import { ZOO_LEVEL } from './levelZoo.js';

// Campaign progression order. `nextLevelId` on each level config drives the
// door-exit transition (level1 -> level2 -> menu).
export const LEVELS = Object.freeze({
  level1: LEVEL,
  level2: LEVEL_TWO,
  zoo: ZOO_LEVEL,
});

// First level loaded when starting the campaign.
export const FIRST_LEVEL_ID = 'level1';

export function getLevelById(levelId) {
  return LEVELS[levelId] || LEVELS[FIRST_LEVEL_ID];
}
