import * as THREE from 'three';
import { COLORS } from '../config/colors.js';

// ---- SWAP-IN SLOT FOR A FINAL IMPACT/WARNING SPRITE ---------------------
// Set to an imported PNG url to use real art for the dive telegraph:
//   import warnUrl from '../assets/T_BossImpactWarning_sprite.png';
//   const bossImpactWarningSprite = warnUrl;
const bossImpactWarningSprite = null;
// -------------------------------------------------------------------------

let ringTexture = null;
function getRingTexture() {
  if (bossImpactWarningSprite) {
    if (ringTexture) return ringTexture;
    ringTexture = new THREE.TextureLoader().load(bossImpactWarningSprite);
    ringTexture.magFilter = THREE.NearestFilter;
    ringTexture.minFilter = THREE.NearestFilter;
    ringTexture.colorSpace = THREE.SRGBColorSpace;
    return ringTexture;
  }
  if (ringTexture) return ringTexture;
  // Canvas placeholder: a bold target ring.
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(64, 64, 50, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(64, 64, 26, 0, Math.PI * 2);
  ctx.stroke();
  ringTexture = new THREE.CanvasTexture(c);
  ringTexture.magFilter = THREE.NearestFilter;
  ringTexture.minFilter = THREE.NearestFilter;
  ringTexture.colorSpace = THREE.SRGBColorSpace;
  ringTexture.needsUpdate = true;
  return ringTexture;
}

const PHASE = { TELEGRAPH: 0, DANGER: 1 };

// Dive telegraph + ground-slam danger zone. Owns BOTH the readable warning and
// the brief damage window so the dive attack is self-contained:
//   - TELEGRAPH: pulsing ring on the ground, NO damage (player can react).
//   - DANGER: short window where the player takes damage if inside `radius`.
// The boss spawns this at the dive target and visually slams in sync.
export class ImpactWarning {
  constructor({ x, y, radius = 3, telegraphMs = 850, lingerMs = 260 }) {
    this.tag = 'impactWarning';
    this.solid = false;
    this.aabb = { x, y, w: radius * 2, h: 0.8 };
    this._x = x;
    this._y = y;
    this._radius = radius;
    this._telegraphMs = telegraphMs;
    this._lingerMs = lingerMs;
    this._phase = PHASE.TELEGRAPH;
    this._t = 0;

    this._mat = new THREE.SpriteMaterial({
      map: getRingTexture(),
      color: COLORS.BOSS_WARNING,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.5,
    });
    this.mesh = new THREE.Sprite(this._mat);
    // Flat-looking marker sitting on the ground (slightly wider than tall).
    this.mesh.scale.set(radius * 2, radius * 1.1, 1);
    this.mesh.position.set(x, y, 0.2);
  }

  update(dt, game) {
    if (this._removeRequested) {
      game.entities.remove(this);
      return;
    }
    const dtMs = dt * 1000;
    this._t += dt;

    if (this._phase === PHASE.TELEGRAPH) {
      this._telegraphMs -= dtMs;
      // Pulse opacity so it reads as a charging warning. No damage yet.
      this._mat.opacity = 0.35 + Math.abs(Math.sin(this._t * 7)) * 0.4;
      if (this._telegraphMs <= 0) {
        this._phase = PHASE.DANGER;
        this._mat.opacity = 0.95;
      }
      return;
    }

    // DANGER phase: damage the player if they are inside the slam radius.
    this._lingerMs -= dtMs;
    this._mat.opacity = Math.max(0, this._lingerMs / 260) * 0.95;
    const p = game.player;
    if (p) {
      const dx = Math.abs(p.aabb.x - this._x);
      const dy = Math.abs(p.aabb.y - this._y);
      if (dx <= this._radius && dy <= this._radius) {
        const dir = Math.sign(p.aabb.x - this._x) || 1;
        p.damage(-dir); // player i-frames stop repeat hits
      }
    }
    if (this._lingerMs <= 0) game.entities.remove(this);
  }

  // True once the danger window is active (boss uses this to time its dive fx).
  get isDangerous() {
    return this._phase === PHASE.DANGER;
  }

  onPlayerRespawn() {
    this._removeRequested = true;
  }

  onRemoved() {
    this._mat?.dispose();
  }
}
