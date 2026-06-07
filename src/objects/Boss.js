import * as THREE from 'three';
import { COLORS } from '../config/colors.js';
import { BOSS, PLAYER, WORLD } from '../config/constants.js';
import { Physics } from '../systems/Physics.js';
import { Flame } from './Flame.js';
import { ImpactWarning } from './ImpactWarning.js';
import { ChestReward } from './ChestReward.js';
import dragonBossSpriteUrl from '../assets/T_DragonBoss_Sprite.png';
import dragonFlyFrame0Url from '../assets/T_DragonBoss_new_Fly00.png';
import dragonFlyFrame1Url from '../assets/T_DragonBoss_new_Fly01.png';
import dragonFlyFrame2Url from '../assets/T_DragonBoss_new_Fly02.png';
import dragonFlyFrame3Url from '../assets/T_DragonBoss_new_Fly03.png';

// ---- SWAP-IN SLOT FOR A FINAL DRAGON SPRITE -----------------------------
const bossDragonSprite = dragonBossSpriteUrl;
// -------------------------------------------------------------------------

const DRAGON_VISUAL_Y_OFFSET = 0.45;
const DASH_CONTACT_GRACE_MS = 220;

function loadDragonTexture(url) {
  const texture = new THREE.TextureLoader().load(url);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

let dragonTexture = null;
function getDragonTexture() {
  if (bossDragonSprite) {
    if (dragonTexture) return dragonTexture;
    dragonTexture = loadDragonTexture(bossDragonSprite);
    return dragonTexture;
  }
  if (dragonTexture) return dragonTexture;
  // Canvas placeholder: a chunky pixel dragon facing left (flipped per-facing).
  const c = document.createElement('canvas');
  c.width = 128; c.height = 112;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 112);
  const body = '#7a2233';
  const dark = '#4f1320';
  const wing = '#5e1a29';
  // Wings.
  ctx.fillStyle = wing;
  ctx.beginPath();
  ctx.moveTo(64, 40); ctx.lineTo(14, 12); ctx.lineTo(30, 58); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(64, 40); ctx.lineTo(118, 14); ctx.lineTo(100, 60); ctx.closePath(); ctx.fill();
  // Body.
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(64, 64, 30, 26, 0, 0, Math.PI * 2); ctx.fill();
  // Tail.
  ctx.beginPath();
  ctx.moveTo(64, 78); ctx.lineTo(40, 104); ctx.lineTo(70, 86); ctx.closePath(); ctx.fill();
  // Head.
  ctx.beginPath();
  ctx.ellipse(40, 50, 16, 13, 0, 0, Math.PI * 2); ctx.fill();
  // Snout.
  ctx.fillStyle = dark;
  ctx.fillRect(18, 48, 14, 9);
  // Horns.
  ctx.beginPath();
  ctx.moveTo(44, 38); ctx.lineTo(50, 22); ctx.lineTo(52, 40); ctx.closePath(); ctx.fill();
  // Eye (glowing).
  ctx.fillStyle = '#ffd23b';
  ctx.fillRect(34, 46, 5, 5);
  ctx.fillStyle = '#ff5a2a';
  ctx.fillRect(35, 47, 3, 3);
  // Belly highlight.
  ctx.fillStyle = '#9c3245';
  ctx.fillRect(54, 70, 26, 8);

  dragonTexture = new THREE.CanvasTexture(c);
  dragonTexture.magFilter = THREE.NearestFilter;
  dragonTexture.minFilter = THREE.NearestFilter;
  dragonTexture.colorSpace = THREE.SRGBColorSpace;
  dragonTexture.needsUpdate = true;
  return dragonTexture;
}

let dragonFlyTextures = null;
function getDragonFlyTextures() {
  if (dragonFlyTextures) return dragonFlyTextures;
  dragonFlyTextures = [
    dragonFlyFrame0Url,
    dragonFlyFrame1Url,
    dragonFlyFrame2Url,
    dragonFlyFrame3Url,
  ].map(loadDragonTexture);
  return dragonFlyTextures;
}

