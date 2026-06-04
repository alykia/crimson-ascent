// "Game Complete" dialog shown after the sword is collected. Mirrors the menu /
// tutorial look (see style.css #game-complete). Pauses gameplay while open and
// offers Restart (Level 1) and Back to Menu. Works for mouse + touch.
export class GameCompletePopup {
  constructor(uiRoot, { onRestart, onMenu } = {}) {
    this._onRestart = onRestart || (() => {});
    this._onMenu = onMenu || (() => {});

    this.el = document.createElement('div');
    this.el.id = 'game-complete';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-labelledby', 'game-complete-title');

    const panel = document.createElement('div');
    panel.className = 'game-complete-panel';

    const title = document.createElement('h2');
    title.id = 'game-complete-title';
    title.className = 'game-complete-title';
    title.textContent = 'GAME COMPLETE';
    panel.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'game-complete-subtitle';
    subtitle.textContent = 'The dragon is slain and the blade is yours. The ascent is complete.';
    panel.appendChild(subtitle);

    const actions = document.createElement('div');
    actions.className = 'game-complete-actions';

    this.restartBtn = document.createElement('button');
    this.restartBtn.type = 'button';
    this.restartBtn.className = 'menu-btn';
    this.restartBtn.textContent = 'RESTART';
    this.restartBtn.addEventListener('click', () => this._onRestart());
    actions.appendChild(this.restartBtn);

    this.menuBtn = document.createElement('button');
    this.menuBtn.type = 'button';
    this.menuBtn.className = 'menu-btn';
    this.menuBtn.textContent = 'BACK TO MENU';
    this.menuBtn.addEventListener('click', () => this._onMenu());
    actions.appendChild(this.menuBtn);

    panel.appendChild(actions);
    this.el.appendChild(panel);
    uiRoot.appendChild(this.el);
  }

  show() {
    this.el.classList.add('visible');
  }

  hide() {
    this.el.classList.remove('visible');
  }
}
