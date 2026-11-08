// Kinh tế, kho, nhiệm vụ, nhân viên...: mọi thay đổi trạng thái đi qua đây.
import { store, S, StaffRole } from '../core/state';
import { bus } from '../core/bus';
import { FURN_BY_ID, STYLE_BY_ID, EXPANSIONS } from '../data/catalog';
import { DISH_BY_ID, DISHES, ING, Ing } from '../data/dishes';
import { QUESTS, ACHIEVEMENTS, Metric } from '../data/quests';
import { STAFF_NAMES } from '../data/names';
import { sfx } from './audio';

export type Result = { ok: boolean; msg: string };
const fail = (msg: string): Result => { sfx('error'); bus.emit('toast', { text: msg, kind: 'bad' }); return { ok: false, msg }; };
const good = (msg: string, snd: Parameters<typeof sfx>[0] = 'buy'): Result => { sfx(snd); bus.emit('toast', { text: msg, kind: 'good' }); return { ok: true, msg }; };

export const xpNeed = (lv: number) => Math.round(60 * Math.pow(lv, 1.45));
export const today = () => new Date().toISOString().slice(0, 10);

function daily() {
  const st = S().stats; const d = today();
  let row = st.daily.find((r) => r.day === d);
  if (!row) { row = { day: d, earned: 0, served: 0 }; st.daily.push(row); if (st.daily.length > 7) st.daily.shift(); }
  return row;
}

export function addGold(n: number, income = false) {
  const s = S(); s.gold += n;
  if (income) { s.stats.earned += n; daily().earned += n; }
  store.commit('gold');
}
export function spendGold(n: number): boolean {
  const s = S(); if (s.gold < n) return false;
  s.gold -= n; s.stats.spent += n; store.commit('gold'); return true;
}
export function addGems(n: number) { S().gems += n; store.commit('gems'); }

export function addXp(n: number) {
  const s = S(); s.xp += n;
  while (s.xp >= xpNeed(s.level)) {
    s.xp -= xpNeed(s.level); s.level++;
    const gold = 100 * s.level, gems = s.level % 3 === 0 ? 2 : 1;
    s.gold += gold; s.gems += gems;
    const unlocked = [
      ...DISHES.filter((d) => d.level === s.level).map((d) => 'Món ' + d.name),
      ...Object.values(FURN_BY_ID).filter((f) => f.level === s.level).map((f) => f.name),
      ...EXPANSIONS.filter((e) => e.level === s.level && e.price > 0).map((e) => e.name),
    ];
    sfx('levelup'); bus.emit('levelup', { level: s.level, gold, gems, unlocked });
  }
  store.commit('xp');
}
export function addRep(n: number) { const s = S(); s.rep = Math.max(0, s.rep + n); store.commit('rep'); }

// ---------- kho / mua sắm ----------
export const countPlaced = (type: string) => S().items.filter((i) => i.type === type).length;
export const countFridges = () => S().items.filter((i) => FURN_BY_ID[i.type].role === 'fridge').length;
export const stockCap = () => 40 + 40 * countFridges();

export function buyFurniture(id: string): Result {
  const f = FURN_BY_ID[id]; const s = S();
  if (!f) return fail('Không có món này');
  if (s.level < f.level) return fail(`Cần đạt cấp ${f.level}`);
  if (!spendGold(f.price)) return fail('Không đủ vàng!');
  s.inventory[id] = (s.inventory[id] || 0) + 1;
  if (f.cat === 'table') s.stats.tablesBought++;
  store.commit('inventory');
  return good(`Đã mua ${f.name}`);
}
export function buyStyle(id: string): Result {
  const st = STYLE_BY_ID[id]; const s = S();
  if (s.ownedStyles.includes(id)) return applyStyle(id);
  if (s.level < st.level) return fail(`Cần đạt cấp ${st.level}`);
  if (!spendGold(st.price)) return fail('Không đủ vàng!');
  s.ownedStyles.push(id); store.commit('style'); good(`Đã mua ${st.name}`);
  return applyStyle(id);
}
export function applyStyle(id: string): Result {
  const st = STYLE_BY_ID[id]; const s = S();
  if (!s.ownedStyles.includes(id)) return fail('Chưa sở hữu');
  s[st.cat] = id as never; store.commit('style'); bus.emit('rebuild-room');
  return good(`Đã đổi sang ${st.name}`, 'place');
}
export function placeFromInventory(type: string, x: number, y: number, rot: number) {
  const s = S(); if (!(s.inventory[type] > 0)) return null;
  s.inventory[type]--; if (!s.inventory[type]) delete s.inventory[type];
  const it = { uid: s.nextUid++, type, x, y, rot }; s.items.push(it);
  store.commit('items'); bus.emit('items-changed'); return it;
}
export function removeToInventory(uid: number) {
  const s = S(); const i = s.items.findIndex((x) => x.uid === uid); if (i < 0) return;
  const it = s.items.splice(i, 1)[0]; s.inventory[it.type] = (s.inventory[it.type] || 0) + 1;
  store.commit('items'); bus.emit('items-changed');
}
export function sellItem(uid: number) {
  const s = S(); const i = s.items.findIndex((x) => x.uid === uid); if (i < 0) return;
  const it = s.items.splice(i, 1)[0]; const f = FURN_BY_ID[it.type]; const g = Math.floor(f.price / 2);
  s.gold += g; store.commit('items'); bus.emit('items-changed'); good(`Đã bán ${f.name} (+${g})`, 'coin');
}
export function sellFromInventory(type: string) {
  const s = S(); if (!(s.inventory[type] > 0)) return;
  s.inventory[type]--; if (!s.inventory[type]) delete s.inventory[type];
  const g = Math.floor(FURN_BY_ID[type].price / 2); s.gold += g; store.commit('inventory'); good(`Đã bán (+${g})`, 'coin');
}

