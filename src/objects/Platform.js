import * as THREE from 'three';
import { COLORS } from '../config/colors.js';
import platform1SpriteUrl from '../assets/T_Platform1Sprite.png';
import platform2SpriteUrl from '../assets/T_Platform2_Sprite.png';
import platform3SpriteUrl from '../assets/T_Platform3_Sprite.png';

let platform1Texture = null;
let platform2Texture = null;
let platform3Texture = null;

function getPlatform1Texture() {
  if (platform1Texture) return platform1Texture;
  platform1Texture = new THREE.TextureLoader().load(platform1SpriteUrl);
  platform1Texture.magFilter = THREE.NearestFilter;
  platform1Texture.minFilter = THREE.NearestFilter;
  platform1Texture.colorSpace = THREE.SRGBColorSpace;
  return platform1Texture;
}

function getPlatform2Texture() {
  if (platform2Texture) return platform2Texture;
  platform2Texture = new THREE.TextureLoader().load(platform2SpriteUrl);
  platform2Texture.magFilter = THREE.NearestFilter;
  platform2Texture.minFilter = THREE.NearestFilter;
  platform2Texture.colorSpace = THREE.SRGBColorSpace;
  return platform2Texture;
}

function getPlatform3Texture() {
  if (platform3Texture) return platform3Texture;
  platform3Texture = new THREE.TextureLoader().load(platform3SpriteUrl);
  platform3Texture.magFilter = THREE.NearestFilter;
  platform3Texture.minFilter = THREE.NearestFilter;
  platform3Texture.colorSpace = THREE.SRGBColorSpace;
  return platform3Texture;
}

const PLATFORM1_WIDTH_MULT = 0.75;
const PLATFORM1_MIN_SIZE = 2.8;
const PLATFORM1_MAX_SIZE = 6.0;
// Normalized (0..1 from bottom) row used as the sprite's walk surface anchor.
// Tuned so the visible top deck lines up with the physics platform top.
const PLATFORM1_SURFACE_Y_NORM = 0.60;
const PLATFORM1_SURFACE_W_NORM = 0.82;

const PLATFORM2_WIDTH_MULT = 0.68;
const PLATFORM2_MIN_SIZE = 2.4;
const PLATFORM2_MAX_SIZE = 5.6;
const PLATFORM2_SURFACE_Y_NORM = 0.64;
const PLATFORM2_SURFACE_W_NORM = 0.80;

const PLATFORM3_WIDTH_MULT = 0.66;
const PLATFORM3_MIN_SIZE = 2.3;
const PLATFORM3_MAX_SIZE = 5.2;
const PLATFORM3_SURFACE_Y_NORM = 0.56;
const PLATFORM3_SURFACE_W_NORM = 0.68;

export class Platform {
  constructor({ x, y, w, h, spriteVariant = null, spriteFlipX = false }) {
    this.tag = 'platform';
    this.solid = true;
    this.aabb = { x, y, w, h };
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, y, 0);

    if (spriteVariant === 'platform1' || spriteVariant === 'platform2' || spriteVariant === 'platform3') {
      const spriteParams = {
        platform1: {
          texture: getPlatform1Texture(),
          widthMult: PLATFORM1_WIDTH_MULT,
          minSize: PLATFORM1_MIN_SIZE,
          maxSize: PLATFORM1_MAX_SIZE,
          surfaceNorm: PLATFORM1_SURFACE_Y_NORM,
          surfaceWidthNorm: PLATFORM1_SURFACE_W_NORM,
        },
        platform2: {
          texture: getPlatform2Texture(),
          widthMult: PLATFORM2_WIDTH_MULT,
          minSize: PLATFORM2_MIN_SIZE,
          maxSize: PLATFORM2_MAX_SIZE,
          surfaceNorm: PLATFORM2_SURFACE_Y_NORM,
          surfaceWidthNorm: PLATFORM2_SURFACE_W_NORM,
        },
        platform3: {
          texture: getPlatform3Texture(),
          widthMult: PLATFORM3_WIDTH_MULT,
          minSize: PLATFORM3_MIN_SIZE,
          maxSize: PLATFORM3_MAX_SIZE,
          surfaceNorm: PLATFORM3_SURFACE_Y_NORM,
          surfaceWidthNorm: PLATFORM3_SURFACE_W_NORM,
        },
      }[spriteVariant];
      const mat = new THREE.SpriteMaterial({
        map: spriteParams.texture,
        transparent: true,
        alphaTest: 0.08,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      const visualSize = Math.min(
        spriteParams.maxSize,
        Math.max(w * spriteParams.widthMult, spriteParams.minSize)
      );
      const topY = h / 2;
      const surfaceOffsetY = (0.5 - spriteParams.surfaceNorm) * visualSize;
      const flip = spriteFlipX ? -1 : 1;
      sprite.scale.set(visualSize * flip, visualSize, 1);
      sprite.position.set(0, topY + surfaceOffsetY, 0.02);
      this.mesh.add(sprite);

      // Match gameplay collision width to visible platform top deck width.
      // Keep height from authored data so jumps/landing feel consistent.
      this.aabb.w = Math.min(w, visualSize * spriteParams.surfaceWidthNorm);

      this._material = mat;
      return;
    }

    const geo = new THREE.BoxGeometry(w, h, 0.5);
    const mat = new THREE.MeshBasicMaterial({ color: COLORS.PLATFORM });
    const block = new THREE.Mesh(geo, mat);
    this.mesh.add(block);
    this._material = mat;
  }

  onRemoved() {
    this._material?.dispose();
  }
}
