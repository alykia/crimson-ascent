import * as THREE from 'three';
import { ENEMY } from '../config/constants.js';
import { Enemy } from './Enemy.js';
import flyerFrame0Url from '../assets/T_Flyer_Flying00.png';
import flyerFrame1Url from '../assets/T_Flyer_Flying01.png';

let flyerTextures = null;

function getFlyerTextures() {
  if (flyerTextures) return flyerTextures;
  const loader = new THREE.TextureLoader();
  flyerTextures = [flyerFrame0Url, flyerFrame1Url].map((url) => {
    const tex = loader.load(url);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  });
  return flyerTextures;
}

// Airborne patroller. Ignores gravity. Bobs sinusoidally on Y, patrols on X
// between [spawnX - range, spawnX + range]. Dash always executes it on contact.
export class Flyer extends Enemy {
  constructor(opts) {
    super({ x: opts.x, y: opts.y, w: ENEMY.FLYER_WIDTH, h: ENEMY.FLYER_HEIGHT });
    this.tag = 'flyer';
    this.requireWeakened = false;
    this._t = 0;
    this._baseY = opts.y;
    this._range = opts.range ?? 2.5;
    this._minX = opts.x - this._range;
    this._maxX = opts.x + this._range;
    this._dir = opts.dir ?? 1;
    this._flyerTextures = getFlyerTextures();
    this._frameIndex = 0;
    this._frameTimerMs = 0;
    this._frameDurationMs = 140;

    // Replace enemy placeholder cube with animated flyer sprite.
    this.mesh.geometry?.dispose();
    this._mat.dispose();
    this._mat = new THREE.SpriteMaterial({
      map: this._flyerTextures[0],
      color: this._color,
      transparent: true,
      alphaTest: 0.08,
      depthWrite: false,
    });
    this.mesh = new THREE.Sprite(this._mat);
    this.mesh.scale.set(this.aabb.w * 2.0, this.aabb.h * 2.0, 1);
    this.mesh.position.set(this.aabb.x, this.aabb.y, 0.4);
  }

  update(dt, _game) {
    if (this.dead) return;
    this._t += dt;

    this.aabb.y = this._baseY + Math.sin(this._t * ENEMY.FLYER_FREQUENCY * Math.PI * 2) * ENEMY.FLYER_AMPLITUDE;
    this.aabb.x += this._dir * ENEMY.FLYER_PATROL_SPEED * dt;
    if (this.aabb.x <= this._minX) { this.aabb.x = this._minX; this._dir = +1; }
    else if (this.aabb.x >= this._maxX) { this.aabb.x = this._maxX; this._dir = -1; }

    this._updateAnimation(dt * 1000);
    this._syncMesh();
  }

  onReset() {
    this._t = 0;
    this._dir = 1;
    this._frameIndex = 0;
    this._frameTimerMs = 0;
    this._mat.map = this._flyerTextures[0];
    this._mat.needsUpdate = true;
  }

  _updateAnimation(dtMs) {
    this._frameTimerMs += dtMs;
    while (this._frameTimerMs >= this._frameDurationMs) {
      this._frameTimerMs -= this._frameDurationMs;
      this._frameIndex = (this._frameIndex + 1) % this._flyerTextures.length;
      this._mat.map = this._flyerTextures[this._frameIndex];
      this._mat.needsUpdate = true;
    }
    const sx = this.aabb.w * 2.0;
    const sy = this.aabb.h * 2.0;
    this.mesh.scale.set(this._dir >= 0 ? sx : -sx, sy, 1);
  }
}
