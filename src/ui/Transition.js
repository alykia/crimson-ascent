// Pixel-style level transition: a full-screen black overlay that fades out
// (to black) and back in. The chunky/stepped feel comes from a `steps()` CSS
// timing function (see #level-transition in style.css), evoking an old pixel
// game wipe rather than a smooth modern crossfade.
//
// Durations are kept in sync with the CSS transition duration.
export const FADE_MS = 380;

export class Transition {
  constructor(uiRoot) {
    this.el = document.createElement('div');
    this.el.id = 'level-transition';
    uiRoot.appendChild(this.el);
    this._timer = null;
  }

  // Fade screen TO black, then run onDone (used to swap the level off-screen).
  fadeOut(onDone) {
    this._run(1, onDone);
  }

  // Fade screen FROM black back to the game.
  fadeIn(onDone) {
    this._run(0, onDone);
  }

  isBusy() {
    return this._timer !== null;
  }

  _run(targetOpacity, onDone) {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    // Defer one frame so the browser registers the opacity change and animates
    // the CSS transition even when calls are chained back-to-back.
    requestAnimationFrame(() => {
      this.el.style.opacity = String(targetOpacity);
    });
    this._timer = setTimeout(() => {
      this._timer = null;
      if (onDone) onDone();
    }, FADE_MS + 30);
  }
}