const STATE = { DORMANT: 0, ACTIVE: 1, DEFEAT_FX: 2, DEFEATED: 3 };
const DIVE = { NONE: 0, TELEGRAPH: 1, DIVING: 2, RECOVER: 3 };

// Final dragon boss for Level 2's summit arena.
//
// IMPORTANT: the boss is intentionally NOT flagged `isEnemy`. That keeps it out
// of Game._resolveCombat and Arrow's auto-enemy-hit, so a single dash can't
// instakill it. Instead it resolves ALL of its own combat here (arrows, dash,
// contact) with its own damage cooldown. No player-physics constants change.
//
// Lifecycle: DORMANT (idle, visible) -> ACTIVE (phases 1-3) -> DEFEAT_FX ->
// DEFEATED (spawns the chest). Resets on player respawn unless already defeated.
export class Boss {
  constructor({ x, y, activateAtY = null, arena = {} }) {
    this.tag = 'boss';
    this.solid = false; // we move ourselves; not part of the static broadphase

    this.aabb = { x, y, w: BOSS.WIDTH, h: BOSS.HEIGHT };
    this.vel = { x: 0, y: 0 };

    this._spawn = { x, y };
    this._arena = {
      minX: arena.minX ?? (x - 7),
      maxX: arena.maxX ?? (x + 7),
      groundY: arena.groundY ?? (y - BOSS.HEIGHT / 2),
    };
    this._activateAtY = activateAtY ?? (y - 2);

    this.maxHp = BOSS.MAX_HP;
    this.hp = this.maxHp;

    this._state = STATE.DORMANT;
    this._phase = 1;
    this._flying = false;
    this._facing = -1;

    // Fight gating: the dragon wakes only once the player actually stands on the
    // arena deck's TOP surface (not when merely reaching this height, and not
    // from the one-way deck's underside). `_fightStarted` makes the trigger and
    // its music fire exactly once per attempt; it re-arms on respawn.
    this._fightStarted = false;
    this.playerOnBossPlatform = false;

    // Timers (ms)
    this._damageCdMs = 0;
    this._flameCdMs = BOSS.FLAME_COOLDOWN_MS;
    this._diveCdMs = BOSS.DIVE_COOLDOWN_MS;
    this._dashContactGraceMs = 0;
    this._hurtMs = 0;
    this._fxMs = 0;
    this._t = 0;
    this._flyFrameIndex = 0;
    this._flyFrameTimerMs = 0;
    this._flyFrameDurationMs = 130;

    // Dive sub-state
    this._dive = DIVE.NONE;
    this._diveTimer = 0;
    this._diveTargetX = x;
    this._diveWarning = null;

    this._chestSpawned = false;
    this._game = null; // cached on first update for onPlayerRespawn()

    this._mat = new THREE.SpriteMaterial({
      map: getDragonTexture(),
      color: 0xffffff,
      transparent: true,
      depthWrite: false,
    });
    this.mesh = new THREE.Sprite(this._mat);
    this.mesh.scale.set(BOSS.WIDTH * 1.6, BOSS.HEIGHT * 1.6, 1);
    this.mesh.position.set(x, y, 0.48);
  }

  // ---- helpers ----
  _clampX(x) {
    const half = this.aabb.w / 2;
    return Math.min(Math.max(x, this._arena.minX + half), this._arena.maxX - half);
  }

  get _restY() { return this._arena.groundY + this.aabb.h / 2; }
  get _hoverY() { return this._arena.groundY + BOSS.FLY_HEIGHT; }

  // True only when the player is standing ON the arena deck's top surface
  // (grounded, feet level with arena.groundY, inside the arena's x-bounds).
  _isPlayerOnTop(p) {
    if (!p || !p.grounded) return false;
    const feet = p.aabb.y - p.aabb.h / 2;
    return feet >= this._arena.groundY - 0.15 &&
           feet <= this._arena.groundY + 0.5 &&
           p.aabb.x >= this._arena.minX &&
           p.aabb.x <= this._arena.maxX;
  }

