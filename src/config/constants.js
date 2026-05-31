// Single source of truth for tuning. Tweak and reload (Vite HMR friendly).
// Times in milliseconds unless noted. Distances/speeds in world units.

export const WORLD = Object.freeze({
  VIEW_HEIGHT: 22,        // visible world units, vertical extent (orthographic)
  GRAVITY: -75,           // units / s^2 (negative = down)
  MAX_FALL_SPEED: -36,    // terminal velocity
  DEATH_Y: -20,           // below this -> respawn
});

export const PLAYER = Object.freeze({
  // Hitbox
  WIDTH: 0.8,
  HEIGHT: 1.2,

  // Horizontal movement
  MAX_RUN_SPEED: 8.5,
  RUN_ACCEL: 70,
  RUN_DECEL: 90,
  AIR_ACCEL: 45,
  AIR_DECEL: 22,

  // Jump
  // Gate A tuning: bumped 19 -> 22 so single-jump reach (~3.2 world units) is
  // tall enough for the level's 2.0-unit platform spacing.
  JUMP_VELOCITY: 22,
  JUMP_CUT_MULT: 0.45,    // multiply upward velocity when jump released early
  COYOTE_MS: 90,
  JUMP_BUFFER_MS: 120,

  // Wall
  WALL_SLIDE_SPEED: -4,   // max downward speed while sliding on a wall
  WALL_JUMP_VX: 11,       // horizontal push off wall
  WALL_JUMP_VY: 17,       // vertical boost off wall
  WALL_STAMINA_MAX: 3,    // wall interactions before grip is lost
  WALL_PROBE: 0.06,       // side-probe distance for wall detection
  WALL_STICK_MS: 110,     // after wall jump, suppress reverse horizontal input briefly

  // Dash (Phase 3)
  // Gate A tuning: shortened from 160 -> 120 -> 100 ms for a crisp, decisive
  // dash. Combined with the post-dash velocity cap in Player.js (clamps vel.x
  // to MAX_RUN_SPEED when the dash window ends) the total horizontal carry
  // is ~4 units, predictable. An air dash also refunds one in-air jump until
  // ground touch (see Player._airJumpAvailable).
  DASH_SPEED: 19,
  DASH_DURATION_MS: 100,
  DASH_FREEZE_MS: 55,     // hit-pause on successful enemy hit

  // Health / damage (Phase 4)
  MAX_HP: 5,
  IFRAME_MS: 900,
  KNOCKBACK_VX: 9,
  KNOCKBACK_VY: 8,

  // Arrows (Phase 6)
  ARROW_AMMO_MAX: 10,
  ARROW_AMMO_START: 10,
  ARROW_SPEED: 22,
  ARROW_LIFETIME_MS: 1400,

  // Misc
  SKIN: 0.001,
});

export const ENEMY = Object.freeze({
  WALKER_WIDTH: 0.9,
  WALKER_HEIGHT: 0.9,
  WALKER_SPEED: 2.4,

  ARCHER_WIDTH: 0.9,
  ARCHER_HEIGHT: 1.1,
  ARCHER_FIRE_INTERVAL_MS: 2200,
  ARCHER_PROJECTILE_SPEED: 7,

  FLYER_WIDTH: 0.9,
  FLYER_HEIGHT: 0.9,
  FLYER_AMPLITUDE: 1.6,
  FLYER_FREQUENCY: 0.9,
  FLYER_PATROL_SPEED: 2.0,
  BASIC_ARROW_HP: 5,
  ARROW_DAMAGE: 3,
});

export const HAZARD = Object.freeze({
  SPIKE_TRIGGER_PAD: 0.5, // extends trigger zone outward
  SPIKE_WARNING_MS: 380,
  SPIKE_FALL_SPEED: 26,
  SPIKE_RESET_MS: 2200,
});

export const CAMERA = Object.freeze({
  OFFSET_Y: 4.0,          // camera above player; player sits lower for climb visibility
  DEAD_X: 1.2,
  DEAD_Y: 0.9,
  LERP: 10,               // higher = snappier follow
  LEAD_X: 1.2,            // horizontal velocity-based look-ahead amount
  LEAD_REF_SPEED: 9.0,    // velocity magnitude that produces full lead
});

export const DEBUG = Object.freeze({
  SHOW_ON_START: true,
  HITBOXES_ON_START: false,
});
