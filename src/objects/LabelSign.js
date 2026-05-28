import * as THREE from 'three';

function buildTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 196;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = 'rgba(8, 12, 16, 0.78)';
  ctx.strokeStyle = 'rgba(150, 185, 220, 0.88)';
  ctx.lineWidth = 10;
  ctx.fillRect(4, 4, canvas.width - 8, canvas.height - 8);
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  ctx.font = '700 58px Segoe UI, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#dcecff';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export class LabelSign {
  constructor({ x, y, text = '', w = 5.2, h = 0.88 }) {
    this.tag = 'label';
    this.solid = false;
    this.aabb = { x, y, w, h };

    const texture = buildTexture(text);
    this._material = new THREE.SpriteMaterial({
      map: texture || null,
      depthWrite: false,
      transparent: true,
    });
    this.mesh = new THREE.Sprite(this._material);
    this.mesh.scale.set(w, h, 1);
    this.mesh.position.set(x, y, 0.7);
  }

  onRemoved() {
    if (this._material?.map) this._material.map.dispose();
    if (this._material) this._material.dispose();
  }
}
