// DOM boss health bar, top-center. Hidden by default; the Boss entity calls
// show() on activation, setHealth(frac) on every hit, and hide() on defeat /
// reset. Styled in style.css (#boss-hud).
export class BossHud {
  constructor(uiRoot) {
    this.el = document.createElement('div');
    this.el.id = 'boss-hud';
    this.el.style.display = 'none';

    this.labelEl = document.createElement('div');
    this.labelEl.className = 'boss-hud-label';
    this.labelEl.textContent = 'ANCIENT DRAGON';
    this.el.appendChild(this.labelEl);

    this.trackEl = document.createElement('div');
    this.trackEl.className = 'boss-hud-track';
    this.fillEl = document.createElement('div');
    this.fillEl.className = 'boss-hud-fill';
    this.trackEl.appendChild(this.fillEl);
    this.el.appendChild(this.trackEl);

    uiRoot.appendChild(this.el);
  }

  show() {
    this.el.style.display = 'flex';
  }

  hide() {
    this.el.style.display = 'none';
  }

  // frac in [0,1].
  setHealth(frac) {
    const pct = Math.max(0, Math.min(1, frac)) * 100;
    this.fillEl.style.width = pct + '%';
  }
}
