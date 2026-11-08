// Bộ vẽ khối isometric bằng Canvas 2D: hộp, trụ, cầu, có bóng và viền hoạt hình.
import { HW, HH } from '../core/iso';

export function parse(hex: string): [number, number, number] {
  if (hex.startsWith('rgb')) { const m = hex.match(/[\d.]+/g)!.map(Number); return [m[0], m[1], m[2]]; }
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}
export function shade(hex: string, f: number): string {
  const [r, g, b] = parse(hex);
  const m = (v: number) => Math.max(0, Math.min(255, Math.round(f >= 1 ? v + (255 - v) * (f - 1) : v * f)));
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
export const OUTLINE = 'rgba(60,30,20,0.62)';

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c;
}

interface Prim { key: number; draw: (g: CanvasRenderingContext2D) => void }
export interface BoxOpt { top?: string; left?: string; right?: string; alpha?: number; noOutline?: boolean }

export class Model {
  prims: Prim[] = [];
  ww: number; wh: number;
  constructor(public w0: number, public h0: number, public rot: number, public zmax: number) {
    this.ww = rot % 2 ? h0 : w0; this.wh = rot % 2 ? w0 : h0;
  }
  pad = 6;
  get ox() { return this.wh * HW + this.pad; }
  get oy() { return this.zmax + this.pad; }
  /** mô hình -> thế giới */
  tx(mx: number, my: number): [number, number] {
    switch (this.rot) {
      case 1: return [this.h0 - my, mx];
      case 2: return [this.w0 - mx, this.h0 - my];
      case 3: return [my, this.w0 - mx];
      default: return [mx, my];
    }
  }
  P(wx: number, wy: number, z: number): [number, number] { return [(wx - wy) * HW + this.ox, (wx + wy) * HH - z + this.oy]; }

  box(mx0: number, my0: number, z0: number, mx1: number, my1: number, z1: number, color: string, o: BoxOpt = {}) {
    const a = this.tx(mx0, my0), b = this.tx(mx1, my1);
    const X0 = Math.min(a[0], b[0]), X1 = Math.max(a[0], b[0]), Y0 = Math.min(a[1], b[1]), Y1 = Math.max(a[1], b[1]);
    const top = o.top || shade(color, 1.22), left = o.left || color, right = o.right || shade(color, 0.76);
    this.prims.push({ key: X1 + Y1 + z0 * 0.0002, draw: (g) => {
      const quad = (pts: [number, number][], fill: string) => {
        g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
        g.fillStyle = fill; g.fill(); if (!o.noOutline) g.stroke();
      };
      g.save(); g.globalAlpha = o.alpha ?? 1; g.lineWidth = 1.4; g.strokeStyle = OUTLINE; g.lineJoin = 'round';
      quad([this.P(X0, Y1, z0), this.P(X1, Y1, z0), this.P(X1, Y1, z1), this.P(X0, Y1, z1)], left);
      quad([this.P(X1, Y0, z0), this.P(X1, Y1, z0), this.P(X1, Y1, z1), this.P(X1, Y0, z1)], right);
      quad([this.P(X0, Y0, z1), this.P(X1, Y0, z1), this.P(X1, Y1, z1), this.P(X0, Y1, z1)], top);
      g.restore();
    } });
  }
  cyl(mx: number, my: number, z0: number, r: number, z1: number, color: string, alpha = 1) {
    const [cx, cy] = this.tx(mx, my);
    this.prims.push({ key: cx + cy + z0 * 0.0002, draw: (g) => {
      const [px, py] = this.P(cx, cy, 0); const rx = r * HW * 1.414, ry = r * HH * 1.414;
      g.save(); g.globalAlpha = alpha; g.lineWidth = 1.4; g.strokeStyle = OUTLINE;
      const grad = g.createLinearGradient(px - rx, 0, px + rx, 0);
      grad.addColorStop(0, shade(color, 1.1)); grad.addColorStop(0.45, color); grad.addColorStop(1, shade(color, 0.62));
      g.beginPath(); g.ellipse(px, py - z0, rx, ry, 0, 0, Math.PI); g.lineTo(px - rx, py - z1); g.ellipse(px, py - z1, rx, ry, 0, Math.PI, 0, true); g.closePath();
      g.fillStyle = grad; g.fill(); g.stroke();
      g.beginPath(); g.ellipse(px, py - z1, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = shade(color, 1.25); g.fill(); g.stroke();
      g.restore();
    } });
  }
  sphere(mx: number, my: number, z: number, rpx: number, color: string, glow = false) {
    const [cx, cy] = this.tx(mx, my);
    this.prims.push({ key: cx + cy + z * 0.0002 + 0.01, draw: (g) => {
      const [px, py] = this.P(cx, cy, z);
      g.save();
      if (glow) { const gg = g.createRadialGradient(px, py, 1, px, py, rpx * 3); gg.addColorStop(0, 'rgba(255,240,170,0.7)'); gg.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gg; g.fillRect(px - rpx * 3, py - rpx * 3, rpx * 6, rpx * 6); }
      const rg = g.createRadialGradient(px - rpx * 0.35, py - rpx * 0.4, rpx * 0.1, px, py, rpx);
      rg.addColorStop(0, shade(color, 1.45)); rg.addColorStop(0.55, color); rg.addColorStop(1, shade(color, 0.65));
      g.beginPath(); g.arc(px, py, rpx, 0, Math.PI * 2); g.fillStyle = rg; g.fill();
      g.lineWidth = 1.4; g.strokeStyle = OUTLINE; g.stroke(); g.restore();
    } });
  }
  /** vẽ trực tiếp (decal) tại 1 điểm mô hình, thứ tự theo vị trí */
  custom(mx: number, my: number, z: number, fn: (g: CanvasRenderingContext2D, px: number, py: number) => void) {
    const [cx, cy] = this.tx(mx, my);
    this.prims.push({ key: cx + cy + z * 0.0002 + 0.02, draw: (g) => { const [px, py] = this.P(cx, cy, z); fn(g, px, py); } });
  }

  render(shadow = true): { canvas: HTMLCanvasElement; ox: number; oy: number } {
    const c = makeCanvas((this.ww + this.wh) * HW + this.pad * 2, (this.ww + this.wh) * HH + this.zmax + this.pad * 2);
    const g = c.getContext('2d')!;
    if (shadow) {
      g.fillStyle = 'rgba(30,20,40,0.2)'; g.beginPath();
      const pts = [this.P(0.04, 0.04, 0), this.P(this.ww + 0.18, 0.04, 0), this.P(this.ww + 0.18, this.wh + 0.18, 0), this.P(0.04, this.wh + 0.18, 0)];
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
    }
    this.prims.sort((a, b) => a.key - b.key).forEach((p) => p.draw(g));
    return { canvas: c, ox: this.ox, oy: this.oy };
  }
}

/** cắt viền trong suốt, trả về dataURL cho icon UI */
export function trimmedURL(src: HTMLCanvasElement, maxSide = 96): string {
  const g = src.getContext('2d')!; const { width: w, height: h } = src;
  const d = g.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < x0) return src.toDataURL();
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1; const k = Math.min(1, maxSide / Math.max(cw, ch));
  const out = makeCanvas(cw * k + 4, ch * k + 4); const og = out.getContext('2d')!;
  og.imageSmoothingQuality = 'high'; og.drawImage(src, x0, y0, cw, ch, 2, 2, cw * k, ch * k);
  return out.toDataURL();
}
