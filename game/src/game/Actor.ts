import Phaser from 'phaser';
import { Cell, findPath } from '../core/astar';
import { gridToScreen, HW, HH } from '../core/iso';
import { drawCharacter, Look, Frame, CW, CH, FEET } from '../art/characters';
import { Layout } from './Layout';
import { sfx } from '../systems/audio';

export const SC = 0.66;
export interface World { scene: Phaser.Scene; layout: Layout; rate: number }

export function charTex(scene: Phaser.Scene, lookKey: string, look: Look, back: boolean, frame: Frame): string {
  const k = `ch_${lookKey}_${back ? 'b' : 'f'}_${frame}`;
  if (!scene.textures.exists(k)) scene.textures.addCanvas(k, drawCharacter(look, back, frame));
  return k;
}

export class Actor {
  gx = 0; gy = 0;
  path: Cell[] = [];
  speed = 2;
  sprite: Phaser.GameObjects.Image;
  bubble: Phaser.GameObjects.Image;
  bar: Phaser.GameObjects.Graphics;
  back = false; flip = false; t = Math.random() * 3;
  pose: 'stand' | 'sit' | 'work' = 'stand';
  moving = false;
  bubbleKey: string | null = null;
  barValue = -1;
  depthBias = 0;
  stepT = 0;
  constructor(public world: World, public lookKey: string, public look: Look, public kind: 'customer' | 'staff') {
    const s = world.scene;
    this.sprite = s.add.image(0, 0, charTex(s, lookKey, look, false, 'idle')).setOrigin(FEET.x / CW, FEET.y / CH).setScale(SC);
    this.bubble = s.add.image(0, 0, 'bubble_blank').setOrigin(0.5, 1).setVisible(false).setDepth(9e5);
    this.bar = s.add.graphics().setDepth(9e5);
  }
  get cx() { return Math.floor(this.gx); }
  get cy() { return Math.floor(this.gy); }
  setCell(cx: number, cy: number) { this.gx = cx + 0.5; this.gy = cy + 0.5; this.path = []; }
  /** tìm đường A*; goal được phép là ô bị chặn (ghế, bếp...) */
  moveTo(goal: Cell): boolean {
    const p = findPath({ x: this.cx, y: this.cy }, goal, this.world.layout.walkable);
    if (!p) return false; this.path = p; return true;
  }
  setBubble(k: string | null) { this.bubbleKey = k; }
  /** trả về true khi tới đích (không còn đường) */
  stepMove(dt: number): boolean {
    this.moving = false;
    if (!this.path.length) return true;
    const n = this.path[0]; const tx = n.x + 0.5, ty = n.y + 0.5;
    // đường bị chặn đột ngột (do người chơi sắp xếp lại) -> báo hỏng
    if (this.path.length > 1 && !this.world.layout.walkable(n.x, n.y)) { this.path = []; return true; }
    const dx = tx - this.gx, dy = ty - this.gy; const dist = Math.hypot(dx, dy);
    const stp = this.speed * dt;
    this.moving = true;
    const sdx = dx - dy;
    this.back = (dx + dy) < -0.01 ? true : (dx + dy) > 0.01 ? false : this.back;
    if (Math.abs(sdx) > 0.01) this.flip = sdx < 0;
    if (dist <= stp) { this.gx = tx; this.gy = ty; this.path.shift(); } else { this.gx += (dx / dist) * stp; this.gy += (dy / dist) * stp; }
    this.stepT -= dt;
    if (this.stepT <= 0) { this.stepT = 0.36; if (Math.random() < 0.3) sfx('step'); }
    return this.path.length === 0;
  }
  faceDir(dir: number) { // hướng lưới 0:+y 1:-x 2:-y 3:+x
    const d = [[0, 1], [-1, 0], [0, -1], [1, 0]][dir]; const sdx = d[0] - d[1], sdy = d[0] + d[1];
    this.back = sdy < 0; this.flip = sdx < 0;
  }
  facePoint(cx: number, cy: number) {
    const dx = cx + 0.5 - this.gx, dy = cy + 0.5 - this.gy;
    if (Math.abs(dx) + Math.abs(dy) < 0.01) return;
    this.back = dx + dy < 0; this.flip = dx - dy < 0;
  }
  updateView(dt: number, extraY = 0) {
    this.t += dt;
    let frame: Frame = 'idle';
    if (this.pose === 'sit') frame = 'sit';
    else if (this.moving) frame = Math.floor(this.t * 6) % 2 ? 'walk1' : 'walk2';
    else if (this.pose === 'work') frame = Math.floor(this.t * 3) % 2 ? 'work' : 'idle';
    this.sprite.setTexture(charTex(this.world.scene, this.lookKey, this.look, this.back, frame));
    this.sprite.setFlipX(this.flip);
    const p = gridToScreen(this.gx, this.gy);
    const idleBob = this.moving || this.pose === 'sit' ? 0 : Math.sin(this.t * 2.4) * 0.8;
    this.sprite.setPosition(p.x, p.y + extraY + idleBob);
    this.sprite.setDepth((this.gx + this.gy) * 10 + this.depthBias);
    // bong bóng
    if (this.bubbleKey && this.world.scene.textures.exists(this.bubbleKey)) {
      this.bubble.setTexture(this.bubbleKey).setVisible(true).setPosition(p.x + 4, p.y - CH * SC + 2 + extraY + Math.sin(this.t * 4) * 1.5);
    } else this.bubble.setVisible(false);
    this.bar.clear();
    if (this.barValue >= 0) {
      const w = 30, x = p.x - w / 2, y = p.y - CH * SC - 6 + (this.bubbleKey ? -48 : 2);
      this.bar.fillStyle(0x2b2b33, 0.85).fillRoundedRect(x - 1, y - 1, w + 2, 7, 3);
      const v = Math.max(0, Math.min(1, this.barValue));
      this.bar.fillStyle(v > 0.5 ? 0x58e06a : v > 0.25 ? 0xffc93a : 0xff4a4a, 1).fillRoundedRect(x, y, w * v, 5, 2);
    }
  }
  destroy() { this.sprite.destroy(); this.bubble.destroy(); this.bar.destroy(); }
  get screen() { return gridToScreen(this.gx, this.gy); }
}
void HW; void HH;
