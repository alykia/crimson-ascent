import * as THREE from 'three';
import { COLORS } from '../config/colors.js';
import swordLevel2SpriteUrl from '../assets/T_SwordLevel2_sprite.png';

// ---- SWAP-IN SLOT FOR A FINAL SWORD SPRITE ------------------------------
const rewardSwordSprite = swordLevel2SpriteUrl;
// -------------------------------------------------------------------------

const WIDTH = 2.0;
const HEIGHT = 2.0;

let swordTex = null;
function getSwordTexture() {
  if (rewardSwordSprite) {
    if (swordTex) return swordTex;
    swordTex = new THREE.TextureLoader().load(rewardSwordSprite);
    swordTex.magFilter = THREE.NearestFilter;
    swordTex.minFilter = THREE.NearestFilter;
    swordTex.colorSpace = THREE.SRGBColorSpace;
    return swordTex;
  }
  if (swordTex) return swordTex;
  const c = document.createElement('canvas');
  c.width = 48; c.height = 112;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 48, 112);
  // Blade.
  ctx.fillStyle = '#d8e6ff';
  ctx.fillRect(20, 6, 8, 72);
  ctx.fillStyle = '#b4c7e6';
  ctx.fillRect(24, 6, 4, 72);
  ctx.beginPath();
  ctx.moveTo(20, 6); ctx.lineTo(24, 0); ctx.lineTo(28, 6); ctx.closePath();
  ctx.fill();
  // Guard.
  ctx.fillStyle = '#e6c25a';
  ctx.fillRect(10, 78, 28, 8);
  // Grip.
  ctx.fillStyle = '#5e3c16';
  ctx.fillRect(21, 86, 6, 18);
  // Pommel.
  ctx.fillStyle = '#e6c25a';
  ctx.fillRect(19, 104, 10, 8);
  swordTex = new THREE.CanvasTexture(c);
  swordTex.magFilter = THREE.NearestFilter;
  swordTex.minFilter = THREE.NearestFilter;
  swordTex.colorSpace = THREE.SRGBColorSpace;
  swordTex.needsUpdate = true;
  return swordTex;
}

// Placeholder reward sword that rises out of the opened chest and hovers,
// glowing, while the Game Complete popup takes over. Purely cosmetic.
export class SwordReward {
  constructor({ x, y }) {
    this.tag = 'sword';
    this.solid = false;
    this.aabb = { x, y, w: WIDTH, h: HEIGHT };
    this._baseY = y;
    this._t = 0;

    this._mat = new THREE.SpriteMaterial({
      map: getSwordTexture(),
      transparent: true,
      depthWrite: false,
    });
    this.mesh = new THREE.Sprite(this._mat);
    this.mesh.scale.set(WIDTH, HEIGHT, 1);
    this.mesh.position.set(x, y, 0.49);

    // Soft glow halo behind the blade.
    this._glowMat = new THREE.SpriteMaterial({
      map: getSwordTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: COLORS.REWARD_SWORD,
      opacity: 0.4,
    });
    this._glow = new THREE.Sprite(this._glowMat);
    this._glow.scale.set(WIDTH * 1.7, HEIGHT * 1.2, 1);
    this.mesh.add(this._glow);
  }

  update(dt) {
    this._t += dt;
    const bob = Math.sin(this._t * 2.2) * 0.12;
    this.mesh.position.y = this._baseY + bob;
    this.mesh.material.rotation = Math.sin(this._t * 1.6) * 0.05;
    this._glowMat.opacity = 0.3 + Math.abs(Math.sin(this._t * 3)) * 0.35;
  }

  onRemoved() {
    this._mat?.dispose();
    this._glowMat?.dispose();
  }
}
