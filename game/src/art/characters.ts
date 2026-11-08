// Nhân vật chibi vẽ bằng Canvas. Mỗi nhân vật có 2 mặt (trước/sau) × các khung hình; hướng trái/phải dùng flipX.
import { makeCanvas, shade, OUTLINE } from './draw';

export interface Look { skin: string; hair: string; hairStyle: number; top: string; bottom: string; role: 'customer' | 'chef' | 'waiter' | 'cashier'; accent: string }
export type Frame = 'idle' | 'walk1' | 'walk2' | 'sit' | 'work';
export const CW = 56, CH = 84;
export const FEET = { x: 28, y: 76 };           // điểm chân trong ảnh

const SKINS = ['#ffd9b5', '#f2c196', '#e0a97a', '#c68a5c', '#ffe4cc'];
const HAIRS = ['#2b1a12', '#6b3a1e', '#e0a838', '#d9482f', '#3a2f66', '#1b1b1b', '#ff8fb3'];
const TOPS = ['#ff6b6b', '#4da3ff', '#7ed957', '#ffb347', '#b57aff', '#ff8fc0', '#38d1c0', '#f7d44a'];
const BOTTOMS = ['#34495e', '#6d4c41', '#2c3e50', '#455a64', '#7b5e9a'];

export function customerLook(seed: number): Look {
  const p = <T,>(a: T[], k: number) => a[(seed * k + (seed >> 3)) % a.length];
  return { skin: p(SKINS, 7), hair: p(HAIRS, 11), hairStyle: seed % 4, top: p(TOPS, 5), bottom: p(BOTTOMS, 3), role: 'customer', accent: p(TOPS, 13) };
}
export function staffLook(role: 'chef' | 'waiter' | 'cashier', look: number): Look {
  const base = { skin: SKINS[look % SKINS.length], hair: HAIRS[(look * 2 + 1) % HAIRS.length], hairStyle: look % 4 };
  if (role === 'chef') return { ...base, top: '#ffffff', bottom: '#4a4f5c', role, accent: '#ff5a4f' };
  if (role === 'waiter') return { ...base, top: '#ffffff', bottom: '#2f3b57', role, accent: '#3d8bff' };
  return { ...base, top: '#ff6b6b', bottom: '#3b3b46', role, accent: '#ffd84a' };
}

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke = true) {
  g.beginPath(); g.roundRect(x, y, w, h, r); g.fillStyle = fill; g.fill(); if (stroke) { g.lineWidth = 1.5; g.strokeStyle = OUTLINE; g.stroke(); }
}
function circ(g: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke = true) {
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); if (stroke) { g.lineWidth = 1.5; g.strokeStyle = OUTLINE; g.stroke(); }
}

