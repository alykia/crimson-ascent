import { ChallengeMode } from '../systems/ChallengeMode.js';

// Top-center run timer, only visible during Challenge Mode. Purely cosmetic
// (pointer-events: none). Edit its position in style.css (#challenge-timer) and
// its number format in ChallengeMode.formatTime.
export class ChallengeTimer {
  constructor(uiRoot) {
    this.el = document.createElement('div');
    this.el.id = 'challenge-timer';
    this.el.style.display = 'none';
    this.el.textContent = '00:00.00';
    uiRoot.appendChild(this.el);
  }

  show() {
    this.el.style.display = 'block';
  }

  hide() {
    this.el.style.display = 'none';
  }

  setTime(ms) {
    this.el.textContent = ChallengeMode.formatTime(ms);
  }
}