// ---------- món ăn / nguyên liệu ----------
export function buyRecipe(id: string): Result {
  const d = DISH_BY_ID[id]; const s = S();
  if (s.ownedDishes.includes(id)) return fail('Đã có công thức');
  if (s.level < d.level) return fail(`Cần đạt cấp ${d.level}`);
  if (!spendGold(d.recipeCost)) return fail('Không đủ vàng!');
  s.ownedDishes.push(id); s.menu.push(id); store.commit('menu');
  return good(`Học xong món ${d.name}! Đã thêm vào thực đơn`);
}
export function toggleMenu(id: string): Result {
  const s = S();
  if (s.menu.includes(id)) {
    if (s.menu.length <= 1) return fail('Thực đơn phải còn ít nhất 1 món');
    s.menu = s.menu.filter((x) => x !== id); sfx('click');
  } else { s.menu.push(id); sfx('click'); }
  store.commit('menu'); return { ok: true, msg: '' };
}
export function buyIngredient(k: Ing, packs = 1): Result {
  const s = S(); const info = ING[k]; const qty = info.pack * packs; const cost = info.unit * qty;
  if (s.stock[k] + qty > stockCap()) return fail('Kho đã đầy! Mua thêm tủ lạnh để tăng sức chứa');
  if (!spendGold(cost)) return fail('Không đủ vàng!');
  s.stock[k] += qty; store.commit('stock'); return good(`+${qty} ${info.name}`, 'coin');
}
export function canCook(dishId: string) {
  const d = DISH_BY_ID[dishId]; const s = S();
  return Object.entries(d.ing).every(([k, n]) => s.stock[k as Ing] >= (n as number));
}
export function consume(dishId: string) {
  const d = DISH_BY_ID[dishId]; const s = S();
  for (const [k, n] of Object.entries(d.ing)) s.stock[k as Ing] -= n as number;
  // tự nhập hàng nếu bật
  if (s.autoRestock) for (const k of Object.keys(ING) as Ing[]) {
    if (s.stock[k] < 6 && s.gold > 150 && s.stock[k] + 10 <= stockCap()) { s.gold -= ING[k].unit * 10; s.stats.spent += ING[k].unit * 10; s.stock[k] += 10; }
  }
  store.commit('stock');
}

