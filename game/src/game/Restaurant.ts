// Bộ điều phối mô phỏng nhà hàng: đơn hàng, ghế, khách, nhân viên, thu ngân.
import Phaser from 'phaser';
import { Layout, Seat, Stove } from './Layout';
import { World } from './Actor';
import { Customer } from './Customer';
import { Staff } from './Staff';
import { S, StaffData } from '../core/state';
import { DISHES, Dish } from '../data/dishes';
import { findPath, Cell } from '../core/astar';
import { addGold, addXp, addRep, canCook, consume, decorScore, today } from '../systems/actions';
import { store } from '../core/state';
import { bus } from '../core/bus';
import { sfx } from '../systems/audio';
import { clamp, rnd, pick } from '../core/rng';
import { DOOR_Y } from '../data/catalog';
import { gridToScreen } from '../core/iso';

export type OrderStatus = 'new' | 'taken' | 'queued' | 'cooking' | 'ready' | 'delivering' | 'served' | 'cancelled';
export interface Order { id: number; customer: Customer; dish: Dish; seat: Seat; status: OrderStatus; claimed: boolean; pickup: Cell | null; stove: Stove | null; retryAt: number }

export interface Fx {
  float(x: number, y: number, text: string, color?: string): void;
  coins(x: number, y: number): void;
  steam(x: number, y: number): void;
  sparkle(x: number, y: number): void;
}

export class Restaurant {
  layout = new Layout();
  world: World;
  customers: Customer[] = [];
  staff: Staff[] = [];
  orders: Order[] = [];
  spawnT = 1.5;
  vendT = 0;
  orderSeq = 1; custSeq = 1;
  clock = 0;
  lastNoStock = 0;
  constructor(public scene: Phaser.Scene, public fx: Fx) {
    this.world = { scene, layout: this.layout, rate: 1 };
    this.relayout(); this.syncStaff();
    bus.on('items-changed', () => this.relayout());
    bus.on('staff-changed', () => this.syncStaff());
  }
  relayout() { this.layout.rebuild(S()); }
  /** đồng bộ danh sách nhân viên (mô phỏng) với dữ liệu lưu */
  syncStaff() {
    const data = S().staff;
    for (const st of [...this.staff]) if (!data.find((d) => d.id === st.data.id)) { this.releaseStaff(st); st.destroy(); this.staff.splice(this.staff.indexOf(st), 1); }
    for (const d of data) {
      const ex = this.staff.find((s) => s.data.id === d.id);
      if (ex) ex.data = d; else {
        const s = new Staff(this.world, d, this); s.setCell(0, DOOR_Y); s.path = [];
        this.staff.push(s);
      }
    }
  }
  releaseStaff(st: Staff) { st.abort(); }

  get rate() { return this.world.rate; }

  seatCount() { return this.layout.seats.size; }
  hasStove() { return this.layout.stoves.size > 0; }
  hasCashierStaff() { return this.staff.some((s) => s.data.role === 'cashier') && !!this.layout.cashierPost; }

  update(dtRaw: number) {
    const dt = Math.min(dtRaw, 0.1) * this.rate; this.clock += dt;
    S().stats.playSeconds += dt / Math.max(1, this.rate) * (this.rate > 0 ? 1 : 0);
    // sinh khách
    this.spawnT -= dt;
    const free = [...this.layout.seats.values()].filter((s) => !s.taken && !s.dirty).length;
    const waiting = this.customers.filter((c) => c.state === 'FINDING_TABLE' && !c.seat).length;
    if (this.spawnT <= 0) {
      const base = clamp(13 - S().level * 0.6 - S().rep * 0.03, 4.5, 13);
      this.spawnT = base * rnd(0.7, 1.3);
      if (this.layout.seats.size > 0 && this.customers.length < this.layout.seats.size + 3 && waiting < 2 && (free > 0 || waiting === 0)) this.spawnCustomer();
    }
    // thu nhập thụ động từ máy bán hàng
    this.vendT += dt;
    if (this.vendT >= 15) { this.vendT = 0; if (this.layout.vending) { const g = 5 * this.layout.vending; addGold(g, true); sfx('coin'); const p = this.vendPos(); if (p) this.fx.float(p.x, p.y - 70, `+${g}`, '#ffd84a'); } }
    for (const c of [...this.customers]) { c.update(dt, this); if (c.dead) { c.destroy(); this.customers.splice(this.customers.indexOf(c), 1); } }
    for (const s of this.staff) s.update(dt, this);
    // dọn đơn
    this.orders = this.orders.filter((o) => o.status !== 'served' && o.status !== 'cancelled');
    this.views(dtRaw);
  }
  vendPos() {
    const it = S().items.find((i) => i.type === 'vending'); if (!it) return null; return gridToScreen(it.x + 0.5, it.y + 0.5);
  }
  views(dt: number) {
    for (const c of this.customers) c.updateView(dt);
    for (const s of this.staff) s.updateView(dt);
  }

  spawnCustomer() {
    const c = new Customer(this.world, this.custSeq++, this);
    this.customers.push(c);
  }

