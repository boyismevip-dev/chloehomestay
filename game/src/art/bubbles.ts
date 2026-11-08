// Bong bóng hội thoại / biểu tượng cảm xúc, tạo thành texture Phaser.
import Phaser from 'phaser';
import { makeCanvas, OUTLINE } from './draw';
import { foodCanvas } from './food';
import { DISHES } from '../data/dishes';

const W = 46, H = 52;
function base(): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const c = makeCanvas(W, H); const g = c.getContext('2d')!;
  g.beginPath(); g.roundRect(3, 3, W - 6, 36, 12); g.moveTo(15, 38); g.lineTo(23, 49); g.lineTo(28, 38); g.closePath();
  g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 2; g.strokeStyle = OUTLINE; g.lineJoin = 'round'; g.stroke();
  return { c, g };
}
function icon(draw: (g: CanvasRenderingContext2D) => void, bg = '#ffffff') {
  const { c, g } = base(); if (bg !== '#ffffff') { g.globalCompositeOperation = 'source-atop'; g.fillStyle = bg; g.fillRect(0, 0, W, 40); g.globalCompositeOperation = 'source-over'; }
  draw(g); return c;
}
export function registerBubbles(scene: Phaser.Scene) {
  const add = (k: string, c: HTMLCanvasElement) => { if (!scene.textures.exists(k)) scene.textures.addCanvas(k, c); };
  add('bubble_blank', base().c);
  add('bub_call', icon((g) => { g.fillStyle = '#ff4a4a'; g.font = 'bold 28px Arial'; g.textAlign = 'center'; g.fillText('!', 23, 33); }));
  add('bub_menu', icon((g) => { g.fillStyle = '#8a5a2c'; g.fillRect(12, 10, 22, 22); g.fillStyle = '#fff'; g.fillRect(15, 13, 16, 16); g.fillStyle = '#c4333a'; for (let i = 0; i < 3; i++) g.fillRect(17, 16 + i * 4, 12, 2); }));
  add('bub_wait', icon((g) => { g.strokeStyle = '#555'; g.lineWidth = 2.5; g.beginPath(); g.arc(23, 21, 11, 0, 7); g.stroke(); g.beginPath(); g.moveTo(23, 21); g.lineTo(23, 14); g.moveTo(23, 21); g.lineTo(29, 24); g.stroke(); }));
  add('bub_angry', icon((g) => { g.fillStyle = '#ff4a4a'; g.beginPath(); g.arc(23, 21, 12, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(15, 14); g.lineTo(21, 18); g.moveTo(31, 14); g.lineTo(25, 18); g.moveTo(16, 29); g.quadraticCurveTo(23, 23, 30, 29); g.stroke(); }));
  add('bub_heart', icon((g) => { g.fillStyle = '#ff4a7a'; g.beginPath(); g.moveTo(23, 32); g.bezierCurveTo(5, 20, 14, 8, 23, 18); g.bezierCurveTo(32, 8, 41, 20, 23, 32); g.fill(); }));
  add('bub_coin', icon((g) => { g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(23, 21, 12, 0, 7); g.fill(); g.strokeStyle = '#b8860b'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#b8860b'; g.font = 'bold 16px Arial'; g.textAlign = 'center'; g.fillText('$', 23, 27); }));
  add('bub_zzz', icon((g) => { g.fillStyle = '#5b7bd5'; g.font = 'bold 15px Arial'; g.textAlign = 'center'; g.fillText('Z', 15, 31); g.font = 'bold 19px Arial'; g.fillText('z', 27, 24); g.font = 'bold 12px Arial'; g.fillText('z', 35, 15); }));
  add('bub_nostock', icon((g) => { g.fillStyle = '#ff4a4a'; g.font = 'bold 12px Arial'; g.textAlign = 'center'; g.fillText('HẾT', 23, 25); }));
  for (const d of DISHES) add('bub_dish_' + d.id, icon((g) => { g.drawImage(foodCanvas(d.id), 7, 4, 32, 32); }));
  // đĩa nhỏ để đặt trên bàn / bếp
  for (const d of DISHES) { const k = 'food_' + d.id; if (!scene.textures.exists(k)) scene.textures.addCanvas(k, foodCanvas(d.id)); }
}
