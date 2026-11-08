import Phaser from 'phaser';
import { S, store, PlacedItem } from '../core/state';
import { bus } from '../core/bus';
import { gridToScreen, screenToGrid, HW, HH } from '../core/iso';
import { renderRoom, WALL_H } from '../art/room';
import { furnitureArt } from '../art/furniture';
import { registerBubbles } from '../art/bubbles';
import { FURN_BY_ID, DOOR_Y, FurnDef } from '../data/catalog';
import { Restaurant, Fx } from './Restaurant';
import { footprint, key } from './Layout';
import { placeFromInventory, removeToInventory, sellItem } from '../systems/actions';
import { sfx } from '../systems/audio';
import { DIRS } from '../core/iso';
import { foodCanvas } from '../art/food';
import { makeCanvas } from '../art/draw';
import { DISH_BY_ID } from '../data/dishes';
import { clamp } from '../core/rng';

interface Holding { kind: 'new' | 'move'; type: string; uid?: number; rot: number; x: number; y: number; valid: boolean; orig?: { x: number; y: number; rot: number } }
export interface BuildUIState { on: boolean; holding: { type: string; valid: boolean; kind: string } | null; selected: { uid: number; type: string } | null }

export let gameApi: GameScene | null = null;

export class GameScene extends Phaser.Scene {
  R!: Restaurant;
  fx!: Fx;
  roomImg?: Phaser.GameObjects.Image;
  roomKey = '';
  views = new Map<number, Phaser.GameObjects.Image>();
  plates = new Map<number, Phaser.GameObjects.Image>();
  stoveFood = new Map<number, Phaser.GameObjects.Image>();
  ghost?: Phaser.GameObjects.Image;
  gfx!: Phaser.GameObjects.Graphics;
  buildOn = false;
  holding: Holding | null = null;
  selected: number | null = null;
  dragCand: { uid: number; sx: number; sy: number } | null = null;
  panning: { sx: number; sy: number; cx: number; cy: number; moved: boolean } | null = null;
  pinch: { d: number; zoom: number } | null = null;
  userMoved = false;
  lastPtr = { x: 0, y: 0 };

  constructor() { super('Game'); }

