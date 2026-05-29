import * as THREE from 'three';
import { Physics } from '../systems/Physics.js';
import arrowSpriteUrl from '../assets/T_arrow_sprite.png';

let arrowTexture = null;

function getArrowTexture() {
  if (arrowTexture) return arrowTexture;
  arrowTexture = new THREE.TextureLoader().load(arrowSpriteUrl);
  // Pixel-art friendly filtering to keep the sprite crisp.
  arrowTexture.magFilter = THREE.NearestFilter;
  arrowTexture.minFilter = THREE.NearestFilter;
  arrowTexture.colorSpace = THREE.SRGBColorSpace;
  return arrowTexture;
}

// Yellow ammo pickup. Bobs subtly for readability. Consumed on player overlap;
// restored on player respawn (room reset).
export class ArrowPickup {
  constructor(opts) {
    this.tag = 'arrowPickup';
    this.spawn = { x: opts.x, y: opts.y };
    this.amount = opts.amount ?? 3;
    this.consumed = false;
    this.aabb = { x: opts.x, y: opts.y, w: 0.55, h: 0.55 };

    this._material = new THREE.SpriteMaterial({
      map: getArrowTexture(),
      transparent: true,
      alphaTest: 0.1,
      depthWrite: false,
    });
    this.mesh = new THREE.Sprite(this._material);
    this.mesh.scale.set(0.88, 0.88, 1);
    this.mesh.position.set(opts.x, opts.y, 0.45);
    this._t = 0;
  }

  update(dt, game) {
    if (this.consumed) return;
    this._t += dt;
    this.mesh.position.y = this.spawn.y + Math.sin(this._t * 3) * 0.08;
    this.aabb.y = this.mesh.position.y;

    if (game.player && Physics.overlap(this.aabb, game.player.aabb)) {
      game.player.ammo = Math.min(game.player.maxAmmo, game.player.ammo + this.amount);
      this.consumed = true;
      this.mesh.visible = false;
    }
  }

  onPlayerRespawn() {
    this.consumed = false;
    this.mesh.visible = true;
    this._t = 0;
    this.aabb.x = this.spawn.x;
    this.aabb.y = this.spawn.y;
    this.mesh.position.set(this.spawn.x, this.spawn.y, 0.45);
  }

  onRemoved() {
    this._material?.dispose();
  }
}