  // ---------- ghế ----------
  reserveSeat(c: Customer): { seat: Seat; path: Cell[] } | null {
    let best: { seat: Seat; path: Cell[] } | null = null; let bestScore = 1e9;
    for (const seat of this.layout.seats.values()) {
      if (seat.taken || seat.dirty || seat.cleaning) continue;
      const p = findPath({ x: c.cx, y: c.cy }, { x: seat.cx, y: seat.cy }, this.layout.walkable);
      if (!p) continue;
      const score = p.length + Math.random() * 4;
      if (score < bestScore) { best = { seat, path: p }; bestScore = score; }
    }
    if (best) best.seat.taken = true;
    return best;
  }

  // ---------- đơn hàng ----------
  chooseDish(c: Customer): Dish | null {
    const menu = DISHES.filter((d) => S().menu.includes(d.id) && canCook(d.id));
    if (!menu.length) { if (this.clock - this.lastNoStock > 20) { this.lastNoStock = this.clock; bus.emit('toast', { text: 'Hết nguyên liệu! Vào SHOP để nhập thêm.', kind: 'bad' }); } return null; }
    const afford = menu.filter((d) => d.price <= c.budget);
    const pool = afford.length ? afford : [menu.slice().sort((a, b) => a.price - b.price)[0]];
    if (c.personality.id === 'gourmet') return pool.slice().sort((a, b) => b.price - a.price)[Math.random() < 0.6 ? 0 : Math.min(1, pool.length - 1)];
    if (c.personality.id === 'thrifty') return pool.slice().sort((a, b) => a.price - b.price)[0];
    return pick(pool);
  }
  createOrder(c: Customer, dish: Dish, seat: Seat): Order {
    consume(dish.id);
    const o: Order = { id: this.orderSeq++, customer: c, dish, seat, status: 'new', claimed: false, pickup: null, stove: null, retryAt: 0 };
    this.orders.push(o); return o;
  }
  cancelOrder(o: Order | undefined) {
    if (!o) return;
    if (o.status === 'cooking' && o.stove) o.stove.busy = false;
    o.status = 'cancelled';
  }

  // ---------- việc của phục vụ ----------
  nextWaiterTask(w: Staff): { type: 'deliver' | 'take' | 'clean'; order?: Order; seat?: Seat } | null {
    for (const o of this.orders) if (o.status === 'ready' && !o.claimed && o.retryAt <= this.clock) { o.claimed = true; return { type: 'deliver', order: o }; }
    for (const o of this.orders) if (o.status === 'new' && !o.claimed && o.customer.state === 'ORDERING' && o.customer.callReady && o.retryAt <= this.clock) { o.claimed = true; return { type: 'take', order: o }; }
    for (const s of this.layout.seats.values()) if (s.dirty && !s.cleaning && !s.taken) { s.cleaning = true; return { type: 'clean', seat: s }; }
    return null;
  }
  // ---------- việc của đầu bếp ----------
  nextCook(): { order: Order; stove: Stove } | null {
    const o = this.orders.find((x) => x.status === 'queued' && !x.claimed);
    if (!o) return null;
    let best: Stove | null = null;
    for (const st of this.layout.stoves.values()) if (!st.busy && (!best || st.speed > best.speed)) best = st;
    if (!best) return null;
    best.busy = true; o.claimed = true; o.stove = best; o.status = 'cooking';
    return { order: o, stove: best };
  }
  anyStand(): Cell | null { for (const s of this.layout.stoves.values()) return s.stand; return null; }

  // ---------- thanh toán ----------
  reservePayCell(c: Customer): Cell | null {
    for (const p of this.layout.payCells) { const k = p.x * 100 + p.y; if (!this.layout.payTaken.has(k) && !this.customers.some((o) => o !== c && o.payKey === k)) return p; }
    return null;
  }
  completePayment(c: Customer) {
    const s = S(); const d = c.order!.dish;
    let tip = Math.round(d.price * 0.15 * (c.satisfaction / 100) * c.personality.tip * rnd(0.6, 1.4));
    let bonus = 0;
    if (this.layout.bakery && Math.random() < 0.45) bonus = 10 + Math.floor(Math.random() * 10);
    const total = d.price + tip + bonus;
    addGold(total, true); s.stats.tips += tip;
    s.stats.served++; s.stats.dishCount[d.id] = (s.stats.dishCount[d.id] || 0) + 1;
    const row = (() => { const dd = today(); let r = s.stats.daily.find((x) => x.day === dd); if (!r) { r = { day: dd, earned: 0, served: 0 }; s.stats.daily.push(r); if (s.stats.daily.length > 7) s.stats.daily.shift(); } return r; })();
    row.served++;
    addXp(6 + Math.floor(d.price / 8));
    if (c.satisfaction >= 75) addRep(1 + (c.satisfaction >= 90 ? 1 : 0));
    store.commit('pay');
    sfx('coin');
    const p = c.screen; this.fx.float(p.x, p.y - 80, `+${total}`, '#ffd84a'); this.fx.coins(p.x, p.y - 50);
  }
}
