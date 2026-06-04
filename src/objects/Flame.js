import * as THREE from 'three';
import { COLORS } from '../config/colors.js';
import { BOSS } from '../config/constants.js';
import { Physics } from '../systems/Physics.js';

// ---- SWAP-IN SLOT FOR A FINAL FLAME SPRITE ------------------------------
// Set to an imported PNG url to use real flame art:
//   import flameUrl from '../assets/T_BossFlame_sprite.png';
//   const bossFlameSprite = flameUrl;
const bossFlameSprite = null;
// -------------------------------------------------------------------------

let flameTexture = null;
function getFlameTexture() {
  if (!bossFlameSprite) return null;
  if (flameTexture) return flameTexture;
  flameTexture = new THREE.TextureLoader().load(bossFlameSprite);
  flameTexture.magFilter = THREE.NearestFilter;
  flameTexture.minFilter = THREE.NearestFilter;
  flameTexture.colorSpace = THREE.SRGBColorSpace;
  return flameTexture;
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

    const tex = getFlameTexture();
    this._mat = new THREE.SpriteMaterial({
      map: tex,
      color: COLORS.BOSS_FLAME,
      transparent: true,
      alphaTest: tex ? 0.1 : 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.mesh = new THREE.Sprite(this._mat);
    this.mesh.scale.set(BOSS.FLAME_W * 1.6, BOSS.FLAME_H * 1.6, 1);
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

    // Flicker for a bit of life.
    const flick = 1 + Math.sin(this._t * 26) * 0.12;
    this.mesh.scale.set(BOSS.FLAME_W * 1.6 * flick, BOSS.FLAME_H * 1.6 * flick, 1);
    this.mesh.position.x = this.aabb.x;
    this.mesh.position.y = this.aabb.y;
  }

  // Cleared when the player dies/respawns so old flames never linger.
  onPlayerRespawn() {
    this._removeRequested = true;
  }

  onRemoved() {
    this._mat?.dispose();
  }
}
