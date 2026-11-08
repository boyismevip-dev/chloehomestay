import type { Ing } from '../data/dishes';
import { bus } from './bus';

export interface PlacedItem { uid: number; type: string; x: number; y: number; rot: number }
export type StaffRole = 'chef' | 'waiter' | 'cashier';
export interface StaffData { id: number; role: StaffRole; name: string; level: number; look: number }

export interface GameState {
  v: number;
  gold: number; gems: number; xp: number; level: number; rep: number;
  gridW: number; gridH: number; expansion: number;
  floor: string; wall: string; door: string; ownedStyles: string[];
  items: PlacedItem[]; nextUid: number;
  inventory: Record<string, number>;
  staff: StaffData[]; nextStaffId: number;
  menu: string[]; ownedDishes: string[];
  stock: Record<Ing, number>; autoRestock: boolean;
  kitchenLevel: number;
  claimedQuests: string[]; claimedAch: string[];
  stats: {
    served: number; earned: number; burgers: number; tablesBought: number; angry: number; expansions: number;
    dishCount: Record<string, number>; spent: number; tips: number; playSeconds: number;
    daily: { day: string; earned: number; served: number }[];
  };
  settings: { sfx: boolean; music: boolean; volume: number };
  friendGifts: Record<string, string>;
  savedAt: number;
}

export const SAVE_VERSION = 1;

export function newState(): GameState {
  let uid = 1;
  const it = (type: string, x: number, y: number, rot = 0) => ({ uid: uid++, type, x, y, rot });
  const items: PlacedItem[] = [
    // khu bếp dọc tường phải (y = 0)
    it('prep_counter', 2, 0), it('fridge', 3, 0), it('stove_gas', 4, 0), it('stove_multi', 5, 0), it('plant_big', 7, 0),
    // tường trái (x = 0)
    it('drink_machine', 0, 1), it('vending', 0, 2), it('bakery', 0, 6, 1),
    // quầy thu ngân gần cửa
    it('cashier', 1, 2, 0),
    // bàn ghế
    it('table_sq', 3, 3), it('chair_cushion', 2, 3, 3), it('chair_cushion', 4, 3, 1),
    it('table_sq', 3, 6), it('chair_wood', 2, 6, 3), it('chair_wood', 4, 6, 1),
    it('table_round', 6, 4), it('chair_wood', 6, 3, 0), it('chair_wood', 6, 5, 2),
    // trang trí
    it('painting', 0, 3), it('clock', 2, 0, 2), it('painting', 6, 0, 2), it('lamp_floor', 7, 7), it('speaker', 7, 2), it('plant_small', 1, 7), it('rug', 4, 4),
  ];
  // ghế phải quay mặt về phía bàn (rot theo hướng: 0:+y 1:-x 2:-y 3:+x)
  const fix: Record<number, number> = {};
  items.forEach((i) => (fix[i.uid] = i.rot));
  return {
    v: SAVE_VERSION,
    gold: 600, gems: 10, xp: 0, level: 1, rep: 0,
    gridW: 8, gridH: 8, expansion: 0,
    floor: 'floor_checker', wall: 'wall_cream', door: 'door_red',
    ownedStyles: ['floor_checker', 'wall_cream', 'door_red'],
    items, nextUid: uid,
    inventory: {},
    staff: [
      { id: 1, role: 'chef', name: 'Bếp Trưởng Tí', level: 1, look: 0 },
      { id: 2, role: 'waiter', name: 'Bé Na', level: 1, look: 1 },
    ],
    nextStaffId: 3,
    menu: ['burger', 'rice', 'soda'], ownedDishes: ['burger', 'rice', 'soda'],
    stock: { flour: 30, meat: 30, veg: 30, dairy: 20, bean: 20, rice: 30, sugar: 30 },
    autoRestock: false,
    kitchenLevel: 1,
    claimedQuests: [], claimedAch: [],
    stats: { served: 0, earned: 0, burgers: 0, tablesBought: 0, angry: 0, expansions: 0, dishCount: {}, spent: 0, tips: 0, playSeconds: 0, daily: [] },
    settings: { sfx: true, music: true, volume: 0.6 },
    friendGifts: {},
    savedAt: 0,
  };
}

class Store {
  state: GameState = newState();
  private ver = 0;
  private subs = new Set<() => void>();
  subscribe = (fn: () => void) => { this.subs.add(fn); return () => { this.subs.delete(fn); }; };
  getVersion = () => this.ver;
  /** gọi sau khi sửa this.state */
  commit(reason = 'change') { this.ver++; this.subs.forEach((f) => f()); bus.emit('state', reason); }
  replace(s: GameState) { this.state = s; this.commit('replace'); }
}
export const store = new Store();
export const S = () => store.state;