  create() {
    gameApi = this; (window as any).__scene = this;
    registerBubbles(this);
    this.makeMiscTextures();
    this.gfx = this.add.graphics().setDepth(8e5);
    this.rebuildRoom();
    this.syncItems();
    this.fx = this.makeFx();
    this.R = new Restaurant(this, this.fx);
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.fitCamera();
    this.input.addPointer(2);
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('pointerupoutside', this.onUp, this);
    this.input.on('wheel', (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => this.zoomAt(p.x, p.y, this.cameras.main.zoom * (dy > 0 ? 0.9 : 1.1)));
    this.scale.on('resize', () => { if (!this.userMoved) this.fitCamera(); });
    this.input.keyboard?.on('keydown-R', () => this.rotate());
    this.input.keyboard?.on('keydown-ESC', () => this.cancelHolding());
    this.input.keyboard?.on('keydown-DELETE', () => this.sellSelected());
    bus.on('rebuild-room', () => this.rebuildRoom());
    bus.on('items-changed', () => { this.syncItems(); });
    bus.on('fit-camera', () => { this.userMoved = false; this.fitCamera(); });
    // dọn dẹp chuỗi sự kiện khi scene dừng
    this.events.once('shutdown', () => { gameApi = null; });
    // vài khách đầu tiên cho sinh động ngay khi mở game
    this.R.spawnT = 0.4;
  }

  // ---------- textures phụ ----------
  makeMiscTextures() {
    const coin = makeCanvas(20, 20); const g = coin.getContext('2d')!;
    g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(10, 10, 8, 0, 7); g.fill(); g.strokeStyle = '#b8860b'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#b8860b'; g.font = 'bold 11px Arial'; g.textAlign = 'center'; g.fillText('$', 10, 14);
    this.textures.addCanvas('coin', coin);
    const dot = makeCanvas(16, 16); const d = dot.getContext('2d')!; const gr = d.createRadialGradient(8, 8, 1, 8, 8, 8); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); d.fillStyle = gr; d.fillRect(0, 0, 16, 16);
    this.textures.addCanvas('puff', dot);
    const dp = makeCanvas(64, 64); const p = dp.getContext('2d')!; p.fillStyle = '#ffffff'; p.beginPath(); p.ellipse(32, 46, 27, 12, 0, 0, 7); p.fill(); p.strokeStyle = 'rgba(60,30,20,.6)'; p.lineWidth = 1.6; p.stroke(); p.fillStyle = '#c9a56a'; for (const [x, y] of [[26, 44], [38, 47], [32, 42], [43, 44]]) { p.beginPath(); p.arc(x, y, 2.4, 0, 7); p.fill(); }
    this.textures.addCanvas('plate_dirty', dp);
    const st = makeCanvas(24, 24); const s = st.getContext('2d')!; s.fillStyle = '#fff6a8'; s.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283, r = i % 2 ? 4 : 11; s.lineTo(12 + Math.cos(a) * r, 12 + Math.sin(a) * r); } s.closePath(); s.fill();
    this.textures.addCanvas('spark', st);
  }
  makeFx(): Fx {
    const self = this;
    return {
      float(x, y, text, color = '#ffffff') {
        const t = self.add.text(x, y, text, { fontFamily: '"Baloo 2", Arial', fontSize: '20px', fontStyle: '800', color, stroke: '#3b2410', strokeThickness: 4 }).setOrigin(0.5).setDepth(9.5e5);
        self.tweens.add({ targets: t, y: y - 38, alpha: 0, duration: 1400, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
      },
      coins(x, y) {
        for (let i = 0; i < 6; i++) {
          const c = self.add.image(x, y, 'coin').setDepth(9.4e5).setScale(0.9);
          self.tweens.add({ targets: c, x: x + Phaser.Math.Between(-36, 36), y: y - Phaser.Math.Between(40, 90), alpha: 0, scale: 0.5, duration: 900, ease: 'Cubic.easeOut', delay: i * 30, onComplete: () => c.destroy() });
        }
      },
      steam(x, y) {
        const p = self.add.image(x + Phaser.Math.Between(-8, 8), y, 'puff').setDepth(9e5).setAlpha(0.8).setScale(0.8);
        self.tweens.add({ targets: p, y: y - 34, alpha: 0, scale: 1.8, duration: 900, onComplete: () => p.destroy() });
      },
      sparkle(x, y) {
        for (let i = 0; i < 8; i++) {
          const p = self.add.image(x, y, 'spark').setDepth(9.4e5).setScale(0.6);
          const a = (i / 8) * 6.283;
          self.tweens.add({ targets: p, x: x + Math.cos(a) * 46, y: y + Math.sin(a) * 28 - 10, alpha: 0, scale: 0.2, angle: 180, duration: 650, onComplete: () => p.destroy() });
        }
      },
    };
  }

  // ---------- phòng ----------
  rebuildRoom() {
    const s = S();
    const k = `room_${s.gridW}x${s.gridH}_${s.floor}_${s.wall}_${s.door}`;
    if (this.roomKey === k) return;
    const art = renderRoom(s.gridW, s.gridH, s.floor, s.wall, s.door);
    if (this.textures.exists(k)) this.textures.remove(k);
    this.textures.addCanvas(k, art.canvas);
    const old = this.roomKey; this.roomKey = k;
    this.roomImg?.destroy();
    this.roomImg = this.add.image(0, 0, k).setOrigin(art.ox / art.canvas.width, art.oy / art.canvas.height).setDepth(-10);
    if (old && this.textures.exists(old)) this.textures.remove(old);
    this.R?.relayout();
  }

  // ---------- đồ vật ----------
  texFor(type: string, rot: number, side: 'L' | 'R') {
    const art = furnitureArt(type, rot, side);
    const k = `fa_${type}_${FURN_BY_ID[type].wall ? side : rot}`;
    if (!this.textures.exists(k)) this.textures.addCanvas(k, art.canvas);
    return { k, art };
  }
  wallSide(it: { rot: number }): 'L' | 'R' { return it.rot % 2 === 0 ? 'L' : 'R'; }
  placeSprite(img: Phaser.GameObjects.Image, it: { type: string; x: number; y: number; rot: number }) {
    const d = FURN_BY_ID[it.type];
    const side = this.wallSide(it);
    const { k, art } = this.texFor(it.type, it.rot, side);
    img.setTexture(k).setOrigin(art.ox / art.canvas.width, art.oy / art.canvas.height);
    if (d.wall) {
      const p = side === 'L' ? gridToScreen(0, it.y) : gridToScreen(it.x, 0);
      img.setPosition(p.x, p.y).setDepth(side === 'L' ? it.y * 0.01 : it.x * 0.01);
    } else {
      const p = gridToScreen(it.x, it.y); img.setPosition(p.x, p.y);
      const odd = it.rot % 2; const fw = odd ? d.h : d.w, fh = odd ? d.w : d.h;
      img.setDepth(d.blocks ? (it.x + fw / 2 + it.y + fh / 2) * 10 : 0.5);
    }
  }
  syncItems() {
    const items = S().items; const seen = new Set<number>();
    for (const it of items) {
      seen.add(it.uid);
      let v = this.views.get(it.uid);
      if (!v) { v = this.add.image(0, 0, '__DEFAULT'); this.views.set(it.uid, v); }
      this.placeSprite(v, it);
      v.setVisible(!(this.holding?.kind === 'move' && this.holding.uid === it.uid));
    }
    for (const [uid, v] of this.views) if (!seen.has(uid)) { v.destroy(); this.views.delete(uid); }
    this.R?.relayout();
    this.emitBuild();
  }

  // ---------- camera ----------
  bounds() {
    const s = S(); const W = s.gridW, H = s.gridH;
    return { x0: -H * HW - 40, x1: W * HW + 40, y0: -WALL_H - 30, y1: (W + H) * HH + 30 };
  }
  fitCamera() {
    const cam = this.cameras.main; const b = this.bounds();
    const topPad = 70, botPad = 120;
    const availW = cam.width, availH = cam.height - topPad - botPad;
    const z = clamp(Math.min(availW / (b.x1 - b.x0), availH / (b.y1 - b.y0)), 0.35, 1.5);
    cam.setZoom(z);
    cam.centerOn((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2 + (botPad - topPad) / 2 / z);
  }
  zoomAt(px: number, py: number, z: number) {
    const cam = this.cameras.main; const before = cam.getWorldPoint(px, py);
    cam.setZoom(clamp(z, 0.3, 2.6));
    const after = cam.getWorldPoint(px, py);
    cam.scrollX += before.x - after.x; cam.scrollY += before.y - after.y;
    this.userMoved = true;
  }
  clampCamera() {
    const cam = this.cameras.main; const b = this.bounds();
    const cx = cam.scrollX + cam.width / 2, cy = cam.scrollY + cam.height / 2;
    const nx = clamp(cx, b.x0, b.x1), ny = clamp(cy, b.y0, b.y1);
    cam.scrollX += nx - cx; cam.scrollY += ny - cy;
  }

  // ---------- input ----------
  world(p: { x: number; y: number }) { return this.cameras.main.getWorldPoint(p.x, p.y); }

  hitItem(wx: number, wy: number): PlacedItem | null {
    const list = [...S().items].sort((a, b) => (this.views.get(b.uid)?.depth ?? 0) - (this.views.get(a.uid)?.depth ?? 0));
    const g = screenToGrid(wx, wy); const gcx = Math.floor(g.x), gcy = Math.floor(g.y);
    for (const it of list) {
      const v = this.views.get(it.uid); if (!v || !v.visible) continue;
      const b = v.getBounds(); if (!b.contains(wx, wy)) continue;
      const lx = Math.floor(wx - b.x), ly = Math.floor(wy - b.y);
      for (const [dx, dy] of [[0, 0], [4, 0], [-4, 0], [0, 4], [0, -4]]) {
        const a = this.textures.getPixelAlpha(lx + dx, ly + dy, v.texture.key);
        if (a && a > 24) return it;
      }
    }
    // vật mảnh (đèn cây...): chấp nhận chạm vào ô nền của nó
    for (const it of list) { const d = FURN_BY_ID[it.type]; if (!d.wall && d.blocks && footprint(it).some((c) => c.x === gcx && c.y === gcy)) return it; }
    return null;
  }

  onDown(p: Phaser.Input.Pointer) {
    this.lastPtr = { x: p.x, y: p.y };
    const p1 = this.input.pointer1, p2 = this.input.pointer2;
    if (p1.isDown && p2.isDown) { this.pinch = { d: Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y), zoom: this.cameras.main.zoom }; this.panning = null; this.dragCand = null; return; }
    const w = this.world(p);
    if (this.buildOn) {
      if (this.holding) { this.updateHolding(p); return; }
      const hit = this.hitItem(w.x, w.y);
      if (hit) { this.selected = hit.uid; this.dragCand = { uid: hit.uid, sx: p.x, sy: p.y }; this.emitBuild(); sfx('click'); return; }
      this.selected = null; this.emitBuild();
    }
    const cam = this.cameras.main;
    this.panning = { sx: p.x, sy: p.y, cx: cam.scrollX, cy: cam.scrollY, moved: false };
  }
  onMove(p: Phaser.Input.Pointer) {
    this.lastPtr = { x: p.x, y: p.y };
    const p1 = this.input.pointer1, p2 = this.input.pointer2;
    if (this.pinch && p1.isDown && p2.isDown) {
      const d = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
      this.zoomAt((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, this.pinch.zoom * (d / this.pinch.d)); return;
    }
    if (this.holding) { if (p.isDown || !p.wasTouch) this.updateHolding(p); return; }
    if (this.dragCand && p.isDown) {
      if (Math.hypot(p.x - this.dragCand.sx, p.y - this.dragCand.sy) > 8) {
        const it = S().items.find((i) => i.uid === this.dragCand!.uid);
        if (it) this.beginMove(it);
        this.dragCand = null;
        this.updateHolding(p);
      }
      return;
    }
    if (this.panning && p.isDown) {
      const cam = this.cameras.main;
      const dx = (p.x - this.panning.sx) / cam.zoom, dy = (p.y - this.panning.sy) / cam.zoom;
      if (Math.abs(dx) + Math.abs(dy) > 3) { this.panning.moved = true; this.userMoved = true; }
      cam.scrollX = this.panning.cx - dx; cam.scrollY = this.panning.cy - dy;
    }
  }
  onUp(p: Phaser.Input.Pointer) {
    if (this.pinch && !(this.input.pointer1.isDown && this.input.pointer2.isDown)) { this.pinch = null; this.panning = null; return; }
    if (this.holding) { this.updateHolding(p); this.tryCommit(); return; }
    this.dragCand = null;
    if (this.panning) {
      const tap = !this.panning.moved; this.panning = null;
      if (tap && !this.buildOn) this.onTap(p);
    }
  }

  // tap: xem thông tin khách / nhân viên
  onTap(p: Phaser.Input.Pointer) {
    const w = this.world(p);
    let best: { kind: string; id: number; d: number } | null = null;
    const check = (kind: string, id: number, a: { screen: { x: number; y: number } }) => {
      const dx = Math.abs(w.x - a.screen.x), dy = w.y - (a.screen.y - 34);
      if (dx < 24 && Math.abs(dy) < 42) { const d = dx + Math.abs(dy); if (!best || d < best.d) best = { kind, id, d }; }
    };
    for (const c of this.R.customers) check('customer', c.id, c);
    for (const s of this.R.staff) check('staff', s.data.id, s);
    const b = best as { kind: string; id: number } | null;
    bus.emit('inspect', b ? { kind: b.kind, id: b.id } : null);
    if (b) sfx('click');
  }
  inspect(kind: string, id: number) {
    if (kind === 'customer') {
      const c = this.R.customers.find((x) => x.id === id); if (!c) return null;
      return { title: c.name, sub: 'Khách • ' + c.personality.name, rows: [['Trạng thái', c.stateVN], ['Kiên nhẫn', Math.round(Math.max(0, c.patience / c.patienceMax) * 100) + '%'], ['Hài lòng', Math.round(c.satisfaction) + '%'], ['Ngân sách', c.budget + ' vàng'], ['Món gọi', c.order ? DISH_BY_ID[c.order.dish.id].name : '—']], look: c.look };
    }
    const s = this.R.staff.find((x) => x.data.id === id); if (!s) return null;
    return { title: s.data.name, sub: ({ chef: 'Đầu bếp', waiter: 'Phục vụ', cashier: 'Thu ngân' } as Record<string, string>)[s.data.role] + ' • Kỹ năng ' + s.data.level, rows: [['Trạng thái', s.stateVN]], look: s.look };
  }

  // ---------- xây dựng ----------
  setBuildMode(on: boolean) {
    this.buildOn = on; if (!on) { this.cancelHolding(); this.selected = null; }
    this.emitBuild(); this.syncItems();
  }
  startPlacing(type: string) {
    if (!S().inventory[type]) return;
    this.buildOn = true;
    const d = FURN_BY_ID[type];
    this.cancelHolding();
    const cam = this.cameras.main; const c = this.world({ x: cam.width / 2, y: cam.height / 2 });
    const g = screenToGrid(c.x, c.y);
    this.holding = { kind: 'new', type, rot: d.wall ? 0 : 0, x: Math.floor(g.x), y: Math.floor(g.y), valid: false };
    this.selected = null;
    this.autoPlaceHint();
    this.validateHolding(); this.drawGhost(); this.emitBuild();
  }
  /** đặt ghost ở ô trống gần giữa màn hình để người chơi thấy ngay */
  autoPlaceHint() {
    const h = this.holding!; const d = FURN_BY_ID[h.type]; const s = S();
    if (d.wall) { h.x = 3; h.y = 0; h.rot = 1; return; }
    let best: { x: number; y: number; dist: number } | null = null;
    for (let y = 0; y < s.gridH; y++) for (let x = 0; x < s.gridW; x++) {
      if (!this.canPlace({ type: h.type, x, y, rot: h.rot })) continue;
      const dist = Math.hypot(x - s.gridW / 2, y - s.gridH / 2);
      if (!best || dist < best.dist) best = { x, y, dist };
    }
    if (best) { h.x = best.x; h.y = best.y; }
  }
  beginMove(it: PlacedItem) {
    this.holding = { kind: 'move', type: it.type, uid: it.uid, rot: it.rot, x: it.x, y: it.y, valid: true, orig: { x: it.x, y: it.y, rot: it.rot } };
    this.views.get(it.uid)?.setVisible(false);
    this.emitBuild();
  }
  cancelHolding() {
    const h = this.holding; this.holding = null;
    if (h?.kind === 'move' && h.uid) this.views.get(h.uid)?.setVisible(true);
    this.ghost?.destroy(); this.ghost = undefined; this.gfx.clear(); this.emitBuild();
  }
  /** vị trí neo của vật theo con trỏ */
  updateHolding(p: { x: number; y: number }) {
    const h = this.holding; if (!h) return;
    const d = FURN_BY_ID[h.type]; const w = this.world(p); const g = screenToGrid(w.x, w.y);
    if (d.wall) {
      const gx = g.x + 0.7, gy = g.y + 0.7; const s = S();
      if (gx <= gy && gx < 1.4) { h.rot = 0; h.x = 0; h.y = clamp(Math.floor(gy - 0.5), 0, s.gridH - 1); }
      else { h.rot = 1; h.y = 0; h.x = clamp(Math.floor(gx - 0.5), 0, s.gridW - 1); }
    } else {
      const odd = h.rot % 2; const fw = odd ? d.h : d.w, fh = odd ? d.w : d.h;
      h.x = Math.round(g.x - fw / 2); h.y = Math.round(g.y - fh / 2);
    }
    this.validateHolding(); this.drawGhost(); this.emitBuild();
  }
  canPlace(it: { type: string; x: number; y: number; rot: number }, ignoreUid?: number): boolean {
    const s = S(); const d = FURN_BY_ID[it.type];
    if (d.wall) {
      const L = it.rot % 2 === 0;
      if (L && (it.x !== 0 || it.y < 0 || it.y >= s.gridH || it.y === DOOR_Y)) return false;
      if (!L && (it.y !== 0 || it.x < 0 || it.x >= s.gridW)) return false;
      return !s.items.some((o) => o.uid !== ignoreUid && FURN_BY_ID[o.type].wall && (o.rot % 2) === (it.rot % 2) && o.x === it.x && o.y === it.y);
    }
    const cells = footprint(it);
    for (const c of cells) {
      if (c.x < 0 || c.y < 0 || c.x >= s.gridW || c.y >= s.gridH) return false;
      if (d.blocks && c.y === DOOR_Y && c.x <= 1) return false; // giữ lối vào thông thoáng
    }
    for (const o of s.items) {
      if (o.uid === ignoreUid) continue;
      const od = FURN_BY_ID[o.type]; if (od.wall) continue;
      if (!d.blocks && !od.blocks) { if (o.type === it.type) { const oc = footprint(o); if (oc.some((a) => cells.some((b) => a.x === b.x && a.y === b.y))) return false; } continue; }
      if (!d.blocks || !od.blocks) continue;
      const oc = footprint(o);
      if (oc.some((a) => cells.some((b) => a.x === b.x && a.y === b.y))) return false;
    }
    return true;
  }
  validateHolding() { const h = this.holding; if (h) h.valid = this.canPlace(h, h.uid); }
  drawGhost() {
    const h = this.holding; if (!h) return;
    const d = FURN_BY_ID[h.type];
    const { k, art } = this.texFor(h.type, h.rot, this.wallSide(h));
    if (!this.ghost) this.ghost = this.add.image(0, 0, k).setAlpha(0.85);
    this.placeSprite(this.ghost, h);
    this.ghost.setDepth(7e5).setTint(h.valid ? 0xffffff : 0xff7070);
    this.gfx.clear();
    const col = h.valid ? 0x52e06a : 0xff4a4a;
    if (d.wall) {
      const a = h.rot % 2 === 0 ? [gridToScreen(0, h.y), gridToScreen(0, h.y + 1)] : [gridToScreen(h.x, 0), gridToScreen(h.x + 1, 0)];
      this.gfx.fillStyle(col, 0.35).fillPoints([new Phaser.Geom.Point(a[0].x, a[0].y), new Phaser.Geom.Point(a[1].x, a[1].y), new Phaser.Geom.Point(a[1].x, a[1].y - 90), new Phaser.Geom.Point(a[0].x, a[0].y - 90)], true);
    } else {
      for (const c of footprint(h)) {
        const p = gridToScreen(c.x, c.y);
        this.gfx.fillStyle(col, 0.5).fillPoints([new Phaser.Geom.Point(p.x, p.y), new Phaser.Geom.Point(p.x + HW, p.y + HH), new Phaser.Geom.Point(p.x, p.y + 2 * HH), new Phaser.Geom.Point(p.x - HW, p.y + HH)], true);
        this.gfx.lineStyle(2, col, 1).strokePoints([new Phaser.Geom.Point(p.x, p.y), new Phaser.Geom.Point(p.x + HW, p.y + HH), new Phaser.Geom.Point(p.x, p.y + 2 * HH), new Phaser.Geom.Point(p.x - HW, p.y + HH)], true);
      }
    }
    void art;
  }
  autoFaceChair(it: PlacedItem) {
    const d = FURN_BY_ID[it.type]; if (d.role !== 'chair') return;
    for (let dir = 0; dir < 4; dir++) {
      const tx = it.x + DIRS[dir].x, ty = it.y + DIRS[dir].y;
      if (S().items.some((o) => FURN_BY_ID[o.type].role === 'table' && footprint(o).some((c) => c.x === tx && c.y === ty))) { it.rot = dir; return; }
    }
  }
  tryCommit() {
    const h = this.holding; if (!h) return;
    if (!h.valid) {
      if (h.kind === 'move') { this.revertMove(); sfx('error'); }
      else sfx('error');
      return;
    }
    if (h.kind === 'move') {
      const it = S().items.find((i) => i.uid === h.uid)!;
      it.x = h.x; it.y = h.y; it.rot = h.rot; this.autoFaceChair(it);
      store.commit('items'); this.finishHold(); this.syncItems(); sfx('place'); this.selected = it.uid; this.emitBuild();
      return;
    }
    const it = placeFromInventory(h.type, h.x, h.y, h.rot);
    if (!it) { this.cancelHolding(); return; }
    this.autoFaceChair(it); store.commit('items');
    sfx('place'); const p = gridToScreen(h.x + 0.5, h.y + 0.5); this.fx.sparkle(p.x, p.y);
    const more = S().inventory[h.type] > 0;
    const rot = h.rot; this.finishHold(); this.syncItems();
    if (more) { this.holding = { kind: 'new', type: h.type, rot, x: h.x, y: h.y, valid: false }; this.autoPlaceHint(); this.validateHolding(); this.drawGhost(); }
    else this.selected = it.uid;
    this.emitBuild();
  }
  revertMove() {
    const h = this.holding!; if (h.uid) this.views.get(h.uid)?.setVisible(true);
    this.finishHold();
  }
  finishHold() { this.holding = null; this.ghost?.destroy(); this.ghost = undefined; this.gfx.clear(); }
  confirmHolding() { if (this.holding) this.tryCommit(); }
  rotate() {
    if (this.holding) {
      const d = FURN_BY_ID[this.holding.type]; if (d.wall) return;
      this.holding.rot = (this.holding.rot + 1) % 4; this.validateHolding(); this.drawGhost(); this.emitBuild(); sfx('click'); return;
    }
    if (this.selected == null) return;
    const it = S().items.find((i) => i.uid === this.selected); if (!it) return;
    if (FURN_BY_ID[it.type].wall) return;
    const next = { ...it, rot: (it.rot + 1) % 4 };
    if (!this.canPlace(next, it.uid)) { sfx('error'); bus.emit('toast', { text: 'Không đủ chỗ để xoay', kind: 'bad' }); return; }
    it.rot = next.rot; store.commit('items'); this.syncItems(); sfx('click');
  }
  sellSelected() { if (this.selected == null) return; const u = this.selected; this.selected = null; sellItem(u); }
  storeSelected() { if (this.selected == null) return; const u = this.selected; this.selected = null; removeToInventory(u); sfx('click'); }
  emitBuild() {
    const sel = this.selected != null ? S().items.find((i) => i.uid === this.selected) : null;
    const st: BuildUIState = { on: this.buildOn, holding: this.holding ? { type: this.holding.type, valid: this.holding.valid, kind: this.holding.kind } : null, selected: sel ? { uid: sel.uid, type: sel.type } : null };
    bus.emit('build:state', st);
  }
  setSpeed(n: number) { this.R.world.rate = n; }

  // ---------- vòng lặp ----------
  update(_t: number, dtMs: number) {
    this.R.update(dtMs / 1000);
    this.updatePlates();
    this.clampCamera();
    // vòng chọn quanh vật được chọn trong chế độ xây dựng
    if (!this.holding) {
      this.gfx.clear();
      if (this.buildOn && this.selected != null) {
        const it = S().items.find((i) => i.uid === this.selected);
        if (it && !FURN_BY_ID[it.type].wall) for (const c of footprint(it)) {
          const p = gridToScreen(c.x, c.y); const pts = [new Phaser.Geom.Point(p.x, p.y), new Phaser.Geom.Point(p.x + HW, p.y + HH), new Phaser.Geom.Point(p.x, p.y + 2 * HH), new Phaser.Geom.Point(p.x - HW, p.y + HH)];
          this.gfx.fillStyle(0xffd84a, 0.35).fillPoints(pts, true); this.gfx.lineStyle(2.5, 0xffb300, 1).strokePoints(pts, true);
        }
        else if (it) { const sd = this.wallSide(it); const a = sd === 'L' ? [gridToScreen(0, it.y), gridToScreen(0, it.y + 1)] : [gridToScreen(it.x, 0), gridToScreen(it.x + 1, 0)]; this.gfx.lineStyle(3, 0xffb300, 1).strokePoints([new Phaser.Geom.Point(a[0].x, a[0].y - 20), new Phaser.Geom.Point(a[1].x, a[1].y - 20), new Phaser.Geom.Point(a[1].x, a[1].y - 90), new Phaser.Geom.Point(a[0].x, a[0].y - 90)], true); }
      }
    }
  }
  updatePlates() {
    const L = this.R.layout; const live = new Set<number>();
    for (const seat of L.seats.values()) {
      let k: string | null = null;
      if (seat.dirty) k = 'plate_dirty'; else if (seat.plate) k = 'food_' + seat.plate;
      if (!k) continue;
      live.add(seat.uid);
      let img = this.plates.get(seat.uid);
      if (!img) { img = this.add.image(0, 0, k).setOrigin(0.5, 0.8); this.plates.set(seat.uid, img); }
      img.setTexture(k).setScale(0.52);
      const gx = seat.cx + 0.5 + DIRS[seat.dir].x * 0.6, gy = seat.cy + 0.5 + DIRS[seat.dir].y * 0.6;
      const p = gridToScreen(gx, gy); img.setPosition(p.x, p.y - 24).setDepth((seat.tx + seat.ty + 1) * 10 + 0.6);
    }
    for (const [uid, img] of this.plates) if (!live.has(uid)) { img.destroy(); this.plates.delete(uid); }
    // món đã nấu xong đặt cạnh bếp
    const lv = new Set<number>();
    for (const o of this.R.orders) {
      if (o.status !== 'ready' || !o.stove) continue;
      lv.add(o.id);
      let img = this.stoveFood.get(o.id);
      if (!img) { img = this.add.image(0, 0, 'food_' + o.dish.id).setScale(0.5).setOrigin(0.5, 0.8); this.stoveFood.set(o.id, img); }
      const c = o.stove.cells[0]; const p = gridToScreen(c.x + 0.5, c.y + 0.5);
      img.setPosition(p.x, p.y - 38 + Math.sin(this.time.now / 300) * 2).setDepth((c.x + c.y + 1) * 10 + 0.7);
    }
    for (const [id, img] of this.stoveFood) if (!lv.has(id)) { img.destroy(); this.stoveFood.delete(id); }
  }
}
void key; void foodCanvas; void ({} as FurnDef);
