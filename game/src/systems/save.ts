import { GameState, newState, SAVE_VERSION, store } from '../core/state';

// Kho lưu trữ trừu tượng: hôm nay là LocalStorage, sau này thay bằng API server (tài khoản) mà không đổi game.
export interface SaveRepository {
  load(): GameState | null;
  save(s: GameState): void;
  clear(): void;
}
const KEY = 'nhahang-vuive-save-v1';

export class LocalStorageRepository implements SaveRepository {
  load(): GameState | null {
    try { const raw = localStorage.getItem(KEY); return raw ? migrate(JSON.parse(raw)) : null; } catch { return null; }
  }
  save(s: GameState) { try { s.savedAt = Date.now(); localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* đầy bộ nhớ */ } }
  clear() { try { localStorage.removeItem(KEY); } catch { /* */ } }
}

export let repo: SaveRepository = new LocalStorageRepository();
export const setRepository = (r: SaveRepository) => { repo = r; };

/** Gộp dữ liệu cũ với mặc định để không vỡ khi thêm trường mới. */
export function migrate(raw: any): GameState {
  const base = newState();
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.items)) throw new Error('Dữ liệu không hợp lệ');
  const s: GameState = { ...base, ...raw, stats: { ...base.stats, ...(raw.stats || {}) }, settings: { ...base.settings, ...(raw.settings || {}) }, stock: { ...base.stock, ...(raw.stock || {}) } };
  s.v = SAVE_VERSION;
  return s;
}

export function saveNow() { repo.save(store.state); }
export function loadGame(): boolean {
  const s = repo.load();
  if (s) { store.state = s; return true; }
  return false;
}
export function resetGame() { repo.clear(); store.replace(newState()); saveNow(); }

export function exportSave(): string { return JSON.stringify({ ...store.state, savedAt: Date.now() }); }
export function importSave(text: string) {
  const s = migrate(JSON.parse(text));
  store.replace(s); saveNow();
}

let timer: any;
export function startAutosave() {
  clearInterval(timer);
  timer = setInterval(saveNow, 8000);
  window.addEventListener('beforeunload', saveNow);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
}
