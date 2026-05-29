import * as THREE from 'three';
import { ENEMY, WORLD } from '../config/constants.js';
import { Enemy } from './Enemy.js';
import { Arrow } from './Arrow.js';
import archerSpriteUrl from '../assets/T_EnemyArcher_Sprite.png';

let archerTextures = null;

function getArcherTextures() {
  if (archerTextures) return archerTextures;

  const right = new THREE.TextureLoader().load(archerSpriteUrl);
  right.magFilter = THREE.NearestFilter;
  right.minFilter = THREE.NearestFilter;
  right.colorSpace = THREE.SRGBColorSpace;
  right.wrapS = THREE.ClampToEdgeWrapping;
  right.wrapT = THREE.ClampToEdgeWrapping;

  // Texture-space mirror for left-facing variant (more reliable than
  // negative sprite scaling across render paths).
  const left = right.clone();
  left.needsUpdate = true;
  left.repeat.x = -1;
  left.offset.x = 1;
  left.wrapS = THREE.RepeatWrapping;
  left.wrapT = THREE.ClampToEdgeWrapping;

  archerTextures = { right, left };
  return archerTextures;
}

// Stationary turret. Periodically fires a horizontal arrow toward the player.
// Dash always executes it on contact.
export class Archer extends Enemy {
  constructor(opts) {
    super({ x: opts.x, y: opts.y, w: ENEMY.ARCHER_WIDTH, h: ENEMY.ARCHER_HEIGHT });
    this.tag = 'archer';
    this.requireWeakened = false;
    this._initialFireMs = ENEMY.ARCHER_FIRE_INTERVAL_MS * 0.5;
    this._fireMs = this._initialFireMs;
    this._initialFacing = opts.dir ?? -1;
    this._facing = this._initialFacing;

    // Replace Enemy placeholder cube with archer sprite.
    this.mesh.geometry?.dispose();
    this._mat.dispose();
    this._mat = new THREE.SpriteMaterial({
      map: getArcherTextures().right,
      color: this._color,
      transparent: true,
      alphaTest: 0.08,
      depthWrite: false,
    });
    this.mesh = new THREE.Sprite(this._mat);
    this._spriteScaleX = this.aabb.w * 1.55;
    this._spriteScaleY = this.aabb.h * 1.52;
    // Small upward bias so feet sit naturally on platform tops.
    this._spriteYOffset = 0.08;
    this.mesh.scale.set(this._spriteScaleX, this._spriteScaleY, 1);
    this.mesh.position.set(this.aabb.x, this.aabb.y + this._spriteYOffset, 0.4);
  }

  update(dt, game) {
    if (this.dead) return;

    // Gravity so it sits on whatever solid is under it at level load.
    this.vel.y += WORLD.GRAVITY * dt;
    if (this.vel.y < WORLD.MAX_FALL_SPEED) this.vel.y = WORLD.MAX_FALL_SPEED;
    this.vel.x = 0;
    game.physics.moveAndCollide(this, dt);

    const p = game.player;
    if (p) {
      // Keep sprite orientation synced with target side so the bow
      // visually points where shots are aimed.
      this._facing = Math.sign(p.aabb.x - this.aabb.x) || this._facing;
    }

    this._fireMs -= dt * 1000;
    if (this._fireMs <= 0) {
      this._fireMs = ENEMY.ARCHER_FIRE_INTERVAL_MS;
      if (p) {
        const dir = this._facing || -1;
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
    this._facing = this._initialFacing;
  }

  _syncMesh() {
    this.mesh.position.x = this.aabb.x;
    this.mesh.position.y = this.aabb.y + this._spriteYOffset;
    this.mesh.scale.set(this._spriteScaleX, this._spriteScaleY, 1);
    const textures = getArcherTextures();
    this._mat.map = this._facing >= 0 ? textures.right : textures.left;
    this._mat.needsUpdate = true;
  }
}
