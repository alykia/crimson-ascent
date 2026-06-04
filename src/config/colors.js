// Graybox palette per DevPlanCrim.md.
// Hex 0xRRGGBB values fed straight to Three.js materials.
export const COLORS = Object.freeze({
  BACKGROUND:         0x0a0a0c,
  PLATFORM:           0x3a3a40, // dark gray
  WALL:               0x2a2a30, // slightly darker gray
  PLAYER:             0xe0e0e0,
  PLAYER_DASHING:     0xffd54a,
  PLAYER_GHOST:       0x8f1d2c, // deep red
  PLAYER_IFRAME:      0xff80a0,
  HAZARD:             0xc62828, // red
  HAZARD_WARNING:     0xffa040,
  ENEMY:              0xeeeeee, // white
  ENEMY_WEAKENED:     0xf0a0a0, // pale red
  CHECKPOINT:         0x2a5577,
  CHECKPOINT_ACTIVE:  0x60d0ff, // glowing blue
  ARROW_PICKUP:       0xffd54a, // yellow
  ARROW:              0xffe082,
  DEBUG_HITBOX:       0x00ff88,

  // ---- Final boss placeholders (swap when real sprites arrive) ----
  BOSS_BODY:          0x6b1f2e, // deep dragon crimson
  BOSS_BODY_HURT:     0xffb0b0, // flash on hit
  BOSS_FLAME:         0xff7a1a, // orange flame
  BOSS_WARNING:       0xff3b3b, // dive telegraph / slam danger
  REWARD_CHEST:       0x8a5a25, // wood/gold chest
  REWARD_SWORD:       0xd8e6ff, // steel blade
});
