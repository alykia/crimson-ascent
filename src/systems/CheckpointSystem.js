// Tracks the current respawn point. Phase 1 = spawn only. Phase 8 = sticky
// checkpoints that activate on touch and reset enemies/hazards on death.
export class CheckpointSystem {
  constructor() {
    this.spawn = { x: 0, y: 2 };
    this.active = null;
  }

  setSpawn(x, y) {
    this.spawn = { x, y };
  }

  activate(checkpoint) {
    if (this.active === checkpoint) return;
    if (this.active && this.active.setActive) this.active.setActive(false);
    this.active = checkpoint;
    if (checkpoint && checkpoint.setActive) checkpoint.setActive(true);
  }

  respawnPoint() {
    if (this.active) return { x: this.active.aabb.x, y: this.active.aabb.y };
    return { x: this.spawn.x, y: this.spawn.y };
  }
}
