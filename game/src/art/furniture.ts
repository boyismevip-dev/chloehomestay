import { Model, makeCanvas, shade, trimmedURL, OUTLINE } from './draw';
import { FURN_BY_ID } from '../data/catalog';
import { HW, HH } from '../core/iso';

type Fn = (m: Model) => void;
const WOOD = '#c98a4e', DARK = '#3b3b46';

function legs(m: Model, w: number, h: number, hgt: number, color = '#8a5a2c', t = 0.1) {
  for (const [x, y] of [[0.1, 0.1], [w - 0.1 - t, 0.1], [0.1, h - 0.1 - t], [w - 0.1 - t, h - 0.1 - t]]) m.box(x, y, 0, x + t, y + t, hgt, color);
}
function chair(m: Model, seat: string, back: string, cushion?: string) {
  legs(m, 1, 1, 11, '#8a5a2c', 0.1);
  m.box(0.1, 0.1, 11, 0.9, 0.9, 16, seat);
  if (cushion) m.box(0.16, 0.16, 16, 0.84, 0.84, 19, cushion);
  m.box(0.1, 0.06, 16, 0.9, 0.2, 38, back);
  if (cushion) m.box(0.16, 0.2, 22, 0.84, 0.27, 34, cushion);
}
function burnerPot(m: Model, mx: number, my: number, color: string) {
  m.cyl(mx, my, 27, 0.2, 31, color);
  m.cyl(mx, my, 31, 0.16, 31.5, shade(color, 0.5));
}
function knobs(m: Model, w: number, z: number) {
  const n = Math.max(3, Math.round(w * 3));
  for (let i = 0; i < n; i++) { const x = (w / (n + 1)) * (i + 1); m.box(x - 0.045, 0.96, z, x + 0.045, 1.0, z + 5, i % 2 ? '#ff5a5a' : '#ffd84a'); }
}

