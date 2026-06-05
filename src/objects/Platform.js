import * as THREE from 'three';
import { COLORS } from '../config/colors.js';
import platform1SpriteUrl from '../assets/T_Platform1Sprite.png';
import platform2SpriteUrl from '../assets/T_Platform2_Sprite.png';
import platform3SpriteUrl from '../assets/T_Platform3_Sprite.png';
import platformLevel2Sprite1Url from '../assets/T_PlatformLevel2_1_sprite.png';
import platformLevel2Sprite2Url from '../assets/T_PlatformLevel2_2_sprite.png';
import platformLevel2Sprite3Url from '../assets/T_PlatformLevel2_3_sprite.png';
import groundfloorSpriteUrl from '../assets/T_Groundfloor_Sprite.png';
import bossPlatformSpriteUrl from '../assets/T_PlatformBoss_sprite.png';

let platform1Texture = null;
let platform2Texture = null;
let platform3Texture = null;
let platformLevel2Texture1 = null;
let platformLevel2Texture2 = null;
let platformLevel2Texture3 = null;
let groundfloorTexture = null;
let bossPlatformTexture = null;

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

function loadNearestTexture(url) {
  const texture = new THREE.TextureLoader().load(url);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function getPlatformLevel2Texture(spriteVariant) {
  if (spriteVariant === 'platform2') {
    if (!platformLevel2Texture2) platformLevel2Texture2 = loadNearestTexture(platformLevel2Sprite2Url);
    return platformLevel2Texture2;
  }
  if (spriteVariant === 'platform3') {
    if (!platformLevel2Texture3) platformLevel2Texture3 = loadNearestTexture(platformLevel2Sprite3Url);
    return platformLevel2Texture3;
  }
  if (!platformLevel2Texture1) platformLevel2Texture1 = loadNearestTexture(platformLevel2Sprite1Url);
  return platformLevel2Texture1;
}

function getGroundfloorTexture() {
  if (groundfloorTexture) return groundfloorTexture;
  groundfloorTexture = new THREE.TextureLoader().load(groundfloorSpriteUrl);
  groundfloorTexture.magFilter = THREE.NearestFilter;
  groundfloorTexture.minFilter = THREE.NearestFilter;
  groundfloorTexture.colorSpace = THREE.SRGBColorSpace;
  groundfloorTexture.wrapS = THREE.ClampToEdgeWrapping;
  groundfloorTexture.wrapT = THREE.ClampToEdgeWrapping;
  // Sprite file is 800x800 but visible art sits in a 800x243 band.
  // Crop transparent top/bottom margins so world scaling stays predictable.
  groundfloorTexture.repeat.set(1, 243 / 800);
  groundfloorTexture.offset.set(0, 330 / 800);
  groundfloorTexture.needsUpdate = true;
  return groundfloorTexture;
}

function getBossPlatformTexture() {
  if (bossPlatformTexture) return bossPlatformTexture;
  bossPlatformTexture = loadNearestTexture(bossPlatformSpriteUrl);
  // Source is square with transparent margins; crop to the visible platform art.
  bossPlatformTexture.repeat.set(1, 133 / 384);
  bossPlatformTexture.offset.set(0, 121 / 384);
  bossPlatformTexture.needsUpdate = true;
  return bossPlatformTexture;
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

const GROUNDFLOOR_WIDTH_MULT = 1.02;
const GROUNDFLOOR_MIN_SIZE = 20.0;
const GROUNDFLOOR_MAX_SIZE = 30.0;
const GROUNDFLOOR_ASPECT = 800 / 243;
const GROUNDFLOOR_MAX_HEIGHT = 4.2;
const GROUNDFLOOR_SURFACE_Y_NORM = 0.41;
const GROUNDFLOOR_SURFACE_W_NORM = 0.96;

const BOSS_PLATFORM_ASPECT = 384 / 133;
const BOSS_PLATFORM_SURFACE_Y_NORM = 0.81;

export class Platform {
  constructor({ x, y, w, h, spriteVariant = null, spriteFlipX = false, spriteSet = 'default' }) {
    this.tag = 'platform';
    this.solid = true;
    this.aabb = { x, y, w, h };
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, y, 0);

    if (
      spriteVariant === 'platform1' ||
      spriteVariant === 'platform2' ||
      spriteVariant === 'platform3' ||
      spriteVariant === 'groundfloor' ||
      spriteVariant === 'bossPlatform'
    ) {
      const useLevel2Sprite = spriteSet === 'level2' && spriteVariant !== 'groundfloor';
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
        groundfloor: {
          texture: getGroundfloorTexture(),
          widthMult: GROUNDFLOOR_WIDTH_MULT,
          minSize: GROUNDFLOOR_MIN_SIZE,
          maxSize: GROUNDFLOOR_MAX_SIZE,
          aspect: GROUNDFLOOR_ASPECT,
          maxHeight: GROUNDFLOOR_MAX_HEIGHT,
          surfaceNorm: GROUNDFLOOR_SURFACE_Y_NORM,
          surfaceWidthNorm: GROUNDFLOOR_SURFACE_W_NORM,
        },
        bossPlatform: {
          texture: getBossPlatformTexture(),
          widthMult: 1,
          minSize: 10,
          maxSize: 30,
          aspect: BOSS_PLATFORM_ASPECT,
          maxHeight: 9,
          surfaceNorm: BOSS_PLATFORM_SURFACE_Y_NORM,
          surfaceWidthNorm: 1,
        },
      }[spriteVariant];
      const mat = new THREE.SpriteMaterial({
        map: useLevel2Sprite ? getPlatformLevel2Texture(spriteVariant) : spriteParams.texture,
        transparent: true,
        alphaTest: 0.08,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      const visualWidth = Math.min(
        spriteParams.maxSize,
        Math.max(w * spriteParams.widthMult, spriteParams.minSize)
      );
      const visualHeight = spriteParams.aspect
        ? Math.min(spriteParams.maxHeight, visualWidth / spriteParams.aspect)
        : visualWidth;
      const topY = h / 2;
      const surfaceOffsetY = (0.5 - spriteParams.surfaceNorm) * visualHeight;
      const flip = spriteFlipX ? -1 : 1;
      sprite.scale.set(visualWidth * flip, visualHeight, 1);
      sprite.position.set(0, topY + surfaceOffsetY, 0.02);
      this.mesh.add(sprite);

      // Match gameplay collision width to visible platform top deck width.
      // Keep height from authored data so jumps/landing feel consistent.
      this.aabb.w = Math.min(w, visualWidth * spriteParams.surfaceWidthNorm);

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
