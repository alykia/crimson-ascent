import { ChallengeMode } from '../systems/ChallengeMode.js';
import { CHALLENGE_LABELS } from '../config/challenge.js';

// Shown when a challenge run is completed. Displays the category, final time,
// best time, an optional "New Best Time!" line, and Restart / Back to Menu.
// Pauses gameplay while open (the Game sets PAUSE before showing it).
export class ChallengeCompletePopup {
  constructor(uiRoot, { onRestart, onMenu } = {}) {
    this._onRestart = onRestart || (() => {});
    this._onMenu = onMenu || (() => {});

    this.el = document.createElement('div');
    this.el.id = 'challenge-complete';
    this.el.className = 'challenge-overlay';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-labelledby', 'challenge-complete-title');

    const panel = document.createElement('div');
    panel.className = 'game-complete-panel';

    const title = document.createElement('h2');
    title.id = 'challenge-complete-title';
    title.className = 'game-complete-title';
    title.textContent = 'CHALLENGE COMPLETE';
    panel.appendChild(title);

    this.categoryEl = document.createElement('p');
    this.categoryEl.className = 'challenge-complete-category';
    panel.appendChild(this.categoryEl);

    this.newBestEl = document.createElement('p');
    this.newBestEl.className = 'challenge-complete-newbest';
    this.newBestEl.textContent = 'NEW BEST TIME!';
    this.newBestEl.style.display = 'none';
    panel.appendChild(this.newBestEl);

    this.timeEl = document.createElement('p');
    this.timeEl.className = 'challenge-complete-time';
    panel.appendChild(this.timeEl);

    this.bestEl = document.createElement('p');
    this.bestEl.className = 'challenge-complete-best';
    panel.appendChild(this.bestEl);

    const actions = document.createElement('div');
    actions.className = 'game-complete-actions';
    this.restartBtn = this._makeBtn('RESTART CHALLENGE', () => this._onRestart());
    actions.appendChild(this.restartBtn);
    this.menuBtn = this._makeBtn('BACK TO MENU', () => this._onMenu());
    actions.appendChild(this.menuBtn);
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

  show({ type, timeMs, bestMs, isNewBest } = {}) {
    this.categoryEl.textContent = CHALLENGE_LABELS[type] || '';
    this.timeEl.textContent = 'TIME  ' + ChallengeMode.formatTime(timeMs);
    this.newBestEl.style.display = isNewBest ? 'block' : 'none';
    if (Number.isFinite(bestMs)) {
      this.bestEl.textContent = 'BEST  ' + ChallengeMode.formatTime(bestMs);
      this.bestEl.style.display = 'block';
    } else {
      this.bestEl.style.display = 'none';
    }
    this.el.classList.add('visible');
  }

  hide() {
    this.el.classList.remove('visible');
  }
}
