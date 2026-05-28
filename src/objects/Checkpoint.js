import * as THREE from 'three';
import { COLORS } from '../config/colors.js';
import { Physics } from '../systems/Physics.js';

// Glowing blue box. Player touch activates it (sticky — survives respawn).
// Activation deactivates the previously active checkpoint via CheckpointSystem.
// Per dev plan: only restores position + HP; we also reset enemies / hazards
// via the existing onPlayerRespawn pass in Game.respawn.
export class Checkpoint {
  constructor(opts) {
    this.tag = 'checkpoint';
    this.solid = false;
    this.aabb = { x: opts.x, y: opts.y, w: 0.8, h: 1.4 };
    this.active = false;

    const geo = new THREE.BoxGeometry(this.aabb.w, this.aabb.h, 0.3);
    this._mat = new THREE.MeshBasicMaterial({ color: COLORS.CHECKPOINT });
    this.mesh = new THREE.Mesh(geo, this._mat);
    this.mesh.position.set(opts.x, opts.y, 0.35);
    this._t = 0;
  }

  setActive(v) {
    this.active = v;
    this._mat.color.setHex(v ? COLORS.CHECKPOINT_ACTIVE : COLORS.CHECKPOINT);
    if (!v) this.mesh.scale.set(1, 1, 1);
  }

  update(dt, game) {
    this._t += dt;
    if (this.active) {
      const s = 1 + Math.sin(this._t * 5) * 0.05;
      this.mesh.scale.set(s, s, 1);
    }
    if (game.player && !this.active && Physics.overlap(this.aabb, game.player.aabb)) {
      game.checkpoints.activate(this);
    }
  }

  onPlayerRespawn() {
    // Sticky: do nothing. Active flag persists across deaths.
    this._t = 0;
  }
}
