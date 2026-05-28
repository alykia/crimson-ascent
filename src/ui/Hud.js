// DOM HUD: hearts (top-right) and arrow ammo. Plain divs styled via style.css
// so we don't burn GPU time on overlay text inside the WebGL canvas.
export class Hud {
  constructor(uiRoot) {
    this.el = document.createElement('div');
    this.el.id = 'hud';

    this.heartsEl = document.createElement('div');
    this.heartsEl.className = 'hud-hearts';
    this.el.appendChild(this.heartsEl);

    this.arrowsEl = document.createElement('div');
    this.arrowsEl.className = 'hud-arrows';
    this.arrowsEl.textContent = 'arrows 0/0';
    this.el.appendChild(this.arrowsEl);

    uiRoot.appendChild(this.el);

    this._lastHp = -1;
    this._lastMaxHp = -1;
    this._lastAmmo = -1;
    this._lastMaxAmmo = -1;
  }

  update(_dt, game) {
    const p = game.player;
    if (!p) return;

    if (p.hp !== this._lastHp || p.maxHp !== this._lastMaxHp) {
      this._renderHearts(p.hp, p.maxHp);
      this._lastHp = p.hp;
      this._lastMaxHp = p.maxHp;
    }
    if (p.ammo !== this._lastAmmo || p.maxAmmo !== this._lastMaxAmmo) {
      this.arrowsEl.textContent = `arrows ${p.ammo}/${p.maxAmmo}`;
      this._lastAmmo = p.ammo;
      this._lastMaxAmmo = p.maxAmmo;
    }
  }

  setVisible(visible) {
    this.el.style.display = visible ? 'flex' : 'none';
  }

  _renderHearts(hp, max) {
    this.heartsEl.innerHTML = '';
    for (let i = 0; i < max; i++) {
      const heart = document.createElement('div');
      heart.className = 'hud-heart' + (i >= hp ? ' empty' : '');
      this.heartsEl.appendChild(heart);
    }
  }
}
