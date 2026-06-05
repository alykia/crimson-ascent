// Generates short retro 8-bit-style placeholder sound effects as 16-bit PCM
// mono WAV files. No dependencies — pure Node. Run with:
//
//   node scripts/generate-sfx.mjs
//
// These are intentionally simple/lightweight placeholders. To swap in nicer
// audio later, just overwrite the matching .wav file in
// src/assets/audio/sfx/ (keep the same filename) — no code changes needed.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'assets', 'audio', 'sfx');
const SAMPLE_RATE = 44100;

// ---- tiny synth helpers ---------------------------------------------------

// All generators return a Float32 sample array in [-1, 1].

function makeBuffer(durationSec) {
  return new Float32Array(Math.max(1, Math.floor(durationSec * SAMPLE_RATE)));
}

// Square wave with a frequency that can vary over time via freqFn(t01).
function square(value) {
  return value >= 0 ? 1 : -1;
}

// Simple attack/decay envelope (linear attack, exponential-ish decay).
function envelope(i, total, attackFrac = 0.02, curve = 3) {
  const t = i / total;
  const attack = Math.min(1, t / attackFrac);
  const decay = Math.pow(1 - t, curve);
  return attack * decay;
}

function addTone(buf, { startFreq, endFreq, gain = 0.4, wave = 'square', attackFrac = 0.02, curve = 3 }) {
  const total = buf.length;
  let phase = 0;
  for (let i = 0; i < total; i++) {
    const t01 = i / total;
    const freq = startFreq + (endFreq - startFreq) * t01;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    let s;
    if (wave === 'square') s = square(Math.sin(phase));
    else if (wave === 'triangle') s = (2 / Math.PI) * Math.asin(Math.sin(phase));
    else if (wave === 'saw') s = (2 * ((phase / (2 * Math.PI)) % 1)) - 1;
    else s = Math.sin(phase);
    buf[i] += s * gain * envelope(i, total, attackFrac, curve);
  }
}

function addNoise(buf, { gain = 0.3, curve = 2 }) {
  const total = buf.length;
  for (let i = 0; i < total; i++) {
    buf[i] += (Math.random() * 2 - 1) * gain * envelope(i, total, 0.01, curve);
  }
}

// Quantize to a few bits to get that crunchy lo-fi 8-bit character.
function bitcrush(buf, levels = 32) {
  for (let i = 0; i < buf.length; i++) {
    const v = Math.max(-1, Math.min(1, buf[i]));
    buf[i] = Math.round(v * levels) / levels;
  }
}

function softClip(buf) {
  for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.tanh(buf[i] * 1.2);
  }
}

function encodeWav(buf) {
  const numSamples = buf.length;
  const bytesPerSample = 2;
  const dataSize = numSamples * bytesPerSample;
  const out = Buffer.alloc(44 + dataSize);

  out.write('RIFF', 0);
  out.writeUInt32LE(36 + dataSize, 4);
  out.write('WAVE', 8);
  out.write('fmt ', 12);
  out.writeUInt32LE(16, 16);            // PCM chunk size
  out.writeUInt16LE(1, 20);             // PCM format
  out.writeUInt16LE(1, 22);             // mono
  out.writeUInt32LE(SAMPLE_RATE, 24);
  out.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28);
  out.writeUInt16LE(bytesPerSample, 32);
  out.writeUInt16LE(16, 34);            // bits per sample
  out.write('data', 36);
  out.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, buf[i]));
    out.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return out;
}

// ---- the 7 sound effects --------------------------------------------------

function sfxJump() {
  // Small upward blip.
  const buf = makeBuffer(0.14);
  addTone(buf, { startFreq: 380, endFreq: 760, gain: 0.5, wave: 'square', curve: 2.5 });
  bitcrush(buf, 16);
  softClip(buf);
  return buf;
}

