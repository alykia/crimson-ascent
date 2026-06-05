// Central sound-effects manager.
//
// SFX-only for now. Music is handled separately by AudioManager.js (game.audio)
// so the two never share a volume control. The reserved hooks below
// (musicVolume / musicMuted) are intentionally NOT wired to playback here —
// they document where a future unified controller could live without mixing
// SFX and music.
//
// Usage from gameplay code:
//   import { audio } from '../systems/SfxManager.js';
//   audio.playSfx('jump');
//
// Sound keys -> files are defined once in SFX_FILES. To replace a placeholder,
// overwrite the matching .wav in src/assets/audio/sfx/ (same filename) — no
// code change needed. Add a new sound by adding one import + one SFX_FILES line.
//
// Playback uses the Web Audio API: each .playSfx() spawns a fresh BufferSource
// so the same sound can overlap itself (jump/dash/arrow spam) with no cut-off
// bugs. A missing/failed file logs a warning and is skipped — it never throws,
// and playing an unknown/unloaded key is a safe no-op.

import jumpUrl from '../assets/audio/sfx/jump.wav';
import dashUrl from '../assets/audio/sfx/dash.wav';
import arrowShootUrl from '../assets/audio/sfx/arrow_shoot.wav';
import playerHitUrl from '../assets/audio/sfx/player_hit.wav';
import enemyDeathUrl from '../assets/audio/sfx/enemy_death.wav';
import checkpointUnlockUrl from '../assets/audio/sfx/checkpoint_unlock.wav';
import checkpointRespawnUrl from '../assets/audio/sfx/checkpoint_respawn.wav';

// The single source of truth for sound key -> file URL.
const SFX_FILES = {
  jump: jumpUrl,
  dash: dashUrl,
  arrowShoot: arrowShootUrl,
  playerHit: playerHitUrl,
  enemyDeath: enemyDeathUrl,
  checkpointUnlock: checkpointUnlockUrl,
  checkpointRespawn: checkpointRespawnUrl,
};

const VOLUME_KEY = 'crimson_ascent_sfx_volume';
const MUTED_KEY = 'crimson_ascent_sfx_muted';
const DEFAULT_VOLUME = 0.7;

export class SfxManager {
  constructor() {
    this.sfxVolume = DEFAULT_VOLUME;
    this.sfxMuted = false;
    this._loadSettings();

    // Reserved for future music controls (handled by the music AudioManager,
    // kept separate from SFX volume on purpose).
    this.musicVolume = 0.6;
    this.musicMuted = false;

    this._ctx = null;
    this._buffers = new Map(); // key -> AudioBuffer
    this._loadStarted = false;
    this._loadPromise = null;
    this._unlockBound = false;

    // Browsers require a user gesture before audio can play. Arm one-time
    // listeners that resume the context and kick off loading on first input.
    this._bindUnlock();
  }

  // ---- settings + persistence ---------------------------------------------

  _loadSettings() {
    try {
      const v = window.localStorage?.getItem(VOLUME_KEY);
      if (v !== null && v !== undefined) {
        const parsed = parseFloat(v);
        if (Number.isFinite(parsed)) this.sfxVolume = clamp01(parsed);
      }
      const m = window.localStorage?.getItem(MUTED_KEY);
      if (m !== null && m !== undefined) this.sfxMuted = m === '1';
    } catch {
      // Storage blocked (private mode) -> fall back to defaults silently.
    }
  }

  _saveSettings() {
    try {
      window.localStorage?.setItem(VOLUME_KEY, String(this.sfxVolume));
      window.localStorage?.setItem(MUTED_KEY, this.sfxMuted ? '1' : '0');
    } catch {
      // Persistence is best-effort; never block playback on storage errors.
    }
  }

  setSfxVolume(value) {
    const v = clamp01(typeof value === 'number' ? value : parseFloat(value));
    this.sfxVolume = Number.isFinite(v) ? v : DEFAULT_VOLUME;
    this._saveSettings();
    return this.sfxVolume;
  }

  setSfxMuted(muted) {
    this.sfxMuted = !!muted;
    this._saveSettings();
    return this.sfxMuted;
  }

  toggleSfxMute() {
    return this.setSfxMuted(!this.sfxMuted);
  }

  // ---- loading ------------------------------------------------------------

  _ensureContext() {
    if (this._ctx) return this._ctx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      console.warn('[SfxManager] Web Audio API not supported; SFX disabled.');
      return null;
    }
    this._ctx = new Ctx();
    return this._ctx;
  }

  // Decode every sound into an AudioBuffer. Safe to call multiple times; the
  // work runs once. Per-file failures warn and are skipped so one bad/missing
  // file never blocks the rest.
  loadSfx() {
    if (this._loadPromise) return this._loadPromise;
    const ctx = this._ensureContext();
    if (!ctx) return Promise.resolve();
    this._loadStarted = true;

    const tasks = Object.entries(SFX_FILES).map(async ([key, url]) => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.arrayBuffer();
        const buffer = await ctx.decodeAudioData(data);
        this._buffers.set(key, buffer);
      } catch (err) {
        console.warn(`[SfxManager] Failed to load SFX "${key}" (${url}):`, err);
      }
    });

    this._loadPromise = Promise.all(tasks).then(() => {});
    return this._loadPromise;
  }

  // ---- playback -----------------------------------------------------------

  playSfx(name) {
    if (this.sfxMuted || this.sfxVolume <= 0) return;
    const ctx = this._ctx;
    if (!ctx) return; // not unlocked / unsupported yet
    const buffer = this._buffers.get(name);
    if (!buffer) return; // unknown or not-yet-loaded key -> safe no-op

    // A suspended context (e.g. tab refocus) can be resumed lazily.
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = this.sfxVolume;
      source.connect(gain).connect(ctx.destination);
      source.start(0);
    } catch (err) {
      console.warn(`[SfxManager] Failed to play SFX "${name}":`, err);
    }
  }

  // ---- mobile/desktop unlock ----------------------------------------------

  _bindUnlock() {
    if (this._unlockBound || typeof window === 'undefined') return;
    this._unlockBound = true;

    const unlock = () => {
      const ctx = this._ensureContext();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
      this.loadSfx();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
  }
}

function clamp01(v) {
  if (!Number.isFinite(v)) return v;
  return Math.max(0, Math.min(1, v));
}

// Shared singleton so gameplay code can `import { audio }` and call playSfx
// without threading an instance through constructors.
export const audio = new SfxManager();
