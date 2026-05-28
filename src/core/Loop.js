// Variable-timestep loop with a clamped delta so tab-switch / lag spikes
// don't teleport actors through walls. Mirrors Nightshift's Loop.

const MAX_DT = 0.05; // 50ms clamp — at this rate a single tick won't tunnel

export class Loop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.running = false;
    this._raf = 0;
    this._last = 0;
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._last = performance.now();
    this._raf = requestAnimationFrame(this._tick);
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  _tick(t) {
    if (!this.running) return;
    let dt = (t - this._last) / 1000;
    this._last = t;
    if (dt > MAX_DT) dt = MAX_DT;
    if (dt < 0) dt = 0;
    this.update(dt);
    this.render();
    this._raf = requestAnimationFrame(this._tick);
  }
}
