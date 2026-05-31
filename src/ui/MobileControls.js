// Virtual joystick (left) + Jump / Dash / Shoot buttons (right).
// Writes into the same Input action set the keyboard uses, so the rest of the
// game stays input-agnostic. Auto-shows on touch devices, hides on keyboard use.
export class MobileControls {
  constructor(uiRoot, input) {
    this.input = input;
    this.visible = false;
    this.gameplayEnabled = false;

    this.el = document.createElement('div');
    this.el.id = 'mobile-controls';

    this.stick = document.createElement('div');
    this.stick.className = 'mc-stick';
    this.knob = document.createElement('div');
    this.knob.className = 'mc-stick-knob';
    this.stick.appendChild(this.knob);

    this.btns = document.createElement('div');
    this.btns.className = 'mc-buttons';
    this.jumpBtn  = this._makeBtn('mc-jump',  'JUMP');
    this.dashBtn  = this._makeBtn('mc-dash',  'DASH');
    this.shootBtn = this._makeBtn('mc-shoot', 'BOW');
    this.btns.appendChild(this.jumpBtn);
    this.btns.appendChild(this.dashBtn);
    this.btns.appendChild(this.shootBtn);

    this.el.appendChild(this.stick);
    this.el.appendChild(this.btns);
    uiRoot.appendChild(this.el);

    this._wireStick();
    // Jump is held (variable-height); dash/shoot are edge-triggered.
    this._wireBtn(this.jumpBtn,  'jump',  { held: true });
    this._wireBtn(this.dashBtn,  'dash',  { held: false });
    this._wireBtn(this.shootBtn, 'shoot', { held: false });

    // Show on touch device or first touch once gameplay is active; hide on keyboard activity.
    if (window.matchMedia?.('(pointer: coarse)').matches) this.show();
    window.addEventListener('touchstart', () => this.show(), { passive: true, once: false });
    window.addEventListener('keydown', () => this.hide(), { passive: true, once: false });
  }

  show() {
    if (!this.gameplayEnabled) return;
    if (this.visible) return;
    this.visible = true;
    this.el.classList.add('visible');
  }

  hide() {
    if (!this.visible) return;
    this.visible = false;
    this.el.classList.remove('visible');
  }

  setGameplayEnabled(enabled) {
    this.gameplayEnabled = !!enabled;
    if (!this.gameplayEnabled) this.hide();
    else if (window.matchMedia?.('(pointer: coarse)').matches) this.show();
  }

  _makeBtn(extraClass, label) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `mc-btn ${extraClass}`;
    b.textContent = label;
    return b;
  }

  _wireStick() {
    let outerR = 60;
    let deadR = 14;
    let activeId = null;
    let cx = 0;
    let cy = 0;

    const reset = () => {
      this.knob.style.transform = '';
      this.input.setMoveAxis(0, 0);
      this.input.setHeld('left', false);
      this.input.setHeld('right', false);
      this.input.setHeld('up', false);
      this.input.setHeld('down', false);
    };

    this.stick.addEventListener('pointerdown', (e) => {
      if (activeId !== null) return;
      e.preventDefault();
      activeId = e.pointerId;
      try { this.stick.setPointerCapture(e.pointerId); } catch { /* noop */ }
      const rect = this.stick.getBoundingClientRect();
      outerR = Math.min(rect.width, rect.height) / 2;
      deadR = Math.max(10, outerR * 0.23);
      cx = rect.left + rect.width / 2;
      cy = rect.top + rect.height / 2;
    });

    this.stick.addEventListener('pointermove', (e) => {
      if (e.pointerId !== activeId) return;
      e.preventDefault();
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const mag = Math.hypot(dx, dy);
      if (mag > outerR) {
        dx = (dx / mag) * outerR;
        dy = (dy / mag) * outerR;
      }
      this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const deadN = deadR / outerR;
      const toAxis = (valuePx) => {
        const raw = valuePx / outerR; // [-1, 1] in stick space
        const magRaw = Math.abs(raw);
        if (magRaw <= deadN) return 0;
        const remapped = (magRaw - deadN) / (1 - deadN);
        return Math.sign(raw) * Math.min(1, remapped);
      };
      const axisX = toAxis(dx);
      const axisY = toAxis(dy);

      this.input.setMoveAxis(axisX, -axisY); // world up is positive Y
      const ax = axisX;
      const ay = axisY;
      this.input.setHeld('left',  ax < 0);
      this.input.setHeld('right', ax > 0);
      this.input.setHeld('up',    ay < 0); // screen Y is inverted
      this.input.setHeld('down',  ay > 0);
    });

    const end = (e) => {
      if (e.pointerId !== activeId) return;
      activeId = null;
      reset();
    };
    this.stick.addEventListener('pointerup', end);
    this.stick.addEventListener('pointercancel', end);
  }

  _wireBtn(btn, action, { held }) {
    let pressed = false;
    const press = (e) => {
      if (pressed) return;
      e.preventDefault();
      pressed = true;
      btn.classList.add('pressed');
      try { btn.setPointerCapture(e.pointerId); } catch { /* noop */ }
      if (held) this.input.setHeld(action, true);
      else      this.input.triggerEvent(action);
    };
    const release = (e) => {
      if (!pressed) return;
      e.preventDefault();
      pressed = false;
      btn.classList.remove('pressed');
      if (held) this.input.setHeld(action, false);
    };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', (e) => {
      // Only release if not captured — captured pointers keep firing.
      if (!btn.hasPointerCapture?.(e.pointerId)) release(e);
    });
  }
}
