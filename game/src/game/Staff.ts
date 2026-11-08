import { Actor, World } from './Actor';
import type { Restaurant, Order } from './Restaurant';
import type { Seat, Stove } from './Layout';
import { staffLook } from '../art/characters';
import { StaffData } from '../core/state';
import { cookMult, walkMult } from '../systems/actions';
import { sfx } from '../systems/audio';
import { gridToScreen } from '../core/iso';
import { Cell } from '../core/astar';
import { DISH_BY_ID } from '../data/dishes';

export type SState = 'IDLE' | 'GO_ORDER' | 'RECEIVING_ORDER' | 'MOVING_TO_KITCHEN' | 'GO_PICKUP' | 'PICKING_FOOD' | 'MOVING_TO_CUSTOMER' | 'SERVING' | 'GO_CLEAN' | 'CLEANING_TABLE'
  | 'MOVING_TO_STOVE' | 'COOKING' | 'GO_POST' | 'PROCESSING' | 'RESTING';
export const SSTATE_VN: Record<SState, string> = {
  IDLE: 'Sẵn sàng', GO_ORDER: 'Đi nhận món', RECEIVING_ORDER: 'Ghi order', MOVING_TO_KITCHEN: 'Mang order vào bếp', GO_PICKUP: 'Đi lấy món', PICKING_FOOD: 'Lấy món',
  MOVING_TO_CUSTOMER: 'Mang món tới khách', SERVING: 'Dọn món', GO_CLEAN: 'Đi dọn bàn', CLEANING_TABLE: 'Dọn bàn', MOVING_TO_STOVE: 'Ra bếp', COOKING: 'Đang nấu',
  GO_POST: 'Ra quầy', PROCESSING: 'Tính tiền', RESTING: 'Nghỉ ngơi',
};

export class Staff extends Actor {
  state: SState = 'IDLE';
  timer = 0; idleT = 0;
  order: Order | null = null; seat: Seat | null = null; stove: Stove | null = null;
  cookTotal = 1; cookLeft = 1;
  steamT = 0; cookSnd = 0;
  constructor(world: World, public data: StaffData, public R: Restaurant) {
    super(world, `s_${data.role}_${data.look}`, staffLook(data.role, data.look), 'staff');
    this.speed = 2.1 * walkMult(data.level);
  }
  get stateVN() { return SSTATE_VN[this.state]; }
  private go(s: SState) { this.state = s; this.timer = 0; }

  /** thả mọi việc đang giữ (khi nhân viên bị sa thải / bố cục đổi) */
  abort() {
    if (this.order) { if (this.order.status === 'cooking') { this.order.status = 'queued'; this.order.claimed = false; if (this.stove) this.stove.busy = false; } else if (this.order.status === 'delivering') { this.order.status = 'ready'; this.order.claimed = false; } else this.order.claimed = false; }
    if (this.seat) this.seat.cleaning = false;
    this.order = null; this.seat = null; this.stove = null; this.go('IDLE'); this.path = [];
  }
  private fail(retry = 4) { if (this.order) { this.order.claimed = false; this.order.retryAt = this.R.clock + retry; } if (this.seat) this.seat.cleaning = false; if (this.stove) { this.stove.busy = false; } this.order = null; this.seat = null; this.stove = null; this.go('IDLE'); }

  update(dt: number, R: Restaurant) {
    this.speed = 2.1 * walkMult(this.data.level);
    switch (this.data.role) {
      case 'waiter': this.waiter(dt, R); break;
      case 'chef': this.chef(dt, R); break;
      case 'cashier': this.cashier(dt, R); break;
    }
    this.setBubble(this.state === 'RESTING' ? 'bub_zzz' : this.state === 'MOVING_TO_CUSTOMER' && this.order ? 'bub_dish_' + this.order.dish.id : null);
  }

