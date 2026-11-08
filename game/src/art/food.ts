import { makeCanvas, OUTLINE } from './draw';

type D = (g: CanvasRenderingContext2D) => void;
const E = (g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke = true) => {
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); if (stroke) { g.lineWidth = 1.6; g.strokeStyle = OUTLINE; g.stroke(); }
};
const R = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, r = 3) => {
  g.beginPath(); g.roundRect(x, y, w, h, r); g.fillStyle = fill; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUTLINE; g.stroke();
};
const plate = (g: CanvasRenderingContext2D) => { E(g, 32, 46, 27, 12, '#ffffff'); E(g, 32, 45, 20, 8, '#eef2f7', false); };
const glass = (g: CanvasRenderingContext2D, liquid: string, top?: string) => {
  g.beginPath(); g.moveTo(18, 14); g.lineTo(46, 14); g.lineTo(42, 54); g.lineTo(22, 54); g.closePath();
  g.fillStyle = 'rgba(210,240,255,0.55)'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUTLINE; g.stroke();
  g.beginPath(); g.moveTo(19.5, 24); g.lineTo(44.5, 24); g.lineTo(42, 54); g.lineTo(22, 54); g.closePath(); g.fillStyle = liquid; g.fill();
  if (top) { E(g, 32, 24, 12.5, 3.5, top, false); }
};

