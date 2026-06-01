// Crimson Ascent — single continuous vertical level.
//
// Coordinates are world units. x/y is the CENTER of the AABB. w/h are sizes.
// Y up, X right. Sections stack bottom-to-top with checkpoints at major gates.
//
// Object types (consumed by Game._loadLevel):
//   platform | wall | walker | archer | flyer | arrowPickup | spike | checkpoint
//
// Reachability budget (Phase 2 tuning, post Gate A with JUMP_VELOCITY=22):
//   - Max single-jump rise (no horizontal): ~3.2 units
//   - Comfortable jump arc with 4-unit horizontal gap reaches ~2.0 vertical
//   - Wall jump per cycle: ~1.9 units vertical, ~2.5 horizontal cross
//   - Wall stamina = 3 → ~5.5 units of vertical chimney climb
//   - Dash horizontal carry (with momentum tail): ~10+ units
// Platforms are laid out at 2.0 vertical spacing, ~4 horizontal gap.

const FLOOR_Y   = -1;
const LEFT_X    = -12;
const RIGHT_X   =  12;
const LEVEL_TOP =  50;

export const LEVEL = {
  name: 'campaign',
  title: 'Vertical Ascent',
  spawn: { x: 0, y: 2 },
  objects: [
    // ---- Global bounds ----
    { type: 'platform', x: 0, y: FLOOR_Y, w: 24, h: 1, spriteVariant: 'groundfloor' },
    { type: 'wall', x: LEFT_X,  y: LEVEL_TOP / 2, w: 1, h: LEVEL_TOP },
    { type: 'wall', x: RIGHT_X, y: LEVEL_TOP / 2, w: 1, h: LEVEL_TOP },
    // =============================================================
    // SECTION 1 — BASIC MOVEMENT  (y 0 - 10)
    // Stepped platforms alternating sides, 2.0 vertical / 4 horizontal.
    // No early checkpoint: first save is after the wall-jump intro.
    // =============================================================
    { type: 'platform', x: -4, y: 2.0, w: 3, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x:  3, y: 4.0, w: 3, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'platform', x: -3, y: 6.0, w: 3, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x:  3, y: 8.0, w: 3, h: 0.5, spriteVariant: 'platform3' },

    // =============================================================
    // SECTION 2 — WALL JUMPING  (y 10 - 15)
    // Entry shelf directly above S1 last platform. Tight chimney that
    // clears in three wall jumps; no rest inside.
    // =============================================================
    { type: 'platform', x: 3, y: 10.0, w: 4, h: 0.5, spriteVariant: 'platform1', spriteFlipX: true },
    // Raised chimney walls so the shelf -> chimney entry is clearly open.
    { type: 'wall', x: 0.8, y: 13.5, w: 0.6, h: 4 },
    { type: 'wall', x: 5.2, y: 13.5, w: 0.6, h: 4 },
    // Split top shelf: leaves the center line open under the checkpoint so the
    // route doesn't feel blocked, while still giving two narrow landing options.
    { type: 'platform', x: 4.2, y: 14.1, w: 1.5, h: 0.5, spriteVariant: 'platform3' },
    { type: 'checkpoint', x: 4.2, y: 15.05 },

    // =============================================================
    // SECTION 3 — DASH INTRODUCTION  (y 15 - 22)
    // Walker on a hub platform. Wide horizontal gap that needs the dash
    // (with the walker as a dash-refresh target on the way back).
    // =============================================================
    { type: 'platform', x: 0, y: 16.5, w: 4.5, h: 0.5, spriteVariant: 'platform1', spriteFlipX: true },
    { type: 'walker',   x: 0, y: 17.5, dir: 1 },
    // Wide gap → dash to clear
    { type: 'platform', x:  8, y: 17.5, w: 2.9, h: 0.5, spriteVariant: 'platform2' },
    // Side assists: optional bailout ledges that smooth failed lines without
    // trivializing the climb.
    { type: 'platform', x: -7.2, y: 18.0, w: 2.3, h: 0.5, spriteVariant: 'platform3' },
    { type: 'platform', x:  6.8, y: 20.0, w: 2.3, h: 0.5, spriteVariant: 'platform2' },
    // Step up
    { type: 'platform', x: -3, y: 19.5, w: 3,   h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'platform', x:  3, y: 21.5, w: 4,   h: 0.5, spriteVariant: 'platform1' },
    { type: 'checkpoint', x: 3, y: 22.45 },

    // =============================================================
    // SECTION 4 — ARROW USAGE  (y 22 - 30)
    // Pickup early. Archer perched on a right ledge. Flyer hovers in the
    // climb path. Both require weakening before the dash kills them.
    // =============================================================
    { type: 'platform', x: 3, y: 23.5, w: 5, h: 0.5, spriteVariant: 'platform1' },
    { type: 'arrowPickup', x: 2, y: 24.5, amount: 3 },
    // Archer perch
    { type: 'platform', x:  6, y: 25.5, w: 2.9, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'archer',   x:  6, y: 26.5, dir: -1 },
    // Flyer blocks the route up
    { type: 'flyer',    x: -1, y: 27.5, range: 3 },
    // Continued climb on the left
    { type: 'platform', x: -4, y: 26.5, w: 3, h: 0.5, spriteVariant: 'platform2' },
    { type: 'platform', x: -2, y: 28.5, w: 3, h: 0.5, spriteVariant: 'platform3' },
    { type: 'platform', x:  3, y: 30.0, w: 4, h: 0.5, spriteVariant: 'platform1' },
    { type: 'checkpoint', x: 3, y: 30.95 },

    // =============================================================
    // SECTION 5 — FALLING SPIKES  (y 30 - 38)
    // Zig-zag stepping platforms with spikes above. Trigger zones reach
    // down to the platforms so the player commits and keeps moving.
    // =============================================================
    { type: 'platform', x: -3, y: 32, w: 2.9, h: 0.5, spriteVariant: 'platform2', spriteFlipX: true },
    { type: 'spike',    x: -3, y: 37, w: 1, h: 1, triggerH: 5 },

    { type: 'platform', x:  3, y: 34, w: 2.9, h: 0.5, spriteVariant: 'platform3' },
    { type: 'spike',    x:  3, y: 39, w: 1, h: 1, triggerH: 5 },

    { type: 'platform', x: -3, y: 36, w: 2.9, h: 0.5, spriteVariant: 'platform2' },
    { type: 'spike',    x: -3, y: 41, w: 1, h: 1, triggerH: 5 },

    // Safe top landing offset from any spike column
    { type: 'platform', x: 3, y: 37.5, w: 4, h: 0.5, spriteVariant: 'platform1', spriteFlipX: true },
    { type: 'checkpoint', x: 3, y: 38.45 },

    // =============================================================
    // SECTION 6 — COMBINED CHALLENGE  (y 38 - 48)
    // Wall-jump chimney with a flyer harassing it, dash-kill a walker on
    // a side ledge to refresh, arrow-weaken an archer, then a final
    // falling-spike gauntlet to the summit.
    // =============================================================
    // Approach platform up from the S5 checkpoint
    { type: 'platform', x: 0, y: 39.5, w: 4, h: 0.5, spriteVariant: 'platform1' },
    // Chimney (4 units tall)
    { type: 'wall',  x: -2.2, y: 42, w: 0.6, h: 4 },
    { type: 'wall',  x:  2.2, y: 42, w: 0.6, h: 4 },
    // Flyer makes the climb hostile
    { type: 'flyer', x: 0, y: 41.5, range: 1.3 },
    // Top of chimney landing
    { type: 'platform', x: 0, y: 44, w: 4, h: 0.5, spriteVariant: 'platform1' },
    // Walker on a side ledge to refresh dash mid-section
    { type: 'platform', x:  6, y: 45.5, w: 3, h: 0.5, spriteVariant: 'platform2' },
    { type: 'walker',   x:  6, y: 46.5, dir: -1 },
    // Archer perch on the opposite side
    { type: 'platform', x: -5, y: 45.5, w: 3, h: 0.5, spriteVariant: 'platform3', spriteFlipX: true },
    { type: 'archer',   x: -5, y: 46.5, dir: 1 },
    // Approach to summit + spike trap above
    { type: 'platform', x: 0, y: 47, w: 6, h: 0.5, spriteVariant: 'platform1' },
    { type: 'spike',    x: 0, y: 49, w: 1, h: 1, triggerH: 3 },
    // Summit
    { type: 'platform', x: -4, y: 48, w: 3, h: 0.5, spriteVariant: 'platform3' },
    { type: 'checkpoint', x: -4, y: 48.95 },
  ],
};
