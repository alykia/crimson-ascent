// Small reusable Yes/Cancel confirmation dialog. Matches the Game Complete look
// (.game-complete-panel / .menu-btn) and works for mouse + touch. Callers pass
// the message and handlers via show().
export class ConfirmPopup {
  constructor(uiRoot) {
    this._onYes = () => {};
    this._onCancel = () => {};

    this.el = document.createElement('div');
    this.el.id = 'confirm-popup';
    this.el.className = 'challenge-overlay';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');

    const panel = document.createElement('div');
    panel.className = 'game-complete-panel';

    this.messageEl = document.createElement('p');
    this.messageEl.className = 'game-complete-subtitle';
    panel.appendChild(this.messageEl);

    const actions = document.createElement('div');
    actions.className = 'game-complete-actions';
    this.yesBtn = this._makeBtn('YES', () => this._onYes());
    actions.appendChild(this.yesBtn);
    this.cancelBtn = this._makeBtn('CANCEL', () => this._onCancel());
    actions.appendChild(this.cancelBtn);
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

  show({ message, onYes, onCancel } = {}) {
    this.messageEl.textContent = message || 'Are you sure?';
    this._onYes = onYes || (() => {});
    this._onCancel = onCancel || (() => {});
    this.el.classList.add('visible');
  }

  hide() {
    this.el.classList.remove('visible');
  }
}
