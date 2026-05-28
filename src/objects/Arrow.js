import * as THREE from 'three';
import { COLORS } from '../config/colors.js';
import { PLAYER } from '../config/constants.js';
import { Physics } from '../systems/Physics.js';

// Projectile shared by player and enemies. `source` is 'player' or 'enemy'.
//   - 'player' arrows weaken the first enemy they touch
//   - 'enemy' arrows damage the player on contact
// Either dies on first solid (platform/wall) hit, on target hit, or after
// PLAYER.ARROW_LIFETIME_MS.
export class Arrow {
  constructor({ x, y, vx, vy, source = 'player' }) {
    this.tag = 'arrow';
    this.source = source;
    this.aabb = { x, y, w: 0.42, h: 0.18 };
    this.vel = { x: vx, y: vy };
    this._lifeMs = PLAYER.ARROW_LIFETIME_MS;

    const color = source === 'player' ? COLORS.ARROW : COLORS.HAZARD;
    const geo = new THREE.BoxGeometry(this.aabb.w, this.aabb.h, 0.3);
    const mat = new THREE.MeshBasicMaterial({ color });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, y, 0.45);
  }

  update(dt, game) {
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

    if (this.source === 'enemy' && game.player) {
      if (Physics.overlap(this.aabb, game.player.aabb)) {
        const dir = Math.sign(this.aabb.x - game.player.aabb.x) || 1;
        if (game.player.damage(dir)) {
          game.entities.remove(this);
          return;
        }
      }
    } else if (this.source === 'player') {
      const enemies = game.entities.filter(e => e.isEnemy && !e.dead);
      for (const e of enemies) {
        if (Physics.overlap(this.aabb, e.aabb)) {
          if (typeof e.takeArrowHit === 'function') e.takeArrowHit();
          else e.weaken();
          game.entities.remove(this);
          return;
        }
      }
    }

    this.mesh.position.x = this.aabb.x;
    this.mesh.position.y = this.aabb.y;
  }
}
