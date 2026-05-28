export class MenuTitle {
  constructor(uiRoot, { onStartGame, onEnterZoo, zooEnabled = false } = {}) {
    this.onStartGame = onStartGame || (() => {});
    this.onEnterZoo = onEnterZoo || (() => {});
    this.zooEnabled = !!zooEnabled;

    this.el = document.createElement('div');
    this.el.id = 'title-menu';
    this.el.className = 'menu-overlay';

    const panel = document.createElement('div');
    panel.className = 'menu-panel';

    const title = document.createElement('h1');
    title.className = 'menu-title';
    title.textContent = 'Crimson Ascent';
    panel.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'menu-subtitle';
    panel.appendChild(subtitle);
    this.subtitleEl = subtitle;

    const startBtn = document.createElement('button');
    startBtn.type = 'button';
    startBtn.className = 'menu-btn';
    startBtn.textContent = 'Start Game';
    startBtn.addEventListener('click', () => this.onStartGame());
    panel.appendChild(startBtn);

    const zooBtn = document.createElement('button');
    zooBtn.type = 'button';
    zooBtn.className = 'menu-btn';
    zooBtn.textContent = 'Enter Zoo';
    zooBtn.addEventListener('click', () => this.onEnterZoo());
    panel.appendChild(zooBtn);
    this.zooBtn = zooBtn;

    this.el.appendChild(panel);
    uiRoot.appendChild(this.el);

    this.setZooEnabled(this.zooEnabled);
  }

  show() {
    this.el.style.display = 'grid';
  }

  hide() {
    this.el.style.display = 'none';
  }

  setZooEnabled(enabled) {
    this.zooEnabled = !!enabled;
    this.zooBtn.style.display = this.zooEnabled ? 'block' : 'none';
    this.subtitleEl.textContent = this.zooEnabled
      ? 'Choose your route.'
      : 'Choose your route. Zoo is hidden until enabled (use ?zoo=1 once).';
  }
}