  // ------------- PHỤC VỤ -------------
  private waiter(dt: number, R: Restaurant) {
    switch (this.state) {
      case 'IDLE': case 'RESTING': {
        this.stepMove(dt);
        this.idleT += dt;
        const t = R.nextWaiterTask(this);
        if (t) {
          this.idleT = 0; this.pose = 'stand';
          if (t.type === 'deliver') {
            this.order = t.order!; const p = this.order.pickup || R.anyStand();
            if (!p || !this.moveTo(p)) { this.fail(); break; }
            this.go('GO_PICKUP');
          } else if (t.type === 'take') {
            this.order = t.order!; const c = R.layout.serveCell(this.order.seat);
            if (!c || !this.moveTo(c)) { this.fail(); break; }
            this.go('GO_ORDER');
          } else {
            this.seat = t.seat!; const c = R.layout.serveCell(this.seat);
            if (!c || !this.moveTo(c)) { this.fail(); break; }
            this.go('GO_CLEAN');
          }
        } else if (this.idleT > 12 && this.state === 'IDLE') this.go('RESTING');
        break;
      }
      case 'GO_ORDER': {
        if (this.stepMove(dt)) { this.facePoint(this.order!.seat.cx, this.order!.seat.cy); this.go('RECEIVING_ORDER'); this.pose = 'work'; }
        break;
      }
      case 'RECEIVING_ORDER': {
        this.timer += dt;
        if (this.timer > 1.0) {
          const o = this.order!;
          this.pose = 'stand';
          if (o.status === 'cancelled') { this.fail(); break; }
          o.status = 'taken'; sfx('bell');
          const p = R.anyStand();
          if (!p || !this.moveTo(p)) { o.status = 'queued'; o.claimed = false; this.order = null; this.go('IDLE'); break; }
          this.go('MOVING_TO_KITCHEN');
        }
        break;
      }
      case 'MOVING_TO_KITCHEN': {
        if (this.stepMove(dt)) {
          const o = this.order!; o.status = o.status === 'cancelled' ? 'cancelled' : 'queued'; o.claimed = false;
          this.order = null; this.go('IDLE');
        }
        break;
      }
      case 'GO_PICKUP': {
        if (this.order!.status === 'cancelled') { this.fail(0); break; }
        if (this.stepMove(dt)) { this.go('PICKING_FOOD'); this.pose = 'work'; }
        break;
      }
      case 'PICKING_FOOD': {
        this.timer += dt;
        if (this.timer > 0.5) {
          const o = this.order!; this.pose = 'stand';
          if (o.status === 'cancelled') { this.fail(0); break; }
          o.status = 'delivering';
          const c = R.layout.serveCell(o.seat);
          if (!c || !this.moveTo(c)) { o.status = 'ready'; this.fail(); break; }
          this.setBubble('bub_dish_' + o.dish.id);
          this.go('MOVING_TO_CUSTOMER');
        }
        break;
      }
      case 'MOVING_TO_CUSTOMER': {
        if (this.order!.status === 'cancelled') { this.setBubble(null); this.fail(0); break; }
        if (this.stepMove(dt)) { this.facePoint(this.order!.seat.cx, this.order!.seat.cy); this.go('SERVING'); this.pose = 'work'; }
        break;
      }
      case 'SERVING': {
        this.timer += dt;
        if (this.timer > 0.6) {
          const o = this.order!; this.pose = 'stand'; this.setBubble(null);
          if (o.status !== 'cancelled') { o.status = 'served'; o.seat.plate = o.dish.id; sfx('place'); }
          this.order = null; this.go('IDLE');
        }
        break;
      }
      case 'GO_CLEAN': {
        if (this.stepMove(dt)) { this.facePoint(this.seat!.cx, this.seat!.cy); this.go('CLEANING_TABLE'); this.pose = 'work'; }
        break;
      }
      case 'CLEANING_TABLE': {
        this.timer += dt;
        if (this.timer > 2.0) { const s = this.seat!; s.dirty = false; s.plate = null; s.cleaning = false; this.seat = null; this.pose = 'stand'; sfx('place'); this.go('IDLE'); }
        break;
      }
      default: this.go('IDLE');
    }
  }

