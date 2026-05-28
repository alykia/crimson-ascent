import * as THREE from 'three';
import { COLORS } from '../config/colors.js';
import { WORLD } from '../config/constants.js';

// Graybox renderer: orthographic, flat unlit materials, no post-processing.
// Visible vertical extent stays constant; horizontal extent recomputes on resize.
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(this._onResize);
      this._ro.observe(canvas.parentElement || document.body);
    }
    this._onResize();
  }

  _onResize() {
    const parent = this.canvas.parentElement || document.body;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (w === 0 || h === 0) return;
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
    if (this._ro) this._ro.disconnect();
    this.renderer.dispose();
  }
}
