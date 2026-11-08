// Event bus nhỏ để Phaser (game) và React (UI) nói chuyện với nhau.
type Fn = (payload?: any) => void;
class Bus {
  private m = new Map<string, Set<Fn>>();
  on(ev: string, fn: Fn) { if (!this.m.has(ev)) this.m.set(ev, new Set()); this.m.get(ev)!.add(fn); return () => this.off(ev, fn); }
  off(ev: string, fn: Fn) { this.m.get(ev)?.delete(fn); }
  emit(ev: string, payload?: any) { this.m.get(ev)?.forEach((f) => f(payload)); }
}
export const bus = new Bus();