const DRAW: Record<string, { z: number; fn: Fn }> = {
  table_sq: { z: 30, fn: (m) => { legs(m, 1, 1, 17); m.box(0.04, 0.04, 17, 0.96, 0.96, 23, WOOD); m.box(0.1, 0.1, 23, 0.9, 0.9, 24.5, '#fff1f1', { top: '#ff8f9f' }); m.cyl(0.5, 0.5, 24.5, 0.07, 30, '#e8f1ff'); } },
  table_round: { z: 32, fn: (m) => { m.cyl(0.5, 0.5, 0, 0.09, 16, '#8a5a2c'); m.cyl(0.5, 0.5, 0, 0.22, 3, '#6d4521'); m.cyl(0.5, 0.5, 16, 0.46, 22, '#f2bd62'); m.cyl(0.5, 0.5, 22, 0.4, 23.5, '#7fd1ff'); m.cyl(0.5, 0.5, 23.5, 0.06, 29, '#ff7a7a'); } },
  table_long: { z: 30, fn: (m) => { legs(m, 2, 1, 17); m.box(0.04, 0.04, 17, 1.96, 0.96, 23, WOOD); m.box(0.1, 0.1, 23, 1.9, 0.9, 24.5, '#fff7d6', { top: '#ffd84a' }); m.cyl(0.5, 0.5, 24.5, 0.07, 29, '#e8f1ff'); m.cyl(1.5, 0.5, 24.5, 0.07, 29, '#e8f1ff'); } },
  chair_wood: { z: 42, fn: (m) => chair(m, '#d9904f', '#b9743c') },
  chair_cushion: { z: 42, fn: (m) => chair(m, '#a8693a', '#c4332f', '#ee4a42') },
  stool: { z: 24, fn: (m) => { m.cyl(0.5, 0.5, 0, 0.07, 12, '#aab2bd'); m.cyl(0.5, 0.5, 0, 0.2, 2, '#7d8693'); m.cyl(0.5, 0.5, 12, 0.3, 18, '#4fc4b8'); } },
  stove_gas: { z: 40, fn: (m) => {
    m.box(0.04, 0.04, 0, 0.96, 0.96, 26, '#d9dee7'); knobs(m, 1, 14);
    m.box(0.1, 0.1, 26, 0.9, 0.9, 27, '#30323a'); m.cyl(0.3, 0.3, 27, 0.1, 27.6, '#5c606b'); m.cyl(0.7, 0.7, 27, 0.1, 27.6, '#5c606b');
    burnerPot(m, 0.5, 0.5, '#e0503f');
  } },
  stove_multi: { z: 78, fn: (m) => {
    m.box(0.04, 0.04, 0, 1.96, 0.96, 26, '#cfd5df'); knobs(m, 2, 14);
    m.box(0.1, 0.1, 26, 1.9, 0.9, 27, '#30323a');
    for (const [x, y] of [[0.55, 0.3], [0.55, 0.7], [1.45, 0.3], [1.45, 0.7]]) m.cyl(x, y, 27, 0.1, 27.6, '#5c606b');
    burnerPot(m, 0.55, 0.5, '#3d8bff'); burnerPot(m, 1.45, 0.5, '#f0a52f');
    m.box(0.15, 0.08, 52, 1.85, 0.5, 60, '#b9c0cc'); m.box(0.8, 0.08, 60, 1.2, 0.4, 78, '#9aa2af');
  } },
  oven: { z: 40, fn: (m) => {
    m.box(0.04, 0.04, 0, 0.96, 0.96, 34, '#f08a3d'); m.box(0.14, 0.96, 6, 0.86, 1.0, 22, '#2a2a33'); m.box(0.2, 0.97, 9, 0.8, 1.0, 19, '#ffd27a');
    m.box(0.14, 0.96, 25, 0.86, 1.0, 28, '#b85c1c'); for (let i = 0; i < 3; i++) m.box(0.25 + i * 0.22, 0.96, 29, 0.35 + i * 0.22, 1.0, 32, '#ffd84a');
    m.box(0.1, 0.1, 34, 0.9, 0.9, 36, '#d97025');
  } },
  prep_counter: { z: 34, fn: (m) => {
    m.box(0.04, 0.04, 0, 0.96, 0.96, 24, '#b98550'); m.box(0.0, 0.0, 24, 1.0, 1.0, 27, '#d3dae3');
    m.box(0.12, 0.96, 6, 0.88, 1.0, 10, '#8f6238'); m.box(0.12, 0.96, 14, 0.88, 1.0, 18, '#8f6238'); m.box(0.4, 0.97, 7.5, 0.6, 1.0, 8.5, '#f3d27a'); m.box(0.4, 0.97, 15.5, 0.6, 1.0, 16.5, '#f3d27a');
    m.box(0.25, 0.3, 27, 0.55, 0.6, 29, '#ffffff'); m.sphere(0.72, 0.5, 31, 5, '#e65a4f');
  } },
  fridge: { z: 74, fn: (m) => {
    m.box(0.06, 0.06, 0, 0.94, 0.94, 66, '#e6f2ff'); m.box(0.06, 0.96, 38, 0.94, 1.0, 39.5, '#7b8aa0');
    m.box(0.74, 0.96, 42, 0.82, 1.02, 58, '#6a7587'); m.box(0.74, 0.96, 16, 0.82, 1.02, 32, '#6a7587');
    m.box(0.2, 0.97, 46, 0.34, 1.0, 54, '#ff7a9c'); m.box(0.4, 0.97, 50, 0.52, 1.0, 58, '#ffd84a');
  } },
  drink_machine: { z: 70, fn: (m) => {
    m.box(0.08, 0.08, 0, 0.92, 0.92, 60, '#3aa6ff'); m.box(0.08, 0.08, 60, 0.92, 0.92, 66, '#1f6fc4');
    m.box(0.16, 0.96, 34, 0.84, 1.0, 54, '#1b2a41'); m.box(0.22, 0.97, 40, 0.78, 1.0, 50, '#5ee0ff');
    m.box(0.2, 0.96, 18, 0.8, 1.0, 28, '#10213a'); m.cyl(0.5, 0.88, 6, 0.1, 14, '#ffffff'); m.box(0.18, 0.96, 29, 0.3, 1.0, 33, '#ff5a5a'); m.box(0.7, 0.96, 29, 0.82, 1.0, 33, '#58e06a');
  } },
  vending: { z: 80, fn: (m) => {
    m.box(0.08, 0.08, 0, 0.92, 0.92, 72, '#ff5a5a'); m.box(0.14, 0.96, 20, 0.7, 1.0, 64, '#c9ecff', { alpha: 0.95 });
    const cols = ['#ffd84a', '#58e06a', '#8a5cff', '#ff9a3c', '#3aa6ff'];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) m.box(0.2 + c * 0.12, 0.97, 26 + r * 12, 0.28 + c * 0.12, 1.0, 34 + r * 12, cols[(r + c) % cols.length]);
    m.box(0.76, 0.96, 44, 0.88, 1.0, 58, '#2b2b36'); m.box(0.76, 0.96, 10, 0.88, 1.0, 16, '#2b2b36');
  } },
  cashier: { z: 52, fn: (m) => {
    m.box(0.04, 0.04, 0, 1.96, 0.96, 26, '#a8693a'); m.box(0.04, 0.96, 4, 1.96, 1.0, 22, '#8b5328');
    for (let i = 0; i < 4; i++) m.box(0.2 + i * 0.45, 0.97, 8, 0.5 + i * 0.45, 1.0, 20, '#c4813f');
    m.box(0.0, 0.0, 26, 2.0, 1.0, 29, '#f7e3b0');
    m.box(0.15, 0.2, 29, 0.75, 0.75, 38, '#3b3f4a'); m.box(0.2, 0.3, 38, 0.7, 0.7, 46, '#252830'); m.box(0.25, 0.5, 40, 0.65, 0.7, 44, '#79f0b0');
    m.sphere(1.5, 0.5, 33, 5, '#ffd84a'); m.cyl(1.5, 0.5, 29, 0.08, 30, '#c9a24a');
  } },
  bakery: { z: 62, fn: (m) => {
    m.box(0.04, 0.04, 0, 1.96, 0.96, 20, '#ff8fb3'); for (let i = 0; i < 5; i++) m.box(0.15 + i * 0.37, 0.96, 4, 0.3 + i * 0.37, 1.0, 16, i % 2 ? '#ffd0e0' : '#fff0f6');
    m.box(0.04, 0.04, 20, 1.96, 0.96, 24, '#fff4f8');
    const cakes = ['#fff7e8', '#ff7aa8', '#8a5a3c', '#ffd84a'];
    for (let i = 0; i < 4; i++) { m.cyl(0.4 + i * 0.4, 0.5, 24, 0.14, 31, cakes[i]); m.sphere(0.4 + i * 0.4, 0.5, 34, 4, i % 2 ? '#ff4a5a' : '#ffffff'); }
    m.box(0.04, 0.04, 24, 1.96, 0.96, 46, '#d6f0ff', { alpha: 0.28, noOutline: false });
    m.box(0.0, 0.0, 46, 2.0, 1.0, 50, '#ff8fb3');
  } },
  plant_small: { z: 44, fn: (m) => { m.cyl(0.5, 0.5, 0, 0.2, 13, '#d9733b'); m.cyl(0.5, 0.5, 11, 0.23, 15, '#e8844a'); m.sphere(0.5, 0.5, 24, 11, '#4cc34f'); m.sphere(0.38, 0.55, 28, 8, '#6edb62'); m.sphere(0.62, 0.5, 30, 8, '#3aa842'); } },
  plant_big: { z: 90, fn: (m) => { m.cyl(0.5, 0.5, 0, 0.26, 16, '#c8652f'); m.cyl(0.5, 0.5, 14, 0.29, 19, '#e07c42'); m.cyl(0.5, 0.5, 18, 0.05, 40, '#7a4a28'); m.sphere(0.5, 0.5, 52, 20, '#3fb84a'); m.sphere(0.34, 0.6, 46, 14, '#58d462'); m.sphere(0.66, 0.42, 58, 15, '#34a043'); m.sphere(0.5, 0.5, 72, 13, '#6ee06e'); } },
  plant_flower: { z: 52, fn: (m) => { m.cyl(0.5, 0.5, 0, 0.22, 14, '#5aa8e8'); m.cyl(0.5, 0.5, 12, 0.25, 16, '#74bdf5'); m.sphere(0.5, 0.5, 24, 12, '#3fb84a'); const cs = ['#ff6b8a', '#ffd84a', '#ffffff', '#ff9a3c']; [[0.35, 0.5, 32], [0.62, 0.4, 36], [0.55, 0.65, 30], [0.45, 0.35, 38]].forEach(([x, y, z], i) => m.sphere(x, y, z, 5, cs[i])); } },
  speaker: { z: 60, fn: (m) => { m.box(0.16, 0.16, 0, 0.84, 0.84, 54, '#3f3f52'); m.box(0.16, 0.16, 54, 0.84, 0.84, 58, '#5a5a70'); m.box(0.26, 0.84, 5, 0.74, 0.88, 31, '#8d8da6'); m.box(0.33, 0.88, 10, 0.67, 0.9, 26, '#1d1d26'); m.box(0.36, 0.84, 36, 0.64, 0.88, 49, '#8d8da6'); m.box(0.42, 0.88, 40, 0.58, 0.9, 45, '#1d1d26'); } },
  rug: { z: 4, fn: (m) => { m.box(0.02, 0.04, 0, 1.98, 0.96, 1.5, '#d93a3a', { top: '#e84c4c' }); m.box(0.14, 0.18, 1.5, 1.86, 0.82, 2, '#ffd84a', { top: '#ffe27a', noOutline: true }); m.box(0.26, 0.3, 2, 1.74, 0.7, 2.5, '#d93a3a', { top: '#e84c4c', noOutline: true }); } },
  lamp_floor: { z: 82, fn: (m) => { m.cyl(0.5, 0.5, 0, 0.17, 3, '#3b3b46'); m.cyl(0.5, 0.5, 0, 0.035, 54, '#3b3b46'); m.sphere(0.5, 0.5, 66, 13, '#fff2a8', true); m.cyl(0.5, 0.5, 54, 0.2, 76, '#ffe27a', 0.92); } },
  lamp_table: { z: 56, fn: (m) => { m.cyl(0.5, 0.5, 0, 0.28, 14, '#a8693a'); m.cyl(0.5, 0.5, 14, 0.3, 16, '#c4813f'); m.cyl(0.5, 0.5, 16, 0.05, 30, '#d9dee7'); m.cyl(0.5, 0.5, 28, 0.2, 42, '#ff9ec7', 0.92); m.sphere(0.5, 0.5, 34, 6, '#fff2a8', true); } },
};

