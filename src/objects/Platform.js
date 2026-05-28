import * as THREE from 'three';
import { COLORS } from '../config/colors.js';

export class Platform {
  constructor({ x, y, w, h }) {
    this.tag = 'platform';
    this.solid = true;
    this.aabb = { x, y, w, h };
    const geo = new THREE.BoxGeometry(w, h, 0.5);
    const mat = new THREE.MeshBasicMaterial({ color: COLORS.PLATFORM });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, y, 0);
  }
}
