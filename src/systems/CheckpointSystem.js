// Tracks the current respawn point. Checkpoints are one-shot activations:
// once touched, they stay visibly active for the rest of the current run.
// `active` means "latest respawn point", not "the only lit checkpoint".
export class CheckpointSystem {
  constructor() {
    this.spawn = { x: 0, y: 2 };
    this.active = null;
    this.activated = new Set();
  }

  setSpawn(x, y) {
    this.spawn = { x, y };
  }

  // Clear the current respawn checkpoint. Called when (re)loading a level so
  // checkpoint state never leaks across levels or fresh game runs.
  reset() {
    for (const checkpoint of this.activated) {
      if (checkpoint?.setActive) checkpoint.setActive(false);
    }
    this.activated.clear();
    this.active = null;
  }

  activate(checkpoint) {
    if (!checkpoint) return;
    if (this.activated.has(checkpoint)) return;
    this.activated.add(checkpoint);
    this.active = checkpoint;
    if (checkpoint.setActive) checkpoint.setActive(true);
  }

  respawnPoint() {
    if (this.active) return { x: this.active.aabb.x, y: this.active.aabb.y };
    return { x: this.spawn.x, y: this.spawn.y };
  }
}