  // ------------- ĐẦU BẾP -------------
  private chef(dt: number, R: Restaurant) {
    switch (this.state) {
      case 'IDLE': case 'RESTING': {
        this.stepMove(dt); this.idleT += dt;
        const j = R.nextCook();
        if (j) {
          this.idleT = 0; this.pose = 'stand';
          this.order = j.order; this.stove = j.stove;
          if (!this.moveTo(j.stove.stand)) { j.order.status = 'queued'; j.order.claimed = false; j.stove.busy = false; this.order = null; this.stove = null; break; }
          this.go('MOVING_TO_STOVE');
        } else if (this.idleT > 10) this.go('RESTING');
        break;
      }
      case 'MOVING_TO_STOVE': {
        if (this.stepMove(dt)) {
          const o = this.order!; const st = this.stove!;
          this.facePoint(st.cells[0].x, st.cells[0].y);
          const drinkBoost = o.dish.drink && R.layout.drinkMachine ? 1.3 : 1;
          this.cookTotal = o.dish.cook / (cookMult(this.data.level) * st.speed * drinkBoost);
          this.cookLeft = this.cookTotal; this.pose = 'work'; this.go('COOKING');
        }
        break;
      }
      case 'COOKING': {
        this.cookLeft -= dt; this.steamT -= dt; this.cookSnd -= dt;
        const o = this.order!;
        if (o.status === 'cancelled') { this.stove!.busy = false; this.pose = 'stand'; this.order = null; this.stove = null; this.go('IDLE'); break; }
        if (this.steamT <= 0) { this.steamT = 0.45; const p = gridToScreen(this.stove!.cells[0].x + 0.5, this.stove!.cells[0].y + 0.5); R.fx.steam(p.x, p.y - 34); }
        if (this.cookSnd <= 0) { this.cookSnd = 1.6; sfx('cook'); }
        this.barValue = 1 - this.cookLeft / this.cookTotal;
        if (this.cookLeft <= 0) {
          this.barValue = -1; o.status = 'ready'; o.claimed = false; o.pickup = this.stove!.stand;
          this.stove!.busy = false; sfx('bell');
          const p = gridToScreen(this.stove!.cells[0].x + 0.5, this.stove!.cells[0].y + 0.5); R.fx.float(p.x, p.y - 60, DISH_BY_ID[o.dish.id].name + ' xong!', '#ffffff');
          this.pose = 'stand'; this.order = null; this.stove = null; this.go('IDLE');
        }
        break;
      }
      default: this.go('IDLE');
    }
  }

  // ------------- THU NGÂN -------------
  private cashier(dt: number, R: Restaurant) {
    const post = R.layout.cashierPost;
    switch (this.state) {
      case 'IDLE': case 'RESTING': {
        if (this.stepMove(dt) && post && (this.cx !== post.x || this.cy !== post.y)) { if (!this.moveTo(post)) { /* không có đường */ } }
        const payer = R.customers.find((c) => c.state === 'PAYING' && c.payArrived && !c.paid);
        if (payer && post) {
          if (this.cx === post.x && this.cy === post.y) { this.facePoint(payer.cx, payer.cy); this.go('PROCESSING'); this.pose = 'work'; this.order = null; (this as any).target = payer; }
        } else if (!payer) { this.idleT += dt; if (this.idleT > 14) this.go('RESTING'); }
        break;
      }
      case 'PROCESSING': {
        this.timer += dt;
        const c = (this as any).target;
        if (!c || c.dead || c.paid) { this.pose = 'stand'; this.go('IDLE'); break; }
        if (this.timer > 1.3 / walkMult(this.data.level)) { this.pose = 'stand'; c.pay(R); sfx('bell'); this.go('IDLE'); (this as any).target = null; }
        break;
      }
      default: this.go('IDLE');
    }
  }
}
void ({} as Cell);
