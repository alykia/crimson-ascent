import * as THREE from 'three';
import { BOSS } from '../config/constants.js';
import { Physics } from '../systems/Physics.js';
import fireballFrame0Url from '../assets/T_DragonBoss_Fireball00.png';
import fireballFrame1Url from '../assets/T_DragonBoss_Fireball01.png';
import fireballFrame2Url from '../assets/T_DragonBoss_Fireball02.png';
import fireballFrame3Url from '../assets/T_DragonBoss_Fireball03.png';
import fireballFrame4Url from '../assets/T_DragonBoss_Fireball04.png';
import fireballFrame5Url from '../assets/T_DragonBoss_Fireball05.png';

// ---- SWAP-IN SLOT FOR A FINAL FLAME SPRITE ------------------------------
const FIREBALL_ASPECT = 250 / 166;
const FIREBALL_VISUAL_H = BOSS.FLAME_H * 1.6;
const FIREBALL_VISUAL_W = FIREBALL_VISUAL_H * FIREBALL_ASPECT;
// -------------------------------------------------------------------------

let flameTextures = null;
function getFlameTextures() {
  if (flameTextures) return flameTextures;
  const loader = new THREE.TextureLoader();
  flameTextures = [
    fireballFrame0Url,
    fireballFrame1Url,
    fireballFrame2Url,
    fireballFrame3Url,
    fireballFrame4Url,
    fireballFrame5Url,
  ].map((url) => {
    const tex = loader.load(url);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  });
  return flameTextures;
}

// Boss flame projectile. Travels along a fixed velocity (aimed at the player at
// spawn time). Damages the player on contact, then disappears. Also disappears
// on solid (platform/wall) contact or after its lifetime. Cleared on respawn.
export class Flame {
  constructor({ x, y, vx, vy }) {
    this.tag = 'flame';
    this.solid = false;
    this.aabb = { x, y, w: BOSS.FLAME_W, h: BOSS.FLAME_H };
    this.vel = { x: vx, y: vy };
    this._lifeMs = BOSS.FLAME_LIFETIME_MS;
    this._t = 0;
    this._frameIndex = 0;
    this._frameTimerMs = 0;
    this._frameDurationMs = 75;
    this._textures = getFlameTextures();

    this._mat = new THREE.SpriteMaterial({
      map: this._textures[0],
      color: 0xffffff,
      transparent: true,
      alphaTest: 0.02,
      depthWrite: false,
    });
    this._mat.rotation = Math.atan2(vy, vx);
    this.mesh = new THREE.Sprite(this._mat);
    this.mesh.scale.set(FIREBALL_VISUAL_W, FIREBALL_VISUAL_H, 1);
    this.mesh.position.set(x, y, 0.46);
  }

  update(dt, game) {
    // Backup cleanup path if a respawn flagged us between frames.
    if (this._removeRequested) {
      game.entities.remove(this);
      return;
    }
    this._t += dt;
    this._lifeMs -= dt * 1000;
    if (this._lifeMs <= 0) {
      game.entities.remove(this);
      return;
    }

    this.aabb.x += this.vel.x * dt;
    this.aabb.y += this.vel.y * dt;

    // Hit static geometry?
    if (game.physics.overlapAny(this.aabb)) {
      game.entities.remove(this);
      return;
    }

    // Hit the player?
    const p = game.player;
    if (p && Physics.overlap(this.aabb, p.aabb)) {
      const dir = Math.sign(p.aabb.x - this.aabb.x) || 1;
      // damage() returns false during i-frames/dash; only consume the flame on
      // a landed hit so it doesn't silently vanish through an invulnerable player.
      if (p.damage(-dir)) {
        game.entities.remove(this);
        return;
      }
    }

    this._updateSpriteAnimation(dt * 1000);
    this.mesh.scale.set(FIREBALL_VISUAL_W, FIREBALL_VISUAL_H, 1);
    this.mesh.position.x = this.aabb.x;
    this.mesh.position.y = this.aabb.y;
  }

  _updateSpriteAnimation(dtMs) {
    this._frameTimerMs += dtMs;
    while (this._frameTimerMs >= this._frameDurationMs) {
      this._frameTimerMs -= this._frameDurationMs;
      this._frameIndex = (this._frameIndex + 1) % this._textures.length;
      this._mat.map = this._textures[this._frameIndex];
      this._mat.needsUpdate = true;
    }
  }

  // Cleared when the player dies/respawns so old flames never linger.
  onPlayerRespawn() {
    this._removeRequested = true;
  }

  onRemoved() {
    this._mat?.dispose();
  }
}
