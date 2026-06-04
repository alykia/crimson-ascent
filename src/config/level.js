// Crimson Ascent — LEVEL 1 (beginner-friendly ascent).
//
// Coordinates are world units. x/y is the CENTER of the AABB. w/h are sizes.
// Y up, X right. Sections stack bottom-to-top with checkpoints at major gates.
//
// Object types (consumed by LevelManager._spawnObject):
//   platform | wall | walker | archer | flyer | arrowPickup | spike | checkpoint | label | door
//
// LEVEL CONFIG FIELDS (shared schema used by every level):
//   id            string  unique level key (also used in the LEVELS registry)
//   title         string  display name
//   spawn         {x,y}   player spawn / fallback respawn
//   nextLevelId   string|null  level loaded when the exit door is entered
//   background    {url?, color?, aspect?}  sprite backdrop OR solid placeholder
//   music         {url?, volume?}|null     looping track (url:null = silent)
//   objects       []      level geometry, enemies, hazards, checkpoints, door
//
// Reachability budget (physics is UNCHANGED — do not retune in level data):
//   - Max single-jump rise (no horizontal): ~3.2 units
//   - Comfortable jump arc with 4-unit horizontal gap reaches ~2.0 vertical
//   - Wall jump per cycle: ~1.9 units vertical, ~2.5 horizontal cross
//   - Wall stamina = 3 -> ~5.5 units of vertical chimney climb
//   - Dash horizontal carry (with momentum tail): ~4 units
//
// LEVEL 1 is intentionally gentle: wider platforms, smaller early gaps, a
// narrow/short wall-jump chimney, fewer + softer spikes, and generous
// checkpoints so beginners can learn jump / wall-jump / dash / shoot safely.

import backgroundLevel1Url from '../assets/T_Background1_Sprite.png';

const FLOOR_Y   = -1;
const LEFT_X    = -12;
const RIGHT_X   =  12;
const LEVEL_TOP =  50;

