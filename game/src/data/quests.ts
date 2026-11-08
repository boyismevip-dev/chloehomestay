export type Metric = 'served' | 'earned' | 'burgers' | 'tablesBought' | 'kitchenLevel' | 'decorPlaced' | 'staffHired' | 'level' | 'angry' | 'expansions';
export interface QuestDef { id: string; title: string; desc: string; metric: Metric; target: number; gold: number; xp: number; gems?: number }
export const QUESTS: QuestDef[] = [
  { id: 'q_serve10', title: 'Phục vụ 10 khách', desc: 'Khách ăn xong và thanh toán thành công.', metric: 'served', target: 10, gold: 150, xp: 40 },
  { id: 'q_burger5', title: 'Bán 5 chiếc hamburger', desc: 'Món bán chạy nhất thập niên.', metric: 'burgers', target: 5, gold: 100, xp: 30 },
  { id: 'q_table', title: 'Mua thêm một chiếc bàn', desc: 'Mở rộng chỗ ngồi cho khách.', metric: 'tablesBought', target: 1, gold: 120, xp: 30 },
  { id: 'q_decor', title: 'Trang trí nhà hàng', desc: 'Có tổng cộng 10 món trang trí (cây, tranh, đèn, loa...).', metric: 'decorPlaced', target: 10, gold: 150, xp: 35 },
  { id: 'q_earn1000', title: 'Kiếm 1.000 vàng', desc: 'Tổng doanh thu từ khách hàng.', metric: 'earned', target: 1000, gold: 300, xp: 80, gems: 2 },
  { id: 'q_kitchen', title: 'Nâng cấp bếp', desc: 'Nâng bếp lên cấp 2 ở bảng STAFF.', metric: 'kitchenLevel', target: 2, gold: 250, xp: 60 },
  { id: 'q_hire', title: 'Thuê thêm nhân viên', desc: 'Có ít nhất 4 nhân viên.', metric: 'staffHired', target: 4, gold: 200, xp: 50 },
  { id: 'q_serve50', title: 'Phục vụ 50 khách', desc: 'Nhà hàng ngày càng đông.', metric: 'served', target: 50, gold: 600, xp: 150, gems: 3 },
  { id: 'q_expand', title: 'Mở rộng nhà hàng', desc: 'Mở rộng diện tích lần đầu.', metric: 'expansions', target: 1, gold: 400, xp: 100, gems: 2 },
  { id: 'q_lvl5', title: 'Đạt cấp 5', desc: 'Chủ quán chăm chỉ.', metric: 'level', target: 5, gold: 500, xp: 100, gems: 3 },
  { id: 'q_earn10k', title: 'Kiếm 10.000 vàng', desc: 'Ông chủ nhỏ.', metric: 'earned', target: 10000, gold: 1500, xp: 300, gems: 5 },
];
export interface AchDef { id: string; title: string; desc: string; metric: Metric; target: number; gems: number }
export const ACHIEVEMENTS: AchDef[] = [
  { id: 'a_serve100', title: 'Đầu bếp quen mặt', desc: 'Phục vụ 100 khách', metric: 'served', target: 100, gems: 5 },
  { id: 'a_serve500', title: 'Quán ruột của phố', desc: 'Phục vụ 500 khách', metric: 'served', target: 500, gems: 15 },
  { id: 'a_earn50k', title: 'Bỏ túi 50.000', desc: 'Kiếm tổng 50.000 vàng', metric: 'earned', target: 50000, gems: 15 },
  { id: 'a_lvl10', title: 'Cấp 10', desc: 'Đạt cấp độ 10', metric: 'level', target: 10, gems: 10 },
  { id: 'a_decor10', title: 'Nghệ sĩ nội thất', desc: 'Đặt 10 món trang trí', metric: 'decorPlaced', target: 10, gems: 5 },
  { id: 'a_staff6', title: 'Đội ngũ hùng hậu', desc: 'Có 6 nhân viên', metric: 'staffHired', target: 6, gems: 8 },
];