  _timerScale() { return this._phase >= 3 ? BOSS.PHASE3_TIMER_SCALE : 1; }

  // ---- lifecycle ----
  update(dt, game) {
    this._game = game;
    const dtMs = dt * 1000;
    this._t += dt;
    if (this._hurtMs > 0) this._hurtMs = Math.max(0, this._hurtMs - dtMs);
    if (this._dashContactGraceMs > 0) {
      this._dashContactGraceMs = Math.max(0, this._dashContactGraceMs - dtMs);
    }

    if (this._state === STATE.DORMANT) {
      // Visible and waiting; no attacks or movement. The fight starts
      // ONLY when the player is grounded on the arena deck's top surface and
      // within the arena's horizontal bounds. Because the deck is one-way, the
      // player can only be `grounded` on its top — passing through it from below
      // (airborne) never satisfies this, so the side/underside can't trigger it.
      this.playerOnBossPlatform = this._isPlayerOnTop(game.player);
      if (!this._fightStarted && this.playerOnBossPlatform) {
        this._activate(game);
      } else {
        this._syncMesh(0);
        return;
      }
    }

    if (this._state === STATE.DEFEAT_FX) {
      this._fxMs -= dtMs;
      // Flash + shrink while dying, then spawn the reward chest once.
      const k = Math.max(0, this._fxMs / BOSS.DEFEAT_FX_MS);
      this._mat.opacity = k;
      this._mat.color.setHex(Math.sin(this._t * 40) > 0 ? COLORS.BOSS_BODY_HURT : 0xffffff);
      const s = 1 + (1 - k) * 0.3;
      this.mesh.scale.set(BOSS.WIDTH * 1.6 * s * this._facing, BOSS.HEIGHT * 1.6 * s, 1);
      if (this._fxMs <= 0) {
        this._state = STATE.DEFEATED;
        this.mesh.visible = false;
        this._spawnChest(game);
      }
      return;
    }

    if (this._state === STATE.DEFEATED) return;

    // ---- ACTIVE ----
    this._updatePhase(game);
    if (this._damageCdMs > 0) this._damageCdMs = Math.max(0, this._damageCdMs - dtMs);

    const p = game.player;
    if (p) this._facing = (Math.sign(p.aabb.x - this.aabb.x) || this._facing);

    if (this._flying) this._updateFlying(dt, dtMs, game);
    else this._updateGrounded(dt, dtMs, game);

    this._resolveCombat(game);
    this._updateTint();
    this._updateSpriteAnimation(dtMs);
    this._syncMesh(0);
  }

  _activate(game) {
    this._state = STATE.ACTIVE;
    this._fightStarted = true;
    if (game.bossHud) {
      game.bossHud.show();
      game.bossHud.setHealth(this.hp / this.maxHp);
    }
    // Start the boss theme exactly when the fight begins (crossfades from the
    // level track). The level's bossMusic config holds the path; no-op if unset.
    game.audio?.startBoss?.(game.currentLevel?.bossMusic);
  }

  // ---- Phase 1: grounded ----
  _updateGrounded(dt, dtMs, game) {
    const p = game.player;
    // Slow reposition toward the player, clamped to the arena.
    if (p) {
      const targetX = this._clampX(p.aabb.x);
      const dir = Math.sign(targetX - this.aabb.x);
      this.vel.x = dir * BOSS.MOVE_SPEED;
      if (Math.abs(targetX - this.aabb.x) < 0.1) this.vel.x = 0;
    }
    // Gravity + collide so the dragon rests on the arena platform.
    this.vel.y += WORLD.GRAVITY * dt;
    if (this.vel.y < WORLD.MAX_FALL_SPEED) this.vel.y = WORLD.MAX_FALL_SPEED;
    game.physics.moveAndCollide(this, dt);
    this.aabb.x = this._clampX(this.aabb.x);

    // Flame attack on cooldown.
    this._flameCdMs -= dtMs;
    if (this._flameCdMs <= 0) {
      this._spawnFlame(game);
      this._flameCdMs = BOSS.FLAME_COOLDOWN_MS * this._timerScale();
    }
  }

