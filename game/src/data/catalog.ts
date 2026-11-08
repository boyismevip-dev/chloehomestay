export type Cat = 'table' | 'chair' | 'kitchen' | 'equip' | 'decor' | 'plant' | 'light' | 'floor' | 'wall' | 'door';
export type Role = 'table' | 'chair' | 'stove' | 'cashier' | 'fridge' | 'drink' | 'vending' | 'bakery' | 'counter' | 'decor';

export interface FurnDef {
  id: string; name: string; cat: Cat; w: number; h: number; price: number; level: number;
  blocks: boolean;            // chặn đường đi
  wall?: boolean;             // treo tường
  role: Role;
  decor: number;              // điểm trang trí
  speed?: number;             // tốc độ nấu (bếp)
  desc: string;
}
const F = (d: FurnDef) => d;

export const FURNITURE: FurnDef[] = [
  F({ id: 'table_sq', name: 'Bàn vuông', cat: 'table', w: 1, h: 1, price: 60, level: 1, blocks: true, role: 'table', decor: 1, desc: 'Bàn ăn cơ bản, đặt ghế sát bên.' }),
  F({ id: 'table_round', name: 'Bàn tròn', cat: 'table', w: 1, h: 1, price: 95, level: 2, blocks: true, role: 'table', decor: 3, desc: 'Bàn tròn xinh xắn.' }),
  F({ id: 'table_long', name: 'Bàn dài', cat: 'table', w: 2, h: 1, price: 140, level: 3, blocks: true, role: 'table', decor: 2, desc: 'Bàn dài cho nhiều ghế.' }),
  F({ id: 'chair_wood', name: 'Ghế gỗ', cat: 'chair', w: 1, h: 1, price: 35, level: 1, blocks: true, role: 'chair', decor: 0, desc: 'Ghế phải đặt cạnh bàn mới có khách ngồi.' }),
  F({ id: 'chair_cushion', name: 'Ghế đệm đỏ', cat: 'chair', w: 1, h: 1, price: 70, level: 2, blocks: true, role: 'chair', decor: 2, desc: 'Ghế đệm êm, khách hài lòng hơn.' }),
  F({ id: 'stool', name: 'Ghế đẩu', cat: 'chair', w: 1, h: 1, price: 25, level: 1, blocks: true, role: 'chair', decor: 0, desc: 'Ghế đẩu nhỏ gọn.' }),
  F({ id: 'stove_gas', name: 'Bếp gas', cat: 'kitchen', w: 1, h: 1, price: 180, level: 1, blocks: true, role: 'stove', speed: 1, decor: 0, desc: 'Một đầu bếp nấu được tại đây.' }),
  F({ id: 'stove_multi', name: 'Bếp 4 họng', cat: 'kitchen', w: 2, h: 1, price: 520, level: 3, blocks: true, role: 'stove', speed: 1.4, decor: 0, desc: 'Nấu nhanh hơn 40%.' }),
  F({ id: 'oven', name: 'Lò nướng', cat: 'kitchen', w: 1, h: 1, price: 380, level: 4, blocks: true, role: 'stove', speed: 1.25, decor: 0, desc: 'Nấu nhanh hơn 25%.' }),
  F({ id: 'prep_counter', name: 'Bàn sơ chế', cat: 'kitchen', w: 1, h: 1, price: 50, level: 1, blocks: true, role: 'counter', decor: 0, desc: 'Mặt bàn inox cho khu bếp.' }),
  F({ id: 'fridge', name: 'Tủ lạnh', cat: 'equip', w: 1, h: 1, price: 220, level: 1, blocks: true, role: 'fridge', decor: 0, desc: 'Tăng sức chứa kho nguyên liệu +40.' }),
  F({ id: 'drink_machine', name: 'Máy pha nước', cat: 'equip', w: 1, h: 1, price: 260, level: 2, blocks: true, role: 'drink', decor: 1, desc: 'Món nước pha nhanh hơn 30%.' }),
  F({ id: 'vending', name: 'Máy bán hàng', cat: 'equip', w: 1, h: 1, price: 320, level: 2, blocks: true, role: 'vending', decor: 1, desc: 'Tự động thu thêm vàng theo thời gian.' }),
  F({ id: 'cashier', name: 'Quầy thu ngân', cat: 'equip', w: 2, h: 1, price: 150, level: 1, blocks: true, role: 'cashier', decor: 1, desc: 'Khách thanh toán tại đây.' }),
  F({ id: 'bakery', name: 'Quầy bánh', cat: 'equip', w: 2, h: 1, price: 240, level: 2, blocks: true, role: 'bakery', decor: 3, desc: 'Khách hay mua thêm bánh khi thanh toán.' }),
  F({ id: 'plant_small', name: 'Chậu cây nhỏ', cat: 'plant', w: 1, h: 1, price: 30, level: 1, blocks: true, role: 'decor', decor: 2, desc: 'Cây cảnh để bàn.' }),
  F({ id: 'plant_big', name: 'Cây cảnh lớn', cat: 'plant', w: 1, h: 1, price: 80, level: 1, blocks: true, role: 'decor', decor: 4, desc: 'Cây xanh tươi mát.' }),
  F({ id: 'plant_flower', name: 'Chậu hoa', cat: 'plant', w: 1, h: 1, price: 55, level: 2, blocks: true, role: 'decor', decor: 3, desc: 'Hoa nhiều màu.' }),
  F({ id: 'speaker', name: 'Loa', cat: 'decor', w: 1, h: 1, price: 120, level: 2, blocks: true, role: 'decor', decor: 4, desc: 'Nhạc vui tai, khách kiên nhẫn hơn.' }),
  F({ id: 'rug', name: 'Thảm đỏ', cat: 'decor', w: 2, h: 1, price: 70, level: 1, blocks: false, role: 'decor', decor: 2, desc: 'Thảm trải sàn, đi lên được.' }),
  F({ id: 'painting', name: 'Tranh treo tường', cat: 'decor', w: 1, h: 1, price: 60, level: 1, blocks: false, wall: true, role: 'decor', decor: 3, desc: 'Kéo sát tường để treo.' }),
  F({ id: 'clock', name: 'Đồng hồ tường', cat: 'decor', w: 1, h: 1, price: 75, level: 2, blocks: false, wall: true, role: 'decor', decor: 3, desc: 'Đồng hồ chạy thật.' }),
  F({ id: 'neon', name: 'Bảng đèn neon', cat: 'decor', w: 1, h: 1, price: 150, level: 4, blocks: false, wall: true, role: 'decor', decor: 5, desc: 'Biển OPEN nhấp nháy.' }),
  F({ id: 'lamp_floor', name: 'Đèn cây', cat: 'light', w: 1, h: 1, price: 65, level: 1, blocks: true, role: 'decor', decor: 3, desc: 'Ánh sáng ấm áp.' }),
  F({ id: 'lamp_table', name: 'Đèn bàn', cat: 'light', w: 1, h: 1, price: 40, level: 1, blocks: true, role: 'decor', decor: 2, desc: 'Đèn bàn nhỏ.' }),
  F({ id: 'lamp_pendant', name: 'Đèn thả trần', cat: 'light', w: 1, h: 1, price: 110, level: 3, blocks: false, wall: true, role: 'decor', decor: 4, desc: 'Đèn treo ở tường.' }),
];

