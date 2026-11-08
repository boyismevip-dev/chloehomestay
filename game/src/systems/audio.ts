// Âm thanh tổng hợp bằng WebAudio (không cần file ngoài) + nhạc nền vui nhộn.
import { S } from '../core/state';

export type Sfx = 'click' | 'buy' | 'coin' | 'levelup' | 'error' | 'step' | 'sit' | 'eat' | 'cook' | 'place' | 'door' | 'angry' | 'bell';
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicTimer: any = null;

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = (window.AudioContext || (window as any).webkitAudioContext);
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = S().settings.volume; master.connect(ctx.destination);
  musicGain = ctx.createGain(); musicGain.gain.value = 0.35; musicGain.connect(master);
  applyAudioSettings();
}
export function applyAudioSettings() {
  if (!ctx || !master) return;
  master.gain.value = S().settings.volume;
  if (S().settings.music) startMusic(); else stopMusic();
}
// trình duyệt chỉ cho phát tiếng sau lần chạm đầu tiên
export function unlockOnGesture() {
  const f = () => { initAudio(); window.removeEventListener('pointerdown', f); window.removeEventListener('keydown', f); };
  window.addEventListener('pointerdown', f); window.addEventListener('keydown', f);
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.3, when = 0, slideTo?: number, dest?: AudioNode) {
  if (!ctx || !master) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur: number, vol = 0.2, when = 0, hp = 800) {
  if (!ctx || !master) return;
  const t = ctx.currentTime + when;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(master); src.start(t);
}

const last: Record<string, number> = {};
export function sfx(name: Sfx) {
  if (!ctx || !S().settings.sfx) return;
  const now = performance.now(); if (now - (last[name] || 0) < (name === 'step' ? 180 : 60)) return; last[name] = now;
  switch (name) {
    case 'click': tone(660, 0.07, 'square', 0.12); tone(880, 0.06, 'square', 0.08, 0.04); break;
    case 'buy': tone(523, 0.08, 'triangle', 0.25); tone(659, 0.08, 'triangle', 0.25, 0.07); tone(784, 0.16, 'triangle', 0.25, 0.14); break;
    case 'coin': tone(988, 0.07, 'square', 0.14); tone(1319, 0.2, 'square', 0.14, 0.07); break;
    case 'levelup': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, 'triangle', 0.28, i * 0.09)); break;
    case 'error': tone(220, 0.15, 'sawtooth', 0.15); tone(165, 0.2, 'sawtooth', 0.15, 0.1); break;
    case 'step': noise(0.04, 0.05, 0, 1800); break;
    case 'sit': tone(180, 0.1, 'sine', 0.2, 0, 90); break;
    case 'eat': noise(0.05, 0.12, 0, 1200); noise(0.05, 0.12, 0.09, 1200); break;
    case 'cook': noise(0.35, 0.09, 0, 3000); break;
    case 'place': tone(300, 0.08, 'sine', 0.25, 0, 150); break;
    case 'door': tone(1175, 0.12, 'sine', 0.2); tone(880, 0.25, 'sine', 0.2, 0.12); break;
    case 'angry': tone(300, 0.25, 'sawtooth', 0.15, 0, 120); break;
    case 'bell': tone(1568, 0.3, 'sine', 0.2); break;
  }
}

// ---- nhạc nền: giai điệu ngũ cung vui nhộn, tempo 126 ----
const N = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const MELODY = [72, 76, 79, 76, 74, 77, 81, 77, 72, 76, 79, 84, 83, 79, 76, 74,
                69, 72, 76, 72, 71, 74, 77, 74, 67, 71, 74, 79, 77, 74, 71, 67];
const BASS = [48, 48, 55, 55, 53, 53, 48, 55];
let step = 0;
function startMusic() {
  if (musicTimer || !ctx) return;
  const beat = 60 / 126 / 2;
  musicTimer = setInterval(() => {
    if (!ctx || !musicGain || document.hidden) return;
    const i = step % MELODY.length;
    tone(N(MELODY[i]), beat * 1.6, 'triangle', 0.22, 0, undefined, musicGain);
    if (i % 4 === 0) tone(N(BASS[(i / 4) % BASS.length]), beat * 3.2, 'sine', 0.35, 0, undefined, musicGain);
    if (i % 2 === 1) noise(0.03, 0.05, 0, 6000);
    step++;
  }, beat * 1000);
}
function stopMusic() { clearInterval(musicTimer); musicTimer = null; }
