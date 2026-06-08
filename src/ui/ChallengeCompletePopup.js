import { ChallengeMode } from '../systems/ChallengeMode.js';
import { CHALLENGE_LABELS } from '../config/challenge.js';
import { MAX_NAME_LENGTH } from '../config/leaderboardConfig.js';

// Shown when a challenge run is completed. Displays the category, final time,
// best time, an optional "New Best Time!" line, a name field + Submit Time for
// the leaderboard, and Restart / Back to Menu.
// Pauses gameplay while open (the Game sets PAUSE before showing it).
export class ChallengeCompletePopup {
  constructor(uiRoot, { onRestart, onMenu, onSubmit } = {}) {
    this._onRestart = onRestart || (() => {});
    this._onMenu = onMenu || (() => {});
    // onSubmit(name) -> Promise<{ ok, online, error }>
    this._onSubmit = onSubmit || (() => Promise.resolve({ ok: false, error: 'Not configured.' }));
    this._submitted = false;

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

    // ---- Leaderboard name entry + submit ----
    const prompt = document.createElement('p');
    prompt.className = 'challenge-name-prompt';
    prompt.textContent = 'Enter your name for the leaderboard';
    panel.appendChild(prompt);

    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.className = 'challenge-name-input';
    this.nameInput.maxLength = MAX_NAME_LENGTH;
    this.nameInput.setAttribute('aria-label', 'Player name');
    this.nameInput.autocomplete = 'off';
    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._handleSubmit();
      }
    });
    panel.appendChild(this.nameInput);

    this.submitBtn = this._makeBtn('SUBMIT TIME', () => this._handleSubmit());
    this.submitBtn.classList.add('challenge-submit-btn');
    panel.appendChild(this.submitBtn);

    this.statusEl = document.createElement('p');
    this.statusEl.className = 'challenge-status';
    panel.appendChild(this.statusEl);

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

  // Submits the typed name through onSubmit, with validation, a duplicate-tap
  // guard, and status feedback. Empty names are blocked before any submit.
  async _handleSubmit() {
    if (this._submitted) return;
    const name = this.nameInput.value.trim();
    if (!name) {
      this._setStatus('Please enter a name.', 'error');
      return;
    }
    this.submitBtn.disabled = true;
    this.nameInput.disabled = true;
    this._setStatus('Submitting…', '');
    let result;
    try {
      result = await this._onSubmit(name);
    } catch {
      result = { ok: false, error: 'Network error. Please try again.' };
    }
    if (result && result.ok) {
      this._submitted = true; // keep disabled — one submit per run
      this._setStatus('Time submitted!', 'success');
    } else {
      // Re-enable so the player can retry.
      this.submitBtn.disabled = false;
      this.nameInput.disabled = false;
      this._setStatus((result && result.error) || 'Could not submit. Please try again.', 'error');
    }
  }

  _setStatus(text, kind) {
    this.statusEl.textContent = text;
    this.statusEl.classList.remove('is-error', 'is-success');
    if (kind === 'error') this.statusEl.classList.add('is-error');
    else if (kind === 'success') this.statusEl.classList.add('is-success');
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
    // Reset the submit flow for each new run.
    this._submitted = false;
    this.nameInput.value = '';
    this.nameInput.disabled = false;
    this.submitBtn.disabled = false;
    this._setStatus('', '');
    this.el.classList.add('visible');
  }

  hide() {
    this.el.classList.remove('visible');
  }
}
