import { ChallengeMode } from '../systems/ChallengeMode.js';
import { CHALLENGE_TYPES, CHALLENGE_LABELS } from '../config/challenge.js';
import { getChallengeTimes } from '../systems/ChallengeLeaderboard.js';

// Ranking screen. Tabs for each challenge category; lists saved times
// fastest-first. Reads through ChallengeLeaderboard so an online source can be
// swapped in later without touching this file.
export class RankingPopup {
  constructor(uiRoot, { onBack } = {}) {
    this._onBack = onBack || (() => {});
    this._category = CHALLENGE_TYPES[0];

    this.el = document.createElement('div');
    this.el.id = 'ranking-popup';
    this.el.className = 'challenge-overlay';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-labelledby', 'ranking-title');

    const panel = document.createElement('div');
    panel.className = 'game-complete-panel';

    const title = document.createElement('h2');
    title.id = 'ranking-title';
    title.className = 'game-complete-title';
    title.textContent = 'RANKING';
    panel.appendChild(title);

    const tabs = document.createElement('div');
    tabs.className = 'ranking-tabs';
    this._tabButtons = {};
    for (const type of CHALLENGE_TYPES) {
      const t = document.createElement('button');
      t.type = 'button';
      t.className = 'ranking-tab';
      t.textContent = CHALLENGE_LABELS[type];
      t.addEventListener('click', () => this._select(type));
      tabs.appendChild(t);
      this._tabButtons[type] = t;
    }
    panel.appendChild(tabs);

    this.listEl = document.createElement('ol');
    this.listEl.className = 'ranking-list';
    panel.appendChild(this.listEl);

    const actions = document.createElement('div');
    actions.className = 'game-complete-actions';
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'menu-btn';
    back.textContent = 'BACK';
    back.addEventListener('click', () => this._onBack());
    actions.appendChild(back);
    panel.appendChild(actions);

    this.el.appendChild(panel);
    uiRoot.appendChild(this.el);
  }

  _select(type) {
    this._category = type;
    this._render();
  }

  _render() {
    for (const type of CHALLENGE_TYPES) {
      this._tabButtons[type].classList.toggle('is-active', type === this._category);
    }

    const times = getChallengeTimes(this._category);
    this.listEl.innerHTML = '';

    if (!times.length) {
      const empty = document.createElement('li');
      empty.className = 'ranking-empty';
      empty.textContent = 'NO TIMES YET';
      this.listEl.appendChild(empty);
      return;
    }

    times.forEach((entry, i) => {
      const li = document.createElement('li');
      li.className = 'ranking-row';

      const rank = document.createElement('span');
      rank.className = 'ranking-rank';
      rank.textContent = i + 1 + '.';
      li.appendChild(rank);

      const time = document.createElement('span');
      time.className = 'ranking-time';
      time.textContent = ChallengeMode.formatTime(entry.timeMs);
      li.appendChild(time);

      this.listEl.appendChild(li);
    });
  }

  show({ category } = {}) {
    if (category) this._category = category;
    this._render();
    this.el.classList.add('visible');
  }

  hide() {
    this.el.classList.remove('visible');
  }
}
