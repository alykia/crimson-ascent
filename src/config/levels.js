import { LEVEL } from './level.js';
import { ZOO_LEVEL } from './levelZoo.js';

export const LEVELS = Object.freeze({
  campaign: LEVEL,
  zoo: ZOO_LEVEL,
});

export function getLevelById(levelId) {
  return LEVELS[levelId] || LEVELS.campaign;
}