  // ---- Phase 2+: flying (flame + dive/slam) ----
  _updateFlying(dt, dtMs, game) {
    const p = game.player;

    if (this._dive === DIVE.NONE) {
      // Hover and track the player horizontally.
      if (p) {
        const targetX = this._clampX(p.aabb.x);
        this.aabb.x += Math.sign(targetX - this.aabb.x) *
          Math.min(BOSS.FLY_SPEED * dt, Math.abs(targetX - this.aabb.x));
      }
      const hoverY = this._hoverY + Math.sin(this._t * 2.2) * 0.4;
      this.aabb.y += (hoverY - this.aabb.y) * Math.min(1, dt * 4);

      // Flames (faster than Phase 1).
      this._flameCdMs -= dtMs;
      if (this._flameCdMs <= 0) {
        this._spawnFlame(game);
        this._flameCdMs = BOSS.FLAME_COOLDOWN_MS * BOSS.FLAME_PHASE2_SCALE * this._timerScale();
      }

      // Dive on cooldown.
      this._diveCdMs -= dtMs;
      if (this._diveCdMs <= 0) this._startDive(game);
      return;
    }

    this._updateDive(dt, dtMs, game);
  }

  _startDive(game) {
    const p = game.player;
    this._diveTargetX = this._clampX(p ? p.aabb.x : this.aabb.x);
    this._dive = DIVE.TELEGRAPH;
    this._diveTimer = BOSS.DIVE_TELEGRAPH_MS;
    // Spawn the ground telegraph + slam danger zone at the target.
    this._diveWarning = new ImpactWarning({
      x: this._diveTargetX,
      y: this._arena.groundY + 0.1,
      radius: BOSS.SLAM_RADIUS,
      telegraphMs: BOSS.DIVE_TELEGRAPH_MS,
      lingerMs: BOSS.SLAM_LINGER_MS,
    });
    game.entities.add(this._diveWarning);
  }

  _updateDive(dt, dtMs, game) {
    if (this._dive === DIVE.TELEGRAPH) {
      // Drift above the target while charging.
      this.aabb.x += Math.sign(this._diveTargetX - this.aabb.x) *
        Math.min(BOSS.FLY_SPEED * 1.5 * dt, Math.abs(this._diveTargetX - this.aabb.x));
      this.aabb.y += (this._hoverY - this.aabb.y) * Math.min(1, dt * 4);
      this._diveTimer -= dtMs;
      if (this._diveTimer <= 0) this._dive = DIVE.DIVING;
      return;
    }
    if (this._dive === DIVE.DIVING) {
      this.aabb.x = this._diveTargetX;
      this.aabb.y -= BOSS.DIVE_SPEED * dt;
      if (this.aabb.y <= this._restY) {
        this.aabb.y = this._restY;
        this._dive = DIVE.RECOVER;
        this._diveTimer = 320; // brief ground pause after the slam
      }
      return;
    }
    if (this._dive === DIVE.RECOVER) {
      this._diveTimer -= dtMs;
      if (this._diveTimer <= 0) {
        this.aabb.y += BOSS.FLY_SPEED * 1.4 * dt;
        if (this.aabb.y >= this._hoverY - 0.2) {
          this.aabb.y = this._hoverY;
          this._dive = DIVE.NONE;
          this._diveWarning = null;
          this._diveCdMs = BOSS.DIVE_COOLDOWN_MS * this._timerScale();
        }
      }
    }
  }

  _spawnFlame(game) {
    const p = game.player;
    if (!p) return;
    const mouthX = this.aabb.x + this._facing * (this.aabb.w * 0.35);
    const mouthY = this.aabb.y + 0.1;
    let dx = p.aabb.x - mouthX;
    let dy = p.aabb.y - mouthY;
    const mag = Math.hypot(dx, dy) || 1;
    dx /= mag; dy /= mag;
    game.entities.add(new Flame({
      x: mouthX,
      y: mouthY,
      vx: dx * BOSS.FLAME_SPEED,
      vy: dy * BOSS.FLAME_SPEED,
    }));
  }