export const LEVEL = {
  id: 'level1',
  name: 'level1',
  title: 'Ascent — Trial 1',
  spawn: { x: 0, y: 2 },
  nextLevelId: 'level2',

  // ---- Background: Level 1 keeps the existing parallax sprite. ----
  background: { url: backgroundLevel1Url, aspect: 941 / 1672 },

  // ---- Music: none wired yet. Drop a file + import and set { url, volume }. ----
  music: null,

  objects: [
    // ---- Global bounds ----
    { type: 'platform', x: 0, y: FLOOR_Y, w: 24, h: 1, spriteVariant: 'groundfloor' },
    { type: 'wall', x: LEFT_X,  y: LEVEL_TOP / 2, w: 1, h: LEVEL_TOP },
    { type: 'wall', x: RIGHT_X, y: LEVEL_TOP / 2, w: 1, h: LEVEL_TOP },

    // =============================================================
    // SECTION 1 — OPEN TERRACES  (y 2 - 9)
    // Demo pass: four wide (w6) terraces, exactly 2.0 apart, overlapping in x
    // so the next landing is always under the player and on-screen. No gaps to
    // miss; this just teaches the jump.
    // =============================================================
    { type: 'platform', x: -4.0, y: 2.2, w: 6, h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'platform', x:  2.0, y: 4.2, w: 6, h: 0.5, spriteVariant: 'platform1' },
    { type: 'platform', x: -3.0, y: 6.2, w: 6, h: 0.5, spriteVariant: 'platform3' },
    { type: 'platform', x:  2.0, y: 8.2, w: 6, h: 0.5, spriteVariant: 'platform2' },
    { type: 'checkpoint', x: 2.0, y: 9.0 },

    // =============================================================
    // SECTION 2 — LEFT-SIDE WALL JUMP TUTORIAL  (y 10 - 15)
    // Short chimney (3.0 tall) with a wide entry shelf and a wide top shelf.
    // A checkpoint at the BASE means a missed wall jump never costs progress.
    // =============================================================
    { type: 'platform', x: -4.0, y: 10.2, w: 6, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'checkpoint', x: -4.0, y: 11.0 },
    { type: 'wall', x: -7.0, y: 12.6, w: 0.6, h: 3.0 },
    { type: 'wall', x: -4.3, y: 12.6, w: 0.6, h: 3.0 },
    { type: 'platform', x: -5.5, y: 14.4, w: 6, h: 0.5, spriteVariant: 'platform1' },
    { type: 'checkpoint', x: -5.5, y: 15.2 },

    // =============================================================
    // SECTION 3 — DASH INTRODUCTION  (y 16 - 23)
    // Wide walker hub (a safe dash-kill target) then a gentle 2.0 staircase.
    // No forced long gap; dash is taught on the walker, not over a pit.
    // =============================================================
    { type: 'platform', x: -1.0, y: 16.4, w: 6, h: 0.5, spriteVariant: 'platform1', spriteFlipX: true },
    { type: 'walker',   x: -1.0, y: 17.4, dir: 1 },
    { type: 'checkpoint', x: -1.0, y: 17.2 },
    { type: 'platform', x:  4.0, y: 18.4, w: 5, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x: -2.0, y: 20.4, w: 6, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'platform', x:  3.0, y: 22.2, w: 6, h: 0.5, spriteVariant: 'platform1' },
    { type: 'checkpoint', x: 3.0, y: 23.0 },

    // =============================================================
    // SECTION 4 — ARROW USAGE  (y 23 - 32)
    // Pickup first, then a SLOW flyer (range 2.0) over the central path and an
    // archer parked on a side perch (optional). Wide retreat ledges everywhere.
    // =============================================================
    { type: 'platform', x:  3.0, y: 23.6, w: 6, h: 0.5, spriteVariant: 'platform1' },
    { type: 'arrowPickup', x: 2.0, y: 24.5, amount: 3 },
    { type: 'platform', x: -2.0, y: 25.6, w: 6, h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'flyer',    x:  0.0, y: 27.4, range: 2.0 },
    { type: 'platform', x:  6.0, y: 26.2, w: 4, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'archer',   x:  6.0, y: 27.2, dir: -1 },
    { type: 'platform', x:  2.0, y: 27.6, w: 6, h: 0.5, spriteVariant: 'platform3' },
    { type: 'platform', x: -1.0, y: 29.6, w: 6, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x:  2.0, y: 31.4, w: 6, h: 0.5, spriteVariant: 'platform1', spriteFlipX: true },
    { type: 'checkpoint', x: 2.0, y: 32.2 },

    // =============================================================
    // SECTION 5 — FALLING SPIKES  (y 32 - 38)
    // Two spikes parked OFF the central climb (x ±5) over their own side
    // ledges, with a long warning window (triggerH 5). The straight-up path
    // (x 0) never passes under a spike. Even 2.0 steps out of the checkpoint.
    // =============================================================
    { type: 'platform', x:  0.0, y: 33.4, w: 6, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x: -5.0, y: 33.4, w: 3, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'spike',    x: -5.0, y: 36.9, w: 1, h: 1, triggerH: 5 },
    { type: 'platform', x:  0.0, y: 35.4, w: 6, h: 0.5, spriteVariant: 'platform1' },
    { type: 'platform', x:  5.0, y: 35.4, w: 3, h: 0.5, spriteVariant: 'platform2' },
    { type: 'spike',    x:  5.0, y: 38.9, w: 1, h: 1, triggerH: 5 },
    { type: 'platform', x:  2.0, y: 37.4, w: 6, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'checkpoint', x: 2.0, y: 38.2 },

    // =============================================================
    // SECTION 6 — OPEN STAIR CLIMB + EXIT  (y 38 - 48)
    // Clean alternating staircase (2.0 steps, w6). Walker + archer sit on side
    // ledges OFF the main path. Wide pre-exit platform with a checkpoint right
    // before the door.
    // =============================================================
    { type: 'platform', x: -2.5, y: 39.4, w: 6, h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'platform', x:  3.0, y: 41.4, w: 6, h: 0.5, spriteVariant: 'platform3' },
    { type: 'platform', x: -2.0, y: 43.4, w: 6, h: 0.5, spriteVariant: 'platform1', spriteFlipX: true },
    { type: 'platform', x:  6.0, y: 43.8, w: 3.5, h: 0.5, spriteVariant: 'platform2' },
    { type: 'walker',   x:  6.0, y: 44.8, dir: -1 },
    { type: 'platform', x:  2.5, y: 45.4, w: 6, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x: -5.0, y: 45.4, w: 3.5, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'archer',   x: -5.0, y: 46.4, dir: 1 },
    { type: 'platform', x:  0.0, y: 47.0, w: 7, h: 0.5, spriteVariant: 'platform1' },
    { type: 'checkpoint', x: 0.0, y: 47.8 },

    // ---- EXIT DOOR (to Level 2) ----
    // Edit x/y to move it; activateAtY is the height the player must reach
    // before the door appears and becomes enterable.
    { type: 'door', x: 0, y: 48.35, w: 1.6, h: 2.6, activateAtY: 44 },
  ],
};
