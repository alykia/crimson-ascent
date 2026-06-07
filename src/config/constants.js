// Single source of truth for tuning. Tweak and reload (Vite HMR friendly).
// Times in milliseconds unless noted. Distances/speeds in world units.

export const WORLD = Object.freeze({
  VIEW_HEIGHT: 22,        // visible world units, vertical extent (orthographic)
  GRAVITY: -75,           // units / s^2 (negative = down)
  MAX_FALL_SPEED: -36,    // terminal velocity
  DEATH_Y: -20,           // below this -> respawn (hard backstop)
  // A long fall sends the player back to their last checkpoint. Because each
  // level has a full-width ground floor, a fall would otherwise just land the
  // player at the bottom; once they drop this many units BELOW their current
  // respawn point we treat it as a fall and respawn. (raise = more lenient)
  FALL_RESPAWN_DROP: 5,
  // Respawn the player slightly ABOVE the checkpoint/spawn marker. Markers sit
  // at standing height, so respawning exactly on one leaves the player's feet a
  // hair inside the platform; the X-axis collision pass (which runs before Y)
  // then ejects the embedded player sideways off the ledge. Spawning a touch
  // higher lets them drop cleanly onto the surface instead.
  RESPAWN_LIFT: 0.6,
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
  DASH_INVULN_GRACE_MS: 180, // short protection during/after dash contact
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
  WALKER_SPEED: 1.1,

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

// Final dragon boss (Level 2 only). Single source of truth for boss difficulty
// — tweak these to make the fight easier/harder without touching boss code.
export const BOSS = Object.freeze({
  // ---- Health & damage ----
  // DEMO-FRIENDLY: tuned soft so a first-time player can win. Raise MAX_HP and
  // lower the cooldowns/telegraphs below to make it harder again.
  MAX_HP: 50,             // total boss health (raise = longer fight)
  ARROW_DAMAGE: 3,        // damage per player arrow hit
  DASH_DAMAGE: 6,         // damage per player dash hit
  DAMAGE_COOLDOWN_MS: 250, // boss i-frames after a hit (prevents multi-count)

  // ---- Hitbox / movement ----
  WIDTH: 2.6,
  HEIGHT: 2.2,
  MOVE_SPEED: 3.0,        // grounded reposition speed (Phase 1)

  // ---- Flame projectile ----
  FLAME_W: 0.7,
  FLAME_H: 0.7,
  FLAME_SPEED: 7,         // slower = easier to dodge
  FLAME_LIFETIME_MS: 2600,
  FLAME_COOLDOWN_MS: 2500,       // base time between flames (Phase 1)
  FLAME_PHASE2_SCALE: 0.85,      // Phase 2 multiplies the cooldown (faster)

  // ---- Phase thresholds (fraction of MAX_HP) ----
  PHASE2_HP_FRAC: 0.5,
  PHASE3_HP_FRAC: 0.15,          // hardest phase only at the very end
  PHASE3_TIMER_SCALE: 0.85,      // Phase 3 multiplies all cooldowns (faster)

  // ---- Flight (Phase 2+) ----
  FLY_HEIGHT: 5.0,        // hover height above the arena ground
  FLY_SPEED: 4.0,         // horizontal tracking speed while flying

  // ---- Dive / ground slam (Phase 2+) ----
  DIVE_TELEGRAPH_MS: 1200, // warning time before the dive commits
  DIVE_COOLDOWN_MS: 5200,  // time between dives
  DIVE_SPEED: 30,          // downward dive speed
  SLAM_RADIUS: 2.3,        // horizontal danger radius of the slam impact
  SLAM_LINGER_MS: 260,     // how long the impact stays dangerous

  // ---- Feedback ----
  DEFEAT_FX_MS: 900,      // defeat flash/shake before the chest appears
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
