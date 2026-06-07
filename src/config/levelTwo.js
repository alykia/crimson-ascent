// Crimson Ascent — LEVEL 2 (harder, longer climb).
//
// Same coordinate system and object types as Level 1 (see level.js for the
// full schema + physics reachability budget — physics is UNCHANGED here).
//
// LEVEL 2 design goals (DEMO-FRIENDLY pass — still the longer climb, but now
// readable and forgiving so a first-time player can reach the dragon):
//   - Long climb (summit boss arena ≈ y64) but with wide (w≈5) platforms,
//     2.0-unit steps, and gaps the player never has to "send" blindly.
//   - Short wall-jump chimneys (≈3 tall) with wide entry/exit shelves.
//   - Only TWO falling spikes, parked OFF the main path (x ±5.5) over their
//     own side ledges with a long warning window.
//   - Same enemy types (walker / archer / flyer) on readable side perches,
//     never right after a hard jump.
//   - MANY checkpoints (≈8) — before every section/hazard and the arena.
//   - Keeps the level2 sprite set + alternating variants/sizes (visuals intact).
//
// HOW TO TUNE DIFFICULTY LATER:
//   - Easier: add checkpoints, widen platforms (bigger w), shrink gaps,
//     raise spike `triggerH` (earlier warning), remove enemies.
//   - Harder: remove checkpoints, narrow platforms, widen gaps, add spikes
//     and enemies, raise chimney height.

import backgroundLevel2Url from '../assets/T_Background2_sprite.png';
import level2MusicUrl from '../assets/audio/music/gothic_torque.mp3';
import bossMusicUrl from '../assets/audio/music/cursed_riffblood.mp3';

const FLOOR_Y   = -1;
const LEFT_X    = -13;
const RIGHT_X   =  13;
const LEVEL_TOP =  72;

