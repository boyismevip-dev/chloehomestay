// Toán học isometric: ô lưới <-> toạ độ màn hình.
export const TW = 64;      // chiều rộng ô hình thoi
export const TH = 32;      // chiều cao ô hình thoi
export const HW = TW / 2;
export const HH = TH / 2;

export interface Pt { x: number; y: number }

/** góc trên của ô (gx, gy) -> màn hình. Hỗ trợ toạ độ lẻ. */
export function gridToScreen(gx: number, gy: number): Pt {
  return { x: (gx - gy) * HW, y: (gx + gy) * HH };
}
/** màn hình -> toạ độ lưới liên tục (gx, gy) */
export function screenToGrid(sx: number, sy: number): Pt {
  return { x: (sx / HW + sy / HH) / 2, y: (sy / HH - sx / HW) / 2 };
}
/** tâm ô */
export function cellCenter(cx: number, cy: number): Pt {
  return gridToScreen(cx + 0.5, cy + 0.5);
}
// hướng: 0 = +y (SW), 1 = -x (NW), 2 = -y (NE), 3 = +x (SE)
export const DIRS: Pt[] = [{ x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }];
