// DOM HUD: hearts and arrow ammo. Styled via style.css so we don't burn
// GPU time on overlay text inside the WebGL canvas.
import arrowSpriteUrl from '../assets/T_arrow_sprite.png';
import healthFullSpriteUrl from '../assets/T_HealthFull_sprite.png';
import healthEmptySpriteUrl from '../assets/T_HealthEmpty_sprite.png';

export class Hud {
  constructor(uiRoot) {
    this.el = document.createElement('div');
    this.el.id = 'hud';

    this.heartsEl = document.createElement('div');
    this.heartsEl.className = 'hud-hearts';
    this.el.appendChild(this.heartsEl);

    this.arrowsEl = document.createElement('div');
    this.arrowsEl.className = 'hud-arrows';
    this.arrowsIconEl = document.createElement('img');
    this.arrowsIconEl.className = 'hud-arrows-icon';
    this.arrowsIconEl.src = arrowSpriteUrl;
    this.arrowsIconEl.alt = 'Arrows';
    this.arrowsIconEl.draggable = false;
    this.arrowsEl.appendChild(this.arrowsIconEl);

    this.arrowsTextEl = document.createElement('span');
    this.arrowsTextEl.className = 'hud-arrows-text';
    this.arrowsTextEl.textContent = '0/0';
    this.arrowsEl.appendChild(this.arrowsTextEl);
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
      this.arrowsTextEl.textContent = `${p.ammo}/${p.maxAmmo}`;
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
      const heart = document.createElement('img');
      const isEmpty = i >= hp;
      heart.className = 'hud-heart' + (isEmpty ? ' empty' : '');
      heart.src = isEmpty ? healthEmptySpriteUrl : healthFullSpriteUrl;
      heart.alt = '';
      heart.draggable = false;
      this.heartsEl.appendChild(heart);
    }
  }
}
