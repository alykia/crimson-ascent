import { DEBUG } from '../config/constants.js';

export class DebugOverlay {
  constructor(uiRoot) {
    this.visible = DEBUG.SHOW_ON_START;
    this.el = document.createElement('div');
    this.el.id = 'debug-overlay';
    this.el.style.display = this.visible ? 'block' : 'none';
    uiRoot.appendChild(this.el);

    this._fpsSmoothed = 60;
    this._frame = 0;
  }

  toggle() {
    this.visible = !this.visible;
    this.el.style.display = this.visible ? 'block' : 'none';
  }

  update(dt, game) {
    if (!this.visible) return;
    const fps = dt > 0 ? 1 / dt : 60;
    this._fpsSmoothed = this._fpsSmoothed * 0.92 + fps * 0.08;
    this._frame++;
    if ((this._frame & 3) !== 0) return; // throttle DOM writes to ~15Hz

    const lines = [
      'Crimson Ascent — debug (B to toggle)',
      `fps:      ${this._fpsSmoothed.toFixed(1)}`,
      `state:    ${game.state.state}`,
      `level:    ${game.currentLevelId || '-'}`,
      `entities: ${game.entities.entities.length}`,
    ];

    if (game.debugFlags?.godMode) lines.push('god mode: ON');

    const p = game.player;
    if (p) {
      lines.push('');
      lines.push(`pos:      (${p.aabb.x.toFixed(2)}, ${p.aabb.y.toFixed(2)})`);
      lines.push(`vel:      (${p.vel.x.toFixed(2)}, ${p.vel.y.toFixed(2)})`);
      lines.push(`grounded: ${p.grounded ? 'Y' : '.'}    wallL: ${p.wallL ? 'Y' : '.'}    wallR: ${p.wallR ? 'Y' : '.'}`);
      lines.push(`coyote:   ${p.coyoteMs.toFixed(0).padStart(4)}ms   buffer: ${p.jumpBufferMs.toFixed(0).padStart(4)}ms`);
      lines.push(`stamina:  ${p.wallStamina}/${p.wallStaminaMax}    facing: ${p.facing > 0 ? 'R' : 'L'}`);
      if (p.dashMsLeft > 0) lines.push(`dashing:  ${p.dashMsLeft.toFixed(0)}ms`);
      if (p._airJumpAvailable) lines.push(`air jump: ready (from dash)`);
      if (p.iframeMs > 0)   lines.push(`iframes:  ${p.iframeMs.toFixed(0)}ms`);
      if (p.hp !== undefined) lines.push(`hp:       ${p.hp}/${p.maxHp}`);
      if (p.ammo !== undefined) lines.push(`arrows:   ${p.ammo}/${p.maxAmmo}`);
    }

    this.el.textContent = lines.join('\n');
  }
}