export function drawCharacter(look: Look, back: boolean, frame: Frame): HTMLCanvasElement {
  const c = makeCanvas(CW, CH); const g = c.getContext('2d')!;
  g.lineJoin = 'round';
  const sit = frame === 'sit';
  const bob = frame === 'walk1' || frame === 'walk2' ? -1.5 : 0;
  const y0 = sit ? 8 : 0;                         // ngồi: hạ thân xuống
  // bóng
  g.fillStyle = 'rgba(20,10,40,0.22)'; g.beginPath(); g.ellipse(28, 76, 15, 6, 0, 0, 7); g.fill();
  // chân
  if (!sit) {
    const l = frame === 'walk1' ? -4 : frame === 'walk2' ? 3 : 0, r = frame === 'walk1' ? 3 : frame === 'walk2' ? -4 : 0;
    rr(g, 18, 60 + l * 0.0, 8, 15 + l * 0.6, 3, look.bottom); rr(g, 30, 60, 8, 15 + r * 0.6, 3, look.bottom);
    rr(g, 16, 72 + l * 0.6, 12, 5, 2.5, '#3a2a22'); rr(g, 28, 72 + r * 0.6, 12, 5, 2.5, '#3a2a22');
  } else {
    rr(g, 17, 66, 22, 8, 3, look.bottom); rr(g, 15, 70, 12, 5, 2.5, '#3a2a22'); rr(g, 29, 70, 12, 5, 2.5, '#3a2a22');
  }
  // tay phía sau
  const armSwing = frame === 'walk1' ? 3 : frame === 'walk2' ? -3 : 0;
  const armUp = frame === 'work' ? -5 : 0;
  // thân
  rr(g, 14, 40 + y0 + bob, 28, 26 - (sit ? 6 : 0), 9, look.top);
  if (look.role === 'waiter') { rr(g, 18, 43 + y0 + bob, 20, 20, 5, '#2f3b57', false); if (!back) { g.fillStyle = '#ff5a5a'; g.beginPath(); g.moveTo(28, 44 + y0 + bob); g.lineTo(23, 41 + y0 + bob); g.lineTo(23, 47 + y0 + bob); g.closePath(); g.moveTo(28, 44 + y0 + bob); g.lineTo(33, 41 + y0 + bob); g.lineTo(33, 47 + y0 + bob); g.fill(); } }
  if (look.role === 'chef') { if (!back) { g.fillStyle = look.accent; for (const x of [23, 33]) { g.beginPath(); g.arc(x, 50 + y0 + bob, 1.8, 0, 7); g.fill(); } g.fillStyle = '#e8e8ef'; g.fillRect(27.2, 44 + y0 + bob, 1.6, 18); } }
  if (look.role === 'cashier') { rr(g, 14, 58 + y0 + bob, 28, 4, 2, look.accent, false); }
  if (look.role === 'customer' && !back) { g.fillStyle = shade(look.top, 0.8); g.fillRect(27, 44 + y0 + bob, 2, 18); }
  // tay
  const hy = 44 + y0 + bob;
  rr(g, 8, hy + armSwing * 0.3 + armUp, 8, 18, 4, look.top); circ(g, 12, hy + 19 + armSwing * 0.3 + armUp, 4, look.skin);
  rr(g, 40, hy - armSwing * 0.3 + armUp, 8, 18, 4, look.top); circ(g, 44, hy + 19 - armSwing * 0.3 + armUp, 4, look.skin);
  // đầu
  const hx = 28, hyc = 26 + y0 + bob;
  circ(g, hx, hyc, 19, look.skin);
  // tóc
  const hair = look.hair;
  if (back) {
    circ(g, hx, hyc - 1, 19.4, hair);
  } else {
    g.beginPath(); g.arc(hx, hyc, 19.4, Math.PI * 1.02, Math.PI * 1.98); g.quadraticCurveTo(hx + 8, hyc - 8, hx, hyc - 8); g.quadraticCurveTo(hx - 8, hyc - 8, hx - 19, hyc - 2); g.closePath(); g.fillStyle = hair; g.fill(); g.lineWidth = 1.5; g.strokeStyle = OUTLINE; g.stroke();
    if (look.hairStyle === 1) { circ(g, hx - 19, hyc + 4, 5, hair); circ(g, hx + 19, hyc + 4, 5, hair); }
    if (look.hairStyle === 2) { circ(g, hx, hyc - 21, 7, hair); }
    if (look.hairStyle === 3) { rr(g, hx - 20, hyc - 3, 7, 22, 4, hair); rr(g, hx + 13, hyc - 3, 7, 22, 4, hair); }
    // mặt
    circ(g, hx - 7, hyc + 2, 2.8, '#2b1a12', false); circ(g, hx + 7, hyc + 2, 2.8, '#2b1a12', false);
    circ(g, hx - 6.2, hyc + 1, 1, '#fff', false); circ(g, hx + 7.8, hyc + 1, 1, '#fff', false);
    circ(g, hx - 12, hyc + 8, 3.2, 'rgba(255,120,130,0.45)', false); circ(g, hx + 12, hyc + 8, 3.2, 'rgba(255,120,130,0.45)', false);
    g.strokeStyle = '#a03a3a'; g.lineWidth = 1.6; g.beginPath(); g.arc(hx, hyc + 8, 3.5, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  }
  // phụ kiện theo vai
  if (look.role === 'chef') {
    rr(g, hx - 14, hyc - 22, 28, 9, 3, '#ffffff'); circ(g, hx - 9, hyc - 27, 9, '#ffffff'); circ(g, hx + 9, hyc - 27, 9, '#ffffff'); circ(g, hx, hyc - 31, 10, '#ffffff');
  } else if (look.role === 'waiter') {
    rr(g, hx - 15, hyc - 21, 30, 6, 3, '#3d8bff'); rr(g, hx - 10, hyc - 28, 20, 9, 4, '#3d8bff');
    if (frame === 'work') { g.fillStyle = '#d7dce5'; g.beginPath(); g.ellipse(44, hy + 17, 10, 3.5, 0, 0, 7); g.fill(); g.stroke(); }
  } else if (look.role === 'cashier') {
    rr(g, hx - 16, hyc - 21, 32, 7, 3, '#ffd84a'); rr(g, hx - 7, hyc - 28, 14, 9, 4, '#ffd84a');
  }
  return c;
}
