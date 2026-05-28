import { ENEMY, WORLD } from '../config/constants.js';
import { Enemy } from './Enemy.js';

// Ground patroller. Reverses at walls and ledges. Dies to a plain dash.
export class Walker extends Enemy {
  constructor(opts) {
    super({ x: opts.x, y: opts.y, w: ENEMY.WALKER_WIDTH, h: ENEMY.WALKER_HEIGHT });
    this.tag = 'walker';
    this.requireWeakened = false;
    this._spawnDir = opts.dir ?? -1;
    this._dir = this._spawnDir;
    this.vel.x = this._dir * ENEMY.WALKER_SPEED;
  }

  update(dt, game) {
    if (this.dead) return;

    this.vel.y += WORLD.GRAVITY * dt;
    if (this.vel.y < WORLD.MAX_FALL_SPEED) this.vel.y = WORLD.MAX_FALL_SPEED;
    this.vel.x = this._dir * ENEMY.WALKER_SPEED;

    const flags = game.physics.moveAndCollide(this, dt);

    if (flags.wallLeftHit)        { this._dir = +1; }
    else if (flags.wallRightHit)  { this._dir = -1; }

    // Edge probe: if standing on ground and the tile in front has none, turn.
    if (flags.groundedHit) {
      const probe = {
        x: this.aabb.x + this._dir * (this.aabb.w / 2 + 0.1),
        y: this.aabb.y - this.aabb.h / 2 - 0.15,
        w: 0.12, h: 0.12,
      };
      if (!game.physics.overlapAny(probe)) this._dir = -this._dir;
    }

    this._syncMesh();
  }

  onReset() {
    this._dir = this._spawnDir;
    this.vel.x = this._dir * ENEMY.WALKER_SPEED;
  }
}