  // ---- phases ----
  _updatePhase(game) {
    const frac = this.hp / this.maxHp;
    let phase = 1;
    if (frac <= BOSS.PHASE2_HP_FRAC) phase = 2;
    if (frac <= BOSS.PHASE3_HP_FRAC) phase = 3;
    if (phase !== this._phase) {
      this._phase = phase;
      if (phase >= 2 && !this._flying) {
        this._flying = true; // lift off into Phase 2
        this._diveCdMs = BOSS.DIVE_COOLDOWN_MS * 0.5; // dive soon after liftoff
      }
    }
  }

  // ---- combat (boss resolves its own) ----
  _resolveCombat(game) {
    const p = game.player;
    if (!p) return;

    // Player arrows (boss is not isEnemy, so Arrow.js leaves these for us).
    if (this._damageCdMs <= 0) {
      const arrows = game.entities.filter(
        e => e.tag === 'arrow' && e.source === 'player'
      );
      for (const a of arrows) {
        if (Physics.overlap(this.aabb, a.aabb)) {
          this._takeDamage(BOSS.ARROW_DAMAGE, game);
          game.entities.remove(a);
          break;
        }
      }
    }

    // Contact with the player.
    if (Physics.overlap(this.aabb, p.aabb)) {
      // Boss updates can run before Player.update consumes this frame's dash
      // input. Treat a just-pressed, available dash as a dash hit too, otherwise
      // pressing dash while already overlapping the boss could still damage the
      // player for one frame.
      const dashStartingThisFrame = !!game.input?.justPressed?.dash && p.canDash;
      const dashing = p.dashMsLeft > 0 || dashStartingThisFrame;
      if (dashing) {
        this._dashContactGraceMs = DASH_CONTACT_GRACE_MS;
        p.dashInvulnMs = Math.max(p.dashInvulnMs || 0, PLAYER.DASH_INVULN_GRACE_MS);
        // Dash attack: damage the boss, refresh the player's dash, hit-pause.
        // The player takes NO contact damage on a dashing hit.
        if (this._damageCdMs <= 0) {
          this._takeDamage(BOSS.DASH_DAMAGE, game);
          p.canDash = true;
          p.dashMsLeft = 0;
          game.freezePhysics(PLAYER.DASH_FREEZE_MS);
        }
      } else if (this._dashContactGraceMs > 0) {
        // The dash impact cancels the dash for feedback, but the large boss
        // hitbox can still overlap for a few frames. Do not turn that into
        // immediate contact damage.
        return;
      } else {
        // Normal touch hurts the player (their i-frames prevent repeats).
        const fromDir = Math.sign(this.aabb.x - p.aabb.x) || 1;
        p.damage(fromDir);
      }
    }
  }

  _takeDamage(amount, game) {
    if (this._state !== STATE.ACTIVE) return;
    this.hp = Math.max(0, this.hp - amount);
    this._damageCdMs = BOSS.DAMAGE_COOLDOWN_MS;
    this._hurtMs = 120;
    if (game.bossHud) game.bossHud.setHealth(this.hp / this.maxHp);
    if (this.hp <= 0) this._defeat(game);
  }

  _defeat(game) {
    this._state = STATE.DEFEAT_FX;
    this._fxMs = BOSS.DEFEAT_FX_MS;
    this._dive = DIVE.NONE;
    // Boss death is intentionally left silent (the regular enemyDeath SFX is
    // not reused here). To add a custom boss-death sound later: import
    // `audio` from '../systems/SfxManager.js', add a 'bossDeath' entry to
    // SFX_FILES, and call audio.playSfx('bossDeath') here.
    this._diveWarning = null;
    // Stop attacks + clear every active flame and warning.
    for (const e of game.entities.filter(
      e => e.tag === 'flame' || e.tag === 'impactWarning'
    )) {
      game.entities.remove(e);
    }
    if (game.bossHud) game.bossHud.hide();
    // Fade the boss theme to silence (the chest -> Game Complete flow follows;
    // no level music returns at the summit).
    game.audio?.endBoss?.({ resumeLevel: false });
  }

