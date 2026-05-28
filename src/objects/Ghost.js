import * as THREE from 'three';

// Tiny FX entity: a mesh that fades out and removes itself.
// Used by the dash trail. Shares the source geometry (no alloc) and owns
// its own material so it can fade independently.
export class Ghost {
  constructor(geometry, colorHex, position, lifeMs = 240, startOpacity = 0.55) {
    this.tag = 'fx';
    this._material = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: startOpacity,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geometry, this._material);
    this.mesh.position.copy(position);
    this._life = lifeMs;
    this._max = lifeMs;
    this._startOpacity = startOpacity;
  }
  update(dt, game) {
    this._life -= dt * 1000;
    if (this._life <= 0) {
      this._material.dispose();
      game.entities.remove(this);
      return;
    }
    this._material.opacity = (this._life / this._max) * this._startOpacity;
  }
}
