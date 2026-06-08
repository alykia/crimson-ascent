import { CHALLENGE_TYPES, CHALLENGE_LABELS } from '../config/challenge.js';
import * as leaderboardService from '../systems/leaderboardService.js';

// Ranking screen. Tabs for each challenge category; lists names + times
// fastest-first. Loads through leaderboardService, which returns online scores
// when configured and falls back to the local store otherwise.
export class RankingPopup {
  constructor(uiRoot, { onBack } = {}) {
    this._onBack = onBack || (() => {});
    this._category = CHALLENGE_TYPES[0];
    // Bumped on every render so a stale tab's async result can be discarded.
    this._requestToken = 0;

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

    this.fallbackEl = document.createElement('p');
    this.fallbackEl.className = 'ranking-fallback';
    this.fallbackEl.textContent = 'Could not load online rankings. Showing local rankings.';
    this.fallbackEl.style.display = 'none';
    panel.appendChild(this.fallbackEl);

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

  async _render() {
    for (const type of CHALLENGE_TYPES) {
      this._tabButtons[type].classList.toggle('is-active', type === this._category);
    }

    const category = this._category;
    const token = ++this._requestToken;

    this.fallbackEl.style.display = 'none';
    this.listEl.innerHTML = '';
    const loading = document.createElement('li');
    loading.className = 'ranking-empty';
    loading.textContent = 'LOADING…';
    this.listEl.appendChild(loading);

    let result;
    try {
      result = await leaderboardService.getScores(category);
    } catch {
      result = { entries: [], source: 'local' };
    }

    // A newer tab switch happened (or popup closed) while we awaited — discard.
    if (token !== this._requestToken) return;

    this.listEl.innerHTML = '';
    this.fallbackEl.style.display = result.source === 'local' && result.error ? 'block' : 'none';

    const entries = result.entries || [];
    if (!entries.length) {
      const empty = document.createElement('li');
      empty.className = 'ranking-empty';
      empty.textContent = 'NO TIMES YET';
      this.listEl.appendChild(empty);
      return;
    }

    entries.forEach((entry, i) => {
      const li = document.createElement('li');
      li.className = 'ranking-row';

      const rank = document.createElement('span');
      rank.className = 'ranking-rank';
      rank.textContent = i + 1 + '.';
      li.appendChild(rank);

      const name = document.createElement('span');
      name.className = 'ranking-name';
      name.textContent = entry.playerName || 'Anonymous'; // textContent: no HTML injection
      li.appendChild(name);

      const time = document.createElement('span');
      time.className = 'ranking-time';
      time.textContent = entry.formattedTime || leaderboardService.formatTime(entry.timeMs);
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
    this._requestToken++; // discard any in-flight load
    this.el.classList.remove('visible');
  }
}
