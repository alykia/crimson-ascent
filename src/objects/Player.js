import * as THREE from 'three';
import { COLORS } from '../config/colors.js';
import { PLAYER, WORLD } from '../config/constants.js';
import { Ghost } from './Ghost.js';
import { Arrow } from './Arrow.js';
import idleFrame0Url from '../assets/T_CharacterChibi_Idle00.png';
import idleFrame1Url from '../assets/T_CharacterChibi_Idle01.png';
import dashFrame0Url from '../assets/T_Character_Dash00.png';
import dashFrame1Url from '../assets/T_Character_Dash01.png';
import dashFrame2Url from '../assets/T_Character_Dash02.png';
import dashFrame3Url from '../assets/T_Character_Dash03.png';
import dashFrame4Url from '../assets/T_Character_Dash04.png';
import dashFrame5Url from '../assets/T_Character_Dash05.png';
import dashFrame6Url from '../assets/T_Character_Dash06.png';
import jumpFrame0Url from '../assets/T_Character_Jump00.png';
import jumpFrame1Url from '../assets/T_Character_Jump01.png';
import walkFrame0Url from '../assets/T_Character_Walk00.png';
import walkFrame1Url from '../assets/T_Character_Walk01.png';
import walkFrame2Url from '../assets/T_Character_Walk02.png';
import walkFrame3Url from '../assets/T_Character_Walk03.png';