// ---------- đồ treo tường ----------
const L = Math.hypot(HW, HH);
function wallCanvas(type: string, side: 'L' | 'R') {
  const c = makeCanvas(HW * 2 + 40, HH * 2 + 120); const g = c.getContext('2d')!;
  const ox = side === 'L' ? HW + 20 : 20, oy = 110 + 10;
  // (u: px dọc tường, v: px chiều cao)
  const sx = (side === 'L' ? -HW : HW) / L, sy = HH / L;
  g.setTransform(sx, sy, 0, -1, ox, oy);
  g.lineJoin = 'round';
  const rect = (u: number, v: number, w: number, h: number, fill: string, stroke = true) => { g.fillStyle = fill; g.fillRect(u, v, w, h); if (stroke) { g.strokeStyle = OUTLINE; g.lineWidth = 1.4; g.strokeRect(u, v, w, h); } };
  const mid = L / 2;
  if (type === 'painting') {
    rect(mid - 15, 46, 30, 26, '#8a5a2c'); rect(mid - 12, 49, 24, 20, '#8fd3ff', false);
    g.fillStyle = '#6cc46a'; g.beginPath(); g.moveTo(mid - 12, 49); g.lineTo(mid - 4, 61); g.lineTo(mid + 4, 49); g.fill(); g.fillStyle = '#4fae5a'; g.beginPath(); g.moveTo(mid - 2, 49); g.lineTo(mid + 6, 58); g.lineTo(mid + 12, 49); g.fill();
    g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(mid + 5, 64, 3.5, 0, 7); g.fill();
  } else if (type === 'clock') {
    g.fillStyle = '#c4333a'; g.beginPath(); g.arc(mid, 62, 13, 0, 7); g.fill(); g.strokeStyle = OUTLINE; g.lineWidth = 1.4; g.stroke();
    g.fillStyle = '#fffdf0'; g.beginPath(); g.arc(mid, 62, 10, 0, 7); g.fill();
    g.strokeStyle = '#333'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(mid, 62); g.lineTo(mid, 69); g.moveTo(mid, 62); g.lineTo(mid + 5, 60); g.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; g.fillStyle = '#555'; g.fillRect(mid + Math.sin(a) * 8.2 - 0.5, 62 + Math.cos(a) * 8.2 - 0.5, 1.2, 1.2); }
  } else if (type === 'neon') {
    rect(mid - 17, 50, 34, 20, '#241a3a');
    g.shadowColor = '#ff4fd8'; g.shadowBlur = 8; g.fillStyle = '#ff7be8'; g.font = 'bold 14px Baloo 2, Arial'; g.textAlign = 'center';
    g.save(); g.scale(1, -1); g.fillText('OPEN', mid, -55); g.restore();
  } else if (type === 'lamp_pendant') {
    rect(mid - 2, 60, 4, 14, '#3b3b46', false);
    g.fillStyle = 'rgba(255,240,170,0.55)'; g.beginPath(); g.arc(mid, 52, 22, 0, 7); g.fill();
    g.fillStyle = '#ffcf5a'; g.beginPath(); g.moveTo(mid - 12, 50); g.lineTo(mid + 12, 50); g.lineTo(mid + 6, 62); g.lineTo(mid - 6, 62); g.closePath(); g.fill(); g.strokeStyle = OUTLINE; g.lineWidth = 1.4; g.stroke();
    g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(mid, 49, 4, 0, 7); g.fill();
  }
  return { canvas: c, ox, oy };
}

// ---------- bộ nhớ đệm ----------
const cache = new Map<string, { canvas: HTMLCanvasElement; ox: number; oy: number }>();
export function furnitureArt(type: string, rot: number, wallSide: 'L' | 'R' = 'L') {
  const def = FURN_BY_ID[type];
  const key = def.wall ? `${type}|${wallSide}` : `${type}|${rot}`;
  let r = cache.get(key);
  if (!r) {
    r = def.wall ? wallCanvas(type, wallSide) : (() => { const d = DRAW[type]; const m = new Model(def.w, def.h, rot, d.z); d.fn(m); return m.render(type !== 'rug'); })();
    cache.set(key, r);
  }
  return r;
}
const icons = new Map<string, string>();
export function furnitureIcon(type: string): string {
  let u = icons.get(type);
  if (!u) { const def = FURN_BY_ID[type]; u = trimmedURL(furnitureArt(type, 0, 'R').canvas, 96); void def; icons.set(type, u); }
  return u;
}
