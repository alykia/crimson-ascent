import * as THREE from 'three';
import { COLORS } from '../config/colors.js';
import wall1SpriteUrl from '../assets/T_Wall1_Sprite.png';
import wall2SpriteUrl from '../assets/T_Wall2_Sprite.png';
import wall3SpriteUrl from '../assets/T_Wall3_Sprite.png';
import stackableWall1Url from '../assets/T_StackableWall01_sprite.png';
import stackableWall2Url from '../assets/T_StackableWall02_sprite.png';
import stackableWall3Url from '../assets/T_StackableWall03_sprite.png';

let wall1Texture = null;
let wall2Texture = null;
let wall3Texture = null;
let stackableWall1Texture = null;
let stackableWall2Texture = null;
let stackableWall3Texture = null;
let nextWallTextureIndex = 0;
const MAX_SPRITE_WALL_HEIGHT = 20;
// Stackable wall textures include heavy side padding; this approximates the
// fraction that is visually "solid wall" so rendered width matches old graybox.
const STACKABLE_VISIBLE_WIDTH_NORM = 0.18;
const STACKABLE_VERTICAL_OVERLAP_NORM = 0.02;

function loadWallTexture(url) {
  const texture = new THREE.TextureLoader().load(url);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function getWallTexture(index) {
  if (index === 0) {
    if (!wall1Texture) wall1Texture = loadWallTexture(wall1SpriteUrl);
    return wall1Texture;
  }
  if (index === 1) {
    if (!wall2Texture) wall2Texture = loadWallTexture(wall2SpriteUrl);
    return wall2Texture;
  }
  if (!wall3Texture) wall3Texture = loadWallTexture(wall3SpriteUrl);
  return wall3Texture;
}

function getStackableWallTexture(index) {
  if (index === 0) {
    if (!stackableWall1Texture) stackableWall1Texture = loadWallTexture(stackableWall1Url);
    return stackableWall1Texture;
  }
  if (index === 1) {
    if (!stackableWall2Texture) stackableWall2Texture = loadWallTexture(stackableWall2Url);
    return stackableWall2Texture;
  }
  if (!stackableWall3Texture) stackableWall3Texture = loadWallTexture(stackableWall3Url);
  return stackableWall3Texture;
}

function unitRand(seed) {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

export class Wall {
  constructor({ x, y, w, h }) {
    this.tag = 'wall';
    this.solid = true;
    this.wallJumpable = true;
    this.aabb = { x, y, w, h };
    this._materials = null;

    const shouldUseSprite = h <= MAX_SPRITE_WALL_HEIGHT;
    if (shouldUseSprite) {
      const textureIndex = nextWallTextureIndex % 3;
      nextWallTextureIndex += 1;

      const mat = new THREE.SpriteMaterial({
        map: getWallTexture(textureIndex),
        transparent: true,
        alphaTest: 0.08,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      const visualWidth = Math.max(w * 2.8, 1.4);
      const visualHeight = Math.max(h * 1.05, 2.8);
      sprite.scale.set(visualWidth, visualHeight, 1);
      sprite.position.set(0, 0, 0.15);

      this.mesh = new THREE.Group();
      this.mesh.position.set(x, y, 0);
      this.mesh.add(sprite);
      this._material = mat;
      this._geometry = null;
      return;
    }

    // Tall boundary walls: build from stacked gothic segments while preserving
    // collider bounds exactly (aabb stays as provided). This replaces only the
    // temporary tall gray side boundaries and leaves smaller custom wall sprites
    // unchanged.
    const tileSize = Math.max(w / STACKABLE_VISIBLE_WIDTH_NORM, w);
    const stackStep = Math.max(0.001, tileSize * (1 - STACKABLE_VERTICAL_OVERLAP_NORM));
    const segmentCount = Math.max(1, Math.ceil((h - tileSize) / stackStep) + 1);
    const firstSegY = -h / 2 + tileSize / 2;

    this.mesh = new THREE.Group();
    this.mesh.position.set(x, y, 0);
    this._materials = [];

    const seedBase = x * 31.7 + y * 17.3 + w * 13.1 + h * 19.9;
    let previousTextureIndex = -1;
    for (let i = 0; i < segmentCount; i++) {
      const base = Math.floor(unitRand(seedBase + i * 7.17) * 3);
      const textureIndex = base === previousTextureIndex ? (base + 1 + (i % 2)) % 3 : base;
      previousTextureIndex = textureIndex;

      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: getStackableWallTexture(textureIndex),
        transparent: true,
        alphaTest: 0.08,
        depthWrite: false,
      }));
      this._materials.push(sprite.material);

      const segY = firstSegY + i * stackStep;
      // Keep sprite proportions: square source rendered as square tile.
      sprite.scale.set(tileSize, tileSize, 1);
      sprite.position.set(0, segY, 0.15);
      this.mesh.add(sprite);
    }
    this._material = null;
    this._geometry = null;
    return;

    const geo = new THREE.BoxGeometry(w, h, 0.5);
    const mat = new THREE.MeshBasicMaterial({ color: COLORS.WALL });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, y, 0);
    this._material = mat;
    this._geometry = geo;
  }

  onRemoved() {
    this._geometry?.dispose();
    this._material?.dispose();
    if (this._materials) {
      for (const mat of this._materials) mat?.dispose();
    }
  }
}
