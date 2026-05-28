import { ENEMY } from '../config/constants.js';
import { Enemy } from './Enemy.js';

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
  }

  update(dt, _game) {
    if (this.dead) return;
    this._t += dt;

    this.aabb.y = this._baseY + Math.sin(this._t * ENEMY.FLYER_FREQUENCY * Math.PI * 2) * ENEMY.FLYER_AMPLITUDE;
    this.aabb.x += this._dir * ENEMY.FLYER_PATROL_SPEED * dt;
    if (this.aabb.x <= this._minX) { this.aabb.x = this._minX; this._dir = +1; }
    else if (this.aabb.x >= this._maxX) { this.aabb.x = this._maxX; this._dir = -1; }

    this._syncMesh();
  }

  onReset() {
    this._t = 0;
    this._dir = 1;
  }
}
