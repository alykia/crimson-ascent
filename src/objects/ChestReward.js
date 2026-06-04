import * as THREE from 'three';
import { SwordReward } from './SwordReward.js';

// ---- SWAP-IN SLOT FOR A FINAL CHEST SPRITE ------------------------------
// Set to an imported PNG url to use real chest art:
//   import chestUrl from '../assets/T_RewardChest_sprite.png';
//   const rewardChestSprite = chestUrl;
const rewardChestSprite = null;
// -------------------------------------------------------------------------

const WIDTH = 1.6;
const HEIGHT = 1.3;
const REVEAL_MS = 950; // sword shows, THEN the Game Complete popup fires

let closedTex = null;
let openTex = null;

function makeChestTexture(open) {
  const c = document.createElement('canvas');
  c.width = 96; c.height = 80;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 96, 80);
  const wood = '#8a5a25';
  const woodDark = '#5e3c16';
  const gold = '#e6c25a';
  // Base.
  ctx.fillStyle = wood;
  ctx.fillRect(12, 36, 72, 38);
  ctx.fillStyle = woodDark;
  ctx.fillRect(12, 36, 72, 6);
  // Gold bands.
  ctx.fillStyle = gold;
  ctx.fillRect(44, 36, 8, 38);
  ctx.fillRect(12, 64, 72, 6);
  // Lid.
  if (open) {
    ctx.fillStyle = woodDark;
    ctx.fillRect(12, 8, 72, 16);
    ctx.fillStyle = '#fff1b0';
    ctx.fillRect(20, 40, 56, 10); // inner glow
  } else {
    ctx.fillStyle = wood;
    ctx.fillRect(12, 22, 72, 18);
    ctx.fillStyle = woodDark;
    ctx.fillRect(12, 22, 72, 5);
    ctx.fillStyle = gold;
    ctx.fillRect(44, 22, 8, 18);
    ctx.fillRect(40, 34, 16, 8); // lock
  }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function getChestTexture(open) {
  if (rewardChestSprite) {
    // A single sprite is reused for both states in the swap-in case.
    if (!closedTex) {
      closedTex = new THREE.TextureLoader().load(rewardChestSprite);
      closedTex.magFilter = THREE.NearestFilter;
      closedTex.minFilter = THREE.NearestFilter;
      closedTex.colorSpace = THREE.SRGBColorSpace;
    }
    return closedTex;
  }
  if (open) return (openTex ||= makeChestTexture(true));
  return (closedTex ||= makeChestTexture(false));
}

// Treasure chest spawned when the boss is defeated. The player clicks/taps it
// (Game routes a world-space pointer hit to hitTest()), which opens it, reveals
// a SwordReward, and — after a brief beat — calls game.onSwordCollected().
export class ChestReward {
  constructor({ x, y }) {
    this.tag = 'chest';
    this.solid = false;
    this.interactable = true;
    this.aabb = { x, y, w: WIDTH, h: HEIGHT };
    this._opened = false;
    this._revealMs = 0;
    this._collected = false;
    this._t = 0;

    this._mat = new THREE.SpriteMaterial({
      map: getChestTexture(false),
      transparent: true,
      depthWrite: false,
    });
    this.mesh = new THREE.Sprite(this._mat);
    this.mesh.scale.set(WIDTH, HEIGHT, 1);
    this.mesh.position.set(x, y, 0.47);
  }

  // World-space point hit test (pointer pick). Generous padding for touch.
  hitTest(wx, wy) {
    const pad = 0.5;
    return (
      Math.abs(wx - this.aabb.x) <= this.aabb.w / 2 + pad &&
      Math.abs(wy - this.aabb.y) <= this.aabb.h / 2 + pad
    );
  }

  open(game) {
    if (this._opened) return;
    this._opened = true;
    this.interactable = false;
    this._mat.map = getChestTexture(true);
    this._mat.needsUpdate = true;
    this._revealMs = REVEAL_MS;
    // Reveal the sword rising out of the chest.
    game.entities.add(new SwordReward({ x: this.aabb.x, y: this.aabb.y + 1.4 }));
  }

  update(dt, game) {
    this._t += dt;
    if (!this._opened) {
      // Idle glint so it reads as interactable.
      this._mat.opacity = 0.85 + Math.sin(this._t * 4) * 0.15;
      return;
    }
    if (this._collected) return;
    this._revealMs -= dt * 1000;
    if (this._revealMs <= 0) {
      this._collected = true;
      if (game.onSwordCollected) game.onSwordCollected();
    }
  }

  onRemoved() {
    this._mat?.dispose();
  }
}
