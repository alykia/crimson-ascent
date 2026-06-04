export class MenuTitle {
  constructor(uiRoot, {
    onStartGame,
    onOpenTutorial,
    onEnterZoo,
    zooEnabled = false,
  } = {}) {
    this.onStartGame = onStartGame || (() => {});
    this.onOpenTutorial = onOpenTutorial || (() => {});
    this.onEnterZoo = onEnterZoo || (() => {});
    this.zooEnabled = !!zooEnabled;

    this.el = document.createElement('div');
    this.el.id = 'title-menu';
    this.el.className = 'menu-overlay';

    const atmosphere = document.createElement('div');
    atmosphere.className = 'menu-atmosphere';
    atmosphere.setAttribute('aria-hidden', 'true');
    this.el.appendChild(atmosphere);

    const panel = document.createElement('div');
    panel.className = 'menu-panel';

    const title = document.createElement('h1');
    title.className = 'menu-title';
    title.setAttribute('aria-label', 'Crimson Ascent');

    const crimsonTitle = document.createElement('span');
    crimsonTitle.className = 'menu-title-crimson';
    const crimsonInitial = document.createElement('span');
    crimsonInitial.className = 'menu-title-crimson-initial';
    crimsonInitial.textContent = 'C';
    crimsonTitle.appendChild(crimsonInitial);

    const crimsonRest = document.createElement('span');
    crimsonRest.className = 'menu-title-crimson-rest';
    crimsonRest.textContent = 'rimson';
    crimsonTitle.appendChild(crimsonRest);
    title.appendChild(crimsonTitle);

    const ascentTitle = document.createElement('span');
    ascentTitle.className = 'menu-title-ascent';
    ascentTitle.textContent = 'Ascent';
    title.appendChild(ascentTitle);
    panel.appendChild(title);

    const buttonWrap = document.createElement('div');
    buttonWrap.className = 'menu-actions';

    const { container: startWrap, button: startBtn } = this._makeButton('START', 'menu-btn-primary');
    startBtn.addEventListener('click', () => this.onStartGame());
    this.startBtn = startBtn;
    buttonWrap.appendChild(startWrap);

    const { container: tutorialWrap, button: tutorialBtn } = this._makeButton('TUTORIAL');
    tutorialBtn.addEventListener('click', () => this.onOpenTutorial());
    buttonWrap.appendChild(tutorialWrap);

    const { container: zooWrap, button: zooBtn } = this._makeButton('ENTER ZOO', 'menu-btn-dev');
    zooBtn.addEventListener('click', () => this.onEnterZoo());
    buttonWrap.appendChild(zooWrap);
    this.zooBtn = zooBtn;
    this.zooBtnWrap = zooWrap;

    panel.appendChild(buttonWrap);

    const footer = document.createElement('p');
    footer.className = 'menu-footer';
    footer.textContent = 'Touch or click to begin';
    panel.appendChild(footer);

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
    this.zooBtnWrap.style.display = this.zooEnabled ? 'block' : 'none';
  }

  setStartLabel(label) {
    this.startBtn.textContent = label;
  }

  _makeButton(label, extraClass = '') {
    const container = document.createElement('div');
    container.className = 'menu-button';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `menu-btn ${extraClass}`.trim();
    button.textContent = label;

    container.appendChild(button);
    return { container, button };
  }
}
