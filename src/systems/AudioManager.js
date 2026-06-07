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
const FADE_MS = 600; // crossfade duration for boss-theme transitions

export class AudioManager {
  constructor() {
    this.current = null;
    this.currentUrl = null;
    this._muted = false;
    this.musicVolume = DEFAULT_MUSIC_VOLUME;
    this._trackVolume = 1;
    // Remembered level track so the boss fight can fade back to it, and a flag
    // that tracks whether the boss theme override is active.
    this._levelMusic = null;
    this._bossActive = false;
    this._loadSettings();
  }

  // ---- level music (hard switch on level load) ----------------------------
  // music: { url, volume } | null
  play(music) {
    // A level load cancels any boss-theme override and becomes the new "level
    // track" that endBoss() will return to.
    this._bossActive = false;
    this._levelMusic = music ?? null;

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
    this._bossActive = false;
    if (this.current) {
      this._cancelFade(this.current);
      this.current.pause();
      this.current.currentTime = 0;
    }
    this.current = null;
    this.currentUrl = null;
  }

  // ---- boss theme (crossfaded override) -----------------------------------
  // Start the boss theme, crossfading from the current level track. Called once
  // when the fight begins (Boss._activate). No-op if it's already playing, so a
  // per-frame call can never restart or layer the track.
  startBoss(music) {
    const url = music?.url ?? null;
    if (!url) return; // no boss track configured -> leave current music alone
    if (this._bossActive && this.currentUrl === url) return; // already playing
    this._bossActive = true;
    this._crossfadeTo({ url, volume: music?.volume ?? 1 });
  }

  // Stop the boss theme. With resumeLevel, crossfade the remembered level track
  // back in (player died / fell away); otherwise fade to silence (boss defeated
  // -> Game Complete). No-op if the boss theme isn't active.
  endBoss({ resumeLevel = true } = {}) {
    if (!this._bossActive) return;
    this._bossActive = false;
    if (resumeLevel && this._levelMusic?.url) {
      this._crossfadeTo({ url: this._levelMusic.url, volume: this._levelMusic.volume ?? 1 });
    } else {
      this._crossfadeTo(null);
    }
  }

  // Crossfade the dominant track to `music` ({url,volume}|null = silence).
  _crossfadeTo(music) {
    const url = music?.url ?? null;
    const volume = music?.volume ?? 1;

    // Already the dominant track -> just refresh its volume, keep playing.
    if (url && url === this.currentUrl && this.current) {
      this._trackVolume = volume;
      this._fade(this.current, this._effectiveVolume(), FADE_MS);
      return;
    }

    // Fade the outgoing track out, then stop it.
    const outgoing = this.current;
    if (outgoing) this._fade(outgoing, 0, FADE_MS, () => {
      outgoing.pause();
      outgoing.currentTime = 0;
    });

    if (!url) {
      this.current = null;
      this.currentUrl = null;
      return;
    }

    // Fade the incoming track in from silence.
    const incoming = new Audio(url);
    incoming.loop = true;
    incoming.volume = 0;
    incoming.play().catch(() => { /* autoplay blocked until user gesture */ });
    this.current = incoming;
    this.currentUrl = url;
    this._trackVolume = volume;
    this._fade(incoming, this._effectiveVolume(), FADE_MS);
  }

  // Ramp an element's volume toward `toVol` over `ms`, then run `onDone`.
  _fade(audioEl, toVol, ms, onDone) {
    if (!audioEl) return;
    this._cancelFade(audioEl);
    const fromVol = audioEl.volume;
    const start = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const tick = () => {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const k = ms > 0 ? Math.min(1, (now - start) / ms) : 1;
      audioEl.volume = clamp01(fromVol + (toVol - fromVol) * k);
      if (k >= 1) {
        audioEl._fadeRaf = null;
        if (onDone) onDone();
        return;
      }
      audioEl._fadeRaf = requestAnimationFrame(tick);
    };
    audioEl._fadeRaf = requestAnimationFrame(tick);
  }

  _cancelFade(audioEl) {
    if (audioEl && audioEl._fadeRaf) {
      cancelAnimationFrame(audioEl._fadeRaf);
      audioEl._fadeRaf = null;
    }
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
