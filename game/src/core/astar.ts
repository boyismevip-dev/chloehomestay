// A* trên lưới, 8 hướng, không cắt góc qua vật cản.
export interface Cell { x: number; y: number }
export type Walkable = (x: number, y: number) => boolean;

export function findPath(start: Cell, goal: Cell, walkable: Walkable, maxNodes = 4000): Cell[] | null {
  const key = (x: number, y: number) => (x + 64) * 256 + (y + 64);
  if (start.x === goal.x && start.y === goal.y) return [];
  const open: { x: number; y: number; g: number; f: number; p: any }[] = [];
  const best = new Map<number, number>();
  const h = (x: number, y: number) => { const dx = Math.abs(x - goal.x), dy = Math.abs(y - goal.y); return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy); };
  open.push({ x: start.x, y: start.y, g: 0, f: h(start.x, start.y), p: null });
  best.set(key(start.x, start.y), 0);
  let n = 0;
  while (open.length && n++ < maxNodes) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur.x === goal.x && cur.y === goal.y) {
      const out: Cell[] = [];
      for (let c: any = cur; c && c.p; c = c.p) out.push({ x: c.x, y: c.y });
      return out.reverse();
    }
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      const nx = cur.x + dx, ny = cur.y + dy;
      const isGoal = nx === goal.x && ny === goal.y;
      if (!isGoal && !walkable(nx, ny)) continue;
      if (dx && dy) { if (!walkable(cur.x + dx, cur.y) || !walkable(cur.x, cur.y + dy)) continue; }
      const g = cur.g + (dx && dy ? Math.SQRT2 : 1);
      const k = key(nx, ny);
      if (best.has(k) && best.get(k)! <= g) continue;
      best.set(k, g);
      open.push({ x: nx, y: ny, g, f: g + h(nx, ny), p: cur });
    }
  }
  return null;
}
