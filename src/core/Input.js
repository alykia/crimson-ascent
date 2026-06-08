// Unified input. Keyboard (and later virtual joystick + buttons via setHeld/triggerEvent)
// converge into a single action set the rest of the game queries:
//
//   input.held.left / right / up / down / jump          (continuous)
//   input.justPressed[action]                           (true for one frame)
//   input.justReleased[action]                          (true for one frame)
//   input.on(action, cb)                                (event callback)
//   input.endFrame()                                    (clears justPressed/justReleased)

const KEYMAP = {
  ArrowLeft:  { action: 'left',        kind: 'held' },
  KeyA:       { action: 'left',        kind: 'held' },
  ArrowRight: { action: 'right',       kind: 'held' },
  KeyD:       { action: 'right',       kind: 'held' },
  ArrowUp:    { action: 'up',          kind: 'held' },
  KeyW:       { action: 'up',          kind: 'held' },
  ArrowDown:  { action: 'down',        kind: 'held' },
  KeyS:       { action: 'down',        kind: 'held' },
  Space:      { action: 'jump',        kind: 'held' },
  ShiftLeft:  { action: 'dash',        kind: 'press' },
  ShiftRight: { action: 'dash',        kind: 'press' },
  KeyJ:       { action: 'dash',        kind: 'press' },
  KeyK:       { action: 'shoot',       kind: 'press' },
  KeyX:       { action: 'shoot',       kind: 'press' },
  KeyR:       { action: 'restart',     kind: 'press' },
  KeyG:       { action: 'toggleGodMode', kind: 'press' },
  KeyH:       { action: 'refillHp',      kind: 'press' },
  KeyN:       { action: 'refillAmmo',    kind: 'press' },
  KeyL:       { action: 'reloadLevel',   kind: 'press' },
};

export class Input {
  constructor() {
    this.held = {
      left: false, right: false, up: false, down: false,
      jump: false, dash: false, shoot: false,
    };
    this.justPressed = Object.create(null);
    this.justReleased = Object.create(null);
    this.axis = {
      moveX: 0,
      moveY: 0,
    };
    this._listeners = [];

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
  }

  attach() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  detach() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }

  endFrame() {
    this.justPressed = Object.create(null);
    this.justReleased = Object.create(null);
  }

  // action can be '*' to listen to all.
  on(action, cb) {
    const entry = { action, cb };
    this._listeners.push(entry);
    return () => {
      const i = this._listeners.indexOf(entry);
      if (i >= 0) this._listeners.splice(i, 1);
    };
  }

  _fire(action) {
    for (const l of this._listeners) {
      if (l.action === action || l.action === '*') l.cb(action);
    }
  }

  _press(action) {
    if (!this.held[action]) {
      this.held[action] = true;
    }
    this.justPressed[action] = true;
    this._fire(action);
  }

  _release(action) {
    this.held[action] = false;
    this.justReleased[action] = true;
  }

  // Let regular form fields receive normal typing. Without this, gameplay keys
  // such as K / L / X call preventDefault() and never appear in name inputs.
  _isTypingTarget(target) {
    if (!target) return false;
    const tag = target.tagName;
    return (
      target.isContentEditable ||
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT'
    );
  }

  _onKeyDown(e) {
    if (this._isTypingTarget(e.target)) return;
    const map = KEYMAP[e.code];
    if (!map) return;
    e.preventDefault();
    if (e.repeat) return;
    this._press(map.action);
  }

  _onKeyUp(e) {
    if (this._isTypingTarget(e.target)) return;
    const map = KEYMAP[e.code];
    if (!map) return;
    this._release(map.action);
  }

  // Used by MobileControls / virtual joystick to push synthesized input.
  setHeld(action, value) {
    if (this.held[action] === value) return;
    if (value) this._press(action);
    else this._release(action);
  }
  triggerEvent(action) {
    this.justPressed[action] = true;
    this._fire(action);
  }

  // Used by analog input sources (mobile stick) to feed normalized axes.
  // Values are expected in [-1, 1].
  setMoveAxis(x, y = 0) {
    const clamp = (v) => Math.max(-1, Math.min(1, Number.isFinite(v) ? v : 0));
    this.axis.moveX = clamp(x);
    this.axis.moveY = clamp(y);
  }
}
