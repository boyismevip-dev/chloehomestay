// Vẽ sàn caro, tường isometric, cửa ra vào, vỉa hè & bãi cỏ vào 1 texture duy nhất.
import { HW, HH } from '../core/iso';
import { makeCanvas, shade, OUTLINE } from './draw';
import { STYLE_BY_ID, DOOR_Y } from '../data/catalog';

export const WALL_H = 112;
export const DOOR_H = 86;
const WT = 0.2; // độ dày tường (ô)
const LEN = Math.hypot(HW, HH);

export interface RoomArt { canvas: HTMLCanvasElement; ox: number; oy: number }

export function renderRoom(W: number, H: number, floorId: string, wallId: string, doorId: string): RoomArt {
  const minX = -7, maxX = W + 3, minY = -3, maxY = H + 3;
  const sxMin = (minX - maxY) * HW, sxMax = (maxX - minY) * HW;
  const syMin = (minX + minY) * HH - WALL_H - 20, syMax = (maxX + maxY) * HH + 24;
  const c = makeCanvas(sxMax - sxMin, syMax - syMin); const g = c.getContext('2d')!;
  const ox = -sxMin, oy = -syMin;
  const P = (x: number, y: number, z = 0): [number, number] => [(x - y) * HW + ox, (x + y) * HH - z + oy];
  const poly = (pts: [number, number][], fill: string, stroke?: string, lw = 1) => {
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
    g.fillStyle = fill; g.fill(); if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.stroke(); }
  };
  const tile = (x: number, y: number, fill: string, stroke?: string) => poly([P(x, y), P(x + 1, y), P(x + 1, y + 1), P(x, y + 1)], fill, stroke);
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;

  // ---- bãi cỏ nền ----
  for (let y = minY; y <= maxY - 1; y++) for (let x = minX; x <= maxX - 1; x++) {
    if (inside(x, y)) continue;
    const d = Math.max(0, x - (W - 1), y - (H - 1));
    if (d > 2 && x >= 0) continue;
    tile(x, y, (x + y) & 1 ? '#8fdc6a' : '#86d363');
  }
  // viền đất phía trước
  const fe = (x: number, y: number): [number, number] => P(x, y);
  g.fillStyle = '#9a6b3c'; g.beginPath(); g.moveTo(...fe(maxX - 1 - 0, minY)); g.lineTo(...fe(maxX - 1, maxY - 1)); g.lineTo(...fe(minX, maxY - 1)); g.lineTo(fe(minX, maxY - 1)[0], fe(minX, maxY - 1)[1] + 10); g.lineTo(fe(maxX - 1, maxY - 1)[0], fe(maxX - 1, maxY - 1)[1] + 10); g.lineTo(fe(maxX - 1, minY)[0], fe(maxX - 1, minY)[1] + 10); g.closePath(); g.globalCompositeOperation = 'destination-over'; g.fill(); g.globalCompositeOperation = 'source-over';
  // vỉa hè tới cửa
  for (let x = minX; x <= -1; x++) tile(x, DOOR_Y, (x & 1) ? '#d9d6cf' : '#cfccc4', '#b0ada5');
  for (let x = minX; x <= -1; x++) for (const dy of [-1, 1]) tile(x, DOOR_Y + dy, '#c9c6be', '#b0ada5');

  // ---- sàn ----
  const fl = STYLE_BY_ID[floorId];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = (x + y) & 1;
    if (floorId === 'floor_wood') {
      tile(x, y, a ? fl.c1 : fl.c2, shade(fl.c3, 1.1));
      g.strokeStyle = 'rgba(80,40,10,0.35)'; g.lineWidth = 1; g.beginPath();
      for (let k = 1; k < 4; k++) { const t = k / 4; g.moveTo(...P(x, y + t)); g.lineTo(...P(x + 1, y + t)); } g.stroke();
    } else {
      tile(x, y, a ? fl.c1 : fl.c2, fl.c3);
      if (!a) { // chấm đen ở tâm ô trắng
        const [cx, cy] = P(x + 0.5, y + 0.5); poly([[cx, cy - 5], [cx + 9, cy], [cx, cy + 5], [cx - 9, cy]], fl.c3);
      }
    }
  }
  // viền sàn dày
  poly([P(0, H), P(W, H), [P(W, H)[0], P(W, H)[1] + 8], [P(0, H)[0], P(0, H)[1] + 8]], shade(fl.c3, 1.0));
  poly([P(W, 0), P(W, H), [P(W, H)[0], P(W, H)[1] + 8], [P(W, 0)[0], P(W, 0)[1] + 8]], shade(fl.c3, 0.7));
  // thảm chào cửa
  poly([P(0.05, DOOR_Y + 0.12), P(1.1, DOOR_Y + 0.12), P(1.1, DOOR_Y + 0.88), P(0.05, DOOR_Y + 0.88)], '#7a3b2a', OUTLINE);
  poly([P(0.15, DOOR_Y + 0.22), P(1.0, DOOR_Y + 0.22), P(1.0, DOOR_Y + 0.78), P(0.15, DOOR_Y + 0.78)], '#a5503a');

  // ---- tường ----
  const ws = STYLE_BY_ID[wallId];
  const paintFace = (face: 'L' | 'R', u0: number, u1: number, v0: number, v1: number) => {
    // tô mẫu tường trong hệ (u: px dọc tường, v: px chiều cao)
    g.save();
    const sx = (face === 'L' ? -HW : HW) / LEN, sy = HH / LEN;
    g.setTransform(sx, sy, 0, -1, ox, oy);
    g.beginPath(); g.rect(u0, v0, u1 - u0, v1 - v0); g.clip();
    const bright = face === 'L' ? 1 : 0.86;
    const col = (h: string, k = 1) => shade(h, bright * k);
    g.fillStyle = col(ws.c1); g.fillRect(u0, v0, u1 - u0, v1 - v0);
    const stripeW = 11;
    if (wallId === 'wall_cream' || wallId === 'wall_blue') {
      g.fillStyle = col(ws.c2); for (let u = 0; u < (face === 'L' ? H : W) * LEN; u += stripeW * 2) g.fillRect(u, 0, stripeW, WALL_H);
    } else if (wallId === 'wall_brick') {
      g.strokeStyle = col(ws.c3); g.lineWidth = 1.2;
      for (let v = 0, r = 0; v < WALL_H; v += 10, r++) { g.beginPath(); g.moveTo(0, v); g.lineTo(2000, v); g.stroke(); for (let u = (r % 2) * 14; u < 2000; u += 28) { g.beginPath(); g.moveTo(u, v); g.lineTo(u, v + 10); g.stroke(); } }
    } else if (wallId === 'wall_pink') {
      g.fillStyle = col(ws.c2); for (let u = 8; u < 2000; u += 18) for (let v = 6, r = 0; v < WALL_H; v += 16, r++) { g.beginPath(); g.arc(u + (r % 2) * 9, v, 3, 0, 7); g.fill(); }
    } else if (wallId === 'wall_wood') {
      g.strokeStyle = col(ws.c3); g.lineWidth = 1.2; for (let v = 0; v < WALL_H; v += 14) { g.beginPath(); g.moveTo(0, v); g.lineTo(2000, v); g.stroke(); }
    } else if (wallId === 'wall_teal') {
      g.fillStyle = col(ws.c2); g.fillRect(0, 0, 2000, 36); g.fillStyle = col(ws.c3); g.fillRect(0, 34, 2000, 3);
    }
    // chân tường + gờ trên
    g.fillStyle = col(ws.c3, 0.9); g.fillRect(0, 0, 2000, 7); g.fillStyle = col(ws.c3, 1.05); g.fillRect(0, WALL_H - 6, 2000, 6);
    g.restore();
  };
  const topCap = (pts: [number, number][]) => poly(pts, shade(ws.c1, 1.18), OUTLINE, 1.4);

  // tường trái (mặt phẳng x=0, cạnh ngoài x=-WT)
  const L0 = 0, L1 = DOOR_Y * LEN, L2 = (DOOR_Y + 1) * LEN, L3 = H * LEN;
  paintFace('L', L0, L1, 0, WALL_H); paintFace('L', L2, L3, 0, WALL_H); paintFace('L', L1, L2, DOOR_H, WALL_H);
  // mặt đầu mút của đoạn tường tại cửa (dày)
  poly([P(-WT, DOOR_Y, 0), P(0, DOOR_Y, 0), P(0, DOOR_Y, WALL_H), P(-WT, DOOR_Y, WALL_H)], shade(ws.c1, 0.78), OUTLINE, 1.2);
  // phần dày trên cửa
  poly([P(-WT, DOOR_Y, DOOR_H), P(-WT, DOOR_Y + 1, DOOR_H), P(0, DOOR_Y + 1, DOOR_H), P(0, DOOR_Y, DOOR_H)], shade(ws.c1, 0.6));
  topCap([P(-WT, 0, WALL_H), P(0, 0, WALL_H), P(0, H, WALL_H), P(-WT, H, WALL_H)]);
  poly([P(-WT, H, 0), P(0, H, 0), P(0, H, WALL_H), P(-WT, H, WALL_H)], shade(ws.c1, 0.74), OUTLINE, 1.4); // đầu mút trước
  // tường phải (mặt phẳng y=0)
  paintFace('R', 0, W * LEN, 0, WALL_H);
  topCap([P(0, -WT, WALL_H), P(W, -WT, WALL_H), P(W, 0, WALL_H), P(0, 0, WALL_H)]);
  poly([P(W, -WT, 0), P(W, 0, 0), P(W, 0, WALL_H), P(W, -WT, WALL_H)], shade(ws.c1, 0.66), OUTLINE, 1.4);
  topCap([P(-WT, -WT, WALL_H), P(0, -WT, WALL_H), P(0, 0, WALL_H), P(-WT, 0, WALL_H)]);
  // viền mép đứng
  g.strokeStyle = OUTLINE; g.lineWidth = 1.6; g.beginPath(); g.moveTo(...P(0, 0, 0)); g.lineTo(...P(0, 0, WALL_H)); g.stroke();
  g.beginPath(); g.moveTo(...P(0, H, 0)); g.lineTo(...P(0, H, WALL_H)); g.stroke();
  g.beginPath(); g.moveTo(...P(W, 0, 0)); g.lineTo(...P(W, 0, WALL_H)); g.stroke();

  // ---- khung cửa ----
  const dr = STYLE_BY_ID[doorId];
  const post = (y0: number, y1: number) => poly([P(0.02, y0, 0), P(0.02, y1, 0), P(0.02, y1, DOOR_H), P(0.02, y0, DOOR_H)], dr.c1, OUTLINE, 1.4);
  post(DOOR_Y, DOOR_Y + 0.1); post(DOOR_Y + 0.9, DOOR_Y + 1);
  poly([P(0.02, DOOR_Y, DOOR_H - 7), P(0.02, DOOR_Y + 1, DOOR_H - 7), P(0.02, DOOR_Y + 1, DOOR_H), P(0.02, DOOR_Y, DOOR_H)], dr.c1, OUTLINE, 1.4);
  poly([P(0.02, DOOR_Y + 0.1, DOOR_H - 14), P(0.02, DOOR_Y + 0.9, DOOR_H - 14), P(0.02, DOOR_Y + 0.9, DOOR_H - 7), P(0.02, DOOR_Y + 0.1, DOOR_H - 7)], dr.c2, OUTLINE, 1);
  // mái hiên sọc
  for (let i = 0; i < 8; i++) { const y0 = DOOR_Y - 0.1 + i * 0.15, y1 = y0 + 0.15; poly([P(-0.62, y0, DOOR_H + 10), P(-0.62, y1, DOOR_H + 10), P(0.04, y1, DOOR_H + 2), P(0.04, y0, DOOR_H + 2)], i & 1 ? '#ffffff' : dr.c1, OUTLINE, 1); }
  // đèn nhỏ trên cửa
  const [lx, ly] = P(0.02, DOOR_Y + 0.5, DOOR_H - 22); g.fillStyle = dr.c3; g.beginPath(); g.arc(lx, ly, 4, 0, 7); g.fill(); g.strokeStyle = OUTLINE; g.stroke();
  return { canvas: c, ox, oy };
}
