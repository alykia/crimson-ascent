import * as THREE from 'three';
import { Physics } from '../systems/Physics.js';

// ---- SWAP-IN SLOT FOR A FINAL DOOR SPRITE -------------------------------
// No door art exists yet, so we draw a pixel-style placeholder on a canvas.
// To use a real sprite later:
//   1. Drop the PNG into src/assets/ (e.g. T_Door_Sprite.png)
//   2. Uncomment the import and set DOOR_SPRITE_URL to it:
//        import doorUrl from '../assets/T_Door_Sprite.png';
//        const DOOR_SPRITE_URL = doorUrl;
const DOOR_SPRITE_URL = null;
// -------------------------------------------------------------------------

const DEFAULT_W = 1.6;
const DEFAULT_H = 2.6;
const FADE_IN_MS = 420;

let placeholderTexture = null;
let spriteTexture = null;

function getPlaceholderTexture() {
  if (placeholderTexture) return placeholderTexture;
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 156;
  const ctx = c.getContext('2d');

  // Stone arch frame.
  ctx.fillStyle = '#2a2436';
  ctx.fillRect(2, 2, 92, 152);
  // Wooden door body.
  ctx.fillStyle = '#5a3a1e';
  ctx.fillRect(12, 12, 72, 138);
  // Inner panel.
  ctx.fillStyle = '#704a28';
  ctx.fillRect(20, 20, 56, 122);
  // Plank seams.
  ctx.fillStyle = '#3f2a16';
  ctx.fillRect(47, 20, 3, 122);
  ctx.fillRect(20, 70, 56, 3);
  // Iron studs.
  ctx.fillStyle = '#cdb98a';
  for (const sx of [27, 68]) {
    for (const sy of [30, 60, 90, 120]) {
      ctx.fillRect(sx, sy, 5, 5);
    }
  }
  // Handle ring.
  ctx.fillStyle = '#e6d39a';
  ctx.fillRect(60, 82, 7, 7);

  placeholderTexture = new THREE.CanvasTexture(c);
  placeholderTexture.magFilter = THREE.NearestFilter;
  placeholderTexture.minFilter = THREE.NearestFilter;
  placeholderTexture.colorSpace = THREE.SRGBColorSpace;
  placeholderTexture.needsUpdate = true;
  return placeholderTexture;
}

function getDoorTexture() {
  if (!DOOR_SPRITE_URL) return getPlaceholderTexture();
  if (spriteTexture) return spriteTexture;
  spriteTexture = new THREE.TextureLoader().load(DOOR_SPRITE_URL);
  spriteTexture.magFilter = THREE.NearestFilter;
  spriteTexture.minFilter = THREE.NearestFilter;
  spriteTexture.colorSpace = THREE.SRGBColorSpace;
  return spriteTexture;
}

// Level exit. Hidden + inert until the player climbs to `activateAtY`, then it
// fades in and becomes enterable. Touching it once triggers game.advanceLevel()
// which fades to the next level (or the menu when nextLevelId is null).
export class Door {
  constructor({ x, y, w = DEFAULT_W, h = DEFAULT_H, activateAtY = null }) {
    this.tag = 'door';
    this.solid = false;
    this.aabb = { x, y, w, h };
    // If no threshold given, default to just below the door so it shows when
    // the player is near it.
    this._activateAtY = activateAtY ?? (y - h);
    this._active = false;
    this._triggered = false;
    this._fadeMs = 0;
    this._t = 0;

    this._mat = new THREE.SpriteMaterial({
      map: getDoorTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0,
    });
    this._sprite = new THREE.Sprite(this._mat);
    this._sprite.scale.set(w, h, 1);

    // Soft glow behind the door once it is active.
    this._glowMat = new THREE.SpriteMaterial({
      map: getDoorTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0x9fd0ff,
      opacity: 0,
    });
    this._glow = new THREE.Sprite(this._glowMat);
    this._glow.scale.set(w * 1.22, h * 1.16, 1);
    this._glow.position.set(0, 0, -0.01);

    this.mesh = new THREE.Group();
    this.mesh.position.set(x, y, 0.45);
    this.mesh.add(this._glow);
    this.mesh.add(this._sprite);
    this.mesh.visible = false;
  }

  _activate() {
    if (this._active) return;
    this._active = true;
    this._fadeMs = FADE_IN_MS;
    this.mesh.visible = true;
  }

  update(dt, game) {
    const p = game.player;

    if (!this._active) {
      if (p && p.aabb.y >= this._activateAtY) this._activate();
      return;
    }

    this._t += dt;

    // Fade-in pop when it first appears.
    if (this._fadeMs > 0) {
      this._fadeMs = Math.max(0, this._fadeMs - dt * 1000);
      const k = 1 - this._fadeMs / FADE_IN_MS;
      this._mat.opacity = k;
    } else {
      this._mat.opacity = 1;
    }

    // Gentle glow pulse so the active exit reads clearly.
    this._glowMat.opacity = 0.28 + Math.sin(this._t * 3.4) * 0.12;

    if (!this._triggered && p && Physics.overlap(this.aabb, p.aabb)) {
      this._triggered = true;
      if (game.advanceLevel) game.advanceLevel();
    }
  }

  onPlayerRespawn() {
    // Door stays visible/active once revealed; nothing to reset.
    this._t = 0;
  }

  onRemoved() {
    this._mat?.dispose();
    this._glowMat?.dispose();
  }
}