// ---------- nhân viên ----------
export const HIRE_COST: Record<StaffRole, number> = { chef: 300, waiter: 200, cashier: 250 };
export const ROLE_NAME: Record<StaffRole, string> = { chef: 'Đầu bếp', waiter: 'Phục vụ', cashier: 'Thu ngân' };
export const MAX_STAFF = 8;
export function hireStaff(role: StaffRole): Result {
  const s = S();
  if (s.staff.length >= MAX_STAFF) return fail('Đã đủ số nhân viên tối đa');
  if (role === 'cashier' && s.staff.some((x) => x.role === 'cashier') && s.level < 6) return fail('Cần cấp 6 để thuê thêm thu ngân');
  if (!spendGold(HIRE_COST[role])) return fail('Không đủ vàng!');
  const used = new Set(s.staff.map((x) => x.name));
  const name = STAFF_NAMES.find((n) => !used.has(n)) || 'Nhân viên ' + s.nextStaffId;
  s.staff.push({ id: s.nextStaffId++, role, name, level: 1, look: s.nextStaffId % 4 });
  store.commit('staff'); bus.emit('staff-changed');
  return good(`Đã thuê ${name}!`);
}
export const staffUpCost = (lv: number) => Math.round(120 * Math.pow(lv, 1.6));
export function upgradeStaff(id: number): Result {
  const s = S(); const m = s.staff.find((x) => x.id === id); if (!m) return fail('?');
  if (m.level >= 10) return fail('Đã đạt cấp tối đa');
  if (!spendGold(staffUpCost(m.level))) return fail('Không đủ vàng!');
  m.level++; store.commit('staff'); return good(`${m.name} lên kỹ năng ${m.level}!`, 'levelup');
}
export function fireStaff(id: number) {
  const s = S(); if (s.staff.length <= 1) return fail('Cần giữ lại ít nhất 1 nhân viên');
  s.staff = s.staff.filter((x) => x.id !== id); store.commit('staff'); bus.emit('staff-changed'); sfx('click'); return { ok: true, msg: '' };
}
export const kitchenUpCost = () => Math.round(400 * Math.pow(S().kitchenLevel, 1.7));
export function upgradeKitchen(): Result {
  const s = S();
  if (s.kitchenLevel >= 8) return fail('Bếp đã tối đa');
  if (s.level < s.kitchenLevel * 2 - 1) return fail(`Cần đạt cấp ${s.kitchenLevel * 2 - 1}`);
  if (!spendGold(kitchenUpCost())) return fail('Không đủ vàng!');
  s.kitchenLevel++; store.commit('kitchen'); return good(`Bếp lên cấp ${s.kitchenLevel}! Nấu nhanh hơn`, 'levelup');
}
export const cookMult = (staffLevel: number) => (1 + 0.12 * (staffLevel - 1)) * (1 + 0.15 * (S().kitchenLevel - 1));
export const walkMult = (staffLevel: number) => 1 + 0.07 * (staffLevel - 1);

// ---------- mở rộng ----------
export function nextExpansion() { return EXPANSIONS[S().expansion + 1]; }
export function expand(): Result {
  const s = S(); const e = nextExpansion();
  if (!e) return fail('Đã mở rộng tối đa');
  if (s.level < e.level) return fail(`Cần đạt cấp ${e.level}`);
  if (!spendGold(e.price)) return fail('Không đủ vàng!');
  s.expansion++; s.gridW = e.w; s.gridH = e.h; s.stats.expansions++;
  store.commit('expand'); bus.emit('rebuild-room'); bus.emit('items-changed');
  return good(`${e.name}: ${e.w}×${e.h} ô!`, 'levelup');
}

// ---------- nhiệm vụ / thành tích ----------
export function metric(m: Metric): number {
  const s = S();
  switch (m) {
    case 'served': return s.stats.served;
    case 'earned': return s.stats.earned;
    case 'burgers': return s.stats.dishCount['burger'] || 0;
    case 'tablesBought': return s.stats.tablesBought;
    case 'kitchenLevel': return s.kitchenLevel;
    case 'decorPlaced': return s.items.filter((i) => { const f = FURN_BY_ID[i.type]; return f.decor >= 2 && (f.cat === 'decor' || f.cat === 'plant' || f.cat === 'light'); }).length;
    case 'staffHired': return s.staff.length;
    case 'level': return s.level;
    case 'angry': return s.stats.angry;
    case 'expansions': return s.stats.expansions;
  }
}
export function claimQuest(id: string): Result {
  const q = QUESTS.find((x) => x.id === id)!; const s = S();
  if (s.claimedQuests.includes(id) || metric(q.metric) < q.target) return fail('Chưa hoàn thành');
  s.claimedQuests.push(id); s.gold += q.gold; s.gems += q.gems || 0; store.commit('quest');
  addXp(q.xp); return good(`+${q.gold} vàng, +${q.xp} XP`, 'coin');
}
export function claimAch(id: string): Result {
  const a = ACHIEVEMENTS.find((x) => x.id === id)!; const s = S();
  if (s.claimedAch.includes(id) || metric(a.metric) < a.target) return fail('Chưa đạt');
  s.claimedAch.push(id); s.gems += a.gems; store.commit('ach'); return good(`+${a.gems} kim cương`, 'levelup');
}
export function questsReady() {
  return QUESTS.filter((q) => !S().claimedQuests.includes(q.id) && metric(q.metric) >= q.target).length;
}

// ---------- điểm trang trí -> hài lòng ----------
export function decorScore() { return S().items.reduce((a, i) => a + FURN_BY_ID[i.type].decor, 0); }

// ---------- bạn bè ----------
export function giftFriend(id: string, gold: number): Result {
  const s = S(); if (s.friendGifts[id] === today()) return fail('Hôm nay đã tặng rồi');
  s.friendGifts[id] = today(); s.gold += gold; s.gems += gold >= 80 ? 1 : 0; store.commit('friend');
  addRep(2); return good(`Bạn đáp lễ +${gold} vàng!`, 'coin');
}
