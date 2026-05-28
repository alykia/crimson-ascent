function makeButton(label, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'debug-menu-btn';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

export class DebugMenu {
  constructor(uiRoot, callbacks = {}) {
    this.callbacks = callbacks;
    this.visible = false;
    this.available = false;

    this.el = document.createElement('div');
    this.el.id = 'debug-menu';

    const title = document.createElement('div');
    title.className = 'debug-menu-title';
    title.textContent = 'Zoo Debug';
    this.el.appendChild(title);

    this.infoEl = document.createElement('div');
    this.infoEl.className = 'debug-menu-info';
    this.el.appendChild(this.infoEl);

    this.godBtn = makeButton('God Mode: OFF', () => {
      if (this.callbacks.onToggleGodMode) this.callbacks.onToggleGodMode();
    });
    this.el.appendChild(this.godBtn);

    this.el.appendChild(makeButton('Refill HP', () => {
      if (this.callbacks.onRefillHp) this.callbacks.onRefillHp();
    }));

    this.el.appendChild(makeButton('Refill Ammo', () => {
      if (this.callbacks.onRefillAmmo) this.callbacks.onRefillAmmo();
    }));

    this.el.appendChild(makeButton('Reload Level', () => {
      if (this.callbacks.onReloadLevel) this.callbacks.onReloadLevel();
    }));

    const anchorsTitle = document.createElement('div');
    anchorsTitle.className = 'debug-menu-subtitle';
    anchorsTitle.textContent = 'Teleport';
    this.el.appendChild(anchorsTitle);

    this.anchorWrap = document.createElement('div');
    this.anchorWrap.className = 'debug-menu-anchor-wrap';
    this.el.appendChild(this.anchorWrap);

    uiRoot.appendChild(this.el);
    this._render();
  }

  setAvailable(available) {
    this.available = !!available;
    if (!this.available) this.visible = false;
    this._render();
  }

  toggle() {
    if (!this.available) return;
    this.visible = !this.visible;
    this._render();
  }

  hide() {
    if (!this.visible) return;
    this.visible = false;
    this._render();
  }

  setState({ levelName = 'unknown', godMode = false, anchors = [] } = {}) {
    this.levelName = levelName;
    this.godMode = !!godMode;
    this.anchors = Array.isArray(anchors) ? anchors : [];
    this._render();
  }

  _renderAnchors() {
    this.anchorWrap.innerHTML = '';
    if (!this.anchors || this.anchors.length === 0) return;
    for (const anchor of this.anchors) {
      const btn = makeButton(anchor.label || anchor.id, () => {
        if (this.callbacks.onTeleportAnchor) this.callbacks.onTeleportAnchor(anchor.id);
      });
      btn.classList.add('debug-menu-anchor-btn');
      this.anchorWrap.appendChild(btn);
    }
  }

  _render() {
    this.el.style.display = this.available && this.visible ? 'block' : 'none';
    this.godBtn.textContent = `God Mode: ${this.godMode ? 'ON' : 'OFF'}`;
    this.infoEl.textContent = [
      `Level: ${this.levelName || '-'}`,
      'F1 menu | G god | H hp | N ammo | L reload',
    ].join('\n');
    this._renderAnchors();
  }
}
