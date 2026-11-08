// Bố cục nhà hàng: ô bị chặn, ghế, bếp, quầy thu ngân... suy ra từ dữ liệu lưu.
import { GameState, PlacedItem } from '../core/state';
import { FURN_BY_ID, DOOR_Y } from '../data/catalog';
import { DIRS } from '../core/iso';
import { Cell } from '../core/astar';

export const key = (x: number, y: number) => (x + 20) * 100 + (y + 20);
export const CORRIDOR_MIN = -7;

export function footprint(it: { type: string; x: number; y: number; rot: number }): Cell[] {
  const d = FURN_BY_ID[it.type]; const odd = it.rot % 2 === 1;
  const w = odd ? d.h : d.w, h = odd ? d.w : d.h; const out: Cell[] = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) out.push({ x: it.x + i, y: it.y + j });
  return out;
}
export interface Seat { uid: number; cx: number; cy: number; tx: number; ty: number; dir: number; taken: boolean; dirty: boolean; plate: string | null; cleaning: boolean }
export interface Stove { uid: number; speed: number; cells: Cell[]; stand: Cell; busy: boolean; item: PlacedItem }

export class Layout {
  W = 8; H = 8;
  blocked = new Set<number>();
  tableCells = new Set<number>();
  seats = new Map<number, Seat>();
  stoves = new Map<number, Stove>();
  cashiers: PlacedItem[] = [];
  payCells: Cell[] = [];
  payTaken = new Set<number>();
  cashierPost: Cell | null = null;
  vending = 0; bakery = 0; drinkMachine = false;
  items: PlacedItem[] = [];

  walkable = (x: number, y: number): boolean => {
    if (y === DOOR_Y && x < 0 && x >= CORRIDOR_MIN) return true;
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return false;
    return !this.blocked.has(key(x, y));
  };

  rebuild(s: GameState) {
    this.W = s.gridW; this.H = s.gridH; this.items = s.items;
    this.blocked.clear(); this.tableCells.clear(); this.cashiers = []; this.vending = 0; this.bakery = 0; this.drinkMachine = false;
    const seatPrev = this.seats; const stovePrev = this.stoves;
    this.seats = new Map(); this.stoves = new Map();
    for (const it of s.items) {
      const d = FURN_BY_ID[it.type];
      if (d.wall || !d.blocks) continue;
      for (const c of footprint(it)) { this.blocked.add(key(c.x, c.y)); if (d.role === 'table') this.tableCells.add(key(c.x, c.y)); }
    }
    for (const it of s.items) {
      const d = FURN_BY_ID[it.type];
      if (d.role === 'cashier') this.cashiers.push(it);
      if (d.role === 'vending') this.vending++;
      if (d.role === 'bakery') this.bakery++;
      if (d.role === 'drink') this.drinkMachine = true;
      if (d.role === 'chair') {
        for (let dir = 0; dir < 4; dir++) {
          const tx = it.x + DIRS[dir].x, ty = it.y + DIRS[dir].y;
          if (this.tableCells.has(key(tx, ty))) {
            const p = seatPrev.get(it.uid);
            this.seats.set(it.uid, { uid: it.uid, cx: it.x, cy: it.y, tx, ty, dir, taken: p?.taken || false, dirty: p?.dirty || false, plate: p?.plate ?? null, cleaning: p?.cleaning || false });
            break;
          }
        }
      }
    }
    for (const it of s.items) {
      const d = FURN_BY_ID[it.type];
      if (d.role !== 'stove') continue;
      const cells = footprint(it);
      const stand = this.standCell(cells, it.rot);
      if (!stand) continue;
      const p = stovePrev.get(it.uid);
      this.stoves.set(it.uid, { uid: it.uid, speed: d.speed || 1, cells, stand, busy: p?.busy || false, item: it });
    }
    // điểm thanh toán
    this.payCells = []; this.cashierPost = null;
    const near: Cell[] = [];
    for (const it of this.cashiers) for (const c of footprint(it)) for (const dd of DIRS) {
      const n = { x: c.x + dd.x, y: c.y + dd.y };
      if (this.walkable(n.x, n.y) && n.x >= 0 && !near.some((q) => q.x === n.x && q.y === n.y)) near.push(n);
    }
    near.sort((a, b) => Math.hypot(a.x, a.y - DOOR_Y) - Math.hypot(b.x, b.y - DOOR_Y));
    this.payCells = near.slice(0, Math.min(3, near.length));
    const rest = near.slice(this.payCells.length);
    this.cashierPost = rest.length ? rest[rest.length - 1] : near.length ? near[near.length - 1] : null;
    if (this.cashierPost && this.payCells.length > 1 && rest.length === 0) this.payCells = this.payCells.slice(0, this.payCells.length - 1);
    this.payTaken.clear();
  }
  /** ô đứng phía trước của một vật (theo hướng xoay), hoặc ô liền kề bất kỳ */
  standCell(cells: Cell[], rot: number): Cell | null {
    const dd = DIRS[rot % 4];
    const set = new Set(cells.map((c) => key(c.x, c.y)));
    const front = cells.map((c) => ({ x: c.x + dd.x, y: c.y + dd.y })).filter((c) => !set.has(key(c.x, c.y)) && this.walkable(c.x, c.y));
    if (front.length) return front[Math.floor(front.length / 2)];
    for (const c of cells) for (const d of DIRS) { const n = { x: c.x + d.x, y: c.y + d.y }; if (!set.has(key(n.x, n.y)) && this.walkable(n.x, n.y)) return n; }
    return null;
  }
  /** ô đứng cạnh ghế/bàn để phục vụ */
  serveCell(seat: Seat): Cell | null {
    const cands: Cell[] = [];
    for (const base of [{ x: seat.cx, y: seat.cy }, { x: seat.tx, y: seat.ty }]) for (const d of DIRS) {
      const n = { x: base.x + d.x, y: base.y + d.y };
      if (this.walkable(n.x, n.y)) cands.push(n);
    }
    cands.sort((a, b) => Math.hypot(a.x - seat.cx, a.y - seat.cy) - Math.hypot(b.x - seat.cx, b.y - seat.cy));
    return cands[0] || null;
  }
  cleanCells() { return null; }
}
