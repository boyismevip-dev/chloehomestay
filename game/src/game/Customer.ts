import { Actor, World } from './Actor';
import type { Restaurant, Order } from './Restaurant';
import type { Seat } from './Layout';
import { customerLook } from '../art/characters';
import { NAMES, PERSONALITIES } from '../data/names';
import { DOOR_Y } from '../data/catalog';
import { pick, rnd, clamp } from '../core/rng';
import { S } from '../core/state';
import { decorScore, addRep } from '../systems/actions';
import { sfx } from '../systems/audio';
import { Cell } from '../core/astar';

export type CState = 'ARRIVING' | 'ENTERING' | 'FINDING_TABLE' | 'SITTING' | 'ORDERING' | 'WAITING_FOOD' | 'EATING' | 'PAYING' | 'LEAVING';
export const CSTATE_VN: Record<CState, string> = {
  ARRIVING: 'Đang tới quán', ENTERING: 'Bước vào quán', FINDING_TABLE: 'Tìm bàn', SITTING: 'Đang ngồi xuống', ORDERING: 'Xem thực đơn',
  WAITING_FOOD: 'Chờ món', EATING: 'Đang ăn', PAYING: 'Thanh toán', LEAVING: 'Ra về',
};

export class Customer extends Actor {
  name: string; personality; patienceMax: number; patience: number; satisfaction = 80; budget: number; eatTime: number;
  state: CState = 'ARRIVING';
  seat: Seat | null = null;
  order: Order | undefined;
  callReady = false;
  angry = false; dead = false; ate = false;
  timer = 0; eatTick = 0; retry = 0; payKey = -1; payWait = 0; payArrived = false; paid = false;
  seed: number;
  constructor(world: World, public id: number, R: Restaurant) {
    const seed = Math.floor(Math.random() * 60);
    super(world, 'c' + seed, customerLook(seed), 'customer');
    this.seed = seed;
    this.name = pick(NAMES);
    this.personality = pick(PERSONALITIES);
    const bonus = 1 + Math.min(0.35, decorScore() * 0.004);
    this.patienceMax = rnd(45, 75) * this.personality.patience * bonus;
    this.patience = this.patienceMax;
    this.budget = Math.round(rnd(40, 100) * this.personality.budget * (1 + S().level * 0.05));
    this.eatTime = rnd(6, 12);
    this.speed = rnd(1.7, 2.3);
    this.setCell(-5, DOOR_Y);
    this.moveTo({ x: -1, y: DOOR_Y });
  }
  get stateVN() { return CSTATE_VN[this.state]; }

  private drain(dt: number, k = 1) { this.patience -= dt * k; this.barValue = this.patience / this.patienceMax; }
  private go(state: CState) { this.state = state; this.timer = 0; }

  leave(angry: boolean, R: Restaurant) {
    if (this.state === 'LEAVING') return;
    if (this.seat) { this.seat.taken = false; if (this.ate) this.seat.dirty = true; }
    if (this.order) R.cancelOrder(this.order.status === 'served' ? undefined : this.order);
    this.angry = angry; this.barValue = -1;
    if (angry) {
      S().stats.angry++; addRep(-1); this.setBubble('bub_angry'); sfx('angry'); this.speed *= 1.35;
      R.fx.float(this.screen.x, this.screen.y - 90, 'Bực quá!', '#ff4a4a');
    } else this.setBubble(this.satisfaction >= 70 ? 'bub_heart' : null);
    this.pose = 'stand'; this.depthBias = 0;
    if (this.seat) this.setCell(this.seat.cx, this.seat.cy);
    this.seat = null;
    this.go('LEAVING');
    if (!this.moveTo({ x: -1, y: DOOR_Y })) this.dead = true;
  }

