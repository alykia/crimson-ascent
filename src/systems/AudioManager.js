// Minimal per-level music manager.
//
// Each level config carries a `music` field: `{ url, volume }` or null. This is
// the single place music is wired — no music files exist yet, so `url` is null
// everywhere and play() is a safe no-op. To add a track, set the level's
// `music.url` to an imported asset (see levelTwo.js for the slot).
//
// Browsers block autoplay until a user gesture; the .play() promise rejection
// is swallowed so a blocked start never breaks the game. Music begins once the
// player interacts (e.g. presses Start), which is when load() is first called.
export class AudioManager {
  constructor() {
    this.current = null;
    this.currentUrl = null;
    this._muted = false;
  }

  // music: { url, volume } | null
  play(music) {
    const url = music?.url ?? null;
    const volume = music?.volume ?? 0.6;

    // Same track already playing -> leave it alone.
    if (url && url === this.currentUrl) return;

    this.stop();
    if (!url) return; // no track configured -> silence

    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = this._muted ? 0 : volume;
    audio.play().catch(() => { /* autoplay blocked until user gesture */ });

    this.current = audio;
    this.currentUrl = url;
    this._volume = volume;
  }

  stop() {
    if (this.current) {
      this.current.pause();
      this.current.currentTime = 0;
    }
    this.current = null;
    this.currentUrl = null;
  }

  setMuted(muted) {
    this._muted = !!muted;
    if (this.current) this.current.volume = this._muted ? 0 : (this._volume ?? 0.6);
  }
}
