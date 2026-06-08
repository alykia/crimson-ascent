import { CHALLENGE_KEYS, CHALLENGE_START_LEVEL } from '../config/challenge.js';

// Challenge Mode run controller. Owns the run timer and the unlock / "new" flags.
// Kept deliberately small and free of DOM/Game references so the timing logic
// stays isolated and testable; the Game wires it into the update loop and UI.
export class ChallengeMode {
  constructor() {
    this.active = false; // a challenge run is in progress
    this.type = null; // 'level1' | 'level2' | 'fullGame'
    this.elapsedMs = 0; // run time so far
    this.running = false; // timer is counting (false once an objective is met)
  }

  // Begin a fresh run of the given type. Resets the timer to zero, but leaves it
  // armed instead of counting; Game starts it on the first gameplay input.
  begin(type) {
    this.active = true;
    this.type = type;
    this.elapsedMs = 0;
    this.running = false;
  }

  // Starts counting after the player makes their first movement/action input.
  start() {
    if (!this.active) return;
    this.running = true;
  }

  // Accumulate time. The caller only invokes this during live gameplay
  // (PLAYING, not transitioning/frozen), so pause/menu/transition naturally
  // freeze the timer. Death/respawn stays in PLAYING, so the timer keeps running
  // across a respawn, exactly as required.
  tick(dt) {
    if (!this.active || !this.running) return;
    this.elapsedMs += dt * 1000;
  }

  // Stop the timer without leaving challenge mode (used the instant an objective
  // is reached, before the completion popup appears).
  stop() {
    this.running = false;
  }

  // Leave challenge mode entirely (back to the menu / normal play).
  end() {
    this.active = false;
    this.type = null;
    this.running = false;
  }

  // Finish the current run: stop the timer and return the result. The time is
  // NOT saved here — saving happens only when the player clicks Submit Time on
  // the completion popup (so they can name their score).
  complete() {
    this.running = false;
    return { type: this.type, timeMs: Math.round(this.elapsedMs) };
  }

  // Which level config a given challenge type starts on.
  startLevelFor(type) {
    return CHALLENGE_START_LEVEL[type] || 'level1';
  }

  // ---- unlock + "new" flag (persisted in localStorage) ----

  static isUnlocked() {
    try {
      return window.localStorage?.getItem(CHALLENGE_KEYS.unlocked) === '1';
    } catch {
      return false;
    }
  }

  // Marks Challenge Mode unlocked. Returns true if this was the first unlock.
  static markUnlocked() {
    try {
      const first = !ChallengeMode.isUnlocked();
      window.localStorage?.setItem(CHALLENGE_KEYS.unlocked, '1');
      return first;
    } catch {
      return false;
    }
  }

  // The NEW badge shows while the mode is unlocked but not yet opened. The
  // `seen` key is absent until the player opens the selection popup.
  static isNew() {
    try {
      return (
        ChallengeMode.isUnlocked() &&
        window.localStorage?.getItem(CHALLENGE_KEYS.seen) !== '1'
      );
    } catch {
      return false;
    }
  }

  static markSeen() {
    try {
      window.localStorage?.setItem(CHALLENGE_KEYS.seen, '1');
    } catch {
      // best-effort
    }
  }

  // Formats milliseconds as MM:SS.cc (minutes, seconds, hundredths).
  static formatTime(ms) {
    const totalMs = Math.max(0, Math.round(ms));
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const hundredths = Math.floor((totalMs % 1000) / 10);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(minutes)}:${pad(seconds)}.${pad(hundredths)}`;
  }
}
