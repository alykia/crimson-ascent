import * as THREE from 'three';
import { COLORS } from '../config/colors.js';
import { WORLD } from '../config/constants.js';

const PIXEL_RATIO_CAP = 2;

// Orthographic renderer for the 2D X/Y playfield. The canvas CSS controls the
// portrait play area; the camera projects world units into that box without
// stretching sprites.
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this._setPixelRatio();
    this.renderer.setClearColor(COLORS.BACKGROUND);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.BACKGROUND);

    this._viewHeight = WORLD.VIEW_HEIGHT;
    const half = this._viewHeight / 2;
    this.camera = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 100);
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);

    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
    window.addEventListener('orientationchange', this._onResize);
    window.visualViewport?.addEventListener('resize', this._onResize);
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(this._onResize);
      this._ro.observe(canvas);
    }
    this._onResize();
  }

  _setPixelRatio() {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_CAP));
  }

  _onResize() {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.round(rect.width || this.canvas.clientWidth);
    const h = Math.round(rect.height || this.canvas.clientHeight);
    if (w === 0 || h === 0) return;
    this._setPixelRatio();
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    const half = this._viewHeight / 2;
    this.camera.left = -half * aspect;
    this.camera.right = half * aspect;
    this.camera.top = half;
    this.camera.bottom = -half;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('orientationchange', this._onResize);
    window.visualViewport?.removeEventListener('resize', this._onResize);
    if (this._ro) this._ro.disconnect();
    this.renderer.dispose();
  }
}