// Kinematic AABB driven by handmade physics. Phase 2 implements:
//   - horizontal accel/decel with separate air values
//   - gravity + terminal velocity
//   - variable-height jump (cut on early release)
//   - coyote time (jump shortly after leaving a platform)
//   - jump buffer (jump pressed shortly before landing)
//   - wall detection via tiny side-probe AABBs
//   - wall slide (capped fall speed while pressing into wall)
//   - wall jump with directional push + vertical boost
//   - wall stamina: 3 wall jumps before grip is lost, resets on ground
//
// Phase 3+ adds dash, health, arrows on top of these.
export class Player {
  constructor({ x, y }) {
    this.tag = 'player';
    this.solid = false; // we collide with solids; we are not one

    this.aabb = { x, y, w: PLAYER.WIDTH, h: PLAYER.HEIGHT };
    this.vel = { x: 0, y: 0 };

    // Contact flags (set after collision sweep)
    this.grounded = false;
    this.wallL = false;
    this.wallR = false;
    this.facing = 1; // +1 right, -1 left

    // Timers in ms
    this.coyoteMs = 0;
    this.jumpBufferMs = 0;
    this.wallStickMs = 0;
    this._wallStickDir = 0;

    // Wall stamina
    this.wallStaminaMax = PLAYER.WALL_STAMINA_MAX;
    this.wallStamina = PLAYER.WALL_STAMINA_MAX;

    // Dash
    this.dashMsLeft = 0;
    this.canDash = true;
    this._dashDir = 0;
    this._trailTimerMs = 0;
    this._wasDashing = false;
    this._dashWasAirborne = false;
    // Refunded by an air dash: lets the player jump once more mid-air after
    // the dash ends. Consumed on use, cleared on ground touch.
    this._airJumpAvailable = false;
    this._debugMoveInputX = 0;

    // Health placeholders (Phase 4)
    this.hp = PLAYER.MAX_HP;
    this.maxHp = PLAYER.MAX_HP;
    this.iframeMs = 0;
    this.godMode = false;

    // Ammo placeholders (Phase 6)
    this.ammo = PLAYER.ARROW_AMMO_START;
    this.maxAmmo = PLAYER.ARROW_AMMO_MAX;

    if (!Player._idleTextures) {
      const loader = new THREE.TextureLoader();
      Player._idleTextures = [idleFrame0Url, idleFrame1Url].map((url) => {
        const tex = loader.load(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        return tex;
      });
    }
    if (!Player._dashTextures) {
      const loader = new THREE.TextureLoader();
      Player._dashTextures = [
        dashFrame0Url,
        dashFrame1Url,
        dashFrame2Url,
        dashFrame3Url,
        dashFrame4Url,
        dashFrame5Url,
        dashFrame6Url,
      ].map((url) => {
        const tex = loader.load(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        return tex;
      });
    }
    if (!Player._jumpTextures) {
      const loader = new THREE.TextureLoader();
      Player._jumpTextures = [jumpFrame0Url, jumpFrame1Url].map((url) => {
        const tex = loader.load(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        return tex;
      });
    }
    if (!Player._walkTextures) {
      const loader = new THREE.TextureLoader();
      Player._walkTextures = [
        walkFrame0Url,
        walkFrame1Url,
        walkFrame2Url,
        walkFrame3Url,
      ].map((url) => {
        const tex = loader.load(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        return tex;
      });
    }

    this._idleTextures = Player._idleTextures;
    this._dashTextures = Player._dashTextures;
    this._jumpTextures = Player._jumpTextures;
    this._walkTextures = Player._walkTextures;
    this._idleFrameIndex = 0;
    this._idleFrameTimerMs = 0;
    this._idleFrameDurationMs = 240;
    this._walkFrameIndex = 0;
    this._walkFrameTimerMs = 0;
    this._walkFrameDurationMs = 120;
    // Keyframe order for dash visual timing. Repeating frame 2 makes the
    // bat form readable for longer during the short dash window.
    this._dashFrameSequence = [0, 1, 2, 2, 2, 2, 3, 4, 5, 6];
    this._dashFrameIndex = -1;
    this._visualScaleX = 1.38;
    this._visualScaleY = 1.18;
    this._visualYOffset = ((this._visualScaleY - 1) * this.aabb.h) / 2;
    // Jump frames include a bit more transparent padding, so we slightly
    // upscale only while airborne (outside dash) to keep perceived size even.
    this._jumpVisualScaleMult = 1.12;
    this._jumpVisualYOffset = ((this._jumpVisualScaleMult - 1) * this.aabb.h * this._visualScaleY) / 2;
    this._dashVisualScaleMult = 1.12;
    this._dashVisualYOffset = ((this._dashVisualScaleMult - 1) * this.aabb.h * this._visualScaleY) / 2;

    const geo = new THREE.PlaneGeometry(this.aabb.w, this.aabb.h);
    this._mat = new THREE.MeshBasicMaterial({
      map: this._idleTextures[0],
      color: COLORS.PLAYER,
      transparent: true,
      alphaTest: 0.02,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(geo, this._mat);
    this.mesh.scale.set(this._visualScaleX, this._visualScaleY, 1);
    this.mesh.position.set(x, y, 0.5);
  }

  respawn(x, y) {
    this.aabb.x = x;
    this.aabb.y = y;
    this.vel.x = 0;
    this.vel.y = 0;
    this.grounded = false;
    this.wallL = this.wallR = false;
    this.coyoteMs = 0;
    this.jumpBufferMs = 0;
    this.wallStickMs = 0;
    this._wallStickDir = 0;
    this.wallStamina = this.wallStaminaMax;
    this.dashMsLeft = 0;
    this.canDash = true;
    this._wasDashing = false;
    this._dashWasAirborne = false;
    this._airJumpAvailable = false;
    this.hp = this.maxHp;
    this.iframeMs = 0;
    this._syncMesh();
  }

  update(dt, game) {
    const input = game.input;
    const physics = game.physics;
    const dtMs = dt * 1000;

    if (this.coyoteMs > 0)     this.coyoteMs = Math.max(0, this.coyoteMs - dtMs);
    if (this.jumpBufferMs > 0) this.jumpBufferMs = Math.max(0, this.jumpBufferMs - dtMs);
    if (this.wallStickMs > 0)  this.wallStickMs = Math.max(0, this.wallStickMs - dtMs);
    if (this.iframeMs > 0)     this.iframeMs = Math.max(0, this.iframeMs - dtMs);

    if (input.justPressed.jump) {
      this.jumpBufferMs = PLAYER.JUMP_BUFFER_MS;
    }

    const analogX = input.axis?.moveX ?? 0;
    let digitalX = 0;
    if (input.held.left)  digitalX -= 1;
    if (input.held.right) digitalX += 1;

    // Grounded movement uses analog magnitude for smoother mobile walk speed.
    // Airborne movement keeps full directional control to preserve jump feel.
    let ix = Math.abs(analogX) >= 0.001 ? analogX : digitalX;
    if (!this.grounded) {
      ix = digitalX !== 0 ? digitalX : Math.sign(ix);
    }

    if (ix !== 0 && this.dashMsLeft <= 0) this.facing = Math.sign(ix);
    this._debugMoveInputX = ix;

    // ---- Shoot ----
    if (input.justPressed.shoot) this._tryShoot(game, input);

    // ---- Dash trigger ----
    // Available if we have a charge AND aren't mid-dash. Resets on ground
    // (set in the grounded branch below) and on enemy hit (Phase 5).
    if (input.justPressed.dash && this.canDash && this.dashMsLeft <= 0) {
      this.dashMsLeft = PLAYER.DASH_DURATION_MS;
      this.canDash = false;
      this._dashDir = this.facing || 1;
      this._trailTimerMs = 0;
      this._dashWasAirborne = !this.grounded;
      this._dashFrameIndex = 0;
      this._mat.map = this._dashTextures[0];
      this._mat.needsUpdate = true;
      this._spawnGhost(game);
    }

    if (this.dashMsLeft > 0) {
      // ---- Dashing: pure horizontal, gravity off ----
      this.dashMsLeft = Math.max(0, this.dashMsLeft - dtMs);
      this.vel.x = this._dashDir * PLAYER.DASH_SPEED;
      this.vel.y = 0;
      this._trailTimerMs -= dtMs;
      if (this._trailTimerMs <= 0) {
        this._spawnGhost(game);
        this._trailTimerMs = 28; // ~3 ghosts per dash
      }
    } else {
      // ---- Normal locomotion ----
      if (this.wallStickMs <= 0) {
        const accel = this.grounded ? PLAYER.RUN_ACCEL : PLAYER.AIR_ACCEL;
        const decel = this.grounded ? PLAYER.RUN_DECEL : PLAYER.AIR_DECEL;
        if (ix !== 0) {
          const target = ix * PLAYER.MAX_RUN_SPEED;
          const sameDir = Math.sign(this.vel.x) === Math.sign(ix) || this.vel.x === 0;
          const rate = sameDir ? accel : (accel + decel);
          this.vel.x = approach(this.vel.x, target, rate * dt);
        } else {
          this.vel.x = approach(this.vel.x, 0, decel * dt);
        }
      }

      // Gravity
      this.vel.y += WORLD.GRAVITY * dt;
      if (this.vel.y < WORLD.MAX_FALL_SPEED) this.vel.y = WORLD.MAX_FALL_SPEED;

      // Wall slide cap — only when in the air and pressing into the wall.
      const wallPressX = digitalX !== 0 ? digitalX : Math.sign(ix);
      const pressIntoWallL = this.wallL && wallPressX < 0;
      const pressIntoWallR = this.wallR && wallPressX > 0;
      const sliding = !this.grounded && this.vel.y < PLAYER.WALL_SLIDE_SPEED &&
        (pressIntoWallL || pressIntoWallR);
      if (sliding) this.vel.y = PLAYER.WALL_SLIDE_SPEED;
    }

    // Responsiveness: if an airborne dash expires by timer this frame, arm the
    // refund immediately so a buffered jump can fire without an extra frame.
    if (this._wasDashing && this.dashMsLeft <= 0 && this._dashWasAirborne && !this.grounded) {
      this._airJumpAvailable = true;
    }

    // Jump (buffered): ground/coyote, then wall jump, then air-jump refund.
    // Disabled mid-dash.
    if (this.jumpBufferMs > 0 && this.dashMsLeft <= 0) {
      if (this.grounded || this.coyoteMs > 0) {
        this.vel.y = PLAYER.JUMP_VELOCITY;
        this.coyoteMs = 0;
        this.jumpBufferMs = 0;
      } else if ((this.wallL || this.wallR) && this.wallStamina > 0) {
        const dir = this.wallL ? +1 : -1; // push AWAY from the wall
        this.vel.x = dir * PLAYER.WALL_JUMP_VX;
        this.vel.y = PLAYER.WALL_JUMP_VY;
        this.wallStamina--;
        this.wallStickMs = PLAYER.WALL_STICK_MS;
        this._wallStickDir = dir;
        this.facing = dir;
        this.jumpBufferMs = 0;
      } else if (this._airJumpAvailable) {
        // Bonus mid-air jump refunded by an air dash. Single-use.
        this.vel.y = PLAYER.JUMP_VELOCITY;
        this._airJumpAvailable = false;
        this.jumpBufferMs = 0;
      }
    }

    // Variable jump height: releasing jump while ascending cuts upward velocity.
    if (input.justReleased.jump && this.vel.y > 0 && this.dashMsLeft <= 0) {
      this.vel.y *= PLAYER.JUMP_CUT_MULT;
    }

    // Sweep & resolve.
    const wasGrounded = this.grounded;
    const flags = physics.moveAndCollide(this, dt);
    this.grounded = flags.groundedHit;

    // Cancel dash on wall/platform contact along X axis.
    if (this.dashMsLeft > 0 && (flags.wallLeftHit || flags.wallRightHit)) {
      this.dashMsLeft = 0;
    }

    // Single source of truth for "just left dash state". Catches all paths:
    // duration expired, wall-canceled (above), and enemy-hit canceled (in
    // Game._resolveCombat). Clamps the dash velocity to MAX_RUN_SPEED so the
    // player doesn't keep sailing on the dash's momentum, and grants an
    // air-jump refund if the dash started airborne.
    const isDashing = this.dashMsLeft > 0;
    if (this._wasDashing && !isDashing) {
      const cap = PLAYER.MAX_RUN_SPEED;
      if (this.vel.x > cap)  this.vel.x = cap;
      if (this.vel.x < -cap) this.vel.x = -cap;
      if (this._dashWasAirborne && !this.grounded) {
        this._airJumpAvailable = true;
      }
    }
    this._wasDashing = isDashing;

    // Fallback for the same-frame dash-end case (timer, wall-cancel, enemy-hit
    // cancel): if jump was buffered, consume the refunded air jump right now.
    if (this.jumpBufferMs > 0 && this.dashMsLeft <= 0 && this._airJumpAvailable) {
      this.vel.y = PLAYER.JUMP_VELOCITY;
      this._airJumpAvailable = false;
      this.jumpBufferMs = 0;
    }

    // Re-probe walls (the X-pass already detected lateral hits, but we want a
    // probe so we know about walls even when standing still next to one).
    this.wallL = this._probeWall(physics, -1);
    this.wallR = this._probeWall(physics, +1);

    // Coyote window: just walked off a ledge without jumping.
    if (wasGrounded && !this.grounded && this.vel.y <= 0) {
      this.coyoteMs = PLAYER.COYOTE_MS;
    }

    // Refresh wall stamina + dash charge on ground touch. The air-jump refund
    // is consumable until either it's used (above) or the player lands.
    if (this.grounded) {
      this.wallStamina = this.wallStaminaMax;
      this.canDash = true;
      this._airJumpAvailable = false;
    }

    this._updateTint();
    this._updateSpriteAnimation(dtMs);
    this._syncMesh();
  }

  _updateTint() {
    let hex = 0xffffff;
    if (this.iframeMs > 0) hex = COLORS.PLAYER_IFRAME;
    this._mat.color.setHex(hex);
  }

  _spawnGhost(game) {
    const ghost = new Ghost(
      this.mesh.geometry,
      COLORS.PLAYER_GHOST,
      this.mesh.position,
      240,
      0.55,
      this._mat.map
    );
    ghost.mesh.scale.copy(this.mesh.scale);
    game.entities.add(ghost);
  }

  _updateSpriteAnimation(dtMs) {
    if (this.dashMsLeft > 0 && this._dashTextures?.length) {
      const dashProgress = THREE.MathUtils.clamp(
        (PLAYER.DASH_DURATION_MS - this.dashMsLeft) / PLAYER.DASH_DURATION_MS,
        0,
        1
      );
      const seqIdx = Math.min(
        this._dashFrameSequence.length - 1,
        Math.floor(dashProgress * this._dashFrameSequence.length)
      );
      const nextFrame = this._dashFrameSequence[seqIdx];
      if (nextFrame !== this._dashFrameIndex) {
        this._dashFrameIndex = nextFrame;
        this._mat.map = this._dashTextures[this._dashFrameIndex];
        this._mat.needsUpdate = true;
      }
      return;
    }

    this._dashFrameIndex = -1;
    if (!this._idleTextures || this._idleTextures.length < 2) return;

    if (!this.grounded && this._jumpTextures?.length >= 2) {
      // Key poses: frame 0 while ascending/takeoff, frame 1 while descending.
      const jumpFrame = this.vel.y >= 0 ? 0 : 1;
      if (this._mat.map !== this._jumpTextures[jumpFrame]) {
        this._mat.map = this._jumpTextures[jumpFrame];
        this._mat.needsUpdate = true;
      }
      return;
    }

    // Grounded + moving horizontally: cycle the walk frames. Threshold keeps
    // tiny residual velocity (deceleration tail) from triggering a walk.
    const moving = Math.abs(this.vel.x) > 0.6;
    if (moving && this._walkTextures?.length >= 2) {
      if (this._mat.map !== this._walkTextures[this._walkFrameIndex]) {
        this._mat.map = this._walkTextures[this._walkFrameIndex];
        this._mat.needsUpdate = true;
      }
      this._walkFrameTimerMs += dtMs;
      while (this._walkFrameTimerMs >= this._walkFrameDurationMs) {
        this._walkFrameTimerMs -= this._walkFrameDurationMs;
        this._walkFrameIndex = (this._walkFrameIndex + 1) % this._walkTextures.length;
        this._mat.map = this._walkTextures[this._walkFrameIndex];
        this._mat.needsUpdate = true;
      }
      return;
    }
    // Reset so the next walk starts on the first stride.
    this._walkFrameIndex = 0;
    this._walkFrameTimerMs = 0;

    if (this._mat.map !== this._idleTextures[this._idleFrameIndex]) {
      this._mat.map = this._idleTextures[this._idleFrameIndex];
      this._mat.needsUpdate = true;
    }
    this._idleFrameTimerMs += dtMs;
    while (this._idleFrameTimerMs >= this._idleFrameDurationMs) {
      this._idleFrameTimerMs -= this._idleFrameDurationMs;
      this._idleFrameIndex = (this._idleFrameIndex + 1) % this._idleTextures.length;
      this._mat.map = this._idleTextures[this._idleFrameIndex];
      this._mat.needsUpdate = true;
    }
  }

  _probeWall(physics, dir) {
    if (this.grounded) return false; // walls below feet shouldn't count
    const probe = {
      x: this.aabb.x + dir * (this.aabb.w / 2 + PLAYER.WALL_PROBE / 2),
      y: this.aabb.y,
      w: PLAYER.WALL_PROBE,
      h: this.aabb.h * 0.85, // shorter than the player so floors don't register
    };
    return !!physics.overlapAny(probe, this, (s) => s.wallJumpable || s.tag === 'wall');
  }

  _syncMesh() {
    const dashVisualActive = this.dashMsLeft > 0;
    const jumpVisualActive = !this.grounded && !dashVisualActive;
    const renderFacing = dashVisualActive ? (this._dashDir || this.facing) : this.facing;
    const stateScale = dashVisualActive
      ? this._dashVisualScaleMult
      : (jumpVisualActive ? this._jumpVisualScaleMult : 1);
    const stateYOffset = dashVisualActive
      ? this._dashVisualYOffset
      : (jumpVisualActive ? this._jumpVisualYOffset : 0);
    const sx = this._visualScaleX * stateScale;
    const sy = this._visualScaleY * stateScale;

    this.mesh.position.x = this.aabb.x;
    this.mesh.position.y = this.aabb.y + this._visualYOffset + stateYOffset;
    this.mesh.scale.x = renderFacing >= 0 ? sx : -sx;
    this.mesh.scale.y = sy;
  }

  // Fires a player arrow if ammo > 0 and not mid-dash. Aim:
  //   - default: horizontal in facing direction
  //   - up/down (held) combine with horizontal for diagonals or straight verticals
  //   - down is only honored mid-air so you can't accidentally shoot the ground
  _tryShoot(game, input) {
    if (this.ammo <= 0) return;
    if (this.dashMsLeft > 0) return;

    let ax = 0, ay = 0;
    if (input.held.left)  ax -= 1;
    if (input.held.right) ax += 1;
    if (input.held.up)    ay += 1;
    if (input.held.down && !this.grounded) ay -= 1;

    if (ax === 0 && ay === 0) ax = this.facing || 1;

    const mag = Math.hypot(ax, ay) || 1;
    const nx = ax / mag;
    const ny = ay / mag;
    const offsetX = Math.abs(nx) > 0.01 ? Math.sign(nx) * (this.aabb.w / 2 + 0.25) : 0;
    const offsetY = Math.abs(ny) > 0.5 ? Math.sign(ny) * (this.aabb.h / 2 + 0.05) : 0;

    const arrow = new Arrow({
      x: this.aabb.x + offsetX,
      y: this.aabb.y + offsetY,
      vx: nx * PLAYER.ARROW_SPEED,
      vy: ny * PLAYER.ARROW_SPEED,
      source: 'player',
    });
    game.entities.add(arrow);
    this.ammo = Math.max(0, this.ammo - 1);
  }

  // Apply damage. fromDir = sign of (source.x - player.x): +1 means source is
  // to the right, knockback pushes player left. Ignored during iframes or
  // while dashing (dash is treated as invulnerable per dev plan).
  damage(fromDir = 1) {
    if (this.godMode) return false;
    if (this.iframeMs > 0) return false;
    if (this.dashMsLeft > 0) return false;
    this.hp = Math.max(0, this.hp - 1);
    this.iframeMs = PLAYER.IFRAME_MS;
    this.vel.x = -Math.sign(fromDir || 1) * PLAYER.KNOCKBACK_VX;
    this.vel.y = PLAYER.KNOCKBACK_VY;
    this.dashMsLeft = 0;
    this.wallStickMs = 0;
    return true;
  }

  refillHp() {
    this.hp = this.maxHp;
    this.iframeMs = 0;
  }

  refillAmmo() {
    this.ammo = this.maxAmmo;
  }
}

function approach(current, target, maxDelta) {
  if (current < target) return Math.min(current + maxDelta, target);
  if (current > target) return Math.max(current - maxDelta, target);
  return current;
}
