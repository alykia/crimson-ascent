import { CAMERA } from '../config/constants.js';

// Smooth follow with a dead zone, upward vertical bias, and a small horizontal
// look-ahead in the direction of motion. Per dev plan: "prioritize visibility
// above player; no harsh snapping".
export class CameraFollow {
  constructor(camera) {
    this.camera = camera;
    this.target = null;
    this.offsetY = CAMERA.OFFSET_Y;
    this.deadX = CAMERA.DEAD_X;
    this.deadY = CAMERA.DEAD_Y;
    this.lerpRate = CAMERA.LERP;
    this.leadX = CAMERA.LEAD_X;
    this.leadRefSpeed = CAMERA.LEAD_REF_SPEED;

    this._smoothedLead = 0;
  }

  setTarget(target) {
    this.target = target;
    if (target) this.snap();
  }

  snap() {
    if (!this.target) return;
    this.camera.position.x = this.target.aabb.x + this._smoothedLead;
    this.camera.position.y = this.target.aabb.y + this.offsetY;
  }

  update(dt) {
    if (!this.target) return;

    // Smooth the look-ahead so a sudden direction flip doesn't snap the cam.
    const vx = this.target.vel?.x ?? 0;
    const leadGoal = Math.sign(vx) * Math.min(Math.abs(vx) / this.leadRefSpeed, 1) * this.leadX;
    const leadK = 1 - Math.exp(-3 * dt);
    this._smoothedLead += (leadGoal - this._smoothedLead) * leadK;

    const tx = this.target.aabb.x + this._smoothedLead;
    const ty = this.target.aabb.y + this.offsetY;
    const cx = this.camera.position.x;
    const cy = this.camera.position.y;

    let goalX = cx;
    let goalY = cy;
    if (Math.abs(tx - cx) > this.deadX) {
      goalX = tx - Math.sign(tx - cx) * this.deadX;
    }
    if (Math.abs(ty - cy) > this.deadY) {
      goalY = ty - Math.sign(ty - cy) * this.deadY;
    }

    const k = 1 - Math.exp(-this.lerpRate * dt);
    this.camera.position.x += (goalX - cx) * k;
    this.camera.position.y += (goalY - cy) * k;
  }
}
