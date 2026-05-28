import * as THREE from 'three';
import { COLORS } from '../config/colors.js';
import { HAZARD } from '../config/constants.js';
import { Physics } from '../systems/Physics.js';

// FallingSpike — sits in place, watches a trigger zone below it, drops on
// entry after a brief warning blink, then resets after SPIKE_RESET_MS.
// Deals damage on contact in WARNING (no), FALLING, and SPENT states.
const STATE = { IDLE: 0, WARNING: 1, FALLING: 2, SPENT: 3 };

export class FallingSpike {
  constructor({ x, y, w = 1, h = 1, triggerH = 6 }) {
    this.tag = 'hazard';
    this.solid = false;
    this.aabb = { x, y, w, h };
    this.vel = { x: 0, y: 0 };
    this.spawn = { x, y };

    this._triggerH = triggerH;
    this._state = STATE.IDLE;
    this._timer = 0;

    const geo = new THREE.BoxGeometry(w, h, 0.5);
    this._mat = new THREE.MeshBasicMaterial({ color: COLORS.HAZARD });
    this.mesh = new THREE.Mesh(geo, this._mat);
    this.mesh.position.set(x, y, 0.3);
  }

  update(dt, game) {
    const dtMs = dt * 1000;
    const p = game.player;

    switch (this._state) {
      case STATE.IDLE: {
        if (!p) break;
        const trigger = {
          x: this.aabb.x,
          y: this.aabb.y - this._triggerH / 2 - this.aabb.h / 2,
          w: this.aabb.w + HAZARD.SPIKE_TRIGGER_PAD * 2,
          h: this._triggerH,
        };
        if (Physics.overlap(trigger, p.aabb)) {
          this._state = STATE.WARNING;
          this._timer = HAZARD.SPIKE_WARNING_MS;
        }
        break;
      }
      case STATE.WARNING: {
        this._timer -= dtMs;
        // Blink: square wave every 80ms.
        const blink = (Math.floor(this._timer / 80) & 1) === 0;
        this._mat.color.setHex(blink ? COLORS.HAZARD_WARNING : COLORS.HAZARD);
        if (this._timer <= 0) {
          this._state = STATE.FALLING;
          this.vel.y = 0;
          this._mat.color.setHex(COLORS.HAZARD);
        }
        break;
      }
      case STATE.FALLING: {
        this.vel.y = -HAZARD.SPIKE_FALL_SPEED;
        const flags = game.physics.moveAndCollide(this, dt);
        this._tryDamagePlayer(p);
        if (flags.groundedHit) {
          this._state = STATE.SPENT;
          this._timer = HAZARD.SPIKE_RESET_MS;
        }
        break;
      }
      case STATE.SPENT: {
        this._timer -= dtMs;
        this._tryDamagePlayer(p);
        if (this._timer <= 0) this._resetToIdle();
        break;
      }
    }

    this._syncMesh();
  }

  _tryDamagePlayer(p) {
    if (!p) return;
    if (!Physics.overlap(this.aabb, p.aabb)) return;
    // Falling spike usually contacts from above — knockback sideways using
    // x-difference if any, falling back to opposite of player facing.
    let fromDir = Math.sign(this.aabb.x - p.aabb.x);
    if (fromDir === 0) fromDir = -(p.facing || 1);
    p.damage(fromDir);
  }

  _resetToIdle() {
    this.aabb.x = this.spawn.x;
    this.aabb.y = this.spawn.y;
    this.vel.x = 0;
    this.vel.y = 0;
    this._state = STATE.IDLE;
    this._timer = 0;
    this._mat.color.setHex(COLORS.HAZARD);
  }

  onPlayerRespawn() {
    this._resetToIdle();
    this._syncMesh();
  }

  _syncMesh() {
    this.mesh.position.x = this.aabb.x;
    this.mesh.position.y = this.aabb.y;
  }
}
