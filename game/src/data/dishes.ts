export type Ing = 'flour' | 'meat' | 'veg' | 'dairy' | 'bean' | 'rice' | 'sugar';
export interface Dish {
  id: string; name: string; price: number; cook: number; ing: Partial<Record<Ing, number>>;
  level: number; recipeCost: number; drink?: boolean;
}
export const ING: Record<Ing, { name: string; unit: number; pack: number; color: string }> = {
  flour: { name: 'Bột mì', unit: 2, pack: 10, color: '#f4e3b5' },
  meat: { name: 'Thịt', unit: 4, pack: 10, color: '#e0645a' },
  veg: { name: 'Rau củ', unit: 2, pack: 10, color: '#5cc45a' },
  dairy: { name: 'Sữa & kem', unit: 3, pack: 10, color: '#f5f5ff' },
  bean: { name: 'Cà phê hạt', unit: 3, pack: 10, color: '#7a4a2a' },
  rice: { name: 'Gạo', unit: 2, pack: 10, color: '#fffbe8' },
  sugar: { name: 'Đường & siro', unit: 2, pack: 10, color: '#ff9ac6' },
};
export const DISHES: Dish[] = [
  { id: 'burger', name: 'Hamburger', price: 30, cook: 6, ing: { flour: 1, meat: 1, veg: 1 }, level: 1, recipeCost: 0 },
  { id: 'rice', name: 'Cơm', price: 28, cook: 5, ing: { rice: 1, meat: 1 }, level: 1, recipeCost: 0 },
  { id: 'soda', name: 'Nước ngọt', price: 14, cook: 3, ing: { sugar: 1 }, level: 1, recipeCost: 0, drink: true },
  { id: 'pizza', name: 'Pizza', price: 58, cook: 9, ing: { flour: 2, dairy: 1, veg: 1 }, level: 2, recipeCost: 150 },
  { id: 'spaghetti', name: 'Mì Ý', price: 52, cook: 8, ing: { flour: 2, meat: 1 }, level: 3, recipeCost: 260 },
  { id: 'coffee', name: 'Cà phê', price: 26, cook: 4, ing: { bean: 1, sugar: 1 }, level: 3, recipeCost: 200, drink: true },
  { id: 'pastry', name: 'Bánh ngọt', price: 32, cook: 5, ing: { flour: 1, sugar: 1 }, level: 4, recipeCost: 320 },
  { id: 'icecream', name: 'Kem', price: 34, cook: 3, ing: { dairy: 1, sugar: 1 }, level: 5, recipeCost: 420 },
  { id: 'cake', name: 'Bánh kem', price: 85, cook: 11, ing: { flour: 1, dairy: 2, sugar: 2 }, level: 6, recipeCost: 700 },
  { id: 'boba', name: 'Trà sữa', price: 42, cook: 5, ing: { dairy: 1, sugar: 1, bean: 1 }, level: 7, recipeCost: 900, drink: true },
];
export const DISH_BY_ID: Record<string, Dish> = Object.fromEntries(DISHES.map((d) => [d.id, d]));
export const dishCost = (d: Dish) => Object.entries(d.ing).reduce((s, [k, n]) => s + ING[k as Ing].unit * (n as number), 0);
