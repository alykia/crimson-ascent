// Crimson Ascent — LEVEL 2 (harder, longer climb).
//
// Same coordinate system and object types as Level 1 (see level.js for the
// full schema + physics reachability budget — physics is UNCHANGED here).
//
// LEVEL 2 design goals:
//   - Longer climb (summit ≈ y68 vs Level 1's ≈ y49).
//   - Tighter, narrower platforms and bigger gaps -> more precise dashes.
//   - Taller wall-jump chimneys harassed by flyers.
//   - More spikes, arranged as zig-zag gauntlets.
//   - More enemies (walker / archer / flyer — same types as Level 1).
//   - FEWER checkpoints (3 here vs 6 in Level 1) so it stays demanding.
//   - Still fair and beatable, not impossible.
//
// HOW TO TUNE DIFFICULTY LATER:
//   - Easier: add checkpoints, widen platforms (bigger w), shrink gaps,
//     lower spike `triggerH`, remove enemies.
//   - Harder: remove checkpoints, narrow platforms, widen gaps, add spikes
//     and enemies, raise chimney height.

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

  // ---- Background: PLAIN PLACEHOLDER (solid color) ----
  // The final Level 2 backdrop is not ready yet. To swap it in later:
  //   1. Drop the PNG into src/assets/ (e.g. T_Background2_Sprite.png)
  //   2. At the top of this file add:  import bg2 from '../assets/T_Background2_Sprite.png';
  //   3. Replace the line below with:  background: { url: bg2, aspect: <imgW/imgH> },
  background: { color: 0x141022 },

  // ---- Music: own slot, none wired yet. ----
  // To add Level 2 music: drop an .mp3/.ogg into src/assets/, import it, then
  //   music: { url: level2MusicUrl, volume: 0.6 },
  music: { url: null, volume: 0.6 },

  objects: [
    // ---- Global bounds ----
    { type: 'platform', x: 0, y: FLOOR_Y, w: 26, h: 1, spriteVariant: 'groundfloor' },
    { type: 'wall', x: LEFT_X,  y: LEVEL_TOP / 2, w: 1, h: LEVEL_TOP },
    { type: 'wall', x: RIGHT_X, y: LEVEL_TOP / 2, w: 1, h: LEVEL_TOP },

    // =============================================================
    // SECTION 1 — PRECISION OPENER  (y 2 - 12)
    // Narrow alternating platforms with bigger horizontal swings, a spike to
    // punish camping, and a walker. First (and only early) checkpoint sits a
    // bit higher than in Level 1.
    // =============================================================
    { type: 'platform', x: -4, y: 2.2, w: 3,   h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x:  4, y: 4.4, w: 2.6, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'platform', x: -5, y: 6.6, w: 2.4, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x:  3, y: 8.8, w: 2.4, h: 0.5, spriteVariant: 'platform3' },
    { type: 'spike',    x:  3, y: 12, w: 1, h: 1, triggerH: 5 },
    { type: 'platform', x: -3, y: 11.0, w: 2.6, h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'walker',   x: -3, y: 12.0, dir: 1 },
    { type: 'checkpoint', x: -3, y: 11.95 },

    // =============================================================
    // SECTION 2 — TALL WALL-JUMP CHIMNEY  (y 12 - 22)
    // 6-unit chimney (near full stamina) with a flyer crowding the climb.
    // =============================================================
    { type: 'platform', x: 3, y: 13.5, w: 3, h: 0.5, spriteVariant: 'platform1' },
    { type: 'wall', x: 0.6, y: 18, w: 0.6, h: 6 },
    { type: 'wall', x: 3.4, y: 18, w: 0.6, h: 6 },
    { type: 'flyer', x: 2, y: 17, range: 1.0 },
    { type: 'platform', x: 2, y: 21.5, w: 2.6, h: 0.5, spriteVariant: 'platform3' },

    // =============================================================
    // SECTION 3 — DASH GAUNTLET  (y 22 - 32)
    // Walker dash-refresh target, then long left/right gaps over spikes.
    // Mid checkpoint at the top of the section.
    // =============================================================
    { type: 'platform', x: 2, y: 23.0, w: 2.6, h: 0.5, spriteVariant: 'platform1', spriteFlipX: true },
    { type: 'walker',   x: 2, y: 24.0, dir: -1 },
    { type: 'platform', x:  9, y: 24.5, w: 2.4, h: 0.5, spriteVariant: 'platform2' },
    { type: 'spike',    x:  9, y: 29, w: 1, h: 1, triggerH: 5 },
    { type: 'platform', x: -7, y: 26.0, w: 2.4, h: 0.5, spriteVariant: 'platform3' },
    { type: 'archer',   x: -7, y: 27.0, dir: 1 },
    { type: 'platform', x: -2, y: 28.0, w: 2.6, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x:  4, y: 30.0, w: 3,   h: 0.5, spriteVariant: 'platform1' },
    { type: 'checkpoint', x: 4, y: 30.95 },

    // =============================================================
    // SECTION 4 — SPIKE ZIG-ZAG  (y 32 - 44)
    // Four spike columns over narrow stepping platforms, with a flyer
    // sweeping the middle. No checkpoint here — commit and keep moving.
    // =============================================================
    { type: 'platform', x: -4, y: 33.5, w: 2.4, h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'spike',    x: -4, y: 38, w: 1, h: 1, triggerH: 5 },
    { type: 'platform', x:  3, y: 35.5, w: 2.4, h: 0.5, spriteVariant: 'platform3' },
    { type: 'spike',    x:  3, y: 40, w: 1, h: 1, triggerH: 5 },
    { type: 'platform', x: -3, y: 37.5, w: 2.4, h: 0.5, spriteVariant: 'platform2' },
    { type: 'spike',    x: -3, y: 42, w: 1, h: 1, triggerH: 5 },
    { type: 'platform', x:  4, y: 39.5, w: 2.4, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'spike',    x:  4, y: 44, w: 1, h: 1, triggerH: 4 },
    { type: 'flyer',    x: 0, y: 40, range: 3 },
    { type: 'platform', x: -2, y: 41.5, w: 2.6, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x:  3, y: 43.5, w: 3,   h: 0.5, spriteVariant: 'platform1' },

    // =============================================================
    // SECTION 5 — COMBINED HARD  (y 44 - 56)
    // Chimney + flyer + archer, an ammo refill + walker hub, then a long
    // dash over a spike. Last checkpoint near the top.
    // =============================================================
    { type: 'platform', x: 3, y: 45.0, w: 3, h: 0.5, spriteVariant: 'platform1' },
    { type: 'wall', x: 0.8, y: 49, w: 0.6, h: 5 },
    { type: 'wall', x: 3.6, y: 49, w: 0.6, h: 5 },
    { type: 'flyer',  x: 2.2, y: 48, range: 1.2 },
    { type: 'platform', x: 6, y: 46.0, w: 2.4, h: 0.5, spriteVariant: 'platform3' },
    { type: 'archer',   x: 6, y: 47.0, dir: -1 },
    { type: 'platform', x: 2.2, y: 52.0, w: 2.6, h: 0.5, spriteVariant: 'platform2' },
    { type: 'arrowPickup', x: 2.2, y: 53.0, amount: 3 },
    { type: 'walker',      x: 2.2, y: 53.0, dir: 1 },
    { type: 'platform', x: -5, y: 53.5, w: 2.4, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'spike',    x: -5, y: 58, w: 1, h: 1, triggerH: 4 },
    { type: 'platform', x: 2, y: 55.5, w: 3, h: 0.5, spriteVariant: 'platform1' },
    { type: 'checkpoint', x: 2, y: 56.45 },

    // =============================================================
    // SECTION 6 — FINAL ASCENT + EXIT  (y 56 - 68)
    // Tight chimney with a flyer, a spike near the summit, an archer guarding
    // the last ledge, then the EXIT DOOR on the summit platform.
    // =============================================================
    { type: 'platform', x: 2, y: 57.0, w: 3, h: 0.5, spriteVariant: 'platform1' },
    { type: 'wall', x: -0.4, y: 61, w: 0.6, h: 5 },
    { type: 'wall', x:  2.4, y: 61, w: 0.6, h: 5 },
    { type: 'flyer', x: 1, y: 60, range: 1.0 },
    { type: 'platform', x: 1, y: 64.0, w: 2.6, h: 0.5, spriteVariant: 'platform3' },
    { type: 'spike',    x: 1, y: 67, w: 1, h: 1, triggerH: 3 },
    { type: 'platform', x: -3, y: 65.5, w: 2.4, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x:  4, y: 65.5, w: 2.4, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'archer',   x:  4, y: 66.5, dir: -1 },
    { type: 'platform', x: 0, y: 67.0, w: 5, h: 0.5, spriteVariant: 'platform1' },

    // ---- EXIT DOOR (returns to menu — nextLevelId is null) ----
    { type: 'door', x: 0, y: 68.25, w: 1.6, h: 2.6, activateAtY: 63 },
  ],
};
