import * as THREE from 'three';
import backgroundLevel1Url from '../assets/T_Background1_Sprite.png';

let backgroundTexture = null;

function getBackgroundTexture() {
  if (backgroundTexture) return backgroundTexture;
  backgroundTexture = new THREE.TextureLoader().load(backgroundLevel1Url);
  backgroundTexture.colorSpace = THREE.SRGBColorSpace;
  backgroundTexture.wrapS = THREE.ClampToEdgeWrapping;
  backgroundTexture.wrapT = THREE.ClampToEdgeWrapping;
  backgroundTexture.magFilter = THREE.LinearFilter;
  backgroundTexture.minFilter = THREE.LinearFilter;
  return backgroundTexture;
}

// Decorative vertical parallax backdrop for the whole level.
export class LevelBackground {
  constructor({
    bounds = null,
    parallaxY = 0.3,
    parallaxX = 0.08,
  } = {}) {
    this.tag = 'background';
    this.solid = false;

    this._aspect = 941 / 1672;
    this._parallaxY = parallaxY;
    this._parallaxX = parallaxX;
    this._bounds = bounds || { minX: -18, maxX: 18, minY: -2, maxY: 52 };

    this._mat = new THREE.SpriteMaterial({
      map: getBackgroundTexture(),
      color: 0xffffff,
      transparent: false,
      depthWrite: false,
      depthTest: true,
    });
    this.mesh = new THREE.Sprite(this._mat);
    this._fitToBounds();
    this.mesh.position.set(this._centerX, this._centerY, -20);
    this._camRangeReady = false;
  }

  _fitToBounds() {
    const b = this._bounds;
    const boundsW = Math.max(1, b.maxX - b.minX);
    const boundsH = Math.max(1, b.maxY - b.minY);
    const boundsAspect = boundsW / boundsH;

    if (boundsAspect < this._aspect) {
      this._renderW = boundsW;
      this._renderH = boundsW / this._aspect;
    } else {
      this._renderH = boundsH;
      this._renderW = boundsH * this._aspect;
    }

    this._centerX = (b.minX + b.maxX) / 2;
    this._centerY = (b.minY + b.maxY) / 2;
    this._minCenterX = b.minX + this._renderW / 2;
    this._maxCenterX = b.maxX - this._renderW / 2;
    this._minCenterY = b.minY + this._renderH / 2;
    this._maxCenterY = b.maxY - this._renderH / 2;
    this.mesh.scale.set(this._renderW, this._renderH, 1);
  }

  update(_dt, game) {
    const cam = game?.renderer?.camera;
    if (!cam) return;

    if (!this._camRangeReady) {
      const viewHalf = (cam.top - cam.bottom) / 2;
      this._camMinY = this._bounds.minY + viewHalf;
      this._camMaxY = this._bounds.maxY - viewHalf;
      this._camRangeReady = true;
    }

    const px = this._centerX + cam.position.x * this._parallaxX;
    const camSpan = this._camMaxY - this._camMinY;
    const t = camSpan > 0
      ? THREE.MathUtils.clamp((cam.position.y - this._camMinY) / camSpan, 0, 1)
      : 0.5;
    // Keep the background fully inside the level bounds while it scrolls with
    // ascent progress from the bottom to the top of the level.
    const py = THREE.MathUtils.lerp(this._minCenterY, this._maxCenterY, t);
    this.mesh.position.x = THREE.MathUtils.clamp(px, this._minCenterX, this._maxCenterX);
    this.mesh.position.y = THREE.MathUtils.clamp(py, this._minCenterY, this._maxCenterY);
  }

  onRemoved() {
    this._mat?.dispose();
  }
}