  _spawnChest(game) {
    if (this._chestSpawned) return;
    this._chestSpawned = true;
    const cx = (this._arena.minX + this._arena.maxX) / 2;
    const chest = new ChestReward({ x: cx, y: this._arena.groundY + 0.7 });
    game.entities.add(chest);
    game.activeChest = chest;
  }

  _updateTint() {
    if (this._hurtMs > 0) this._mat.color.setHex(COLORS.BOSS_BODY_HURT);
    else this._mat.color.setHex(0xffffff);
  }

  _setTexture(texture) {
    if (this._mat.map === texture) return;
    this._mat.map = texture;
    this._mat.needsUpdate = true;
  }

  _updateSpriteAnimation(dtMs) {
    if (!this._flying) {
      this._flyFrameIndex = 0;
      this._flyFrameTimerMs = 0;
      this._setTexture(getDragonTexture());
      return;
    }

    const textures = getDragonFlyTextures();
    this._setTexture(textures[this._flyFrameIndex]);
    this._flyFrameTimerMs += dtMs;
    while (this._flyFrameTimerMs >= this._flyFrameDurationMs) {
      this._flyFrameTimerMs -= this._flyFrameDurationMs;
      this._flyFrameIndex = (this._flyFrameIndex + 1) % textures.length;
      this._setTexture(textures[this._flyFrameIndex]);
    }
  }

  _syncMesh(bob) {
    this.mesh.position.x = this.aabb.x;
    this.mesh.position.y = this.aabb.y + DRAGON_VISUAL_Y_OFFSET + (bob || 0);
    // Face the player by flipping the sprite horizontally.
    this.mesh.scale.x = BOSS.WIDTH * 1.6 * (this._facing >= 0 ? -1 : 1);
  }

  // Reset for a retry — UNLESS already defeated (then the fight is over).
  onPlayerRespawn() {
    if (this._state === STATE.DEFEATED || this._state === STATE.DEFEAT_FX) return;

    // Re-arm the fight: it starts again when the player next lands on the deck.
    // Stop the boss theme and let the level track resume (the player may have
    // respawned below the arena; if they respawn ON it the fight re-triggers).
    this._game?.audio?.endBoss?.({ resumeLevel: true });
    this._fightStarted = false;
    this.playerOnBossPlatform = false;

    this._state = STATE.DORMANT;
    this._phase = 1;
    this._flying = false;
    this.hp = this.maxHp;
    this.aabb.x = this._spawn.x;
    this.aabb.y = this._spawn.y;
    this.vel.x = 0;
    this.vel.y = 0;
    this._damageCdMs = 0;
    this._flameCdMs = BOSS.FLAME_COOLDOWN_MS;
    this._diveCdMs = BOSS.DIVE_COOLDOWN_MS;
    this._dashContactGraceMs = 0;
    this._dive = DIVE.NONE;
    this._diveWarning = null;
    this._flyFrameIndex = 0;
    this._flyFrameTimerMs = 0;
    this._hurtMs = 0;
    this._t = 0;
    this._mat.opacity = 1;
    this._mat.color.setHex(0xffffff);
    this._setTexture(getDragonTexture());
    this.mesh.visible = true;
    this.mesh.scale.set(BOSS.WIDTH * 1.6, BOSS.HEIGHT * 1.6, 1);
    this._syncMesh(0);
    // Flames/warnings are cleared by Game.respawn's sweep; hide the bar until
    // the boss re-triggers (it re-triggers immediately at the arena checkpoint).
    if (this._game?.bossHud) this._game.bossHud.hide();
  }

  onRemoved() {
    this._mat?.dispose();
  }
}
