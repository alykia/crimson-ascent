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
    // SECTION 1 — OPEN TERRACES  (y 0 - 10)
    // Completely rebuilt from the circled screenshot area. This route no
    // longer stacks platforms over narrow vertical walls; it sweeps left to
    // right through roomy, readable landings above the spawn.
    // =============================================================
    { type: 'platform', x: -5.0, y: 2.4, w: 4.6, h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'platform', x: -0.5, y: 4.6, w: 4.8, h: 0.5, spriteVariant: 'platform1' },
    { type: 'platform', x:  5.0, y: 6.7, w: 4.4, h: 0.5, spriteVariant: 'platform3' },
    { type: 'platform', x:  0.8, y: 8.8, w: 5.0, h: 0.5, spriteVariant: 'platform2' },
    { type: 'checkpoint', x: 0.8, y: 9.75 },

    // =============================================================
    // SECTION 2 — LEFT-SIDE WALL JUMP TUTORIAL  (y 10 - 16)
    // Wall-jump teaching is moved away from the old cramped middle stack.
    // The walls are shorter, offset to the left, and have a large top shelf.
    // =============================================================
    { type: 'platform', x: -4.2, y: 10.6, w: 4.4, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'wall', x: -7.0, y: 13.2, w: 0.6, h: 3.4 },
    { type: 'wall', x: -4.3, y: 13.2, w: 0.6, h: 3.4 },
    { type: 'platform', x: -5.65, y: 15.2, w: 4.6, h: 0.5, spriteVariant: 'platform1' },
    { type: 'checkpoint', x: -5.65, y: 16.15 },

    // =============================================================
    // SECTION 3 — DASH INTRODUCTION  (y 15 - 22)
    // Walker on a hub platform + a moderate gap (≈7 units) to clear with a
    // dash. A left-side bailout ledge smooths failed attempts.
    // =============================================================
    { type: 'platform', x: -1.0, y: 17.0, w: 5, h: 0.5, spriteVariant: 'platform1', spriteFlipX: true },
    { type: 'walker',   x: -1.0, y: 18.0, dir: 1 },
    { type: 'platform', x:  7, y: 17.0, w: 3.5, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x: -6, y: 18.0, w: 3,   h: 0.5, spriteVariant: 'platform3' },
    { type: 'platform', x: -2, y: 19.5, w: 4,   h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'platform', x:  3, y: 21.3, w: 5,   h: 0.5, spriteVariant: 'platform1' },
    { type: 'checkpoint', x: 3, y: 22.25 },

    // =============================================================
    // SECTION 4 — ARROW USAGE  (y 22 - 30)
    // Pickup first, then an archer perch and a slow flyer with roomy ledges
    // to retreat to. Both still require weakening before a dash-kill.
    // =============================================================
    { type: 'platform', x: 3, y: 23.4, w: 5, h: 0.5, spriteVariant: 'platform1' },
    { type: 'arrowPickup', x: 2, y: 24.4, amount: 3 },
    { type: 'platform', x:  6, y: 25.4, w: 3.5, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'archer',   x:  6, y: 26.4, dir: -1 },
    { type: 'flyer',    x: -1, y: 27.4, range: 2.5 },
    { type: 'platform', x: -4,   y: 26.4, w: 4, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x: -1.5, y: 28.4, w: 4, h: 0.5, spriteVariant: 'platform3' },
    { type: 'platform', x:  3,   y: 30.0, w: 5, h: 0.5, spriteVariant: 'platform1' },
    { type: 'checkpoint', x: 3, y: 30.95 },

    // =============================================================
    // SECTION 5 — FALLING SPIKES  (y 30 - 38)
    // Only TWO spike columns (was three) with short trigger zones and wide
    // safe landings between them. Easy to read and avoid.
    // =============================================================
    { type: 'platform', x: -3, y: 31.8, w: 4, h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'spike',    x: -3, y: 36, w: 1, h: 1, triggerH: 4 },

    { type: 'platform', x:  3, y: 33.8, w: 4, h: 0.5, spriteVariant: 'platform3' },
    { type: 'spike',    x:  3, y: 38, w: 1, h: 1, triggerH: 4 },

    { type: 'platform', x: -3, y: 35.8, w: 4, h: 0.5, spriteVariant: 'platform2' },

    { type: 'platform', x: 3, y: 37.6, w: 5, h: 0.5, spriteVariant: 'platform1', spriteFlipX: true },
    { type: 'checkpoint', x: 3, y: 38.55 },

    // =============================================================
    // SECTION 6 — OPEN STAIR CLIMB + EXIT  (y 38 - 49)
    // Rebuilt to avoid the awkward wall/ceiling interaction near the
    // checkpoint. This is now a clean, readable staircase: no wall-jump walls,
    // no tight underside hop, and each landing gives the player room to reset.
    // =============================================================
    { type: 'platform', x: -2.8, y: 40.0, w: 4.8, h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'platform', x:  4.2, y: 42.0, w: 4.8, h: 0.5, spriteVariant: 'platform3' },
    { type: 'platform', x: -2.2, y: 44.0, w: 4.8, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x:  2.4, y: 45.2, w: 4.6, h: 0.5, spriteVariant: 'platform1', spriteFlipX: true },
    { type: 'platform', x:  6, y: 45.4, w: 3.5, h: 0.5, spriteVariant: 'platform2' },
    { type: 'walker',   x:  6, y: 46.4, dir: -1 },
    { type: 'platform', x: -5, y: 45.4, w: 3.5, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'archer',   x: -5, y: 46.4, dir: 1 },
    { type: 'platform', x: 0, y: 47, w: 6, h: 0.5, spriteVariant: 'platform1' },
    { type: 'platform', x: -3.5, y: 48.2, w: 4, h: 0.5, spriteVariant: 'platform3' },
    { type: 'checkpoint', x: -3.5, y: 49.15 },

    // ---- EXIT DOOR (to Level 2) ----
    // Edit x/y to move it; activateAtY is the height the player must reach
    // before the door appears and becomes enterable.
    { type: 'door', x: 0, y: 48.25, w: 1.6, h: 2.6, activateAtY: 44 },
  ],
};