function sfxDash() {
  // Quick downward zap/whoosh: noise + a falling tone.
  const buf = makeBuffer(0.18);
  addTone(buf, { startFreq: 900, endFreq: 180, gain: 0.4, wave: 'saw', curve: 2 });
  addNoise(buf, { gain: 0.28, curve: 2.4 });
  bitcrush(buf, 16);
  softClip(buf);
  return buf;
}

function sfxArrowShoot() {
  // Short sharp descending pew/twang.
  const buf = makeBuffer(0.12);
  addTone(buf, { startFreq: 1200, endFreq: 420, gain: 0.45, wave: 'square', curve: 3.5 });
  bitcrush(buf, 16);
  softClip(buf);
  return buf;
}

function sfxPlayerHit() {
  // Short hurt/error buzz: low square + a bit of noise.
  const buf = makeBuffer(0.2);
  addTone(buf, { startFreq: 240, endFreq: 90, gain: 0.45, wave: 'square', curve: 2 });
  addTone(buf, { startFreq: 160, endFreq: 70, gain: 0.3, wave: 'saw', curve: 2 });
  addNoise(buf, { gain: 0.16, curve: 2 });
  bitcrush(buf, 12);
  softClip(buf);
  return buf;
}

function sfxEnemyDeath() {
  // Small explosion / downward blip: falling tone + noise burst.
  const buf = makeBuffer(0.26);
  addTone(buf, { startFreq: 520, endFreq: 80, gain: 0.4, wave: 'square', curve: 2.2 });
  addNoise(buf, { gain: 0.34, curve: 2.6 });
  bitcrush(buf, 12);
  softClip(buf);
  return buf;
}

function sfxCheckpointUnlock() {
  // Bright success chime: two stacked rising notes (arpeggio feel).
  const buf = makeBuffer(0.34);
  const a = makeBuffer(0.34);
  const b = makeBuffer(0.34);
  // Note 1 (first half), note 2 (offset, into second half).
  addTone(a, { startFreq: 660, endFreq: 660, gain: 0.32, wave: 'square', curve: 2.5 });
  addTone(b, { startFreq: 990, endFreq: 990, gain: 0.3, wave: 'square', curve: 2.5 });
  const half = Math.floor(buf.length * 0.45);
  for (let i = 0; i < buf.length; i++) {
    if (i < buf.length) buf[i] += a[i] ?? 0;
    if (i >= half) buf[i] += b[i - half] ?? 0;
  }
  bitcrush(buf, 24);
  softClip(buf);
  return buf;
}

function sfxCheckpointRespawn() {
  // Soft magical/arcade respawn blip: gentle rising arpeggio.
  const buf = makeBuffer(0.3);
  const notes = [440, 587, 784];
  const seg = Math.floor(buf.length / notes.length);
  notes.forEach((freq, idx) => {
    const part = makeBuffer(seg / SAMPLE_RATE);
    addTone(part, { startFreq: freq, endFreq: freq, gain: 0.28, wave: 'triangle', curve: 2.2 });
    for (let i = 0; i < part.length; i++) {
      const dst = idx * seg + i;
      if (dst < buf.length) buf[dst] += part[i];
    }
  });
  bitcrush(buf, 24);
  softClip(buf);
  return buf;
}

// ---- write everything -----------------------------------------------------

const FILES = {
  'jump.wav': sfxJump,
  'dash.wav': sfxDash,
  'arrow_shoot.wav': sfxArrowShoot,
  'player_hit.wav': sfxPlayerHit,
  'enemy_death.wav': sfxEnemyDeath,
  'checkpoint_unlock.wav': sfxCheckpointUnlock,
  'checkpoint_respawn.wav': sfxCheckpointRespawn,
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, gen] of Object.entries(FILES)) {
  const wav = encodeWav(gen());
  writeFileSync(join(OUT_DIR, name), wav);
  console.log(`wrote ${name} (${wav.length} bytes)`);
}
console.log(`\nDone. ${Object.keys(FILES).length} placeholder SFX written to ${OUT_DIR}`);