export const FURN_BY_ID: Record<string, FurnDef> = Object.fromEntries(FURNITURE.map((f) => [f.id, f]));

export interface StyleDef { id: string; name: string; cat: 'floor' | 'wall' | 'door'; price: number; level: number; c1: string; c2: string; c3: string; }
export const STYLES: StyleDef[] = [
  { id: 'floor_checker', name: 'Caro vàng trắng', cat: 'floor', price: 0, level: 1, c1: '#ffd84a', c2: '#fff8e1', c3: '#2b2b33' },
  { id: 'floor_wood', name: 'Gỗ sồi', cat: 'floor', price: 120, level: 1, c1: '#d49a5c', c2: '#c4854a', c3: '#8a5a2c' },
  { id: 'floor_blue', name: 'Gạch xanh', cat: 'floor', price: 160, level: 2, c1: '#8fd3ff', c2: '#e6f6ff', c3: '#3b7fb8' },
  { id: 'floor_pink', name: 'Caro hồng', cat: 'floor', price: 200, level: 3, c1: '#ff9ec7', c2: '#fff0f6', c3: '#b94a7d' },
  { id: 'floor_green', name: 'Caro xanh lá', cat: 'floor', price: 240, level: 4, c1: '#7ddc7a', c2: '#f1ffe9', c3: '#2f8a3c' },
  { id: 'floor_dark', name: 'Đá đen trắng', cat: 'floor', price: 300, level: 5, c1: '#3a3a46', c2: '#e9e9ef', c3: '#15151b' },
  { id: 'wall_cream', name: 'Sọc kem cam', cat: 'wall', price: 0, level: 1, c1: '#ffe9b8', c2: '#ffbf5e', c3: '#c9822e' },
  { id: 'wall_brick', name: 'Tường gạch', cat: 'wall', price: 140, level: 1, c1: '#d9694b', c2: '#c4553a', c3: '#8e3a28' },
  { id: 'wall_teal', name: 'Xanh ngọc', cat: 'wall', price: 180, level: 2, c1: '#7fe0d4', c2: '#4fc4b8', c3: '#2a8c82' },
  { id: 'wall_pink', name: 'Hồng chấm bi', cat: 'wall', price: 220, level: 3, c1: '#ffc4dc', c2: '#ff9cc4', c3: '#c8567f' },
  { id: 'wall_wood', name: 'Ván gỗ', cat: 'wall', price: 260, level: 4, c1: '#c89a66', c2: '#b78450', c3: '#7a5230' },
  { id: 'wall_blue', name: 'Xanh biển', cat: 'wall', price: 300, level: 5, c1: '#9cc9ff', c2: '#6fa8f0', c3: '#3a6cb0' },
  { id: 'door_red', name: 'Cửa đỏ', cat: 'door', price: 0, level: 1, c1: '#e8423b', c2: '#b82b26', c3: '#ffd84a' },
  { id: 'door_wood', name: 'Cửa gỗ', cat: 'door', price: 100, level: 1, c1: '#b57a44', c2: '#8b5a2b', c3: '#f3d27a' },
  { id: 'door_blue', name: 'Cửa xanh', cat: 'door', price: 150, level: 3, c1: '#3d8bff', c2: '#2760c4', c3: '#ffffff' },
  { id: 'door_green', name: 'Cửa xanh lá', cat: 'door', price: 180, level: 4, c1: '#3fc27a', c2: '#2a8f58', c3: '#ffe27a' },
];
export const STYLE_BY_ID: Record<string, StyleDef> = Object.fromEntries(STYLES.map((s) => [s.id, s]));

