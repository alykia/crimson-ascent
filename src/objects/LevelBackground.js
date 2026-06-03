import * as THREE from 'three';

// Texture cache keyed by url so re-loading a level doesn't re-decode the image.
const textureCache = new Map();

function getBackgroundTexture(url) {
  if (textureCache.has(url)) return textureCache.get(url);
  const tex = new THREE.TextureLoader().load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  textureCache.set(url, tex);
  return tex;
}

// Decorative vertical backdrop for a level. Two modes:
//   - SPRITE  : pass `url` (+ optional `aspect`) -> parallax sprite (Level 1).
//   - COLOR   : pass `color` -> a plain solid-color quad placeholder (Level 2,
//               until a final background sprite is provided). Swapping in a PNG
//               later just means giving the level a `background.url` instead.
export class LevelBackground {
  constructor({
    bounds = null,
    url = null,
    color = null,
    aspect = 941 / 1672,
    parallaxY = 0.3,
    parallaxX = 0.08,
  } = {}) {
    this.tag = 'background';
    this.solid = false;
    this._bounds = bounds || { minX: -18, maxX: 18, minY: -2, maxY: 52 };

    if (url) {
      this._mode = 'sprite';
      this._initSprite(url, aspect, parallaxX, parallaxY);
    } else {
      this._mode = 'color';
      this._initColor(color ?? 0x12141c);
    }
  }

  // ---- SPRITE MODE: parallax backdrop fitted to the level bounds ----
  _initSprite(url, aspect, parallaxX, parallaxY) {
    this._aspect = aspect;
    this._parallaxY = parallaxY;
    this._parallaxX = parallaxX;

    this._mat = new THREE.SpriteMaterial({
      map: getBackgroundTexture(url),
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

  // ---- COLOR MODE: a large static solid-color plane behind everything ----
  _initColor(color) {
    const b = this._bounds;
    // Pad generously so the fill always covers the visible viewport even when
    // the camera sits at a clamped edge of the bounds.
    const w = (b.maxX - b.minX) + 60;
    const h = (b.maxY - b.minY) + 60;
    this._centerX = (b.minX + b.maxX) / 2;
    this._centerY = (b.minY + b.maxY) / 2;

    const geo = new THREE.PlaneGeometry(w, h);
    this._mat = new THREE.MeshBasicMaterial({ color, depthWrite: false });
    this.mesh = new THREE.Mesh(geo, this._mat);
    this.mesh.position.set(this._centerX, this._centerY, -20);
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
    if (this._mode !== 'sprite') return; // color fill is static

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
    if (this.mesh?.geometry) this.mesh.geometry.dispose();
  }
}
