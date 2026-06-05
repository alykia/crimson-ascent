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
const MUSIC_VOLUME_KEY = 'crimson_ascent_music_volume';
const MUSIC_MUTED_KEY = 'crimson_ascent_music_muted';
const DEFAULT_MUSIC_VOLUME = 0.6;

export class AudioManager {
  constructor() {
    this.current = null;
    this.currentUrl = null;
    this._muted = false;
    this.musicVolume = DEFAULT_MUSIC_VOLUME;
    this._trackVolume = 1;
    this._loadSettings();
  }

  // music: { url, volume } | null
  play(music) {
    const url = music?.url ?? null;
    const volume = music?.volume ?? 1;

    // Same track already playing -> leave it alone.
    if (url && url === this.currentUrl) {
      this._trackVolume = volume;
      this._applyVolume();
      return;
    }

    this.stop();
    if (!url) return; // no track configured -> silence

    const audio = new Audio(url);
    audio.loop = true;
    this._trackVolume = volume;
    audio.volume = this._effectiveVolume();
    audio.play().catch(() => { /* autoplay blocked until user gesture */ });

    this.current = audio;
    this.currentUrl = url;
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
    this._saveSettings();
    this._applyVolume();
    return this._muted;
  }

  toggleMusicMute() {
    return this.setMuted(!this._muted);
  }

  get musicMuted() {
    return this._muted;
  }

  setMusicVolume(value) {
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    this.musicVolume = Number.isFinite(parsed) ? clamp01(parsed) : DEFAULT_MUSIC_VOLUME;
    this._saveSettings();
    this._applyVolume();
    return this.musicVolume;
  }

  _effectiveVolume() {
    if (this._muted) return 0;
    return clamp01(this.musicVolume * (this._trackVolume ?? 1));
  }

  _applyVolume() {
    if (this.current) this.current.volume = this._effectiveVolume();
  }

  _loadSettings() {
    try {
      const raw = window.localStorage?.getItem(MUSIC_VOLUME_KEY);
      if (raw !== null && raw !== undefined) {
        const parsed = parseFloat(raw);
        if (Number.isFinite(parsed)) this.musicVolume = clamp01(parsed);
      }
      const muted = window.localStorage?.getItem(MUSIC_MUTED_KEY);
      if (muted !== null && muted !== undefined) this._muted = muted === '1';
    } catch {
      // Storage restrictions should not block music playback.
    }
  }

  _saveSettings() {
    try {
      window.localStorage?.setItem(MUSIC_VOLUME_KEY, String(this.musicVolume));
      window.localStorage?.setItem(MUSIC_MUTED_KEY, this._muted ? '1' : '0');
    } catch {
      // Persistence is best-effort.
    }
  }
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