export const CATS: { id: Cat; label: string; icon: string }[] = [
  { id: 'table', label: 'Bàn', icon: 'table_sq' }, { id: 'chair', label: 'Ghế', icon: 'chair_wood' },
  { id: 'kitchen', label: 'Bếp', icon: 'stove_gas' }, { id: 'equip', label: 'Thiết bị', icon: 'fridge' },
  { id: 'decor', label: 'Trang trí', icon: 'painting' }, { id: 'plant', label: 'Cây cảnh', icon: 'plant_big' },
  { id: 'light', label: 'Đèn', icon: 'lamp_floor' }, { id: 'floor', label: 'Sàn', icon: 'floor_checker' },
  { id: 'wall', label: 'Tường', icon: 'wall_cream' }, { id: 'door', label: 'Cửa', icon: 'door_red' },
];

/** Các mức mở rộng nhà hàng */
export interface Expansion { w: number; h: number; level: number; price: number; name: string }
export const EXPANSIONS: Expansion[] = [
  { w: 8, h: 8, level: 1, price: 0, name: 'Nhà hàng nhỏ' },
  { w: 10, h: 8, level: 3, price: 800, name: 'Mở rộng khu phục vụ' },
  { w: 10, h: 10, level: 5, price: 2200, name: 'Mở thêm khu bếp' },
  { w: 12, h: 10, level: 8, price: 5000, name: 'Mở sảnh lớn' },
  { w: 12, h: 12, level: 12, price: 12000, name: 'Nhà hàng cao cấp' },
];
export const DOOR_Y = 4;
