import { ENEMY, WORLD } from '../config/constants.js';
import { Enemy } from './Enemy.js';
import { Arrow } from './Arrow.js';

// Stationary turret. Periodically fires a horizontal arrow toward the player.
// Dash always executes it on contact.
export class Archer extends Enemy {
  constructor(opts) {
    super({ x: opts.x, y: opts.y, w: ENEMY.ARCHER_WIDTH, h: ENEMY.ARCHER_HEIGHT });
    this.tag = 'archer';
    this.requireWeakened = false;
    this._initialFireMs = ENEMY.ARCHER_FIRE_INTERVAL_MS * 0.5;
    this._fireMs = this._initialFireMs;
    this._facing = opts.dir ?? -1;
  }

  update(dt, game) {
    if (this.dead) return;

    // Gravity so it sits on whatever solid is under it at level load.
    this.vel.y += WORLD.GRAVITY * dt;
    if (this.vel.y < WORLD.MAX_FALL_SPEED) this.vel.y = WORLD.MAX_FALL_SPEED;
    this.vel.x = 0;
    game.physics.moveAndCollide(this, dt);

    this._fireMs -= dt * 1000;
    if (this._fireMs <= 0) {
      this._fireMs = ENEMY.ARCHER_FIRE_INTERVAL_MS;
      const p = game.player;
      if (p) {
        const dir = Math.sign(p.aabb.x - this.aabb.x) || -1;
        this._facing = dir;
        const arrow = new Arrow({
          x: this.aabb.x + dir * (this.aabb.w / 2 + 0.25),
          y: this.aabb.y,
          vx: dir * ENEMY.ARCHER_PROJECTILE_SPEED,
          vy: 0,
          source: 'enemy',
        });
        game.entities.add(arrow);
      }
    }

    this._syncMesh();
  }

  onReset() {
    this._fireMs = this._initialFireMs;
  }
}
