import * as THREE from 'three';
import { COLORS } from '../config/colors.js';

export class Wall {
  constructor({ x, y, w, h }) {
    this.tag = 'wall';
    this.solid = true;
    this.wallJumpable = true;
    this.aabb = { x, y, w, h };
    const geo = new THREE.BoxGeometry(w, h, 0.5);
    const mat = new THREE.MeshBasicMaterial({ color: COLORS.WALL });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, y, 0);
  }
}
