import * as THREE from 'three';
import { COLORS } from '../config/colors.js';
import wall1SpriteUrl from '../assets/T_Wall1_Sprite.png';
import wall2SpriteUrl from '../assets/T_Wall2_Sprite.png';
import wall3SpriteUrl from '../assets/T_Wall3_Sprite.png';

let wall1Texture = null;
let wall2Texture = null;
let wall3Texture = null;
let nextWallTextureIndex = 0;
const MAX_SPRITE_WALL_HEIGHT = 20;

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

export class Wall {
  constructor({ x, y, w, h }) {
    this.tag = 'wall';
    this.solid = true;
    this.wallJumpable = true;
    this.aabb = { x, y, w, h };

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
  }
}