const ART: Record<string, D> = {
  burger: (g) => { plate(g); E(g, 32, 40, 19, 6, '#c8863c'); E(g, 32, 36, 18, 6, '#5a3320'); E(g, 32, 32, 19, 5, '#4fc24f'); E(g, 32, 29, 17, 4, '#ffc93a'); E(g, 32, 26, 19, 8, '#e09b45'); E(g, 32, 22, 17, 5, '#f0b25a', false); [[27, 22], [33, 20], [38, 23], [30, 25]].forEach(([x, y]) => E(g, x, y, 1.3, 0.8, '#fff3c4', false)); },
  rice: (g) => { plate(g); E(g, 32, 38, 20, 10, '#ffffff'); g.beginPath(); g.moveTo(14, 38); g.quadraticCurveTo(32, 6, 50, 38); g.closePath(); g.fillStyle = '#fffdf2'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUTLINE; g.stroke(); E(g, 44, 40, 7, 4, '#e0645a'); E(g, 22, 41, 6, 3.5, '#5cc45a'); E(g, 32, 28, 3, 2, '#ffd84a', false); },
  soda: (g) => { glass(g, '#ff6a3d', '#ffb08f'); g.fillStyle = '#ffffff'; [[28, 32], [35, 40], [31, 47], [37, 29]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); }); g.strokeStyle = '#ff3b6b'; g.lineWidth = 3; g.beginPath(); g.moveTo(36, 26); g.lineTo(42, 4); g.stroke(); },
  pizza: (g) => { plate(g); g.beginPath(); g.moveTo(10, 28); g.quadraticCurveTo(32, 12, 54, 28); g.lineTo(32, 56); g.closePath(); g.fillStyle = '#f4c25b'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUTLINE; g.stroke(); g.beginPath(); g.moveTo(14, 29); g.quadraticCurveTo(32, 17, 50, 29); g.lineTo(32, 50); g.closePath(); g.fillStyle = '#ffd96a'; g.fill(); [[26, 30], [38, 31], [32, 40], [32, 27]].forEach(([x, y]) => E(g, x, y, 4.2, 3.2, '#d9443a')); E(g, 24, 37, 2, 1.4, '#4fc24f', false); E(g, 41, 38, 2, 1.4, '#4fc24f', false); },
  spaghetti: (g) => { plate(g); E(g, 32, 38, 19, 9, '#ffe27a'); E(g, 32, 33, 15, 7, '#ffd34a'); g.strokeStyle = '#e8b830'; g.lineWidth = 1.6; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(32, 33, 13 - i * 3, 5.5 - i * 1.2, 0, 0, 6.3); g.stroke(); } E(g, 32, 26, 9, 5, '#e0503f'); E(g, 28, 24, 3, 2, '#5cc45a', false); E(g, 37, 25, 3, 2, '#5cc45a', false); },
  coffee: (g) => { E(g, 32, 50, 26, 10, '#ffffff'); g.beginPath(); g.moveTo(16, 24); g.lineTo(46, 24); g.quadraticCurveTo(46, 50, 31, 50); g.quadraticCurveTo(16, 50, 16, 24); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUTLINE; g.stroke(); E(g, 31, 24, 15, 5, '#6b3d1f'); E(g, 31, 24, 7, 2.2, '#d9a066', false); g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.arc(48, 33, 6, -1.4, 1.4); g.stroke(); g.strokeStyle = OUTLINE; g.lineWidth = 1.6; g.beginPath(); g.arc(48, 33, 8.5, -1.4, 1.4); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; for (const x of [26, 34]) { g.beginPath(); g.moveTo(x, 18); g.quadraticCurveTo(x + 4, 12, x, 6); g.stroke(); } },
  pastry: (g) => { plate(g); g.beginPath(); g.moveTo(10, 40); g.quadraticCurveTo(10, 18, 32, 18); g.quadraticCurveTo(54, 18, 54, 40); g.closePath(); g.fillStyle = '#e8a257'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUTLINE; g.stroke(); g.beginPath(); g.moveTo(12, 30); g.quadraticCurveTo(20, 20, 32, 22); g.quadraticCurveTo(46, 20, 52, 30); g.quadraticCurveTo(46, 36, 40, 31); g.quadraticCurveTo(32, 38, 24, 31); g.quadraticCurveTo(16, 37, 12, 30); g.fillStyle = '#ff8fc0'; g.fill(); [[22, 27], [32, 25], [42, 27]].forEach(([x, y], i) => E(g, x, y, 1.6, 1, ['#fff', '#ffd84a', '#7fd1ff'][i], false)); E(g, 32, 14, 4, 4, '#ff3b5c'); },
  icecream: (g) => { g.beginPath(); g.moveTo(21, 30); g.lineTo(43, 30); g.lineTo(32, 60); g.closePath(); g.fillStyle = '#e3a65a'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUTLINE; g.stroke(); g.strokeStyle = 'rgba(120,70,20,0.5)'; g.lineWidth = 1.2; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(24 + i * 3, 33 + i * 7); g.lineTo(40 - i * 3, 33 + i * 7); g.stroke(); } E(g, 32, 28, 14, 8, '#ff9ec7'); E(g, 32, 20, 11, 7, '#fff3c4'); E(g, 32, 13, 7, 5, '#8fe0ff'); E(g, 32, 6, 3.5, 3.5, '#ff3b5c'); },
  cake: (g) => { plate(g); R(g, 12, 28, 40, 22, '#fff3d6', 5); R(g, 12, 28, 40, 9, '#ff9ec7', 5); g.fillStyle = '#ff9ec7'; for (const x of [18, 28, 38, 46]) { g.beginPath(); g.arc(x, 37, 3.2, 0, Math.PI); g.fill(); } E(g, 32, 28, 20, 6, '#fff9e8'); for (const [x, c] of [[22, '#ff3b5c'], [32, '#ff3b5c'], [42, '#ff3b5c']] as [number, string][]) E(g, x, 24, 4, 3.5, c); R(g, 31, 8, 3, 12, '#7fd1ff', 1); E(g, 32.5, 6, 2.2, 3, '#ffd84a'); },
  boba: (g) => { glass(g, '#d9a066', '#f5deb8'); g.fillStyle = '#2b1a14'; [[24, 48], [30, 50], [36, 49], [28, 45], [34, 46], [40, 50], [25, 52]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill(); }); g.strokeStyle = '#ff7ab8'; g.lineWidth = 4; g.beginPath(); g.moveTo(34, 30); g.lineTo(41, 4); g.stroke(); },
};
const urls = new Map<string, string>();
const canv = new Map<string, HTMLCanvasElement>();
export function foodCanvas(id: string): HTMLCanvasElement {
  let c = canv.get(id);
  if (!c) { c = makeCanvas(64, 64); ART[id]?.(c.getContext('2d')!); canv.set(id, c); }
  return c;
}
export function foodIcon(id: string): string {
  let u = urls.get(id); if (!u) { u = foodCanvas(id).toDataURL(); urls.set(id, u); } return u;
}
