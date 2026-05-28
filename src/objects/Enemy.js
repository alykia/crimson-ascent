import * as THREE from 'three';
import { COLORS } from '../config/colors.js';
import { ENEMY } from '../config/constants.js';

// Base for all enemy types. Subclasses set their own hitbox + update logic.
// Combat rules (resolved in Game._resolveCombat):
//   - dashing player + (requireWeakened false OR weakened) -> enemy dies, dash refreshed
//   - other contact (player not dashing OR enemy not vulnerable) -> player takes damage
//
// Per dev plan: enemies stay dead until room reset / player death. onPlayerRespawn
// (called by Game.respawn) revives them.
export class Enemy {
  constructor({ x, y, w, h, color = COLORS.ENEMY }) {
    this.tag = 'enemy';
    this.isEnemy = true;
    this.solid = false;
    this.requireWeakened = false;
    this.weakened = false;
    this.dead = false;
    this.arrowHpMax = ENEMY.BASIC_ARROW_HP;
    this.arrowHp = this.arrowHpMax;

    this.spawn = { x, y };
    this.aabb = { x, y, w, h };
    this.vel = { x: 0, y: 0 };

    this._color = color;
    const geo = new THREE.BoxGeometry(w, h, 0.5);
    this._mat = new THREE.MeshBasicMaterial({ color });
    this.mesh = new THREE.Mesh(geo, this._mat);
    this.mesh.position.set(x, y, 0.4);
  }

  weaken() {
    if (this.weakened || this.dead) return;
    this.weakened = true;
    this._mat.color.setHex(COLORS.ENEMY_WEAKENED);
  }

  kill() {
    if (this.dead) return;
    this.dead = true;
    this.mesh.visible = false;
  }

  // Player arrows chip enemies down; at 0 HP they die. For enemies that require
  // weakening, first hit still applies weakened state so dash-kill rules remain.
  takeArrowHit() {
    if (this.dead) return;
    if (this.requireWeakened && !this.weakened) this.weaken();
    this.arrowHp = Math.max(0, this.arrowHp - ENEMY.ARROW_DAMAGE);
    if (this.arrowHp <= 0) this.kill();
  }

  onPlayerRespawn() {
    this.dead = false;
    this.weakened = false;
    this.arrowHp = this.arrowHpMax;
    this.aabb.x = this.spawn.x;
    this.aabb.y = this.spawn.y;
    this.vel.x = 0;
    this.vel.y = 0;
    this.mesh.visible = true;
    this._mat.color.setHex(this._color);
    if (this.onReset) this.onReset();
    this._syncMesh();
  }

  _syncMesh() {
    this.mesh.position.x = this.aabb.x;
    this.mesh.position.y = this.aabb.y;
  }
}
