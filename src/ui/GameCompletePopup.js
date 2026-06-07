// "Game Complete" dialog shown after the sword is collected. Mirrors the menu /
// tutorial look (see style.css #game-complete). Pauses gameplay while open and
// offers Restart (Level 1) and Back to Menu. Works for mouse + touch.
export class GameCompletePopup {
  constructor(uiRoot, { onRestart, onMenu, onChallenge } = {}) {
    this._onRestart = onRestart || (() => {});
    this._onMenu = onMenu || (() => {});
    this._onChallenge = onChallenge || (() => {});

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

    // Challenge button: hidden until Challenge Mode is unlocked (which happens
    // the first time the game is completed). Carries a "NEW" badge on first view.
    this.challengeBtn = document.createElement('button');
    this.challengeBtn.type = 'button';
    this.challengeBtn.className = 'menu-btn';
    this.challengeBtn.textContent = 'CHALLENGE';
    this.challengeBadge = document.createElement('span');
    this.challengeBadge.className = 'menu-badge-new';
    this.challengeBadge.textContent = 'NEW';
    this.challengeBadge.style.display = 'none';
    this.challengeBtn.appendChild(this.challengeBadge);
    this.challengeBtn.addEventListener('click', () => this._onChallenge());
    this.challengeBtn.style.display = 'none';
    actions.appendChild(this.challengeBtn);

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

  // Shows/hides the Challenge button and its "NEW" badge.
  setChallengeAvailable(unlocked, isNew = false) {
    this.challengeBtn.style.display = unlocked ? 'flex' : 'none';
    this.challengeBadge.style.display = unlocked && isNew ? 'inline-block' : 'none';
  }
}
