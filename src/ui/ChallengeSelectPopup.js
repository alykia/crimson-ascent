import { CHALLENGE_INTRO_TEXT } from '../config/challenge.js';

// Challenge Mode selection popup. Explains the mode and offers Level 1 / Level 2
// / All plus Back. Reused from both the main menu and the Game Complete popup;
// the caller passes an onBack handler (via show) so Back returns to the right
// place. Matches the Game Complete look (.game-complete-panel / .menu-btn).
export class ChallengeSelectPopup {
  constructor(uiRoot, { onSelect, onBack } = {}) {
    this._onSelect = onSelect || (() => {});
    this._onBack = onBack || (() => {});

    this.el = document.createElement('div');
    this.el.id = 'challenge-select';
    this.el.className = 'challenge-overlay';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-labelledby', 'challenge-select-title');

    const panel = document.createElement('div');
    panel.className = 'game-complete-panel';

    const title = document.createElement('h2');
    title.id = 'challenge-select-title';
    title.className = 'game-complete-title';
    title.textContent = 'CHALLENGE MODE';
    panel.appendChild(title);

    const intro = document.createElement('p');
    intro.className = 'game-complete-subtitle';
    intro.textContent = CHALLENGE_INTRO_TEXT;
    panel.appendChild(intro);

    const actions = document.createElement('div');
    actions.className = 'game-complete-actions';
    actions.appendChild(this._makeBtn('LEVEL 1', () => this._onSelect('level1')));
    actions.appendChild(this._makeBtn('LEVEL 2', () => this._onSelect('level2')));
    actions.appendChild(this._makeBtn('ALL', () => this._onSelect('all')));
    actions.appendChild(this._makeBtn('BACK', () => this._onBack()));
    panel.appendChild(actions);

    this.el.appendChild(panel);
    uiRoot.appendChild(this.el);
  }

  _makeBtn(label, handler) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'menu-btn';
    b.textContent = label;
    b.addEventListener('click', handler);
    return b;
  }

  show({ onBack } = {}) {
    if (onBack) this._onBack = onBack;
    this.el.classList.add('visible');
  }

  hide() {
    this.el.classList.remove('visible');
  }
}