export const LEVEL_TWO = {
  id: 'level2',
  name: 'level2',
  title: 'Ascent — Trial 2',
  spawn: { x: 0, y: 2 },
  nextLevelId: null, // last level for now; entering the door returns to menu
  platformSpriteSet: 'level2',

  // ---- Background: Level 2 cathedral sprite. ----
  // Replace this import/path later if you provide another final Level 2 PNG.
  background: { url: backgroundLevel2Url, aspect: 576 / 1024 },

  // ---- Music: "Gothic Torque" (looping). Swap the imported file to change it. ----
  music: { url: level2MusicUrl, volume: 1.0 },

  // ---- Boss theme: "Cursed Riffblood" (looping). Plays only during the boss
  // fight (started by Boss._activate, stopped on defeat/death). Swap the
  // imported file above to replace it. ----
  bossMusic: { url: bossMusicUrl, volume: 1.0 },

  objects: [
    // ---- Global bounds ----
    { type: 'platform', x: 0, y: FLOOR_Y, w: 26, h: 1, spriteVariant: 'groundfloor' },
    { type: 'wall', x: LEFT_X,  y: LEVEL_TOP / 2, w: 1, h: LEVEL_TOP },
    { type: 'wall', x: RIGHT_X, y: LEVEL_TOP / 2, w: 1, h: LEVEL_TOP },

    // =============================================================
    // SECTION 1 — OPEN OPENER  (y 2 - 11)
    // Wide (w5) alternating terraces, 2.0 steps, overlapping in x. A walker on
    // a wide hub teaches the dash. Two early checkpoints.
    // =============================================================
    { type: 'platform', x: -4, y: 2.4, w: 5,   h: 0.5, spriteVariant: 'platform1' },
    { type: 'platform', x:  2, y: 4.4, w: 5,   h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'checkpoint', x: 2, y: 5.2 },
    { type: 'platform', x: -3, y: 6.4, w: 5.5, h: 0.5, spriteVariant: 'platform3' },
    { type: 'platform', x:  3, y: 8.4, w: 5,   h: 0.5, spriteVariant: 'platform1', spriteFlipX: true },
    { type: 'platform', x: -3, y: 10.4, w: 6,  h: 0.5, spriteVariant: 'platform2' },
    { type: 'walker',   x: -3, y: 11.4, dir: 1 },
    { type: 'checkpoint', x: -3, y: 11.2 },

    // =============================================================
    // SECTION 2 — SHORT WALL-JUMP CHIMNEY  (y 12 - 16)
    // 3.2-tall chimney with a wide entry shelf and a wide top shelf. A slow
    // flyer hovers nearby but does not crowd the climb.
    // =============================================================
    { type: 'platform', x: 2, y: 12.4, w: 5, h: 0.5, spriteVariant: 'platform3' },
    { type: 'wall', x: -0.4, y: 14.0, w: 0.6, h: 3.2 },
    { type: 'wall', x:  2.4, y: 14.0, w: 0.6, h: 3.2 },
    { type: 'flyer', x: 1, y: 14.5, range: 1.0 },
    { type: 'platform', x: 0, y: 15.8, w: 6, h: 0.5, spriteVariant: 'platform1' },
    { type: 'checkpoint', x: 0, y: 16.6 },

    // =============================================================
    // SECTION 3 — DASH STAIRCASE  (y 16 - 26)
    // Gentle 2.0 staircase with a walker dash-target on a wide ledge. No gaps
    // over hazards. Checkpoint mid-section.
    // =============================================================
    { type: 'platform', x:  4, y: 17.8, w: 5,   h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'platform', x: -2, y: 19.8, w: 5.5, h: 0.5, spriteVariant: 'platform3' },
    { type: 'platform', x:  3, y: 21.8, w: 5,   h: 0.5, spriteVariant: 'platform1' },
    { type: 'walker',   x:  3, y: 22.8, dir: -1 },
    { type: 'checkpoint', x: 3, y: 22.6 },
    { type: 'platform', x: -3, y: 23.8, w: 5.5, h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'platform', x:  2, y: 25.8, w: 5,   h: 0.5, spriteVariant: 'platform3' },

    // =============================================================
    // SECTION 4 — READABLE SPIKES  (y 26 - 35)
    // TWO spikes parked OFF the central climb (x ±5.5) over their own side
    // ledges, long warning (triggerH 5). The straight-up path (x ≈ 0) never
    // passes under a spike. Checkpoint right before.
    // =============================================================
    { type: 'platform', x: 0, y: 27.6, w: 6.5, h: 0.5, spriteVariant: 'platform1' },
    { type: 'checkpoint', x: 0, y: 28.4 },
    { type: 'platform', x: -5.5, y: 31.5, w: 3, h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'spike',    x: -5.5, y: 35, w: 1, h: 1, triggerH: 5 },
    { type: 'platform', x:  5.5, y: 33.5, w: 3, h: 0.5, spriteVariant: 'platform3' },
    { type: 'spike',    x:  5.5, y: 37, w: 1, h: 1, triggerH: 5 },
    { type: 'platform', x:  0, y: 29.6, w: 6, h: 0.5, spriteVariant: 'platform3' },
    { type: 'platform', x:  1, y: 31.6, w: 6, h: 0.5, spriteVariant: 'platform1', spriteFlipX: true },
    { type: 'platform', x: -1, y: 33.6, w: 6, h: 0.5, spriteVariant: 'platform2' },

    // =============================================================
    // SECTION 5 — COMBINED (READABLE)  (y 35 - 48)
    // A short chimney, an ammo refill + walker hub, and an archer on an
    // optional side perch. Two checkpoints keep it low-stakes.
    // =============================================================
    { type: 'platform', x: 3, y: 35.6, w: 5, h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'checkpoint', x: 3, y: 36.4 },
    { type: 'platform', x: -2, y: 37.6, w: 5.5, h: 0.5, spriteVariant: 'platform3' },
    { type: 'wall', x: -4.4, y: 39.4, w: 0.6, h: 3.0 },
    { type: 'wall', x: -1.6, y: 39.4, w: 0.6, h: 3.0 },
    { type: 'flyer', x: -3, y: 39, range: 1.0 },
    { type: 'platform', x: -3, y: 41.4, w: 6, h: 0.5, spriteVariant: 'platform1' },
    { type: 'checkpoint', x: -3, y: 42.2 },
    { type: 'platform', x: 2, y: 43.2, w: 5.5, h: 0.5, spriteVariant: 'platform2' },
    { type: 'arrowPickup', x: 2, y: 44.1, amount: 3 },
    { type: 'walker',      x: 2, y: 44.2, dir: 1 },
    { type: 'platform', x: 6, y: 43.4, w: 4, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'archer',   x: 6, y: 44.4, dir: -1 },
    { type: 'platform', x: -2, y: 45.2, w: 5.5, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'platform', x:  2, y: 47.0, w: 5, h: 0.5, spriteVariant: 'platform1' },
    { type: 'checkpoint', x: 2, y: 47.8 },

    // =============================================================
    // SECTION 6 — FINAL ASCENT TO THE BOSS ARENA  (y 48 - 64)
    // A clean alternating staircase (2.0 steps, w5) leads up to a WIDE summit
    // arena where the dragon waits.
    //
    // ARENA NOTES (edit here):
    //   - The arena platform is wide (w:25) and centered (x:0). Its top surface
    //     is groundY = y + h/2 = 62.6. Boss combat happens on this surface.
    //   - It deliberately does NOT reach the side walls (LEFT_X -13 / RIGHT_X 13),
    //     so there are fall-off gaps on both sides: a missed dodge can drop you
    //     into the pit (you respawn at the arena checkpoint, boss resets).
    //   - NO spikes on the arena — the only threat is the boss.
    //   - The boss object carries `activateAtY` (fight starts when the player
    //     reaches the arena) and `arena { minX, maxX, groundY }` (its movement
    //     bounds + the slam/ground height). All boss difficulty lives in the
    //     BOSS block of src/config/constants.js.
    // =============================================================
    { type: 'platform', x: -2, y: 49.0, w: 5,   h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x:  2, y: 51.0, w: 5,   h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'platform', x: -2, y: 53.0, w: 5,   h: 0.5, spriteVariant: 'platform1' },
    { type: 'platform', x:  2, y: 55.0, w: 5,   h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'checkpoint', x: 2, y: 55.8 },
    { type: 'platform', x: -1, y: 57.0, w: 5.5, h: 0.5, spriteVariant: 'platform3' },
    { type: 'platform', x:  2, y: 59.0, w: 5,   h: 0.5, spriteVariant: 'platform1', spriteFlipX: true },
    { type: 'platform', x: -1, y: 61.0, w: 5.5, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x: -6.5, y: 61.6, w: 4, h: 0.5, spriteVariant: 'platform3' },
    { type: 'platform', x: -10.2, y: 62.0, w: 3.8, h: 0.5, spriteVariant: 'platform2' },

    // ---- WIDE BOSS ARENA (summit) ----
    // One-way deck: the player jumps UP through it from the staircase below and
    // lands on top; it is solid only from above (see Physics.moveAndCollide).
    { type: 'platform', x: 0, y: 62.0, w: 25, h: 1.2, spriteVariant: 'bossPlatform', oneWay: true },
    { type: 'checkpoint', x: -9.5, y: 63.0 },
    {
      type: 'boss',
      x: 0,
      y: 63.7,
      activateAtY: 62.6,
      arena: { minX: -12.5, maxX: 12.5, groundY: 62.6 },
    },
  ],
};