  update(dt: number, R: Restaurant) {
    const L = R.layout;
    // ghế bị người chơi dọn mất
    if (this.seat && !L.seats.has(this.seat.uid) && this.state !== 'LEAVING' && this.state !== 'PAYING') { this.seat = null; this.leave(true, R); }
    switch (this.state) {
      case 'ARRIVING': {
        this.stepMove(dt * this.speedMul());
        if (!this.path.length) { sfx('door'); this.go('ENTERING'); this.moveTo({ x: 1, y: DOOR_Y }); }
        break;
      }
      case 'ENTERING': {
        this.stepMove(dt * this.speedMul());
        if (!this.path.length) { this.go('FINDING_TABLE'); }
        break;
      }
      case 'FINDING_TABLE': {
        if (!this.seat) {
          this.stepMove(dt * this.speedMul());
          this.retry -= dt;
          if (this.retry <= 0) {
            this.retry = 0.8;
            const r = R.reserveSeat(this);
            if (r) { this.seat = r.seat; this.path = r.path; this.barValue = -1; this.setBubble(null); }
          }
          if (!this.seat) {
            this.setBubble('bub_wait'); this.drain(dt, 1.2);
            if (this.patience <= 0) this.leave(true, R);
          }
        } else if (this.stepMove(dt * this.speedMul())) {
          this.go('SITTING');
          this.setCell(this.seat.cx, this.seat.cy); this.pose = 'sit'; this.faceDir(this.seat.dir); this.depthBias = 0.4; sfx('sit');
        }
        break;
      }
      case 'SITTING': {
        this.timer += dt; this.updateSeatedDepth();
        if (this.timer > 0.7) { this.go('ORDERING'); this.setBubble('bub_menu'); this.callReady = false; this.timer = rnd(1.5, 3.2); }
        break;
      }
      case 'ORDERING': {
        if (!this.order) {
          this.timer -= dt;
          if (this.timer <= 0) {
            const dish = R.chooseDish(this);
            if (!dish) { this.leave(true, R); break; }
            this.order = R.createOrder(this, dish, this.seat!);
            this.callReady = true; this.setBubble('bub_call');
          }
        } else {
          this.drain(dt);
          if (this.order.status !== 'new') { this.go('WAITING_FOOD'); this.setBubble('bub_dish_' + this.order.dish.id); }
          else if (this.patience <= 0) this.leave(true, R);
        }
        break;
      }
      case 'WAITING_FOOD': {
        this.drain(dt, 0.8);
        if (this.order && this.order.status === 'served') {
          // độ hài lòng phụ thuộc phần kiên nhẫn còn lại
          const k = clamp(this.patience / this.patienceMax, 0, 1);
          this.satisfaction = Math.round(clamp(45 + 50 * k + Math.min(10, decorScore() * 0.12), 0, 100));
          this.go('EATING'); this.setBubble(null); this.barValue = -1; this.eatTick = 0;
        } else if (this.patience <= 0 || !this.order || this.order.status === 'cancelled') this.leave(true, R);
        break;
      }
      case 'EATING': {
        this.timer += dt; this.eatTick += dt;
        if (this.eatTick > 1.3) { this.eatTick = 0; sfx('eat'); }
        this.pose = 'sit';
        if (this.timer >= this.eatTime) {
          this.ate = true; this.seat!.dirty = true; this.seat!.taken = false; // chờ nhân viên dọn
          this.pose = 'stand'; this.depthBias = 0; this.go('PAYING');
          this.payArrived = false; this.payKey = -1;
          this.setBubble('bub_coin');
        }
        break;
      }
      case 'PAYING': {
        if (!L.cashiers.length || !L.payCells.length) { // không có quầy: trả tại bàn
          this.timer += dt; if (this.timer > 1.2) this.pay(R); break;
        }
        if (this.payKey < 0) {
          const c = R.reservePayCell(this);
          if (c) { this.payKey = c.x * 100 + c.y; if (!this.moveTo(c)) { this.pay(R); } }
          else { this.timer += dt; if (this.timer > 12) this.pay(R); }
        } else if (!this.payArrived) {
          if (this.stepMove(dt * this.speedMul())) { this.payArrived = true; this.payWait = 0; }
        } else {
          this.facePoint(this.payKey / 100 | 0, this.payKey % 100);
          this.payWait += dt;
          // có thu ngân -> thu ngân tự xử lý; không -> khách tự thanh toán sau 4 giây
          if (!R.hasCashierStaff() && this.payWait > 4) this.pay(R);
        }
        break;
      }
      case 'LEAVING': {
        this.stepMove(dt * this.speedMul());
        if (!this.path.length) {
          if (this.cx > -2) { this.moveTo({ x: -6, y: DOOR_Y }); if (!this.path.length) this.dead = true; }
          else this.dead = true;
        }
        break;
      }
    }
    // thanh kiên nhẫn chỉ khi cần
    if (!['FINDING_TABLE', 'ORDERING', 'WAITING_FOOD'].includes(this.state)) this.barValue = -1;
    else if (this.state === 'FINDING_TABLE' && this.seat) this.barValue = -1;
  }
  speedMul() { return 1; }
  private updateSeatedDepth() { /* ngồi trên ghế: giữ nguyên độ sâu cell */ }
  pay(R: Restaurant) {
    if (this.paid) return; this.paid = true;
    R.completePayment(this);
    this.leave(false, R);
  }
}
void ({} as Cell);
