export const STATES = Object.freeze({
  BOOT: 'boot',
  MENU: 'menu',
  PLAYING: 'playing',
  TUTORIAL: 'tutorial',
  DEAD: 'dead',
  RESPAWNING: 'respawning',
  PAUSE: 'pause',
});

export class StateMachine {
  constructor(initial = STATES.BOOT) {
    this.state = initial;
    this.listeners = new Set();
  }
  set(next) {
    if (next === this.state) return;
    const prev = this.state;
    this.state = next;
    for (const l of this.listeners) l(next, prev);
  }
  is(s) {
    return this.state === s;
  }
  onChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}
