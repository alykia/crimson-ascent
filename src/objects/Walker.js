import * as THREE from 'three';
import { ENEMY, WORLD } from '../config/constants.js';
import { Enemy } from './Enemy.js';
import walkerFrame0Url from '../assets/T_Enemy_Walk00.png';
import walkerFrame1Url from '../assets/T_Enemy_Walk01.png';
import walkerFrame2Url from '../assets/T_Enemy_Walk02.png';

let walkerTextures = null;

function getWalkerTextures() {
  if (walkerTextures) return walkerTextures;

  const loader = new THREE.TextureLoader();
  const right = [walkerFrame0Url, walkerFrame1Url, walkerFrame2Url].map((url) => {
    const tex = loader.load(url);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  });

  const left = right.map((src) => {
    const tex = src.clone();
    tex.needsUpdate = true;
    tex.repeat.x = -1;
    tex.offset.x = 1;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  });

  walkerTextures = { right, left };
  return walkerTextures;
}

// Ground patroller. Reverses at walls and ledges. Dies to a plain dash.
export class Walker extends Enemy {
  constructor(opts) {
    super({ x: opts.x, y: opts.y, w: ENEMY.WALKER_WIDTH, h: ENEMY.WALKER_HEIGHT });
    this.tag = 'walker';
    this.requireWeakened = false;
    this._spawnDir = opts.dir ?? -1;
    this._dir = this._spawnDir;
    this.vel.x = this._dir * ENEMY.WALKER_SPEED;

    this._walkerTextures = getWalkerTextures();
    this._frameIndex = 0;
    this._frameTimerMs = 0;
    this._frameDurationMs = 120;

    // Replace Enemy placeholder cube with animated walker sprite.
    this.mesh.geometry?.dispose();
    this._mat.dispose();
    this._mat = new THREE.SpriteMaterial({
      map: this._walkerTextures.left[0],
      color: this._color,
      transparent: true,
      alphaTest: 0.08,
      depthWrite: false,
    });
    this.mesh = new THREE.Sprite(this._mat);
    this._spriteScaleX = this.aabb.w * 1.8;
    this._spriteScaleY = this.aabb.h * 1.8;
    this._spriteYOffset = 0.14;
    this.mesh.scale.set(this._spriteScaleX, this._spriteScaleY, 1);
    this.mesh.position.set(this.aabb.x, this.aabb.y + this._spriteYOffset, 0.4);
  }

  update(dt, game) {
    if (this.dead) return;

    this.vel.y += WORLD.GRAVITY * dt;
    if (this.vel.y < WORLD.MAX_FALL_SPEED) this.vel.y = WORLD.MAX_FALL_SPEED;
    this.vel.x = this._dir * ENEMY.WALKER_SPEED;

    const flags = game.physics.moveAndCollide(this, dt);

    if (flags.wallLeftHit)        { this._dir = +1; }
    else if (flags.wallRightHit)  { this._dir = -1; }

    // Edge probe: if standing on ground and the tile in front has none, turn.
    if (flags.groundedHit) {
      const probe = {
        x: this.aabb.x + this._dir * (this.aabb.w / 2 + 0.1),
        y: this.aabb.y - this.aabb.h / 2 - 0.15,
        w: 0.12, h: 0.12,
      };
      if (!game.physics.overlapAny(probe)) this._dir = -this._dir;
    }

    this._updateAnimation(dt * 1000);
    this._syncMesh();
  }

  onReset() {
    this._dir = this._spawnDir;
    this.vel.x = this._dir * ENEMY.WALKER_SPEED;
    this._frameIndex = 0;
    this._frameTimerMs = 0;
    this._mat.map = this._dir >= 0 ? this._walkerTextures.right[0] : this._walkerTextures.left[0];
    this._mat.needsUpdate = true;
  }

  _updateAnimation(dtMs) {
    this._frameTimerMs += dtMs;
    while (this._frameTimerMs >= this._frameDurationMs) {
      this._frameTimerMs -= this._frameDurationMs;
      this._frameIndex = (this._frameIndex + 1) % this._walkerTextures.right.length;
    }
  }

  _syncMesh() {
    this.mesh.position.x = this.aabb.x;
    this.mesh.position.y = this.aabb.y + this._spriteYOffset;
    this.mesh.scale.set(this._spriteScaleX, this._spriteScaleY, 1);
    const atlas = this._dir >= 0 ? this._walkerTextures.right : this._walkerTextures.left;
    this._mat.map = atlas[this._frameIndex];
    this._mat.needsUpdate = true;
  }
}
